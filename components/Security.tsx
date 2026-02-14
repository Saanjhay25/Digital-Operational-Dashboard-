
import React from 'react';

const Security: React.FC = () => {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Security Perimeter</h1>
        <p className="text-slate-400">Firewall status, threat detection, and access protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 21.241a11.955 11.955 0 01-9.618-13.257A3 3 0 016 5V3a1 1 0 011-1h10a1 1 0 011 1v2a3 3 0 012.618 3.016z"/></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Advanced Firewall</h2>
          </div>
          <p className="text-slate-400 mb-6">Real-time deep packet inspection (DPI) is enabled globally. Filtering traffic across 14 geographic edge nodes.</p>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            ACTIVE MONITORING
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl">
          <h3 className="text-white font-bold mb-4">Recent Access Logs</h3>
          <div className="space-y-4">
            {[
              { ip: '192.168.1.42', location: 'London, UK', status: 'Allowed' },
              { ip: '10.0.4.128', location: 'Tokyo, JP', status: 'Blocked' },
              { ip: '172.16.0.5', location: 'Internal VPN', status: 'Allowed' },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-mono text-white">{log.ip}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{log.location}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                  log.status === 'Allowed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
