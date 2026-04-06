import React, { useState, useEffect } from 'react';
import { IncidentService } from '../services/incidentService';
import { SystemIncident } from '../types';
import RCAModal from './RCAModal';
import { ReportService } from '../services/reportService';

interface IncidentsProps {
  role: string;
  userId: string;
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

const Incidents: React.FC<IncidentsProps> = ({ role, userId }) => {
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'monitoring'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Fetching State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reporting Modal State
  const [isReporting, setIsReporting] = useState(false);
  const [newIncident, setNewIncident] = useState<Partial<SystemIncident>>({
    title: '',
    severity: 'medium',
    status: 'active',
    affectedServices: [],
    rootCause: ''
  });

  // Editing Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Partial<SystemIncident> | null>(null);

  // RCA Modal State
  const [selectedRcaIncident, setSelectedRcaIncident] = useState<SystemIncident | null>(null);

  // Report State
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Operators for assignment
  const [operators, setOperators] = useState<any[]>([]);

  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchIncidents();
    if (isAdmin) {
      fetchOperators();
    }
  }, []);

  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await IncidentService.getIncidents();
      setIncidents(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to database');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const data = await IncidentService.getOperators();
      setOperators(data);
    } catch (err: any) {
      console.error('Error fetching operators:', err);
    }
  };

  const handleAssign = async (incidentId: string, operatorId: string) => {
    if (!operatorId) return;
    
    // Find incident to check if it's already assigned
    const incident = incidents.find(inc => (inc.id || inc._id) === incidentId);
    const action = incident?.assignedTo ? 'reassign' : 'assign';
    
    const confirmAction = window.confirm(`Are you sure you want to ${action} this incident?`);
    if (!confirmAction) return;

    try {
      await IncidentService.assignIncident(incidentId, operatorId);
      // Refresh incidents to show update
      fetchIncidents();
    } catch (err: any) {
      alert(`Error assigning incident: ${err.message}`);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEditClick = (incident: SystemIncident) => {
    setEditingIncident(incident);
    setIsEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident?.title) return;

    try {
      const idToUpdate = editingIncident.id || editingIncident._id;
      if (!idToUpdate) return;
      
      const updatedIncident = await IncidentService.updateIncident(idToUpdate, {
        title: editingIncident.title,
        severity: editingIncident.severity,
        status: editingIncident.status,
        affectedServices: editingIncident.affectedServices,
        rootCause: editingIncident.rootCause,
        resolutionSteps: editingIncident.resolutionSteps
      });

      setIncidents(incidents.map(inc => (inc.id || inc._id) === (updatedIncident.id || updatedIncident._id) ? updatedIncident : inc));
      setIsEditing(false);
      setEditingIncident(null);
    } catch (err: any) {
      alert(`Error updating incident: ${err.message}`);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const updatedIncident = await IncidentService.updateIncident(id, { status: 'monitoring' });
      setIncidents(incidents.map(inc => (inc.id || inc._id) === (updatedIncident.id || updatedIncident._id) ? updatedIncident : inc));
    } catch (err: any) {
      alert(`Error acknowledging incident: ${err.message}`);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const updatedIncident = await IncidentService.updateIncident(id, { status: 'resolved' });
      setIncidents(incidents.map(inc => (inc.id || inc._id) === (updatedIncident.id || updatedIncident._id) ? updatedIncident : inc));
    } catch (err: any) {
      alert(`Error resolving incident: ${err.message}`);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.title) return;

    try {
      const createdIncident = await IncidentService.createIncident({
        title: newIncident.title || 'Untitled Incident',
        severity: newIncident.severity,
        status: 'active',
        affectedServices: newIncident.affectedServices || [],
        rootCause: newIncident.rootCause || 'Under investigation.'
      });

      setIncidents([createdIncident, ...incidents]);
      setIsReporting(false);
      setNewIncident({ title: '', severity: 'medium', status: 'active', affectedServices: [], rootCause: '' });
    } catch (err: any) {
      alert(`Error submitting incident: ${err.message}`);
    }
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
    const incIdString = inc.id || inc._id || '';
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         incIdString.toLowerCase().includes(searchTerm.toLowerCase());
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

      {/* Edit Incident Modal */}
      {isEditing && editingIncident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsEditing(false)}></div>
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/50 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 right-0 p-6">
               <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-10 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">Edit Incident Report</h2>
                <p className="text-slate-400 text-sm">Update telemetry for this incident.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Incident Title</label>
                  <input 
                    required
                    type="text" 
                    value={editingIncident.title || ''}
                    onChange={(e) => setEditingIncident({...editingIncident, title: e.target.value})}
                    placeholder="Brief description of the disruption..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Severity Tier</label>
                    <select 
                      value={editingIncident.severity || 'medium'}
                      onChange={(e) => setEditingIncident({...editingIncident, severity: e.target.value as any})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value={editingIncident.status || 'active'}
                      onChange={(e) => setEditingIncident({...editingIncident, status: e.target.value as any})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="monitoring">Monitoring/Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Affected Services (comma separated)</label>
                  <input 
                    type="text" 
                    value={(editingIncident.affectedServices || []).join(', ')}
                    onChange={(e) => setEditingIncident({...editingIncident, affectedServices: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    placeholder="e.g. Auth Service, API Gateway"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Core Investigation Notes</label>
                  <textarea 
                    rows={3}
                    value={editingIncident.rootCause || ''}
                    onChange={(e) => setEditingIncident({...editingIncident, rootCause: e.target.value})}
                    placeholder="Investigation notes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  ></textarea>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Resolution Steps (one per line)</label>
                  <textarea 
                    rows={3}
                    value={(editingIncident.resolutionSteps || []).join('\n')}
                    onChange={(e) => setEditingIncident({...editingIncident, resolutionSteps: e.target.value.split('\n').filter(Boolean)})}
                    placeholder="Steps taken to resolve..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Update Incident
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-1000">
           <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
           <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Live Telemetry...</h3>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl flex flex-col items-center text-center">
           <svg className="h-10 w-10 text-rose-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           <h3 className="text-rose-400 font-black text-lg mb-1 tracking-tight">System Fetch Error</h3>
           <p className="text-rose-400/80 text-sm font-medium">{error}</p>
        </div>
      ) : (

      <div className="bg-slate-800/40 border border-slate-700 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/80 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">
              <tr>
                <th className="px-8 py-5">ID</th>
                <th className="px-8 py-5">Incident Description</th>
                <th className="px-8 py-5">Severity</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Assigned To</th>
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
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${inc.assignedTo ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                          {inc.assignedTo ? (typeof inc.assignedTo === 'object' ? (inc.assignedTo as any).name?.charAt(0) : '?') : '-'}
                        </div>
                        <div className="flex flex-col grow min-w-[120px]">
                          {isAdmin && inc.status !== 'resolved' ? (
                            <select 
                              className="bg-transparent border-none text-xs font-medium text-slate-200 focus:ring-0 cursor-pointer outline-none hover:text-indigo-400 transition-colors p-0 m-0 w-full"
                              value={typeof inc.assignedTo === 'string' ? inc.assignedTo : (inc.assignedTo as any)?._id || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                handleAssign(String(inc.id || inc._id), e.target.value);
                              }}
                            >
                              <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
                              {operators.map(op => (
                                <option key={op._id} value={op._id} className="bg-slate-900 text-slate-200">
                                  {op.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs font-medium ${inc.assignedTo ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                              {inc.assignedTo ? (typeof inc.assignedTo === 'object' ? (inc.assignedTo as any).name : 'Assigned') : 'Unassigned'}
                            </span>
                          )}
                          {inc.assignedAt && (
                            <span className="text-[9px] text-slate-500">
                              {new Date(inc.assignedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
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
                      <td colSpan={7} className="px-8 py-8 border-b border-slate-700/80">
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
                                {inc.assignedTo && (
                                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30 space-y-2">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assignment Metadata</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-[8px] text-slate-500 uppercase font-bold">Assigned By</p>
                                        <p className="text-xs text-slate-300 font-medium">
                                          {typeof inc.assignedBy === 'object' ? (inc.assignedBy as any).name : 'System'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[8px] text-slate-500 uppercase font-bold">Assigned At</p>
                                        <p className="text-xs text-slate-300 font-medium">
                                          {inc.assignedAt ? new Date(inc.assignedAt).toLocaleString() : '-'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {isAdmin && inc.status !== 'resolved' && (
                                  <div>
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                      {inc.assignedTo ? 'Reassign Operator' : 'Assign Operator'}
                                    </h4>
                                  <div className="flex gap-2">
                                    <select 
                                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer grow"
                                      value={typeof inc.assignedTo === 'string' ? inc.assignedTo : (inc.assignedTo as any)?._id || ''}
                                      onChange={(e) => handleAssign(String(inc.id || inc._id), e.target.value)}
                                    >
                                      <option value="">Select Operator...</option>
                                      {operators.map(op => (
                                        <option key={op._id} value={op._id}>{op.name} ({op.email})</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
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

                          <div className="pt-4 flex gap-3 justify-end items-center">
                            {isAdmin && (
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    setGeneratingReportId(String(inc.id || inc._id));
                                    await ReportService.generateReport('incident', String(inc.id || inc._id));
                                  } catch (err: any) {
                                    alert(err.message || 'Failed to generate report');
                                  } finally {
                                    setGeneratingReportId(null);
                                  }
                                }}
                                disabled={generatingReportId === String(inc.id || inc._id)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                {generatingReportId === String(inc.id || inc._id) ? 'Generating...' : 'PDF Report'}
                              </button>
                            )}

                            {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(inc);
                                }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95"
                              >
                                Edit Report
                              </button>
                            )}

                            {/* Resolve Button - Visible only to Assigned Operators */}
                            {!isAdmin && role === 'operator' && inc.assignedTo && 
                             (String((inc.assignedTo as any)._id || inc.assignedTo) === userId) && 
                             (inc.status === 'active' || inc.status === 'monitoring') && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolve(String(inc.id || inc._id));
                                }}
                                className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                              >
                                Resolve
                              </button>
                            )}

                            {isAdmin && inc.status === 'active' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledge(String(inc.id || inc._id));
                                }}
                                className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                              >
                                Acknowledge
                              </button>
                            )}
                            {/* RCA Button */}
                            {inc.status === 'resolved' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRcaIncident(inc);
                                }}
                                className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Root Cause Analysis
                              </button>
                            )}

                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
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
      )}
      
      <div className="flex justify-between items-center text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-slate-700"></span>
          Showing {filteredIncidents.length} system incidents
        </div>
        <div>
          Current View Scope: {statusFilter}
        </div>
      </div>

      {selectedRcaIncident && (
        <RCAModal 
          incident={selectedRcaIncident}
          onClose={() => setSelectedRcaIncident(null)}
          onSave={() => {
            setSelectedRcaIncident(null);
          }}
          currentUserRole={role}
        />
      )}
    </div>
  );
};

export default Incidents;
