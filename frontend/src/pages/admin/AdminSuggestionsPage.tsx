import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestionsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Lightbulb, CheckCircle, XCircle, PackageCheck, Clock, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  APPROVED: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  ADDED: { label: 'Added', color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/30' },
};

const urgencyColors: Record<string, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

export function AdminSuggestionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suggestions', 'admin', statusFilter],
    queryFn: () => suggestionsApi.list({ status: statusFilter || undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      suggestionsApi.review(id, { status, adminNote }),
    onSuccess: () => {
      toast.success('Suggestion reviewed!');
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      setReviewId(null);
      setAdminNote('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const suggestions = data?.data?.suggestions || [];
  const total = data?.data?.total || 0;
  const pendingCount = suggestions.filter((s: any) => s.status === 'PENDING').length;

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'ADDED', label: 'Added' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Asset Suggestions</h1>
          <p className="text-sm text-[#555577]">{total} total suggestions from users</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            {pendingCount} pending review
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-[#0d0d1f] p-1 rounded-lg w-fit border border-[rgba(99,102,241,0.1)]">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              statusFilter === tab.value ? 'bg-indigo-600 text-white shadow' : 'text-[#8888aa] hover:text-[#e0e0ff]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review Modal */}
      {reviewId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-semibold text-[#e0e0ff] mb-3">
              {reviewAction === 'APPROVED' ? '✅ Approve Suggestion' :
               reviewAction === 'ADDED' ? '📦 Mark as Added' : '❌ Reject Suggestion'}
            </h3>
            <label className="label">Note to user (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Leave a note for the user..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => reviewMutation.mutate({ id: reviewId, status: reviewAction, adminNote })}
                className={clsx('flex-1 justify-center', reviewAction === 'REJECTED' ? 'btn-danger' : 'btn-success')}
              >
                {reviewAction === 'APPROVED' ? 'Approve' : reviewAction === 'ADDED' ? 'Mark Added' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions list */}
      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 text-[#555577]">
          <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-30" />
          No suggestions found
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s: any) => {
            const sc = statusConfig[s.status];
            return (
              <div key={s.id} className={clsx('card p-5', s.status === 'PENDING' && 'border-amber-500/20')}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-[#e0e0ff]">{s.assetName}</span>
                      <span className={clsx('badge border text-xs', sc.bg, sc.color)}>{sc.label}</span>
                      <span className={clsx('text-xs font-medium', urgencyColors[s.urgency])}>
                        {s.urgency} urgency
                      </span>
                    </div>

                    <div className="flex gap-3 mt-1 text-xs text-[#555577] flex-wrap">
                      <span className="text-indigo-400">{s.user?.name}</span>
                      <span>{s.user?.department || s.user?.email}</span>
                      <span>{s.category}</span>
                      <span>Qty needed: {s.quantity}</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-sm text-[#8888aa] mt-2">{s.reason}</p>

                    {s.adminNote && (
                      <div className="mt-2 text-xs px-3 py-2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Your note: {s.adminNote}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {s.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setReviewId(s.id); setReviewAction('APPROVED'); setAdminNote(''); }}
                        className="btn-success text-xs py-1.5 px-3"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => { setReviewId(s.id); setReviewAction('ADDED'); setAdminNote(''); }}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <PackageCheck className="w-3.5 h-3.5" /> Mark Added
                      </button>
                      <button
                        onClick={() => { setReviewId(s.id); setReviewAction('REJECTED'); setAdminNote(''); }}
                        className="btn-danger text-xs py-1.5 px-3"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {s.status === 'APPROVED' && (
                    <button
                      onClick={() => { setReviewId(s.id); setReviewAction('ADDED'); setAdminNote(''); }}
                      className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      <PackageCheck className="w-3.5 h-3.5" /> Mark Added
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
