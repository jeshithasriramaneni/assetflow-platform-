import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestionsApi, categoriesApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Lightbulb, Plus, Trash2, Clock, CheckCircle, XCircle, PackageCheck, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDING: { label: 'Pending Review', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  APPROVED: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  ADDED: { label: 'Added to Inventory!', icon: PackageCheck, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/30' },
};

const urgencyConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'text-slate-400' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400' },
  HIGH: { label: 'High', color: 'text-red-400' },
};

export function SuggestionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetName: '', category: '', reason: '', quantity: 1, urgency: 'MEDIUM' });

  const { data, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => suggestionsApi.list(),
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });

  const createMutation = useMutation({
    mutationFn: suggestionsApi.create,
    onSuccess: () => {
      toast.success('Suggestion submitted! Admin will review it shortly.');
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      setShowForm(false);
      setForm({ assetName: '', category: '', reason: '', quantity: 1, urgency: 'MEDIUM' });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to submit'),
  });

  const deleteMutation = useMutation({
    mutationFn: suggestionsApi.delete,
    onSuccess: () => { toast.success('Suggestion withdrawn'); qc.invalidateQueries({ queryKey: ['suggestions'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to delete'),
  });

  const suggestions = data?.data?.suggestions || [];
  const cats = categories?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetName.trim() || !form.category || !form.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Suggest an Asset</h1>
          <p className="text-sm text-[#555577]">Can't find what you need? Request it here and admin will review.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Suggestion
        </button>
      </div>

      {/* Suggestion Form */}
      {showForm && (
        <div className="card p-6 border-indigo-500/25 animate-slide-up">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-semibold text-[#e0e0ff]">Submit Asset Suggestion</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Asset Name *</label>
                <input
                  className="input"
                  placeholder="e.g. DJI Mavic Pro Drone"
                  value={form.assetName}
                  onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Category *</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {cats.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity Needed</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="label">Urgency</label>
                <select
                  className="input"
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  <option value="LOW">Low — Nice to have</option>
                  <option value="MEDIUM">Medium — Needed soon</option>
                  <option value="HIGH">High — Urgent need</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Reason / Purpose *</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Explain why this asset is needed, for which events, and how it will be used..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
                minLength={10}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                Submit Suggestion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suggestions List */}
      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 text-[#555577]">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="text-sm mb-3">No suggestions yet</div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Submit your first suggestion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s: any) => {
            const sc = statusConfig[s.status];
            const uc = urgencyConfig[s.urgency];
            const Icon = sc.icon;
            return (
              <div key={s.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-[#e0e0ff] text-sm">{s.assetName}</span>
                      <span className={clsx('badge border text-xs flex items-center gap-1', sc.bg, sc.color)}>
                        <Icon className="w-3 h-3" /> {sc.label}
                      </span>
                      <span className={clsx('text-xs font-medium', uc.color)}>
                        {uc.label} urgency
                      </span>
                    </div>

                    <div className="flex gap-3 mt-1 text-xs text-[#555577] flex-wrap">
                      <span style={{ color: '#8888aa' }}>{s.category}</span>
                      <span>Qty: {s.quantity}</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-[#8888aa] mt-2">{s.reason}</p>

                    {s.adminNote && (
                      <div className={clsx(
                        'mt-2 text-xs px-3 py-2 rounded-md',
                        s.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      )}>
                        Admin note: {s.adminNote}
                      </div>
                    )}
                  </div>

                  {s.status === 'PENDING' && (
                    <button
                      onClick={() => { if (confirm('Withdraw this suggestion?')) deleteMutation.mutate(s.id); }}
                      className="p-1.5 rounded hover:bg-red-600/15 text-[#555577] hover:text-red-400 transition-colors flex-shrink-0"
                      title="Withdraw suggestion"
                    >
                      <Trash2 className="w-4 h-4" />
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
