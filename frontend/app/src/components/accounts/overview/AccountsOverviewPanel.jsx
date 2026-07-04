import AccountsAnalyticsPanel from "../analytics/AccountsAnalyticsPanel"
import AnalyticsMetric from "../analytics/AnalyticsMetric"
import WorkspacePanel from "../workspace/WorkspacePanel"
import WorkspaceCard from "../workspace/WorkspaceCard"
import AccountsPanel from "../accounts/AccountsPanel"
import AccountCreateForm from "../accounts/AccountCreateForm"
import ProfilesWorkspacePanel from "../profiles/ProfilesWorkspacePanel"
import ProfileDetailPanel from "../profiles/ProfileDetailPanel"
import ProfileCreateForm from "../profiles/ProfileCreateForm"
import { useAccountsStore } from "../../../store/accounts/accountsStore"
import { useProfileStore } from "../../../store/profiles/profileStore"
import { useState, useEffect } from "react"
import EmptyState from "../../common/EmptyState"

export default function AccountsOverviewPanel() {
  const { fetchProfile } = useProfileStore()
  
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const fetchAccount = useAccountsStore((s) => s.fetchAccount)
  
  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const stats = useAccountsStore((s) => s.stats)
  const accounts = useAccountsStore((s) => s.accounts)
  const logs = useAccountsStore((s) => s.logs)

  const [activeTab, setActiveTab] = useState('Channels')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)


  return (

    <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4 min-h-0">

      <AccountsAnalyticsPanel>

        {stats.map((item) => (

          <AnalyticsMetric
            key={item.title}
            title={item.title}
            value={item.value}
            color={item.color}
          />

        ))}

      </AccountsAnalyticsPanel>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('Channels')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'Channels' 
              ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] border border-[var(--accent-500)]/30' 
              : 'bg-[#101722] text-white/40 border border-white/5 hover:bg-white/5 hover:text-white/60'
          }`}
        >
          Channels
        </button>
        <button
          onClick={() => setActiveTab('Profiles')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'Profiles' 
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
              : 'bg-[#101722] text-white/40 border border-white/5 hover:bg-white/5 hover:text-white/60'
          }`}
        >
          Profiles
        </button>
      </div>

      <div className="flex-1 overflow-hidden grid gap-4 min-h-0" style={{ gridTemplateColumns: '35% 65%' }}>
        {activeTab === 'Channels' ? (
          <>
            <WorkspacePanel onAddAccount={() => setIsCreatingAccount(true)}>
              {accounts.length === 0 ? (
                <div className="h-[300px]">
                  <EmptyState 
                    icon="◉" 
                    title="No Channels" 
                    description="You haven't connected any YouTube channels yet." 
                  />
                </div>
              ) : (
                accounts.map((item) => (
                  <div key={item.id} className="cursor-pointer" onClick={() => {
                    fetchAccount(item.id)
                    setIsCreatingAccount(false)
                  }}>
                    <WorkspaceCard item={item} />
                  </div>
                ))
              )}
            </WorkspacePanel>
            <div className="overflow-hidden flex flex-col gap-4 min-h-0">
              {isCreatingAccount ? (
                <AccountCreateForm onCancel={() => setIsCreatingAccount(false)} />
              ) : (
                <AccountsPanel />
              )}
            </div>
          </>
        ) : (
          <>
            <ProfilesWorkspacePanel 
              onCreateProfile={() => setIsCreatingProfile(true)} 
              onSelectProfile={(id) => {
                setIsCreatingProfile(false)
                fetchProfile(id)
              }} 
            />
            <div className="overflow-hidden flex flex-col gap-4 min-h-0">
              {isCreatingProfile ? (
                <ProfileCreateForm onCancel={() => setIsCreatingProfile(false)} />
              ) : (
                <ProfileDetailPanel />
              )}
            </div>
          </>
        )}
      </div>

    </div>

  )

}
