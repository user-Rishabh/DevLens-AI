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
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-44 bg-[#FAFAF7] rounded-md"></div>
          <div className="h-6 w-16 bg-[#FAFAF7] rounded-full"></div>
        </div>
        <div className="h-12 bg-[#FAFAF7] rounded-xl mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 bg-[#FAFAF7] rounded-lg"></div>
          <div className="h-8 bg-[#FAFAF7] rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#E85D2C]" />
            <h3 className="font-semibold text-[#1A1D29] text-sm">Code Quality Score</h3>
          </div>
          {onRecompute && (
            <button 
              onClick={onRecompute}
              className="px-2.5 py-1 text-xs bg-[#E85D2C] hover:bg-[#D44E1F] text-white rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Analyze Quality
            </button>
          )}
        </div>
        <p className="text-xs text-[#6B7280] mt-2">No code quality metrics calculated yet.</p>
      </div>
    );
  }

  const avgScore = summary.average_composite_score;
  const isHealthy = avgScore >= 80;
  const isModerate = avgScore >= 50 && avgScore < 80;

  const statusColorClass = isHealthy 
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
    : isModerate 
      ? 'text-amber-700 bg-amber-50 border-amber-200' 
      : 'text-rose-700 bg-rose-50 border-rose-200';

  const statusText = isHealthy 
    ? 'Healthy Codebase' 
    : isModerate 
      ? 'Moderate Risk' 
      : 'High Risk Area Detected';

  return (
    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
          <h3 className="font-semibold text-[#1A1D29] text-sm">Code Health & Quality Score</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {onRecompute && (
            <button 
              onClick={onRecompute}
              title="Recompute Quality Scores"
              className="p-1 text-[#6B7280] hover:text-[#1A1D29] transition-colors cursor-pointer"
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
      <div className="flex items-center justify-between bg-[#FAFAF7] border border-[#E5E1DA] rounded-xl p-3 mb-4">
        <div>
          <span className="text-[11px] text-[#6B7280] uppercase tracking-wider block">Health Rating</span>
          <span className={`text-xs font-semibold ${isHealthy ? 'text-emerald-700' : isModerate ? 'text-amber-700' : 'text-rose-700'}`}>
            {statusText}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-[#6B7280] uppercase tracking-wider block">Attention Needed</span>
          <span className="text-xs font-mono font-semibold text-[#1A1D29]">
            {summary.needs_attention_count} {summary.needs_attention_count === 1 ? 'file' : 'files'}
          </span>
        </div>
      </div>

      {/* Riskiest Files Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#1A1D29]">Riskiest Files (Lowest Health Scores)</span>
          <span className="text-[10px] text-[#6B7280] font-mono">100 = Best</span>
        </div>

        {(!summary.riskiest_files || summary.riskiest_files.length === 0) ? (
          <p className="text-xs text-[#6B7280] italic py-2">No high-risk files identified.</p>
        ) : (
          <div className="space-y-1.5">
            {(summary.riskiest_files || []).map((file) => {
              const score = file.composite_score;
              const badgeClass = score >= 80 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : score >= 50 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div 
                  key={file.file_path}
                  onClick={() => onSelectFile && onSelectFile(file.file_path)}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF7] hover:bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/40 cursor-pointer transition-all duration-150 group shadow-2xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <FileCode className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#E85D2C] shrink-0 transition-colors" />
                    <span className="text-xs font-mono text-[#1A1D29] group-hover:text-[#E85D2C] truncate">
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

