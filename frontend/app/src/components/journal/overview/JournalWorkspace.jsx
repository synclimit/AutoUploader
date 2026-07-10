import React from 'react';
import UploadJournal from '../components/UploadJournal';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../../store/app/appStore';

export default function JournalWorkspace() {
  const setActiveModule = useAppStore(s => s.setActiveModule);
  const journalContext = useAppStore(s => s.journalContext);
  
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-4 border-b border-white/5 bg-[#0A0A0A] p-4">
        <button
          onClick={() => setActiveModule('Dashboard')}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Campaign Upload Journal</h1>
          <p className="text-[13px] text-white/40 font-medium">Read-only historical record of all campaign upload execution outcomes</p>
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
