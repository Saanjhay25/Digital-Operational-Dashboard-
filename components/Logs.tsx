
import React, { useState, useEffect } from 'react';

const INITIAL_LOGS = [
  { time: '2023-10-27 15:01:22', level: 'INFO', msg: 'Backup rotation completed successfully', svc: 'BACKUP-DAEMON' },
  { time: '2023-10-27 14:58:10', level: 'WARN', msg: 'Disk threshold exceeded on node-04', svc: 'MONITORING' },
  { time: '2023-10-27 14:45:00', level: 'ERROR', msg: 'Postgres connection pool exhausted', svc: 'DATABASE' },
  { time: '2023-10-27 14:30:12', level: 'INFO', msg: 'Global assets refreshed via CDN', svc: 'CDN-V2' },
];

const SERVICES = ['AUTH-GATEWAY', 'API-RUNTIME', 'STRIPE-INTEGRATION', 'CACHE-REDIS', 'LOAD-BALANCER', 'EMAIL-WORKER'];
const LEVELS = ['INFO', 'WARN', 'ERROR'] as const;
const MESSAGES = [
  'Request timeout detected on endpoint /v1/transactions',
  'Cache hit ratio dropped below 85%',
  'Successfully synchronized user session state',
  'Worker process pool scaled up (+3 nodes)',
  'Rate limit triggered for IP range 194.22.x.x',
  'Database query execution time spiked to 450ms',
  'SSL Certificate auto-renewal initiated',
  'New administrator login detected from unknown IP'
];

const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState(INITIAL_LOGS);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const newLog = {
        time: timeStr,
        level: LEVELS[Math.floor(Math.random() * LEVELS.length)],
        svc: SERVICES[Math.floor(Math.random() * SERVICES.length)],
        msg: MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      };

      // We add the new log to the top of the list for better visibility of real-time updates
      setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep only last 50 for performance
    }, 4000); // New log every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.msg.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.svc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">System Logs</h1>
          <p className="text-slate-400">Live operational event stream. <span className="text-emerald-400 text-xs font-bold animate-pulse ml-2">● LIVE</span></p>
        </div>
        <div className="w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search logs..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap group-hover:text-slate-400">{log.time}</td>
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
        <span>Auto-refreshing every 4s</span>
      </div>
    </div>
  );
};

export default Logs;
