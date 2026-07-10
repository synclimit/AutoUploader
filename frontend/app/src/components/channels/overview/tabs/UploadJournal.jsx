import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../../../api/client';
import { Activity, Clock, AlertTriangle, Search, Filter, ArrowUpDown, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadJournal({ sessionId }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchJournals = async () => {
      try {
        const res = await apiClient.get(`/api/v1/campaign-execution/journal/${sessionId}`);
        if (mounted && res && res.data) {
          setJournals(res.data);
        }
      } catch (e) {
        console.error("Failed to load upload journal", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchJournals();
    
    const interval = setInterval(fetchJournals, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id || '');
    setCopiedId(id);
    toast.success('Correlation ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredJournals = useMemo(() => {
    let list = [...journals];

    if (statusFilter !== 'ALL') {
      list = list.filter(j => (j.status || '').toUpperCase() === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j => 
        (j.youtube_video_id || '').toLowerCase().includes(q) ||
        (j.error_message || '').toLowerCase().includes(q) ||
        (j.id || '').toString().toLowerCase().includes(q) ||
        (j.status || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'OLDEST') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === 'DURATION') {
        return (b.duration_seconds || 0) - (a.duration_seconds || 0);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return list;
  }, [journals, searchQuery, statusFilter, sortBy]);

  if (loading) return null;
  if (journals.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/[0.04]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-[12px] font-bold text-white/70 tracking-wider uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Upload Execution Journal ({filteredJournals.length}/{journals.length})
        </h3>

        {/* Search, Filter, Sort Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-[6px]">
            <Search size={13} className="text-white/40" />
            <input
              type="text"
              placeholder="Search ID, Video, Error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-white placeholder-white/30 w-[140px]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 px-2 py-1 rounded-[6px]">
            <Filter size={13} className="text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-cyan-300 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111824] text-white">All Status</option>
              <option value="UPLOADED" className="bg-[#111824] text-white">Uploaded</option>
              <option value="FAILED" className="bg-[#111824] text-white">Failed</option>
              <option value="CANCELLED" className="bg-[#111824] text-white">Cancelled</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 px-2 py-1 rounded-[6px]">
            <ArrowUpDown size={13} className="text-white/40" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-cyan-300 outline-none cursor-pointer"
            >
              <option value="NEWEST" className="bg-[#111824] text-white">Newest First</option>
              <option value="OLDEST" className="bg-[#111824] text-white">Oldest First</option>
              <option value="DURATION" className="bg-[#111824] text-white">Duration</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-black/30 rounded-[8px] border border-white/[0.04] overflow-hidden max-h-[320px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="bg-[#111824] sticky top-0 shadow-md">
            <tr className="text-white/40 uppercase tracking-wider border-b border-white/[0.04]">
              <th className="px-3 py-2 w-[130px]">Timestamp</th>
              <th className="px-3 py-2 w-[110px]">Correlation ID</th>
              <th className="px-3 py-2 w-[90px]">Status</th>
              <th className="px-3 py-2 w-[70px]">Duration</th>
              <th className="px-3 py-2 w-[110px]">Video ID</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {filteredJournals.map((j, idx) => (
              <tr key={j.id || idx} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-2 text-white/70">
                  {new Date(j.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="text-white/50 truncate max-w-[70px]">{j.id || idx}</span>
                    <button
                      onClick={() => handleCopyId(j.id || idx)}
                      title="Copy Correlation ID"
                      className="p-1 hover:bg-white/10 rounded text-cyan-400 transition-colors"
                    >
                      {copiedId === (j.id || idx) ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-[4px] font-bold ${
                    j.status === 'UPLOADED' || j.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                    j.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                    j.status === 'CANCELLED' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {j.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-white/50">
                  {j.duration_seconds ? `${j.duration_seconds}s` : '-'}
                </td>
                <td className="px-3 py-2 text-cyan-400">
                  {j.youtube_video_id || '-'}
                </td>
                <td className="px-3 py-2">
                  {j.error_message ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{j.error_message}</span>
                    </span>
                  ) : j.publish_time ? (
                    <span className="text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Publish: {new Date(j.publish_time).toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="text-white/30">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
