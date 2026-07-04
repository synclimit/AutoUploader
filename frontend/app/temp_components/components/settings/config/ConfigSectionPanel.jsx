import ConfigSection from './ConfigSection'
import ConfigRow from './ConfigRow'
import { useSettingsStore } from '../../../store/settings/settingsStore'

export default function ConfigSectionPanel() {
  const configSections = useSettingsStore((s) => s.configSections)

  return (
    <div className="overflow-y-auto pr-1 space-y-4 snap-y snap-mandatory scroll-smooth min-h-0" id="settings-scroll-container">
      {configSections.map((section) => (
        <ConfigSection
          key={section.id}
          title={section.title}
          description={section.description}
          status={section.status}
          stickyHeader
          id={section.id}
        >
          <div className="space-y-2">
            {section.rows.map((row, i) => (
              <ConfigRow
                key={i}
                label={row.label}
                description={row.description}
                type={row.type}
                value={row.value}
              />
            ))}
          </div>
        </ConfigSection>
      ))}
    </div>
  )
}
