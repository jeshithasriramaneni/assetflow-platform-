import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Boxes, Loader2, User, Shield, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.endsWith('@iitr.ac.in')) {
      toast.error('Only @iitr.ac.in email addresses are allowed');
      return;
    }

    if (role === 'ADMIN' && form.adminCode !== 'Iit@roorkee') {
      toast.error('Invalid admin code. Access denied.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        adminCode: role === 'ADMIN' ? form.adminCode : undefined,
      });
      setAuth(res.data.user, res.data.token);
      toast.success(role === 'ADMIN' ? '✅ Admin account created!' : '✅ Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.12) 0%, transparent 60%), #0a0a14'
    }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/40 mb-4">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient mb-1">AssetFlow</h1>
          <p className="text-sm text-[#8888aa]">IIT Roorkee Cultural Council</p>
        </div>

        <div className="card p-8 animate-slide-up">
          <h2 className="font-display text-lg font-semibold text-[#e0e0ff] mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="yourname@iitr.ac.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <p className="text-xs text-[#555577] mt-1">Only @iitr.ac.in emails are accepted</p>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555577] hover:text-[#8888aa]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole('USER'); setForm({ ...form, adminCode: '' }); }}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all',
                    role === 'USER'
                      ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-transparent border-[rgba(99,102,241,0.2)] text-[#8888aa] hover:border-indigo-500/40'
                  )}
                >
                  <User className="w-4 h-4" />
                  User / Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all',
                    role === 'ADMIN'
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                      : 'bg-transparent border-[rgba(99,102,241,0.2)] text-[#8888aa] hover:border-indigo-500/40'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  Administrator
                </button>
              </div>
            </div>

            {/* Admin code — only shown if ADMIN selected */}
            {role === 'ADMIN' && (
              <div className="animate-slide-up">
                <label className="label">Admin Secret Code</label>
                <div className="relative">
                  <input
                    type={showAdminCode ? 'text' : 'password'}
                    className="input pr-10 border-indigo-500/40"
                    placeholder="Enter admin code..."
                    value={form.adminCode}
                    onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowAdminCode(!showAdminCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555577] hover:text-[#8888aa]">
                    {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-amber-500/70 mt-1">⚠ Only authorised Cultural Council staff should register as Admin</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#555577] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
