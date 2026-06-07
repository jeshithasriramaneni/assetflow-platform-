import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { Asset } from '../../types';
import toast from 'react-hot-toast';
import { X, Calendar, Package, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface Props {
  asset: Asset;
  onClose: () => void;
}

export function BookingModal({ asset, onClose }: Props) {
  const qc = useQueryClient();
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const [form, setForm] = useState({
    quantity: 1,
    purpose: '',
    startDate: tomorrow,
    endDate: dayAfter,
  });

  const mutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      toast.success('Booking request submitted!');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Booking failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity < 1 || form.quantity > asset.availableQuantity) {
      toast.error(`Quantity must be between 1 and ${asset.availableQuantity}`);
      return;
    }
    mutation.mutate({
      assetId: asset.id,
      quantity: form.quantity,
      purpose: form.purpose,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.1)]">
          <h3 className="font-display font-semibold text-[#e0e0ff]">Book Asset</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#1a1a30] text-[#555577] hover:text-[#e0e0ff] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Asset info */}
        <div className="px-5 py-4 bg-[#0d0d1f] border-b border-[rgba(99,102,241,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${asset.category?.color}20` }}>
              <Package className="w-5 h-5" style={{ color: asset.category?.color }} />
            </div>
            <div>
              <div className="font-medium text-[#e0e0ff] text-sm">{asset.name}</div>
              <div className="text-xs text-[#555577]">{asset.availableQuantity} of {asset.totalQuantity} available</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Purpose / Event</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Describe how you'll use this asset..."
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              required
              minLength={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                min={tomorrow}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Quantity (max {asset.availableQuantity})</label>
            <input
              type="number"
              className="input"
              min={1}
              max={asset.availableQuantity}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
