import SettingsHeader from '../layout/SettingsHeader'
import GeneralSettingsPanel from '../general/GeneralSettingsPanel'
import CategoryNavPanel from '../category/CategoryNavPanel'
import ConfigSectionPanel from '../config/ConfigSectionPanel'
import AutomationSettingsPanel from '../automation/AutomationSettingsPanel'
import SettingsLogsPanel from '../logs/SettingsLogsPanel'

export default function SettingsOverviewPanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SettingsHeader />

      <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4 min-h-0">
        <GeneralSettingsPanel />

        <div className="flex-1 overflow-hidden grid grid-cols-[220px_1fr] gap-4 min-h-0">
          <CategoryNavPanel />

          <div className="overflow-hidden grid grid-cols-[1fr_300px] gap-4 min-h-0">
            <ConfigSectionPanel />

            <div className="overflow-hidden flex flex-col gap-4 min-h-0">
              <AutomationSettingsPanel />
              <SettingsLogsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
