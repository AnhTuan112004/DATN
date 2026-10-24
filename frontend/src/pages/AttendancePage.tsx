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
  Sparkles,
  ScanFace,
  Loader2,
  AlertCircle,
  Building2,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Chấm Công Di Động GPS Geofencing
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                Haversine ≤ 100m
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động đối chiếu tọa độ thiết bị với bán kính địa điểm văn phòng cho phép của công ty.
            </p>
          </div>
        </div>

        {/* Đồng hồ số thời gian thực */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
          <Clock className="w-4 h-4 text-indigo-400" />
          <div className="text-right font-mono">
            <div className="text-sm font-bold text-slate-100">
              {currentTime.toLocaleTimeString('vi-VN')}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Method Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('GPS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'GPS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>GPS Geofencing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR_PASS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'QR_PASS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Mã QR Cá Nhân (30s)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR_SCANNER')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'QR_SCANNER'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Trạm Quét QR (Simulator)</span>
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
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                {/* Visual Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-indigo-400" />
                    Trạng Thái Định Vị & Vùng Geofence
                  </span>
                  <button
                    type="button"
                    onClick={acquireDeviceGps}
                    disabled={gpsLoading}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1"
                    title="Lấy lại tọa độ GPS hiện tại"
                  >
                    <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin text-indigo-400' : ''}`} />
                    <span>Làm mới GPS</span>
                  </button>
                </div>

            {/* Radar Animation & Distance Badge */}
            <div className="py-6 flex flex-col items-center justify-center relative">
              {/* Radar Rings Effect */}
              <div className="relative flex items-center justify-center w-40 h-40">
                <div
                  className={`absolute inset-0 rounded-full border border-dashed transition-colors duration-500 animate-ping opacity-25 ${
                    isWithinGeofence
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : coords
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-600 bg-slate-800/10'
                  }`}
                />
                <div
                  className={`absolute inset-4 rounded-full border transition-colors duration-500 ${
                    isWithinGeofence
                      ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                      : coords
                      ? 'border-rose-500/40 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                />
                <div
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isWithinGeofence
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/40 scale-105'
                      : coords
                      ? 'bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <MapPin className="w-8 h-8" />
                </div>
              </div>

              {/* Status Pill */}
              <div className="mt-4 text-center">
                {gpsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Đang đo đạc vị trí từ vệ tinh GPS...</span>
                  </div>
                ) : isWithinGeofence && closestLocation ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HỢP LỆ — TRONG VÙNG CHẤM CÔNG
                    </span>
                    <p className="text-xs text-slate-300">
                      Cách <strong>{closestLocation.name}</strong>:{' '}
                      <span className="font-mono text-emerald-400 font-bold">{minDistanceMeters}m</span> (Bán kính:{' '}
                      {closestLocation.radiusMeters || 100}m)
                    </p>
                  </div>
                ) : coords && closestLocation ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      NGOÀI VÙNG CHẤM CÔNG
                    </span>
                    <p className="text-xs text-slate-300">
                      Cách <strong>{closestLocation.name}</strong>:{' '}
                      <span className="font-mono text-rose-400 font-bold">{minDistanceMeters}m</span> (Yêu cầu ≤{' '}
                      {closestLocation.radiusMeters || 100}m)
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Chưa có tín hiệu GPS</span>
                )}
              </div>
            </div>

            {/* GPS Metrics Bar */}
            <div className="mt-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Vĩ độ (Lat)</span>
                <p className="font-mono text-slate-200 font-medium mt-0.5 truncate">
                  {coords ? coords.lat.toFixed(5) : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Kinh độ (Lng)</span>
                <p className="font-mono text-slate-200 font-medium mt-0.5 truncate">
                  {coords ? coords.lng.toFixed(5) : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Sai số (Accuracy)</span>
                <p
                  className={`font-mono font-medium mt-0.5 ${
                    coords && coords.accuracy < 50
                      ? 'text-emerald-400'
                      : coords
                      ? 'text-rose-400'
                      : 'text-slate-200'
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

            {/* Giant CTA Check-In Button */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col items-center">
              <button
                type="button"
                disabled={submittingGps || !coords || !isWithinGeofence}
                onClick={handleGpsCheckIn}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] ${
                  isWithinGeofence && coords && !submittingGps
                    ? isCheckedIn && !isCheckedOut
                      ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 text-white shadow-emerald-500/30 hover:brightness-110'
                      : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-indigo-500/30 hover:brightness-110'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
                }`}
              >
                {submittingGps ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xác thực Geofence và ghi nhận công...</span>
                  </>
                ) : !coords ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Đang đợi tín hiệu vị trí GPS...</span>
                  </>
                ) : !isWithinGeofence ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Di chuyển vào bán kính Geofence để điểm danh</span>
                  </>
                ) : isCheckedIn && !isCheckedOut ? (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Xác Nhận Điểm Danh HẾT CA (Check-Out)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Xác Nhận Điểm Danh VÀO CA (Check-In)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 mt-2.5 text-center">
                Thiết bị sẽ truyền tọa độ và bán kính sai số thực tế qua kết nối TLS bảo mật.
              </p>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Right Column: Today Status & Office Locations (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          {/* Today Attendance Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Trạng Thái Hôm Nay
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {todayData ? new Date().toLocaleDateString('vi-VN') : ''}
              </span>
            </div>

            {loadingData ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Đang tải nhật ký điểm danh...</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Giờ vào */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Giờ Vào Ca (Check-In)</span>
                    <p className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                      {todayData?.checkInTime
                        ? new Date(todayData.checkInTime).toLocaleTimeString('vi-VN')
                        : 'Chưa ghi nhận'}
                    </p>
                  </div>
                  {todayData?.hasCheckIn && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isLateShift
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isLateShift ? 'Đi muộn' : 'Đúng giờ'}
                    </span>
                  )}
                </div>

                {/* Giờ ra */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Giờ Hết Ca (Check-Out)</span>
                    <p className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                      {todayData?.checkOutTime
                        ? new Date(todayData.checkOutTime).toLocaleTimeString('vi-VN')
                        : 'Chưa ghi nhận'}
                    </p>
                  </div>
                  {todayData?.hasCheckOut && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Đã hoàn thành
                    </span>
                  )}
                </div>

                {/* Tổng thời lượng làm việc */}
                {todayData?.workDurationMinutes ? (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-medium">Tổng thời gian làm việc:</span>
                    <span className="font-mono font-bold text-indigo-200">
                      {Math.floor(todayData.workDurationMinutes / 60)}h {todayData.workDurationMinutes % 60}p
                    </span>
                  </div>
                ) : null}

                {/* Phương thức & Ghi chú */}
                {todayData?.method && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Phương thức xác thực:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      {todayData.method === 'GPS' ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" /> GPS Geofencing
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-3.5 h-3.5 text-emerald-400" /> FaceID Kiosk
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danh Sách Địa Điểm Hợp Lệ Của Doanh Nghiệp */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Địa Điểm Văn Phòng ({locations.length})
              </span>
              <Link
                to="/locations"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
              >
                Cấu hình <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {loadingLocations ? (
                <div className="text-xs text-slate-500 text-center py-4">Đang tải địa điểm...</div>
              ) : locations.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
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
                      className={`p-3 rounded-xl border text-xs transition ${
                        inRange
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-slate-800 bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-200 font-semibold truncate">
                          {loc.name}
                        </strong>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            inRange
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Bán kính: {loc.radiusMeters || 100}m
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-slate-500">
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </span>
                        {dist !== null && (
                          <span
                            className={`font-semibold font-mono ${
                              inRange ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            Cách: {dist}m
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

      {/* Bottom Section: Lịch Sử Chấm Công 7 Ngày */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Nhật Ký Điểm Danh Gần Đây Của Bạn
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Nhân sự: {user?.fullName} ({user?.employeeCode})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Ngày</th>
                <th className="py-2.5 px-4 font-semibold">Giờ Vào</th>
                <th className="py-2.5 px-4 font-semibold">Giờ Ra</th>
                <th className="py-2.5 px-4 font-semibold">Thời Lượng</th>
                <th className="py-2.5 px-4 font-semibold">Phương Thức</th>
                <th className="py-2.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-2.5 px-4 font-semibold text-right">Khoảng Cách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Chưa có nhật ký chấm công nào.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {item.workDurationMinutes
                        ? `${Math.floor(item.workDurationMinutes / 60)}h ${item.workDurationMinutes % 60}p`
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        {item.method === 'GPS' ? (
                          <>
                            <MapPin className="w-3 h-3 text-indigo-400" /> GPS
                          </>
                        ) : item.method === 'FACE' ? (
                          <>
                            <ScanFace className="w-3 h-3 text-emerald-400" /> FaceID
                          </>
                        ) : (
                          item.method
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isLate
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.isLate ? 'Đi muộn' : 'Hợp lệ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {item.location?.distanceMeters !== undefined && item.location?.distanceMeters !== null
                        ? `${item.location.distanceMeters}m`
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
