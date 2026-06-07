import { useQuery } from '@tanstack/react-query';
import { assetsApi } from '../../services/api';
import { Asset } from '../../types';
import { X, QrCode, Download, Loader2 } from 'lucide-react';

interface Props {
  asset: Asset;
  onClose: () => void;
}

export function QRModal({ asset, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['qrcode', asset.id],
    queryFn: () => assetsApi.getQRCode(asset.id),
  });

  const qr = data?.data;

  const handleDownload = () => {
    if (!qr?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qr.qrDataUrl;
    a.download = `qr-${asset.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.1)]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-[#e0e0ff]">QR Code</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#1a1a30] text-[#555577] hover:text-[#e0e0ff]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="text-sm font-medium text-[#e0e0ff] mb-1">{asset.name}</div>
          <div className="text-xs text-[#555577] mb-5">{asset.serialNumber || asset.id.slice(0, 8)}</div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : qr?.qrDataUrl ? (
            <>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <img src={qr.qrDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-xs font-mono text-[#555577] bg-[#0d0d1f] px-3 py-2 rounded-lg mb-4 break-all">
                {qr.qrCode}
              </div>
              <button onClick={handleDownload} className="btn-primary w-full justify-center">
                <Download className="w-4 h-4" /> Download PNG
              </button>
            </>
          ) : (
            <div className="text-[#555577] text-sm py-8">No QR code available</div>
          )}
        </div>
      </div>
    </div>
  );
}
