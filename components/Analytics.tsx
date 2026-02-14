
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, Brush 
} from 'recharts';

// Expanded mock data to support 30-day filtering for time-series
const RAW_PERFORMANCE_DATA = Array.from({ length: 30 }, (_, i) => {
  const day = 29 - i;
  const date = new Date();
  date.setDate(date.getDate() - day);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  return {
    day: dateStr,
    uptime: 99.9 + Math.random() * 0.1,
    latency: 35 + Math.random() * 25,
    errors: Math.floor(Math.random() * 15),
    timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  };
});

// Mock regional data indexed by timeframe
const REGIONAL_DATA_MODELS: Record<string, any[]> = {
  '7d': [
    { name: 'US-East-1', used: 82, wasted: 18 },
    { name: 'US-East-2', used: 75, wasted: 25 },
    { name: 'EU-West-1', used: 65, wasted: 35 },
    { name: 'EU-Central-1', used: 88, wasted: 12 },
    { name: 'APAC-Tokyo', used: 91, wasted: 9 },
    { name: 'Global-CDN', used: 45, wasted: 55 },
  ],
  '14d': [
    { name: 'US-East-1', used: 78, wasted: 22 },
    { name: 'US-East-2', used: 72, wasted: 28 },
    { name: 'EU-West-1', used: 60, wasted: 40 },
    { name: 'EU-Central-1', used: 85, wasted: 15 },
    { name: 'APAC-Tokyo', used: 89, wasted: 11 },
    { name: 'Global-CDN', used: 42, wasted: 58 },
  ],
  '30d': [
    { name: 'US-East-1', used: 74, wasted: 26 },
    { name: 'US-East-2', used: 70, wasted: 30 },
    { name: 'EU-West-1', used: 58, wasted: 42 },
    { name: 'EU-Central-1', used: 82, wasted: 18 },
    { name: 'APAC-Tokyo', used: 85, wasted: 15 },
    { name: 'Global-CDN', used: 40, wasted: 60 },
  ],
  'custom': [
    { name: 'US-East-1', used: 80, wasted: 20 },
    { name: 'US-East-2', used: 74, wasted: 26 },
    { name: 'EU-West-1', used: 62, wasted: 38 },
    { name: 'EU-Central-1', used: 86, wasted: 14 },
    { name: 'APAC-Tokyo', used: 90, wasted: 10 },
    { name: 'Global-CDN', used: 44, wasted: 56 },
  ]
};

// Mock incident taxonomy data
const ERROR_DATA_MODELS: Record<string, any[]> = {
  '7d': [
    { name: 'Auth Failure', value: 120, color: '#818cf8' },
    { name: 'DB Timeout', value: 85, color: '#f43f5e' },
    { name: 'Network Blip', value: 45, color: '#fbbf24' },
    { name: 'API 5xx', value: 30, color: '#10b981' },
  ],
  '14d': [
    { name: 'Auth Failure', value: 240, color: '#818cf8' },
    { name: 'DB Timeout', value: 160, color: '#f43f5e' },
    { name: 'Network Blip', value: 95, color: '#fbbf24' },
    { name: 'API 5xx', value: 65, color: '#10b981' },
  ],
  '30d': [
    { name: 'Auth Failure', value: 480, color: '#818cf8' },
    { name: 'DB Timeout', value: 320, color: '#f43f5e' },
    { name: 'Network Blip', value: 180, color: '#fbbf24' },
    { name: 'API 5xx', value: 140, color: '#10b981' },
  ],
  'custom': [
    { name: 'Auth Failure', value: 180, color: '#818cf8' },
    { name: 'DB Timeout', value: 110, color: '#f43f5e' },
    { name: 'Network Blip', value: 60, color: '#fbbf24' },
    { name: 'API 5xx', value: 45, color: '#10b981' },
  ]
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2">{label}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Avg Latency</span>
            <span className="text-xs font-black text-white">{data.latency.toFixed(1)}ms</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] text-slate-400 font-bold uppercase">System Uptime</span>
            <span className="text-xs font-black text-emerald-400">{data.uptime.toFixed(3)}%</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Critical Errors</span>
            <span className={`text-xs font-black ${data.errors > 8 ? 'text-rose-400' : 'text-slate-200'}`}>{data.errors}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[11px] text-slate-400 font-bold">Total Events</span>
            <span className="text-xs font-black text-white">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[11px] text-slate-400 font-bold">Contribution</span>
            <span className="text-xs font-black text-indigo-400">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const used = payload.find((p: any) => p.dataKey === 'used')?.value || 0;
    const wasted = payload.find((p: any) => p.dataKey === 'wasted')?.value || 0;
    const efficiency = ((used / (used + wasted)) * 100).toFixed(1);

    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2">{label}</p>
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">Utilized</span>
            </div>
            <span className="text-xs font-black text-white">{used}%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">Wasted</span>
            </div>
            <span className="text-xs font-black text-rose-400">{wasted}%</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-black uppercase">Core Efficiency</span>
            <span className="text-sm font-black text-indigo-400">{efficiency}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredPerformanceData = useMemo(() => {
    if (dateRange === 'custom') {
      const startTs = new Date(customStart).getTime();
      const endTs = new Date(customEnd).getTime();
      return RAW_PERFORMANCE_DATA.filter(d => d.timestamp >= startTs && d.timestamp <= endTs);
    }
    const sliceCount = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    return RAW_PERFORMANCE_DATA.slice(-sliceCount);
  }, [dateRange, customStart, customEnd]);

  const filteredResourceData = useMemo(() => {
    return REGIONAL_DATA_MODELS[dateRange] || REGIONAL_DATA_MODELS['7d'];
  }, [dateRange]);

  const filteredErrorData = useMemo(() => {
    return ERROR_DATA_MODELS[dateRange] || ERROR_DATA_MODELS['7d'];
  }, [dateRange]);

  const errorTotal = useMemo(() => {
    return filteredErrorData.reduce((acc, item) => acc + item.value, 0);
  }, [filteredErrorData]);

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Predictive Analytics</h1>
          <p className="text-slate-400 text-sm">Advanced telemetry analysis and operational forecasting.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 p-1.5 rounded-2xl animate-in zoom-in-95 duration-300">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-slate-300 outline-none px-2 py-1 border border-slate-700/50 rounded-lg focus:border-indigo-500 transition-colors cursor-pointer"
              />
              <span className="text-[10px] font-black text-slate-600 uppercase">to</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-slate-300 outline-none px-2 py-1 border border-slate-700/50 rounded-lg focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>
          )}

          {/* Date Range Selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-inner">
            {(['7d', '14d', '30d', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  dateRange === range 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block"></div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all">Export Report</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Recalculate Models</button>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'MTTR (Resolution)', value: '18m', trend: '-4m', desc: 'Mean Time To Recovery', color: 'text-emerald-400' },
          { label: 'SLA Availability', value: '99.982%', trend: '+0.01%', desc: '30-Day Rolling Window', color: 'text-indigo-400' },
          { label: 'Cost Efficiency', value: '84.2%', trend: '+2.4%', desc: 'Resource Utilization Score', color: 'text-amber-400' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] relative overflow-hidden group">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-white">{kpi.value}</span>
              <span className={`text-[10px] font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{kpi.desc}</p>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full group-hover:bg-indigo-500/10 transition-all"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trends */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              Network Latency vs Uptime
            </h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              {filteredPerformanceData.length} observations found
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPerformanceData} margin={{ bottom: 20 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#818cf8" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                  animationDuration={1000}
                />
                <Brush 
                  dataKey="day" 
                  height={30} 
                  stroke="#475569" 
                  fill="#0f172a" 
                  travellerWidth={10}
                  gap={5}
                >
                  <AreaChart>
                    <Area type="monotone" dataKey="latency" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
                  </AreaChart>
                </Brush>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Taxonomy */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              Incident Taxonomy
            </h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              {dateRange} View
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 h-80 md:h-64">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredErrorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    animationDuration={1500}
                  >
                    {filteredErrorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip total={errorTotal} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 shrink-0 pr-4">
              {filteredErrorData.map((item, idx) => {
                const perc = errorTotal > 0 ? ((item.value / errorTotal) * 100).toFixed(0) : '0';
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{backgroundColor: item.color}}></div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 rounded-md">{perc}%</span>
                      </div>
                      <div className="text-xs font-black text-white">{item.value} Events</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Resource Efficiency */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Cluster Resource Allocation Efficiency
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Reactive Regional Scaling
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredResourceData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Legend verticalAlign="top" iconType="circle" wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingBottom: '20px'}} />
                <Bar 
                  dataKey="used" 
                  name="Utilized Resource" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40} 
                  animationDuration={1000}
                />
                <Bar 
                  dataKey="wasted" 
                  name="Idle Over-provision" 
                  fill="#334155" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40} 
                  animationDuration={1000}
                />
                <Brush 
                  dataKey="name" 
                  height={30} 
                  stroke="#334155" 
                  fill="#0f172a" 
                  travellerWidth={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
