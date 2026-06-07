import { useQuery } from '@tanstack/react-query';
import { analyticsApi, bookingsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, Users, Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, bookingStatusConfig } from '../../utils';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316'];

export function AdminDashboard() {
  const { data: summary } = useQuery({ queryKey: ['analytics', 'summary'], queryFn: () => analyticsApi.summary() });
  const { data: categoryStats } = useQuery({ queryKey: ['analytics', 'categories'], queryFn: () => analyticsApi.categoryStats() });
  const { data: trends } = useQuery({ queryKey: ['analytics', 'trends'], queryFn: () => analyticsApi.bookingTrends() });
  const { data: topAssets } = useQuery({ queryKey: ['analytics', 'top-assets'], queryFn: () => analyticsApi.topAssets() });
  const { data: pendingBookings } = useQuery({
    queryKey: ['bookings', 'pending'],
    queryFn: () => bookingsApi.list({ status: 'PENDING', limit: 5 }),
  });

  const stats = summary?.data;
  const catData = categoryStats?.data || [];
  const trendData = (trends?.data || []).slice(-14);
  const topData = topAssets?.data || [];
  const pending = pendingBookings?.data?.bookings || [];

  const statCards = [
    { label: 'Total Assets', value: stats?.totalAssets ?? '—', icon: Package, color: 'indigo', change: '+2 this month' },
    { label: 'Active Members', value: stats?.totalUsers ?? '—', icon: Users, color: 'violet', change: `${stats?.totalUsers} registered` },
    { label: 'Active Bookings', value: stats?.activeBookings ?? '—', icon: Calendar, color: 'emerald', change: `${stats?.pendingApprovals} pending` },
    { label: 'Utilization Rate', value: stats ? `${stats.utilizationRate}%` : '—', icon: TrendingUp, color: 'amber', change: 'of total inventory' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Dashboard</h1>
          <p className="text-sm text-[#555577] mt-0.5">Cultural Council Asset Management</p>
        </div>
        {stats?.overdueBookings > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            {stats.overdueBookings} overdue return{stats.overdueBookings !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="stat-card group">
            <div className={clsx(
              'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl',
              color === 'indigo' && 'bg-gradient-to-br from-indigo-600/5 to-transparent',
              color === 'violet' && 'bg-gradient-to-br from-violet-600/5 to-transparent',
              color === 'emerald' && 'bg-gradient-to-br from-emerald-600/5 to-transparent',
              color === 'amber' && 'bg-gradient-to-br from-amber-600/5 to-transparent',
            )} />
            <div className="relative">
              <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                color === 'indigo' && 'bg-indigo-600/15 text-indigo-400',
                color === 'violet' && 'bg-violet-600/15 text-violet-400',
                color === 'emerald' && 'bg-emerald-600/15 text-emerald-400',
                color === 'amber' && 'bg-amber-600/15 text-amber-400',
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-display text-2xl font-bold text-[#e0e0ff] mb-1">{value}</div>
              <div className="text-sm text-[#8888aa]">{label}</div>
              <div className="text-xs text-[#555577] mt-1">{change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending approvals alert */}
      {stats?.pendingApprovals > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm font-medium text-amber-300">{stats.pendingApprovals} booking request{stats.pendingApprovals !== 1 ? 's' : ''} awaiting approval</div>
              <div className="text-xs text-[#888899]">Review and approve or reject these requests</div>
            </div>
          </div>
          <Link to="/admin/bookings" className="btn-secondary text-xs py-1.5">
            Review Now
          </Link>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Booking trends */}
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Booking Activity (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#555577', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#555577', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#8888aa' }}
                itemStyle={{ color: '#a5b4fc' }}
              />
              <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Assets by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} dataKey="totalQuantity" nameKey="name" cx="50%" cy="50%" outerRadius={75} stroke="none">
                {catData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#e0e0ff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {catData.slice(0, 4).map((cat: any, i: number) => (
              <div key={cat.id} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[#8888aa] truncate flex-1">{cat.name}</span>
                <span className="text-[#e0e0ff] font-medium">{cat.totalQuantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top assets */}
        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Most Booked Assets</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topData.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#555577', fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8888aa', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#a5b4fc' }}
              />
              <Bar dataKey="bookingCount" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-[#c0c0dd]">Pending Approvals</h3>
            <Link to="/admin/bookings?status=PENDING" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8 text-[#555577] text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              All caught up!
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-[#0d0d1f] rounded-lg border border-[rgba(99,102,241,0.1)]">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#e0e0ff] truncate">{b.asset.name}</div>
                    <div className="text-xs text-[#555577]">{b.user.name} · Qty: {b.quantity}</div>
                  </div>
                  <Link to="/admin/bookings" className="text-xs text-amber-400 hover:text-amber-300">
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
