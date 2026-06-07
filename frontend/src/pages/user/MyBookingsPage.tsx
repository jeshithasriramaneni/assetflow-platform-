import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { Booking } from '../../types';
import { bookingStatusConfig, formatDate, isOverdue } from '../../utils';
import toast from 'react-hot-toast';
import { ClipboardList, XCircle, Loader2, Calendar, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function MyBookingsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', statusFilter, page],
    queryFn: () => bookingsApi.list({ status: statusFilter || undefined, page, limit: 10 }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => { toast.success('Booking cancelled'); qc.invalidateQueries({ queryKey: ['my-bookings'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Cancel failed'),
  });

  const bookings: Booking[] = data?.data?.bookings || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'ISSUED', label: 'Active' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">My Bookings</h1>
        <p className="text-sm text-[#555577]">{total} total requests</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-[#0d0d1f] p-1 rounded-lg w-fit border border-[rgba(99,102,241,0.1)]">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              statusFilter === tab.value ? 'bg-indigo-600 text-white shadow' : 'text-[#8888aa] hover:text-[#e0e0ff]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-[#555577]">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="text-sm mb-3">No bookings found</div>
          <Link to="/browse" className="btn-primary text-sm">Browse Assets</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const sc = bookingStatusConfig[b.status];
            const overdue = b.status === 'ISSUED' && isOverdue(b.endDate);
            const canCancel = b.status === 'PENDING' || b.status === 'APPROVED';
            return (
              <div key={b.id} className={clsx('card p-5', overdue && 'border-red-500/30')}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${b.asset.category?.color}20` }}>
                    <Package className="w-5 h-5" style={{ color: b.asset.category?.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link to={`/assets/${b.asset.id}`} className="font-semibold text-[#e0e0ff] hover:text-indigo-300 transition-colors">
                        {b.asset.name}
                      </Link>
                      {overdue ? (
                        <span className="badge border bg-red-500/10 border-red-500/30 text-red-400 text-xs">⚠ Overdue</span>
                      ) : (
                        <span className={clsx('badge border text-xs', sc.bg, sc.color)}>{sc.label}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#8888aa] mt-1">{b.purpose}</div>

                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#555577]">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(b.startDate)} → {formatDate(b.endDate)}</span>
                      <span>Qty: <span className="text-[#e0e0ff] font-mono">{b.quantity}</span></span>
                      <span style={{ color: b.asset.category?.color }}>{b.asset.category?.name}</span>
                    </div>

                    {b.adminNote && (
                      <div className={clsx('mt-2 text-xs px-3 py-2 rounded-md',
                        b.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      )}>
                        Admin note: {b.adminNote}
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => { if (confirm('Cancel this booking?')) cancelMutation.mutate(b.id); }}
                      className="p-1.5 rounded hover:bg-red-600/15 text-[#555577] hover:text-red-400 transition-colors flex-shrink-0"
                      title="Cancel booking"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">← Prev</button>
          <span className="text-xs text-[#555577] flex items-center">Page {page} of {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
