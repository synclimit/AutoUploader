import React from 'react';

export default function JournalShell({ children }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#050505] overflow-hidden">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
