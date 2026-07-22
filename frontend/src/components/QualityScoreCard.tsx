import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, FileCode, RefreshCw } from 'lucide-react';

export interface QualityScoreItem {
  file_path: string;
  composite_score: number;
  churn_score: number;
  size_score: number;
  complexity_score: number;
}

export interface QualityScoreSummary {
  repo_id: string;
  file_count: number;
  average_composite_score: number;
  needs_attention_count: number;
  riskiest_files: QualityScoreItem[];
}

interface QualityScoreCardProps {
  summary: QualityScoreSummary | null;
  loading?: boolean;
  onSelectFile?: (path: string) => void;
  onRecompute?: () => void;
}

export default function QualityScoreCard({ summary, loading, onSelectFile, onRecompute }: QualityScoreCardProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-44 bg-zinc-800 rounded-md"></div>
          <div className="h-6 w-16 bg-zinc-800 rounded-full"></div>
        </div>
        <div className="h-12 bg-zinc-800/50 rounded-xl mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 bg-zinc-800/30 rounded-lg"></div>
          <div className="h-8 bg-zinc-800/30 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Code Quality Score</h3>
          </div>
          {onRecompute && (
            <button 
              onClick={onRecompute}
              className="px-2.5 py-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all"
            >
              Analyze Quality
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-2">No code quality metrics calculated yet.</p>
      </div>
    );
  }

  const avgScore = summary.average_composite_score;
  const isHealthy = avgScore >= 80;
  const isModerate = avgScore >= 50 && avgScore < 80;

  const statusColorClass = isHealthy 
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
    : isModerate 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const statusText = isHealthy 
    ? 'Healthy Codebase' 
    : isModerate 
      ? 'Moderate Risk' 
      : 'High Risk Area Detected';

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <h3 className="font-semibold text-zinc-100 text-sm">Code Health & Quality Score</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {onRecompute && (
            <button 
              onClick={onRecompute}
              title="Recompute Quality Scores"
              className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${statusColorClass}`}>
            {avgScore}/100
          </span>
        </div>
      </div>

      {/* Overview Status Bar */}
      <div className="flex items-center justify-between bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 mb-4">
        <div>
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Health Rating</span>
          <span className={`text-xs font-semibold ${isHealthy ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'}`}>
            {statusText}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Attention Needed</span>
          <span className="text-xs font-mono font-semibold text-zinc-200">
            {summary.needs_attention_count} {summary.needs_attention_count === 1 ? 'file' : 'files'}
          </span>
        </div>
      </div>

      {/* Riskiest Files Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400">Riskiest Files (Lowest Composite Scores)</span>
          <span className="text-[10px] text-zinc-500 font-mono">100 = Best</span>
        </div>

        {summary.riskiest_files.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">No high-risk files identified.</p>
        ) : (
          <div className="space-y-1.5">
            {summary.riskiest_files.map((file) => {
              const score = file.composite_score;
              const badgeClass = score >= 80 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : score >= 50 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

              return (
                <div 
                  key={file.file_path}
                  onClick={() => onSelectFile && onSelectFile(file.file_path)}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/30 hover:bg-zinc-800/40 border border-zinc-800/30 cursor-pointer transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <FileCode className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 shrink-0 transition-colors" />
                    <span className="text-xs font-mono text-zinc-300 group-hover:text-zinc-100 truncate">
                      {file.file_path}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
