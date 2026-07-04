import React from 'react';

export default function EmptyState({ icon, title, description, actionButton }) {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-[#101722] border border-white/[0.05] rounded-2xl min-h-[300px]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 flex items-center justify-center text-[var(--accent-400)] text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/40 text-sm max-w-[350px] leading-relaxed mb-6">
        {description}
      </p>
      {actionButton && (
        <div>
          {actionButton}
        </div>
      )}
    </div>
  );
}
