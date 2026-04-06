
import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Incidents from './components/Incidents';
import UserManagement from './components/UserManagement';
import SearchResults from './components/SearchResults';
import Analytics from './components/Analytics';
import LogMonitor from './components/LogMonitor';
import PasswordChangeForm from './components/PasswordChangeForm';
import { UserService } from './services/userService';
import { SessionService } from './services/sessionService';
import { DashboardService } from './services/dashboardService';
import { IncidentService } from './services/incidentService';
import { NotificationProvider, useNotifications } from './components/NotificationContext';

const AppContent: React.FC = () => {
  const { requestPermission } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState<boolean>(false);
  const [user, setUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'operator' | null>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasActiveAlert, setHasActiveAlert] = useState<boolean>(false);

  const getFallbackAvatar = (name: string) => 
    `https://ui-avatars.com/api/?name=${name || 'User'}&background=6366f1&color=fff&bold=true`;

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      const session = SessionService.getActiveSession();
      
      if (token && session) {
         setUser(session.email);
         setRole(session.role as any);
         setUserId(session.userId || localStorage.getItem('opspulse_userId'));
         handleRefreshUserData(session.email);
         setIsAuthenticated(true);
      } else {
        handleLogout();
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let lastLogTime = Date.now();
    const errorTimestamps: number[] = [];

    const pollAlerts = async () => {

      const logsRes = await DashboardService.getLogs();
      if (logsRes.success && logsRes.data) {
        const newLogs = logsRes.data.filter((l: any) => {
            const logTime = new Date(l.time).getTime();
            return logTime > lastLogTime;
        });

        if (newLogs.length > 0) {
            lastLogTime = Math.max(...newLogs.map((l: any) => new Date(l.time).getTime()));
        }

        const errorLogs = newLogs.filter((l: any) => l.level === 'ERROR');
        
        if (errorLogs.length > 0) {
            setHasActiveAlert(true);
            
            for (const log of errorLogs) {
                const ts = new Date(log.time).getTime();
                errorTimestamps.push(ts);

                await IncidentService.createIncident({
                    title: `System Error in ${log.svc}`,
                    rootCause: log.msg,
                    severity: 'high',
                    status: 'active'
                });
            }
        }

        const oneMinAgo = Date.now() - 60000;
        while(errorTimestamps.length > 0 && errorTimestamps[0] < oneMinAgo) {
            errorTimestamps.shift();
        }

        if (errorTimestamps.length > 5) {
            await IncidentService.createIncident({
                title: 'CRITICAL: High Error Rate Detected',
                rootCause: `Detected ${errorTimestamps.length} errors in the last minute. Immediate investigation required.`,
                severity: 'critical',
                status: 'active'
            });
            errorTimestamps.length = 0; 
        }
      }
    };

    pollAlerts();
    const alertInterval = setInterval(pollAlerts, 120000);
    return () => clearInterval(alertInterval);
  }, [isAuthenticated]);

  const handleLogin = (email: string, userRole: 'admin' | 'operator', id: string, mustChange?: boolean) => {
    setRole(userRole);
    setUserId(id);
    if (mustChange) {
        setIsPasswordChangeRequired(true);
        setUser(email);
    } else {
        handleRefreshUserData(email);
        setIsAuthenticated(true);
        requestPermission();
    }
  };

  const handleRefreshUserData = async (email: string) => {
    setUser(email);
    try {
        const profile = await UserService.getProfile();
        setAvatar(profile.profileImage || getFallbackAvatar(email));
    } catch (err) {
        setAvatar(getFallbackAvatar(email));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    SessionService.endSession();
    setIsAuthenticated(false);
    setIsPasswordChangeRequired(false);
    setUser(null);
    setRole(null);
    setUserId(null);
    setAvatar('');
    setActiveView('Overview');
  };

  const handleAvatarChange = async (newUrl: string) => {
    if (user && role) {
      setAvatar(newUrl);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (!isAuthenticated && isPasswordChangeRequired) {
    return (
      <PasswordChangeForm 
        email={user || ''} 
        onSuccess={() => {
            handleLogout();
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
      />
    );
  }

  const renderContent = () => {
    // RBAC Route Guard: If a non-admin attempts to access User Management, send them home.
    if (activeView === 'Users' && role !== 'admin') {
      return <Dashboard role={role || 'operator'} userId={userId || ''} hasActiveAlert={hasActiveAlert} />;
    }

    switch(activeView) {
      case 'Overview': return <Dashboard role={role || 'operator'} userId={userId || ''} hasActiveAlert={hasActiveAlert} />;
      case 'Incidents': return <Incidents role={role || 'operator'} userId={userId || ''} />;
      case 'Analytics': return <Analytics />;
      case 'Logs': return <LogMonitor />;
      case 'Users': return <UserManagement currentRole={role || 'operator'} />;
      case 'Settings': return <Settings email={user || 'admin@opspulse.com'} avatar={avatar} role={role || 'operator'} onAvatarChange={handleAvatarChange} onProfileUpdate={() => handleRefreshUserData(user || '')} />;
      case 'Search': return <SearchResults query={searchQuery} onNavigate={setActiveView} role={role || 'operator'} />;
      default: return <Dashboard role={role || 'operator'} userId={userId || ''} hasActiveAlert={hasActiveAlert} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30">
      <Sidebar 
        activeView={activeView} 
        role={role || 'operator'}
        onViewChange={setActiveView} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          user={user} 
          role={role}
          avatar={avatar} 
          onNavigate={setActiveView} 
          onSearch={handleSearch}
          onAvatarChange={handleAvatarChange}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto bg-slate-950/50 custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;
