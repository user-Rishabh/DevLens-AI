import React, { useEffect, useState, useRef } from 'react';
import { 
  Compass, 
  Flame, 
  Layers, 
  Network, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface ReadingOrderItem {
  file_path: string;
  reason: string;
  category: 'entry_point' | 'structural' | 'hotspot';
}

interface OnboardingGuideData {
  reading_order: ReadingOrderItem[];
  summary: string;
}

interface OnboardingGuideProps {
  repoId: string;
  onSelectFile: (filePath: string) => void;
}

export default function OnboardingGuide({ repoId, onSelectFile }: OnboardingGuideProps) {
  const [loading, setLoading] = useState(false);
  const [guideData, setGuideData] = useState<OnboardingGuideData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const loadingRef = useRef('');

  useEffect(() => {
    if (!repoId) return;

    // Guard: ignore if a request for this repo is already running
    if (loadingRef.current === repoId) return;

    const fetchOnboardingGuide = async () => {
      loadingRef.current = repoId;
      setLoading(true);
      setError(null);
      setGuideData(null);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      try {
        console.log(`[DevLens AI] Fetching onboarding guide for repo: "${repoId}"`);
        const response = await fetch(`${apiUrl}/api/repos/${repoId}/onboarding-guide`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to fetch onboarding guide.');
        }

        setGuideData(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while generating the onboarding guide.');
      } finally {
        setLoading(false);
        loadingRef.current = '';
      }
    };

    fetchOnboardingGuide();
  }, [repoId]);

  // Helper to render badge styles & icons
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'entry_point':
        return {
          label: 'Entry Point',
          bgClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          icon: <Layers className="w-3.5 h-3.5" />,
          glowClass: 'bg-indigo-500/[0.01]'
        };
      case 'structural':
        return {
          label: 'Core Abstraction',
          bgClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          icon: <Network className="w-3.5 h-3.5" />,
          glowClass: 'bg-cyan-500/[0.01]'
        };
      case 'hotspot':
        return {
          label: 'Active Business Logic',
          bgClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />,
          glowClass: 'bg-rose-500/[0.01]'
        };
      default:
        return {
          label: 'Module',
          bgClass: 'bg-zinc-500/10 border-zinc-800 text-zinc-400',
          icon: <BookOpen className="w-3.5 h-3.5" />,
          glowClass: 'bg-zinc-500/[0.01]'
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Loading Spinner */}
      {loading && (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center shadow-xl">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <h4 className="text-white font-semibold text-sm">Generating Reading Order</h4>
          <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed max-w-xs font-mono">
            Evaluating entry-point conventions, import hierarchy weights, and Git commits to build recommendations...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center border border-red-950/20">
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-red-300 font-semibold text-sm">Failed to Generate Guide</h4>
          <p className="text-red-400/90 text-xs mt-2 max-w-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Guide Content */}
      {!loading && !error && guideData && (
        <>
          {/* Summary Box */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-indigo-400 pointer-events-none">
              <Compass className="w-24 h-24" />
            </div>
            
            <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase tracking-wider">AI Architectural Overview</span>
            <h3 className="text-white font-extrabold text-lg mt-0.5 mb-3">Codebase Structure</h3>
            <p className="text-zinc-300 text-xs leading-relaxed font-normal bg-zinc-950/20 p-4 rounded-xl border border-zinc-900/60">
              {guideData.summary}
            </p>
          </div>

          {/* Reading List Header */}
          <div>
            <h4 className="text-sm font-bold text-zinc-100 mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Suggested Reading Order
            </h4>
            <p className="text-[10px] text-zinc-500">
              Start with the initial setup controllers, study high-use schemas next, then review frequently modified logic.
            </p>
          </div>

          {/* Reading List Cards */}
          <div className="flex flex-col gap-3">
            {guideData.reading_order.map((item, idx) => {
              const meta = getCategoryMeta(item.category);
              const fileName = item.file_path.split('/').pop() || item.file_path;
              const directory = item.file_path.substring(0, item.file_path.lastIndexOf('/'));

              return (
                <div 
                  key={item.file_path}
                  onClick={() => onSelectFile(item.file_path)}
                  className="glass-panel p-4 rounded-xl border border-zinc-900/80 hover:border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/35 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative overflow-hidden group active:scale-[0.99]"
                >
                  {/* Soft background glow based on category */}
                  <div className={`absolute inset-0 ${meta.glowClass} pointer-events-none`} />

                  <div className="flex items-start gap-4 min-w-0 relative z-10">
                    {/* Number Badge */}
                    <div className="w-7 h-7 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/25 transition-all shrink-0">
                      {idx + 1}
                    </div>

                    {/* File Path & Reason */}
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-zinc-200 text-xs font-bold truncate group-hover:text-white transition-colors">
                          {fileName}
                        </span>
                        {directory && (
                          <span className="text-[9px] text-zinc-500 truncate font-mono">
                            {directory}/
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed pr-2">
                        {item.reason}
                      </p>
                    </div>
                  </div>

                  {/* Category Badge & Action Arrow */}
                  <div className="flex items-center gap-3 justify-end shrink-0 relative z-10 self-end sm:self-center">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[9px] font-semibold uppercase tracking-wider select-none ${meta.bgClass}`}>
                      {meta.icon}
                      {meta.label}
                    </div>
                    <div className="p-1 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all hidden sm:block">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
