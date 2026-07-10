import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function JournalPagination({ page, pageSize, total, setPage, setPageSize, disabled }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  const handlePrev = () => { if (page > 1) setPage(page - 1); };
  const handleNext = () => { if (page < totalPages) setPage(page + 1); };

  return (
    <div className="flex items-center justify-between border-t border-white/5 bg-[#0A0A0A] px-4 py-3">
      <div className="text-[13px] text-white/50">
        Showing <span className="font-medium text-white">{total > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="font-medium text-white">{Math.min(page * pageSize, total)}</span> of <span className="font-medium text-white">{total}</span> entries
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-white/50">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            disabled={disabled}
            className="h-[30px] rounded-lg border border-white/10 bg-black/40 px-2 text-[13px] text-white focus:border-white/20 focus:outline-none disabled:opacity-50"
          >
            {[25, 50, 100, 250, 500].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={page <= 1 || disabled}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          
          <div className="flex h-[30px] items-center px-2 text-[13px] font-medium text-white">
            Page {page} of {totalPages}
          </div>

          <button
            onClick={handleNext}
            disabled={page >= totalPages || disabled}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
