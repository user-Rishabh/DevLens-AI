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
      <div className="text-zinc-500 text-xs italic p-6 text-center">
        No Git history hotspots found.
      </div>
    );
  }

  // Find max commits to compute relative percentage sizes
  const maxCommits = Math.max(...hotspots.map(h => h.commit_count), 1);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      {/* Header labels */}
      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono tracking-wider px-2 uppercase">
        <span>File Name & Path</span>
        <span>Commit Churn</span>
      </div>

      {/* Leaderboard entries */}
      <div className="flex flex-col gap-2">
        {hotspots.map((hotspot, idx) => {
          const percent = (hotspot.commit_count / maxCommits) * 100;
          
          // Leaderboard ranks get custom glow backgrounds
          let rankTextClass = "text-zinc-400";
          let badgeBorderClass = "bg-zinc-900/60 border-zinc-800 text-zinc-400";
          if (idx === 0) {
            rankTextClass = "text-red-400 font-bold";
            badgeBorderClass = "bg-red-500/10 border-red-500/20 text-red-400";
          } else if (idx === 1) {
            rankTextClass = "text-orange-400 font-semibold";
            badgeBorderClass = "bg-orange-500/10 border-orange-500/20 text-orange-400";
          } else if (idx === 2) {
            rankTextClass = "text-amber-400 font-medium";
            badgeBorderClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
          }

          const fileName = hotspot.path.split('/').pop() || hotspot.path;
          const directory = hotspot.path.substring(0, hotspot.path.lastIndexOf('/'));

          return (
            <div 
              key={hotspot.path}
              className="glass-panel p-3 rounded-xl hover:border-zinc-800 transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group"
            >
              {/* Soft background glow based on commit weight */}
              <div 
                className="absolute left-0 bottom-0 top-0 bg-indigo-500/[0.02] pointer-events-none transition-all duration-300"
                style={{ width: `${percent}%` }}
              />

              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Index indicator */}
                  <div className={`w-5.5 h-5.5 rounded-md border text-xs flex items-center justify-center font-mono font-bold ${badgeBorderClass} shrink-0`}>
                    {idx + 1}
                  </div>
                  
                  {/* File and Dir path */}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-zinc-200 text-xs font-semibold truncate group-hover:text-zinc-100 transition-colors duration-150">
                      {fileName}
                    </span>
                    {directory && (
                      <span className="text-[9px] text-zinc-500 truncate font-mono mt-0.5">
                        {directory}/
                      </span>
                    )}
                  </div>
                </div>

                {/* Commit counter badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <Flame className={`w-3.5 h-3.5 ${idx < 3 ? 'text-orange-500 animate-pulse' : 'text-zinc-500'}`} />
                  <span className="text-zinc-200 text-xs font-mono font-bold">
                    {hotspot.commit_count}
                  </span>
                </div>
              </div>

              {/* Progress fill bar */}
              <div className="w-full bg-zinc-900/60 rounded-full h-1 relative z-10 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    idx === 0 
                      ? 'bg-gradient-to-r from-red-500 to-orange-400' 
                      : idx === 1 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-400' 
                        : 'bg-gradient-to-r from-indigo-500 to-violet-400'
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
