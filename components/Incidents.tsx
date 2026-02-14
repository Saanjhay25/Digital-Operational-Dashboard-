
import React, { useState } from 'react';
import { SystemIncident } from '../types';

interface IncidentsProps {
  role?: string;
}

const INITIAL_INCIDENTS: SystemIncident[] = [
  { 
    id: 'INC-402', 
    title: 'Postgres Connection Pool Exhausted', 
    severity: 'critical', 
    status: 'resolved', 
    timestamp: '2023-10-27 14:45:00',
    affectedServices: ['Auth Service', 'Transaction Engine', 'Reporting Tool'],
    rootCause: 'Unexpected spike in concurrent analytics queries triggered a pool leak in the secondary cluster.',
    resolutionSteps: [
      'Identified leaking connection handle in the analytics middleware.',
      'Forcefully recycled the RDS proxy sessions.',
      'Deployed hotfix v2.4.1 to ensure connection closure on query timeout.'
    ]
  },
  { 
    id: 'INC-403', 
    title: 'API Gateway High Latency (US-EAST-1)', 
    severity: 'high', 
    status: 'active', 
    timestamp: '2023-10-27 15:12:30',
    affectedServices: ['Public API Gateway', 'Mobile Application Backend'],
    rootCause: 'Degradation in underlying AWS Lambda cold start times following a runtime environment update.',
    resolutionSteps: [
      'Increase provisioned concurrency for critical path functions.',
      'Monitoring regional health via CloudWatch.',
      'Engaged AWS Enterprise Support for root-level analysis.'
    ]
  },
  { 
    id: 'INC-404', 
    title: 'Redis Cache Memory Pressure', 
    severity: 'medium', 
    status: 'monitoring', 
    timestamp: '2023-10-27 15:34:12',
    affectedServices: ['Session Management', 'Rate Limiter'],
    rootCause: 'Oversized session tokens being persisted due to a new marketing tracking integration.',
    resolutionSteps: [
      'Adjusted Redis eviction policy to volatile-lru.',
      'Optimization of session payload size in the middleware.',
      'Initiated cluster vertical scaling (t3.medium to t3.large).'
    ]
  },
  { 
    id: 'INC-405', 
    title: 'Intermittent Auth Failures', 
    severity: 'high', 
    status: 'active', 
    timestamp: '2023-10-27 15:45:00',
    affectedServices: ['Single Sign-On (SSO)', 'OAuth Provider'],
    rootCause: 'Upstream identity provider (IdP) experiencing intermittent 503 errors during JWKS rotation.',
    resolutionSteps: [
      'Implemented aggressive local caching for public keys.',
      'Diverted 20% of traffic to backup IdP.',
      'Investigating retry logic exponential backoff.'
    ]
  },
  { 
    id: 'INC-406', 
    title: 'Storage Quota Alert (Node-02)', 
    severity: 'low', 
    status: 'resolved', 
    timestamp: '2023-10-27 15:58:20',
    affectedServices: ['Log Aggregator', 'Backup Service'],
    rootCause: 'Rotation script failure caused temporary log accumulation beyond the 500GB partition limit.',
    resolutionSteps: [
      'Manual cleanup of legacy /tmp archives.',
      'Restarted the systemd timer for the rotation service.',
      'Adjusted monitoring threshold to 80% instead of 90%.'
    ]
  },
];

const Incidents: React.FC<IncidentsProps> = ({ role }) => {
  const [incidents, setIncidents] = useState<SystemIncident[]>(INITIAL_INCIDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'monitoring'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Reporting Modal State
  const [isReporting, setIsReporting] = useState(false);
  const [newIncident, setNewIncident] = useState<Partial<SystemIncident>>({
    title: '',
    severity: 'medium',
    status: 'active',
    affectedServices: [],
    rootCause: ''
  });

  const isAdmin = role === 'admin';

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.title) return;

    const nextIdNumber = Math.max(...incidents.map(i => parseInt(i.id.split('-')[1]))) + 1;
    const report: SystemIncident = {
      id: `INC-${nextIdNumber}`,
      title: newIncident.title || 'Untitled Incident',
      severity: newIncident.severity as any,
      status: 'active',
      timestamp: new Date().toLocaleString(),
      affectedServices: newIncident.affectedServices || [],
      rootCause: newIncident.rootCause || 'Under investigation.',
      resolutionSteps: []
    };

    setIncidents([report, ...incidents]);
    setIsReporting(false);
    setNewIncident({ title: '', severity: 'medium', status: 'active', affectedServices: [], rootCause: '' });
  };

  const getSeverityStyles = (severity: SystemIncident['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: SystemIncident['status']) => {
    switch (status) {
      case 'active': return (
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      );
      case 'monitoring': return <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>;
      case 'resolved': return (
        <svg className="w-4 h-4 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      );
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || inc.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Report Incident Modal */}
      {isReporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsReporting(false)}></div>
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/50 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 p-6">
               <button onClick={() => setIsReporting(false)} className="text-slate-500 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-10 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">Initialize Incident Report</h2>
                <p className="text-slate-400 text-sm">Deploying a new incident record to global telemetry.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Incident Title</label>
                  <input 
                    required
                    type="text" 
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                    placeholder="Brief description of the disruption..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Severity Tier</label>
                    <select 
                      value={newIncident.severity}
                      onChange={(e) => setNewIncident({...newIncident, severity: e.target.value as any})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Initial Status</label>
                    <div className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-rose-400 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      ACTIVE
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Core Investigation Notes</label>
                  <textarea 
                    rows={3}
                    value={newIncident.rootCause}
                    onChange={(e) => setNewIncident({...newIncident, rootCause: e.target.value})}
                    placeholder="Initial observations and indicators..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsReporting(false)}
                  className="flex-1 px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Broadcast Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">System Incidents</h1>
          <p className="text-slate-400 text-sm">Management and tracking of active operational disruptions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            {['all', 'active', 'monitoring', 'resolved'].map((f) => (
              <button 
                key={f}
                onClick={() => setStatusFilter(f as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === f 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="w-full sm:w-64">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Query incidents..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isAdmin && (
            <button 
              onClick={() => setIsReporting(true)}
              className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Report Incident
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/80 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">
              <tr>
                <th className="px-8 py-5">ID</th>
                <th className="px-8 py-5">Incident Description</th>
                <th className="px-8 py-5">Severity</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredIncidents.map((inc) => (
                <React.Fragment key={inc.id}>
                  <tr 
                    onClick={() => toggleExpand(inc.id)}
                    className={`transition-all cursor-pointer group ${expandedId === inc.id ? 'bg-indigo-600/5' : 'hover:bg-slate-700/20'}`}
                  >
                    <td className="px-8 py-6 font-mono text-[10px] text-indigo-400 font-bold">{inc.id}</td>
                    <td className="px-8 py-6 text-slate-200 font-bold text-sm group-hover:text-indigo-300 transition-colors">{inc.title}</td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getSeverityStyles(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                        {getStatusIcon(inc.status)}
                        <span className={`${
                          inc.status === 'active' ? 'text-rose-400' : 
                          inc.status === 'monitoring' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 text-xs font-medium">{inc.timestamp}</td>
                    <td className="px-8 py-6 text-right">
                      <div className={`transition-transform duration-300 ${expandedId === inc.id ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </td>
                  </tr>
                  {expandedId === inc.id && (
                    <tr className="bg-slate-900/40 border-l-4 border-indigo-500 animate-in slide-in-from-left-2 duration-300">
                      <td colSpan={6} className="px-8 py-8 border-b border-slate-700/80">
                        <div className="flex flex-col space-y-8">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Affected Services</h4>
                                <div className="flex flex-wrap gap-2">
                                  {(inc.affectedServices && inc.affectedServices.length > 0) ? inc.affectedServices.map(svc => (
                                    <span key={svc} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-indigo-300 font-bold">
                                      {svc}
                                    </span>
                                  )) : (
                                    <span className="text-xs text-slate-500 italic">No services currently flagged.</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-rose-500/80 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                  Root Cause Analysis
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                                  {inc.rootCause}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  Resolution Protocol
                                </h4>
                                <div className="space-y-3">
                                  {(inc.resolutionSteps && inc.resolutionSteps.length > 0) ? inc.resolutionSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-4 items-start group">
                                      <div className="shrink-0 w-6 h-6 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                                        {idx + 1}
                                      </div>
                                      <p className="text-xs text-slate-400 leading-relaxed pt-0.5 group-hover:text-slate-200 transition-colors">{step}</p>
                                    </div>
                                  )) : (
                                    <p className="text-xs text-slate-500 italic">Awaiting technical resolution steps...</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 flex gap-3 justify-end">
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95">
                              Edit Report
                            </button>
                            <button className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                              Acknowledge
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="text-slate-700 mb-4 flex justify-center">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching telemetry found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-slate-700"></span>
          Showing {filteredIncidents.length} system incidents
        </div>
        <div>
          Current View Scope: {statusFilter}
        </div>
      </div>
    </div>
  );
};

export default Incidents;
