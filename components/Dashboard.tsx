
import React from 'react';
import StatCard from './StatCard';
import HealthChart from './HealthChart';
import { OperationLog, OperationalMetric } from '../types';

const MOCK_METRICS: OperationalMetric[] = [
  { name: 'System Uptime', value: 99.98, unit: '%', trend: 'up', change: '+0.02%' },
  { name: 'Active Sessions', value: 1240, unit: 'users', trend: 'up', change: '+12%' },
  { name: 'Server Response', value: 42, unit: 'ms', trend: 'down', change: '-4ms' },
  { name: 'Error Rate', value: 0.04, unit: '%', trend: 'down', change: '-0.01%' },
];

const MOCK_LOGS: OperationLog[] = [
  { timestamp: '2023-10-27 14:22:01', service: 'AUTH-SERVER', event: 'HIGH_LATENCY', details: 'Authentication requests peaking at 120ms' },
  { timestamp: '2023-10-27 14:25:30', service: 'DATABASE', event: 'POOL_EXPANSION', details: 'Auto-scaled connection pool to 50 nodes' },
  { timestamp: '2023-10-27 14:30:12', service: 'CDN', event: 'CACHE_PURGE', details: 'Global assets refreshed successfully' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Operational Overview</h1>
          <p className="text-slate-400">Real-time system performance and status tracking.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_METRICS.map((metric, idx) => (
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
        ))}
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
                  {MOCK_LOGS.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-indigo-300">{log.service}</span>
                      </td>
                      <td className="px-6 py-4">{log.event}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Logged
                        </span>
                      </td>
                    </tr>
                  ))}
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
            <button className="w-full mt-6 py-2 text-sm text-slate-400 hover:text-white transition-colors border-t border-slate-700 pt-4">
              View Full Team Directory
            </button>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">System Status</h3>
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
