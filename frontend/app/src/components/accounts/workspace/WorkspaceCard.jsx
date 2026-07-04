import AccountStatusBadge from "../accounts/AccountStatusBadge"


const STATUS_STYLE = {
  ACTIVE: "text-green-300 border-green-500/20 bg-green-500/10",
  WARNING: "text-orange-300 border-orange-500/20 bg-orange-500/10",
  LIMITED: "text-red-300 border-red-500/20 bg-red-500/10",
}


export default function WorkspaceCard({ item }) {

  return (

    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 snap-start">

      <div className="flex items-start gap-4">

        <div className="w-[56px] h-[56px] rounded-full overflow-hidden border border-white/10 shrink-0">

          <img
            src={item.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop'}
            className="w-full h-full object-cover"
            alt="avatar"
          />

        </div>

        <div className="flex-1 min-w-0">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="text-[15px] font-semibold text-white/95 leading-relaxed break-words">
                {item.channel_name}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                {item.channel_name.toLowerCase().replace(' ', '')}
              </div>
            </div>
            <AccountStatusBadge status={item.authentication_status || 'Disconnected'} />

          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">

            <MiniMeta
              label="Profile"
              value={item.profile_name || 'None'}
            />
            <MiniMeta
              label="Source"
              value={item.source_type}
            />
            <MiniMeta
              label="Region"
              value={item.region}
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#10141c] px-3 py-2">
            <div className="text-[9px] uppercase tracking-wide text-white/30">
              Watch Folder
            </div>
            <div className="text-[11px] text-white/50 font-medium">
              Not Connected
            </div>
          </div>

        </div>

      </div>

    </div>

  )

}


function MiniMeta({ label, value }) {

  return (

    <div className="rounded-xl border border-white/[0.03] bg-[#10141c] px-3 py-2">

      <div className="text-[8px] uppercase tracking-[0.08em] text-white/30">

        {label}

      </div>

      <div className="text-[11px] text-white/90 font-semibold mt-1 leading-relaxed break-words">

        {value}

      </div>

    </div>

  )

}
