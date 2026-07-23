import React, { useState, useEffect, useRef } from 'react';
import {
  GitBranch,
  Search,
  Network,
  Flame,
  Github,
  Database,
  Layers,
  ArrowLeft,
  AlertTriangle,
  FolderTree,
  Files,
  Loader2,
  Check,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import FileTree, { FileTreeNodeType } from '../components/FileTree';
import HotspotList, { HotspotType } from '../components/HotspotList';
import FileExplainer from '../components/FileExplainer';
import SemanticSearch from '../components/SemanticSearch';
import OnboardingGuide from '../components/OnboardingGuide';
import QualityScoreCard, { QualityScoreSummary } from '../components/QualityScoreCard';
import ArchitectureMap from '../components/ArchitectureMap';
import LandingPage from '../components/LandingPage';
import LoadingScreen from '../components/LoadingScreen';

// ── Navigation section type ────────────────────────────────────────────────
type Section = 'overview' | 'files' | 'hotspots' | 'search' | 'architecture' | 'onboarding' | 'quality';

interface NavItem { id: Section; label: string; icon: React.ReactNode; }

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',     label: 'Overview',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'files',        label: 'Files',        icon: <FolderTree className="w-4 h-4" /> },
  { id: 'hotspots',     label: 'Hotspots',    icon: <Flame className="w-4 h-4" /> },
  { id: 'search',       label: 'Search',      icon: <Search className="w-4 h-4" /> },
  { id: 'architecture', label: 'Architecture',icon: <Network className="w-4 h-4" /> },
  { id: 'onboarding',   label: 'Onboarding',  icon: <Compass className="w-4 h-4" /> },
  { id: 'quality',      label: 'Quality',     icon: <ShieldCheck className="w-4 h-4" /> },
];

function NotReadyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-4 text-center px-6">
      <div className="p-4 rounded-2xl bg-[#12151D] border border-[#1F2330] text-[#8A8F9C]">{icon}</div>
      <div>
        <p className="text-[#E8E9ED] text-sm font-semibold">{title}</p>
        <p className="text-[#8A8F9C] text-xs mt-1 max-w-xs leading-relaxed font-mono">{detail}</p>
      </div>
    </div>
  );
}

// ── Animated Number Component (Counts up on mount) ───────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayVal(value);
      return;
    }

    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayVal(end);
      return;
    }

    const duration = 1000;
    const startTime = performance.now();
    let animationFrameId: number;

    const updateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      const current = Math.floor(easeProgress * (end - start) + start);
      setDisplayVal(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber);
      } else {
        setDisplayVal(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateNumber);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return <span>{displayVal}</span>;
}

// ── Stat Info Tooltip Component ──────────────────────────────────────────
function StatTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex items-center ml-1.5 text-zinc-500 hover:text-zinc-300 cursor-help select-none">
      <span className="text-[10px] font-mono leading-none">ⓘ</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-[#12151D] border border-[#1F2330] text-[10px] text-zinc-400 font-mono leading-normal shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
        {text}
      </div>
    </div>
  );
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoId, setRepoId] = useState('');
  const [pendingRepoId, setPendingRepoId] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNodeType | null>(null);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<HotspotType[]>([]);

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [isExplainerLoading, setIsExplainerLoading] = useState(false);

  // Sliding Nav Pill State
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({ opacity: 0, height: 0, top: 0 });

  // Background Indexing states
  const [indexingStatus, setIndexingStatus] = useState<'idle' | 'indexing' | 'success' | 'error'>('idle');
  const [chunksIndexed, setChunksIndexed] = useState<number | null>(null);
  const [indexingError, setIndexingError] = useState<string | null>(null);

  // Quality score states
  const [qualitySummary, setQualitySummary] = useState<QualityScoreSummary | null>(null);
  const [qualityScoresMap, setQualityScoresMap] = useState<Record<string, number>>({});
  const [loadingQuality, setLoadingQuality] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      const parentRect = containerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setPillStyle({
        opacity: 1,
        height: `${btnRect.height}px`,
        top: `${btnRect.top - parentRect.top}px`,
        transition: prefersReducedMotion ? 'none' : 'top 300ms cubic-bezier(0.16, 1, 0.3, 1), height 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms',
      });
    } else {
      setPillStyle({ opacity: 0, height: 0, top: 0 });
    }
  }, [activeSection]);

  const fetchQualityScores = async (currentRepoId: string, force: boolean = false) => {
    if (!currentRepoId) return;
    setLoadingQuality(true);
    try {
      const url = force
        ? `http://localhost:8000/api/repos/${currentRepoId}/quality-scores/compute?force_recompute=true`
        : `http://localhost:8000/api/repos/${currentRepoId}/quality-scores`;
      const method = force ? 'POST' : 'GET';
      const response = await fetch(url, { method });
      if (response.ok) {
        const data = await response.json();
        setQualitySummary(data);
        if (data.scores && Array.isArray(data.scores)) {
          const map: Record<string, number> = {};
          data.scores.forEach((item: any) => {
            map[item.file_path] = item.composite_score;
          });
          setQualityScoresMap(map);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quality scores:', err);
    } finally {
      setLoadingQuality(false);
    }
  };

  // Background indexing fetcher
  const handleIndex = async (id: string, force: boolean = false) => {
    setIndexingStatus('indexing');
    setIndexingError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      console.log(`[DevLens AI] Starting background indexing for: ${id} (force_reindex=${force})`);
      const response = await fetch(`${apiUrl}/api/repos/${id}/index${force ? '?force_reindex=true' : ''}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to index repository');
      }
      setChunksIndexed(data.chunks_indexed);
      setIndexingStatus('success');
      console.log(`[DevLens AI] Background indexing complete for: ${id}. Chunks indexed: ${data.chunks_indexed}`);
    } catch (err: any) {
      console.error(`[DevLens AI] Indexing failed for repo: ${id}`, err);
      setIndexingError(err.message || 'Repository indexing failed.');
      setIndexingStatus('error');
    }
  };

  // Helper to count files and folders in the tree
  const countTreeNodes = (node: FileTreeNodeType | null): { files: number; folders: number } => {
    if (!node) return { files: 0, folders: 0 };
    let files = 0;
    let folders = 0;

    if (node.type === 'folder') {
      folders++;
      if (node.children) {
        node.children.forEach(child => {
          const childCounts = countTreeNodes(child);
          files += childCounts.files;
          folders += childCounts.folders;
        });
      }
    } else {
      files++;
    }

    return { files, folders };
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl && !repoUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setPendingRepoId(null);
    setSelectedFilePath('');
    setIsExplainerLoading(false);
    setLoadingPhase('Validating GitHub URL...');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiUrl}/api/repos/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ github_url: repoUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to ingest repository');
      }

      setRepoId(data.repo_id);
      setRepoName(data.repo_name);
      setFileTree(data.file_tree);
      setDependencies(data.dependencies);
      setHotspots(data.hotspots);

      // Now make the repo_id available for LoadingScreen to start polling /status
      setPendingRepoId(data.repo_id);

      // Kick off background indexing
      handleIndex(data.repo_id);

      // Fetch code quality scores in background
      fetchQualityScores(data.repo_id);

      console.log('=========== DevLens AI Ingestion Report ===========');
      console.log('Repo ID:', data.repo_id);
      console.log('Project Name:', data.repo_name);
      console.log('Dependency Edges (Internal Imports):', data.dependencies);
      console.log('Git Hotspots (Commit Frequency):', data.hotspots);
      console.log('==================================================');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while communicating with the backend.');
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setPendingRepoId(null);
    setActiveSection('overview');
    setIsAnalyzed(true);
  };

  const handleLoadingRetry = () => {
    setIsLoading(false);
    setPendingRepoId(null);
    setError(null);
    setRepoId('');
    setRepoName('');
    setFileTree(null);
    setDependencies([]);
    setHotspots([]);
  };

  const handleReset = () => {
    setIsAnalyzed(false);
    setRepoId('');
    setRepoName('');
    setFileTree(null);
    setDependencies([]);
    setHotspots([]);
    setRepoUrl('');
    setSelectedFilePath('');
    setQualitySummary(null);
    setQualityScoresMap({});
    setIsExplainerLoading(false);
    setError(null);
    setIndexingStatus('idle');
    setChunksIndexed(null);
    setIndexingError(null);
    setActiveSection('overview');
    setSidebarOpen(false);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const { files: fileCount, folders: folderCount } = countTreeNodes(fileTree);
  const avgQuality = qualitySummary?.average_composite_score ?? null;

  const getMaxDepth = (node: FileTreeNodeType | null): number => {
    if (!node || node.type !== 'folder') return 0;
    if (!node.children || node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(getMaxDepth));
  };
  const maxDepth = folderCount > 0 ? getMaxDepth(fileTree) : 0;

  // Derive What We Found observations
  const incomingImports: Record<string, number> = {};
  dependencies.forEach(edge => {
    if (edge.to) {
      incomingImports[edge.to] = (incomingImports[edge.to] || 0) + 1;
    }
  });
  let mostImportedFile = '';
  let maxImports = 0;
  Object.entries(incomingImports).forEach(([file, count]) => {
    if (count > maxImports) {
      maxImports = count;
      mostImportedFile = file;
    }
  });
  const mostImportedFileName = mostImportedFile ? mostImportedFile.split('/').pop() : '';

  const topHotspot = hotspots && hotspots.length > 0
    ? hotspots.reduce((max, h) => h.commit_count > max.commit_count ? h : max, hotspots[0])
    : null;
  const topHotspotName = topHotspot ? topHotspot.path.split('/').pop() : '';
  const topHotspotCommits = topHotspot ? topHotspot.commit_count : 0;

  const scores = Object.values(qualityScoresMap);
  const healthyCount = scores.filter(s => s >= 70).length;
  const worthReviewingCount = scores.filter(s => s >= 45 && s < 70).length;
  const highRiskCount = scores.filter(s => s < 45).length;

  // ── Render guards ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LoadingScreen
        repoUrl={repoUrl}
        repoId={pendingRepoId}
        onComplete={handleLoadingComplete}
        onRetry={handleLoadingRetry}
      />
    );
  }
  if (!isAnalyzed) {
    return (
      <LandingPage
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        handleAnalyze={handleAnalyze}
        isLoading={isLoading}
        loadingPhase={loadingPhase}
        error={error}
      />
    );
  }

  // ── Nav button renderer ────────────────────────────────────────────────────
  const navButton = (item: NavItem) => {
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        data-active={isActive}
        onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-left w-full relative z-10 select-none group ${
          item.id === 'overview' ? 'animate-overview-hover' :
          item.id === 'files' ? 'animate-files-hover' :
          item.id === 'hotspots' ? 'animate-flame-hover' :
          item.id === 'search' ? 'animate-search-hover' :
          item.id === 'architecture' ? 'animate-arch-hover' :
          item.id === 'onboarding' ? 'animate-compass-hover' :
          'animate-quality-hover'
        } ${
          isActive
            ? 'text-white font-semibold'
            : 'text-[#8A8F9C] hover:text-[#E8E9ED] hover:bg-[#12151D]/40'
        }`}
      >
        <span className={`icon-target transition-colors duration-300 shrink-0 ${isActive ? 'text-[#3ED9C7]' : 'text-[#8A8F9C] group-hover:text-[#6D5EF5]'}`}>{item.icon}</span>
        {item.label}
        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3ED9C7] flex-shrink-0" />}
      </button>
    );
  };

  // ── Section renderers ──────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="p-8 max-w-4xl mx-auto w-full">
      {/* Repo Title Intro */}
      <div className="mb-8 animate-fade-in-stagger" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-mono text-[#3ED9C7] uppercase tracking-wider">Repository</span>
          {indexingStatus === 'success' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <Check className="w-2.5 h-2.5" />{chunksIndexed !== null ? `${chunksIndexed} chunks indexed` : 'Indexed'}
            </span>
          )}
          {indexingStatus === 'indexing' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono animate-pulse">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Indexing...
            </span>
          )}
          {indexingStatus === 'error' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono">
              <AlertTriangle className="w-2.5 h-2.5" /> Indexing failed
              <button onClick={() => handleIndex(repoId, true)} className="ml-1 underline hover:no-underline cursor-pointer">retry</button>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{repoName}</h1>
        <p className="text-sm text-[#8A8F9C] leading-relaxed max-w-2xl font-mono">
          Analyzed <span className="text-white font-semibold">{fileCount}</span> files across <span className="text-white font-semibold">{folderCount}</span> directories. Mapped <span className="text-[#3ED9C7] font-semibold">{dependencies.length}</span> import relationships and identified <span className="text-[#F5A623] font-semibold">{hotspots.length}</span> files with significant change history. All content is successfully indexed for semantic search.
        </p>
      </div>

      {/* Expanded Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Source Files',     value: fileCount,           icon: <Files className="w-4 h-4" />,      color: '#3ED9C7', tooltip: 'The total number of source code and asset files parsed in the repository.' },
          { label: 'Directories',      value: folderCount,         icon: <FolderTree className="w-4 h-4" />, color: '#8B7FFF', tooltip: 'The count of unique folder directories within the parsed structure.' },
          { label: 'Dep. Edges',       value: dependencies.length, icon: <GitBranch className="w-4 h-4" />,  color: '#6D5EF5', tooltip: 'Total direct file-to-file import connections detected.' },
          { label: 'Git Hotspots',     value: hotspots.length,     icon: <Flame className="w-4 h-4" />,      color: '#F5A623', tooltip: 'Number of high-activity source files tracked via commit logs.' },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl bg-[#12151D] border border-[#1F2330] flex flex-col gap-2 animate-fade-in-stagger"
            style={{ animationDelay: `${(idx + 1) * 80}ms` }}
          >
            <div className="flex justify-between items-start">
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <StatTooltip text={stat.tooltip} />
            </div>
            <div className="text-2xl font-bold text-white font-mono mt-1">
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-[11px] text-[#8A8F9C] font-mono">{stat.label}</div>
            {/* context lines */}
            <div className="text-[10px] text-zinc-500 font-mono mt-1.5 border-t border-[#1F2330] pt-1.5">
              {idx === 0 && `Organized in ${folderCount} directories`}
              {idx === 1 && `Max directory depth: ${maxDepth}`}
              {idx === 2 && `Density: ${(dependencies.length / Math.max(fileCount, 1)).toFixed(1)} edges/file`}
              {idx === 3 && (topHotspot ? `Top file: ${topHotspotName} (${topHotspotCommits} commits)` : 'No hotspot data')}
            </div>
          </div>
        ))}
      </div>

      {/* Health & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expanded Repository Health Card */}
        <div className="p-5 rounded-2xl bg-[#12151D] border border-[#1F2330] flex flex-col justify-between animate-fade-in-stagger" style={{ animationDelay: '400ms' }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B7FFF]" />
                <span className="text-xs font-mono text-[#8A8F9C] uppercase tracking-wider">Repository Health</span>
              </div>
              <StatTooltip text="Overall maintainability rating computed from static analysis of file size, cyclomatic complexity, and import coupling." />
            </div>
            {loadingQuality ? (
              <div className="flex items-center gap-2 text-[#8A8F9C] text-xs font-mono py-4"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing health metrics...</div>
            ) : avgQuality !== null ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-3xl font-bold text-white font-mono">{avgQuality.toFixed(0)}</div>
                  <div className="text-xs text-[#8A8F9C] font-mono">/ 100 average score</div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1F2330] overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${avgQuality}%`, background: avgQuality >= 70 ? '#3ED9C7' : avgQuality >= 45 ? '#F5A623' : '#EF4444' }} />
                </div>
                {/* Health breakdown bands */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#1F2330] text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3ED9C7] shrink-0" />
                    <span className="text-white font-bold">{healthyCount}</span>
                    <span className="text-[#8A8F9C]">healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0" />
                    <span className="text-white font-bold">{worthReviewingCount}</span>
                    <span className="text-[#8A8F9C]">review</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
                    <span className="text-white font-bold">{highRiskCount}</span>
                    <span className="text-[#8A8F9C]">risk</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-[#8A8F9C] font-mono py-4">Not yet computed</div>
            )}
          </div>
          {avgQuality !== null && (
            <button onClick={() => setActiveSection('quality')} className="mt-4 text-[11px] font-mono text-[#6D5EF5] hover:text-[#8B7FFF] flex items-center gap-1 cursor-pointer transition-colors w-fit">
              View breakdown <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Navigation Card */}
        <div className="p-5 rounded-2xl bg-[#12151D] border border-[#1F2330] animate-fade-in-stagger" style={{ animationDelay: '480ms' }}>
          <div className="text-xs font-mono text-[#8A8F9C] uppercase tracking-wider mb-3">Quick Navigation</div>
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.filter(n => n.id !== 'overview').map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className="flex items-center gap-2.5 text-[#E8E9ED] hover:text-[#3ED9C7] text-xs font-mono transition-colors cursor-pointer group">
                <span className="text-[#8A8F9C] group-hover:text-[#3ED9C7] transition-colors">{item.icon}</span>
                {item.label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* What We Found Section */}
      <div className="mt-6 p-5 rounded-2xl bg-[#12151D] border border-[#1F2330] animate-fade-in-stagger" style={{ animationDelay: '560ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#3ED9C7]" />
          <span className="text-xs font-mono text-[#8A8F9C] uppercase tracking-wider">What We Found</span>
        </div>
        <ul className="flex flex-col gap-3 text-xs font-mono text-[#8A8F9C] leading-relaxed">
          {mostImportedFile && (
            <li className="flex items-start gap-2.5">
              <span className="text-[#3ED9C7] shrink-0 font-bold">→</span>
              <span>
                This repository's most central file is <span className="text-white font-semibold">`{mostImportedFileName}`</span>, which is imported or referenced by <span className="text-[#3ED9C7] font-semibold">{maxImports}</span> other files.
              </span>
            </li>
          )}
          {topHotspot && (
            <li className="flex items-start gap-2.5">
              <span className="text-[#F5A623] shrink-0 font-bold">→</span>
              <span>
                The file <span className="text-white font-semibold">`{topHotspotName}`</span> has changed <span className="text-[#F5A623] font-semibold">{topHotspotCommits}</span> times in its history, making it the most active and frequently modified file.
              </span>
            </li>
          )}
          {dependencies.length > 0 && (
            <li className="flex items-start gap-2.5">
              <span className="text-[#8B7FFF] shrink-0 font-bold">→</span>
              <span>
                Mapped <span className="text-white font-semibold">{dependencies.length}</span> import connections across <span className="text-white font-semibold">{fileCount}</span> files, indicating a <span className="text-[#8B7FFF] font-semibold">{dependencies.length > fileCount * 1.5 ? 'highly coupled' : 'modular'}</span> codebase architecture.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="flex h-full overflow-hidden">
      <div className="w-72 flex-shrink-0 border-r border-[#1F2330] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#1F2330] flex-shrink-0">
          <h2 className="text-xs font-mono text-[#8A8F9C] uppercase tracking-wider">Workspace Files</h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 leading-normal">
            Browse codebase folders. Select any file to generate its AI-powered description and blast radius impact analysis.
          </p>
        </div>
        <div className="flex-1 overflow-hidden relative min-h-0">
          <FileTree tree={fileTree!} onSelectFile={setSelectedFilePath} selectedFilePath={selectedFilePath} disabled={isExplainerLoading} qualityScores={qualityScoresMap} />
          {isExplainerLoading && (
            <div className="absolute bottom-2 left-2 right-2 bg-[#6D5EF5]/20 border border-[#6D5EF5]/30 text-[10px] text-[#8B7FFF] font-mono py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 backdrop-blur-sm">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" /> Loading explanation...
            </div>
          )}
        </div>
        <div className="p-3 border-t border-[#1F2330] flex justify-between text-[10px] text-[#8A8F9C] font-mono flex-shrink-0">
          <span className="flex items-center gap-1"><Files className="w-3 h-3" />{fileCount} files</span>
          <span>{folderCount} dirs</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-w-0">
        {selectedFilePath ? (
          <FileExplainer repoId={repoId} filePath={selectedFilePath} onClose={() => !isExplainerLoading && setSelectedFilePath('')} onLoadingStateChange={setIsExplainerLoading} onSelectFile={setSelectedFilePath} />
        ) : (
          <NotReadyState icon={<FolderTree className="w-8 h-8" />} title="Select a file to inspect" detail="Click any file in the tree on the left to view its AI summary, blast radius, and dependency analysis." />
        )}
      </div>
    </div>
  );

  const renderHotspots = () => (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#F5A623] uppercase tracking-wider">Git Telemetry</span>
        <h2 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Hotspot Analysis</h2>
        <p className="text-xs text-[#8A8F9C] mt-2 font-mono leading-relaxed">
          Identify high-churn files with frequent commits. Code hotspots that change often are prime candidates for refactoring to prevent regressions and improve maintainability.
        </p>
      </div>
      {hotspots.length > 0 ? <HotspotList hotspots={hotspots} /> : <NotReadyState icon={<Flame className="w-8 h-8" />} title="No hotspots detected" detail="No significant git churn signals were found in this repository's commit history." />}
    </div>
  );

  const renderSearch = () => (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#8B7FFF] uppercase tracking-wider">Hybrid RAG Search</span>
        <h2 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Semantic Search</h2>
        <p className="text-xs text-[#8A8F9C] mt-2 font-mono leading-relaxed">
          Ask architectural or behavioral questions in plain English. We scan both BM25 text keyword index and vector embeddings to extract relevant code blocks and explain them.
        </p>
      </div>
      <SemanticSearch repoId={repoId} indexingStatus={indexingStatus} chunksIndexed={chunksIndexed} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} />
    </div>
  );

  const renderArchitecture = () => (
    <div className="p-6 w-full h-full flex flex-col min-h-0">
      <div className="mb-4 flex-shrink-0">
        <span className="text-xs font-mono text-[#3ED9C7] uppercase tracking-wider">Dependency Graph</span>
        <h2 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Architecture Map</h2>
        <p className="text-xs text-[#8A8F9C] mt-2 font-mono leading-relaxed">
          Visual representation of file-to-file import relationships. Click any node to highlight its connections. Larger nodes Sit more centrally and have higher references.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ArchitectureMap repoId={repoId} dependencies={dependencies} selectedFilePath={selectedFilePath} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} />
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#3ED9C7] uppercase tracking-wider">Navigation Guide</span>
        <h2 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Onboarding Guide</h2>
        <p className="text-xs text-[#8A8F9C] mt-2 font-mono leading-relaxed">
          Sequenced reading list generated by analyzing entry points, high-coupling helper files, and hotspots to onboard new developers into the codebase.
        </p>
      </div>
      <OnboardingGuide repoId={repoId} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} />
    </div>
  );

  const renderQuality = () => (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#8B7FFF] uppercase tracking-wider">Code Health</span>
        <h2 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Quality Scores</h2>
        <p className="text-xs text-[#8A8F9C] mt-2 font-mono leading-relaxed">
          Maintainability ratings calculated from static analysis. Lower scores indicate high complexity, excessive line count, or deep dependency coupling.
        </p>
      </div>
      <QualityScoreCard summary={qualitySummary} loading={loadingQuality} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} onRecompute={() => fetchQualityScores(repoId, true)} />
    </div>
  );

  const sectionContent: Record<Section, React.ReactNode> = {
    overview:     renderOverview(),
    files:        renderFiles(),
    hotspots:     renderHotspots(),
    search:       renderSearch(),
    architecture: renderArchitecture(),
    onboarding:   renderOnboarding(),
    quality:      renderQuality(),
  };
  const isFullHeightSection = activeSection === 'files' || activeSection === 'architecture';

  // ── Dashboard render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0B0D12] text-[#E8E9ED] overflow-hidden" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* Styles for micro-animations */}
      <style>{`
        @keyframes overview-hover-key {
          0% { transform: scale(1); }
          50% { transform: scale(1.1) rotate(4deg); }
          100% { transform: scale(1); }
        }
        @keyframes files-hover-key {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }
        @keyframes flame-hover-key {
          0% { transform: scaleY(1); }
          35% { transform: scaleY(1.25) scaleX(0.85) skewX(-3deg); }
          70% { transform: scaleY(0.9) scaleX(1.1) skewX(3deg); }
          100% { transform: scaleY(1); }
        }
        @keyframes search-hover-key {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.15) translate(-1px, -1px); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes arch-hover-key {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); filter: drop-shadow(0 0 3px #3ED9C7); }
          100% { transform: scale(1); }
        }
        @keyframes compass-hover-key {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(45deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes quality-hover-key {
          0% { transform: scale(1); }
          50% { transform: scale(1.1) translateY(-1px); }
          100% { transform: scale(1); }
        }
        @keyframes fade-slide-in-key {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .animate-overview-hover:hover .icon-target {
            animation: overview-hover-key 400ms ease-out;
          }
          .animate-files-hover:hover .icon-target {
            animation: files-hover-key 350ms ease-out;
          }
          .animate-flame-hover:hover .icon-target {
            animation: flame-hover-key 450ms ease-out;
          }
          .animate-search-hover:hover .icon-target {
            animation: search-hover-key 350ms ease-out;
          }
          .animate-arch-hover:hover .icon-target {
            animation: arch-hover-key 400ms ease-out;
          }
          .animate-compass-hover:hover .icon-target {
            animation: compass-hover-key 400ms ease-in-out;
          }
          .animate-quality-hover:hover .icon-target {
            animation: quality-hover-key 350ms ease-out;
          }
          .animate-fade-in-stagger {
            animation: fade-slide-in-key 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
        }
      `}</style>

      {/* Persistent top bar */}
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-[#1F2330] bg-[#0B0D12] z-30">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1.5 rounded-lg text-[#8A8F9C] hover:text-[#E8E9ED] hover:bg-[#12151D] transition-all cursor-pointer" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white hidden sm:block" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>DevLens <span className="text-[#3ED9C7]">AI</span></span>
            <span className="text-[#1F2330] hidden sm:block">/</span>
            <span className="text-sm text-[#E8E9ED] font-medium truncate max-w-[160px] sm:max-w-xs">{repoName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1F2330] hover:border-[#6D5EF5]/40 bg-[#12151D] text-[#8A8F9C] hover:text-[#E8E9ED] text-xs font-mono transition-all cursor-pointer">
            <ArrowLeft className="w-3 h-3" /><span className="hidden sm:inline">Load another</span>
          </button>
          <a href="https://github.com/user-Rishabh/DevLens-AI" target="_blank" rel="noreferrer" className="p-1.5 text-[#8A8F9C] hover:text-[#E8E9ED] transition-colors">
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r border-[#1F2330] bg-[#0B0D12] overflow-y-auto">
          <nav ref={containerRef} className="flex flex-col gap-0.5 p-3 flex-1 relative select-none">
            {/* Sliding Active Pill */}
            <div
              className="absolute left-3 right-3 rounded-xl bg-[#6D5EF5]/15 border border-[#6D5EF5]/25 pointer-events-none"
              style={pillStyle}
            />
            {NAV_ITEMS.map(navButton)}
          </nav>
          <div className="p-3 border-t border-[#1F2330]">
            <div className="flex flex-col gap-1 text-[10px] font-mono text-[#8A8F9C]">
              <span className="flex items-center gap-1.5"><Database className="w-3 h-3" />Supabase Postgres</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" />FastAPI Python</span>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="lg:hidden fixed left-0 top-12 bottom-0 w-60 bg-[#0B0D12] border-r border-[#1F2330] z-50 overflow-y-auto flex flex-col">
              <nav className="flex flex-col gap-0.5 p-3 flex-1">{NAV_ITEMS.map(navButton)}</nav>
            </aside>
          </>
        )}

        {/* Main content area */}
        <main className={`flex-1 min-w-0 bg-[#0B0D12] ${ isFullHeightSection ? 'overflow-hidden flex flex-col' : 'overflow-y-auto pb-20 lg:pb-0' }`}>
          <div className="fixed top-12 left-0 w-[40vw] h-[40vh] rounded-full bg-[#6D5EF5]/4 blur-[120px] pointer-events-none z-0" />
          <div className="fixed bottom-0 right-0 w-[30vw] h-[30vh] rounded-full bg-[#3ED9C7]/3 blur-[100px] pointer-events-none z-0" />
          <div className={`relative z-10 ${ isFullHeightSection ? 'h-full flex flex-col' : '' }`}>
            {sectionContent[activeSection]}
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0D12]/95 backdrop-blur-sm border-t border-[#1F2330] z-30 flex items-center justify-around px-1 py-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all cursor-pointer ${ isActive ? 'text-[#3ED9C7]' : 'text-[#8A8F9C]' }`}>
                {item.icon}
                <span className="text-[8px] font-mono leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
