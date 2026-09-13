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
import { API_BASE_URL } from '../lib/apiClient';

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

      try {
        console.log(`[DevLens AI] Fetching onboarding guide for repo: "${repoId}"`);
        const response = await fetch(`${API_BASE_URL}/api/repos/${repoId}/onboarding-guide`);
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
          bgClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          icon: <Layers className="w-3.5 h-3.5 text-indigo-600" />,
          glowClass: 'bg-indigo-500/[0.02]'
        };
      case 'structural':
        return {
          label: 'Core Abstraction',
          bgClass: 'bg-cyan-50 border-cyan-200 text-cyan-700',
          icon: <Network className="w-3.5 h-3.5 text-cyan-600" />,
          glowClass: 'bg-cyan-500/[0.02]'
        };
      case 'hotspot':
        return {
          label: 'Active Business Logic',
          bgClass: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
          glowClass: 'bg-rose-500/[0.02]'
        };
      default:
        return {
          label: 'Module',
          bgClass: 'bg-[#FAFAF7] border-[#E5E1DA] text-[#6B7280]',
          icon: <BookOpen className="w-3.5 h-3.5 text-[#6B7280]" />,
          glowClass: 'bg-zinc-500/[0.01]'
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Loading Spinner */}
      {loading && (
        <div className="bg-white border border-[#E5E1DA] p-12 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
          <Loader2 className="w-10 h-10 text-[#E85D2C] animate-spin mb-4" />
          <h4 className="text-[#1A1D29] font-semibold text-sm">Generating Reading Order</h4>
          <p className="text-[#6B7280] text-xs mt-1.5 leading-relaxed max-w-xs font-mono">
            Evaluating entry-point conventions, import hierarchy weights, and Git commits to build recommendations...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-rose-100 border border-rose-200 rounded-xl text-rose-600 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-rose-800 font-semibold text-sm">Failed to Generate Guide</h4>
          <p className="text-rose-700 text-xs mt-2 max-w-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Guide Content */}
      {!loading && !error && guideData && (
        <>
          {/* Summary Box */}
          <div className="bg-white border border-[#E5E1DA] p-6 rounded-2xl relative overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-[#E85D2C] pointer-events-none">
              <Compass className="w-24 h-24" />
            </div>
            
            <span className="text-[10px] text-[#E85D2C] font-mono font-semibold uppercase tracking-wider">AI Architectural Overview</span>
            <h3 className="text-[#1A1D29] font-extrabold text-lg mt-0.5 mb-3">Codebase Structure</h3>
            <p className="text-[#1A1D29] text-xs leading-relaxed font-normal bg-[#FAFAF7] p-4 rounded-xl border border-[#E5E1DA]">
              {guideData.summary}
            </p>
          </div>

          {/* Reading List Header */}
          <div>
            <h4 className="text-sm font-bold text-[#1A1D29] mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#E85D2C]" />
              Suggested Reading Order
            </h4>
            <p className="text-[10px] text-[#6B7280]">
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
                  className="bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/40 p-4 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative overflow-hidden group active:scale-[0.99]"
                >
                  {/* Soft background glow based on category */}
                  <div className={`absolute inset-0 ${meta.glowClass} pointer-events-none`} />

                  <div className="flex items-start gap-4 min-w-0 relative z-10">
                    {/* Number Badge */}
                    <div className="w-7 h-7 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA] text-xs font-mono font-bold flex items-center justify-center text-[#6B7280] group-hover:text-[#E85D2C] group-hover:border-[#E85D2C]/30 transition-all shrink-0">
                      {idx + 1}
                    </div>

                    {/* File Path & Reason */}
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-[#1A1D29] text-xs font-bold truncate group-hover:text-[#E85D2C] transition-colors">
                          {fileName}
                        </span>
                        {directory && (
                          <span className="text-[9px] text-[#6B7280] truncate font-mono">
                            {directory}/
                          </span>
                        )}
                      </div>
                      <p className="text-[#6B7280] text-[11px] leading-relaxed pr-2">
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
                    <div className="p-1 text-[#6B7280] group-hover:text-[#E85D2C] group-hover:translate-x-0.5 transition-all hidden sm:block">
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
