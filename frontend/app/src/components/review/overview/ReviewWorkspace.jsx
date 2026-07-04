import { useState, useMemo, useEffect, useRef } from 'react'
import { Filter, ChevronDown, Sparkles, Clock, Trash2, Save, CloudUpload, RotateCcw } from 'lucide-react'
import ReviewVideoRow from './ReviewVideoRow'
import ReviewCenterPanel from './ReviewCenterPanel'
import ReviewMetadataPanel from './ReviewMetadataPanel'
import ChannelPickerDialog from '../../uploads/overview/ChannelPickerDialog'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useQueueStore } from '../../../store/upload/uploadStore'
import { showToast } from '../../common/NotificationToast'
import Select from '../../common/Select'

export default function ReviewWorkspace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [isChannelPickerOpen, setIsChannelPickerOpen] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(false)


  const { accounts, fetchAccounts } = useAccountsStore()
  const { tasks, fetchTasks, activeTask, setActiveTask, approveTask, updateTask, deleteTask, cancelTask, filters, setFilters, fetchTask, fetchTaskLogs } = useQueueStore()

  useEffect(() => {
    fetchAccounts()
    // Default whitelist for Review Workspace
    setFilters({ ...filters, status: ['WATCHED', 'REVIEW', 'WAITING', 'WAITING_AI', 'SCHEDULED', 'QUEUED'] })
    fetchTasks()
    // eslint-disable-next-line
  }, [])

  // Runtime Polling & State Watcher
  useEffect(() => {
    let intervalId;
    if (activeTask && (activeTask.status === 'QUEUED' || activeTask.status === 'UPLOADING' || activeTask.status === 'SCHEDULED')) {
      intervalId = setInterval(() => {
        fetchTask(activeTask.id);
        fetchTaskLogs(activeTask.id);
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [activeTask?.id, activeTask?.status, fetchTask, fetchTaskLogs]);

  // Automated Toast Notifications
  const prevStatusRef = useRef(activeTask?.status);
  useEffect(() => {
    if (activeTask && prevStatusRef.current && prevStatusRef.current !== activeTask.status) {
      if (activeTask.status === 'QUEUED') showToast('Task Approved & Queued', 'success');
      else if (activeTask.status === 'UPLOADING') showToast('Upload Started...', 'info');
      else if (activeTask.status === 'COMPLETED') showToast('Upload Completed Successfully', 'success');
      else if (activeTask.status === 'FAILED') showToast('Upload Failed', 'error');
    }
    prevStatusRef.current = activeTask?.status;
  }, [activeTask?.status]);

  const [selectedVideoIds, setSelectedVideoIds] = useState([])
  const [edits, setEdits] = useState({})

  useEffect(() => {
    setEdits({})
  }, [activeTask?.id])

  const filteredVideos = useMemo(() => {
    // The main filtering is done in the backend. 
    // We can do a small client-side filter just in case the backend hasn't reloaded yet, but ideally it's direct.
    return tasks
  }, [tasks])

  // Map to format expected by UI components
  const mappedVideos = filteredVideos.map(v => ({
    ...v,
    channelName: accounts.find(c => c.id === v.account_id)?.channel_name || 'Unknown Channel',
    channelLogo: accounts.find(c => c.id === v.account_id)?.avatar_url || null,
    duration: '00:00', // Need metadata parsing
    resolution: '1080p',
    size: 'Unknown'
  }))

  const activeVideoProps = useMemo(() => {
    if (!activeTask) return null;
    return {
      ...activeTask,
      channelName: accounts.find(c => c.id === activeTask.account_id)?.channel_name || 'Unknown Channel',
      channelLogo: accounts.find(c => c.id === activeTask.account_id)?.avatar_url || null,
      duration: '00:00',
      resolution: '1080p',
      size: 'Unknown'
    }
  }, [activeTask, accounts])

  useEffect(() => {
    if (activeTask) {
      const stillExists = filteredVideos.some(v => v.id === activeTask.id);
      if (!stillExists) {
        if (filteredVideos.length > 0) {
          setActiveTask(filteredVideos[0]);
        } else {
          setActiveTask(null);
        }
      }
    } else if (filteredVideos.length > 0) {
      setActiveTask(filteredVideos[0]);
    }
  }, [filteredVideos, activeTask, setActiveTask]);

  const handleToggleSelect = (id) => {
    setSelectedVideoIds(prev => 
      prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
    )
  }

  const handleRowClick = (id) => {
    const task = tasks.find(t => t.id === id)
    if (task) setActiveTask(task)
  }

  const handleBulkApprove = async () => {
    // Save current active edits if the active task is among the selected ones
    if (activeTask && selectedVideoIds.includes(activeTask.id) && Object.keys(edits).length > 0) {
      await updateTask(activeTask.id, edits);
      setEdits({});
    }

    for (const id of selectedVideoIds) {
      await approveTask(id);
    }
    setSelectedVideoIds([]);
  }

  const handleBulkReject = async () => {
    for (const id of selectedVideoIds) {
      await deleteTask(id);
    }
    setSelectedVideoIds([]);
  }

  const handleRejectActive = async () => {
    if (activeTask) {
      await deleteTask(activeTask.id);
    }
  }

  return (
    <div className="flex-1 h-full overflow-hidden px-5 py-2 flex flex-col relative bg-[#05080e]">
      
      {isChannelPickerOpen && (
          <ChannelPickerDialog 
          channels={accounts}
          selectedId={selectedChannelId}
          onSelect={(id) => { 
            setSelectedChannelId(id); 
            setIsChannelPickerOpen(false);
            setFilters({ ...filters, account_id: id });
            fetchTasks();
          }}
          onClose={() => setIsChannelPickerOpen(false)}
        />
      )}
      
      {isLogOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogOpen(false)}></div>
          <div className="w-[450px] h-full bg-[#05080e] border-l border-white/[0.04] relative z-10 p-6 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="text-[16px] font-bold text-white mb-6">Activity Log</div>
            
            {activeTask && (
              <div className="mb-6 p-4 bg-white/[0.02] border border-white/[0.05] rounded-[8px] flex flex-col gap-2 text-[12px] text-white/70">
                <div className="flex justify-between">
                  <span className="text-white/40">Channel:</span>
                  <span className="font-medium">{accounts.find(a => a.id === activeTask.account_id)?.channel_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Import Method:</span>
                  <span>{activeTask.source_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Video ID:</span>
                  <span>{activeTask.video_id}</span>
                </div>
                {activeTask.youtube_url && (
                  <div className="flex justify-between">
                    <span className="text-white/40">YouTube:</span>
                    <a href={activeTask.youtube_url} target="_blank" rel="noreferrer" className="text-[var(--accent-400)] hover:underline">Link</a>
                  </div>
                )}
                {activeTask.started_at && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Upload Started:</span>
                    <span>{new Date(activeTask.started_at).toLocaleString()}</span>
                  </div>
                )}
                {activeTask.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Completed:</span>
                    <span>{new Date(activeTask.completed_at).toLocaleString()}</span>
                  </div>
                )}
                {activeTask.failure_reason && (
                  <div className="flex justify-between text-red-400 mt-2 p-2 bg-red-500/10 rounded-[4px] border border-red-500/20">
                    <span className="font-bold mr-2">Error:</span>
                    <span className="break-all">{activeTask.failure_reason}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {!activeTask ? (
                <div className="text-[12px] text-white/40">Select a task first</div>
              ) : (
                useQueueStore.getState().logs.map((log, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[12px] font-bold ${log.status === 'FAILED' ? 'text-red-400' : 'text-[var(--accent-400)]'}`}>{log.status}</span>
                      <span className="text-[10px] text-white/40">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-white/60 leading-relaxed">{log.message}</div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setIsLogOpen(false)} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-[8px] text-white text-[12px] font-bold neon-interactive">Close</button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between shrink-0 mb-3 border-b border-white/[0.05] pb-3">
        
        {/* Filters */}
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-white/40 mr-1">Channel</span>
          <button onClick={() => setIsChannelPickerOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-white/[0.08] bg-white/[0.02] text-white/80 hover:bg-white/[0.05] transition-colors neon-interactive">
            {selectedChannelId ? accounts.find(c => c.id === selectedChannelId)?.channel_name : 'All Channels'}
            <ChevronDown size={14} className="opacity-50" />
          </button>
          
          <span className="text-white/40 ml-2 mr-1">Status</span>
          <Select
            value={filters?.status?.length === 1 ? filters.status[0] : (filters?.status?.length > 1 ? "REVIEW_QUEUE" : "ALL")}
            onChange={(val) => {
              let newStatus = [];
              if (val === "REVIEW_QUEUE") {
                newStatus = ['WATCHED', 'REVIEW', 'WAITING', 'WAITING_AI', 'SCHEDULED', 'QUEUED'];
              } else if (val === "ALL") {
                newStatus = [];
              } else if (val) {
                newStatus = [val];
              }
              setFilters({ ...filters, status: newStatus });
              fetchTasks();
            }}
            options={[
              {val: "REVIEW_QUEUE", label: "Needs Attention (Default)"},
              {val: "ALL", label: "Show All (Global)"},
              {val: "REVIEW", label: "Needs Review"},
              {val: "WATCHED", label: "Watched"},
              {val: "SCHEDULED", label: "Scheduled"},
              {val: "QUEUED", label: "Queued"},
              {val: "UPLOADING", label: "Uploading"},
              {val: "COMPLETED", label: "Completed"},
              {val: "FAILED", label: "Failed"},
              {val: "CANCELLED", label: "Cancelled"}
            ]}
            className="w-[180px]"
          />

          <span className="text-white/40 ml-2 mr-1">Import Method</span>
          <Select
            value={filters?.source_type || ""}
            onChange={(val) => {
              setFilters({ ...filters, source_type: val || undefined });
              fetchTasks();
            }}
            options={[
              {val: "", label: "All Methods"},
              {val: "MANUAL_UPLOAD", label: "Manual Upload"},
              {val: "M1_VIDEO_SPLITTER", label: "Watch Folder (M1)"},
              {val: "M3_PLAYLIST_BUILDER", label: "Playlist Builder (M3)"}
            ]}
            className="w-[160px]"
          />

          <span className="text-white/40 ml-2 mr-1">Sort By</span>
          <Select
            value={`${filters?.sort_by || 'created_at'}:${filters?.sort_order || 'desc'}`}
            onChange={(val) => {
              const parts = val.split(':');
              setFilters({ ...filters, sort_by: parts[0], sort_order: parts[1] });
              fetchTasks();
            }}
            options={[
              {val: "created_at:desc", label: "Newest First"},
              {val: "created_at:asc", label: "Oldest First"},
              {val: "scheduled_at:desc", label: "Scheduled (Desc)"},
              {val: "title:asc", label: "Title (A-Z)"}
            ]}
            className="w-[140px]"
          />

          <button disabled className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-white/[0.05] text-white/30 bg-white/[0.02] cursor-not-allowed ml-2">
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setAiAssistantEnabled(!aiAssistantEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] transition-all text-[12px] font-bold neon-interactive border ${
              aiAssistantEnabled 
                ? 'bg-[var(--accent-500)]/20 border-[var(--accent-500)]/50 text-[var(--accent-400)] shadow-[0_0_15px_var(--color-primary-cyan)]'
                : 'bg-[#05080e]/60 border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sparkles size={14} className={aiAssistantEnabled ? 'text-[var(--accent-400)] animate-pulse' : 'text-white/40'} /> AI Assistant
          </button>
          <button onClick={() => setIsLogOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-white/[0.08] bg-[#05080e]/60 text-white/80 hover:text-white hover:bg-white/[0.05] transition-colors text-[12px] font-bold neon-interactive">
            <Clock size={14} className="text-white/40" /> Activity Log
          </button>
        </div>

      </div>

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* LEFT COLUMN: Video List (~25%) */}
        <div className="w-[360px] shrink-0 flex flex-col h-full border-r border-white/[0.04] pr-4">
           <div className="flex items-center justify-between mb-3 shrink-0">
             <div className="text-[13px] font-bold text-white/80">{mappedVideos.length} videos</div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-2">
              {mappedVideos.map(video => (
                <ReviewVideoRow 
                  key={video.id} 
                  video={video} 
                  isSelected={selectedVideoIds.includes(video.id)}
                  isActive={activeTask?.id === video.id}
                  onToggleSelect={handleToggleSelect}
                  onClickRow={handleRowClick}
                />
              ))}
           </div>
           

        </div>

        {/* CENTER COLUMN: Video Preview (~45%) */}
        <div className="flex-1 px-4 border-r border-white/[0.04] min-w-0">
          <ReviewCenterPanel video={activeVideoProps} />
        </div>

        {/* RIGHT COLUMN: Metadata (~29%) */}
        <div className="shrink-0 h-full">
           <ReviewMetadataPanel video={activeVideoProps} aiAssistantEnabled={aiAssistantEnabled} edits={edits} setEdits={setEdits} />
        </div>

      </div>

      {/* Docked Bottom Command Bar */}
      <div className="shrink-0 w-full h-[64px] border-t border-white/[0.08] bg-[#05080e] flex items-center justify-between px-2 mt-2">
         {/* Left: Destructive Actions */}
         <div className="flex items-center gap-2">
           <button onClick={handleRejectActive} className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors text-[13px] font-bold neon-interactive">
             <Trash2 size={16} /> Delete
           </button>
           {selectedVideoIds.length > 0 && (
             <>
               <button onClick={handleBulkReject} className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-red-400 hover:bg-red-400/20 transition-colors text-[13px] font-bold neon-interactive border border-red-400/30">
                 Bulk Delete ({selectedVideoIds.length})
               </button>
               <button onClick={handleBulkApprove} className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[var(--accent-400)] hover:bg-[var(--accent-400)]/20 transition-colors text-[13px] font-bold neon-interactive border border-[var(--accent-400)]/30">
                 Bulk Approve ({selectedVideoIds.length})
               </button>
             </>
           )}
         </div>
         
         {/* Right: Primary Actions */}
         <div className="flex items-center gap-4">
           <button 
             onClick={async () => {
               if (Object.keys(edits).length > 0) {
                 try {
                   await updateTask(activeTask.id, edits);
                   setEdits({});
                   const { showToast } = await import('../../common/NotificationToast');
                   showToast('Metadata saved successfully', 'success');
                 } catch (err) {
                   const { showToast } = await import('../../common/NotificationToast');
                   showToast('Failed to save metadata', 'error');
                 }
               } else {
                 const { showToast } = await import('../../common/NotificationToast');
                 showToast('No changes to save', 'info');
               }
             }}
             className="flex items-center gap-2 px-6 py-2 rounded-[8px] text-white/80 hover:text-white border border-white/[0.1] hover:bg-white/[0.05] transition-colors text-[13px] font-bold neon-interactive"
           >
             <Save size={16} /> Save Draft
           </button>

           {/* Approve & Upload Button State Logic */}
           {(() => {
             if (!activeTask) return null;
             
             const status = activeTask.status;
             let buttonText = "Approve & Upload";
             let icon = <CloudUpload size={16} strokeWidth={2.5} />;
             let buttonClass = "bg-[var(--accent-500)] text-black shadow-[0_0_15px_var(--color-primary-cyan)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]";
             let disabled = false;
             
             if (status === 'QUEUED') {
               buttonText = "Queued...";
               icon = <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>;
               buttonClass = "bg-yellow-400 text-black cursor-not-allowed";
               disabled = true;
             } else if (status === 'UPLOADING') {
               buttonText = "Uploading...";
               icon = <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>;
               buttonClass = "bg-[var(--accent-400)] text-black cursor-not-allowed";
               disabled = true;
             } else if (status === 'SCHEDULED') {
               buttonText = "Upload Now (Override)";
               icon = <CloudUpload size={16} strokeWidth={2.5} />;
               buttonClass = "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]";
               disabled = false;
             } else if (status === 'COMPLETED') {
               buttonText = "✓ Uploaded";
               icon = null;
               buttonClass = "bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30";
               disabled = true;
             } else if (status === 'FAILED') {
               buttonText = "Retry Upload";
               icon = <RotateCcw size={16} strokeWidth={2.5} />;
               buttonClass = "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]";
               disabled = false;
             }

             return (
               <button 
                 disabled={disabled}
                 onClick={async () => {
                   if(status === 'WATCHED' || status === 'REVIEW' || status === 'FAILED' || status === 'SCHEDULED') {
                     if (Object.keys(edits).length > 0) {
                       await updateTask(activeTask.id, edits);
                       setEdits({});
                     }
                     approveTask(activeTask.id);
                   }
                 }}
                 className={`h-[40px] px-8 rounded-[8px] font-bold text-[13px] hover:brightness-110 transition-all flex items-center gap-2 relative overflow-hidden group neon-scale ${buttonClass}`}>
                 {!disabled && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>}
                 {icon} {buttonText}
               </button>
             );
           })()}
         </div>
      </div>

    </div>
  )
}
