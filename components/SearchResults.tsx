
import React, { useState, useEffect } from 'react';
import { SystemIncident, User } from '../types';
import { OpsDB } from '../services/dbService';

interface SearchResultsProps {
  query: string;
  onNavigate: (view: string) => void;
  role: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, onNavigate, role }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      const userList = await OpsDB.listAllUsers();
      setUsers(userList.map((u, index) => ({
        id: `USR-SEARCH-${index + 1}`, 
        username: u.username, 
        role: u.role || 'operator', 
        status: u.status || 'active',
        lastLogin: new Date().toISOString().split('T')[0]
      })));
      setIncidents([
        { id: 'INC-402', title: 'Postgres Connection Pool Exhausted', severity: 'critical', status: 'resolved', timestamp: '2023-10-27 14:45:00' },
        { id: 'INC-403', title: 'API Gateway High Latency (US-EAST-1)', severity: 'high', status: 'active', timestamp: '2023-10-27 15:12:30' },
      ]);
    };
    fetchMatches();
  }, []);

  const filteredIncidents = incidents.filter(i => 
    i.title.toLowerCase().includes(query.toLowerCase()) || 
    i.id.toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  const totalResults = filteredIncidents.length + filteredUsers.length;

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Search Results</h1>
        <p className="text-slate-400">Found {totalResults} matches for "<span className="text-indigo-400 font-bold">{query}</span>"</p>
      </div>

      {totalResults === 0 ? (
        <div className="bg-slate-800/20 border border-slate-800 border-dashed rounded-[40px] py-32 text-center">
          <svg className="w-16 h-16 text-slate-700 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <h2 className="text-xl font-bold text-white mb-2">No matches found</h2>
          <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">We couldn't find any incidents or users matching your search criteria. Try a different keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {filteredIncidents.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                Incidents ({filteredIncidents.length})
              </h3>
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden">
                {filteredIncidents.map(inc => (
                  <div key={inc.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors flex justify-between items-center cursor-pointer" onClick={() => onNavigate('Incidents')}>
                    <div>
                      <span className="text-xs font-mono text-indigo-400 block">{inc.id}</span>
                      <span className="text-sm font-bold text-white">{inc.title}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">{inc.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredUsers.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                Users ({filteredUsers.length})
              </h3>
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden">
                {filteredUsers.map(user => (
                  <div 
                    key={user.username} 
                    className={`p-4 border-b border-slate-700/50 transition-colors flex justify-between items-center ${role === 'admin' ? 'hover:bg-slate-700/20 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`} 
                    onClick={() => role === 'admin' && onNavigate('Users')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700">
                         <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      </div>
                      <span className="text-sm font-bold text-white">{user.username}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-800 px-2 py-1 rounded">
                      {role === 'admin' ? 'View Profile' : 'Restricted Access'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
