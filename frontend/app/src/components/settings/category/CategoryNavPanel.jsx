import { useSettingsStore } from '../../../store/settings/settingsStore'

export default function CategoryNavPanel() {
  const categories = useSettingsStore((s) => s.categories)
  const selectedCategory = useSettingsStore((s) => s.selectedCategory)
  const setSelectedCategory = useSettingsStore((s) => s.setSelectedCategory)
  const configSections = useSettingsStore((s) => s.configSections)

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    const section = configSections.find(s => s.title === category)
    if (section) {
      const el = document.getElementById(section.id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="h-[58px] border-b border-white/5 px-4 flex items-center shrink-0">
        <div>
          <div className="text-[13px] font-semibold text-[var(--accent-400)]">
            Settings Categories
          </div>

          <div className="text-[10px] text-white/35 mt-1">
            System configuration modules
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth">
        {categories.map((item) => (
          <div
            key={item}
            onClick={() => handleCategoryClick(item)}
            className={`rounded-xl px-3 py-3 border cursor-pointer transition-all ${
              selectedCategory === item
                ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/20 text-[var(--accent-400)]'
                : 'bg-white/[0.02] border-white/[0.03] hover:border-white/10 text-white/70'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold tracking-wide">
                  {item}
                </div>

                <div className="text-[9px] text-white/35 mt-1 leading-relaxed">
                  Click to open settings section
                </div>
              </div>

              <div className="w-2 h-2 rounded-full bg-current opacity-70 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
