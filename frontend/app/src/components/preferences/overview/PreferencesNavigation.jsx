import { Settings, UploadCloud, PlaySquare, Sparkles, Bell, Cpu, Palette, Sliders, Info, HardDriveUpload, HardDriveDownload, RotateCcw } from 'lucide-react'
import PreferencesSearch from './PreferencesSearch'
import { useTranslation } from '../../../i18n/useTranslation'

const getGroups = (t) => [
  {
    title: t('settings.group.app'),
    items: [
      { id: 'general', label: t('settings.cat.general'), icon: Settings },
      { id: 'appearance', label: t('settings.cat.appearance'), icon: Palette },
      { id: 'notifications', label: t('settings.cat.notifications'), icon: Bell },
    ]
  },
  {
    title: t('settings.group.engine'),
    items: [
      { id: 'uploads', label: t('settings.cat.uploads'), icon: UploadCloud },
      { id: 'ai', label: t('settings.cat.ai'), icon: Sparkles },
    ]
  },
  {
    title: t('settings.group.system'),
    items: [
      { id: 'about', label: t('settings.cat.about'), icon: Info },
    ]
  }
]

export default function PreferencesNavigation({ activeCategory, onSelectCategory, searchQuery, setSearchQuery }) {
  const { t } = useTranslation()
  const GROUPS = getGroups(t)

  return (
    <div className="w-[28%] min-w-[280px] max-w-[340px] h-full flex flex-col shrink-0 border-r border-white/[0.02]">
      
      {/* Search Header */}
      <PreferencesSearch value={searchQuery} onChange={setSearchQuery} />

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col py-4 px-2">
        {GROUPS.map((group, groupIndex) => (
          <div key={group.title} className="mb-6 last:mb-0">
            <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-4 mb-2">
              {group.title}
            </h3>
            <div className="flex flex-col gap-0.5">
              {group.items.map(category => {
                const isActive = activeCategory === category.id
                const Icon = category.icon
                
                return (
                  <div 
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={`h-[38px] px-4 flex items-center gap-3 cursor-pointer relative group transition-all duration-200 neon-interactive mx-2 rounded-[6px]
                      ${isActive ? 'bg-[var(--accent-500)]/10' : 'bg-transparent hover:bg-white/[0.03]'}`
                    }
                  >
                    {/* Neon Indicator */}
                    <div className={`absolute left-[-8px] top-[20%] bottom-[20%] w-[4px] bg-[var(--accent-400)] rounded-r-full transition-all duration-200 shadow-[0_0_10px_rgba(34,211,238,0.8)]
                      ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}`}></div>

                    <Icon size={15} className={`transition-colors ${isActive ? 'text-[var(--accent-400)]' : 'text-white/40 group-hover:text-white/70'}`} strokeWidth={isActive ? 2 : 1.5} />

                    <span className={`text-[13px] font-medium transition-colors ${isActive ? 'text-cyan-50' : 'text-white/60 group-hover:text-white/90'}`}>
                      {category.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Backup & Restore (Temporarily Hidden as it's not implemented yet) */}
      {/* 
      <div className="p-4 flex flex-col gap-1 shrink-0">
        <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2">
          {t('settings.backup.title')}
        </h3>
        <button className="h-[34px] rounded-[6px] flex items-center gap-2.5 px-3 hover:bg-white/[0.04] text-white/50 hover:text-white text-[12px] font-medium transition-all neon-interactive">
          <HardDriveDownload size={14} /> {t('settings.backup.btn')}
        </button>
        <button className="h-[34px] rounded-[6px] flex items-center gap-2.5 px-3 hover:bg-white/[0.04] text-white/50 hover:text-white text-[12px] font-medium transition-all neon-interactive">
          <HardDriveUpload size={14} /> {t('settings.restore.btn')}
        </button>
        <button className="h-[34px] rounded-[6px] flex items-center gap-2.5 px-3 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 text-[12px] font-medium transition-all neon-interactive mt-1">
          <RotateCcw size={14} /> {t('settings.reset.btn')}
        </button>
      </div>
      */}

    </div>
  )
}
