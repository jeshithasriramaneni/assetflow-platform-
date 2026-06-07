import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi, categoriesApi } from '../../services/api';
import { Asset } from '../../types';
import { assetStatusConfig, conditionConfig, formatDate } from '../../utils';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, QrCode, Filter, Package, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { AssetFormModal } from '../../components/modals/AssetFormModal';
import { QRModal } from '../../components/modals/QRModal';

export function AssetsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, categoryFilter, statusFilter, page],
    queryFn: () => assetsApi.list({ search, categoryId: categoryFilter, status: statusFilter, page, limit: 15 }),
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => { toast.success('Asset deleted'); qc.invalidateQueries({ queryKey: ['assets'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  });

  const assets: Asset[] = data?.data?.assets || [];
  const total: number = data?.data?.total || 0;
  const pages: number = data?.data?.pages || 1;
  const cats = categories?.data || [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Assets</h1>
          <p className="text-sm text-[#555577]">{total} total assets</p>
        </div>
        <button onClick={() => { setEditAsset(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577]" />
          <input className="input pl-9" placeholder="Search assets..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto min-w-[160px]" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-auto min-w-[140px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="PARTIALLY_AVAILABLE">Partial</option>
          <option value="UNAVAILABLE">Unavailable</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d0d1f]">
              <tr>
                {['Asset', 'Category', 'Qty Available', 'Status', 'Condition', 'Location', 'Actions'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="table-cell text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                </td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-12 text-[#555577]">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />No assets found
                </td></tr>
              ) : assets.map((asset) => {
                const sc = assetStatusConfig[asset.status];
                const cc = conditionConfig[asset.condition];
                return (
                  <tr key={asset.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-[#e0e0ff] text-sm">{asset.name}</div>
                      {asset.serialNumber && <div className="text-xs text-[#555577] font-mono">{asset.serialNumber}</div>}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-1 rounded-md" style={{ background: `${asset.category?.color}20`, color: asset.category?.color }}>
                        {asset.category?.name}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm">{asset.availableQuantity}</span>
                      <span className="text-[#555577] text-xs"> / {asset.totalQuantity}</span>
                    </td>
                    <td className="table-cell">
                      <span className={clsx('badge border', sc.bg, sc.color)}>
                        <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1.5', sc.dot)} />
                        {sc.label}
                      </span>
                    </td>
                    <td className={clsx('table-cell text-sm', cc.color)}>{cc.label}</td>
                    <td className="table-cell text-xs text-[#8888aa]">{asset.location || '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQrAsset(asset)} className="p-1.5 rounded hover:bg-indigo-600/15 text-[#555577] hover:text-indigo-400 transition-colors" title="QR Code">
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditAsset(asset); setShowForm(true); }} className="p-1.5 rounded hover:bg-blue-600/15 text-[#555577] hover:text-blue-400 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Delete this asset?')) deleteMutation.mutate(asset.id); }} className="p-1.5 rounded hover:bg-red-600/15 text-[#555577] hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {showForm && (
        <AssetFormModal
          asset={editAsset}
          categories={cats}
          onClose={() => { setShowForm(false); setEditAsset(null); }}
          onSuccess={() => { setShowForm(false); setEditAsset(null); qc.invalidateQueries({ queryKey: ['assets'] }); }}
        />
      )}

      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
    </div>
  );
}
