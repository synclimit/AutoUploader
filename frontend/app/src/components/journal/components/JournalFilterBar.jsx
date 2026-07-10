import React from 'react';
import { Search, Filter, RefreshCw, Download, Calendar } from 'lucide-react';

export default function JournalFilterBar({
  search, setSearch, setIsSearchFocused,
  statusFilter, setStatusFilter,
  dateFilter, setDateFilter,
  refreshInterval, setRefreshInterval,
  onRefresh, onExportCSV, loading
}) {
  return (
    <div className="flex flex-col gap-3 p-4 border-b border-white/5 bg-[#0A0A0A]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search correlation, execution, task..."
              className="h-[36px] w-full rounded-lg border border-white/10 bg-black/40 pl-9 pr-4 text-[13px] text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[36px] appearance-none rounded-lg border border-white/10 bg-black/40 pl-9 pr-8 text-[13px] text-white focus:border-white/20 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="UPLOADED">Uploaded</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RUNNING">Running</option>
              <option value="READY">Ready</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-[36px] appearance-none rounded-lg border border-white/10 bg-black/40 pl-9 pr-8 text-[13px] text-white focus:border-white/20 focus:outline-none"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Interval */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="h-[36px] rounded-lg border border-white/10 bg-black/40 px-3 text-[13px] text-white focus:border-white/20 focus:outline-none"
          >
            <option value={0}>Manual Refresh</option>
            <option value={30}>30 Seconds</option>
            <option value={60}>1 Minute</option>
            <option value={300}>5 Minutes</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            className="flex h-[36px] items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 text-[13px] font-medium text-white hover:bg-white/5"
          >
            <Download className="h-4 w-4 text-white/50" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
