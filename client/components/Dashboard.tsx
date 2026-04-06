
import React from 'react';
import StatCard from './StatCard';
import { OperationLog, OperationalMetric, SystemIncident } from '../types';
import { MetricsService, MetricsData } from '../services/metricsService';
import { DashboardService } from '../services/dashboardService';
import { IncidentService } from '../services/incidentService';
import ActivityTimeline from './ActivityTimeline';
import OnCallTeam from './OnCallTeam';

interface DashboardProps {
  role?: string;
  userId?: string;
  hasActiveAlert?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ role = 'operator', userId = '', hasActiveAlert = false }) => {
  const [metrics, setMetrics] = React.useState<OperationalMetric[]>([]);
  const [systemHealth, setSystemHealth] = React.useState({ cpu: 0, ram: 0, disk: 0 });
  const [logs, setLogs] = React.useState<OperationLog[]>([]);
  const [incidents, setIncidents] = React.useState<SystemIncident[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [metricsResult, errorRateResult, logsResult, incidentsResult] = await Promise.all([
        MetricsService.getMetrics(),
        MetricsService.getErrorRate(),
        DashboardService.getLogs(),
        IncidentService.getIncidents()
      ]);

      if (metricsResult.success && metricsResult.data) {
        const data = metricsResult.data;
        const liveErrorRate = errorRateResult.success ? errorRateResult.data?.errorRate || 0 : data.errorRate;

        const formattedMetrics: OperationalMetric[] = [
          { name: 'System Uptime', value: data.systemDowntime > 0 ? 100 - data.systemDowntime : 100, unit: '%', trend: 'up', change: 'Live' },
          { name: 'Active Sessions', value: data.requests, unit: 'sessions', trend: 'up', change: 'Live' },
          { name: 'CPU Usage', value: data.cpuUsage, unit: '%', trend: 'up', change: 'Live' },
          { name: 'Error Rate', value: liveErrorRate, unit: '%', trend: liveErrorRate > 5 ? 'up' : 'down', change: 'Live' },
        ];
        setMetrics(formattedMetrics);

        const currentCpu = data.cpuUsage;
        setSystemHealth({
          cpu: currentCpu,
          ram: Math.min(100, Math.max(20, currentCpu * 0.8 + Math.random() * 20)),
          disk: Math.min(100, Math.max(10, currentCpu * 0.5 + 40 + Math.random() * 10))
        });
      }

      if (logsResult.success && Array.isArray(logsResult.data)) {
        const formattedLogs: OperationLog[] = logsResult.data.slice(0, 3).map((l: any) => ({
          timestamp: l.time,
          service: l.svc || 'SYSTEM',
          event: l.level,
          details: l.msg
        }));
        setLogs(formattedLogs);
      }

      // Incidents sorting by timestamp (latest first)
      if (Array.isArray(incidentsResult)) {
        const sortedIncidents = [...incidentsResult].sort((a, b) => 
          new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime()
        );
        setIncidents(sortedIncidents);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRelativeTime = (dateInput: string | Date | undefined) => {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'monitoring': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'closed': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-700';
    }
  };

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
              statusColor={
                metric.name === 'Error Rate' 
                  ? (metric.value > 5 ? 'rose' : metric.value > 2 ? 'amber' : 'emerald')
                  : (metric.name === 'System Uptime' ? 'emerald' : undefined)
              }
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
        {/* Activity Timeline Section */}
        <div className="lg:col-span-2 space-y-8">
          <ActivityTimeline />
          {/* Live Incident Feed Section (Now combined or separate) */}
          {/* ... existing incident feed could go below if needed, but Activity Log is the priority ... */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <OnCallTeam role={role} />

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
