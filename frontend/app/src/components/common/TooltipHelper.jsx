import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function TooltipHelper({ label, tooltip }) {
  const [show, setShow] = useState(false)
  const iconRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    setShow(true)
  }

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShow(false)
    }, 100) // 100ms grace period
  }

  useEffect(() => {
    if (show && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect()
      setCoords({
        top: rect.top - 4, // slight offset
        left: rect.left + rect.width / 2
      })
    }
  }, [show])

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {label && (
        <span className="text-white/80 text-[13px] font-medium">
          {label}
        </span>
      )}
      <span
        ref={iconRef}
        className="relative inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          className="relative inline-flex items-center justify-center w-[14px] h-[14px] rounded-full border border-white/20 text-white/40 text-[9px] font-bold cursor-help hover:border-[var(--accent-500)]/30 hover:text-[var(--accent-400)] hover:bg-[var(--accent-500)]/10 transition-all"
          onClick={() => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
            setShow(!show)
          }}
        >
          ?
        </span>
      </span>
      {show && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShow(false)} />
          <div 
            className="fixed z-[9999] -translate-x-1/2 -translate-y-full pb-2"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="px-3 py-2 bg-[#1a2035] border border-white/[0.08] rounded-lg shadow-2xl whitespace-nowrap">
              <div className="text-[11px] text-white/80 leading-relaxed max-w-[220px] whitespace-normal">
                {tooltip}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-[#1a2035]" />
            </div>
          </div>
        </>,
        document.body
      )}
    </span>
  )
}
