import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { assetsApi } from '../../services/api';
import { Asset } from '../../types';
import toast from 'react-hot-toast';
import { X, Package, Loader2 } from 'lucide-react';

interface Props {
  asset: Asset | null;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssetFormModal({ asset, categories, onClose, onSuccess }: Props) {
  const isEdit = !!asset;
  const [form, setForm] = useState({
    name: '', description: '', categoryId: '', totalQuantity: 1, availableQuantity: 1,
    status: 'AVAILABLE', condition: 'GOOD', location: '', serialNumber: '',
    purchaseDate: '', warrantyExpiry: '', notes: '',
  });

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name,
        description: asset.description || '',
        categoryId: asset.categoryId,
        totalQuantity: asset.totalQuantity,
        availableQuantity: asset.availableQuantity,
        status: asset.status,
        condition: asset.condition,
        location: asset.location || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
        warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '',
        notes: asset.notes || '',
      });
    }
  }, [asset]);

  const createMutation = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => { toast.success('Asset created'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create asset'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => assetsApi.update(asset!.id, data),
    onSuccess: () => { toast.success('Asset updated'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update asset'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, totalQuantity: Number(form.totalQuantity), availableQuantity: Number(form.availableQuantity) };
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.1)] sticky top-0 bg-[#111120] z-10">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-[#e0e0ff]">{isEdit ? 'Edit Asset' : 'Add New Asset'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#1a1a30] text-[#555577] hover:text-[#e0e0ff]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Asset Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Canon EOS 5D Mark IV" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Serial Number</label>
              <input className="input" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="CAM-001" />
            </div>
            <div>
              <label className="label">Total Quantity *</label>
              <input type="number" min={1} className="input" value={form.totalQuantity} onChange={(e) => setForm({ ...form, totalQuantity: parseInt(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Available Quantity</label>
              <input type="number" min={0} max={form.totalQuantity} className="input" value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="AVAILABLE">Available</option>
                <option value="PARTIALLY_AVAILABLE">Partially Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="label">Condition</label>
              <select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Media Room 101" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Warranty Expiry</label>
              <input type="date" className="input" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1 justify-center">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              {isEdit ? 'Update Asset' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
