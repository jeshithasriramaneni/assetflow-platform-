import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { Booking } from '../../types';
import { bookingStatusConfig, formatDate, isOverdue } from '../../utils';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Package, Send, RotateCcw, Search, Loader2, Calendar } from 'lucide-react';
import clsx from 'clsx';

export function BookingsAdminPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'admin', statusFilter, page],
    queryFn: () => bookingsApi.list({ status: statusFilter || undefined, page, limit: 15 }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, adminNote }: { id: string; action: 'approve' | 'reject'; adminNote?: string }) =>
      bookingsApi.review(id, { action, adminNote }),
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'approve' ? 'Booking approved' : 'Booking rejected');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setRejectId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Action failed'),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.issue(id),
    onSuccess: () => { toast.success('Asset issued successfully'); qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['assets'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Issue failed'),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.return(id),
    onSuccess: () => { toast.success('Asset returned'); qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['assets'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Return failed'),
  });

  const bookings: Booking[] = data?.data?.bookings || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const filtered = search
    ? bookings.filter(b => b.asset.name.toLowerCase().includes(search.toLowerCase()) || b.user.name.toLowerCase().includes(search.toLowerCase()))
    : bookings;

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'ISSUED', label: 'Issued' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Bookings</h1>
          <p className="text-sm text-[#555577]">{total} total requests</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-[#0d0d1f] p-1 rounded-lg w-fit border border-[rgba(99,102,241,0.1)]">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white shadow'
                : 'text-[#8888aa] hover:text-[#e0e0ff]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577]" />
        <input className="input pl-9" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-semibold text-[#e0e0ff] mb-3">Reject Booking</h3>
            <label className="label">Reason (optional)</label>
            <textarea className="input" rows={3} placeholder="Provide a reason for rejection..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => reviewMutation.mutate({ id: rejectId, action: 'reject', adminNote: rejectNote })}
                className="btn-danger flex-1 justify-center"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d0d1f]">
              <tr>
                {['Booking', 'User', 'Asset', 'Qty', 'Dates', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="table-cell text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-12 text-[#555577]">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />No bookings found
                </td></tr>
              ) : filtered.map((b) => {
                const sc = bookingStatusConfig[b.status];
                const overdue = b.status === 'ISSUED' && isOverdue(b.endDate);
                return (
                  <tr key={b.id} className={clsx('table-row', overdue && 'bg-red-500/5')}>
                    <td className="table-cell">
                      <div className="font-mono text-xs text-[#555577]">#{b.id.slice(0, 8)}</div>
                      <div className="text-xs text-[#8888aa] mt-0.5 max-w-[200px] truncate">{b.purpose}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-[#e0e0ff]">{b.user.name}</div>
                      <div className="text-xs text-[#555577]">{b.user.department}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-[#e0e0ff]">{b.asset.name}</div>
                      <div className="text-xs" style={{ color: b.asset.category?.color }}>{b.asset.category?.name}</div>
                    </td>
                    <td className="table-cell font-mono text-sm">{b.quantity}</td>
                    <td className="table-cell text-xs text-[#8888aa]">
                      <div>{formatDate(b.startDate)}</div>
                      <div>→ {formatDate(b.endDate)}</div>
                      {overdue && <div className="text-red-400 font-medium mt-0.5">Overdue!</div>}
                    </td>
                    <td className="table-cell">
                      <span className={clsx('badge border', sc.bg, sc.color)}>{sc.label}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {b.status === 'PENDING' && (
                          <>
                            <button onClick={() => reviewMutation.mutate({ id: b.id, action: 'approve' })} className="p-1.5 rounded hover:bg-emerald-600/15 text-[#555577] hover:text-emerald-400 transition-colors" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setRejectId(b.id); setRejectNote(''); }} className="p-1.5 rounded hover:bg-red-600/15 text-[#555577] hover:text-red-400 transition-colors" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {b.status === 'APPROVED' && (
                          <button onClick={() => issueMutation.mutate(b.id)} className="p-1.5 rounded hover:bg-blue-600/15 text-[#555577] hover:text-blue-400 transition-colors" title="Issue Asset">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {(b.status === 'ISSUED' || overdue) && (
                          <button onClick={() => returnMutation.mutate(b.id)} className="p-1.5 rounded hover:bg-emerald-600/15 text-[#555577] hover:text-emerald-400 transition-colors" title="Mark Returned">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-[rgba(99,102,241,0.08)] flex items-center justify-between">
            <span className="text-xs text-[#555577]">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
