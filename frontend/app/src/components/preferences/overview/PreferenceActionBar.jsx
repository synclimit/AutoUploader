import { Save, RotateCcw, HardDriveDownload } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'

export default function PreferenceActionBar({ onSave, isSaving }) {
  const { t } = useTranslation()

  return (
    <div className="absolute bottom-0 right-0 w-[72%] h-[80px] bg-[#05080e]/95 backdrop-blur-2xl border-t border-white/[0.04] px-10 flex items-center justify-between z-40 shadow-[0_-20px_60px_rgba(0,0,0,0.6)]">
      
      {/* Left (Empty to push Save to right, or keep Restore Default) */}
      <div className="flex items-center">
        <button className="h-[42px] px-5 rounded-[8px] bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1] text-white/50 hover:text-white text-[13px] font-medium flex items-center gap-2.5 transition-all neon-interactive">
          <RotateCcw size={15} /> {t('settings.default.btn')}
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onSave}
          disabled={isSaving}
          className={`h-[46px] px-8 rounded-[8px] font-bold text-[14px] flex items-center gap-2.5 transition-all neon-interactive ${
            isSaving 
              ? 'bg-[var(--accent-500)]/50 border border-[var(--accent-400)] text-[#020617]/50 cursor-not-allowed'
              : 'bg-[var(--accent-500)] border border-[var(--accent-400)] text-[#020617] hover:bg-[var(--accent-400)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] shadow-[0_0_15px_rgba(34,211,238,0.3)]'
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
          ) : (
            <Save size={16} />
          )}
          {isSaving ? t('settings.saving') : t('settings.save')}
        </button>
      </div>

    </div>
  )
}
