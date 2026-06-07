import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Boxes, Eye, EyeOff, Loader2, User, Shield } from 'lucide-react';
import clsx from 'clsx';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [showPw, setShowPw] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.endsWith('@iitr.ac.in')) {
      toast.error('Only @iitr.ac.in email addresses are allowed');
      return;
    }

    if (role === 'ADMIN' && adminCode !== 'Iit@roorkee') {
      toast.error('Invalid admin code. Access denied.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const user = res.data.user;

      // Make sure the logged-in role matches what they selected
      if (role === 'ADMIN' && user.role !== 'ADMIN') {
        toast.error('This account does not have admin privileges.');
        setLoading(false);
        return;
      }
      if (role === 'USER' && user.role === 'ADMIN') {
        toast.error('Please select Administrator role to login as admin.');
        setLoading(false);
        return;
      }

      setAuth(user, res.data.token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.08) 0%, transparent 50%), #0a0a14'
    }}>
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/40 mb-4">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient mb-1">AssetFlow</h1>
          <p className="text-sm text-[#8888aa]">IIT Roorkee Cultural Council</p>
        </div>

        <div className="card p-8 shadow-2xl shadow-black/40 animate-slide-up">
          <h2 className="font-display text-lg font-semibold text-[#e0e0ff] mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="yourname@iitr.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-[#555577] mt-1">Only @iitr.ac.in emails are accepted</p>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555577] hover:text-[#8888aa]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole('USER'); setAdminCode(''); }}
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
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowAdminCode(!showAdminCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555577] hover:text-[#8888aa]">
                    {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#555577] mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
