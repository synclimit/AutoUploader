import { useState, useEffect } from 'react'

import MetadataEditor from './MetadataEditor'
import UploadSettings from './UploadSettings'
import AIMetadataPanel from './AIMetadataPanel'

import TooltipHelper from '../../common/TooltipHelper'
import { showToast } from '../../common/NotificationToast'
import { useQueueStore } from '../../../store/upload/uploadStore'

export default function DetailPanel() {
  const activeTask = useQueueStore((s) => s.activeTask)
  const approveTask = useQueueStore((s) => s.approveTask)
  const deleteTask = useQueueStore((s) => s.deleteTask)
  const scheduleTask = useQueueStore((s) => s.scheduleTask)
  const updateTask = useQueueStore((s) => s.updateTask)

  const [showConfirm, setShowConfirm] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const [editData, setEditData] = useState({ title: '', description: '', tags: '', category_id: 22, ai_use: 'UNKNOWN', default_language: '', audio_language: '', recording_date: '' })

  useEffect(() => {
    if (activeTask) {
      setEditData({
        title: activeTask.title || '',
        description: activeTask.description || '',
        tags: activeTask.tags || '',
        category_id: activeTask.category_id || 22,
        ai_use: activeTask.ai_use || 'UNKNOWN',
        default_language: activeTask.default_language || '',
        audio_language: activeTask.audio_language || '',
        recording_date: activeTask.recording_date ? activeTask.recording_date.substring(0, 10) : ''
      })
    }
  }, [activeTask])


  const handleApplyAIMetadata = (suggestion) => {
    setEditData(prev => ({
      ...prev,
      title: suggestion.title ?? prev.title,
      description: suggestion.description ?? prev.description,
      tags: suggestion.tags ?? prev.tags
    }))
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  const handleSaveMetadataClick = () => {
    setShowConfirm('save')
  }

  const handleConfirmSave = async () => {
    setShowConfirm(false)
    if (activeTask) {
      await updateTask(activeTask.id, {
        title: editData.title,
        description: editData.description,
        tags: editData.tags,
        category_id: parseInt(editData.category_id, 10),
        ai_use: editData.ai_use,
        default_language: editData.default_language,
        audio_language: editData.audio_language,
        recording_date: editData.recording_date ? new Date(editData.recording_date).toISOString() : null
      })
    }
    showToast(
      <div className="flex flex-col">
        <span>Metadata Saved</span>
        <span className="text-[10px] text-white/60 font-normal mt-1 leading-relaxed">
          Changes stored in database.<br/>Video has NOT been uploaded.
        </span>
      </div>,
      'success',
      3500
    )
  }

  const handleUploadClick = () => {
    setShowConfirm('upload')
  }

  const handleConfirmUpload = async () => {
    if (activeTask) {
      await approveTask(activeTask.id)
    }
    setShowConfirm(false)
    showToast(
      <div className="flex flex-col">
        <span>Added To Upload Queue</span>
        <span className="text-[10px] text-white/60 font-normal mt-1 leading-relaxed">
          Task status changed to QUEUED.
        </span>
      </div>,
      'success',
      3500
    )
  }

  const handleConfirmReject = async () => {
    if (activeTask) {
      await deleteTask(activeTask.id)
    }
    setShowConfirm(false)
    showToast('Task Deleted', 'success', 3000)
  }

  const handleConfirmSchedule = async () => {
    if (activeTask && scheduleDate && scheduleTime) {
      const dateTimeString = `${scheduleDate}T${scheduleTime}:00`
      const scheduledAt = new Date(dateTimeString)
      await scheduleTask(activeTask.id, scheduledAt.toISOString())
    }
    setShowScheduleModal(false)
    showToast('Task Scheduled', 'success', 3000)
  }

  if (!activeTask) {
    return (
      <div className="flex-1 min-h-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white/30 text-sm">
        No task selected
      </div>
    )
  }


  return (

    <div className="flex-1 min-h-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">

      <div className="h-[64px] border-b border-white/[0.04] px-4 flex items-center shrink-0">

        <div>

          <div className="text-[18px] font-bold text-purple-300">

            Detail Panel

          </div>

          <div className="text-[11px] text-white/35 mt-1">

            Metadata & upload settings

          </div>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-[11px] mb-3">
          <div className="text-[var(--accent-400)] font-bold text-xs mb-2">Task Summary</div>
          <div className="grid grid-cols-2 gap-y-1.5 text-white/70">
            <div className="flex gap-1.5"><span className="text-white/40 w-[90px]">Account:</span> {activeTask.account_id?.substring(0,8) || 'None'}</div>
            <div className="flex gap-1.5"><span className="text-white/40 w-[90px]">Profile:</span> {activeTask.profile_id || 'None'}</div>
            <div className="flex gap-1.5 items-center">
              <span className="text-white/40 w-[90px]">Status:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                activeTask.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                activeTask.status === 'QUEUED' ? 'bg-[var(--accent-500)]/10 text-[var(--accent-400)] border border-[var(--accent-500)]/20' :
                activeTask.status === 'SCHEDULED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                activeTask.status === 'UPLOADING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                activeTask.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                activeTask.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                activeTask.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-white/5 text-white/60 border border-white/10'
              }`}>
                {activeTask.status}
              </span>
            </div>
            <div className="flex gap-1.5"><span className="text-white/40 w-[90px]">Source Type:</span> {activeTask.source_type}</div>
            <div className="flex gap-1.5 col-span-2"><span className="text-white/40 w-[90px]">Meta Source:</span> {activeTask.metadata_source}</div>
            <div className="flex gap-1.5 col-span-2 mt-1 border-t border-white/[0.05] pt-1.5"><span className="text-white/40 w-[90px] shrink-0">Title:</span> <span className="truncate">{activeTask.title || 'Untitled'}</span></div>
            <div className="flex gap-1.5 col-span-2"><span className="text-white/40 w-[90px] shrink-0">Description:</span> <span className="truncate">{activeTask.description || 'No description'}</span></div>
          </div>
        </div>

        <MetadataEditor editData={editData} setEditData={setEditData} />

        <UploadSettings />

        <AIMetadataPanel activeTask={activeTask} editData={editData} onApply={handleApplyAIMetadata} />
      </div>

      <div className="border-t border-white/[0.05] p-4 flex flex-col gap-3 bg-[#0d121b] shrink-0">
        <button
          onClick={handleSaveMetadataClick}
          className="w-full h-[36px] rounded-lg bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 text-[var(--accent-400)] text-[12px] font-bold hover:bg-[var(--accent-500)]/20 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xs">💾</span>
          Save Metadata
          <TooltipHelper
            label=""
            tooltip="Saves metadata changes locally. Does not upload the video."
          />
        </button>

        {activeTask.status === 'PENDING_REVIEW' && (
          <div className="flex gap-3">
            <button
              onClick={handleUploadClick}
              className="flex-1 h-[36px] rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-[12px] font-bold hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xs">✅</span>
              Approve
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex-1 h-[36px] rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[12px] font-bold hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xs">📅</span>
              Schedule
            </button>
            <button
              onClick={() => setShowConfirm('reject')}
              className="flex-1 h-[36px] rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[12px] font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xs">🗑️</span>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* GEMINI CONFIRMATION DIALOG */}

      {showConfirm && (

        <>

          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-[380px] rounded-2xl border border-white/[0.08] bg-[#151f2e] shadow-2xl overflow-hidden">
              
              {showConfirm === 'save' && (
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 flex items-center justify-center text-lg">
                      💾
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-white">
                        Save metadata changes?
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        This will update the following fields:
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-[var(--accent-400)]">•</span> Title
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-[var(--accent-400)]">•</span> Description
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-[var(--accent-400)]">•</span> Tags
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-[var(--accent-400)]">•</span> Playlist Settings
                    </div>
                  </div>
                </div>
              )}

              {showConfirm === 'upload' && (
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-lg">
                      ⬆️
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-white">
                        Upload this video?
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        Please verify the following details:
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-green-300">✓</span> Title
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-green-300">✓</span> Description
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-green-300">✓</span> Thumbnail
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-green-300">✓</span> Schedule
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <span className="text-green-300">✓</span> Visibility
                    </div>
                  </div>
                </div>
              )}



              <div className="border-t border-white/[0.05] px-5 py-3 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-white/60 text-[12px] font-medium hover:bg-white/[0.03] hover:text-white transition-all"
                >
                  Cancel
                </button>
                {showConfirm === 'save' && (
                  <button
                    onClick={handleConfirmSave}
                    className="h-[40px] px-5 rounded-xl bg-[var(--accent-500)]/15 border border-[var(--accent-500)]/25 text-[var(--accent-400)] text-[12px] font-bold hover:bg-[var(--accent-500)]/25 transition-all"
                  >
                    Save
                  </button>
                )}
                {showConfirm === 'upload' && (
                  <button
                    onClick={handleConfirmUpload}
                    className="h-[40px] px-5 rounded-xl bg-green-500/15 border border-green-500/25 text-green-300 text-[12px] font-bold hover:bg-green-500/25 transition-all"
                  >
                    Approve
                  </button>
                )}
                {showConfirm === 'reject' && (
                  <button
                    onClick={handleConfirmReject}
                    className="h-[40px] px-5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-[12px] font-bold hover:bg-red-500/25 transition-all"
                  >
                    Delete
                  </button>
                )}

              </div>
            </div>
          </div>

        </>

      )}

      {showConfirm === 'reject' && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-[380px] rounded-2xl border border-white/[0.08] bg-[#151f2e] shadow-2xl overflow-hidden p-5">
              <div className="text-[16px] font-bold text-white mb-2">Delete Task</div>
              <div className="text-[12px] text-white/60 mb-4">Are you sure you want to delete this task? It will be permanently removed.</div>
              <div className="flex justify-end gap-3">
                <button onClick={handleCancel} className="h-[36px] px-4 rounded-xl border border-white/[0.08] text-white/60 text-[12px] font-medium hover:bg-white/[0.03] transition-all">Cancel</button>
                <button onClick={handleConfirmReject} className="h-[36px] px-4 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-[12px] font-bold hover:bg-red-500/25 transition-all">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}

      {showScheduleModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowScheduleModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-[380px] rounded-2xl border border-white/[0.08] bg-[#151f2e] shadow-2xl overflow-hidden p-5">
              <div className="text-[16px] font-bold text-white mb-4">Schedule Task</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white text-sm focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white text-sm focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowScheduleModal(false)} className="h-[36px] px-4 rounded-xl border border-white/[0.08] text-white/60 text-[12px] font-medium hover:bg-white/[0.03] transition-all">Cancel</button>
                <button onClick={handleConfirmSchedule} disabled={!scheduleDate || !scheduleTime} className="h-[36px] px-4 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[12px] font-bold hover:bg-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Schedule</button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>

  )

}
