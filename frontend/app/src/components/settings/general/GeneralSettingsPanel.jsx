import SettingCard from './SettingCard'
import { useSettingsStore } from '../../../store/settings/settingsStore'

export default function GeneralSettingsPanel() {
  const systemCards = useSettingsStore((s) => s.systemCards)

  return (
    <div className="grid grid-cols-4 gap-3 shrink-0">
      {systemCards.map((item) => (
        <SettingCard
          key={item.title}
          title={item.title}
          value={item.value}
          color={item.color}
        />
      ))}
    </div>
  )
}
