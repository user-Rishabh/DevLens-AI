import React from 'react';
import { Flame } from 'lucide-react';

export interface HotspotType {
  path: string;
  commit_count: number;
}

interface HotspotListProps {
  hotspots: HotspotType[];
}

export default function HotspotList({ hotspots }: HotspotListProps) {
  if (!hotspots || hotspots.length === 0) {
    return (
      <div className="text-[#6B7280] text-xs italic p-6 text-center">
        No frequently changed files found.
      </div>
    );
  }

  // Find max commits to compute relative percentage sizes
  const maxCommits = Math.max(...hotspots.map(h => h.commit_count), 1);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-1.5 scrollbar-thin scrollbar-thumb-[#E5E1DA] scrollbar-track-transparent">
      {/* Header labels */}
      <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-mono tracking-wider px-2 uppercase">
        <span>File Name & Path</span>
        <span>Commit Churn</span>
      </div>

      {/* Leaderboard entries */}
      <div className="flex flex-col gap-2">
        {hotspots.map((hotspot, idx) => {
          const percent = (hotspot.commit_count / maxCommits) * 100;
          
          // Leaderboard ranks get custom styling
          let rankBadgeClass = "bg-[#FAFAF7] border-[#E5E1DA] text-[#6B7280]";
          if (idx === 0) {
            rankBadgeClass = "bg-rose-50 border-rose-200 text-rose-700 font-bold";
          } else if (idx === 1) {
            rankBadgeClass = "bg-orange-50 border-orange-200 text-orange-700 font-bold";
          } else if (idx === 2) {
            rankBadgeClass = "bg-amber-50 border-amber-200 text-amber-700 font-bold";
          }

          const fileName = hotspot.path.split('/').pop() || hotspot.path;
          const directory = hotspot.path.substring(0, hotspot.path.lastIndexOf('/'));

          return (
            <div 
              key={hotspot.path}
              className="bg-white border border-[#E5E1DA] p-3.5 rounded-xl hover:border-[#E85D2C]/40 shadow-xs transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group"
            >
              {/* Soft background glow based on commit weight */}
              <div 
                className="absolute left-0 bottom-0 top-0 bg-[#E85D2C]/[0.03] pointer-events-none transition-all duration-300"
                style={{ width: `${percent}%` }}
              />

              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Index indicator */}
                  <div className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center font-mono font-bold ${rankBadgeClass} shrink-0`}>
                    {idx + 1}
                  </div>
                  
                  {/* File and Dir path */}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-[#1A1D29] text-xs font-semibold truncate group-hover:text-[#E85D2C] transition-colors duration-150">
                      {fileName}
                    </span>
                    {directory && (
                      <span className="text-[9px] text-[#6B7280] truncate font-mono mt-0.5">
                        {directory}/
                      </span>
                    )}
                  </div>
                </div>

                {/* Commit counter badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <Flame className={`w-3.5 h-3.5 ${idx < 3 ? 'text-[#E85D2C] animate-pulse' : 'text-[#6B7280]'}`} />
                  <span className="text-[#1A1D29] text-xs font-mono font-bold">
                    {hotspot.commit_count}
                  </span>
                </div>
              </div>

              {/* Progress fill bar */}
              <div className="w-full bg-[#E5E1DA] rounded-full h-1.5 relative z-10 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    idx === 0 
                      ? 'bg-gradient-to-r from-rose-500 to-[#E85D2C]' 
                      : idx === 1 
                        ? 'bg-gradient-to-r from-[#E85D2C] to-amber-500' 
                        : 'bg-gradient-to-r from-amber-500 to-amber-400'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

