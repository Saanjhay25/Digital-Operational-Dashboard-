
import React from 'react';

const Infrastructure: React.FC = () => {
  const clusters = [
    { id: '01', name: 'US-East-Primary', nodes: 12, health: 'Optimal', cpu: 42, ram: 58 },
    { id: '02', name: 'EU-Central-Backup', nodes: 8, health: 'Optimal', cpu: 28, ram: 44 },
    { id: '03', name: 'APAC-Tokyo-Edge', nodes: 24, health: 'High Load', cpu: 82, ram: 71 },
  ];

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Infrastructure Control</h1>
        <p className="text-slate-400">Global cluster distribution and resource allocation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {clusters.map((cluster) => (
          <div key={cluster.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:border-indigo-500/50 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                cluster.health === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {cluster.health}
              </div>
              <span className="text-slate-500 font-mono text-xs">CID-{cluster.id}</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">{cluster.name}</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>CPU Load</span>
                  <span className="font-mono">{cluster.cpu}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${cluster.cpu > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${cluster.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>RAM Utilization</span>
                  <span className="font-mono">{cluster.ram}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${cluster.ram}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500 uppercase font-bold tracking-widest">
              <span>Active Nodes</span>
              <span className="text-white">{cluster.nodes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Infrastructure;
