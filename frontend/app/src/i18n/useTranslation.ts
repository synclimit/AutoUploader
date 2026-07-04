import { useSettingsStore } from '../store/settings/settingsStore'
import { translations } from './translations'

export function useTranslation() {
  const config = useSettingsStore(s => s.config)
  const lang = config?.general_language || 'en'

  const t = (key) => {
    const dict = translations[lang] || translations['en']
    return dict[key] || translations['en'][key] || key
  }

  return { t, lang }
}
