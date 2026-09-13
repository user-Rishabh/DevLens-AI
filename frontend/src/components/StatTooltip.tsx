import React from 'react';

export default function StatTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex items-center ml-1.5 text-[#6B7280] hover:text-[#1A1D29] cursor-help select-none">
      <span className="text-[10px] font-mono leading-none">ⓘ</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-white border border-[#E5E1DA] text-[10px] text-[#1A1D29] font-mono leading-normal shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
        {text}
      </div>
    </div>
  );
}

