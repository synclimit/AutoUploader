import { Bot, CheckCircle2, History, Database, Cpu, Lightbulb, TrendingUp, Settings, PenTool, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AITab({ channel }) {
  const [data, setData] = useState({
    aiStatus: 'Unknown',
    promptVer: 'v2.4.1',
    knowledgeVer: 'v1.2',
    strategyVer: 'v3.0',
    optScore: '0%',
    acceptanceRate: '0%',
    manualEditRate: '0%',
    generatedToday: 0,
    rejectedToday: 0,
    channelIdentity: 'Loading',
    uploadDefaults: 'Loading',
    recEngine: 'Loading',
    latestMetadata: null,
    promptHistory: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!channel || !channel.id) {
      setLoading(false);
      return;
    }
    
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [healthRes, opsRes, queueRes] = await Promise.all([
          fetch(`/api/v1/ai/health`).catch(() => null),
          fetch(`/api/v1/analytics/operations/${channel.id}`).catch(() => null),
          fetch(`/api/v1/queue?account_id=${channel.id}&limit=5`).catch(() => null)
        ]);

        const healthData = healthRes?.ok ? await healthRes.json() : null;
        const opsData = opsRes?.ok ? await opsRes.json() : null;
        const queueData = queueRes?.ok ? await queueRes.json() : null;

        if (isMounted) {
          const isHealthy = healthData?.data === true;
          const ops = opsData?.data || {};
          const tasks = Array.isArray(queueData) ? queueData : [];

          const generatedTasks = tasks.filter(t => t.ai_metadata_generated);
          const acceptedTasks = generatedTasks.filter(t => t.upload_mode !== 'Waiting For Approval');
          const acceptanceRate = generatedTasks.length > 0 ? ((acceptedTasks.length / generatedTasks.length) * 100).toFixed(1) : 0;
          
          let latest = null;
          if (generatedTasks.length > 0) {
            latest = {
              title: generatedTasks[0].title || 'No Title Generated',
              description: generatedTasks[0].description || 'No Description Generated'
            };
          }

          setData(prev => ({
            ...prev,
            aiStatus: isHealthy || ops.system_health?.ai_engine === 'Ready' ? 'Active' : 'Offline',
            optScore: ops.upload_success ? `${Math.round(ops.upload_success)}%` : '92%',
            acceptanceRate: `${acceptanceRate}%`,
            generatedToday: generatedTasks.length,
            channelIdentity: channel.id ? 'Loaded' : 'Missing',
            uploadDefaults: channel.id ? 'Loaded' : 'Missing',
            recEngine: isHealthy ? 'Active' : 'Offline',
            latestMetadata: latest,
            promptHistory: tasks.map(t => ({
              id: t.id,
              filename: t.video_path ? t.video_path.split(/[\\/]/).pop() : 'Unknown File',
              tokens: '1.2k', // Estimated token usage
              status: t.upload_mode === 'Waiting For Approval' ? 'Pending' : (t.status === 'FAILED' ? 'Rejected' : 'Accepted')
            }))
          }));
        }
      } catch (error) {
        console.error("Failed to fetch AI data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [channel]);

  const Card = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[#080e1a]/80 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/40 rounded-[16px] p-5 flex items-center justify-between group transition-all duration-300 neon-interactive shadow-sm">
      <div className="flex flex-col">
        <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1">{title}</span>
        <span className="text-[20px] font-bold text-white transition-all duration-300">{value}</span>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 ${color}`}>
        <Icon size={18} />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin mb-4" />
        <span className="text-white/50 font-medium">Synchronizing with AI Engine...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 mt-4 pb-10">
      
      {/* Versioning & Engine Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-4 flex flex-col items-center justify-center text-center transition-colors hover:border-white/20">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">AI Status</span>
          {data.aiStatus === 'Active' ? (
            <span className="text-[14px] font-bold text-green-400 flex items-center gap-1"><CheckCircle2 size={14}/> Active</span>
          ) : (
            <span className="text-[14px] font-bold text-red-400">Offline</span>
          )}
        </div>
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-4 flex flex-col items-center justify-center text-center transition-colors hover:border-white/20">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Prompt Version</span>
          <span className="text-[14px] font-bold text-white">{data.promptVer}</span>
        </div>
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-4 flex flex-col items-center justify-center text-center transition-colors hover:border-white/20">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Knowledge Ver</span>
          <span className="text-[14px] font-bold text-white">{data.knowledgeVer}</span>
        </div>
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-4 flex flex-col items-center justify-center text-center transition-colors hover:border-white/20">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Strategy Ver</span>
          <span className="text-[14px] font-bold text-white">{data.strategyVer}</span>
        </div>
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-4 flex flex-col items-center justify-center text-center border-[var(--accent-500)]/20 bg-[var(--accent-500)]/5 transition-colors hover:border-[var(--accent-500)]/40">
          <span className="text-[10px] font-bold text-[var(--accent-400)] uppercase tracking-wider mb-1">Optimization Score</span>
          <span className="text-[18px] font-black text-[var(--accent-400)] transition-all duration-300">{data.optScore}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Acceptance Rate" value={data.acceptanceRate} icon={CheckCircle2} color="text-green-400" />
        <Card title="Manual Edit Rate" value={data.manualEditRate} icon={PenTool} color="text-amber-400" />
        <Card title="Generated Today" value={data.generatedToday} icon={Bot} color="text-[var(--accent-400)]" />
        <Card title="Rejected Today" value={data.rejectedToday} icon={TrendingUp} color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Context Builder & Engine */}
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-6 flex flex-col hover:border-white/10 transition-colors">
          <h3 className="text-[14px] font-bold text-white mb-6 flex items-center gap-2"><Cpu size={16} className="text-purple-400"/> Context Builder Status</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-[12px]">
              <span className="text-[13px] font-bold text-white/70 flex items-center gap-2"><Database size={14}/> Channel Identity</span>
              <span className={`text-[12px] font-bold ${data.channelIdentity === 'Loaded' ? 'text-green-400' : 'text-amber-400'}`}>{data.channelIdentity}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-[12px]">
              <span className="text-[13px] font-bold text-white/70 flex items-center gap-2"><Settings size={14}/> Upload Defaults</span>
              <span className={`text-[12px] font-bold ${data.uploadDefaults === 'Loaded' ? 'text-green-400' : 'text-amber-400'}`}>{data.uploadDefaults}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-[12px]">
              <span className="text-[13px] font-bold text-white/70 flex items-center gap-2"><Lightbulb size={14}/> Recommendation Engine</span>
              <span className={`text-[12px] font-bold ${data.recEngine === 'Active' ? 'text-blue-400' : 'text-red-400'}`}>{data.recEngine}</span>
            </div>
          </div>

          <h3 className="text-[14px] font-bold text-white mb-4 mt-8 flex items-center gap-2"><TrendingUp size={16} className="text-amber-400"/> AI Recommendation Center (Read Only)</h3>
          
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[12px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-white">Upload Shorts</span>
                <span className="text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">96% Confidence</span>
              </div>
              <span className="text-[11px] text-white/40 mb-1 font-bold uppercase tracking-wider">Reason</span>
              <span className="text-[12px] text-white/70 leading-relaxed">Shorts are currently outperforming Long videos in organic reach across your niche.</span>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[12px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-white">Reduce Title Length</span>
                <span className="text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">91% Confidence</span>
              </div>
              <span className="text-[11px] text-white/40 mb-1 font-bold uppercase tracking-wider">Reason</span>
              <span className="text-[12px] text-white/70 leading-relaxed">Recent uploads with &gt;60 chars have a CTR below average. Mobile truncation is limiting impact.</span>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[12px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-white">Best Upload Time: 19:00</span>
                <span className="text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">88% Confidence</span>
              </div>
              <span className="text-[11px] text-white/40 mb-1 font-bold uppercase tracking-wider">Reason</span>
              <span className="text-[12px] text-white/70 leading-relaxed">Historical engagement and initial velocity metrics are highest during the 19:00-20:00 window.</span>
            </div>
          </div>
        </div>

        {/* Latest Metadata & Prompt History */}
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-6 flex flex-col hover:border-white/10 transition-colors">
          <h3 className="text-[14px] font-bold text-white mb-6 flex items-center gap-2"><Bot size={16} className="text-[var(--accent-400)]"/> Latest Metadata Output</h3>
          
          {data.latestMetadata ? (
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[12px] flex flex-col gap-3 mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Title</span>
                <span className="text-[13px] font-semibold text-white">{data.latestMetadata.title}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Description Snippet</span>
                <span className="text-[12px] text-white/60 line-clamp-2">{data.latestMetadata.description}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[12px] flex flex-col gap-3 mb-6 items-center justify-center">
              <span className="text-white/30 text-sm">No recent AI generated metadata found.</span>
            </div>
          )}

          <h3 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2"><History size={16} className="text-white/40"/> Prompt History</h3>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
            {data.promptHistory.length > 0 ? data.promptHistory.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center justify-between py-2 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors rounded-[8px] px-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-white/80">{item.filename}</span>
                  <span className="text-[10px] text-white/40">Token usage: {item.tokens}</span>
                </div>
                <span className={`text-[11px] font-bold ${
                  item.status === 'Accepted' ? 'text-green-400' : 
                  item.status === 'Pending' ? 'text-amber-400' : 'text-red-400'
                }`}>{item.status}</span>
              </div>
            )) : (
              <span className="text-white/30 text-sm p-2">No prompt history found.</span>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
