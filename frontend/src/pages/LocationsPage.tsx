import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Compass,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companiesApi, LocationItem } from '../api/companies';
import { LocationModal } from '../components/locations/LocationModal';

// Haversine formula calculating distance in meters between 2 GPS coordinates
const calculateHaversineDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
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

export const LocationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isCeoOrHr = hasRole(['CEO', 'HR_MANAGER']);

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [locToEdit, setLocToEdit] = useState<LocationItem | null>(null);

  // Device GPS Live Test
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(
    null
  );
  const [testingGps, setTestingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companiesApi.getLocations();
      setLocations(res.data);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Không thể tải danh sách địa điểm GPS.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Test current device location
  const handleTestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation API.');
      return;
    }

    setTestingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setTestingGps(false);
      },
      (err) => {
        setTestingGps(false);
        setGpsError(`Không thể lấy GPS: ${err.message}. Hãy cấp quyền vị trí.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Seed defense location
  const handleSeedDefenseRoom = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await companiesApi.seedDefenseLocation();
      setSuccessMsg(res.message || 'Đã nạp địa điểm «Phòng Bảo vệ ĐATN - Hội đồng K23» thành công.');
      fetchLocations();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Lỗi khi nạp địa điểm bảo vệ đồ án.';
      setError(errMsg);
    }
  };

  // Delete location
  const handleDelete = async (loc: LocationItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa địa điểm "${loc.name}" (${loc.locationId})?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await companiesApi.deleteLocation(loc.locationId);
      setSuccessMsg(res.message || 'Đã xóa địa điểm thành công.');
      fetchLocations();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Lỗi khi xóa địa điểm.';
      setError(errMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Cấu Hình Doanh Nghiệp</span>
            <span>&bull;</span>
            <span className="text-indigo-400 font-medium">GPS Geofencing</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center space-x-3">
            <span>Địa Điểm Chấm Công GPS</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {locations.length} địa điểm
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cấu hình bán kính Geofence (Haversine), độ chính xác GPS &lt; 50m. Phục vụ xác thực chấm công di động
            trong Tuần 2.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => fetchLocations()}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isCeoOrHr && (
            <>
              <button
                onClick={handleSeedDefenseRoom}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
                title="Nạp nhanh tọa độ phòng bảo vệ ĐATN"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Nạp «Phòng Bảo Vệ ĐATN»</span>
              </button>

              <button
                onClick={() => {
                  setLocToEdit(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Địa Điểm GPS</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Real-time GPS Tester & Geofence Simulator */}
      <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/20 border border-indigo-500/30 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>Công Cụ Thử Nghiệm Định Vị GPS Thiết Bị (Live Simulator)</span>
                <span className="px-2 py-0.2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Haversine WGS-84
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lấy tọa độ thực tế của máy và tính toán khoảng cách tức thời tới các địa điểm geofencing đã cấu hình.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestDeviceLocation}
            disabled={testingGps}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md self-start sm:self-auto shrink-0"
          >
            {testingGps ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>Kiểm Tra Vị Trí Của Tôi</span>
          </button>
        </div>

        {currentCoords && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Tọa độ GPS hiện tại của thiết bị:</span>
              <div className="font-mono text-slate-200 flex flex-wrap gap-x-4">
                <span>
                  Vĩ độ: <strong className="text-indigo-400">{currentCoords.lat}</strong>
                </span>
                <span>
                  Kinh độ: <strong className="text-indigo-400">{currentCoords.lng}</strong>
                </span>
                <span className="text-slate-400">
                  Độ chính xác: &plusmn;{currentCoords.accuracy}m
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
              Định vị thành công
            </span>
          </div>
        )}

        {gpsError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Notification Alerts */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Locations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 space-y-2 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">Đang tải danh sách địa điểm GPS...</span>
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
            <MapPin className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-400">Chưa có địa điểm Geofence nào được cấu hình</p>
            <p className="text-xs text-slate-600">
              Hãy nhấn nút thêm địa điểm mới hoặc bấm nạp nhanh «Phòng Bảo vệ ĐATN».
            </p>
          </div>
        ) : (
          locations.map((loc) => {
            // Distance calculation if current coords available
            const distance = currentCoords
              ? calculateHaversineDistanceMeters(
                  currentCoords.lat,
                  currentCoords.lng,
                  loc.latitude,
                  loc.longitude
                )
              : null;

            const isInside = distance !== null ? distance <= (loc.radiusMeters || 100) : null;

            return (
              <div
                key={loc.locationId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/80 transition-all group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">
                          {loc.name}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-indigo-400 border border-slate-700">
                          {loc.locationId}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      R = {loc.radiusMeters || 100}m
                    </span>
                  </div>

                  {/* Coordinates box */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Vĩ độ (Lat):</span>
                      <span className="text-slate-200 font-semibold">{loc.latitude}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Kinh độ (Lng):</span>
                      <span className="text-slate-200 font-semibold">{loc.longitude}</span>
                    </div>
                  </div>

                  {/* Live Distance Check if user clicked GPS */}
                  {distance !== null && (
                    <div
                      className={`p-3 rounded-2xl text-xs border ${
                        isInside
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-semibold mb-0.5">
                        {isInside ? (
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>
                          {isInside
                            ? 'Trong Vùng Chấm Công Hợp Lệ'
                            : 'Ngoài Vùng Cho Phép'}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        Khoảng cách: <strong>{distance}m</strong> (Bán kính cho phép: {loc.radiusMeters}m).
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs">
                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <span>Xem bản đồ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isCeoOrHr && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setLocToEdit(loc);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Xóa địa điểm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Location Modal */}
      {modalOpen && (
        <LocationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => fetchLocations()}
          locationToEdit={locToEdit}
        />
      )}
    </div>
  );
};

export default LocationsPage;
