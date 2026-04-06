import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';

interface AppLog {
  _id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  timestamp: string;
}

type LevelFilter = 'all' | 'info' | 'warning' | 'error';

const LEVEL_STYLES: Record<string, { badge: string; dot: string; row: string; label: string }> = {
  info:    { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', row: 'hover:bg-emerald-500/5', label: '🟢 INFO' },
  warning: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400',   row: 'hover:bg-amber-500/5',   label: '🟡 WARN' },
  error:   { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',           dot: 'bg-rose-500',    row: 'hover:bg-rose-500/5',    label: '🔴 ERROR' },
};

const API = 'http://localhost:5000';

const LogMonitor: React.FC = () => {
  const [logs, setLogs]             = useState<AppLog[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch]         = useState('');
  const [liveSearch, setLiveSearch] = useState('');
  const [paused, setPaused]         = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const socketRef   = useRef<Socket | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const pausedRef   = useRef(paused);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // keep pausedRef in sync without re-subscribing socket
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ── Initial fetch ──────────────────────────────────────────────────
  const fetchLogs = useCallback(async (level: LevelFilter, q: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (level !== 'all') params.set('level', level);
      if (q.trim())        params.set('search', q.trim());

      const res = await fetch(`${API}/api/logs?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data: AppLog[] = await res.json();
      setLogs(data);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(levelFilter, liveSearch); }, [levelFilter, liveSearch]);

  // ── Socket.IO ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketIO(API, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('new_log', (log: AppLog) => {
      if (pausedRef.current) return;
      setLogs(prev => {
        // Skip if active level filter doesn't match incoming log
        if (levelFilter !== 'all' && log.level !== levelFilter) return prev;
        const updated = [log, ...prev];
        return updated.slice(0, 100); // keep max 100
      });
    });

    return () => { socket.disconnect(); };
  }, [levelFilter]);

  // ── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (autoScroll && !paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, paused]);

  // ── Search debounce ────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setLiveSearch(val), 400);
  };

  // ── Export CSV ────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'Timestamp,Level,Source,Message\n';
    const rows = logs.map(l =>
      `"${new Date(l.timestamp).toISOString()}","${l.level}","${l.source}","${l.message.replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `opspulse-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Highlight helper ──────────────────────────────────────────────
  const highlight = (text: string) => {
    if (!liveSearch.trim()) return text;
    const regex = new RegExp(`(${liveSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-amber-400/30 text-amber-200 rounded px-0.5">$1</mark>');
  };

  // ── Count summary ─────────────────────────────────────────────────
  const counts = logs.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            Log Monitor
          </h1>
          <p className="text-slate-400 text-sm">Real-time application log stream with live Socket.IO updates</p>
        </div>

        {/* Count badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {(['info','warning','error'] as const).map(lvl => (
            <span key={lvl} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${LEVEL_STYLES[lvl].badge}`}>
              <span className={`w-2 h-2 rounded-full ${LEVEL_STYLES[lvl].dot}`} />
              {lvl.toUpperCase()} — {counts[lvl] || 0}
            </span>
          ))}
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-slate-700 bg-slate-800/50">
            TOTAL — {logs.length}
          </span>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search messages or sources..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>



        {/* Export CSV */}
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Live indicator */}
      {!paused && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live stream active — max 100 logs displayed
        </div>
      )}
      {paused && (
        <div className="flex items-center gap-2 text-xs text-amber-500">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Stream paused — new logs will not appear until resumed
        </div>
      )}

      {/* Log table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        {/* Table header */}
        <div className="grid grid-cols-[140px_90px_140px_1fr] gap-0 border-b border-slate-700 bg-slate-900/60">
          {['Time', 'Level', 'Source', 'Message'].map(h => (
            <div key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-500 text-sm">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-600 text-sm">
              No logs match the current filters
            </div>
          ) : (
            logs.map((log) => {
              const style = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
              return (
                <div
                  key={log._id}
                  className={`grid grid-cols-[140px_90px_140px_1fr] gap-0 transition-colors ${style.row}`}
                >
                  {/* Time */}
                  <div className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                    })}
                    <div className="text-[9px] text-slate-700">
                      {new Date(log.timestamp).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {/* Level */}
                  <div className="px-4 py-3 flex items-start pt-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {log.level}
                    </span>
                  </div>

                  {/* Source */}
                  <div className="px-4 py-3 text-xs font-mono text-indigo-400 truncate pt-3.5">
                    {log.source}
                  </div>

                  {/* Message */}
                  <div
                    className="px-4 py-3 text-xs text-slate-300 break-words font-mono leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlight(log.message) }}
                  />
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default LogMonitor;
