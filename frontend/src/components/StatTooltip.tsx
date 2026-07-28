import React from 'react';

export default function StatTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex items-center ml-1.5 text-zinc-500 hover:text-zinc-300 cursor-help select-none">
      <span className="text-[10px] font-mono leading-none">ⓘ</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-[#12151D] border border-[#1F2330] text-[10px] text-zinc-400 font-mono leading-normal shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
        {text}
      </div>
    </div>
  );
}
