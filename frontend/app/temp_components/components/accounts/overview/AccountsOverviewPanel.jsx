import AccountsAnalyticsPanel from "../analytics/AccountsAnalyticsPanel"
import AnalyticsMetric from "../analytics/AnalyticsMetric"
import WorkspacePanel from "../workspace/WorkspacePanel"
import WorkspaceCard from "../workspace/WorkspaceCard"
import AccountsPanel from "../accounts/AccountsPanel"
import AccountsLogsPanel from "../logs/AccountsLogsPanel"
import AccountsLogItem from "../logs/AccountsLogItem"
import { useAccountsStore } from "../../../store/accounts/accountsStore"


export default function AccountsOverviewPanel() {

  const stats = useAccountsStore((s) => s.stats)
  const accounts = useAccountsStore((s) => s.accounts)
  const logs = useAccountsStore((s) => s.logs)


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

      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_420px] gap-4 min-h-0">

        <WorkspacePanel>

          {accounts.map((item) => (

            <WorkspaceCard
              key={item.id}
              item={item}
            />

          ))}

        </WorkspacePanel>

        <div className="overflow-hidden flex flex-col gap-4 min-h-0">

          <AccountsPanel />

          <AccountsLogsPanel>

            {logs.map((log, i) => (

              <AccountsLogItem
                key={i}
                message={log}
              />

            ))}

          </AccountsLogsPanel>

        </div>

      </div>

    </div>

  )

}
