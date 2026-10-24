import React, { useState } from 'react';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { attendanceApi } from '../../api/attendance';
import { QrScanResponse } from '../../types/attendance';

interface QrScannerCardProps {
  currentQrCode?: string;
  onAttendanceSuccess?: (result: QrScanResponse) => void;
}

export const QrScannerCard: React.FC<QrScannerCardProps> = ({
  currentQrCode,
  onAttendanceSuccess,
}) => {
  const [manualCode, setManualCode] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<QrScanResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleExecuteScan = async (codeToScan: string) => {
    if (!codeToScan.trim()) {
      setScanError('Vui lòng nhập hoặc cung cấp chuỗi mã QR');
      return;
    }

    setScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const res = await attendanceApi.scanQrAttendance({
        qrData: codeToScan.trim(),
        deviceId: 'kiosk_web_scanner',
      });

      setScanResult(res);
      if (onAttendanceSuccess) {
        onAttendanceSuccess(res);
      }
    } catch (err: unknown) {
      console.error('Lỗi quét mã QR:', err);
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi quét mã QR';
      setScanError(msg);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <ScanLine className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Trạm Quét Mã QR Điểm Danh
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
              Lễ tân / Kiosk
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mô phỏng đầu đọc mã QR tại cửa văn phòng hoặc quầy lễ tân để ghi nhận chấm công.
          </p>
        </div>
      </div>

      {/* Interactive Testing Simulation Button */}
      {currentQrCode && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-800/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Chế độ Thử nghiệm Nhanh (Demo)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1-Click Test</span>
          </div>
          <p className="text-xs text-slate-300">
            Hệ thống đã nhận diện mã QR động hiện tại trên màn hình của bạn. Bấm nút dưới để giả lập máy quét đọc mã ngay tức thì:
          </p>
          <button
            onClick={() => handleExecuteScan(currentQrCode)}
            disabled={scanning}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang thẩm định chữ ký & Nonce...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Quét Thử Thẻ QR Của Tôi Ngay</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Manual QR Input Area */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">
          Hoặc dán chuỗi dữ liệu mã QR vào đây để quét thủ công:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder='{"c":"...","u":"...","t":...,"n":"...","s":"..."}'
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          <button
            onClick={() => handleExecuteScan(manualCode)}
            disabled={scanning || !manualCode.trim()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            <span>Quét</span>
          </button>
        </div>
      </div>

      {/* Success Notification Result */}
      {scanResult && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{scanResult.message}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-950/60 border border-emerald-500/20 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block">Nhân sự:</span>
              <span className="font-semibold text-slate-100">
                {scanResult.data.user.fullName} ({scanResult.data.user.employeeCode})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Thao tác:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block ${
                  scanResult.data.actionType === 'CHECK_IN'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {scanResult.data.actionType === 'CHECK_IN' ? 'Check-in Vào Ca' : 'Check-out Tan Ca'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Thời gian ghi nhận:</span>
              <span className="font-mono text-slate-200">{scanResult.data.checkTime}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Trạng thái giờ giấc:</span>
              <span
                className={`font-semibold ${
                  scanResult.data.isLate ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {scanResult.data.isLate ? 'Đi muộn' : 'Đúng giờ'}
              </span>
            </div>
            {scanResult.data.actionType === 'CHECK_OUT' && (
              <div className="col-span-2 pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-500">Tổng thời lượng làm việc: </span>
                <span className="font-bold text-indigo-300">
                  {Math.floor(scanResult.data.workDurationMinutes / 60)} giờ{' '}
                  {scanResult.data.workDurationMinutes % 60} phút
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Callout */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-2 text-rose-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            {scanError.includes('Replay Attack') ? (
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 animate-bounce" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>Xác thực mã QR không thành công</span>
          </div>
          <p className="text-slate-300 pl-7">{scanError}</p>
        </div>
      )}
    </div>
  );
};
