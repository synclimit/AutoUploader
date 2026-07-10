import { useAppStore } from './store/app/appStore'
import { useSplashStore } from './store/splashStore'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

import ReviewShell from './components/review/layout/ReviewShell'
import ReviewWorkspace from './components/review/overview/ReviewWorkspace'

import UploadsShell from './components/uploads/layout/UploadsShell'
import UploadsOverviewPanel from './components/uploads/overview/UploadsOverviewPanel'

import LogsShell from './components/logs/layout/LogsShell'
import LogsOverviewPanel from './components/logs/overview/LogsOverviewPanel'

import CompletedShell from './components/completed/layout/CompletedShell'
import CompletedWorkspace from './components/completed/overview/CompletedWorkspace'

import DashboardShell from './components/dashboard/layout/DashboardShell'
import DashboardOverviewPanel from './components/dashboard/overview/DashboardOverviewPanel'

import ChannelsShell from './components/channels/layout/ChannelsShell'
import ChannelsWorkspace from './components/channels/overview/ChannelsWorkspace'

import PreferencesShell from './components/preferences/layout/PreferencesShell'
import PreferencesWorkspace from './components/preferences/overview/PreferencesWorkspace'

import AnalyticsShell from './components/analytics/layout/AnalyticsShell'
import AnalyticsWorkspace from './components/analytics/overview/AnalyticsWorkspace'

import JournalShell from './components/journal/layout/JournalShell'
import JournalWorkspace from './components/journal/overview/JournalWorkspace'


function renderModule(activeModule) {
  switch (activeModule) {
    case 'Journal':
      return (
        <JournalShell>
          <JournalWorkspace />
        </JournalShell>
      )

    case 'Upload':
      return (
        <UploadsShell>
          <UploadsOverviewPanel />
        </UploadsShell>
      )

    case 'Review':
      return (
        <ReviewShell>
          <ReviewWorkspace />
        </ReviewShell>
      )

    case 'Complete':
      return (
        <CompletedShell>
          <CompletedWorkspace />
        </CompletedShell>
      )

    case 'Dashboard':
      return (
        <DashboardShell>
          <DashboardOverviewPanel />
        </DashboardShell>
      )

    case 'Channels':
      return (
        <ChannelsShell>
          <ChannelsWorkspace />
        </ChannelsShell>
      )

    case 'Analytics':
      return (
        <AnalyticsShell>
          <AnalyticsWorkspace />
        </AnalyticsShell>
      )

    case 'Settings':
      return (
        <PreferencesShell>
          <PreferencesWorkspace />
        </PreferencesShell>
      )

    default:
      return null
  }
}

import AccountsConfirm from './components/accounts/accounts/AccountsConfirm'
import NotificationToast from './components/common/NotificationToast'
import { Toaster } from 'react-hot-toast'
import ActivationWizard from './components/license/ActivationWizard'

import { useEffect } from 'react'
import { useSettingsStore } from './store/settings/settingsStore'

export default function App() {

  const activeModule = useAppStore((s) => s.activeModule)
  const licenseValid = useSplashStore((s) => s.licenseValid)
  const licenseData = useSplashStore((s) => s.licenseData)
  const recheckLicense = useSplashStore((s) => s.recheckLicense)
  const config = useSettingsStore(s => s.config)

  useEffect(() => {
    if (!config) return
    
    // Theme
    document.body.classList.remove('theme-dark', 'theme-midnight', 'theme-hc')
    document.body.classList.add(`theme-${config.general_theme}`)
    
    // Accent
    document.body.classList.remove('accent-cyan', 'accent-purple', 'accent-green')
    document.body.classList.add(`accent-${config.app_color}`)
    
    // Density
    document.body.classList.remove('density-comfortable', 'density-compact')
    document.body.classList.add(`density-${config.app_density}`)
    
    // Animations
    if (config.app_anim) {
      document.body.classList.remove('no-anim')
    } else {
      document.body.classList.add('no-anim')
    }
  }, [config])

  // Handle OAuth callback route natively
  if (window.location.pathname === '/accounts/confirm') {
    return <AccountsConfirm />
  }

  if (!licenseValid) {
    return (
      <div className="h-screen w-screen bg-[var(--bg-primary)] text-white overflow-hidden flex flex-col relative" style={{'--bg-primary': 'var(--bg-primary, #0b0f17)'}}>
        <ActivationWizard statusData={licenseData} checkLicense={recheckLicense} />
        <NotificationToast />
        <Toaster position="bottom-right" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[var(--bg-primary)] text-white overflow-hidden flex" style={{'--bg-primary': 'var(--bg-primary, #0b0f17)'}}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Topbar />

        <main className="flex-1 flex flex-col min-h-0">
          {renderModule(activeModule)}
        </main>

      </div>
      <NotificationToast />
      <Toaster position="bottom-right" />
    </div>

  )

}
