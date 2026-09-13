import { useState, useEffect } from 'react'


let toastListeners = []

let toastId = 0


export function showToast(message, type = 'success', duration = 4000, errorId = null) {
  const id = ++toastId
  toastListeners.forEach((fn) => fn({ id, message, type, duration, errorId }))
  return id
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const listener = (toast) => {
      setToasts((prev) => {
        // Remove duplicate message to prevent spam stacks
        const filtered = prev.filter((t) => t.message !== toast.message)
        // Keep maximum 3 toasts on screen at once
        return [...filtered.slice(-2), toast]
      })
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.duration)
    }

    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  const typeStyles = {
    success: 'border-green-500/30 bg-[#06140d]/95 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.15)]',
    error: 'border-red-500/30 bg-[#16070a]/95 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    warning: 'border-yellow-500/30 bg-[#141206]/95 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    info: 'border-cyan-500/30 bg-[#061217]/95 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]',
  }

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  const handleOpenDiagnostic = (errorId) => {
    window.dispatchEvent(new CustomEvent('open-diagnostic-center', { detail: { errorId } }))
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-3.5 py-2.5 shadow-2xl transition-all duration-300 ${typeStyles[toast.type]} flex flex-col gap-1.5 min-w-[280px] max-w-[380px] backdrop-blur-xl animate-in slide-in-from-bottom-3`}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-sm font-bold mt-0.5 shrink-0">{typeIcons[toast.type]}</span>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="text-[12.5px] font-medium leading-relaxed break-words">{toast.message}</span>
              
              {toast.errorId && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/30">
                    ID: {toast.errorId}
                  </span>
                </div>
              )}
            </div>
            
            {/* Dismiss X button */}
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/40 hover:text-white transition-colors text-xs p-1 -mr-1 -mt-0.5 rounded hover:bg-white/10 shrink-0"
              title="Tutup notifikasi"
            >
              ✕
            </button>
          </div>

          {toast.errorId && (
            <div className="flex items-center justify-end pt-1 border-t border-white/10 mt-0.5">
              <button
                onClick={() => handleOpenDiagnostic(toast.errorId)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30 transition-all flex items-center gap-1"
              >
                🔍 Buka Diagnostic Center
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
