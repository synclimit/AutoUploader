import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../../api/client';
import toast from 'react-hot-toast';

import JournalFilterBar from './JournalFilterBar';
import JournalTable from './JournalTable';
import JournalPagination from './JournalPagination';
import EmptyState from './EmptyState';
import ExecutionDetailDrawer from './ExecutionDetailDrawer';

export default function UploadJournal({ initialSessionId, initialChannelId }) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch Params
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // Today, Yesterday, Last 7 Days, This Week, This Month
  const [sort, setSort] = useState('created_at_desc');
  
  // UI State
  const [refreshInterval, setRefreshInterval] = useState(0); // 0=Manual, 30, 60, 300
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const abortControllerRef = useRef(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchJournal = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', pageSize);
      params.append('sort', sort);
      
      if (initialSessionId) params.append('review_session_id', initialSessionId);
      if (initialChannelId) params.append('channel_id', initialChannelId);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.append('execution_status', statusFilter);
      
      // Handle Date Filters here if implemented on backend, or format dates to date_from / date_to
      if (dateFilter !== 'ALL') {
         // simplified date handling for mock purposes, would normally calculate ISO dates
         // e.g. params.append('date_from', calculateDate(dateFilter))
      }

      const res = await apiClient.get(`/api/v1/campaign-execution/journal?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });

      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.message !== 'canceled') {
        setError(err.response?.status === 403 ? 403 : err.message);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, pageSize, sort, initialSessionId, initialChannelId, debouncedSearch, statusFilter, dateFilter]);

  // Initial Fetch & Dependency Changes
  useEffect(() => {
    fetchJournal();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchJournal]);

  // Auto Refresh
  useEffect(() => {
    if (refreshInterval === 0 || isSearchFocused || loading) return;
    
    const interval = setInterval(() => {
      fetchJournal(true);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval, isSearchFocused, loading, fetchJournal]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (initialSessionId) params.append('review_session_id', initialSessionId);
      if (initialChannelId) params.append('channel_id', initialChannelId);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.append('execution_status', statusFilter);
      
      const url = `/api/v1/campaign-execution/journal/export?${params.toString()}`;
      window.open(url, '_blank');
      toast.success('CSV Export Started');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  return (
    <div className="flex h-full w-full flex-col relative">
      <JournalFilterBar
        search={search}
        setSearch={setSearch}
        setIsSearchFocused={setIsSearchFocused}
        statusFilter={statusFilter}
        setStatusFilter={(val) => { setStatusFilter(val); setPage(1); }}
        dateFilter={dateFilter}
        setDateFilter={(val) => { setDateFilter(val); setPage(1); }}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        onRefresh={() => fetchJournal()}
        onExportCSV={handleExportCSV}
        loading={loading}
      />
      
      <div className="flex-1 overflow-hidden relative">
        {error ? (
          <EmptyState type={error === 403 ? '403' : 'ERROR'} message={error} />
        ) : loading && data.items.length === 0 ? (
          <EmptyState type="LOADING" />
        ) : data.items.length === 0 ? (
          <EmptyState type={debouncedSearch || statusFilter !== 'ALL' ? 'NO_RESULT' : 'EMPTY'} />
        ) : (
          <JournalTable
            items={data.items}
            sort={sort}
            setSort={setSort}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <JournalPagination
        page={page}
        pageSize={pageSize}
        total={data.total}
        setPage={setPage}
        setPageSize={(size) => { setPageSize(size); setPage(1); }}
        disabled={loading}
      />

      {drawerOpen && selectedRow && (
        <ExecutionDetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          data={selectedRow}
        />
      )}
    </div>
  );
}
