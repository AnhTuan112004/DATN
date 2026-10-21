import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { companiesApi, LocationItem, CreateLocationInput, UpdateLocationInput } from '../../api/companies';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locationToEdit?: LocationItem | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locationToEdit,
}) => {
  const isEditing = !!locationToEdit;
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    locationId: '',
    latitude: 21.0362,
    longitude: 105.7829,
    radiusMeters: 100,
  });

  useEffect(() => {
    if (locationToEdit) {
      setForm({
        name: locationToEdit.name,
        locationId: locationToEdit.locationId,
        latitude: locationToEdit.latitude,
        longitude: locationToEdit.longitude,
        radiusMeters: locationToEdit.radiusMeters || 100,
      });
    } else {
      setForm({
        name: '',
        locationId: '',
        latitude: 21.0362,
        longitude: 105.7829,
        radiusMeters: 100,
      });
    }
    setError(null);
  }, [locationToEdit, isOpen]);

  if (!isOpen) return null;

  // HTML5 Geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setGpsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setError(`Không thể lấy tọa độ GPS: ${err.message}. Vui lòng cấp quyền vị trí.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && locationToEdit) {
        const payload: UpdateLocationInput = {
          name: form.name.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radiusMeters: Number(form.radiusMeters),
        };
        await companiesApi.updateLocation(locationToEdit.locationId, payload);
      } else {
        const payload: CreateLocationInput = {
          name: form.name.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radiusMeters: Number(form.radiusMeters),
        };
        if (form.locationId.trim()) {
          payload.locationId = form.locationId.trim();
        }
        await companiesApi.addLocation(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(errData?.error || errData?.message || 'Có lỗi xảy ra khi lưu địa điểm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100">
              {isEditing ? 'Chỉnh Sửa Địa Điểm GPS' : 'Thêm Địa Điểm Chấm Công GPS'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tên Địa Điểm / Văn Phòng <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Trụ sở chính Keangnam Landmark 72"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Mã Địa Điểm (Để trống = tự động sinh)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: loc_hq, loc_demo..."
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* GPS Coordinates with Quick Get Location Button */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 text-xs flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>Tọa Độ Địa Lý (WGS-84)</span>
                </span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-[11px] font-semibold border border-indigo-500/30 transition-colors"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Compass className="w-3 h-3" />
                  )}
                  <span>Lấy GPS Thiết Bị</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Vĩ Độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    required
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Kinh Độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    required
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* External Map Link */}
              <div className="pt-1 flex justify-end">
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  <span>Xem trên Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Radius Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Bán Kính Geofence Cho Phép</label>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {form.radiusMeters} mét
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={form.radiusMeters}
                onChange={(e) => setForm({ ...form, radiusMeters: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10m (Phòng họp/Hội đồng)</span>
                <span>100m (Tiêu chuẩn v6.1)</span>
                <span>1000m (Khu công nghiệp)</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-indigo-600/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Cập Nhật' : 'Lưu Địa Điểm'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
