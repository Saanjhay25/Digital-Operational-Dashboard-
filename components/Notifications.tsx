import React, { useState, useEffect } from 'react';
import { SystemNotification } from '../types';
import { DashboardService } from '../services/dashboardService';

const NotificationItem: React.FC<{ 
  notification: SystemNotification; 
  onRead: (id: string) => void;
}> = ({ notification, onRead }) => {

  const getSeverityColor = (sev: SystemNotification['severity']) => {
    switch (sev) {
      case 'error': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'success': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className={`group relative bg-slate-800/40 border rounded-2xl p-5 transition-all hover:bg-slate-800/60 ${notification.isRead ? 'border-slate-700/50' : 'border-indigo-500/30 ring-1 ring-indigo-500/20'}`}>
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${notification.isRead ? 'bg-slate-600' : 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`}></div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColor(notification.severity)}`}>
            {notification.severity}
          </span>
          <span className="text-xs text-slate-500 font-medium">{notification.category}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{notification.timestamp}</span>
      </div>

      <h3 className="text-white font-bold mb-1">{notification.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-4">{notification.message}</p>

      <div className="flex items-center gap-3">
        {!notification.isRead && (
          <button 
            onClick={() => onRead(notification.id || (notification as any).notificationId)}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    const result = await DashboardService.getNotifications();
    if (result.success && result.data) {
      setNotifications(result.data.map((n: any) => ({ ...n, id: n.notificationId || n._id })));
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    const result = await DashboardService.markNotificationRead(id);
    if (result.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } else {
      // Fallback for local update if API fails or if using mock IDs that aren't in DB
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllRead = async () => {
    // In a real app we would have a 'markAllRead' endpoint, here we loop or just mark local
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => DashboardService.markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">System Notifications</h1>
          <p className="text-slate-400">Manage alerts and operational follow-ups.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All Events
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filter === 'unread' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Unread
              {unreadCount > 0 && <span className="bg-indigo-400 text-indigo-950 px-1.5 rounded-full text-[9px]">{unreadCount}</span>}
            </button>
          </div>
          <button 
            onClick={markAllRead}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-w-4xl space-y-4">
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
          ))
        ) : (
          <div className="bg-slate-800/20 border border-slate-800 border-dashed rounded-3xl p-20 text-center">
            <div className="text-slate-600 mb-2">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
            <h3 className="text-white font-bold">Inbox Cleared</h3>
            <p className="text-slate-500 text-sm">No {filter === 'unread' ? 'unread' : ''} notifications to show at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
