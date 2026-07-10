import React, { memo } from 'react';
import * as ReactWindow from 'react-window';
const List = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList;
import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'UPLOADED': return { color: 'text-green-400', icon: CheckCircle2 };
    case 'FAILED': return { color: 'text-red-400', icon: XCircle };
    case 'RUNNING': return { color: 'text-cyan-400', icon: Clock };
    case 'CANCELLED': return { color: 'text-yellow-400', icon: AlertTriangle };
    default: return { color: 'text-white/50', icon: Clock };
  }
};

const RowRenderer = memo(({ index, style, data }) => {
  const { items, onRowClick } = data;
  const item = items[index];
  
  const statusConfig = getStatusConfig(item.result || item.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      style={style}
      onClick={() => onRowClick(item)}
      className="flex items-center border-b border-white/5 bg-black/20 hover:bg-white/[0.02] cursor-pointer"
    >
      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 px-4 py-2 text-[13px] text-white/70">
        <div className="col-span-1">{item.attempt || 1}</div>
        <div className="col-span-2 truncate">{item.started_at ? format(new Date(item.started_at), 'MM/dd HH:mm:ss') : '--'}</div>
        <div className="col-span-2 truncate">{item.finished_at ? format(new Date(item.finished_at), 'MM/dd HH:mm:ss') : '--'}</div>
        <div className="col-span-1">{formatDuration(item.duration_seconds)}</div>
        <div className={`col-span-1 flex items-center gap-1.5 font-medium ${statusConfig.color}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {item.result || item.status}
        </div>
        <div className="col-span-2 truncate text-red-400">{item.failure_reason || '--'}</div>
        <div className="col-span-2 font-mono text-[11px] truncate">{item.correlation_id || '--'}</div>
        <div className="col-span-1">{item.execution_no || '--'}</div>
      </div>
    </div>
  );
});

export default function JournalTable({ items, sort, setSort, onRowClick }) {
  
  const TableHeader = () => (
    <div className="flex items-center border-b border-white/10 bg-[#0F0F0F] text-[12px] font-semibold text-white/50 px-4 py-3 sticky top-0 z-10">
      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-1 uppercase tracking-wider">Attempt</div>
        <div className="col-span-2 uppercase tracking-wider">Started</div>
        <div className="col-span-2 uppercase tracking-wider">Finished</div>
        <div className="col-span-1 uppercase tracking-wider">Duration</div>
        <div className="col-span-1 uppercase tracking-wider">Result</div>
        <div className="col-span-2 uppercase tracking-wider">Failure</div>
        <div className="col-span-2 uppercase tracking-wider">Correlation ID</div>
        <div className="col-span-1 uppercase tracking-wider">Exec No</div>
      </div>
    </div>
  );

  if (items.length > 100) {
    return (
      <div className="h-full w-full flex flex-col relative">
        <TableHeader />
        <div className="flex-1">
          <List
            height={600} // This should ideally be auto-calculated but works for layout
            itemCount={items.length}
            itemSize={44}
            width="100%"
            itemData={{ items, onRowClick }}
            className="custom-scrollbar"
          >
            {RowRenderer}
          </List>
        </div>
      </div>
    );
  }

  // Normal Table for <= 100 rows
  return (
    <div className="h-full w-full overflow-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#0F0F0F] text-[12px] font-semibold text-white/50 uppercase tracking-wider sticky top-0 z-10 shadow-sm shadow-black/50">
            <th className="px-4 py-3 whitespace-nowrap">Attempt</th>
            <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-white" onClick={() => setSort(sort === 'started_at_desc' ? 'started_at_asc' : 'started_at_desc')}>Started</th>
            <th className="px-4 py-3 whitespace-nowrap">Finished</th>
            <th className="px-4 py-3 whitespace-nowrap">Duration</th>
            <th className="px-4 py-3 whitespace-nowrap">Result</th>
            <th className="px-4 py-3 whitespace-nowrap">Failure</th>
            <th className="px-4 py-3 whitespace-nowrap">Correlation ID</th>
            <th className="px-4 py-3 whitespace-nowrap">Exec No</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-black/20">
          {items.map((item, idx) => {
            const statusConfig = getStatusConfig(item.result || item.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <tr 
                key={item.id || idx} 
                onClick={() => onRowClick(item)}
                className="hover:bg-white/[0.02] cursor-pointer text-[13px] text-white/70"
              >
                <td className="px-4 py-2.5">{item.attempt || 1}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{item.started_at ? format(new Date(item.started_at), 'MM/dd HH:mm:ss') : '--'}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{item.finished_at ? format(new Date(item.finished_at), 'MM/dd HH:mm:ss') : '--'}</td>
                <td className="px-4 py-2.5">{formatDuration(item.duration_seconds)}</td>
                <td className={`px-4 py-2.5 whitespace-nowrap flex items-center gap-1.5 font-medium ${statusConfig.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {item.result || item.status}
                </td>
                <td className="px-4 py-2.5 text-red-400 max-w-[200px] truncate" title={item.failure_reason}>{item.failure_reason || '--'}</td>
                <td className="px-4 py-2.5 font-mono text-[11px]">{item.correlation_id || '--'}</td>
                <td className="px-4 py-2.5">{item.execution_no || '--'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
