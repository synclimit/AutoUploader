import AutomationRuleCard from './AutomationRuleCard'
import { useSettingsStore } from '../../../store/settings/settingsStore'

export default function AutomationSettingsPanel() {
  const monitorCards = useSettingsStore((s) => s.monitorCards)

  return (
    <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[44%] min-h-[260px]">
      <div className="h-[54px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
        <div>
          <div className="text-[12px] font-semibold text-orange-300">
            System Monitor
          </div>

          <div className="text-[9px] text-white/35 mt-1">
            Current automation health
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 snap-y snap-mandatory scroll-smooth">
        {monitorCards.map((card) => (
          <AutomationRuleCard
            key={card.title}
            title={card.title}
            value={card.value}
          />
        ))}
      </div>
    </div>
  )
}
