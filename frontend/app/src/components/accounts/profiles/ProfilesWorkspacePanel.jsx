import { useEffect, useState } from "react"
import { useProfileStore } from "../../../store/profiles/profileStore"

export default function ProfilesWorkspacePanel({ onCreateProfile, onSelectProfile }) {
  const { profiles, fetchProfiles, activeProfile } = useProfileStore()
  
  useEffect(() => {
    fetchProfiles()
  }, [])

  return (
    <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="h-[64px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">
        <div>
          <div className="text-sm font-semibold text-purple-300">
            Metadata Profiles
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            Global templates & strategy configs
          </div>
        </div>
        <button 
          onClick={onCreateProfile}
          className="h-[38px] px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-all">
          Create Profile
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
        {profiles.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelectProfile(item.id)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeProfile?.id === item.id 
                ? 'bg-purple-500/10 border-purple-500/30' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="text-[13px] font-bold text-white/90">{item.name}</div>
              {item.is_default && (
                <div className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[var(--accent-500)]/20 text-[var(--accent-400)]">DEFAULT</div>
              )}
            </div>
            <div className="text-[10px] text-white/40 mt-1">{item.content_type}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
