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
import { API_BASE_URL } from '../lib/apiClient';

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
  accentColor: string;    // CSS hex for glow/border
}

const STAGES: StageInfo[] = [
  {
    id: 'cloning',
    label: 'Cloning repository...',
    description: 'Fetching source files with 100-commit history depth.',
    icon: <GitBranch className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#E85D2C]',
    accentColor: '#E85D2C',
  },
  {
    id: 'parsing',
    label: 'Parsing file structure...',
    description: 'Resolving import statements across Python, TS, and JS.',
    icon: <Network className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#E85D2C]',
    accentColor: '#E85D2C',
  },
  {
    id: 'git_mining',
    label: 'Mining git history...',
    description: 'Extracting commit frequency and co-change churn signals.',
    icon: <GitCommit className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#F59E0B]',
    accentColor: '#F59E0B',
  },
  {
    id: 'saving',
    label: 'Persisting to database...',
    description: 'Writing file contents, dependency graph, and hotspots.',
    icon: <Database className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#3B5FE0]',
    accentColor: '#3B5FE0',
  },
  {
    id: 'chunking',
    label: 'Chunking source files...',
    description: 'AST-aware tree-sitter code chunking into semantic blocks.',
    icon: <Cpu className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#E85D2C]',
    accentColor: '#E85D2C',
  },
  {
    id: 'embedding',
    label: 'Generating embeddings...',
    description: 'Encoding chunk semantics with sentence-transformer vectors.',
    icon: <Zap className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#3B5FE0]',
    accentColor: '#3B5FE0',
  },
  {
    id: 'indexing',
    label: 'Indexing for search...',
    description: 'Writing vectors and keyword index to pgvector.',
    icon: <Search className="w-3.5 h-3.5" />,
    nodeColor: 'bg-[#E85D2C]',
    accentColor: '#E85D2C',
  },
];

const STAGE_ORDER: Stage[] = [
  'cloning', 'parsing', 'git_mining', 'saving', 'chunking', 'embedding', 'indexing', 'done'
];

function getStageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

// ── Graph node layout: 9 nodes forming an organic dependency graph ──────────

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  nodeIndex: number; // 0 to 8
}

interface GraphEdge {
  from: string;
  to: string;
  targetNodeIndex: number; // revealed when visibleNodeCount > targetNodeIndex
}

const GRAPH_NODES: GraphNode[] = [
  { id: 'n0', x: 210, y: 195, label: 'main.py',         nodeIndex: 0 },
  { id: 'n1', x: 340, y: 125, label: 'routes.py',       nodeIndex: 1 },
  { id: 'n2', x: 330, y: 275, label: 'db.py',           nodeIndex: 2 },
  { id: 'n3', x: 490, y: 95,  label: 'auth.py',         nodeIndex: 3 },
  { id: 'n4', x: 510, y: 205, label: 'chunker.py',      nodeIndex: 4 },
  { id: 'n5', x: 480, y: 315, label: 'hotspots.py',     nodeIndex: 5 },
  { id: 'n6', x: 670, y: 130, label: 'embeddings.py',   nodeIndex: 6 },
  { id: 'n7', x: 660, y: 280, label: 'blast_radius.py', nodeIndex: 7 },
  { id: 'n8', x: 810, y: 200, label: 'App.tsx',         nodeIndex: 8 },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: 'n0', to: 'n1', targetNodeIndex: 1 },
  { from: 'n0', to: 'n2', targetNodeIndex: 2 },
  { from: 'n1', to: 'n3', targetNodeIndex: 3 },
  { from: 'n1', to: 'n4', targetNodeIndex: 4 },
  { from: 'n2', to: 'n5', targetNodeIndex: 5 },
  { from: 'n4', to: 'n6', targetNodeIndex: 6 },
  { from: 'n4', to: 'n7', targetNodeIndex: 7 },
  { from: 'n6', to: 'n8', targetNodeIndex: 8 },
  { from: 'n7', to: 'n8', targetNodeIndex: 8 },
];

// Target number of mapped nodes corresponding to each real pipeline stage
const STAGE_NODE_TARGETS: Record<Stage, number> = {
  cloning: 1,
  parsing: 3,
  git_mining: 5,
  saving: 6,
  chunking: 7,
  embedding: 8,
  indexing: 9,
  done: 9,
};

// ── Main Component ───────────────────────────────────────────────────────────

interface LoadingScreenProps {
  repoUrl: string;
  repoId: string | null;
  isDataReady?: boolean;
  onRetry: () => void;
  /** Called when done === true and the completion animation has finished */
  onComplete: () => void;
}

export default function LoadingScreen({
  repoUrl,
  repoId,
  isDataReady = true,
  onRetry,
  onComplete,
}: LoadingScreenProps) {
  const [currentStage, setCurrentStage] = useState<Stage>('cloning');
  const [completedStages, setCompletedStages] = useState<Set<Stage>>(new Set());
  const [failedStage, setFailedStage] = useState<Stage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);
  const [completing, setCompleting] = useState(false); // brief "settling" animation
  const [, setStageStartTime] = useState(Date.now());
  const [visibleNodeCount, setVisibleNodeCount] = useState(1);

  const startTimeRef = useRef(Date.now());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const hasTriggeredCompleteRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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

  // ── Progressive Graph Building (Tied to real pipeline stage progression) ──
  const targetNodeCount = STAGE_NODE_TARGETS[currentStage] ?? 1;

  useEffect(() => {
    if (failedStage) return;

    if (visibleNodeCount < targetNodeCount) {
      const stepTimer = setTimeout(() => {
        setVisibleNodeCount(prev => Math.min(prev + 1, targetNodeCount));
      }, 180);
      return () => clearTimeout(stepTimer);
    }
  }, [visibleNodeCount, targetNodeCount, failedStage]);

  // When pipeline reaches 'done', ensure all 9 nodes and connections finish building before navigating
  useEffect(() => {
    if (currentStage === 'done' && isDataReady && !failedStage) {
      if (visibleNodeCount < 9) {
        const stepTimer = setTimeout(() => {
          setVisibleNodeCount(prev => Math.min(prev + 1, 9));
        }, 140);
        return () => clearTimeout(stepTimer);
      } else if (!hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        setCompleting(true);
        const navTimer = setTimeout(() => {
          onCompleteRef.current();
        }, 900);
        return () => clearTimeout(navTimer);
      }
    }
  }, [currentStage, visibleNodeCount, failedStage, isDataReady]);

  // ── Poll /api/repos/{id}/status once we have a repoId ────────────────────
  useEffect(() => {
    if (!repoId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/repos/${repoId}/status`);
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
          return;
        }

        // Update completed stages (everything before current)
        const stageIdx = getStageIndex(stage);
        if (stageIdx >= 0) {
          const prevCompleted = new Set<Stage>();
          for (let i = 0; i < stageIdx; i++) {
            prevCompleted.add(STAGE_ORDER[i]);
          }
          setCompletedStages(prevCompleted);
          if (stage !== currentStage) {
            setCurrentStage(stage);
            setStageStartTime(Date.now());
          }
        }
      } catch {
        // Network hiccup — keep polling
      }
    };

    poll(); // immediate first poll
    pollIntervalRef.current = setInterval(poll, 1000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [repoId, currentStage]);

  // ── Derived values ────────────────────────────────────────────────────────
  const currentStageInfo = STAGES.find(s => s.id === currentStage);

  // Visible graph nodes & edges (progressively revealed one by one up to visibleNodeCount)
  const visibleNodes = GRAPH_NODES.slice(0, visibleNodeCount);
  const visibleEdges = GRAPH_EDGES.filter(e => e.targetNodeIndex < visibleNodeCount);
  const ghostNodes = GRAPH_NODES.slice(visibleNodeCount);
  const ghostEdges = GRAPH_EDGES.filter(e => e.targetNodeIndex >= visibleNodeCount);

  const nodeById = Object.fromEntries(GRAPH_NODES.map(n => [n.id, n]));

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s elapsed`;
    return `${Math.floor(s / 60)}m ${s % 60}s elapsed`;
  };

  // Rail progress calculation (percentage based on completed stages out of total 7)
  const railProgressPercent =
    completedStages.size === 0
      ? 0
      : Math.min(100, (completedStages.size / (STAGES.length - 1)) * 100);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#FAFAF7] text-[#1A1D29] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      {/* Background ambient warm tint */}
      <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full bg-[#E85D2C]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-[#3B5FE0]/5 blur-[100px] pointer-events-none" />

      {/* Header Brand */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="p-2.5 bg-[#FFF4EE] border border-[#E85D2C]/30 rounded-xl text-[#E85D2C] flex items-center justify-center shadow-xs">
          <Navigation className="w-5 h-5 fill-[#E85D2C]/20" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-[#1A1D29]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            DevLens <span className="text-[#E85D2C]">AI</span>
          </span>
          <p className="text-[11px] text-[#6B7280]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            Calculating route...
          </p>
        </div>
      </div>

      {/* Elapsed time — top right */}
      <div className="absolute top-6 right-6 flex items-center gap-2 text-xs text-[#6B7280] bg-white border border-[#E5E1DA] px-3 py-1.5 rounded-full shadow-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        <Clock className="w-3.5 h-3.5 text-[#E85D2C]" />
        <span>{formatTime(elapsedSeconds)}</span>
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14 mt-12 lg:mt-0">

        {/* ── LEFT: Animated Growing Dependency Graph (Topographic Light Aesthetic) ─────────────────────── */}
        <div className="relative flex-shrink-0 w-full max-w-[500px] bg-white/95 border border-[#E5E1DA] rounded-3xl p-5 shadow-sm">
          <div className="relative w-full aspect-[4/3] flex items-center justify-center">
            <svg
              viewBox="100 40 820 360"
              className={`w-full h-full ${completing ? 'animate-graph-settle' : ''}`}
            >
              <defs>
                {/* Subtle dot pattern matching landing page hero */}
                <pattern id="topoDotPattern" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="14" cy="14" r="1.2" fill="#E5E1DA" />
                </pattern>

                {/* Soft orange glow for active edges & markers */}
                <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Topographic background contour lines */}
              <g opacity="0.65" pointerEvents="none">
                <path d="M 80 120 Q 280 60 520 130 T 920 90" fill="none" stroke="#F0EDE6" strokeWidth="1.5" />
                <path d="M 80 200 Q 320 270 560 190 T 920 240" fill="none" stroke="#F0EDE6" strokeWidth="1.5" />
                <path d="M 80 290 Q 300 350 540 280 T 920 310" fill="none" stroke="#F0EDE6" strokeWidth="1.5" />
                <path d="M 120 70 Q 360 110 600 70 T 900 130" fill="none" stroke="#F5F3EE" strokeWidth="1" />
                <path d="M 100 340 Q 340 310 620 350 T 900 290" fill="none" stroke="#F5F3EE" strokeWidth="1" />
              </g>

              {/* Background dot grid pattern */}
              <rect x="100" y="40" width="820" height="360" fill="url(#topoDotPattern)" opacity="0.8" />

              {/* Ghost edges (future dependencies) */}
              {ghostEdges.map(edge => {
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
                    stroke="#E5E1DA"
                    strokeWidth={1.2}
                    strokeOpacity={0.5}
                    strokeDasharray="4 6"
                  />
                );
              })}

              {/* Ghost nodes (not yet revealed) */}
              {ghostNodes.map(n => (
                <circle
                  key={`ghost-${n.id}`}
                  cx={n.x}
                  cy={n.y}
                  r={5}
                  fill="#F4F4F0"
                  stroke="#E5E1DA"
                  strokeWidth={1.2}
                  opacity={0.65}
                />
              ))}

              {/* Revealed edges (animated stroke draw as each new node connects) */}
              {visibleEdges.map(edge => {
                const from = nodeById[edge.from];
                const to = nodeById[edge.to];
                if (!from || !to) return null;
                // Newly added edge connects the latest node
                const isNew = edge.targetNodeIndex === visibleNodeCount - 1;
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#E85D2C"
                    strokeWidth={isNew ? 2.5 : 1.8}
                    strokeOpacity={isNew ? 1 : 0.65}
                    className={isNew ? 'animate-edge-draw' : ''}
                    filter={isNew ? 'url(#orangeGlow)' : undefined}
                  />
                );
              })}

              {/* Revealed nodes (animated pop-in as each node is mapped) */}
              {visibleNodes.map(node => {
                const isNew = node.nodeIndex === visibleNodeCount - 1;
                const isDone = visibleNodeCount === GRAPH_NODES.length && !failedStage;

                return (
                  <g
                    key={node.id}
                    className={`${isNew ? 'animate-node-pop' : ''} ${completing && isDone ? 'animate-graph-settle' : ''}`}
                  >
                    {/* Pulsing beacon ring for newly added nodes */}
                    {isNew && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={16}
                        fill="none"
                        stroke="#E85D2C"
                        strokeWidth={1.5}
                        strokeOpacity={0.4}
                        className="animate-ping"
                        style={{ animationDuration: '2.4s' }}
                      />
                    )}

                    {/* Outer pin ring */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isNew ? 8.5 : 7}
                      fill="#FFFFFF"
                      stroke={isNew ? (currentStageInfo?.accentColor ?? '#E85D2C') : '#E85D2C'}
                      strokeWidth={isNew ? 2.5 : 1.8}
                      strokeOpacity={isNew ? 1 : 0.85}
                      filter={isNew ? 'url(#orangeGlow)' : undefined}
                    />

                    {/* Inner solid node core */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isNew ? 4 : 3}
                      fill={isNew ? (currentStageInfo?.accentColor ?? '#E85D2C') : '#E85D2C'}
                      opacity={isNew ? 1 : 0.8}
                    />

                    {/* Node label */}
                    <text
                      x={node.x}
                      y={node.y - 13}
                      textAnchor="middle"
                      fill={isNew ? '#1A1D29' : '#6B7280'}
                      fontWeight={isNew ? '700' : '500'}
                      fontSize={10}
                      fontFamily='"JetBrains Mono", monospace'
                      opacity={isNew ? 1 : 0.85}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}

              {/* Completion overlay: final route path calculation */}
              {completing && (
                <path
                  d="M 210 195 Q 340 125 510 205 T 670 130 T 810 200"
                  fill="none"
                  stroke="#E85D2C"
                  strokeWidth={3}
                  strokeDasharray="800"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  opacity={0.9}
                  filter="url(#orangeGlow)"
                  style={{
                    animation: 'routeDraw 0.8s ease-out forwards',
                  }}
                />
              )}
            </svg>
          </div>

          {/* Graph status caption */}
          <div className="mt-3 flex justify-center">
            <span
              className="text-[11px] text-[#6B7280] px-3.5 py-1.5 bg-[#FAFAF7] rounded-full border border-[#E5E1DA] shadow-2xs inline-flex items-center gap-2"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {completing ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[#1A1D29] font-medium">Route calculated — dependency graph complete</span>
                </>
              ) : failedStage ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-600 font-medium">Graph construction interrupted</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#E85D2C] animate-pulse" />
                  <span>Building graph — {visibleNodeCount} / {GRAPH_NODES.length} nodes mapped</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* ── RIGHT: Stage List with Progress Rail + Status Text ─────────────────────────────── */}
        <div className="flex flex-col gap-4 w-full max-w-md">

          {/* Repo being analyzed badge */}
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-2xl text-xs text-[#4B5563] shadow-xs"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            <GitBranch className="w-4 h-4 text-[#E85D2C] shrink-0" />
            <span className="truncate font-medium">{repoUrl}</span>
          </div>

          {/* Stage checklist with vertical progress rail & staggered entrance */}
          <div className="relative flex flex-col gap-2.5">
            {/* Background vertical progress rail */}
            <div
              className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#E5E1DA] pointer-events-none rounded-full"
              aria-hidden="true"
            >
              {/* Dynamic filled rail */}
              <div
                className="w-full bg-[#E85D2C] rounded-full transition-all duration-500 ease-out"
                style={{ height: `${railProgressPercent}%` }}
              />
            </div>

            {STAGES.map((stage, index) => {
              const isDone = completedStages.has(stage.id);
              const isCurrent = currentStage === stage.id && !failedStage;
              const isFailed = failedStage === stage.id;

              return (
                <div
                  key={stage.id}
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                  className={`animate-stage-stagger relative flex items-center gap-3.5 px-3 py-2.5 rounded-2xl border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-white border-[#E85D2C]/40 shadow-xs ring-2 ring-[#E85D2C]/10'
                      : isDone
                        ? 'bg-white/70 border-[#E5E1DA]'
                        : isFailed
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-white/30 border-[#E5E1DA]/40 opacity-55'
                  }`}
                >
                  {/* Icon / status indicator circle positioned over the rail */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-300 shadow-2xs'
                        : isCurrent
                          ? 'bg-white text-[#E85D2C] border-2 border-[#E85D2C] shadow-sm animate-active-stage-pulse'
                          : isFailed
                            ? 'bg-red-50 text-red-500 border border-red-300'
                            : 'bg-[#FAFAF7] text-[#9CA3AF] border border-[#E5E1DA]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#E85D2C]" />
                    ) : isFailed ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      stage.icon
                    )}
                  </div>

                  {/* Stage Label & Details */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${
                        isDone
                          ? 'text-[#4B5563]'
                          : isCurrent
                            ? 'text-[#1A1D29]'
                            : isFailed
                              ? 'text-red-700'
                              : 'text-[#9CA3AF]'
                      }`}
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {isFailed ? `Failed: ${stage.label}` : stage.label}
                    </div>
                    {isCurrent && (
                      <div className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                        {stage.description}
                      </div>
                    )}
                    {isFailed && errorMessage && (
                      <div className="text-[11px] text-red-600 mt-0.5 line-clamp-2">
                        {errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Completed status tag */}
                  {isDone && (
                    <span className="text-[10px] text-emerald-600 font-medium px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      Ready
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Long-wait reassurance message */}
          {showLongWaitMessage && !failedStage && !completing && (
            <div
              className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#FFF4EE] border border-[#E85D2C]/30 text-xs text-[#E85D2C]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Larger repositories take longer — still analyzing.</span>
            </div>
          )}

          {/* Error: failed state with light themed Try Again button */}
          {failedStage && (
            <div className="flex flex-col gap-3 mt-1">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex gap-3 items-start">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-900 font-semibold text-sm">Analysis failed</h4>
                  <p className="text-red-700 text-[11px] mt-1 leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {errorMessage || 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#E85D2C] hover:bg-[#D45022] text-white text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shadow-md shadow-[#E85D2C]/20"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 text-[#6B7280] hover:text-[#1A1D29] text-xs transition-colors cursor-pointer py-1"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to landing page
              </button>
            </div>
          )}

          {/* Completion state toast */}
          {completing && (
            <div
              className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              Route calculated — navigating to dashboard...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
