import SettingsLogItem from './SettingsLogItem'
import { useSettingsStore } from '../../../store/settings/settingsStore'

export default function SettingsLogsPanel() {
  const logs = useSettingsStore((s) => s.logs)

  return (
    <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="h-[52px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
        <div>
          <div className="text-[12px] font-semibold text-[var(--accent-400)]">
            Configuration Logs
          </div>

          <div className="text-[9px] text-white/35 mt-1">
            Realtime settings activity logs
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-[8px] text-white/65 font-mono snap-y snap-mandatory scroll-smooth overflow-x-hidden">
        {logs.map((item, index) => (
          <SettingsLogItem key={index} message={item} />
        ))}
      </div>
    </div>
  )
}
