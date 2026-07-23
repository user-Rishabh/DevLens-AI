import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Navigation,
  Clock,
  GitBranch,
  Network,
  GitCommit,
  Database,
  Cpu,
  Search,
  Zap,
  RefreshCw
} from 'lucide-react';

// ── Stage definitions ───────────────────────────────────────────────────────

export type Stage =
  | 'cloning'
  | 'parsing'
  | 'git_mining'
  | 'saving'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'done';

interface StageInfo {
  id: Stage;
  label: string;
  description: string;
  icon: React.ReactNode;
  nodeColor: string;      // Tailwind bg class for the growing graph node
  accentColor: string;    // CSS hex for glow
}

const STAGES: StageInfo[] = [
  {
    id: 'cloning',
    label: 'Cloning repository...',
    description: 'Fetching source files with 100-commit history depth.',
    icon: <GitBranch className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#6D5EF5]',
    accentColor: '#6D5EF5',
  },
  {
    id: 'parsing',
    label: 'Parsing file structure...',
    description: 'Resolving import statements across Python, TS, and JS.',
    icon: <Network className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#3ED9C7]',
    accentColor: '#3ED9C7',
  },
  {
    id: 'git_mining',
    label: 'Mining git history...',
    description: 'Extracting commit frequency and co-change churn signals.',
    icon: <GitCommit className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#F5A623]',
    accentColor: '#F5A623',
  },
  {
    id: 'saving',
    label: 'Persisting to database...',
    description: 'Writing file contents, dependency graph, and hotspots.',
    icon: <Database className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#8B7FFF]',
    accentColor: '#8B7FFF',
  },
  {
    id: 'chunking',
    label: 'Chunking source files...',
    description: 'AST-aware tree-sitter code chunking into semantic blocks.',
    icon: <Cpu className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#3ED9C7]',
    accentColor: '#3ED9C7',
  },
  {
    id: 'embedding',
    label: 'Generating embeddings...',
    description: 'Encoding chunk semantics with sentence-transformer vectors.',
    icon: <Zap className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#6D5EF5]',
    accentColor: '#6D5EF5',
  },
  {
    id: 'indexing',
    label: 'Indexing for search...',
    description: 'Writing vectors and keyword index to pgvector.',
    icon: <Search className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#3ED9C7]',
    accentColor: '#3ED9C7',
  },
];

const STAGE_ORDER: Stage[] = [
  'cloning', 'parsing', 'git_mining', 'saving', 'chunking', 'embedding', 'indexing', 'done'
];

function getStageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

// ── Graph node layout: pre-defined positions for a growing dependency graph ─

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  revealAtStageIndex: number; // The stage at which this node appears
}

interface GraphEdge {
  from: string;
  to: string;
  revealAtStageIndex: number;
}

const GRAPH_NODES: GraphNode[] = [
  { id: 'n0', x: 200, y: 200, label: 'main.py',         revealAtStageIndex: 0 },
  { id: 'n1', x: 400, y: 120, label: 'routes.py',       revealAtStageIndex: 1 },
  { id: 'n2', x: 390, y: 290, label: 'db.py',           revealAtStageIndex: 1 },
  { id: 'n3', x: 560, y: 70,  label: 'auth.py',         revealAtStageIndex: 2 },
  { id: 'n4', x: 580, y: 200, label: 'chunker.py',      revealAtStageIndex: 2 },
  { id: 'n5', x: 560, y: 340, label: 'hotspots.py',     revealAtStageIndex: 3 },
  { id: 'n6', x: 720, y: 120, label: 'embeddings.py',   revealAtStageIndex: 4 },
  { id: 'n7', x: 720, y: 280, label: 'blast_radius.py', revealAtStageIndex: 5 },
  { id: 'n8', x: 860, y: 200, label: 'App.tsx',         revealAtStageIndex: 6 },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: 'n0', to: 'n1', revealAtStageIndex: 1 },
  { from: 'n0', to: 'n2', revealAtStageIndex: 1 },
  { from: 'n1', to: 'n3', revealAtStageIndex: 2 },
  { from: 'n1', to: 'n4', revealAtStageIndex: 2 },
  { from: 'n2', to: 'n5', revealAtStageIndex: 3 },
  { from: 'n4', to: 'n6', revealAtStageIndex: 4 },
  { from: 'n4', to: 'n7', revealAtStageIndex: 5 },
  { from: 'n6', to: 'n8', revealAtStageIndex: 6 },
  { from: 'n7', to: 'n8', revealAtStageIndex: 6 },
];

// ── Main Component ───────────────────────────────────────────────────────────

interface LoadingScreenProps {
  repoUrl: string;
  repoId: string | null;
  onRetry: () => void;
  /** Called when done === true and the completion animation has finished */
  onComplete: () => void;
}

export default function LoadingScreen({ repoUrl, repoId, onRetry, onComplete }: LoadingScreenProps) {
  const [currentStage, setCurrentStage] = useState<Stage>('cloning');
  const [completedStages, setCompletedStages] = useState<Set<Stage>>(new Set());
  const [failedStage, setFailedStage] = useState<Stage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);
  const [completing, setCompleting] = useState(false); // brief "settling" animation
  const [stageStartTime, setStageStartTime] = useState(Date.now());

  const startTimeRef = useRef(Date.now());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // ── Elapsed time counter ─────────────────────────────────────────────────
  useEffect(() => {
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, []);

  // ── Long-wait reassurance message: shows after 25s on same stage ─────────
  useEffect(() => {
    if (longWaitTimeoutRef.current) clearTimeout(longWaitTimeoutRef.current);
    setShowLongWaitMessage(false);
    if (failedStage || completing) return;
    longWaitTimeoutRef.current = setTimeout(() => setShowLongWaitMessage(true), 25_000);
    return () => {
      if (longWaitTimeoutRef.current) clearTimeout(longWaitTimeoutRef.current);
    };
  }, [currentStage, failedStage, completing]);

  // ── Poll /api/repos/{id}/status once we have a repoId ────────────────────
  useEffect(() => {
    if (!repoId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/repos/${repoId}/status`);
        if (!res.ok) return;
        const data: { stage: string; error: string | null } = await res.json();

        const stage = data.stage as Stage;

        if (data.error) {
          // Failure
          setFailedStage(stage === 'done' ? currentStage : stage);
          setErrorMessage(data.error);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        if (stage === 'done') {
          // Mark all stages complete
          setCompletedStages(new Set(STAGE_ORDER.slice(0, -1) as Stage[]));
          setCurrentStage('done');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          // Brief settling animation before navigating
          setCompleting(true);
          setTimeout(() => onComplete(), 900);
          return;
        }

        // Update completed stages (everything before current)
        const stageIdx = getStageIndex(stage);
        const prevCompleted = new Set<Stage>();
        for (let i = 0; i < stageIdx; i++) {
          prevCompleted.add(STAGE_ORDER[i]);
        }
        setCompletedStages(prevCompleted);
        if (stage !== currentStage) {
          setCurrentStage(stage);
          setStageStartTime(Date.now());
        }
      } catch {
        // Network hiccup — keep polling
      }
    };

    poll(); // immediate first poll
    pollIntervalRef.current = setInterval(poll, 1500);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [repoId]);

  // ── Derived values ────────────────────────────────────────────────────────
  const currentStageIdx = getStageIndex(currentStage);
  const currentStageInfo = STAGES.find(s => s.id === currentStage);

  // Visible graph nodes/edges (those whose revealAtStageIndex <= currentStageIdx)
  const visibleNodes = GRAPH_NODES.filter(n => n.revealAtStageIndex <= currentStageIdx);
  const visibleEdges = GRAPH_EDGES.filter(e => e.revealAtStageIndex <= currentStageIdx);

  const nodeById = Object.fromEntries(GRAPH_NODES.map(n => [n.id, n]));

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s elapsed`;
    return `${Math.floor(s / 60)}m ${s % 60}s elapsed`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#0B0D12] text-[#E8E9ED] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#6D5EF5]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-[#3ED9C7]/5 blur-[100px] pointer-events-none" />

      {/* Header Brand */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="p-2.5 bg-[#6D5EF5]/10 border border-[#6D5EF5]/30 rounded-xl text-[#3ED9C7] flex items-center justify-center">
          <Navigation className="w-5 h-5 fill-[#3ED9C7]/20" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            DevLens <span className="text-[#3ED9C7]">AI</span>
          </span>
          <p className="text-[10px] text-[#8A8F9C]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            Calculating route...
          </p>
        </div>
      </div>

      {/* Elapsed time — top right */}
      <div className="absolute top-6 right-6 flex items-center gap-1.5 text-[11px] text-[#8A8F9C]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        <Clock className="w-3.5 h-3.5" />
        {formatTime(elapsedSeconds)}
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

        {/* ── LEFT: Animated Growing Dependency Graph ─────────────────────── */}
        <div className="relative flex-shrink-0" style={{ width: 460, height: 360 }}>
          <svg
            width="460"
            height="360"
            viewBox="100 40 820 360"
            className="w-full h-full"
          >
            {/* Dim background grid dots */}
            <defs>
              <radialGradient id="nodeGlowPurple" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6D5EF5" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6D5EF5" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlowTeal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3ED9C7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3ED9C7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlowAmber" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5A623" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ghost nodes (not yet revealed) */}
            {GRAPH_NODES.filter(n => n.revealAtStageIndex > currentStageIdx).map(n => (
              <circle
                key={`ghost-${n.id}`}
                cx={n.x}
                cy={n.y}
                r={5}
                fill="#1F2330"
                opacity={0.4}
              />
            ))}

            {/* Revealed edges */}
            {visibleEdges.map(edge => {
              const from = nodeById[edge.from];
              const to = nodeById[edge.to];
              if (!from || !to) return null;
              const isNew = edge.revealAtStageIndex === currentStageIdx;
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isNew ? '#3ED9C7' : '#1F2330'}
                  strokeWidth={isNew ? 2 : 1.2}
                  strokeOpacity={isNew ? 0.9 : 0.6}
                  strokeDasharray={isNew ? '6 3' : undefined}
                  className={isNew ? 'animate-pulse' : ''}
                  filter={isNew ? 'url(#glow)' : undefined}
                />
              );
            })}

            {/* Ghost edges */}
            {GRAPH_EDGES.filter(e => e.revealAtStageIndex > currentStageIdx).map(edge => {
              const from = nodeById[edge.from];
              const to = nodeById[edge.to];
              if (!from || !to) return null;
              return (
                <line
                  key={`ghost-e-${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#1F2330"
                  strokeWidth={1}
                  strokeOpacity={0.25}
                  strokeDasharray="4 5"
                />
              );
            })}

            {/* Revealed nodes */}
            {visibleNodes.map(node => {
              const isNew = node.revealAtStageIndex === currentStageIdx;
              const isDone = completedStages.size === STAGES.length && !failedStage;
              const nodeColor =
                isNew ? (currentStageInfo?.accentColor ?? '#6D5EF5') : '#2A2D3D';
              const strokeColor = isNew
                ? (currentStageInfo?.accentColor ?? '#6D5EF5')
                : '#3D4159';

              return (
                <g key={node.id}>
                  {/* Glow ring for new nodes */}
                  {isNew && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={16}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth={1}
                      strokeOpacity={0.4}
                      className="animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isNew ? 8 : 6}
                    fill={nodeColor}
                    stroke={strokeColor}
                    strokeWidth={isNew ? 2 : 1.5}
                    filter={isNew ? 'url(#glow)' : undefined}
                    opacity={completing && isDone ? 1 : 1}
                  />
                  <text
                    x={node.x}
                    y={node.y - 14}
                    textAnchor="middle"
                    fill={isNew ? '#E8E9ED' : '#8A8F9C'}
                    fontSize={9}
                    fontFamily='"JetBrains Mono", monospace'
                    opacity={isNew ? 1 : 0.7}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Completion overlay: draw final connecting path */}
            {completing && (
              <path
                d="M 200 200 Q 300 160 400 120 T 720 120 T 860 200"
                fill="none"
                stroke="#3ED9C7"
                strokeWidth={3}
                strokeDasharray="800"
                strokeDashoffset="0"
                strokeLinecap="round"
                opacity={0.9}
                filter="url(#glow)"
                style={{
                  animation: 'routeDraw 0.8s ease-out forwards',
                }}
              />
            )}
          </svg>

          {/* Graph label */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <span
              className="text-[10px] text-[#8A8F9C] px-3 py-1 bg-[#12151D]/80 rounded-full border border-[#1F2330]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {completing
                ? '✓ route calculated — dependency graph complete'
                : failedStage
                  ? '⚠ graph construction interrupted'
                  : `building graph — ${visibleNodes.length} / ${GRAPH_NODES.length} nodes mapped`}
            </span>
          </div>
        </div>

        {/* ── RIGHT: Stage List + Status Text ─────────────────────────────── */}
        <div className="flex flex-col gap-4 w-full max-w-sm">

          {/* Repo being analyzed */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#12151D] border border-[#1F2330] rounded-xl text-[11px] text-[#8A8F9C] mb-1"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            <GitBranch className="w-3.5 h-3.5 text-[#6D5EF5] shrink-0" />
            <span className="truncate">{repoUrl}</span>
          </div>

          {/* Stage checklist */}
          <div className="flex flex-col gap-2">
            {STAGES.map((stage) => {
              const isDone = completedStages.has(stage.id);
              const isCurrent = currentStage === stage.id && !failedStage;
              const isFailed = failedStage === stage.id;
              const isPending = !isDone && !isCurrent && !isFailed;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-500 ${
                    isCurrent
                      ? 'bg-[#12151D] border-[#1F2330] border-l-2'
                      : isDone
                        ? 'bg-[#0F1118] border-[#1F2330]/50'
                        : isFailed
                          ? 'bg-red-950/20 border-red-500/20'
                          : 'bg-transparent border-transparent opacity-40'
                  }`}
                  style={isCurrent ? { borderLeftColor: stage.accentColor } : undefined}
                >
                  {/* Icon / status indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[#8A8F9C] transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                          ? 'text-white border'
                          : isFailed
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-[#1F2330]/50 border border-[#1F2330]'
                    }`}
                    style={isCurrent ? { borderColor: stage.accentColor, backgroundColor: `${stage.accentColor}18`, color: stage.accentColor } : undefined}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFailed ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      stage.icon
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-medium truncate ${
                        isDone ? 'text-[#8A8F9C]' :
                        isCurrent ? 'text-[#E8E9ED]' :
                        isFailed ? 'text-red-400' :
                        'text-[#8A8F9C]'
                      }`}
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {isFailed ? `Failed: ${stage.label}` : stage.label}
                    </div>
                    {isCurrent && (
                      <div className="text-[10px] text-[#8A8F9C] mt-0.5 truncate">{stage.description}</div>
                    )}
                    {isFailed && errorMessage && (
                      <div className="text-[10px] text-red-400/80 mt-0.5 line-clamp-2">{errorMessage}</div>
                    )}
                  </div>

                  {/* Completed checkmark glow dot */}
                  {isDone && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Long-wait reassurance message */}
          {showLongWaitMessage && !failedStage && !completing && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#6D5EF5]/10 border border-[#6D5EF5]/25 text-xs text-[#8B7FFF]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Larger repositories take longer — still working.</span>
            </div>
          )}

          {/* Error: failed state with Try Again button */}
          {failedStage && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex gap-3 items-start">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-300 font-semibold text-sm">Analysis failed</h4>
                  <p className="text-red-400/80 text-[11px] mt-1 leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {errorMessage || 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#6D5EF5] hover:bg-[#8B7FFF] text-white text-sm font-medium transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#6D5EF5]/25"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 text-[#8A8F9C] hover:text-[#E8E9ED] text-xs transition-colors cursor-pointer"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to landing page
              </button>
            </div>
          )}

          {/* Completion state */}
          {completing && (
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Route calculated — navigating to dashboard...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
