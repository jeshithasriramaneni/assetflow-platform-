import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assetsApi } from '../services/api';
import { useAuthStore } from '../store/auth';
import { assetStatusConfig, conditionConfig, formatDate } from '../utils';
import { BookingModal } from '../components/modals/BookingModal';
import { ArrowLeft, MapPin, Calendar, Hash, Wrench, Package, QrCode } from 'lucide-react';
import clsx from 'clsx';
import { bookingStatusConfig } from '../utils';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showBooking, setShowBooking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.get(id!),
    enabled: !!id,
  });
  const { data: qrData } = useQuery({
    queryKey: ['asset-qr', id],
    queryFn: () => assetsApi.getQRCode(id!),
    enabled: !!id && user?.role === 'ADMIN',
  });

  const asset = data?.data;
  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!asset) return <div className="p-6 text-[#555577]">Asset not found</div>;

  const sc = assetStatusConfig[asset.status as keyof typeof assetStatusConfig];
  const cc = conditionConfig[asset.condition as keyof typeof conditionConfig];
  const canBook = (asset.status === 'AVAILABLE' || asset.status === 'PARTIALLY_AVAILABLE') && user?.role === 'USER';

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#8888aa] hover:text-[#e0e0ff] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="card p-6 lg:col-span-2 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${asset.category?.color}20` }}>
              <Package className="w-7 h-7" style={{ color: asset.category?.color }} />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-[#e0e0ff]">{asset.name}</h1>
              <div className="text-sm mt-0.5" style={{ color: asset.category?.color }}>{asset.category?.name}</div>
              <div className="flex gap-2 mt-2">
                <span className={clsx('badge border text-xs', sc.bg, sc.color)}>
                  <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1', sc.dot)} />{sc.label}
                </span>
                <span className={clsx('badge border text-xs border-transparent bg-[#1a1a30]', cc.color)}>{cc.label}</span>
              </div>
            </div>
          </div>

          {asset.description && <p className="text-sm text-[#8888aa]">{asset.description}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d0d1f] rounded-lg p-3">
              <div className="text-xs text-[#555577] mb-1">Availability</div>
              <div className="font-display text-lg font-bold text-[#e0e0ff]">{asset.availableQuantity} <span className="text-sm text-[#555577]">/ {asset.totalQuantity}</span></div>
            </div>
            {asset.location && (
              <div className="bg-[#0d0d1f] rounded-lg p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs text-[#555577]">Location</div>
                  <div className="text-sm text-[#e0e0ff]">{asset.location}</div>
                </div>
              </div>
            )}
            {asset.serialNumber && (
              <div className="bg-[#0d0d1f] rounded-lg p-3 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs text-[#555577]">Serial Number</div>
                  <div className="text-sm text-[#e0e0ff] font-mono">{asset.serialNumber}</div>
                </div>
              </div>
            )}
            {asset.purchaseDate && (
              <div className="bg-[#0d0d1f] rounded-lg p-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs text-[#555577]">Purchased</div>
                  <div className="text-sm text-[#e0e0ff]">{formatDate(asset.purchaseDate)}</div>
                </div>
              </div>
            )}
          </div>

          {canBook && (
            <button onClick={() => setShowBooking(true)} className="btn-primary w-full justify-center py-3">
              <Calendar className="w-4 h-4" /> Book This Asset
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* QR Code (admin only) */}
          {user?.role === 'ADMIN' && qrData?.data?.qrDataUrl && (
            <div className="card p-4 text-center">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-[#8888aa]">QR Code</span>
              </div>
              <img src={qrData.data.qrDataUrl} alt="QR Code" className="w-32 h-32 mx-auto rounded-lg" />
              <div className="text-xs font-mono text-[#555577] mt-2">{qrData.data.qrCode}</div>
            </div>
          )}

          {/* Active bookings (admin) */}
          {user?.role === 'ADMIN' && asset.bookings && asset.bookings.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-medium text-[#8888aa] mb-3">Active Bookings ({asset.bookings.length})</h3>
              <div className="space-y-2">
                {asset.bookings.map((b: any) => {
                  const bsc = bookingStatusConfig[b.status as keyof typeof bookingStatusConfig];
                  return (
                    <div key={b.id} className="bg-[#0d0d1f] rounded-lg p-2.5 text-xs">
                      <div className="font-medium text-[#e0e0ff]">{b.user.name}</div>
                      <div className="text-[#555577]">{formatDate(b.startDate)} → {formatDate(b.endDate)}</div>
                      <span className={clsx('badge border mt-1', bsc.bg, bsc.color)}>{bsc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Maintenance history */}
          {asset.maintenanceLogs && asset.maintenanceLogs.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-medium text-[#8888aa]">Maintenance History</h3>
              </div>
              <div className="space-y-2">
                {asset.maintenanceLogs.map((log: any) => (
                  <div key={log.id} className="bg-[#0d0d1f] rounded-lg p-2.5 text-xs">
                    <div className="text-[#e0e0ff]">{log.description}</div>
                    <div className="text-[#555577] mt-0.5">{formatDate(log.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBooking && <BookingModal asset={asset} onClose={() => setShowBooking(false)} />}
    </div>
  );
}
