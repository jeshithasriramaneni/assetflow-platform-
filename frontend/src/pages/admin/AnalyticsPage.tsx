import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#3b82f6'];

export function AnalyticsPage() {
  const { data: summary } = useQuery({ queryKey: ['analytics', 'summary'], queryFn: analyticsApi.summary });
  const { data: catStats } = useQuery({ queryKey: ['analytics', 'categories'], queryFn: analyticsApi.categoryStats });
  const { data: trends } = useQuery({ queryKey: ['analytics', 'trends'], queryFn: analyticsApi.bookingTrends });
  const { data: topAssets } = useQuery({ queryKey: ['analytics', 'top-assets'], queryFn: analyticsApi.topAssets });
  const { data: statusData } = useQuery({ queryKey: ['analytics', 'booking-status'], queryFn: analyticsApi.bookingStatus });

  const stats = summary?.data;
  const cats = catStats?.data || [];
  const trendData = trends?.data || [];
  const top = topAssets?.data || [];
  const statuses = statusData?.data || [];

  const summaryCards = [
    { label: 'Total Assets', value: stats?.totalAssets ?? 0, color: '#6366f1' },
    { label: 'Active Bookings', value: stats?.activeBookings ?? 0, color: '#10b981' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, color: '#f59e0b' },
    { label: 'Overdue Returns', value: stats?.overdueBookings ?? 0, color: '#ef4444' },
    { label: 'Utilization Rate', value: stats ? `${stats.utilizationRate}%` : '0%', color: '#8b5cf6' },
    { label: '30-Day Bookings', value: stats?.recentBookings ?? 0, color: '#f97316' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Analytics</h1>
        <p className="text-sm text-[#555577]">Comprehensive utilization insights</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <div className="text-2xl font-display font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-sm text-[#8888aa]">{label}</div>
          </div>
        ))}
      </div>

      {/* Booking Trends */}
      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Booking Trends — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis dataKey="date" tick={{ fill: '#555577', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} interval={4} />
            <YAxis tick={{ fill: '#555577', fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: '#8888aa' }} itemStyle={{ color: '#a5b4fc' }} />
            <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Category Utilization */}
        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Category Utilization</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#555577', fontSize: 10 }} />
              <YAxis tick={{ fill: '#555577', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8888aa' }} />
              <Bar dataKey="availableQuantity" name="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="utilizedQuantity" name="In Use" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking status distribution */}
        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={50} stroke="none">
                {statuses.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#e0e0ff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {statuses.map((s: any, i: number) => (
              <div key={s.status} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[#8888aa] flex-1">{s.status}</span>
                <span className="text-[#e0e0ff] font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Assets */}
      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-[#c0c0dd] mb-4">Top 10 Most Requested Assets</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#555577', fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#8888aa', fontSize: 11 }} width={160} />
            <Tooltip contentStyle={{ background: '#111120', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#a5b4fc' }} />
            <Bar dataKey="bookingCount" name="Bookings" fill="url(#barGrad)" radius={[0, 4, 4, 0]}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
