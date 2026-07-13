import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, RefreshCw, Copy, Download, Trash2, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

export default function DeveloperLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState("Initializing Developer Logs...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef(null);
  const containerRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get('/api/v1/system/app-logs?lines=500');
      if (res && res.success) {
        setLogs(res.logs || "No logs available.");
      } else {
        setLogs("Error fetching logs: " + (res?.error || "Unknown error"));
      }
    } catch (e) {
      setLogs("Failed to connect to backend log server.\n" + String(e));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    } else {
      setAutoRefresh(true);
      setUserScrolledUp(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  useEffect(() => {
    // Only auto-scroll if the user hasn't manually scrolled up
    if (!userScrolledUp && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, userScrolledUp]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // If user is within 50px of the bottom, consider them at the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setUserScrolledUp(!isAtBottom);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Logs copied to clipboard!", {
        style: { background: '#0a0f18', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.2)' }
      });
    }).catch(err => {
      toast.error("Failed to copy logs");
    });
  };

  const clearLogs = () => {
    setLogs("Logs cleared from view. Real file is not affected.\nWaiting for new logs...");
    setUserScrolledUp(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#05080e]/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-[1000px] h-[80vh] flex flex-col bg-[#0b121e] border border-white/[0.1] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 px-4 border-b border-white/[0.1] bg-[#05080e]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--accent-500)]/10 text-[var(--accent-400)]">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white tracking-wide">Developer Logs</h2>
              <p className="text-[11px] text-white/50 tracking-wider font-mono mt-0.5">autouploader.log • tail -n 500</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 mr-3 cursor-pointer group">
              <div className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? 'bg-[var(--accent-500)]' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className={`text-[12px] font-bold ${autoRefresh ? 'text-[var(--accent-400)]' : 'text-white/40 group-hover:text-white/70'}`}>Auto-tail</span>
            </label>

            <button 
              onClick={clearLogs}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              title="Clear View"
            >
              <Trash2 size={16} />
            </button>

            <button 
              onClick={copyToClipboard}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40 hover:text-[var(--accent-400)] transition-colors"
              title="Copy to Clipboard"
            >
              {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>

            <button 
              onClick={fetchLogs}
              disabled={isRefreshing}
              className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors ${isRefreshing ? 'text-[var(--accent-400)]' : 'text-white/40 hover:text-white'}`}
              title="Refresh Now"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-[#05080e] p-4 custom-scrollbar font-mono text-[12px] leading-relaxed relative"
        >
          {/* Subtle background grid */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMEwxIDIwTTAgMUwyMCAxIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+')]"></div>
          
          <pre className="relative z-10 text-white/80 whitespace-pre-wrap break-all" style={{ tabSize: 2 }}>
            {logs.split('\n').map((line, i) => {
              // Basic syntax highlighting for log levels
              let colorClass = "text-white/80";
              if (line.includes("[ERROR]") || line.includes("Exception") || line.includes("Traceback")) {
                colorClass = "text-red-400 font-bold";
              } else if (line.includes("[WARNING]")) {
                colorClass = "text-yellow-400";
              } else if (line.includes("[INFO]")) {
                colorClass = "text-cyan-300";
              } else if (line.includes("[DEBUG]")) {
                colorClass = "text-white/40";
              }

              // Highlight engine logs specifically
              if (line.includes("[ENGINE]")) {
                colorClass = "text-purple-300";
              }

              return (
                <div key={i} className={`hover:bg-white/[0.02] px-1 rounded ${colorClass}`}>
                  {line}
                </div>
              );
            })}
            <div ref={logsEndRef} className="h-4" />
          </pre>
          
          {userScrolledUp && (
            <button 
              onClick={() => {
                setUserScrolledUp(false);
                logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--accent-500)] text-[#05080e] font-bold text-[12px] rounded-full shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform animate-bounce z-50 flex items-center gap-2"
            >
              Resume Auto-Scroll
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
