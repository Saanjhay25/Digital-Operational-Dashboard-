
import React from 'react';
import StatCard from './StatCard';
import HealthChart from './HealthChart';
import { OperationLog, OperationalMetric } from '../types';
import { MetricsService, MetricsData } from '../services/metricsService';
import { DashboardService } from '../services/dashboardService';

interface DashboardProps {
  role?: string;
  hasActiveAlert?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ role = 'operator', hasActiveAlert = false }) => {
  const [metrics, setMetrics] = React.useState<OperationalMetric[]>([]);
  const [systemHealth, setSystemHealth] = React.useState({ cpu: 0, ram: 0, disk: 0 });
  const [logs, setLogs] = React.useState<OperationLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
    const [metricsResult, logsResult] = await Promise.all([
      MetricsService.getMetrics(),
      DashboardService.getLogs('system')
    ]);

    if (metricsResult.success && metricsResult.data) {
      const data = metricsResult.data;
      const formattedMetrics: OperationalMetric[] = [
        { name: 'System Uptime', value: data.systemDowntime > 0 ? 100 - data.systemDowntime : 99.99, unit: '%', trend: 'up', change: 'Live' },
        { name: 'Active Sessions', value: data.requests, unit: 'users', trend: 'up', change: 'Live' },
        { name: 'CPU Usage', value: data.cpuUsage, unit: '%', trend: 'up', change: 'Live' },
        { name: 'Error Rate', value: data.errorRate, unit: '%', trend: 'down', change: 'Live' },
      ];
      setMetrics(formattedMetrics);

      // Simulate RAM and Disk based on CPU to have somewhat correlated but slightly jittered metrics
      const currentCpu = data.cpuUsage;
      setSystemHealth({
        cpu: currentCpu,
        ram: Math.min(100, Math.max(20, currentCpu * 0.8 + Math.random() * 20)),
        disk: Math.min(100, Math.max(10, currentCpu * 0.5 + 40 + Math.random() * 10))
      });
    }

    if (logsResult.success && logsResult.data) {
      const formattedLogs: OperationLog[] = logsResult.data.slice(0, 3).map((l: any) => ({
        timestamp: l.time,
        service: l.svc || 'SYSTEM',
        event: l.level,
        details: l.msg
      }));
      setLogs(formattedLogs);
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {role === 'admin' ? 'Operational Command Center' : 'Operator Overview'}
          </h1>
          <p className="text-slate-400">
            {role === 'admin' 
              ? 'Complete system surveillance and administrative control.' 
              : 'Real-time performance metrics and active alerts.'}
          </p>
        </div>
        {hasActiveAlert && (
          <div className="flex bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.1)] animate-in slide-in-from-right-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-sm font-bold tracking-widest uppercase">Critical Errors Detected</span>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-4 text-center text-slate-400 py-10">Loading metrics...</div>
        ) : (
          metrics.map((metric, idx) => (
            <StatCard 
              key={metric.name} 
              metric={metric} 
              icon={
                idx === 0 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ) : idx === 1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : idx === 2 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                )
              }
            />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">System Health & Load</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                  <span className="text-xs text-slate-400">Health Index</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-xs text-slate-400">Cluster Load</span>
                </div>
              </div>
            </div>
            <HealthChart />
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Incident Timeline</h2>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Last 24 Hours</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-slate-300 text-sm">
                  {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-indigo-300">{log.service}</span>
                      </td>
                      <td className="px-6 py-4">{log.event}</td>
                      <td className="px-6 py-4 text-xs">{log.details}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                     <tr><td colSpan={4} className="text-center py-4 text-slate-500">No recent logs</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              On-Call Team
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Sarah Chen', role: 'DevOps Lead', status: 'online' },
                { name: 'Marcus Miller', role: 'Security Analyst', status: 'online' },
                { name: 'Elena Rodriguez', role: 'DBA', status: 'away' },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img src={`https://picsum.photos/seed/${member.name}/32/32`} className="w-8 h-8 rounded-full border border-slate-700" alt="" />
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">{member.name}</div>
                      <div className="text-xs text-slate-500">{member.role}</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                </div>
              ))}
            </div>
            {role === 'admin' && (
              <button className="w-full mt-6 py-2 text-sm text-slate-400 hover:text-white transition-colors border-t border-slate-700 pt-4">
                View Full Team Directory
              </button>
            )}
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              System Health
            </h3>
            <div className="space-y-4">
              {[
                { label: 'CPU Allocation', value: systemHealth.cpu, color: 'indigo' },
                { label: 'RAM Utilization', value: systemHealth.ram, color: 'emerald' },
                { label: 'Disk Storage', value: systemHealth.disk, color: 'amber' }
              ].map((res, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span className="uppercase tracking-wider">{res.label}</span>
                    <span className="text-white font-mono shrink-0 w-10 text-right">{res.value.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        res.value > 85 ? 'bg-rose-500' :
                        res.color === 'indigo' ? 'bg-indigo-500' : 
                        res.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} 
                      style={{ width: `${res.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`border rounded-2xl p-6 transition-colors ${
            hasActiveAlert ? 'bg-rose-500/10 border-rose-500/30' : 'bg-indigo-600/10 border-indigo-500/20'
          }`}>
            <h3 className={`font-bold text-xs uppercase tracking-widest mb-2 ${
              hasActiveAlert ? 'text-rose-400' : 'text-indigo-400'
            }`}>System Status</h3>
            <div className="flex items-center gap-2 text-white font-medium">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                hasActiveAlert ? 'bg-rose-500 tracking-wide' : 'bg-emerald-500'
              }`}></span>
              {hasActiveAlert ? 'ATTENTION REQUIRED' : 'All Systems Operational'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
