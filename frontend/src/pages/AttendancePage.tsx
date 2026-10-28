import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Check,
  ScanFace,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/attendance';
import { companiesApi, LocationItem } from '../api/companies';
import {
  TodayAttendanceData,
  AttendanceHistoryItem,
  GpsCheckInResponse,
} from '../types/attendance';
import { DynamicQrPassCard } from '../components/attendance/DynamicQrPassCard';
import { QrScannerCard } from '../components/attendance/QrScannerCard';
import {
  QrCode,
  ScanLine,
} from 'lucide-react';

// Công thức Haversine tính khoảng cách giữa 2 tọa độ (mét)
const calculateHaversineDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
  }
  return `${meters} m`;
};

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();

  // Active attendance tab
  const [activeTab, setActiveTab] = useState<'GPS' | 'QR_PASS' | 'QR_SCANNER'>('GPS');
  const [latestQrCode, setLatestQrCode] = useState<string>('');

  // Current GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Locations of company
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Attendance state
  const [todayData, setTodayData] = useState<TodayAttendanceData | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Check-in action state
  const [submittingGps, setSubmittingGps] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<GpsCheckInResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Realtime clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Tải danh sách địa điểm văn phòng
  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await companiesApi.getLocations();
      setLocations(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách địa điểm GPS:', err);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  // 2. Tải thông tin chấm công hôm nay & lịch sử
  const fetchAttendanceStatus = useCallback(async () => {
    setLoadingData(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        attendanceApi.getTodayAttendance(),
        attendanceApi.getMyAttendanceHistory(10),
      ]);
      setTodayData(todayRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu chấm công:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    fetchAttendanceStatus();
  }, [fetchLocations, fetchAttendanceStatus]);

  // 3. Lấy vị trí GPS từ thiết bị (HTML5 Geolocation API)
  const acquireDeviceGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị Geolocation.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        let msg = 'Không thể lấy tọa độ vị trí.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Quyền truy cập vị trí GPS bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt / điện thoại để điểm danh.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Tín hiệu vệ tinh vị trí hiện không khả dụng. Vui lòng bật GPS trên thiết bị.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Quá thời gian lấy tín hiệu định vị GPS. Vui lòng thử lại.';
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Tự động lấy GPS khi vào trang
  useEffect(() => {
    acquireDeviceGps();
  }, [acquireDeviceGps]);

  // 4. Tính toán khoảng cách đến văn phòng gần nhất
  let closestLocation: LocationItem | null = null;
  let minDistanceMeters = Infinity;
  let isWithinGeofence = false;

  if (coords && locations.length > 0) {
    for (const loc of locations) {
      const dist = calculateHaversineDistanceMeters(
        coords.lat,
        coords.lng,
        loc.latitude,
        loc.longitude
      );
      if (dist < minDistanceMeters) {
        minDistanceMeters = dist;
        closestLocation = loc;
      }
      const allowedRadius = loc.radiusMeters || 100;
      if (dist <= allowedRadius) {
        isWithinGeofence = true;
      }
    }
  }

  // 5. Thực hiện điểm danh GPS
  const handleGpsCheckIn = async () => {
    if (!coords) {
      acquireDeviceGps();
      return;
    }

    setSubmittingGps(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await attendanceApi.checkInGps({
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        deviceId: navigator.userAgent.includes('Mobile') ? 'mobile_browser' : 'desktop_browser',
      });

      setActionSuccess(res);
      await fetchAttendanceStatus();
    } catch (err: unknown) {
      console.error('Lỗi điểm danh GPS:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Không thể thực hiện điểm danh GPS vào lúc này';
      setActionError(errMsg);
    } finally {
      setSubmittingGps(false);
    }
  };

  const isLateShift = todayData?.isLate;
  const isCheckedIn = todayData?.hasCheckIn;
  const isCheckedOut = todayData?.hasCheckOut;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Top Banner Header */}
      <div className="app-surface p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">
            Chấm công
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Điểm danh bằng GPS hoặc mã QR tại vị trí làm việc.
          </p>
        </div>

        {/* Đồng hồ số thời gian thực */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-muted)] text-right">
          <Clock className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
          <div>
            <div className="text-sm font-semibold text-[var(--text)] font-mono">
              {currentTime.toLocaleTimeString('vi-VN')}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Method Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
        <button
          type="button"
          onClick={() => setActiveTab('GPS')}
          className={`flex-1 py-2 px-3 rounded-[var(--radius)] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'GPS'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          <span>GPS Geofencing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR_PASS')}
          className={`flex-1 py-2 px-3 rounded-[var(--radius)] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'QR_PASS'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <QrCode className="w-4 h-4" strokeWidth={1.5} />
          <span>Mã QR cá nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR_SCANNER')}
          className={`flex-1 py-2 px-3 rounded-[var(--radius)] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'QR_SCANNER'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <ScanLine className="w-4 h-4" strokeWidth={1.5} />
          <span>Trạm quét QR</span>
        </button>
      </div>

      {/* Main Interactive Check-In Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Interactive Check-In Methods (7 cols) */}
        <div className="md:col-span-7 space-y-5">
          {activeTab === 'QR_PASS' && (
            <DynamicQrPassCard onQrRefreshed={setLatestQrCode} />
          )}

          {activeTab === 'QR_SCANNER' && (
            <QrScannerCard
              currentQrCode={latestQrCode}
              onAttendanceSuccess={() => {
                fetchAttendanceStatus();
              }}
            />
          )}

          {activeTab === 'GPS' && (
            <>
              {/* Geofence Radar Card */}
              <div className="app-surface p-5 relative overflow-hidden">
                {/* Visual Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                    Trạng thái định vị
                  </span>
                  <button
                    type="button"
                    onClick={acquireDeviceGps}
                    disabled={gpsLoading}
                    className="px-2.5 py-1 text-xs text-[var(--text)] bg-[var(--surface)] hover:bg-stone-50 border border-[var(--border)] rounded-[var(--radius)] transition flex items-center gap-1"
                    title="Lấy lại tọa độ GPS hiện tại"
                  >
                    <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
                    <span>Làm mới GPS</span>
                  </button>
                </div>

            {/* Radar Animation & Distance Badge */}
            <div className="py-4 flex flex-col items-center justify-center relative">
              <div className="relative flex items-center justify-center w-32 h-32">
                <div
                  className={`absolute inset-0 rounded-full border border-dashed transition-colors ${
                    isWithinGeofence
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : coords
                      ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                      : 'border-[var(--border)] bg-stone-50 dark:bg-stone-900/20'
                  }`}
                />
                <div
                  className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isWithinGeofence
                      ? 'bg-[var(--accent)] text-white'
                      : coords
                      ? 'bg-red-600 text-white'
                      : 'bg-stone-200 text-[var(--text-muted)]'
                  }`}
                >
                  <MapPin className="w-7 h-7" strokeWidth={1.5} />
                </div>
              </div>

              {/* Status Pill */}
              <div className="mt-4 text-center">
                {gpsLoading ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                    <span>Đang xác định vị trí GPS...</span>
                  </div>
                ) : isWithinGeofence && closestLocation ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius)] bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)] font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Hợp lệ — trong vùng chấm công
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      Cách {closestLocation.name}:{' '}
                      <span className="font-mono text-[var(--success-text)] font-semibold">{formatDistance(minDistanceMeters)}</span> (Bán kính:{' '}
                      {formatDistance(closestLocation.radiusMeters || 100)})
                    </p>
                  </div>
                ) : coords && closestLocation ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius)] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] font-medium text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Ngoài vùng chấm công
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      Cách văn phòng {formatDistance(minDistanceMeters)} (yêu cầu ≤{' '}
                      {formatDistance(closestLocation.radiusMeters || 100)})
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Chưa có tín hiệu GPS</span>
                )}
              </div>
            </div>

            {/* GPS Metrics Bar */}
            <div className="mt-2 p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-xs grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Vĩ độ (Lat)</span>
                <p className="font-mono text-[var(--text)] font-medium mt-0.5 truncate">
                  {coords ? coords.lat.toFixed(5) : '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Kinh độ (Lng)</span>
                <p className="font-mono text-[var(--text)] font-medium mt-0.5 truncate">
                  {coords ? coords.lng.toFixed(5) : '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Sai số</span>
                <p
                  className={`font-mono font-medium mt-0.5 ${
                    coords && coords.accuracy < 50
                      ? 'text-[var(--success-text)]'
                      : coords
                      ? 'text-[var(--danger-text)]'
                      : 'text-[var(--text)]'
                  }`}
                >
                  {coords ? `±${coords.accuracy.toFixed(1)}m` : '—'}
                </p>
              </div>
            </div>

            {/* Error or Success Alert */}
            {gpsError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{gpsError}</div>
              </div>
            )}

            {actionError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{actionError}</div>
              </div>
            )}

            {actionSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{actionSuccess.message}</span>
                </div>
                <div className="text-[11px] text-emerald-300/80">
                  Thời gian ghi nhận: <span className="font-mono font-bold text-white">{actionSuccess.data.formattedTime}</span> • Địa điểm: {actionSuccess.data.matchedLocation.name}
                </div>
              </div>
            )}

            {/* CTA Check-In Button */}
            <div className="mt-5 pt-4 border-t border-[var(--border)] flex flex-col items-center">
              <button
                type="button"
                disabled={submittingGps || !coords || !isWithinGeofence}
                onClick={handleGpsCheckIn}
                className={`w-full py-3 px-4 rounded-[var(--radius)] font-medium text-sm flex items-center justify-center gap-2 transition ${
                  isWithinGeofence && coords && !submittingGps
                    ? 'app-button'
                    : 'bg-stone-100 text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
                }`}
              >
                {submittingGps ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang ghi nhận công...</span>
                  </>
                ) : !coords ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                    <span>Đang đợi tín hiệu vị trí GPS...</span>
                  </>
                ) : !isWithinGeofence ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-[var(--danger-text)]" />
                    <span>Chưa ở trong vùng chấm công</span>
                  </>
                ) : isCheckedIn && !isCheckedOut ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Xác nhận hết ca (Check-out)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác nhận vào ca (Check-in)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-[var(--text-muted)] mt-2 text-center">
                Tọa độ được đối chiếu với danh sách văn phòng đã đăng ký.
              </p>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Right Column: Today Status & Office Locations (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          {/* Today Attendance Card */}
          <div className="app-surface p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                Trạng thái hôm nay
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {todayData ? new Date().toLocaleDateString('vi-VN') : ''}
              </span>
            </div>

            {loadingData ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-[var(--text-muted)] gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <span>Đang tải thông tin...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Giờ vào */}
                <div className="p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--text-muted)]">Giờ vào (Check-in)</span>
                    <p className="mt-0.5">
                      {todayData?.checkInTime ? (
                        <span className="text-sm font-semibold font-mono text-[var(--text)]">
                          {new Date(todayData.checkInTime).toLocaleTimeString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)] italic">
                          Chưa ghi nhận
                        </span>
                      )}
                    </p>
                  </div>
                  {todayData?.hasCheckIn && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        isLateShift
                          ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                          : 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      }`}
                    >
                      {isLateShift ? 'Đi muộn' : 'Đúng giờ'}
                    </span>
                  )}
                </div>

                {/* Giờ ra */}
                <div className="p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--text-muted)]">Giờ ra (Check-out)</span>
                    <p className="mt-0.5">
                      {todayData?.checkOutTime ? (
                        <span className="text-sm font-semibold font-mono text-[var(--text)]">
                          {new Date(todayData.checkOutTime).toLocaleTimeString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)] italic">
                          Chưa ghi nhận
                        </span>
                      )}
                    </p>
                  </div>
                  {todayData?.hasCheckOut && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]">
                      Đã hoàn thành
                    </span>
                  )}
                </div>

                {/* Tổng thời lượng làm việc */}
                {todayData?.workDurationMinutes ? (
                  <div className="p-2.5 rounded-[var(--radius)] bg-[var(--accent-soft)] text-xs flex items-center justify-between">
                    <span className="text-[var(--accent)] font-medium">Thời gian làm việc:</span>
                    <span className="font-mono font-semibold text-[var(--accent)]">
                      {Math.floor(todayData.workDurationMinutes / 60)}h {todayData.workDurationMinutes % 60}p
                    </span>
                  </div>
                ) : null}

                {/* Phương thức & Ghi chú */}
                {todayData?.method && (
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                    <span>Phương thức:</span>
                    <span className="font-medium text-[var(--text)] flex items-center gap-1">
                      {todayData.method === 'GPS' ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> GPS
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-3.5 h-3.5 text-[var(--accent)]" /> Kiosk khuôn mặt
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danh Sách Địa Điểm Hợp Lệ Của Doanh Nghiệp */}
          <div className="app-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                Địa điểm văn phòng ({locations.length})
              </span>
              <Link
                to="/locations"
                className="text-xs text-[var(--accent)] hover:underline font-medium flex items-center gap-0.5"
              >
                Cấu hình <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {loadingLocations ? (
                <div className="text-xs text-[var(--text-muted)] text-center py-4">Đang tải địa điểm...</div>
              ) : locations.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)] text-center py-4">
                  Chưa có địa điểm nào được cấu hình.
                </div>
              ) : (
                locations.map((loc) => {
                  let dist: number | null = null;
                  let inRange = false;
                  if (coords) {
                    dist = calculateHaversineDistanceMeters(
                      coords.lat,
                      coords.lng,
                      loc.latitude,
                      loc.longitude
                    );
                    inRange = dist <= (loc.radiusMeters || 100);
                  }

                  return (
                    <div
                      key={loc.locationId}
                      className={`p-2.5 rounded-[var(--radius)] border text-xs transition ${
                        inRange
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                          : 'border-[var(--border)] bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[var(--text)] font-medium truncate">
                          {loc.name}
                        </strong>
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded ${
                            inRange
                              ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                              : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                          }`}
                        >
                          {formatDistance(loc.radiusMeters || 100)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="font-mono">
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </span>
                        {dist !== null && (
                          <span
                            className={`font-medium ${
                              inRange ? 'text-[var(--success-text)]' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            Cách: {formatDistance(dist)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Lịch Sử Chấm Công */}
      <div className="app-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            Nhật ký điểm danh gần đây
          </span>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {user?.fullName} ({user?.employeeCode})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs font-medium">
              <tr>
                <th className="py-2.5 px-3 font-medium">Ngày</th>
                <th className="py-2.5 px-3 font-medium">Giờ vào</th>
                <th className="py-2.5 px-3 font-medium">Giờ ra</th>
                <th className="py-2.5 px-3 font-medium">Thời lượng</th>
                <th className="py-2.5 px-3 font-medium">Phương thức</th>
                <th className="py-2.5 px-3 font-medium">Trạng thái</th>
                <th className="py-2.5 px-3 font-medium text-right">Khoảng cách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    Chưa có nhật ký chấm công nào.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3 px-3 font-mono font-medium text-[var(--text)]">
                      {item.date}
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--text-muted)]">
                      {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--text-muted)]">
                      {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--text-muted)]">
                      {item.workDurationMinutes
                        ? `${Math.floor(item.workDurationMinutes / 60)}h ${item.workDurationMinutes % 60}p`
                        : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--text)]">
                        {item.method === 'GPS' ? (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> GPS
                          </>
                        ) : item.method === 'FACE' ? (
                          <>
                            <ScanFace className="w-3.5 h-3.5 text-[var(--accent)]" /> Kiosk
                          </>
                        ) : (
                          item.method
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.isLate
                            ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                            : 'bg-[var(--success-bg)] text-[var(--success-text)]'
                        }`}
                      >
                        {item.isLate ? 'Đi muộn' : 'Hợp lệ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                      {item.location?.distanceMeters !== undefined && item.location?.distanceMeters !== null
                        ? formatDistance(item.location.distanceMeters)
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
