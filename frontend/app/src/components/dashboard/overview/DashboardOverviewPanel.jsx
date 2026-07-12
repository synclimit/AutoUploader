import React from 'react';
import UploadJournal from '../../journal/components/UploadJournal';
import { useAppStore } from '../../../store/app/appStore';

export default function DashboardOverviewPanel() {
  const journalContext = useAppStore(s => s.journalContext);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-4 border-b border-white/5 bg-[#0A0A0A] p-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Dashboard & Upload Journal</h1>
          <p className="text-[13px] text-white/40 font-medium">Real-time telemetry and historical record of all campaign upload execution outcomes</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-6 bg-[#050505]">
        <div className="h-full rounded-xl border border-white/5 bg-[#0A0A0A] overflow-hidden">
            <UploadJournal 
              initialSessionId={journalContext?.sessionId} 
              initialChannelId={journalContext?.channelId} 
            />
        </div>
      </div>
    </div>
  );
}
