import { useState, useMemo, useEffect } from 'react'
import apiClient from '../../../api/client'
import { useAppStore } from '../../../store/app/appStore'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useQueueStore } from '../../../store/upload/uploadStore'
import { showToast } from '../../common/NotificationToast'
import ChannelPickerDialog from './ChannelPickerDialog'
import UploadDropZone from './UploadDropZone'
import UploadQueueItem from './UploadQueueItem'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function UploadsOverviewPanel() {
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  const { accounts, fetchAccounts } = useAccountsStore()
  const { tasks, fetchTasks, createTask } = useQueueStore()

  useEffect(() => {
    fetchAccounts()
    fetchTasks()
    const interval = setInterval(() => {
      fetchTasks()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const selectedChannel = useMemo(() => accounts.find(c => c.id === selectedChannelId), [selectedChannelId, accounts])

  const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'WATCHED' || t.status === 'REVIEW'), [tasks])
  const importedFilesForChannel = selectedChannelId ? pendingTasks.filter(t => t.account_id === selectedChannelId) : []

  const handleFilesImported = async (files) => {
    if (!selectedChannelId) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('account_id', selectedChannelId);

      Array.from(files).forEach(file => {
        const path = file.customPath || file.webkitRelativePath || file.name;
        formData.append('files', file, path);
      });

      const response = await apiClient.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      let message = 'Import finished.';
      if (response && response.imported !== undefined) {
        message = `Imported: ${response.imported}, Duplicates: ${response.duplicates}, Errors: ${response.errors}`;
      }
      showToast(message, 'success', 4000);
    } catch (err) {
      console.error('Import Error:', err);
      showToast(`Import failed: ${err.message}`, 'error', 4000);
    } finally {
      setIsUploading(false);
      fetchTasks();
    }
  }

  const handleContinueToReview = () => {
    setActiveModule('Review')
  }

  return (
    <div className="flex-1 h-full overflow-hidden px-6 pb-6 pt-2 flex flex-col gap-4 relative">
      
      {/* Global Dashboard Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--accent-500)]/5 blur-[150px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full z-0 pointer-events-none"></div>

      {isPickerOpen && (
        <ChannelPickerDialog 
          channels={accounts} 
          selectedId={selectedChannelId} 
          onSelect={(id) => { setSelectedChannelId(id); setIsPickerOpen(false); }} 
          onClose={() => setIsPickerOpen(false)} 
        />
      )}

      <div className="relative z-10 flex flex-col h-full min-h-0">
        
        {/* Header / Hero */}
        <div className="relative w-full min-h-[90px] rounded-[24px] overflow-hidden flex items-center bg-[#05080e]/60 backdrop-blur-2xl border border-[var(--accent-500)]/20 shadow-[0_8px_32px_rgba(34,211,238,0.05)] shrink-0 my-2 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a]/80 via-[#0d1624]/60 to-[#0a141e]/80 z-0 transition-colors duration-500"></div>
          
          <div className={`absolute top-[-50%] right-[0%] w-[400px] h-[400px] bg-[var(--accent-400)]/15 blur-[120px] rounded-full z-0 pointer-events-none transition-opacity duration-500 ${selectedChannel ? 'opacity-100' : 'opacity-30'}`}></div>
          
          <svg className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none" viewBox="0 0 1000 110" preserveAspectRatio="none">
            <path d="M0,55 Q250,100 500,55 T1000,55" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.4" filter="url(#glowImport)" className="transition-all duration-500"/>
            <path d="M0,75 Q250,25 500,75 T1000,75" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.2" className="transition-all duration-500"/>
            <defs>
              <filter id="glowImport" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </svg>

          <div className="relative z-10 px-8 flex-1 flex flex-col justify-center h-full">
            <div className="text-white text-[20px] font-bold tracking-tight drop-shadow-md">Import Videos</div>
          </div>
        </div>

        {/* Upload Destination Bar - Constant Layout */}
        <div className="flex items-center gap-4 shrink-0 mb-3 bg-[#05080e]/80 backdrop-blur-md border border-white/[0.05] px-5 py-3 rounded-[16px] transition-all">
          <div className="text-white/50 text-[12px] font-bold uppercase tracking-wider shrink-0">Uploading To</div>
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${
              selectedChannel 
                ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] shadow-[0_0_15px_var(--color-primary-cyan)] border border-[var(--accent-500)]/40'
                : 'bg-white/[0.05] text-white/20'
            }`}>
              {selectedChannel ? selectedChannel.channel_name.charAt(0) : '?'}
            </div>
            
            <span className={`font-bold text-[15px] tracking-wide transition-colors ${
              selectedChannel ? 'text-white' : 'text-white/40'
            }`}>
              {selectedChannel ? selectedChannel.channel_name : 'No Channel Selected'}
            </span>

            {selectedChannel && (
              <div className="flex items-center gap-1.5 mx-1 animate-in fade-in duration-300">
                <CheckCircle2 size={14} strokeWidth={3} className="text-green-400" />
                <span className="text-green-400/80 text-[11px] font-bold uppercase tracking-wider">Connected</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsPickerOpen(true)}
            className={`ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all font-bold text-[12px] uppercase tracking-wider ${
              selectedChannel
                ? 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-white/80 hover:text-white'
                : 'bg-[var(--accent-500)]/20 hover:bg-[var(--accent-500)]/30 border border-[var(--accent-500)]/30 text-[var(--accent-400)] hover:shadow-[0_0_15px_var(--color-primary-cyan)]'
            }`}
          >
            {selectedChannel ? 'Change' : 'Select Channel'}
          </button>

          {/* Minimal Watch Folder Status */}
          <div className="ml-auto flex items-center gap-3">
             <span className="text-white/30 text-[11px] font-bold uppercase tracking-wider">Watch Folder</span>
             {selectedChannel?.watch_folder ? (
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[12px] font-medium animate-in fade-in duration-300">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                 Watching <span className="font-mono text-blue-300/70 ml-1 text-[11px]">{selectedChannel.watch_folder}</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-white/[0.03] border border-white/[0.05] text-white/30 text-[12px] font-medium transition-colors">
                 Inactive
               </div>
             )}
          </div>
        </div>

        {/* Workspace: Drop Zone & Queue */}
        <div className="flex-1 flex gap-5 min-h-0 animate-in fade-in duration-300">
          
          {/* Main Drop Area */}
          <div className="flex-[3] flex flex-col min-h-0">
             <UploadDropZone 
               onFilesSelected={handleFilesImported} 
               disabled={!selectedChannelId} 
               onSelectChannelRequest={() => setIsPickerOpen(true)}
               isUploading={isUploading}
               uploadProgress={uploadProgress}
             />
          </div>

          {/* Queue List (Only visible if files exist and channel is selected) */}
          {importedFilesForChannel.length > 0 && selectedChannelId && (
            <div className="flex-[2] flex flex-col bg-[#05080e]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="px-5 py-4 border-b border-white/[0.05] bg-black/10 shrink-0 flex justify-between items-center">
                 <div className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Imported Files ({importedFilesForChannel.length})</div>
                 <button onClick={() => fetchTasks()} className="text-[var(--accent-400)] hover:text-[var(--accent-400)] text-[11px] font-bold uppercase tracking-wider transition-colors">Refresh</button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2 min-h-0">
                 {importedFilesForChannel.map((file) => (
                   <UploadQueueItem key={file.id} file={file} channelName={selectedChannel?.channel_name} />
                 ))}
               </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        {importedFilesForChannel.length > 0 && selectedChannelId && (
          <div className="shrink-0 pt-4 flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={handleContinueToReview}
              className="px-8 py-3.5 rounded-[16px] bg-gradient-to-r from-cyan-400 to-cyan-500 border border-[var(--accent-400)]/50 text-[#05070b] font-bold text-[14px] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition-all flex items-center gap-2 group"
            >
              Continue to Review
              <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
