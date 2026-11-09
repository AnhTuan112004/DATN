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
  QrCode,
  ScanLine,
  ArrowUpRight,
  Sparkles,
  Activity,
  History,
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
  const { user, hasRole } = useAuth();
  const canChangeLocation = hasRole(['CEO', 'HR_MANAGER']);

  // Active attendance tab
  const [activeTab, setActiveTab] = useState<'GPS' | 'QR_PASS' | 'QR_SCANNER'>('GPS');
  const [latestQrCode, setLatestQrCode] = useState<string>('');

  // Current GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Locations of company & Active Location
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [switchingLocationId, setSwitchingLocationId] = useState<string | null>(null);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

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
        attendanceApi.getMyAttendanceHistory(15),
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

  // 3.5. Xử lý đổi địa điểm hiện tại (Dành cho HR / CEO)
  const handleSetActiveLocation = async (locationId: string) => {
    if (!canChangeLocation) return;
    setSwitchingLocationId(locationId);
    setLocationSuccessMsg(null);
    setLocationErrorMsg(null);
    try {
      await companiesApi.setActiveLocation(locationId);
      await fetchLocations();
      const target = locations.find((l) => l.locationId === locationId);
      setLocationSuccessMsg(`Đã chọn "${target?.name || locationId}" làm địa điểm hiện tại (Đã liên kết Kiosk & Chấm công GPS)!`);
      setTimeout(() => setLocationSuccessMsg(null), 5000);
    } catch (err: any) {
      setLocationErrorMsg(err.response?.data?.message || 'Không thể cập nhật địa điểm hiện tại');
      setTimeout(() => setLocationErrorMsg(null), 5000);
    } finally {
      setSwitchingLocationId(null);
    }
  };

  // 4. Tính toán khoảng cách đến địa điểm văn phòng hiện tại (hoặc gần nhất)
  const activeLocation = locations.find((l) => l.isPrimary) || locations[0] || null;

  let closestLocation: LocationItem | null = activeLocation;
  let minDistanceMeters = Infinity;
  let isWithinGeofence = false;

  if (coords && locations.length > 0) {
    if (activeLocation) {
      closestLocation = activeLocation;
      minDistanceMeters = calculateHaversineDistanceMeters(
        coords.lat,
        coords.lng,
        activeLocation.latitude,
        activeLocation.longitude
      );
      const allowedRadius = activeLocation.radiusMeters || 100;
      isWithinGeofence = minDistanceMeters <= allowedRadius;
    } else {
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
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-white">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 pb-1 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Cổng Chấm Công Đa Kênh
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">GPS Geofencing • FaceID Kiosk • Dynamic QR</span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-white leading-tight">
            Điểm Danh & Ghi Nhận Công
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Xin chào, <strong className="text-white">{user?.fullName}</strong> ({user?.employeeCode}). Ca hành chính: <span className="font-mono text-slate-200">08:00 — 17:30</span>.
          </p>
        </div>

        {/* Đồng hồ số thời gian thực & Phím tắt FaceID Kiosk */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="text-base font-bold font-mono text-white leading-none">
                {currentTime.toLocaleTimeString('vi-VN')}
              </div>
              <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                {currentTime.toLocaleDateString('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          <Link
            to="/kiosk"
            className="px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <ScanFace className="w-4 h-4 text-teal-200" />
            <span>Mở Kiosk FaceID</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-200" />
          </Link>
        </div>
      </div>

      {/* 2. Method Selector Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('GPS')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'GPS'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>GPS Geofencing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR_PASS')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'QR_PASS'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Mã QR Cá Nhân (Dynamic Pass)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR_SCANNER')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'QR_SCANNER'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Trạm Quét QR Văn Phòng</span>
        </button>
      </div>

      {/* 3. Main Interactive Check-In Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Check-In Methods (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
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
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-sm relative overflow-hidden text-white space-y-6">
              {/* Header inside Radar Card */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>Trạng Thái Định Vị Vệ Tinh (GPS)</span>
                </div>
                <button
                  type="button"
                  onClick={acquireDeviceGps}
                  disabled={gpsLoading}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Lấy lại tọa độ GPS hiện tại"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{gpsLoading ? 'Đang định vị...' : 'Làm mới vị trí'}</span>
                </button>
              </div>

              {/* Radar Animation & Distance Badge */}
              <div className="py-6 flex flex-col items-center justify-center relative">
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* Outer Pulsing Geofence Ring */}
                  <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-700 ${
                      isWithinGeofence
                        ? 'border-emerald-500/40 bg-emerald-500/10 animate-ping'
                        : coords
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-slate-800 bg-slate-950/40'
                    }`}
                  />
                  {/* Intermediate Concentric Ring */}
                  <div
                    className={`absolute inset-4 rounded-full border border-dashed transition-all ${
                      isWithinGeofence
                        ? 'border-emerald-400/60 bg-emerald-500/10'
                        : coords
                        ? 'border-rose-400/40 bg-rose-500/10'
                        : 'border-slate-700'
                    }`}
                  />
                  {/* Central Radar Target */}
                  <div
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isWithinGeofence
                        ? 'bg-teal-700 text-white shadow-teal-700/50 scale-105'
                        : coords
                        ? 'bg-rose-600 text-white shadow-rose-600/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <MapPin className="w-8 h-8" />
                  </div>
                </div>

                {/* Status Pill */}
                <div className="mt-5 text-center space-y-1">
                  {gpsLoading ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Đang kết nối tín hiệu vệ tinh GPS độ chính xác cao...</span>
                    </div>
                  ) : isWithinGeofence && closestLocation ? (
                    <div className="space-y-1.5 animate-fade-in">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-md">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        HỢP LỆ — TRONG VÙNG CHẤM CÔNG VĂN PHÒNG
                      </span>
                      <p className="text-xs text-slate-300">
                        Vị trí hiện tại cách <strong>{closestLocation.name}</strong>:{' '}
                        <span className="font-mono text-emerald-400 font-bold">{formatDistance(minDistanceMeters)}</span>{' '}
                        (Bán kính cho phép: {formatDistance(closestLocation.radiusMeters || 100)})
                      </p>
                    </div>
                  ) : coords && closestLocation ? (
                    <div className="space-y-1.5 animate-fade-in">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs shadow-md">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        NGOÀI VÙNG CHẤM CÔNG VĂN PHÒNG
                      </span>
                      <p className="text-xs text-slate-300">
                        Cách văn phòng <strong className="text-rose-400">{formatDistance(minDistanceMeters)}</strong> (yêu cầu ≤{' '}
                        {formatDistance(closestLocation.radiusMeters || 100)})
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Chưa bắt được tín hiệu GPS thiết bị</span>
                  )}
                </div>
              </div>

              {/* GPS Metrics Bar */}
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 text-xs grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Vĩ độ (Latitude)</span>
                  <p className="font-mono text-white font-semibold mt-0.5 truncate">
                    {coords ? coords.lat.toFixed(5) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Kinh độ (Longitude)</span>
                  <p className="font-mono text-white font-semibold mt-0.5 truncate">
                    {coords ? coords.lng.toFixed(5) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Độ sai số vệ tinh</span>
                  <p
                    className={`font-mono font-bold mt-0.5 ${
                      coords && coords.accuracy < 50
                        ? 'text-emerald-400'
                        : coords
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {coords ? `±${coords.accuracy.toFixed(1)}m` : '—'}
                  </p>
                </div>
              </div>

              {/* Error or Success Alert */}
              {gpsError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{gpsError}</div>
                </div>
              )}

              {actionError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{actionError}</div>
                </div>
              )}

              {actionSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 space-y-1.5 animate-fade-in shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center gap-2 font-bold text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">{actionSuccess.message}</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/80">
                    Thời gian ghi nhận: <span className="font-mono font-bold text-white">{actionSuccess.data.formattedTime}</span> • Địa điểm: {actionSuccess.data.matchedLocation.name}
                  </div>
                </div>
              )}

              {/* CTA Check-In Button */}
              <div className="pt-2 flex flex-col items-center">
                <button
                  type="button"
                  disabled={submittingGps || !coords || !isWithinGeofence}
                  onClick={handleGpsCheckIn}
                  className={`w-full py-3.5 px-5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer ${
                    isWithinGeofence && coords && !submittingGps
                      ? isCheckedIn && !isCheckedOut
                        ? 'bg-sky-700 hover:bg-sky-600 text-white active:scale-[0.99]'
                        : 'bg-teal-700 hover:bg-teal-800 text-white active:scale-[0.99]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60 cursor-not-allowed'
                  }`}
                >
                  {submittingGps ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang gửi tọa độ xác thực vào hệ thống...</span>
                    </>
                  ) : !coords ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                      <span>Đang tìm kiếm vệ tinh GPS...</span>
                    </>
                  ) : !isWithinGeofence ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span>Chưa ở trong vùng bán kính văn phòng</span>
                    </>
                  ) : isCheckedIn && !isCheckedOut ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>XÁC NHẬN TAN CA (CHECK-OUT)</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>XÁC NHẬN VÀO CA (CHECK-IN)</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 mt-2.5 text-center flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Tọa độ được đối chiếu tức thì với bản đồ số doanh nghiệp và lưu vết chống gian lận.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Today Status & Office Locations (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Today Attendance Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Trạng thái hôm nay
              </span>
              <span className="text-xs font-mono text-slate-400">
                {currentTime.toLocaleDateString('vi-VN')}
              </span>
            </div>

            {loadingData ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Đang tải thông tin điểm danh...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Giờ vào */}
                <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Giờ vào (Check-in)</span>
                    <p className="mt-0.5">
                      {todayData?.checkInTime ? (
                        <span className="text-base font-bold font-mono text-white">
                          {new Date(todayData.checkInTime).toLocaleTimeString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Chưa ghi nhận vào ca
                        </span>
                      )}
                    </p>
                  </div>
                  {todayData?.hasCheckIn && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isLateShift
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isLateShift ? 'Đi muộn' : 'Đúng giờ ✓'}
                    </span>
                  )}
                </div>

                {/* Giờ ra */}
                <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Giờ ra (Check-out)</span>
                    <p className="mt-0.5">
                      {todayData?.checkOutTime ? (
                        <span className="text-base font-bold font-mono text-white">
                          {new Date(todayData.checkOutTime).toLocaleTimeString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Chưa ghi nhận tan ca
                        </span>
                      )}
                    </p>
                  </div>
                  {todayData?.hasCheckOut && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      Đã hoàn thành ca
                    </span>
                  )}
                </div>

                {/* Tổng thời lượng làm việc */}
                {todayData?.workDurationMinutes ? (
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs flex items-center justify-between">
                    <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      Thời gian làm việc hôm nay:
                    </span>
                    <span className="font-mono font-bold text-white text-sm">
                      {Math.floor(todayData.workDurationMinutes / 60)}h {todayData.workDurationMinutes % 60}p
                    </span>
                  </div>
                ) : null}

                {/* Phương thức */}
                {todayData?.method && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span>Phương thức ghi nhận:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      {todayData.method === 'GPS' ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" /> GPS Geofencing
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-3.5 h-3.5 text-emerald-400" /> Kiosk FaceID
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danh Sách Địa Điểm Hợp Lệ Của Doanh Nghiệp */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Văn phòng chấm công ({locations.length})
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Địa điểm hiện tại đang liên kết trực tiếp với máy Kiosk FaceID &amp; GPS
                </p>
              </div>
              <Link
                to="/locations"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Cấu hình <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Selector đổi địa điểm hiện tại dành riêng cho HR Manager & CEO */}
            {canChangeLocation && (
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Chọn địa điểm hiện tại (HR / CEO)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Đồng bộ Kiosk &amp; GPS
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <select
                    value={activeLocation?.locationId || ''}
                    onChange={(e) => handleSetActiveLocation(e.target.value)}
                    disabled={switchingLocationId !== null}
                    className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {locations.map((loc) => (
                      <option key={loc.locationId} value={loc.locationId}>
                        {loc.name} {loc.isPrimary ? '★ (Đang kích hoạt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {locationSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>{locationSuccessMsg}</span>
                  </div>
                )}
                {locationErrorMsg && (
                  <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{locationErrorMsg}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {loadingLocations ? (
                <div className="text-xs text-slate-400 text-center py-4">Đang tải danh sách địa điểm...</div>
              ) : locations.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">
                  Chưa có địa điểm nào được cấu hình trong hệ thống.
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

                  const isCurrentActive = Boolean(loc.isPrimary);

                  return (
                    <div
                      key={loc.locationId}
                      className={`p-3 rounded-2xl border text-xs transition ${
                        isCurrentActive
                          ? 'border-indigo-500/80 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/40'
                          : inRange
                          ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <strong className="text-white font-bold truncate">
                            {loc.name}
                          </strong>
                          {isCurrentActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                              ★ Hiện tại (Kiosk &amp; GPS)
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            inRange
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Bán kính {formatDistance(loc.radiusMeters || 100)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-[10px]">
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </span>
                        <div className="flex items-center gap-2">
                          {dist !== null && (
                            <span
                              className={`font-semibold ${
                                inRange ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              Cách: {formatDistance(dist)}
                            </span>
                          )}
                          {!isCurrentActive && canChangeLocation && (
                            <button
                              onClick={() => handleSetActiveLocation(loc.locationId)}
                              disabled={switchingLocationId !== null}
                              className="px-2 py-0.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-semibold transition cursor-pointer"
                            >
                              {switchingLocationId === loc.locationId ? 'Đang đặt...' : 'Chọn làm điểm hiện tại'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Lịch Sử Chấm Công Hiện Đại */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Nhật Ký Điểm Danh Gần Đây</h3>
              <p className="text-[11px] text-slate-400">
                15 lượt ghi nhận công gần nhất của {user?.fullName} ({user?.employeeCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              Tổng số: {history.length} bản ghi
            </span>
          </div>
        </div>

        {/* Mobile View: Stacked Cards (Visible on sm:hidden) */}
        <div className="space-y-3 sm:hidden">
          {history.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có nhật ký chấm công nào được lưu trong hệ thống.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item._id}
                className={`p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 border-l-2 ${
                  item.isLate ? 'border-l-amber-500' : 'border-l-teal-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{item.date}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      item.isLate
                        ? 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                        : 'bg-teal-950/50 text-teal-300 border border-teal-800/50'
                    }`}
                  >
                    {item.isLate ? 'Đi muộn' : 'Hợp lệ ✓'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/50 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Giờ vào / ra:</span>
                    <span className="text-slate-200">
                      {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                    </span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="text-slate-200">
                      {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Thời lượng:</span>
                    <span className="text-teal-300">
                      {item.workDurationMinutes
                        ? `${Math.floor(item.workDurationMinutes / 60)}h ${item.workDurationMinutes % 60}p`
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/50">
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    {item.method === 'GPS' ? (
                      <>
                        <MapPin className="w-3 h-3 text-indigo-400" /> GPS
                      </>
                    ) : item.method === 'FACE' ? (
                      <>
                        <ScanFace className="w-3 h-3 text-teal-400" /> FaceID Kiosk
                      </>
                    ) : item.method === 'QR' ? (
                      <>
                        <QrCode className="w-3 h-3 text-sky-400" /> Mã QR
                      </>
                    ) : (
                      item.method
                    )}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {item.location?.distanceMeters !== undefined && item.location?.distanceMeters !== null
                      ? formatDistance(item.location.distanceMeters)
                      : '—'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (Hidden on sm:hidden) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-3">Giờ vào</th>
                <th className="py-3 px-3">Giờ ra</th>
                <th className="py-3 px-3">Thời lượng</th>
                <th className="py-3 px-3">Phương thức</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-right">Khoảng cách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Chưa có nhật ký chấm công nào được lưu trong hệ thống.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300 font-medium">
                      {item.workDurationMinutes
                        ? `${Math.floor(item.workDurationMinutes / 60)}h ${item.workDurationMinutes % 60}p`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                        {item.method === 'GPS' ? (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" /> GPS
                          </>
                        ) : item.method === 'FACE' ? (
                          <>
                            <ScanFace className="w-3.5 h-3.5 text-emerald-400" /> FaceID Kiosk
                          </>
                        ) : item.method === 'QR' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-sky-400" /> Mã QR
                          </>
                        ) : (
                          item.method
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isLate
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {item.isLate ? 'Đi muộn' : 'Hợp lệ ✓'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
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
