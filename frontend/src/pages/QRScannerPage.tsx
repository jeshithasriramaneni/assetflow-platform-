import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetsApi } from '../services/api';
import { Asset } from '../types';
import { assetStatusConfig, conditionConfig } from '../utils';
import { QrCode, Camera, X, Package, MapPin, Hash, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export function QRScannerPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lookupAsset = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setFoundAsset(null);
    try {
      const res = await assetsApi.getByQR(code.trim());
      setFoundAsset(res.data);
      toast.success('Asset found!');
    } catch {
      setError('No asset found with this QR code. Please check and try again.');
      toast.error('Asset not found');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      toast('Point camera at QR code — paste the code manually if camera scanning is unavailable', { icon: '📷' });
    } catch {
      toast.error('Camera access denied. Please use manual entry.');
      setMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const sc = foundAsset ? assetStatusConfig[foundAsset.status] : null;
  const cc = foundAsset ? conditionConfig[foundAsset.condition] : null;

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">QR Scanner</h1>
        <p className="text-sm text-[#555577]">Scan or enter a QR code to look up any asset instantly</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-[#0d0d1f] p-1 rounded-lg w-fit border border-[rgba(99,102,241,0.1)]">
        <button
          onClick={() => { setMode('manual'); stopCamera(); }}
          className={clsx('px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2',
            mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-[#8888aa] hover:text-[#e0e0ff]'
          )}
        >
          <Search className="w-3.5 h-3.5" /> Manual Entry
        </button>
        <button
          onClick={() => { setMode('camera'); startCamera(); }}
          className={clsx('px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2',
            mode === 'camera' ? 'bg-indigo-600 text-white' : 'text-[#8888aa] hover:text-[#e0e0ff]'
          )}
        >
          <Camera className="w-3.5 h-3.5" /> Camera Scan
        </button>
      </div>

      {/* Manual entry */}
      {mode === 'manual' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold text-[#c0c0dd]">Enter QR Code Manually</h3>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="e.g. ASSET-1234567890-ABC123"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupAsset(manualCode)}
            />
            <button
              onClick={() => lookupAsset(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="btn-primary px-5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lookup
            </button>
          </div>
          <p className="text-xs text-[#555577]">
            You can find the QR code text printed below each QR code sticker on the asset.
          </p>
        </div>
      )}

      {/* Camera mode */}
      {mode === 'camera' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#c0c0dd]">Camera Scanner</h3>
            {scanning && (
              <button onClick={stopCamera} className="btn-danger text-xs py-1.5">
                <X className="w-3.5 h-3.5" /> Stop
              </button>
            )}
          </div>

          <div className="relative bg-[#0d0d1f] rounded-xl overflow-hidden aspect-square max-w-sm mx-auto">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-indigo-500 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-indigo-500/70 animate-bounce" style={{ top: '50%' }} />
              </div>
            </div>
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1f]">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-[#555577] mx-auto mb-2" />
                  <div className="text-sm text-[#555577]">Camera not started</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
            💡 For best results: hold the QR code steady, ensure good lighting, and keep 15-20cm distance.
            If camera doesn't auto-detect, switch to Manual Entry and type the code below the QR sticker.
          </div>

          {/* Manual fallback in camera mode */}
          <div>
            <label className="label">Or enter code manually</label>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-xs"
                placeholder="ASSET-XXXXXXXXXX-XXXXXX"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupAsset(manualCode)}
              />
              <button onClick={() => lookupAsset(manualCode)} disabled={loading || !manualCode.trim()} className="btn-primary text-xs py-2 px-3 disabled:opacity-50">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Go'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm animate-slide-up">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Found Asset */}
      {foundAsset && sc && cc && (
        <div className="card p-5 space-y-4 animate-slide-up border-indigo-500/30 shadow-lg shadow-indigo-500/10">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Asset Found!
          </div>

          {/* Asset header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${foundAsset.category?.color}20` }}>
              <Package className="w-7 h-7" style={{ color: foundAsset.category?.color }} />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#e0e0ff]">{foundAsset.name}</div>
              <div className="text-sm mt-0.5" style={{ color: foundAsset.category?.color }}>{foundAsset.category?.name}</div>
              <div className="flex gap-2 mt-1">
                <span className={clsx('text-xs font-medium', sc.color)}>● {sc.label}</span>
                <span className={clsx('text-xs', cc.color)}>{cc.label} condition</span>
              </div>
            </div>
          </div>

          {/* Asset details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d0d1f] rounded-lg p-3">
              <div className="text-xs text-[#555577] mb-1">Availability</div>
              <div className="font-display text-xl font-bold text-[#e0e0ff]">
                {foundAsset.availableQuantity}
                <span className="text-sm text-[#555577] font-normal"> / {foundAsset.totalQuantity}</span>
              </div>
            </div>
            {foundAsset.location && (
              <div className="bg-[#0d0d1f] rounded-lg p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 mt-0.5" />
                <div>
                  <div className="text-xs text-[#555577] mb-1">Location</div>
                  <div className="text-sm text-[#e0e0ff]">{foundAsset.location}</div>
                </div>
              </div>
            )}
            {foundAsset.serialNumber && (
              <div className="bg-[#0d0d1f] rounded-lg p-3 flex items-start gap-2">
                <Hash className="w-4 h-4 text-indigo-400 mt-0.5" />
                <div>
                  <div className="text-xs text-[#555577] mb-1">Serial Number</div>
                  <div className="text-sm text-[#e0e0ff] font-mono">{foundAsset.serialNumber}</div>
                </div>
              </div>
            )}
            <div className="bg-[#0d0d1f] rounded-lg p-3">
              <div className="text-xs text-[#555577] mb-1">QR Code</div>
              <div className="text-xs text-[#e0e0ff] font-mono break-all">{foundAsset.qrCode}</div>
            </div>
          </div>

          {foundAsset.description && (
            <p className="text-sm text-[#8888aa]">{foundAsset.description}</p>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-[rgba(99,102,241,0.1)]">
            <div className="text-xs text-[#555577] mb-3 font-medium uppercase tracking-wider">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/assets/${foundAsset.id}`)}
                className="btn-primary justify-center py-2.5 text-sm"
              >
                <Package className="w-4 h-4" /> View Full Details
              </button>
              <button
                onClick={() => navigate(`/admin/bookings?assetId=${foundAsset.id}`)}
                className="btn-secondary justify-center py-2.5 text-sm"
              >
                <QrCode className="w-4 h-4" /> View Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
