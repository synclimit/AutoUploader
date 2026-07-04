import { useEffect } from 'react'
import ConfigSection from './ConfigSection'
import ConfigRow from './ConfigRow'
import { useSettingsStore } from '../../../store/settings/settingsStore'

export default function ConfigSectionPanel() {
  const configSections = useSettingsStore((s) => s.configSections)
  const setSelectedCategory = useSettingsStore((s) => s.setSelectedCategory)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find the category matching the ID
            const section = configSections.find((s) => s.id === entry.target.id)
            if (section) {
              setSelectedCategory(section.title)
            }
          }
        })
      },
      { root: document.getElementById('settings-scroll-container'), threshold: 0.6 }
    )

    configSections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [configSections, setSelectedCategory])

  return (
    <div className="overflow-y-auto pr-1 space-y-4 scroll-smooth min-h-0" id="settings-scroll-container">
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
                options={row.options}
              />
            ))}
          </div>
        </ConfigSection>
      ))}
    </div>
  )
}
