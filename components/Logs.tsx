import React, { useState, useEffect } from 'react';
import { DashboardService } from '../services/dashboardService';

const LEVELS = ['INFO', 'WARN', 'ERROR'] as const;

const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    const result = await DashboardService.getLogs('system');
    if (result.success && result.data) {
      setLogs(result.data);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); 
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
      if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
      if (serviceFilter && !log.svc.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
      if (dateStart || dateEnd) {
          const logTime = new Date(log.time).getTime();
          if (dateStart && logTime < new Date(dateStart).getTime()) return false;
          if (dateEnd && logTime > new Date(dateEnd).getTime()) return false;
      }
      if (searchTerm && !log.msg.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
  });

  const handleExport = (format: 'csv' | 'json') => {
      if (format === 'csv') {
          const headers = ['Timestamp,Level,Service,Message'];
          const rows = filteredLogs.map(l => `"${new Date(l.time).toISOString()}","${l.level}","${l.svc}","${l.msg.replace(/"/g, '""')}"`);
          const csv = headers.concat(rows).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `logs_export_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
      } else {
          const json = JSON.stringify(filteredLogs, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `logs_export_${new Date().toISOString().split('T')[0]}.json`;
          link.click();
      }
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">System Logs</h1>
          <p className="text-slate-400">Live operational event stream. <span className="text-emerald-400 text-xs font-bold animate-pulse ml-2">● LIVE</span></p>
        </div>
      </div>
      <div className="flex flex-col gap-4 mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Search Message</label>
            <input 
              type="text" 
              placeholder="Search log contents..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Level</label>
            <select 
              value={levelFilter} 
              onChange={e => setLevelFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Service</label>
            <input 
              type="text"
              placeholder="e.g. SYSTEM"
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end justify-between border-t border-slate-700/50 pt-4">
          <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">From</label>
                <input 
                  type="datetime-local" 
                  value={dateStart}
                  onChange={e => setDateStart(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">To</label>
                <input 
                  type="datetime-local" 
                  value={dateEnd}
                  onChange={e => setDateEnd(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                />
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-slate-700 shadow-sm">Export CSV</button>
              <button onClick={() => handleExport('json')} className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-slate-700 shadow-sm">Export JSON</button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm font-mono">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => (
                  <tr key={`${log.time}-${i}`} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap group-hover:text-slate-400">{new Date(log.time).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${
                        log.level === 'INFO' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        log.level === 'WARN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 group-hover:text-white transition-colors">{log.svc}</td>
                    <td className="px-6 py-4 text-slate-400 group-hover:text-slate-200">{log.msg}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">
                    No logs found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-widest px-2">
        <span>Showing {filteredLogs.length} entries</span>
        <span>Auto-refreshing every 5s</span>
      </div>
    </div>
  );
};

export default Logs;
