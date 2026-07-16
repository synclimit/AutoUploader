import { useState, useEffect } from 'react'
import { Globe, RefreshCw, XCircle, Save, ShieldCheck, HardDrive, Settings, Activity, Server, AlertCircle } from 'lucide-react'
import ChannelHeroArtwork from './ChannelHeroArtwork'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import apiClient from '../../../api/client'
import toast from 'react-hot-toast'

import GeneralTab from './tabs/GeneralTab'
import UploadDefaultsTab from './tabs/UploadDefaultsTab'
import AIIdentityTab from './tabs/AIIdentityTab'

export default function ChannelDetailWorkspace({ channel }) {
  const { deleteAccount, updateAccount } = useAccountsStore()
  const [activeTab, setActiveTab] = useState('general')

  const [drafts, setDrafts] = useState({
    pipelines: {},
    upload_defaults: {},
    ai_identity: {}
  })

  const [original, setOriginal] = useState({
    pipelines: {},
    upload_defaults: {},
    ai_identity: {}
  })

  const [isSaving, setIsSaving] = useState(false)

  const [currentChannelId, setCurrentChannelId] = useState(null)
  const [playlists, setPlaylists] = useState([])

  // Initialize state
  useEffect(() => {
    if (channel && channel.id !== currentChannelId) {
      const parseJSON = (str, fallback) => {
        try { return typeof str === 'string' ? JSON.parse(str) : (str || fallback) }
        catch { return fallback }
      }
      const initial = {
        pipelines: parseJSON(channel.pipelines, { long: {}, shorts: {} }),
        upload_defaults: parseJSON(channel.upload_defaults, { long: { basic_info: {}, advanced: {} }, shorts: { basic_info: {}, advanced: {} } }),
        ai_identity: parseJSON(channel.ai_identity, {})
      }
      setOriginal(initial)
      setDrafts(JSON.parse(JSON.stringify(initial))) // deep copy
      setCurrentChannelId(channel.id)

      if (channel.authentication_status === 'Connected') {
        const fetchPlaylists = async () => {
          try {
            const res = await apiClient.get(`/accounts/${channel.id}/playlists`)
            if (res && Array.isArray(res)) {
              setPlaylists(res.map(p => ({ label: p.title, value: p.id })))
            }
          } catch (e) {
            console.error("Failed to fetch playlists:", e)
          }
        }
        fetchPlaylists()
      } else {
        setPlaylists([])
      }
    }
  }, [channel?.id, currentChannelId, channel?.authentication_status])

  const [realtimeStates, setRealtimeStates] = useState(channel?.pipeline_states || '{}')
  
  useEffect(() => {
    if (!channel?.id) return;
    setRealtimeStates(channel.pipeline_states || '{}') // initial sync
    const int = setInterval(async () => {
      try {
        const res = await apiClient.get(`/accounts`);
        const acc = res.find(a => a.id === channel.id);
        if (acc) setRealtimeStates(acc.pipeline_states || '{}');
      } catch(e) {}
    }, 5000)
    return () => clearInterval(int)
  }, [channel?.id, channel?.pipeline_states])

  if (!channel) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#05080e] relative overflow-hidden">
        <div className="flex flex-col items-center gap-6 z-10 opacity-40">
          <Globe size={64} className="text-[var(--accent-400)]" />
          <span className="text-[18px] font-bold text-white tracking-widest uppercase">Select a Channel</span>
        </div>
      </div>
    )
  }

  // Deep compare function for dirty tracking
  const isDirty = (key) => JSON.stringify(drafts[key]) !== JSON.stringify(original[key])
  const workspaceDirty = isDirty('pipelines') || isDirty('upload_defaults') || isDirty('ai_identity')

  const handleSave = async () => {
    setIsSaving(true)
    const patch = {}
    if (isDirty('pipelines')) patch.pipelines = JSON.stringify(drafts.pipelines)
    if (isDirty('upload_defaults')) patch.upload_defaults = JSON.stringify(drafts.upload_defaults)
    if (isDirty('ai_identity')) patch.ai_identity = JSON.stringify(drafts.ai_identity)

    try {
      if (Object.keys(patch).length > 0) {
        await updateAccount(channel.id, patch)
        toast.success('Channel configuration updated successfully', {
          style: { background: '#0a0f18', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.2)' },
          iconTheme: { primary: '#22d3ee', secondary: '#0a0f18' }
        })
        setOriginal(JSON.parse(JSON.stringify(drafts)))
      }
    } catch (e) {
      toast.error('Failed to save channel configuration', {
        style: { background: '#0a0f18', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }
      })
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', isDirty: isDirty('pipelines'), helpText: 'Atur koneksi watch folder, sumber video, dan integrasi pipeline.' },
    { id: 'upload_defaults', label: 'Upload Defaults', isDirty: isDirty('upload_defaults'), helpText: 'Seting bawaan (default) untuk pengaturan dasar, visibilitas, bahasa, dan tag.' },
    { id: 'ai_identity', label: 'AI Identity', isDirty: isDirty('ai_identity'), helpText: 'Beri kepribadian, gaya penulisan, dan aturan pada AI untuk membuat metadata.' }
  ]

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col bg-gradient-to-br from-[var(--bg-sidebar-from)] via-[var(--bg-sidebar-via)] to-[var(--bg-sidebar-to)] relative overflow-x-hidden">
      
      {/* SAVING OVERLAY */}
      {isSaving && (
        <div className="absolute inset-0 z-[100] bg-[#05080e]/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 border-4 border-[var(--accent-500)]/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <span className="text-[14px] font-bold text-white tracking-widest uppercase">Saving Configuration...</span>
        </div>
      )}

      {/* BACKGROUND DEPTH & VECTOR LINES */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-[400px] h-[400px] bg-teal-600/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="absolute top-0 left-0 w-full h-[240px] pointer-events-none z-0">
        <div className="w-full h-full bg-gradient-to-b from-cyan-900/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"></div>
      </div>

      <ChannelHeroArtwork />

      {/* WORKSPACE CONTENT */}
      <div className="max-w-[1000px] w-full px-12 pt-12 pb-20 flex flex-col gap-8 relative z-10 mx-auto">

        {/* HEADER */}
        <div className="flex items-start justify-between relative">
          <div className="absolute top-1/2 left-6 -translate-y-1/2 w-[80px] h-[80px] bg-[var(--accent-400)]/20 blur-[30px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-[2.5px] border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] shrink-0 bg-[#0a0f18] relative">
              {channel.avatar_url ? (
                <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-[22px] font-bold text-white shadow-inner ${channel.color}`}>
                  {channel.initials}
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold text-white leading-none tracking-tight drop-shadow-lg">{channel.name}</h1>
                {channel.status === 'Connected' ? (
                  <span className="text-[11px] font-bold text-green-400 flex items-center gap-1.5 bg-green-500/10 px-2.5 py-0.5 rounded-[6px] border border-green-500/20 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Active
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2.5 py-0.5 rounded-[6px] border border-red-500/20 uppercase tracking-wider animate-pulse">
                    <AlertCircle size={12} /> Needs Reconnect
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[13px] font-semibold text-[var(--accent-400)]/80 drop-shadow-md">
                  @{channel.name.toLowerCase().replace(/\s+/g, '')}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/15"></span>
                <span className="text-[13px] font-medium text-white/50">
                  {channel.subscribers || '0'} Subscribers
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-2 relative z-10">
            <button 
              onClick={async () => {
                try {
                  const res = await apiClient.post(`/oauth/channels/${channel.id}/reconnect`)
                  if (res && res.auth_url) await apiClient.post('/system/open-url', { url: res.auth_url })
                } catch (err) {
                  console.error(err)
                  let errorMsg = "Failed to get authentication URL.";
                  if (err?.response?.data?.detail) {
                    if (typeof err.response.data.detail === 'string') {
                      errorMsg = err.response.data.detail;
                    } else if (err.response.data.detail.reason) {
                      errorMsg = err.response.data.detail.reason;
                    }
                  } else if (err?.response?.data?.message) {
                    errorMsg = err.response.data.message;
                  }
                  toast.error(errorMsg, {
                    style: { background: '#0a0f18', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }
                  })
                }
              }}
              className={`h-[38px] px-4.5 rounded-[10px] backdrop-blur-md font-bold text-[12px] transition-all flex items-center gap-2 ${
                channel.status !== 'Connected'
                  ? 'bg-red-500 text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse hover:bg-red-600'
                  : 'bg-[#0d121c]/60 border border-white/[0.08] text-white/90 hover:text-white hover:bg-[#111824] hover:border-white/[0.15]'
              }`}>
              <RefreshCw size={14} className={channel.status !== 'Connected' ? 'text-white' : 'text-[var(--accent-400)]/70'} /> Reconnect
            </button>
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to delete this channel?')) deleteAccount(channel.id)
              }}
              className="h-[38px] px-4.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 font-bold text-[12px] transition-all flex items-center gap-2">
              <XCircle size={14} /> Delete
            </button>
          </div>
        </div>

        {/* RECONNECT REQUIRED BANNER */}
        {channel.status !== 'Connected' && (
          <div className="flex items-center justify-between p-4 rounded-[14px] bg-red-500/10 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-in fade-in relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[10px] bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-red-400 tracking-wide">YouTube Account Disconnected</span>
                <span className="text-[12px] text-white/70">The OAuth connection is expired or inactive. Click Reconnect to resume automatic uploads.</span>
              </div>
            </div>
            <button 
              onClick={async () => {
                try {
                  const res = await apiClient.post(`/oauth/channels/${channel.id}/reconnect`)
                  if (res && res.auth_url) await apiClient.post('/system/open-url', { url: res.auth_url })
                } catch (err) {
                  console.error(err)
                  let errorMsg = "Failed to get authentication URL.";
                  if (err?.response?.data?.detail) {
                    if (typeof err.response.data.detail === 'string') {
                      errorMsg = err.response.data.detail;
                    } else if (err.response.data.detail.reason) {
                      errorMsg = err.response.data.detail.reason;
                    }
                  } else if (err?.response?.data?.message) {
                    errorMsg = err.response.data.message;
                  }
                  toast.error(errorMsg, {
                    style: { background: '#0a0f18', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }
                  })
                }
              }}
              className="h-[38px] px-5 rounded-[10px] bg-red-500 text-white font-bold text-[12px] hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 shrink-0 animate-pulse">
              <RefreshCw size={14} /> Reconnect Now
            </button>
          </div>
        )}

        {/* STICKY SAVE BAR */}
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 rounded-[14px] bg-[#0a0f18]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 duration-300 mt-2">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-colors ${workspaceDirty ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              {workspaceDirty ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div className="flex flex-col">
              <h2 className="text-[14px] font-bold text-white tracking-wide">Workspace Status</h2>
              <span className={`text-[12px] font-bold ${workspaceDirty ? 'text-amber-400 flex items-center gap-1.5' : 'text-green-400'}`}>
                {workspaceDirty ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Unsaved Changes Pending</>
                ) : '✓ All configurations synced'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={!workspaceDirty || isSaving}
            className={`h-[40px] px-6 rounded-[10px] font-bold text-[13px] flex items-center gap-2 transition-all ${
              workspaceDirty && !isSaving
                ? 'bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-[#05080e] shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-6 border-b border-white/[0.04] pb-0 relative z-10 mt-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-[14px] font-bold transition-all relative flex items-center gap-2 ${
                activeTab === tab.id ? 'text-[var(--accent-400)]' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
              
              <div className="group relative flex items-center ml-1">
                <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[10px] opacity-60 group-hover:opacity-100 transition-opacity bg-white/5">?</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#05080e] text-white/90 text-[11px] p-2 rounded-[8px] border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-normal leading-relaxed text-center hidden group-hover:block">
                  {tab.helpText}
                </div>
              </div>

              {tab.isDirty ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider ml-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Unsaved</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider ml-1">✓ Saved</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--accent-400)] shadow-[0_0_10px_#22d3ee]"></div>
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'general' && (
            <GeneralTab 
              draft={drafts.pipelines} 
              original={original.pipelines} 
              onChange={(val) => setDrafts({...drafts, pipelines: val})}
              states={realtimeStates}
              channelStatus={channel.status}
            />
          )}
          {activeTab === 'upload_defaults' && (
            <UploadDefaultsTab 
              draft={drafts.upload_defaults} 
              original={original.upload_defaults}
              onChange={(newDraft) => setDrafts(prev => ({ ...prev, upload_defaults: newDraft }))} 
              playlists={playlists}
            />
          )}
          {activeTab === 'ai_identity' && (
            <AIIdentityTab 
              draft={drafts.ai_identity} 
              original={original.ai_identity}
              onChange={(newDraft) => setDrafts(prev => ({ ...prev, ai_identity: newDraft }))} 
            />
          )}
        </div>

      </div>
    </div>
  )
}
