import React from 'react';

export default function NotReadyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-4 text-center px-6">
      <div className="p-4 rounded-2xl bg-white border border-[#E5E1DA] text-[#6B7280] shadow-xs">{icon}</div>
      <div>
        <p className="text-[#1A1D29] text-sm font-semibold">{title}</p>
        <p className="text-[#6B7280] text-xs mt-1 max-w-xs leading-relaxed font-mono">{detail}</p>
      </div>
    </div>
  );
}

