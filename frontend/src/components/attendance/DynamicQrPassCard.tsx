import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  RefreshCw,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { attendanceApi } from '../../api/attendance';
import { DynamicQrPassData } from '../../types/attendance';
import { useAuth } from '../../context/AuthContext';

interface DynamicQrPassCardProps {
  onQrRefreshed?: (qrCode: string) => void;
}

export const DynamicQrPassCard: React.FC<DynamicQrPassCardProps> = ({ onQrRefreshed }) => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<DynamicQrPassData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Hàm tải mã QR động từ Backend
  const fetchQrPass = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
      const res = await attendanceApi.getDynamicQrPass();
      setQrData(res.data);
      setSecondsRemaining(res.data.cycleSeconds || 30);

      // Render sang ảnh QR Data URL chất lượng cao
      const url = await QRCode.toDataURL(res.data.qrCode, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);

      if (onQrRefreshed) {
        onQrRefreshed(res.data.qrCode);
      }
    } catch (err: unknown) {
      console.error('Lỗi tạo mã QR động:', err);
      const msg = err instanceof Error ? err.message : 'Không thể sinh mã QR động lúc này';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onQrRefreshed]);

  // Khởi tạo tải mã QR lần đầu
  useEffect(() => {
    fetchQrPass();
  }, [fetchQrPass]);

  // Đếm ngược 30 giây & tự động làm mới khi hết hạn
  useEffect(() => {
    if (loading || error) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Khi hết thời gian, tự động yêu cầu mã mới
          fetchQrPass();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, fetchQrPass]);

  // Sao chép chuỗi mã QR vào clipboard
  const handleCopyCode = async () => {
    if (!qrData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(qrData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Không thể copy mã:', err);
    }
  };

  const progressPercent = ((30 - secondsRemaining) / 30) * 100;

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden space-y-6">
      {/* Background Decorative Gradient */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Thẻ Điểm Danh QR Động
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                Chu kỳ 30s
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mã bảo mật HMAC-SHA256, tự động làm mới và dùng 1 lần chống Replay Attack.
            </p>
          </div>
        </div>

        <button
          onClick={fetchQrPass}
          disabled={refreshing}
          title="Làm mới mã ngay"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* QR Code Presentation Box */}
      <div className="flex flex-col items-center justify-center py-4 relative z-10">
        {loading ? (
          <div className="w-64 h-64 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Đang mã hóa chữ ký HMAC...</p>
          </div>
        ) : error ? (
          <div className="w-64 h-64 rounded-2xl bg-rose-950/20 border border-rose-800/30 p-4 flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={fetchQrPass}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium transition"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="relative group">
            {/* White Container Frame for QR contrast */}
            <div className="p-3.5 bg-white rounded-2xl shadow-2xl shadow-indigo-950/50 border-4 border-slate-800 transition-transform duration-300 group-hover:scale-[1.02]">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Mã QR Chấm Công"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              )}
            </div>

            {/* Scan Guidance Tag */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900/95 border border-slate-700 text-[10px] text-slate-300 font-mono shadow-md whitespace-nowrap flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Chống quét lặp</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic 30-Second Countdown Progress Bar */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Thời gian hiệu lực mã:
          </span>
          <span
            className={`font-mono font-bold ${
              secondsRemaining <= 5
                ? 'text-rose-400 animate-pulse'
                : secondsRemaining <= 10
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {secondsRemaining}s / 30s
          </span>
        </div>

        {/* Progress line */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              secondsRemaining <= 5
                ? 'bg-rose-500'
                : secondsRemaining <= 10
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
            }`}
            style={{ width: `${100 - progressPercent}%` }}
          />
        </div>
      </div>

      {/* User & Security Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center gap-2">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          )}
          <span className="text-slate-300 font-medium">{user?.fullName}</span>
          <span className="text-[10px] text-slate-500 font-mono">({user?.employeeCode})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            disabled={!qrData?.qrCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security Guarantees Callout */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-indigo-400" />
          <span>Ký số HMAC-SHA256</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3 h-3 text-emerald-400" />
          <span>Tiêu hủy Nonce sau 1 lần</span>
        </div>
      </div>
    </div>
  );
};
