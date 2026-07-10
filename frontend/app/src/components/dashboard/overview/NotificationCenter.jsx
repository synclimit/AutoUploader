import React, { useState } from 'react'
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, PlayCircle, FolderX, X, ArrowRight } from 'lucide-react'

export default function NotificationCenter({ notifications = [], setActiveModule, onSelectChannel }) {
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (type) => {
    switch (type) {
      case 'Coverage Low':
        return <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      case 'Campaign Empty':
        return <FolderX size={16} className="text-red-400 shrink-0" />
      case 'Upload Failed':
        return <AlertCircle size={16} className="text-orange-400 shrink-0" />
      case 'Campaign Started':
        return <PlayCircle size={16} className="text-cyan-400 shrink-0" />
      case 'Campaign Finished':
        return <CheckCircle2 size={16} className="text-green-400 shrink-0" />
      default:
        return <Bell size={16} className="text-cyan-400 shrink-0" />
    }
  }

  const handleAction = (notif) => {
    if (onSelectChannel && notif.channel) {
      onSelectChannel(notif.channel)
    }
    if (notif.action === 'Open Review') {
      setActiveModule && setActiveModule('Review')
    } else if (notif.action === 'Open Upload Journal') {
      setActiveModule && setActiveModule('Journal')
    } else {
      setActiveModule && setActiveModule('Channels')
    }
    setIsOpen(false)
  }

  const unreadCount = notifications.length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#08181f] hover:bg-[#0c242f] border border-[var(--accent-500)]/30 rounded-[8px] text-white transition-colors cursor-pointer relative"
      >
        <Bell size={15} className="text-[var(--accent-400)]" />
        <span className="text-[12px] font-bold">Notifications</span>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-red-500 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[110%] w-[380px] bg-[#0b1d25] border border-[var(--accent-500)]/30 shadow-2xl rounded-[12px] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#08181f] border-b border-[var(--accent-500)]/20">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[var(--accent-400)]" />
              <span className="text-[13px] font-bold text-white">Operational Notifications</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-[var(--accent-500)]/10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-[12px]">
                No operational notifications right now.
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-3 hover:bg-[var(--accent-500)]/5 transition-colors flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(notif.type)}
                      <span className="text-[12px] font-bold text-white/90">{notif.type}</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">{notif.time}</span>
                  </div>
                  <div className="text-[12px] text-white/70 pl-6">
                    <span className="font-bold text-cyan-300">{notif.channel}:</span> {notif.message}
                  </div>
                  <div className="pl-6 flex justify-end">
                    <button
                      onClick={() => handleAction(notif)}
                      className="text-[11px] font-bold text-[var(--accent-400)] hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {notif.action || 'Open Channel'} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
