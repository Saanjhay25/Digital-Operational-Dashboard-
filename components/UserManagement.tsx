
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { OpsDB } from '../services/dbService';

interface UserManagementProps {
  currentRole: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const currentLoggedUser = localStorage.getItem('opspulse_user');

  // STRICT RBAC BLOCK: Absolute UI denial for non-admins
  if (currentRole !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="bg-rose-500/10 border border-rose-500/20 p-10 rounded-[32px] text-center max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Unauthorized Access</h1>
          <p className="text-slate-400 text-sm">You do not have administrative privileges to manage system identities.</p>
        </div>
      </div>
    );
  }

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'operator'>('operator');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const userList = await OpsDB.listAllUsers();
    setUsers(userList.map((u, index) => ({
      id: `USR-00${index + 1}`,
      username: u.username,
      role: u.role || 'operator',
      status: u.status || 'active',
      lastLogin: new Date().toISOString().split('T')[0]
    })));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const existing = await OpsDB.findUser(newUsername);
      if (existing) {
        alert('Identity Conflict: This username is already registered.');
        return;
      }

      const hashedPassword = await OpsDB.hashString(newPassword);
      await OpsDB.addUser(newUsername, { password: hashedPassword, role: newRole }, 'admin');
      setIsAdding(false);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (username: string) => {
    if (username === currentLoggedUser) {
      alert('Action Denied: You cannot suspend your own administrative session.');
      return;
    }
    try {
      await OpsDB.toggleStatus(username, 'admin');
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === currentLoggedUser) {
      alert('Deletion Intercepted: Root accounts cannot delete themselves.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to PERMANENTLY delete user "${username}"?`)) {
      try {
        await OpsDB.deleteUser(username, 'admin');
        loadUsers();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Identity Management</h1>
          <p className="text-slate-400">Manage operational access, roles, and account status.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            Provision New Identity
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[32px] animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">New User Provisioning</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter the username" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">System Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">Create</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-700">
            <tr>
              <th className="px-8 py-5">Identity</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Control Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-slate-300 text-sm">
            {users.map((user) => (
              <tr key={user.username} className="hover:bg-slate-700/20 transition-all">
                <td className="px-8 py-5 font-bold text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-slate-700/50 border-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    {user.username}
                  </div>
                </td>
                <td className="px-8 py-5">
                   <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                     user.role === 'admin' ? 'text-indigo-400 bg-indigo-900/20 border-indigo-500/20' : 'text-emerald-400 bg-emerald-900/20 border-emerald-500/20'
                   }`}>
                     {user.role}
                   </span>
                </td>
                <td className="px-8 py-5">
                   <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                     user.status === 'active' ? 'text-emerald-400 bg-emerald-900/20 border-emerald-500/20' : 'text-rose-400 bg-rose-900/20 border-rose-500/20'
                   }`}>
                     {user.status}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {user.username !== currentLoggedUser && (
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleToggleStatus(user.username)}
                        className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl border transition-all ${
                          user.status === 'active' 
                            ? 'text-rose-400 bg-rose-900/20 border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                            : 'text-emerald-400 bg-emerald-900/20 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.username)}
                        className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
