import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsApi, categoriesApi } from '../../services/api';
import { Asset } from '../../types';
import { assetStatusConfig } from '../../utils';
import { Search, Package, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookingModal } from '../../components/modals/BookingModal';
import clsx from 'clsx';

export function BrowseAssetsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [bookingAsset, setBookingAsset] = useState<Asset | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, categoryFilter, statusFilter, page],
    queryFn: () => assetsApi.list({ search, categoryId: categoryFilter, status: statusFilter, page, limit: 12 }),
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });

  const assets: Asset[] = data?.data?.assets || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;
  const cats = categories?.data || [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Browse Assets</h1>
        <p className="text-sm text-[#555577]">{total} assets available for booking</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577]" />
          <input className="input pl-9" placeholder="Search cameras, mics, lights..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto min-w-[160px]" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-auto min-w-[140px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="PARTIALLY_AVAILABLE">Partial</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={clsx('px-3 py-1 rounded-full text-xs font-medium transition-all border',
            !categoryFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-[#8888aa] border-[rgba(99,102,241,0.2)] hover:border-indigo-500/50'
          )}
        >All</button>
        {cats.map((c: any) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(categoryFilter === c.id ? '' : c.id)}
            className={clsx('px-3 py-1 rounded-full text-xs font-medium transition-all border',
              categoryFilter === c.id ? 'text-white border-transparent' : 'bg-transparent text-[#8888aa] border-[rgba(99,102,241,0.2)] hover:border-indigo-500/50'
            )}
            style={categoryFilter === c.id ? { background: c.color, borderColor: c.color } : {}}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-[#111120]" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 text-[#555577]">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No assets found matching your filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const sc = assetStatusConfig[asset.status];
            const canBook = asset.status === 'AVAILABLE' || asset.status === 'PARTIALLY_AVAILABLE';
            return (
              <div key={asset.id} className="card-hover p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${asset.category?.color}20` }}>
                      <Package className="w-5 h-5" style={{ color: asset.category?.color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-[#e0e0ff] text-sm leading-snug">{asset.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: asset.category?.color }}>{asset.category?.name}</div>
                    </div>
                  </div>
                  <span className={clsx('badge border text-xs flex-shrink-0', sc.bg, sc.color)}>
                    <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1', sc.dot)} />{sc.label}
                  </span>
                </div>

                {asset.description && (
                  <p className="text-xs text-[#8888aa] line-clamp-2">{asset.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[rgba(99,102,241,0.08)]">
                  <div className="text-xs text-[#555577]">
                    <span className="font-mono text-[#e0e0ff] font-semibold">{asset.availableQuantity}</span> / {asset.totalQuantity} available
                    {asset.location && <span className="ml-2">· {asset.location}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/assets/${asset.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">Details</Link>
                    {canBook && (
                      <button onClick={() => setBookingAsset(asset)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-md transition-colors">
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">← Prev</button>
          <span className="text-xs text-[#555577]">Page {page} of {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next →</button>
        </div>
      )}

      {bookingAsset && (
        <BookingModal asset={bookingAsset} onClose={() => setBookingAsset(null)} />
      )}
    </div>
  );
}
