
import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Infrastructure from './components/Infrastructure';
import Security from './components/Security';
import Logs from './components/Logs';
import Settings from './components/Settings';
import Incidents from './components/Incidents';
import UserManagement from './components/UserManagement';
import Notifications from './components/Notifications';
import SearchResults from './components/SearchResults';
import Analytics from './components/Analytics';
import { OpsDB } from './services/dbService';
import { SessionService } from './services/sessionService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'operator' | null>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getFallbackAvatar = (name: string) => 
    `https://ui-avatars.com/api/?name=${name || 'User'}&background=6366f1&color=fff&bold=true`;

  useEffect(() => {
    const checkSession = async () => {
      const session = SessionService.getActiveSession();
      if (session) {
        const userData = await OpsDB.findUser(session.username);
        // ENFORCE STATUS CHECK ON REFRESH
        if (userData && userData.status === 'active') {
          setUser(session.username);
          setRole(session.role as any);
          setAvatar(userData.avatarUrl || getFallbackAvatar(session.username));
          setIsAuthenticated(true);
        } else {
          // If user is deleted or suspended, kill the session
          handleLogout();
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = (username: string, userRole: 'admin' | 'operator') => {
    setRole(userRole);
    handleRefreshUserData(username);
    setIsAuthenticated(true);
  };

  const handleRefreshUserData = async (username: string) => {
    const userData = await OpsDB.findUser(username);
    if (userData) {
      setUser(username);
      setAvatar(userData.avatarUrl || getFallbackAvatar(username));
    }
  };

  const handleLogout = () => {
    SessionService.endSession();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setAvatar('');
    setActiveView('Overview');
  };

  const handleAvatarChange = async (newUrl: string) => {
    if (user && role) {
      await OpsDB.updateUser(user, { avatarUrl: newUrl }, role);
      setAvatar(newUrl);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // RBAC Route Guard: If a non-admin attempts to access User Management, send them home.
    if (activeView === 'Users' && role !== 'admin') {
      return <Dashboard />;
    }

    switch(activeView) {
      case 'Overview': return <Dashboard />;
      case 'Infrastructure': return <Infrastructure />;
      case 'Security': return <Security />;
      case 'Incidents': return <Incidents role={role || 'operator'} />;
      case 'Analytics': return <Analytics />;
      case 'Logs': return <Logs />;
      case 'Users': return <UserManagement currentRole={role || 'operator'} />;
      case 'Settings': return <Settings username={user || 'admin'} avatar={avatar} role={role || 'operator'} onAvatarChange={handleAvatarChange} />;
      case 'Notifications': return <Notifications />;
      case 'Search': return <SearchResults query={searchQuery} onNavigate={setActiveView} role={role || 'operator'} />;
      default: return <Dashboard />;
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
          avatar={avatar || getFallbackAvatar(user || 'User')} 
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

export default App;
