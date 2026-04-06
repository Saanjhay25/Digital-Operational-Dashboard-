
import React from 'react';
import { OperationalMetric } from '../types';

interface StatCardProps {
  metric: OperationalMetric;
  icon: React.ReactNode;
  statusColor?: 'emerald' | 'rose' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ metric, icon, statusColor }) => {
  const isUp = metric.trend === 'up';
  
  const colorClasses = statusColor === 'rose' 
    ? 'bg-rose-500/10 text-rose-400' 
    : statusColor === 'amber'
    ? 'bg-amber-500/10 text-amber-400'
    : statusColor === 'emerald'
    ? 'bg-emerald-500/10 text-emerald-400'
    : isUp 
    ? 'bg-emerald-500/10 text-emerald-400' 
    : 'bg-rose-500/10 text-rose-400';
  
  return (
    <div className="relative group overflow-hidden">
      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:border-indigo-500/40 group-hover:bg-slate-900/60 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
            {icon}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${colorClasses}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isUp ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              )}
            </svg>
            {metric.change}
          </div>
        </div>
        <h3 className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">{metric.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{metric.value}</span>
          <span className="text-slate-600 text-sm font-bold uppercase">{metric.unit}</span>
        </div>
      </div>
      {/* Decorative Glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[50px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
    </div>
  );
};

export default StatCard;
