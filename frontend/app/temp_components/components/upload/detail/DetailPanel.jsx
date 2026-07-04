import MetadataEditor from './MetadataEditor'

import UploadSettings from './UploadSettings'


export default function DetailPanel() {

  return (

    <div className="flex-1 min-h-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">

      <div className="h-[64px] border-b border-white/[0.04] px-4 flex items-center shrink-0">

        <div>

          <div className="text-[18px] font-bold text-purple-300">

            Detail Panel

          </div>

          <div className="text-[11px] text-white/35 mt-1">

            Metadata & upload settings

          </div>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        <MetadataEditor />

        <UploadSettings />

      </div>

      <div className="border-t border-white/[0.05] p-4 flex gap-3 bg-[#0d121b] shrink-0">

        <button className="flex-1 h-[48px] rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-bold hover:bg-cyan-500/20 transition-all">

          Save Metadata

        </button>

        <button className="flex-1 h-[48px] rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-bold hover:bg-green-500/20 transition-all">

          Upload To YouTube

        </button>

      </div>

    </div>

  )

}
