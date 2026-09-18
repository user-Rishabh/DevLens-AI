import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GitBranch,
  Search,
  Network,
  Flame,
  Github,
  Database,
  Layers,
  ArrowLeft,
  ArrowRight,
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
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import FileTree, { FileTreeNodeType } from '../components/FileTree';
import { HotspotType } from '../components/HotspotList';
import FileExplainer from '../components/FileExplainer';
import SemanticSearch from '../components/SemanticSearch';
import OnboardingGuide from '../components/OnboardingGuide';
import QualityScoreCard, { QualityScoreSummary } from '../components/QualityScoreCard';
import ArchitectureMap from '../components/ArchitectureMap';
import LandingPage from '../components/LandingPage';
import LoadingScreen from '../components/LoadingScreen';
import { API_BASE_URL } from '../lib/apiClient';

// ── Navigation section type ────────────────────────────────────────────────
type Section = 'overview' | 'files' | 'search' | 'architecture' | 'health' | 'onboarding';

interface NavItem { id: Exclude<Section, 'onboarding'>; label: string; icon: React.ReactNode; }

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',     label: 'Overview',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'files',        label: 'Files',       icon: <FolderTree className="w-4 h-4" /> },
  { id: 'search',       label: 'Ask DevLens', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'architecture', label: 'Architecture',icon: <Network className="w-4 h-4" /> },
  { id: 'health',       label: 'Health',      icon: <ShieldCheck className="w-4 h-4" /> },
];

const QUICK_NAV_ACCENTS: Record<Exclude<Section, 'overview' | 'onboarding'>, {
  badgeBg: string;
  badgeHoverBg: string;
  badgeBorder: string;
  badgeHoverBorder: string;
  iconColor: string;
  accentBar: string;
  borderHover: string;
  shadowHover: string;
  gradientWash: string;
  cardClass: string;
  iconClass: string;
  description: string;
}> = {
  files: {
    badgeBg: 'bg-[#4F46E5]/20',
    badgeHoverBg: 'group-hover:bg-[#4F46E5]/30',
    badgeBorder: 'border-[#4F46E5]/35',
    badgeHoverBorder: 'group-hover:border-[#4F46E5]/50',
    iconColor: 'text-[#4F46E5]',
    accentBar: 'bg-[#4F46E5]',
    borderHover: 'hover:border-[#4F46E5]/40',
    shadowHover: 'hover:shadow-[0_8px_20px_-4px_rgba(79,70,229,0.16),0_2px_6px_-1px_rgba(79,70,229,0.08)]',
    gradientWash: 'bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.08)_0%,transparent_70%)]',
    cardClass: 'nav-card-files',
    iconClass: 'nav-icon-files',
    description: 'Explore and understand individual files.',
  },
  search: {
    badgeBg: 'bg-[#E85D2C]/20',
    badgeHoverBg: 'group-hover:bg-[#E85D2C]/30',
    badgeBorder: 'border-[#E85D2C]/35',
    badgeHoverBorder: 'group-hover:border-[#E85D2C]/50',
    iconColor: 'text-[#E85D2C]',
    accentBar: 'bg-[#E85D2C]',
    borderHover: 'hover:border-[#E85D2C]/45',
    shadowHover: 'hover:shadow-[0_8px_20px_-4px_rgba(232,93,44,0.18),0_2px_6px_-1px_rgba(232,93,44,0.08)]',
    gradientWash: 'bg-[radial-gradient(circle_at_top_left,rgba(232,93,44,0.09)_0%,transparent_70%)]',
    cardClass: 'nav-card-search',
    iconClass: 'nav-icon-search',
    description: 'Semantic/RAG codebase search and questions.',
  },
  architecture: {
    badgeBg: 'bg-[#7C3AED]/20',
    badgeHoverBg: 'group-hover:bg-[#7C3AED]/30',
    badgeBorder: 'border-[#7C3AED]/35',
    badgeHoverBorder: 'group-hover:border-[#7C3AED]/50',
    iconColor: 'text-[#7C3AED]',
    accentBar: 'bg-[#7C3AED]',
    borderHover: 'hover:border-[#7C3AED]/40',
    shadowHover: 'hover:shadow-[0_8px_20px_-4px_rgba(124,58,237,0.16),0_2px_6px_-1px_rgba(124,58,237,0.08)]',
    gradientWash: 'bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08)_0%,transparent_70%)]',
    cardClass: 'nav-card-architecture',
    iconClass: 'nav-icon-architecture',
    description: 'Dependencies, imports, blast radius.',
  },
  health: {
    badgeBg: 'bg-[#059669]/20',
    badgeHoverBg: 'group-hover:bg-[#059669]/30',
    badgeBorder: 'border-[#059669]/35',
    badgeHoverBorder: 'group-hover:border-[#059669]/50',
    iconColor: 'text-[#059669]',
    accentBar: 'bg-[#059669]',
    borderHover: 'hover:border-[#059669]/40',
    shadowHover: 'hover:shadow-[0_8px_20px_-4px_rgba(5,150,105,0.16),0_2px_6px_-1px_rgba(5,150,105,0.08)]',
    gradientWash: 'bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.08)_0%,transparent_70%)]',
    cardClass: 'nav-card-quality',
    iconClass: 'nav-icon-quality',
    description: 'Quality, maintainability, hotspots, risks.',
  },
};

import NotReadyState from '../components/NotReadyState';
import AnimatedNumber from '../components/AnimatedNumber';
import StatTooltip from '../components/StatTooltip';
import { useQualityScores } from '../hooks/useQualityScores';

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
  const [isDataReady, setIsDataReady] = useState(false);

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [isExplainerLoading, setIsExplainerLoading] = useState(false);

  // Background Indexing states
  const [indexingStatus, setIndexingStatus] = useState<'idle' | 'indexing' | 'success' | 'error'>('idle');
  const [chunksIndexed, setChunksIndexed] = useState<number | null>(null);
  const [indexingError, setIndexingError] = useState<string | null>(null);

  // Quality score states
  const { qualitySummary, qualityScoresMap, loadingQuality, fetchQualityScores, resetQualityScores } = useQualityScores();

  // Top Navigation Bar State (Hover reveal & Click/Touch toggle)
  const [isHovered, setIsHovered] = useState(false);
  const [isNavPinned, setIsNavPinned] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionCooldownRef = useRef(0);
  const capsuleNavRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Section, HTMLButtonElement | null>>({
    overview: null,
    files: null,
    search: null,
    architecture: null,
    health: null,
    onboarding: null,
  });

  const isNavOpen = isHovered || isNavPinned;

  // Active-tab indicator sliding geometry state
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeBtn = tabRefs.current[activeSection];
    const container = capsuleNavRef.current;
    if (activeBtn && container) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        ready: true,
      });
    }
  }, [activeSection]);

  useEffect(() => {
    updateIndicator();
    // Schedule measurements at key animation frames during smooth expand
    const timers = [
      setTimeout(updateIndicator, 50),
      setTimeout(updateIndicator, 150),
      setTimeout(updateIndicator, 300),
      setTimeout(updateIndicator, 450),
      setTimeout(updateIndicator, 600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [activeSection, isNavOpen, updateIndicator]);

  useEffect(() => {
    if (!capsuleNavRef.current) return;
    const observer = new ResizeObserver(() => {
      updateIndicator();
    });
    observer.observe(capsuleNavRef.current);
    return () => observer.disconnect();
  }, [updateIndicator]);

  const handleMouseEnter = () => {
    if (Date.now() < selectionCooldownRef.current) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 320);
  };

  // Cursor proximity range detection:
  // When the cursor comes within the proximity range of the bar (~70px), the bar appears/expands smoothly.
  useEffect(() => {
    if (!isDataReady || isNavPinned) return;

    let rafId: number | null = null;
    const PROXIMITY_ENTER = 70; // px range around the bar to trigger expansion
    const PROXIMITY_EXIT = 105; // px range to trigger collapse buffer (hysteresis)

    const onMouseMove = (e: MouseEvent) => {
      if (Date.now() < selectionCooldownRef.current) return;
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el = capsuleNavRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();

        // Distance from cursor to nearest boundary of the capsule rectangle
        const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
        const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
        const distance = Math.hypot(dx, dy);

        if (distance <= PROXIMITY_ENTER) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          setIsHovered(true);
        } else if (distance > PROXIMITY_EXIT) {
          if (!hoverTimeoutRef.current && isHovered) {
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(false);
              hoverTimeoutRef.current = null;
            }, 320);
          }
        }
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDataReady, isNavPinned, isHovered]);

  const handleSelectSection = (section: Section) => {
    selectionCooldownRef.current = Date.now() + 450;
    setActiveSection(section);
    setIsNavPinned(false);
    setIsHovered(false);
  };

  // Close pinned top nav on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavOpen) {
        setIsNavPinned(false);
        setIsHovered(false);
        tabRefs.current[activeSection]?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavOpen, activeSection]);

  // Background indexing fetcher
  const handleIndex = async (id: string, force: boolean = false) => {
    setIndexingStatus('indexing');
    setIndexingError(null);
    try {
      console.log(`[DevLens AI] Starting background indexing for: ${id} (force_reindex=${force})`);
      const response = await fetch(`${API_BASE_URL}/api/repos/${id}/index${force ? '?force_reindex=true' : ''}`, {
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

  // Deterministic SHA-256 repo_id matching backend route algorithm
  const computeRepoId = async (url: string): Promise<string> => {
    try {
      const msgUint8 = new TextEncoder().encode(url.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    } catch {
      return '';
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl && !repoUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setIsDataReady(false);
    setSelectedFilePath('');
    setIsExplainerLoading(false);
    setLoadingPhase('Validating GitHub URL...');

    // Immediately compute and assign repoId so LoadingScreen can poll real stage progress right away
    const calculatedId = await computeRepoId(repoUrl);
    setPendingRepoId(calculatedId || null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/repos/ingest`, {
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
      setIsDataReady(true);

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

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    setPendingRepoId(null);
    setActiveSection('overview');
    setIsAnalyzed(true);
  }, []);

  const handleLoadingRetry = () => {
    setIsLoading(false);
    setPendingRepoId(null);
    setIsDataReady(false);
    setError(null);
    setRepoId('');
    setRepoName('');
    setFileTree(null);
    setDependencies([]);
    setHotspots([]);
  };

  const handleReset = () => {
    setIsAnalyzed(false);
    setIsDataReady(false);
    setRepoId('');
    setRepoName('');
    setFileTree(null);
    setDependencies([]);
    setHotspots([]);
    setRepoUrl('');
    setSelectedFilePath('');
    resetQualityScores();
    setIsExplainerLoading(false);
    setError(null);
    setIndexingStatus('idle');
    setChunksIndexed(null);
    setIndexingError(null);
    setActiveSection('overview');
    setIsNavPinned(false);
    setIsHovered(false);
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
        isDataReady={isDataReady}
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


  // ── Section renderers ──────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="pt-2 sm:pt-3 px-6 pb-8 md:px-8 max-w-7xl mx-auto w-full">
      {/* Repo Title Intro */}
      <div className="mb-8 animate-fade-in-stagger" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-[#E85D2C] bg-[#E85D2C]/15 border border-[#E85D2C]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold shadow-2xs">
            Repository
          </span>
          {indexingStatus === 'success' && (
            <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-semibold shadow-2xs">
              <Check className="w-3 h-3 text-emerald-700 stroke-[2.5]" />{chunksIndexed !== null ? `${chunksIndexed} files ready to search` : 'Indexed'}
            </span>
          )}
          {indexingStatus === 'indexing' && (
            <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono font-semibold animate-pulse shadow-2xs">
              <Loader2 className="w-3 h-3 animate-spin text-amber-800" /> Indexing...
            </span>
          )}
          {indexingStatus === 'error' && (
            <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-mono font-semibold shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-rose-700" /> Indexing failed
              <button onClick={() => handleIndex(repoId, true)} className="ml-1 underline hover:no-underline cursor-pointer font-bold">retry</button>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-[#1A1D29] mb-2 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{repoName}</h1>
        <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl font-mono">
          Analyzed <span className="text-[#1A1D29] font-bold bg-[#E5E1DA]/40 px-1.5 py-0.5 rounded">{fileCount}</span> files across <span className="text-[#1A1D29] font-bold bg-[#E5E1DA]/40 px-1.5 py-0.5 rounded">{folderCount}</span> directories. Mapped <span className="text-[#E85D2C] font-bold bg-[#E85D2C]/10 border border-[#E85D2C]/20 px-1.5 py-0.5 rounded">{dependencies.length}</span> import relationships and identified <span className="text-[#EA580C] font-bold bg-[#EA580C]/10 border border-[#EA580C]/20 px-1.5 py-0.5 rounded">{hotspots.length}</span> files with significant change history. All content is successfully indexed for semantic search.
        </p>
      </div>

      {/* Expanded Stat Cards with Bold 4px Top Borders and 20-25% Saturated Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Source Files',     value: fileCount,           icon: <Files className="w-4 h-4" />,      color: '#0D9488', borderTop: 'border-t-[#0D9488]', tooltip: 'The total number of source code and asset files parsed in the repository.' },
          { label: 'Directories',      value: folderCount,         icon: <FolderTree className="w-4 h-4" />, color: '#7C3AED', borderTop: 'border-t-[#7C3AED]', tooltip: 'The count of unique folder directories within the parsed structure.' },
          { label: 'File Links',       value: dependencies.length, icon: <GitBranch className="w-4 h-4" />,  color: '#4F46E5', borderTop: 'border-t-[#4F46E5]', tooltip: 'Total direct file-to-file connections (import relationships) detected.' },
          { label: 'Frequently Changed', value: hotspots.length,   icon: <Flame className="w-4 h-4" />,      color: '#D97706', borderTop: 'border-t-[#D97706]', tooltip: 'Number of files that change often — prime candidates for refactoring.' },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className={`p-5 rounded-2xl bg-white border border-[#E5E1DA] border-t-[4px] ${stat.borderTop} shadow-xs hover:border-[#E85D2C]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-150 ease-out flex flex-col gap-2 animate-fade-in-stagger cursor-default group motion-reduce:transform-none motion-reduce:transition-none`}
            style={{ animationDelay: `${(idx + 1) * 80}ms` }}
          >
            <div className="flex justify-between items-start">
              <div
                style={{
                  backgroundColor: `${stat.color}26`,
                  borderColor: `${stat.color}4D`,
                  color: stat.color,
                }}
                className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-150 motion-reduce:transform-none shadow-2xs"
              >
                {stat.icon}
              </div>
              <StatTooltip text={stat.tooltip} />
            </div>
            <div className="text-2xl font-bold text-[#1A1D29] font-mono mt-1">
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-[11px] text-[#6B7280] font-mono font-medium">{stat.label}</div>
            {/* context lines */}
            <div className="text-[10px] text-[#6B7280] font-mono mt-1.5 border-t border-[#E5E1DA] pt-1.5">
              {idx === 0 && `Organized in ${folderCount} directories`}
              {idx === 1 && `Max directory depth: ${maxDepth}`}
              {idx === 2 && `Density: ${(dependencies.length / Math.max(fileCount, 1)).toFixed(1)} links/file`}
              {idx === 3 && (topHotspot ? `Top file: ${topHotspotName} (${topHotspotCommits} commits)` : 'No hotspot data')}
            </div>
          </div>
        ))}
      </div>

      {/* Health & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expanded Repository Health Card with Solid 4px Purple Top Border */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] border-t-[4px] border-t-[#7C3AED] shadow-xs flex flex-col justify-between animate-fade-in-stagger" style={{ animationDelay: '400ms' }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#7C3AED]/20 border border-[#7C3AED]/35 flex items-center justify-center text-[#7C3AED] shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                </div>
                <span className="text-xs font-mono text-[#7C3AED] bg-[#7C3AED]/12 border border-[#7C3AED]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold">
                  Repository Health
                </span>
              </div>
              <StatTooltip text="Overall maintainability rating computed from static analysis of file size, cyclomatic complexity, and import coupling." />
            </div>
            {loadingQuality ? (
              <div className="flex items-center gap-2.5 text-[#E85D2C] text-xs font-mono py-4 px-3 rounded-xl bg-[#E85D2C]/10 border border-[#E85D2C]/25 my-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E85D2C]" /> Computing health metrics...
              </div>
            ) : avgQuality !== null ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-3xl font-bold text-[#1A1D29] font-mono">{avgQuality.toFixed(0)}</div>
                  <div className="text-xs text-[#6B7280] font-mono">/ 100 average score</div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E5E1DA] overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${avgQuality}%`, background: avgQuality >= 70 ? '#059669' : avgQuality >= 45 ? '#D97706' : '#DC2626' }} />
                </div>
                {/* Health breakdown bands */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#E5E1DA] text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-[#059669] shrink-0" />
                    <span className="text-[#1A1D29] font-bold">{healthyCount}</span>
                    <span className="text-[#059669] font-semibold">healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                    <span className="text-[#1A1D29] font-bold">{worthReviewingCount}</span>
                    <span className="text-[#D97706] font-semibold">review</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                    <span className="text-[#1A1D29] font-bold">{highRiskCount}</span>
                    <span className="text-[#DC2626] font-semibold">risk</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="my-3 p-3.5 rounded-xl bg-[#7C3AED]/8 border border-[#7C3AED]/20 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs text-[#7C3AED] font-mono font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED] shrink-0" />
                  <span>Health analysis pending</span>
                </div>
                <button
                  onClick={() => fetchQualityScores(repoId, true)}
                  className="text-xs font-mono text-[#7C3AED] hover:text-white bg-[#7C3AED]/15 hover:bg-[#7C3AED] border border-[#7C3AED]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all duration-150 w-fit font-semibold shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Compute Health Scores
                </button>
              </div>
            )}
          </div>
          {avgQuality !== null && (
            <button onClick={() => setActiveSection('health')} className="mt-4 text-xs font-mono text-[#E85D2C] bg-[#E85D2C]/10 hover:bg-[#E85D2C] hover:text-white border border-[#E85D2C]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all duration-150 w-fit font-semibold shadow-2xs active:scale-95">
              View breakdown <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Navigation Card with Solid 4px Orange Top Border */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] border-t-[4px] border-t-[#E85D2C] shadow-xs animate-fade-in-stagger flex flex-col justify-between" style={{ animationDelay: '480ms' }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E85D2C]" />
                <span className="text-xs font-mono text-[#E85D2C] bg-[#E85D2C]/12 border border-[#E85D2C]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold">
                  Quick Navigation
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#1A1D29] bg-[#FAFAF7] border border-[#E5E1DA] px-2.5 py-0.5 rounded-md font-semibold">{NAV_ITEMS.filter(n => n.id !== 'overview').length} sections</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NAV_ITEMS.filter(n => n.id !== 'overview').map((item, idx) => {
                const accent = QUICK_NAV_ACCENTS[item.id as Exclude<Section, 'overview' | 'onboarding'>];
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    style={{ animationDelay: `${520 + idx * 45}ms` }}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border border-[#E5E1DA] bg-white ${accent.borderHover} ${accent.shadowHover} ${accent.cardClass} shadow-[0_2px_8px_-2px_rgba(26,29,41,0.05),0_1px_3px_rgba(26,29,41,0.03)] hover:-translate-y-[1.5px] active:translate-y-[0.5px] transition-all duration-200 ease-out cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2C] animate-fade-in-stagger select-none overflow-hidden text-left motion-reduce:transform-none motion-reduce:transition-none`}
                  >
                    {/* Soft gradient wash: faint accent color wash (4-8%) fading into base */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 rounded-xl pointer-events-none ${accent.gradientWash} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Micro-subtle light sweep on hover */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-500 ease-out pointer-events-none"
                    />

                    {/* Left vertical accent indicator (3px in section's accent color, visible at rest & solid on hover) */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-0 bottom-0 w-[3px] ${accent.accentBar} opacity-40 group-hover:opacity-100 transition-all duration-200`}
                    />

                    {/* Colored icon badge (20% saturated bg + full accent icon) */}
                    <span
                      className={`relative z-10 w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${accent.badgeBg} ${accent.badgeHoverBg} ${accent.badgeBorder} ${accent.badgeHoverBorder} ${accent.iconColor} shadow-2xs transition-all duration-200 [&>svg]:w-4.5 [&>svg]:h-4.5`}
                    >
                      <span className={`inline-flex items-center justify-center ${accent.iconClass}`}>
                        {item.icon}
                      </span>
                    </span>

                    {/* Destination label & short one-line description */}
                    <div className="relative z-10 flex flex-col min-w-0 flex-1 justify-center">
                      <span className="text-xs font-mono font-semibold text-[#1A1D29] tracking-tight truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#6B7280] leading-snug truncate mt-0.5">
                        {accent.description}
                      </span>
                    </div>

                    {/* Animated right chevron with 2-3px shift on hover */}
                    <ChevronRight className="relative z-10 w-3.5 h-3.5 ml-1 text-[#9CA3AF] opacity-40 group-hover:opacity-100 group-hover:text-[#1A1D29] group-hover:translate-x-[3px] transition-all duration-200 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E5E1DA] text-[10px] font-mono text-[#6B7280] flex items-center justify-between">
            <span className="font-medium text-[#1A1D29]">Direct codebase jumps</span>
            <span className="text-[#E85D2C] font-semibold">Instant switch</span>
          </div>
        </div>
      </div>

      {/* Onboarding Guide Access Banner on Overview */}
      <div className="mt-5 p-5 rounded-2xl bg-white border border-[#E5E1DA] border-l-[4px] border-l-[#D97706] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-stagger" style={{ animationDelay: '520ms' }}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#D97706]/15 border border-[#D97706]/30 flex items-center justify-center text-[#D97706] shrink-0 shadow-2xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-[#1A1D29]">Developer Onboarding Guide</h3>
              <span className="text-[10px] font-mono text-[#D97706] bg-[#D97706]/12 border border-[#D97706]/30 px-2 py-0.5 rounded-md font-semibold">
                Suggested Reading Order
              </span>
            </div>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Sequenced walkthrough analyzing entry points, helper modules, and git churn to onboard into {repoName}.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveSection('onboarding')}
          className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
        >
          Start Reading Order <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* What We Found Section with Solid 4px Orange Top Border */}
      <div className="mt-6 p-5 rounded-2xl bg-white border border-[#E5E1DA] border-t-[4px] border-t-[#E85D2C] shadow-xs animate-fade-in-stagger" style={{ animationDelay: '560ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-[#E85D2C]/20 border border-[#E85D2C]/35 flex items-center justify-center text-[#E85D2C] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E85D2C]" />
          </div>
          <span className="text-xs font-mono text-[#E85D2C] bg-[#E85D2C]/12 border border-[#E85D2C]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold">
            What We Found
          </span>
        </div>
        <ul className="flex flex-col gap-3 text-xs font-mono text-[#6B7280] leading-relaxed">
          {mostImportedFile && (
            <li className="flex items-start gap-2.5">
              <span className="text-[#E85D2C] shrink-0 font-bold">→</span>
              <span>
                This repository's most central file is <span className="text-[#1A1D29] font-bold bg-[#E85D2C]/10 px-1.5 py-0.5 rounded border border-[#E85D2C]/30 text-[#E85D2C]">`{mostImportedFileName}`</span>, which is imported or referenced by <span className="text-[#E85D2C] font-bold">{maxImports}</span> other files.
              </span>
            </li>
          )}
          {topHotspot && (
            <li className="flex items-start gap-2.5">
              <span className="text-[#EA580C] shrink-0 font-bold">→</span>
              <span>
                The file <span className="text-[#1A1D29] font-bold bg-[#EA580C]/10 px-1.5 py-0.5 rounded border border-[#EA580C]/30 text-[#EA580C]">`{topHotspotName}`</span> has changed <span className="text-[#EA580C] font-bold">{topHotspotCommits}</span> times in its history, making it the most active and frequently modified file.
              </span>
            </li>
          )}
          {dependencies.length > 0 && (
            <li className="flex items-start gap-2.5">
              <span className="text-[#4F46E5] shrink-0 font-bold">→</span>
              <span>
                Mapped <span className="text-[#1A1D29] font-bold">{dependencies.length}</span> import connections across <span className="text-[#1A1D29] font-bold">{fileCount}</span> files, indicating a <span className="text-[#4F46E5] font-bold bg-[#4F46E5]/10 px-1.5 py-0.5 rounded border border-[#4F46E5]/30">{dependencies.length > fileCount * 1.5 ? 'highly coupled' : 'modular'}</span> codebase architecture.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="px-4 sm:px-6 pb-4 h-full min-h-0 flex flex-col">
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-2xl border border-[#E5E1DA] bg-white shadow-xs">
        <div className="w-80 flex-shrink-0 border-r border-[#E5E1DA] bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E5E1DA] flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#4F46E5] bg-[#4F46E5]/12 border border-[#4F46E5]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold inline-block">Workspace Files</span>
              <button
                onClick={() => setActiveSection('onboarding')}
                className="flex items-center gap-1 text-[10px] font-mono text-[#D97706] hover:text-[#B45309] bg-[#D97706]/10 hover:bg-[#D97706]/20 border border-[#D97706]/25 px-2 py-0.5 rounded-md transition-colors cursor-pointer font-semibold shadow-2xs"
                title="View onboarding reading order"
              >
                <Compass className="w-3 h-3" /> Reading Order
              </button>
            </div>
            <p className="text-[10px] text-[#6B7280] font-mono mt-1.5 leading-normal">
              Browse codebase folders. Select any file to generate its AI-powered description and blast radius impact analysis.
            </p>
          </div>
          <div className="flex-1 overflow-hidden relative min-h-0">
            <FileTree tree={fileTree!} onSelectFile={setSelectedFilePath} selectedFilePath={selectedFilePath} disabled={isExplainerLoading} qualityScores={qualityScoresMap} />
            {isExplainerLoading && (
              <div className="absolute bottom-2 left-2 right-2 bg-[#E85D2C]/15 border border-[#E85D2C]/30 text-[10px] text-[#E85D2C] font-mono font-semibold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 backdrop-blur-sm shadow-xs">
                <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[#E85D2C]" /> Loading explanation...
              </div>
            )}
          </div>
          <div className="p-3 border-t border-[#E5E1DA] flex justify-between text-[10px] text-[#6B7280] font-mono flex-shrink-0 bg-[#FAFAF7]/50">
            <span className="flex items-center gap-1 font-semibold text-[#1A1D29]"><Files className="w-3 h-3 text-[#4F46E5]" />{fileCount} files</span>
            <span className="font-semibold text-[#1A1D29]">{folderCount} dirs</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-w-0 p-6 bg-[#FAFAF7]">
          {selectedFilePath ? (
            <FileExplainer repoId={repoId} filePath={selectedFilePath} onClose={() => !isExplainerLoading && setSelectedFilePath('')} onLoadingStateChange={setIsExplainerLoading} onSelectFile={setSelectedFilePath} />
          ) : (
            <NotReadyState icon={<FolderTree className="w-8 h-8 text-[#4F46E5]" />} title="Select a file to inspect" detail="Click any file in the tree on the left to view its AI summary, blast radius, and dependency analysis." />
          )}
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="pt-2 sm:pt-3 px-6 pb-8 md:px-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#E85D2C] bg-[#E85D2C]/12 border border-[#E85D2C]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold inline-block">Codebase Intelligence</span>
        <h2 className="text-2xl font-bold text-[#1A1D29] mt-1.5" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Ask DevLens</h2>
        <p className="text-xs text-[#6B7280] mt-2 font-mono leading-relaxed">
          Semantic/RAG codebase search and questions. Ask architectural or behavioral questions in plain English. We scan both BM25 text keyword index and vector embeddings to extract relevant code blocks and explain them.
        </p>
      </div>
      <SemanticSearch repoId={repoId} indexingStatus={indexingStatus} chunksIndexed={chunksIndexed} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} />
    </div>
  );

  const renderArchitecture = () => (
    <div className="pt-1 px-4 sm:px-6 pb-4 sm:pb-6 w-full h-full flex flex-col min-h-0 bg-[#FAFAF7]">
      <div className="mb-4 flex-shrink-0">
        <span className="text-xs font-mono text-[#7C3AED] bg-[#7C3AED]/12 border border-[#7C3AED]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold inline-block">Dependency Graph</span>
        <h2 className="text-2xl font-bold text-[#1A1D29] mt-1.5" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Architecture Map</h2>
        <p className="text-xs text-[#6B7280] mt-2 font-mono leading-relaxed">
          Dependencies, imports, blast radius. Visual representation of file-to-file import relationships. Click any node to highlight its connections. Larger nodes Sit more centrally and have higher references.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ArchitectureMap 
          repoId={repoId} 
          dependencies={dependencies} 
          selectedFilePath={selectedFilePath} 
          onSelectFile={(path) => setSelectedFilePath(path)} 
          onViewSummary={(path) => {
            setSelectedFilePath(path);
            setActiveSection('files');
          }}
        />
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="pt-2 sm:pt-3 px-6 pb-8 md:px-8 max-w-6xl mx-auto w-full">
      <button
        onClick={() => setActiveSection('overview')}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono text-[#6B7280] hover:text-[#1A1D29] bg-white border border-[#E5E1DA] hover:border-[#1A1D29]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
      </button>
      <div className="mb-6">
        <span className="text-xs font-mono text-[#D97706] bg-[#D97706]/12 border border-[#D97706]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold inline-block">Navigation Guide</span>
        <h2 className="text-2xl font-bold text-[#1A1D29] mt-1.5" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Onboarding Guide</h2>
        <p className="text-xs text-[#6B7280] mt-2 font-mono leading-relaxed">
          Sequenced reading list generated by analyzing entry points, high-coupling helper files, and hotspots to onboard new developers into the codebase.
        </p>
      </div>
      <OnboardingGuide repoId={repoId} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} />
    </div>
  );

  const renderHealth = () => (
    <div className="pt-2 sm:pt-3 px-6 pb-8 md:px-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#059669] bg-[#059669]/12 border border-[#059669]/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-bold inline-block">Code Health</span>
        <h2 className="text-2xl font-bold text-[#1A1D29] mt-1.5" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Codebase Health</h2>
        <p className="text-xs text-[#6B7280] mt-2 font-mono leading-relaxed">
          Quality, maintainability, hotspots, risks. Maintainability ratings calculated from static analysis.
        </p>
      </div>
      <QualityScoreCard summary={qualitySummary} loading={loadingQuality} onSelectFile={(path) => { setSelectedFilePath(path); setActiveSection('files'); }} onRecompute={() => fetchQualityScores(repoId, true)} />
    </div>
  );

  const sectionContent: Record<Section, React.ReactNode> = {
    overview:     renderOverview(),
    files:        renderFiles(),
    search:       renderSearch(),
    architecture: renderArchitecture(),
    health:       renderHealth(),
    onboarding:   renderOnboarding(),
  };
  const isFullHeightSection = activeSection === 'files' || activeSection === 'architecture';

  // ── Dashboard render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#FAFAF7] text-[#1A1D29] overflow-hidden" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* Floating Primary Header with Centered Expanding Capsule Navigation */}
      <header className="relative h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 mt-4 mx-4 sm:mx-6 mb-3 rounded-2xl border border-[#E5E1DA] bg-white/95 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(26,29,41,0.06),0_1px_3px_rgba(26,29,41,0.04)] select-none z-40 transition-shadow">
        
        {/* Left: Breadcrumb (Clean & focused without tech stack clutter) */}
        <div className={`flex items-center gap-2.5 min-w-0 transition-opacity duration-250 ${isNavOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-sm tracking-tight text-[#1A1D29] hidden sm:block" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              DevLens <span className="text-[#E85D2C]">AI</span>
            </span>
            <span className="text-[#E5E1DA] hidden sm:block">/</span>
            <span className="text-sm text-[#1A1D29] font-medium truncate max-w-[140px] sm:max-w-[240px] md:max-w-[340px]">{repoName}</span>
          </div>
        </div>

        {/* Center: Dynamic Expanding Navigation Capsule (True Stadium Pill with Morphing Rounded Ends & Glowing Outline) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto py-2.5 px-6 before:absolute before:-inset-x-8 before:-inset-y-4 before:content-[''] before:pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={capsuleNavRef}
            role="navigation"
            aria-label="Codebase navigation capsule"
            aria-expanded={isNavOpen}
            className={`relative flex items-center flex-nowrap w-max rounded-full border bg-white/95 backdrop-blur-xl motion-reduce:transition-none ${
              isNavOpen
                ? 'h-10 px-3.5 py-1 border-[#E85D2C]/55 ring-1 ring-[#E85D2C]/30 shadow-[0_0_22px_3px_rgba(232,93,44,0.22),0_0_45px_8px_rgba(232,93,44,0.09),0_6px_20px_-2px_rgba(26,29,41,0.08)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
                : 'h-9 px-2 py-0.5 border-[#E5E1DA] hover:border-[#E85D2C]/40 hover:shadow-[0_0_14px_1px_rgba(232,93,44,0.15),0_2px_8px_-1px_rgba(0,0,0,0.05)] shadow-xs transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]'
            }`}
          >
            {/* Smooth Sliding Active Tab Indicator (Highlight pill + subtle underline) */}
            <div
              aria-hidden="true"
              className="absolute rounded-full bg-[#E85D2C]/10 border border-[#E85D2C]/30 shadow-xs pointer-events-none transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 motion-reduce:transition-none"
              style={{
                left: `${indicatorStyle.left}px`,
                top: `${indicatorStyle.top}px`,
                width: `${indicatorStyle.width}px`,
                height: `${indicatorStyle.height}px`,
                opacity: isNavOpen && indicatorStyle.ready && indicatorStyle.width > 0 ? 1 : 0,
                transform: isNavOpen ? 'scale(1)' : 'scale(0.95)',
              }}
            >
              {/* Subtle active underline indicator */}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#E85D2C]" />
            </div>

            {(activeSection === 'onboarding'
              ? [...NAV_ITEMS, { id: 'onboarding' as Section, label: 'Onboarding', icon: <Compass className="w-4 h-4" /> }]
              : NAV_ITEMS
            ).map((item, idx, list) => {
              const isActive = activeSection === item.id;
              const isExpanded = isNavOpen;
              const isShown = isActive || isExpanded;

              // Stagger timing:
              // Expand: 35ms per tab, progressive unfolding wave
              // Collapse: 20ms per tab in reverse, smooth inward sequence
              const expandDelay = `${idx * 35}ms`;
              const collapseDelay = `${(list.length - 1 - idx) * 20}ms`;
              const staggerDelay = isExpanded ? expandDelay : collapseDelay;

              return (
                <button
                  key={item.id}
                  ref={el => { tabRefs.current[item.id] = el; }}
                  type="button"
                  onClick={() => {
                    if (!isExpanded) {
                      // On click/tap when collapsed: toggle expand (for touch/keyboard)
                      setIsNavPinned(true);
                    } else {
                      // When expanded: navigate and collapse
                      handleSelectSection(item.id);
                    }
                  }}
                  title={isExpanded ? item.label : `Current: ${item.label} (Click or hover to expand)`}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    transitionDelay: staggerDelay,
                  }}
                  className={`group relative z-10 flex items-center gap-1.5 rounded-full text-xs font-mono font-medium cursor-pointer whitespace-nowrap overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2C] select-none motion-reduce:transition-none motion-reduce:delay-0 ${
                    isExpanded
                      ? 'h-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
                      : 'h-7 transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]'
                  } ${
                    isShown
                      ? 'max-w-[180px] opacity-100 scale-100'
                      : 'max-w-0 opacity-0 px-0 pointer-events-none scale-90 border-transparent m-0'
                  } ${
                    isShown && !isExpanded
                      ? 'px-3.5 text-[#1A1D29]'
                      : isShown && isExpanded
                      ? isActive
                        ? 'px-3 text-[#E85D2C] font-semibold'
                        : 'px-3 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#FAFAF7]'
                      : ''
                  }`}
                >
                  <span className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-[#E85D2C]' : 'text-[#6B7280] group-hover:text-[#E85D2C]'}`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap shrink-0">{item.label}</span>
                  {/* Downward chevron indicator only when collapsed */}
                  {isActive && !isExpanded && (
                    <ChevronDown className="w-3 h-3 text-[#6B7280] shrink-0 ml-0.5 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Action Controls */}
        <div className={`flex items-center gap-2.5 shrink-0 transition-opacity duration-250 ${isNavOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E85D2C]/50 bg-[#E85D2C]/10 hover:bg-[#E85D2C] text-[#E85D2C] hover:text-white text-xs font-mono font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Load another</span>
          </button>
          <a href="https://github.com/user-Rishabh/DevLens-AI" target="_blank" rel="noreferrer" className="p-1.5 text-[#6B7280] hover:text-[#1A1D29] transition-colors" title="GitHub Repository">
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Full-Width Content Area (Reclaims vertical space of second row) */}
      <main className={`flex-1 min-w-0 w-full bg-[#FAFAF7] relative ${ isFullHeightSection ? 'overflow-hidden flex flex-col' : 'overflow-y-auto' }`}>
        {/* Soft atmospheric radial blooms */}
        <div className="fixed top-12 left-0 w-[40vw] h-[40vh] rounded-full bg-[#E85D2C]/[0.02] blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-0 right-0 w-[30vw] h-[30vh] rounded-full bg-[#F4A688]/[0.02] blur-[100px] pointer-events-none z-0" />

        {/* ── Topographic Contour & Dot-Marker Background Layer (Shared foundation across all dashboard views) ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <svg
            className="w-full h-full object-cover animate-topo-drift"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1600 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="dashboard-dot-grid" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#D8D3CB" fillOpacity="0.35" />
              </pattern>

              {/* Trailing Radar Sweep Gradient */}
              <linearGradient id="radarSweepGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#E85D2C" stopOpacity="0.4" />
                <stop offset="45%" stopColor="#E85D2C" stopOpacity="0.18" />
                <stop offset="85%" stopColor="#E85D2C" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#E85D2C" stopOpacity="0" />
              </linearGradient>

              {/* Shared Topographic Contour Paths (used by Base Map & Concept 1 Traffic Flow) */}
              <path id="contour-path-1" d="M -80,160 C 200,80 400,240 700,180 C 1000,120 1200,260 1680,190" />
              <path id="contour-path-2" d="M -80,290 C 180,220 380,380 720,310 C 1020,240 1250,400 1680,330" />
              <path id="contour-path-3" d="M -80,440 C 220,360 420,520 750,450 C 1050,380 1300,530 1680,460" />
              <path id="contour-path-4" d="M -80,600 C 250,520 480,680 800,600 C 1100,520 1350,670 1680,610" />
              <path id="contour-path-5" d="M -80,760 C 280,680 520,830 850,750 C 1150,670 1400,810 1680,750" />
              <path id="contour-path-6" d="M -60,120 Q 380,460 840,320 T 1680,680" />
            </defs>

            {/* BASE LAYER: Subtle Dot Grid */}
            <rect width="100%" height="100%" fill="url(#dashboard-dot-grid)" />

            {/* BASE LAYER: Topographic Elevation Curves (Crisp Warm Gray Foundation) */}
            <g fill="none" stroke="#D5CFCA" strokeWidth="1.2">
              <use href="#contour-path-1" strokeOpacity="0.42" />
              <use href="#contour-path-2" strokeOpacity="0.38" />
              <use href="#contour-path-3" strokeOpacity="0.40" />
              <use href="#contour-path-4" strokeOpacity="0.36" />
              <use href="#contour-path-5" strokeOpacity="0.38" />
              <use href="#contour-path-6" strokeOpacity="0.32" strokeDasharray="6 6" />
            </g>

            {/* BASE LAYER: Waypoint Coordinates & Soft Nodes */}
            <circle cx="600" cy="320" r="4" fill="#E85D2C" fillOpacity="0.3" />
            <circle cx="600" cy="320" r="9" stroke="#E85D2C" strokeWidth="1" strokeOpacity="0.2" fill="none" />
            <circle cx="1150" cy="500" r="3.5" fill="#E85D2C" fillOpacity="0.25" />
            <circle cx="850" cy="540" r="3.5" fill="#3B5FE0" fillOpacity="0.22" />
            <circle cx="320" cy="480" r="3" fill="#E85D2C" fillOpacity="0.22" />
            <circle cx="1380" cy="380" r="3" fill="#3B5FE0" fillOpacity="0.2" />

            {/* ============================================================ */}
            {/* RADAR SWEEP THEME: Rotating radar scan beam, rings & blips  */}
            {/* ============================================================ */}
            <g className="concept-radar-layer" transform="translate(1260, 260)">
              {/* Concentric Radar Range Rings */}
              <circle r="90" fill="none" stroke="#E85D2C" strokeWidth="1" strokeOpacity="0.28" strokeDasharray="3 3" />
              <circle r="190" fill="none" stroke="#E85D2C" strokeWidth="1.2" strokeOpacity="0.28" />
              <circle r="310" fill="none" stroke="#E85D2C" strokeWidth="1" strokeOpacity="0.24" strokeDasharray="4 4" />
              <circle r="450" fill="none" stroke="#E85D2C" strokeWidth="1.2" strokeOpacity="0.22" />
              <circle r="600" fill="none" stroke="#E85D2C" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="6 6" />

              {/* Radar Grid Crosshairs */}
              <line x1="-600" y1="0" x2="600" y2="0" stroke="#E85D2C" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="3 6" />
              <line x1="0" y1="-600" x2="0" y2="600" stroke="#E85D2C" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="3 6" />

              {/* Rotating Radar Sweep Beam */}
              <g className="radar-sweep-beam">
                {/* Trailing Wedge / Pie Sector with fading gradient */}
                <path
                  d="M 0 0 L 590 0 A 590 590 0 0 0 510 -295 Z"
                  fill="url(#radarSweepGradient)"
                />
                {/* Crisp leading sweep line */}
                <line x1="0" y1="0" x2="590" y2="0" stroke="#E85D2C" strokeWidth="2.8" strokeLinecap="round" opacity="0.95" />
                <line x1="0" y1="0" x2="590" y2="0" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              </g>

              {/* Origin Radar Station Marker */}
              <circle r="8" fill="#E85D2C" fillOpacity="0.3" />
              <circle r="4.5" fill="#E85D2C" />
              <circle r="2" fill="#FFFFFF" />

              {/* Radar Target Blips (timed to flare as the sweep beam passes) */}
              {/* Blip 1 at ~28° (x=160, y=85) */}
              <g transform="translate(160, 85)" className="radar-blip-pulse-1">
                <circle r="14" fill="none" stroke="#E85D2C" strokeWidth="1.2" strokeOpacity="0.6" />
                <circle r="4.5" fill="#E85D2C" />
                <circle r="1.8" fill="#FFFFFF" />
              </g>
              {/* Blip 2 at ~120° (x=-130, y=225) */}
              <g transform="translate(-130, 225)" className="radar-blip-pulse-2">
                <circle r="14" fill="none" stroke="#E85D2C" strokeWidth="1.2" strokeOpacity="0.6" />
                <circle r="4.5" fill="#E85D2C" />
                <circle r="1.8" fill="#FFFFFF" />
              </g>
              {/* Blip 3 at ~210° (x=-310, y=-180) */}
              <g transform="translate(-310, -180)" className="radar-blip-pulse-3">
                <circle r="14" fill="none" stroke="#E85D2C" strokeWidth="1.2" strokeOpacity="0.6" />
                <circle r="5" fill="#E85D2C" />
                <circle r="2" fill="#FFFFFF" />
              </g>
              {/* Blip 4 at ~290° (x=140, y=-380) */}
              <g transform="translate(140, -380)" className="radar-blip-pulse-4">
                <circle r="14" fill="none" stroke="#E85D2C" strokeWidth="1.2" strokeOpacity="0.6" />
                <circle r="4.5" fill="#E85D2C" />
                <circle r="1.8" fill="#FFFFFF" />
              </g>
            </g>
          </svg>
        </div>

        <div className={`relative z-10 w-full ${ isFullHeightSection ? 'h-full flex flex-col' : '' }`}>
          {sectionContent[activeSection]}
        </div>
      </main>
    </div>
  );
}
