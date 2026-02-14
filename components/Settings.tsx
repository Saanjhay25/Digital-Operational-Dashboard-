
import React, { useState, useRef } from 'react';
import { OpsDB } from '../services/dbService';
import { AuthService } from '../services/authService';

interface SettingsProps {
  username: string;
  avatar: string;
  role: string;
  onAvatarChange: (newUrl: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ username, avatar, role, onAvatarChange }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Verification keys do not match.' });
      setIsLoading(false);
      return;
    }

    // Call Secure API logic with role-based "Middleware" enforcement
    const result = await AuthService.changePassword(username, currentPassword, newPassword, role);
    
    if (result.success) {
      setStatus({ type: 'success', message: 'password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to update system credentials.' });
    }
    
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          // Users are allowed to update their own avatar via dbService simulation
          await OpsDB.updateUser(username, { avatarUrl: base64String }, role);
          onAvatarChange(base64String);
          setStatus({ type: 'success', message: 'Profile picture committed to database.' });
          setTimeout(() => setStatus({ type: null, message: '' }), 3000);
        } catch (e: any) {
          setStatus({ type: 'error', message: e.message || 'Failed to save avatar.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const ToggleIcon = ({ visible }: { visible: boolean }) => (
    visible ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
    )
  );

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">System Preferences</h1>
        <p className="text-slate-400">Manage your profile identity and security settings.</p>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-[40px] p-10 shadow-2xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
          <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
          Profile Identity
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[32px] bg-slate-900 border border-slate-700 overflow-hidden transition-all duration-500 group-hover:border-indigo-500/50 shadow-inner">
               <img src={avatar} className="w-full h-full object-cover" alt="User profile" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 transition-all active:scale-90"
              title="Change Profile Picture"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs opacity-50">Avatar Settings</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload a new image to personalize your dashboard profile. Changes are saved permanently.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-[40px] p-10 shadow-2xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
          <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
          Security Credentials
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Current Password"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                <ToggleIcon visible={showCurrent} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="New Password"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <ToggleIcon visible={showNew} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Confirm Password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <ToggleIcon visible={showConfirm} />
                </button>
              </div>
            </div>
          </div>

          {status.message && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${status.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 py-4 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Update Access Credentials
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
