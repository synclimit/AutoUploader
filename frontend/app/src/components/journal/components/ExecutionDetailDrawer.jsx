import React from 'react';
import { X, Copy, Check, Clock, FileText, Monitor, Video, Hash } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DetailRow = ({ label, value, icon: Icon, copyable }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-[12px] font-medium text-white/40 uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="text-[14px] text-white/90 break-all font-mono">
          {value || '--'}
        </div>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function ExecutionDetailDrawer({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-[450px] flex-col bg-[#0A0A0A] shadow-2xl border-l border-white/10 animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Execution Detail</h2>
            <p className="text-[13px] text-white/50">Read-only historical snapshot</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          
          <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-1">
             <div className="px-4 py-2 bg-white/5 rounded-t-lg font-semibold text-white/70 text-[12px] uppercase tracking-wider border-b border-white/5">
                Timeline & Status
             </div>
             <div className="px-4">
               <DetailRow label="Result" value={data.result || data.status} icon={Clock} />
               <DetailRow label="Started At" value={data.started_at ? format(new Date(data.started_at), 'PPP pp') : null} />
               <DetailRow label="Finished At" value={data.finished_at ? format(new Date(data.finished_at), 'PPP pp') : null} />
               <DetailRow label="Duration" value={`${data.duration_seconds || 0} seconds`} />
             </div>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-1">
             <div className="px-4 py-2 bg-white/5 rounded-t-lg font-semibold text-white/70 text-[12px] uppercase tracking-wider border-b border-white/5">
                Identifiers & Correlation
             </div>
             <div className="px-4">
               <DetailRow label="Correlation ID" value={data.correlation_id} icon={Hash} copyable />
               <DetailRow label="Execution No" value={data.execution_no} copyable />
               <DetailRow label="UploadTask ID" value={data.upload_task_id} copyable />
               <DetailRow label="CampaignUploadPlan ID" value={data.campaign_upload_plan_id} copyable />
               <DetailRow label="Review Session ID" value={data.review_session_id} copyable />
               <DetailRow label="Campaign ID" value={data.campaign_id} copyable />
             </div>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-1">
             <div className="px-4 py-2 bg-white/5 rounded-t-lg font-semibold text-white/70 text-[12px] uppercase tracking-wider border-b border-white/5">
                Metadata Snapshot
             </div>
             <div className="px-4">
               <DetailRow label="Video Title" value={data.video_title} icon={FileText} />
               <DetailRow label="Filename" value={data.filename} />
               <DetailRow label="YouTube Video ID" value={data.youtube_video_id} icon={Video} copyable />
               <DetailRow label="Browser Profile" value={data.browser_profile} icon={Monitor} />
             </div>
          </div>

          {(data.failure_reason || data.error_message) && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-1">
               <div className="px-4 py-2 bg-red-500/10 rounded-t-lg font-semibold text-red-400 text-[12px] uppercase tracking-wider border-b border-red-500/10">
                  Failure History
               </div>
               <div className="px-4 text-red-300">
                 <DetailRow label="Category" value={data.failure_category} />
                 <DetailRow label="Reason" value={data.failure_reason} />
                 <DetailRow label="Error Message" value={data.error_message} />
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
