import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth';
import toast from 'react-hot-toast';
import { User, Lock, Save, Loader2 } from 'lucide-react';
import { getInitials } from '../utils';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => { toast.success('Password changed'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Change failed'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <div className="p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Profile</h1>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {getInitials(user?.name || 'U')}
        </div>
        <div>
          <div className="font-display text-lg font-semibold text-[#e0e0ff]">{user?.name}</div>
          <div className="text-sm text-[#8888aa]">{user?.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge border bg-indigo-600/15 text-indigo-400 border-indigo-500/20 text-xs">{user?.role}</span>
            {user?.department && <span className="text-xs text-[#555577]">{user.department}</span>}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-indigo-400" />
          <h2 className="font-display text-sm font-semibold text-[#c0c0dd]">Edit Profile</h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profile); }} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department</label>
              <input className="input" placeholder="Computer Science" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91-9876543210" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-indigo-400" />
          <h2 className="font-display text-sm font-semibold text-[#c0c0dd]">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" minLength={6} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
            </div>
          </div>
          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
            {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
