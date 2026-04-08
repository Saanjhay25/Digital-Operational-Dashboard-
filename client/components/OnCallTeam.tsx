import React, { useState, useEffect } from 'react';

interface Operator {
  _id: string;
  name: string;
  email: string;
  availability: 'available' | 'busy';
  status?: 'active' | 'suspended';
}

interface OnCallTeamProps {
  role?: string;
}

const OnCallTeam: React.FC<OnCallTeamProps> = ({ role }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/operators`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOperators(data);
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <h3 className="text-white font-semibold mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          On-Call Team
        </span>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded border border-slate-700">Live</span>
      </h3>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-slate-500 text-xs animate-pulse py-4">Syncing team...</div>
        ) : operators.length === 0 ? (
          <div className="text-center text-slate-600 text-xs py-4">No active operators</div>
        ) : (
          operators.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-all border border-slate-700/30"
            >
              <div className="flex items-center gap-3">
                {/* Avatar with live status dot */}
                <div className="relative">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                    className="w-9 h-9 rounded-full border border-slate-700"
                    alt={member.name}
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${
                      member.availability === 'available' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </div>

                {/* Name & Email */}
                <div>
                  <div className="text-sm font-bold text-white">{member.name}</div>
                  <div className="text-[10px] text-slate-500">{member.email}</div>
                </div>
              </div>

              {/* Availability + status badges */}
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                    member.availability === 'available'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  {member.availability === 'available' ? 'On Duty' : 'Busy'}
                </span>
                {member.status === 'suspended' && (
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">
                    Suspended
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {role === 'admin' && (
        <button className="w-full mt-6 py-3 text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors border-t border-slate-700/50 pt-4">
          Manage Operations Team
        </button>
      )}
    </div>
  );
};

export default OnCallTeam;
