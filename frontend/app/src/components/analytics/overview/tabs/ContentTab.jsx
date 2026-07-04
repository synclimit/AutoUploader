import { PlaySquare, BarChart, MessageCircle, ThumbsUp, Calendar, Zap, Bot, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ContentTab({ channel }) {
  const [stats, setStats] = useState({
    avgViews: 0,
    avgCtr: 0,
    aiGenerated: 0,
    queueSource: 'N/A'
  })

  const [topContent, setTopContent] = useState([])
  const [newestUploads, setNewestUploads] = useState([])
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
        // Hit real backend endpoints
        const [overviewRes, opsRes, videosRes] = await Promise.all([
          fetch(`/api/v1/analytics/overview/${channel.id}`).catch(() => null),
          fetch(`/api/v1/analytics/operations/${channel.id}`).catch(() => null),
          fetch(`/api/v1/analytics/videos/${channel.id}`).catch(() => null)
        ]);

        const overviewData = overviewRes?.ok ? await overviewRes.json() : null;
        const opsData = opsRes?.ok ? await opsRes.json() : null;
        const videosData = videosRes?.ok ? await videosRes.json() : null;

        if (isMounted) {
          const overview = overviewData?.data || {};
          const ops = opsData?.data || {};
          const vids = videosData?.data?.items || [];
          
          setStats({
            avgViews: overview.channel?.views || overview.analytics?.views || 0,
            avgCtr: overview.analytics?.ctr || 0,
            aiGenerated: ops.upload_success || 0,
            queueSource: ops.system_health?.watch_folder === 'Connected' ? 'Watch' : (ops.queue_items > 0 ? 'Queue' : 'N/A')
          });
          
          const mappedVideos = vids.map((v, i) => ({
            id: v.id || i,
            title: v.snippet?.title || 'Video Title',
            views: v.statistics?.viewCount || 0,
            ctr: 0,
            likes: v.statistics?.likeCount || 0,
            comments: v.statistics?.commentCount || 0,
            date: v.snippet?.publishedAt ? new Date(v.snippet.publishedAt).toLocaleDateString() : 'Unknown',
            ai: true,
            perf: 'normal'
          }));
          
          setTopContent(mappedVideos.slice(0, 3));
          setNewestUploads(mappedVideos.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch real data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s

    return () => {
      isMounted = false;
      clearInterval(interval);
    }
  }, [channel]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num
  }

  const VideoRow = ({ title, views, ctr, likes, comments, date, ai, perf }) => (
    <div className="flex items-center justify-between p-4 bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 rounded-[16px] transition-all duration-300 neon-interactive group shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-24 h-14 bg-[#10141c] rounded-[8px] flex items-center justify-center border border-[var(--accent-500)]/20 shrink-0 group-hover:border-[var(--accent-500)]/40 transition-colors">
          <PlaySquare size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-white leading-tight mb-1 truncate max-w-[300px]">{title}</span>
          <div className="flex items-center gap-3 text-[11px] font-medium text-white/50">
            <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
            {ai && <span className="flex items-center gap-1 text-[var(--accent-400)]"><Bot size={12} /> AI Gen</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-8 px-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 mb-0.5">Views</span>
          <span className="text-[13px] font-bold text-white transition-all duration-500 tabular-nums">{formatNumber(views)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 mb-0.5">CTR</span>
          <span className="text-[13px] font-bold text-white transition-all duration-500 tabular-nums">{ctr}%</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 mb-0.5">Likes</span>
          <span className="text-[13px] font-bold text-white transition-all duration-500 tabular-nums">{formatNumber(likes)}</span>
        </div>
        <div className="flex flex-col items-end w-20">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 mb-0.5">Perf</span>
          {perf === 'high' ? (
            <span className="flex items-center gap-1 text-[12px] font-bold text-green-400"><ArrowUpRight size={14}/> Top</span>
          ) : perf === 'low' ? (
            <span className="flex items-center gap-1 text-[12px] font-bold text-red-400"><ArrowDownRight size={14}/> Poor</span>
          ) : (
            <span className="text-[12px] font-bold text-white/50">—</span>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin mb-4" />
        <span className="text-white/50 font-medium">Fetching real data from API...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 mt-4 pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 transition-all duration-300 neon-interactive rounded-[16px] p-5 relative overflow-hidden group hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest block mb-1">Avg Views</span>
          <span className="text-2xl font-bold text-white transition-all duration-500 tabular-nums">{formatNumber(stats.avgViews)}</span>
        </div>
        <div className="bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 transition-all duration-300 neon-interactive rounded-[16px] p-5 relative overflow-hidden group hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest block mb-1">Avg CTR</span>
          <span className="text-2xl font-bold text-white transition-all duration-500 tabular-nums">{stats.avgCtr}%</span>
        </div>
        <div className="bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 transition-all duration-300 neon-interactive rounded-[16px] p-5 relative overflow-hidden group hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest block mb-1">AI Generated</span>
          <span className="text-2xl font-bold text-[var(--accent-400)] transition-all duration-500 tabular-nums">{stats.aiGenerated}%</span>
        </div>
        <div className="bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 transition-all duration-300 neon-interactive rounded-[16px] p-5 relative overflow-hidden group hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest block mb-1">Queue Source</span>
          <span className="text-2xl font-bold text-purple-400">{stats.queueSource}</span>
        </div>
      </div>

      <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 blur-[40px] rounded-full pointer-events-none" />
        <h3 className="text-[14px] font-bold text-white mb-6 flex items-center gap-2"><Zap size={16} className="text-amber-400"/> Top Performing Content</h3>
        <div className="flex flex-col gap-3">
          {topContent.length > 0 ? topContent.map(video => (
            <VideoRow key={video.id} {...video} />
          )) : (
            <span className="text-white/30 text-sm">No videos found.</span>
          )}
        </div>
      </div>

      <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 blur-[40px] rounded-full pointer-events-none" />
        <h3 className="text-[14px] font-bold text-white mb-6 flex items-center gap-2"><PlaySquare size={16} className="text-blue-400"/> Newest Uploads</h3>
        <div className="flex flex-col gap-3">
          {newestUploads.length > 0 ? newestUploads.map(video => (
            <VideoRow key={video.id} {...video} />
          )) : (
            <span className="text-white/30 text-sm">No videos found.</span>
          )}
        </div>
      </div>

    </div>
  )
}
