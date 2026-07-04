/**
 * ConfirmModal — reusable confirmation dialog
 * 
 * Props:
 *   isOpen     — boolean
 *   onCancel   — () => void
 *   onConfirm  — () => void
 *   title      — string
 *   subtitle   — string (optional)
 *   itemLabel  — string (optional) — label for what is being deleted/acted on
 *   itemValue  — string (optional) — the name/value of the item
 *   confirmLabel — string (default "Confirm")
 *   confirmColor — 'red' | 'cyan' | 'green' (default 'red')
 */
export default function ConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  subtitle,
  itemLabel,
  itemValue,
  confirmLabel = 'Confirm',
  confirmColor = 'red',
}) {
  if (!isOpen) return null

  const colorMap = {
    red: {
      icon: 'bg-red-500/10 border-red-500/20',
      btn: 'bg-red-500/15 border-red-500/25 text-red-300 hover:bg-red-500/25',
      dot: 'bg-red-400',
    },
    cyan: {
      icon: 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/20',
      btn: 'bg-[var(--accent-500)]/15 border-[var(--accent-500)]/25 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/25',
      dot: 'bg-[var(--accent-400)]',
    },
    green: {
      icon: 'bg-green-500/10 border-green-500/20',
      btn: 'bg-green-500/15 border-green-500/25 text-green-300 hover:bg-green-500/25',
      dot: 'bg-green-400',
    },
  }

  const c = colorMap[confirmColor] || colorMap.red

  const iconEmoji = confirmColor === 'red' ? '🗑️' : confirmColor === 'green' ? '✓' : '?'

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[380px] rounded-2xl border border-white/[0.08] bg-[#151f2e] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${c.icon} border flex items-center justify-center text-lg shrink-0`}>
                {iconEmoji}
              </div>
              <div>
                <div className="text-[16px] font-bold text-white">{title}</div>
                {subtitle && (
                  <div className="text-[11px] text-white/40 mt-0.5">{subtitle}</div>
                )}
              </div>
            </div>

            {(itemLabel || itemValue) && (
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-1">
                {itemLabel && (
                  <div className="text-[10px] uppercase tracking-wider text-white/35">{itemLabel}</div>
                )}
                {itemValue && (
                  <div className="text-[13px] font-semibold text-white/80">{itemValue}</div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.05] px-5 py-3 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-white/60 text-[12px] font-medium hover:bg-white/[0.03] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`h-[40px] px-5 rounded-xl border text-[12px] font-bold transition-all ${c.btn}`}
            >
              {confirmLabel}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
