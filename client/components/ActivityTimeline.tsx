import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

interface ActivityLog {
  _id: string;
  action: string;
  description: string;
  userId: {
    _id: string;
    name: string;
  };
  incidentId?: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

const ActivityTimeline: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    const socket = io('http://localhost:5000');
    socket.on('activity_log_created', (newActivity: ActivityLog) => {
      setActivities(prev => [newActivity, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (action: string) => {
    if (action.includes('Incident')) return '🚨';
    if (action.includes('Server') || action.includes('System')) return '🔧';
    return '👤';
  };

  const formatRelativeTime = (dateInput: string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h2 className="text-xl font-bold text-white tracking-tight">Activity Timeline</h2>
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Audit Log</span>
      </div>

      <div className="p-4 overflow-y-auto max-h-[500px] custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-10 text-slate-500">
             <p className="animate-pulse">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="text-xs uppercase tracking-widest font-bold">No activity logged yet</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/50">
            {activities.map((activity) => (
              <div key={activity._id} className="relative flex gap-4 items-start group">
                <div className="relative z-10 w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shadow-lg group-hover:border-indigo-500/50 transition-colors">
                  {getIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {activity.action}
                    </h3>
                    <span className="text-[10px] font-black text-indigo-400 uppercase shrink-0 whitespace-nowrap">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activity.description}
                  </p>
                  {activity.incidentId && (
                    <div className="mt-2 text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1">
                       <span className="w-1 h-1 rounded-full bg-indigo-500/50"></span>
                       Ref: {activity.incidentId.title}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
