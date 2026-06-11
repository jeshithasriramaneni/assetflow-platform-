import { useQuery } from '@tanstack/react-query';
import { assetsApi } from '../../services/api';
import { Asset } from '../../types';
import { X, QrCode, Download, Printer, Share2, Loader2, Package, MapPin, Hash, CheckCircle } from 'lucide-react';
import { assetStatusConfig, conditionConfig } from '../../utils';
import clsx from 'clsx';

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
  const sc = assetStatusConfig[asset.status];
  const cc = conditionConfig[asset.condition];

  const handleDownload = () => {
    if (!qr?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qr.qrDataUrl;
    a.download = `qr-${asset.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  const handlePrint = () => {
    if (!qr?.qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${asset.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: white; }
            .container { text-align: center; padding: 20px; border: 2px solid #333; border-radius: 12px; max-width: 320px; }
            .asset-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
            .serial { font-size: 12px; color: #666; margin-bottom: 12px; font-family: monospace; }
            img { width: 200px; height: 200px; }
            .qr-code { font-size: 10px; color: #999; margin-top: 8px; font-family: monospace; word-break: break-all; }
            .info { font-size: 12px; color: #444; margin-top: 8px; }
            .footer { font-size: 10px; color: #999; margin-top: 12px; border-top: 1px solid #eee; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="asset-name">${asset.name}</div>
            <div class="serial">${asset.serialNumber ? 'S/N: ' + asset.serialNumber : ''}</div>
            <img src="${qr.qrDataUrl}" alt="QR Code" />
            <div class="qr-code">${qr.qrCode}</div>
            <div class="info">
              ${asset.location ? '📍 ' + asset.location : ''}
              ${asset.category?.name ? ' | ' + asset.category.name : ''}
            </div>
            <div class="footer">IIT Roorkee Cultural Council — AssetFlow</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    if (!qr?.qrDataUrl) return;
    if (navigator.share) {
      try {
        const response = await fetch(qr.qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `qr-${asset.name}.png`, { type: 'image/png' });
        await navigator.share({ title: `QR Code - ${asset.name}`, files: [file] });
      } catch {
        // Fallback to copy
        navigator.clipboard.writeText(qr.qrCode);
        alert('QR code ID copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(qr.qrCode);
      alert('QR code ID copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.1)]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-[#e0e0ff]">Asset QR Code</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#1a1a30] text-[#555577] hover:text-[#e0e0ff]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Asset Info */}
          <div className="flex items-center gap-3 p-3 bg-[#0d0d1f] rounded-xl mb-5 border border-[rgba(99,102,241,0.1)]">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${asset.category?.color}20` }}>
              <Package className="w-5 h-5" style={{ color: asset.category?.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#e0e0ff] text-sm truncate">{asset.name}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs" style={{ color: asset.category?.color }}>{asset.category?.name}</span>
                <span className={clsx('text-xs', sc.color)}>● {sc.label}</span>
                <span className={clsx('text-xs', cc.color)}>{cc.label}</span>
              </div>
            </div>
          </div>

          {/* Asset details */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-[#0d0d1f] rounded-lg p-2.5 text-xs">
              <div className="text-[#555577] mb-0.5">Available</div>
              <div className="text-[#e0e0ff] font-mono font-semibold">{asset.availableQuantity} / {asset.totalQuantity}</div>
            </div>
            {asset.location && (
              <div className="bg-[#0d0d1f] rounded-lg p-2.5 text-xs flex items-start gap-1.5">
                <MapPin className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[#555577] mb-0.5">Location</div>
                  <div className="text-[#e0e0ff]">{asset.location}</div>
                </div>
              </div>
            )}
            {asset.serialNumber && (
              <div className="bg-[#0d0d1f] rounded-lg p-2.5 text-xs flex items-start gap-1.5">
                <Hash className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[#555577] mb-0.5">Serial No.</div>
                  <div className="text-[#e0e0ff] font-mono">{asset.serialNumber}</div>
                </div>
              </div>
            )}
            <div className="bg-[#0d0d1f] rounded-lg p-2.5 text-xs flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[#555577] mb-0.5">Condition</div>
                <div className={clsx('font-medium', cc.color)}>{cc.label}</div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : qr?.qrDataUrl ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/30 inline-block">
                  <img src={qr.qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>

              <div className="text-xs font-mono text-[#555577] bg-[#0d0d1f] px-3 py-2 rounded-lg mb-4 text-center break-all border border-[rgba(99,102,241,0.1)]">
                {qr.qrCode}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleDownload} className="btn-primary justify-center py-2 text-xs flex-col gap-1 h-auto">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button onClick={handlePrint} className="btn-secondary justify-center py-2 text-xs flex-col gap-1 h-auto">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button onClick={handleShare} className="btn-secondary justify-center py-2 text-xs flex-col gap-1 h-auto">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              <p className="text-xs text-[#555577] text-center mt-3">
                Print and stick this on the physical asset for quick scanning
              </p>
            </>
          ) : (
            <div className="text-[#555577] text-sm py-8 text-center">No QR code available</div>
          )}
        </div>
      </div>
    </div>
  );
}
