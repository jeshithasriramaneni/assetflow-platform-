import { useQuery } from '@tanstack/react-query';
import { analyticsApi, bookingsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { bookingStatusConfig, formatDate, isOverdue } from '../../utils';
import { Link } from 'react-router-dom';
import { Boxes, Clock, CheckCircle, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export function UserDashboard() {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['my-stats'], queryFn: analyticsApi.myStats });
  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings', 'recent'],
    queryFn: () => bookingsApi.list({ limit: 5 }),
  });

  const s = stats?.data;
  const bookings = bookingsData?.data?.bookings || [];

  const statCards = [
    { label: 'Total Requests', value: s?.total ?? 0, icon: Boxes, color: 'text-indigo-400', bg: 'bg-indigo-600/15' },
    { label: 'Active / Approved', value: s?.active ?? 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-600/15' },
    { label: 'Pending Review', value: s?.pending ?? 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-600/15' },
    { label: 'Overdue Returns', value: s?.overdue ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-600/15' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-[#555577] mt-0.5">Welcome to the Cultural Council Asset Portal</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/browse" className="card-hover p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/15 flex items-center justify-center group-hover:bg-indigo-600/25 transition-colors">
            <Boxes className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#e0e0ff] text-sm">Browse & Book Assets</div>
            <div className="text-xs text-[#555577]">Cameras, audio, lighting & more</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#555577] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/my-bookings" className="card-hover p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/15 flex items-center justify-center group-hover:bg-emerald-600/25 transition-colors">
            <RotateCcw className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#e0e0ff] text-sm">My Bookings</div>
            <div className="text-xs text-[#555577]">Track requests & return history</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#555577] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center mb-3', bg)}>
              <Icon className={clsx('w-4 h-4', color)} />
            </div>
            <div className="font-display text-xl font-bold text-[#e0e0ff]">{value}</div>
            <div className="text-xs text-[#8888aa] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(99,102,241,0.08)]">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd]">Recent Bookings</h3>
          <Link to="/my-bookings" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
        </div>
        {bookings.length === 0 ? (
          <div className="py-10 text-center text-[#555577] text-sm">
            <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No bookings yet. <Link to="/browse" className="text-indigo-400 hover:underline">Browse assets</Link> to get started.
          </div>
        ) : (
          <div className="divide-y divide-[rgba(99,102,241,0.06)]">
            {bookings.map((b: any) => {
              const sc = bookingStatusConfig[b.status as keyof typeof bookingStatusConfig];
              const overdue = b.status === 'ISSUED' && isOverdue(b.endDate);
              return (
                <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[rgba(99,102,241,0.03)] transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${b.asset.category?.color}20` }}>
                    <Boxes className="w-4 h-4" style={{ color: b.asset.category?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#e0e0ff] truncate">{b.asset.name}</div>
                    <div className="text-xs text-[#555577]">Qty: {b.quantity} · {formatDate(b.startDate)} → {formatDate(b.endDate)}</div>
                  </div>
                  {overdue ? (
                    <span className="badge border bg-red-500/10 border-red-500/30 text-red-400">Overdue</span>
                  ) : (
                    <span className={clsx('badge border', sc.bg, sc.color)}>{sc.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
