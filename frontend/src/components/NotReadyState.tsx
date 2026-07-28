import React from 'react';

export default function NotReadyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-4 text-center px-6">
      <div className="p-4 rounded-2xl bg-[#12151D] border border-[#1F2330] text-[#8A8F9C]">{icon}</div>
      <div>
        <p className="text-[#E8E9ED] text-sm font-semibold">{title}</p>
        <p className="text-[#8A8F9C] text-xs mt-1 max-w-xs leading-relaxed font-mono">{detail}</p>
      </div>
    </div>
  );
}
