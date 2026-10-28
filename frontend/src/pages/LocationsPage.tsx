import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Compass,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Navigation,
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

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
  }
  return `${meters} m`;
};

export const LocationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isCeoOrHr = hasRole(['CEO', 'HR_MANAGER']);

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [locToEdit, setLocToEdit] = useState<LocationItem | null>(null);

  // Device GPS Live Test
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(
    null
  );
  const [testingGps, setTestingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedMapLoc, setSelectedMapLoc] = useState<LocationItem | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companiesApi.getLocations();
      setLocations(res.data);
      if (res.data?.length > 0) {
        setSelectedMapLoc(res.data[0]);
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Không thể tải danh sách địa điểm.';
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

  // Seed default location
  const handleSeedDefenseRoom = async () => {
    setError(null);
    try {
      await companiesApi.seedDefenseLocation();
      fetchLocations();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Lỗi khi nạp địa điểm mẫu.';
      setError(errMsg);
    }
  };

  // Delete location
  const handleDelete = async (loc: LocationItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa địa điểm "${loc.name}" (${loc.locationId})?`)) return;

    setError(null);
    try {
      await companiesApi.deleteLocation(loc.locationId);
      fetchLocations();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Lỗi khi xóa địa điểm.';
      setError(errMsg);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">
            Địa điểm làm việc
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Cấu hình danh sách văn phòng và bán kính cho phép chấm công ({locations.length} địa điểm).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => fetchLocations()}
            className="app-button-secondary p-2 h-auto min-h-0 text-xs"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isCeoOrHr && (
            <>
              <button
                onClick={handleSeedDefenseRoom}
                className="app-button-secondary text-xs"
                title="Nạp nhanh tọa độ mẫu"
              >
                <Compass className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                <span>Nạp địa điểm mẫu</span>
              </button>

              <button
                onClick={() => {
                  setLocToEdit(null);
                  setModalOpen(true);
                }}
                className="app-button text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm địa điểm</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* GPS Tester Card */}
      <div className="app-surface p-4 space-y-3 rounded-[var(--radius)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Kiểm tra vị trí thiết bị hiện tại
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Lấy tọa độ thực tế của máy và tính toán khoảng cách tức thời tới các địa điểm văn phòng đã cấu hình.
            </p>
          </div>

          <button
            onClick={handleTestDeviceLocation}
            disabled={testingGps}
            className="app-button text-xs py-1.5 px-3 shrink-0"
          >
            {testingGps ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>Kiểm tra vị trí của tôi</span>
          </button>
        </div>

        {currentCoords && (
          <div className="p-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-medium">Tọa độ GPS hiện tại của thiết bị:</span>
              <div className="font-mono text-[var(--text)] flex flex-wrap gap-x-4">
                <span>
                  Vĩ độ: <strong className="text-[var(--accent)]">{currentCoords.lat}</strong>
                </span>
                <span>
                  Kinh độ: <strong className="text-[var(--accent)]">{currentCoords.lng}</strong>
                </span>
                <span className="text-[var(--text-muted)]">
                  Độ chính xác: &plusmn;{currentCoords.accuracy}m
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--success-bg)] text-[var(--success-text)] border border-emerald-500/20 self-start sm:self-auto">
              Định vị thành công
            </span>
          </div>
        )}

        {gpsError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-500 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Notification Alerts */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius)] text-rose-500 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Embedded Interactive Map View (Bản Đồ GPS Tương Tác Trực Tiếp) */}
      <div className="p-4 app-surface space-y-3 rounded-[var(--radius)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Bản đồ vị trí văn phòng
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Quan sát trực quan vị trí trụ sở công ty và địa điểm làm việc đã đăng ký.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {locations.map((l) => (
              <button
                key={l.locationId}
                onClick={() => setSelectedMapLoc(l)}
                className={`px-3 py-1 rounded-[var(--radius)] text-xs font-medium border transition ${
                  selectedMapLoc?.locationId === l.locationId
                    ? 'bg-[var(--accent)] text-white border-transparent shadow-sm'
                    : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-72 sm:h-80 rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)]">
          <iframe
            title="Geofence Interactive Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(selectedMapLoc?.longitude || 105.7839) - 0.008}%2C${(selectedMapLoc?.latitude || 21.0169) - 0.006}%2C${(selectedMapLoc?.longitude || 105.7839) + 0.008}%2C${(selectedMapLoc?.latitude || 21.0169) + 0.006}&layer=mapnik&marker=${selectedMapLoc?.latitude || 21.0169}%2C${selectedMapLoc?.longitude || 105.7839}`}
            className="w-full h-full filter contrast-125 brightness-90"
          />

          {/* Map Overlay Badge */}
          <div className="absolute top-3 left-3 bg-[var(--surface)] border border-[var(--border)] p-3 rounded-[var(--radius)] text-xs space-y-1 shadow-sm max-w-xs">
            <p className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              {selectedMapLoc?.name || 'Trụ sở chính'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Tọa độ: <span className="text-[var(--text)] font-mono">{selectedMapLoc?.latitude || 21.0169}, {selectedMapLoc?.longitude || 105.7839}</span>
            </p>
            <p className="text-[11px] text-[var(--success-text)] font-medium">
              Bán kính cho phép: {formatDistance(selectedMapLoc?.radiusMeters || 100)}
            </p>
          </div>
        </div>
      </div>

      {/* Locations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)]">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent)]" />
            <span className="text-xs">Đang tải danh sách địa điểm...</span>
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[var(--radius)] space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2 opacity-50" />
            <p className="text-xs font-medium text-[var(--text)]">Chưa có địa điểm nào được cấu hình</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Hãy nhấn nút thêm địa điểm mới hoặc bấm nạp nhanh địa điểm mẫu.
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
                className="app-surface rounded-[var(--radius)] p-4 shadow-sm flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--text)] text-sm group-hover:text-[var(--accent)] transition-colors">
                        {loc.name}
                      </h3>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        {loc.locationId}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)] font-mono">
                      R = {formatDistance(loc.radiusMeters || 100)}
                    </span>
                  </div>

                  {/* Coordinates box */}
                  <div className="p-2.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius)] text-xs space-y-1 font-mono">
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Vĩ độ (Lat):</span>
                      <span className="text-[var(--text)] font-semibold">{loc.latitude}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Kinh độ (Lng):</span>
                      <span className="text-[var(--text)] font-semibold">{loc.longitude}</span>
                    </div>
                  </div>

                  {/* Live Distance Check if user clicked GPS */}
                  {distance !== null && (
                    <div
                      className={`p-2.5 rounded-[var(--radius)] text-xs border ${
                        isInside
                          ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]'
                          : 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]'
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
                            ? 'Trong vùng chấm công'
                            : 'Ngoài vùng cho phép'}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        Khoảng cách: <strong>{formatDistance(distance)}</strong> (Bán kính cho phép: {formatDistance(loc.radiusMeters || 100)}).
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs">
                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-[var(--accent)] hover:underline font-medium"
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
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
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
