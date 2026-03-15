
import React, { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  user?: string | null;
  role?: string | null;
  avatar?: string;
  unreadCount?: number;
  onNavigate?: (view: string) => void;
  onSearch?: (query: string) => void;
  onAvatarChange?: (newUrl: string) => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, role, avatar, unreadCount = 0, onNavigate, onSearch, onAvatarChange, onLogout }) => {
  const [time, setTime] = useState(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [use24Hour, setUse24Hour] = useState(false); // Default to AM/PM based on user request
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch?.(searchValue);
      onNavigate?.('Search');
    }
  };

  const currentAvatar = avatar || `https://ui-avatars.com/api/?name=${user || 'User'}&background=6366f1&color=fff&bold=true`;

  return (
    <header className="h-20 bg-slate-950 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-6 flex-1">
        <form onSubmit={handleSearchSubmit} className="max-w-md w-full">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              placeholder="Query system data..."
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4 lg:gap-6 ml-4">
        {/* Time Controller */}
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors group">
          <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-400 min-w-[100px] text-center">
            {time.toLocaleTimeString('en-US', { 
              hour12: !use24Hour,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
          <div className="h-4 w-px bg-slate-800 group-hover:bg-indigo-500/30"></div>
          <button 
            onClick={() => setUse24Hour(!use24Hour)}
            className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded transition-all active:scale-90 ${
              use24Hour ? 'bg-indigo-600/10 text-indigo-400' : 'bg-slate-800 text-slate-600 hover:text-slate-400'
            }`}
          >
            {use24Hour ? '24H' : '12H'}
          </button>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white capitalize leading-tight">{user || 'User'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
              {role === 'admin' ? 'Root Administrator' : 'Operations Officer'}
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate?.('Notifications')}
            className="relative p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white shadow-lg ring-2 ring-slate-950">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          <div className="relative group ml-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 p-0.5 border border-slate-800 cursor-pointer hover:border-indigo-500 transition-all">
              <img
                className="w-full h-full rounded-[10px] object-cover"
                src={currentAvatar}
                alt="Profile"
              />
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
