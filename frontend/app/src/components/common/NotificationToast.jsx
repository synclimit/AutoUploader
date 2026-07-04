import { useState, useEffect } from 'react'


let toastListeners = []

let toastId = 0


export function showToast(message, type = 'success', duration = 3000) {

  const id = ++toastId

  toastListeners.forEach((fn) => fn({ id, message, type, duration }))

  return id

}


export default function NotificationToast() {

  const [toasts, setToasts] = useState([])


  useEffect(() => {

    const listener = (toast) => {

      setToasts((prev) => [...prev, toast])

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

    success: 'border-green-500/20 bg-green-500/10 text-green-300',

    error: 'border-red-500/20 bg-red-500/10 text-red-300',

    warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300',

    info: 'border-[var(--accent-500)]/20 bg-[var(--accent-500)]/10 text-[var(--accent-400)]',

  }


  const typeIcons = {

    success: '✓',

    error: '✕',

    warning: '⚠',

    info: 'ℹ',

  }


  return (

    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">

      {toasts.map((toast) => (

        <div

          key={toast.id}

          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-2xl transition-all duration-300 ${typeStyles[toast.type]} flex items-center gap-3 min-w-[280px] max-w-[400px]`}

        >

          <span className="text-sm font-bold">{typeIcons[toast.type]}</span>

          <span className="text-[13px] font-medium">{toast.message}</span>

        </div>

      ))}

    </div>

  )

}
