import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { useDialogA11y } from '../../hooks/useDialogA11y';

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
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg bg-surface border-2 border-line rounded-3xl shadow-hard-lg overflow-hidden flex flex-col text-fg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime/20 border-2 border-line flex items-center justify-center text-ink shadow-hard">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 id="location-modal-title" className="font-black text-lg text-fg font-display">
              {isEditing ? 'Chỉnh Sửa Địa Điểm GPS' : 'Thêm Địa Điểm Chấm Công GPS'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ địa điểm"
            className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition-colors cursor-pointer shadow-hard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-fg font-bold mb-1">
                Tên Địa Điểm / Văn Phòng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Trụ sở chính Keangnam Landmark 72"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-fg font-bold mb-1">
                  Mã Địa Điểm (Để trống = tự động sinh)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: loc_hq, loc_demo..."
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted font-mono focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>
            )}

            {/* GPS Coordinates with Quick Get Location Button */}
            <div className="p-4 bg-surface-2 border-2 border-line rounded-2xl space-y-3 shadow-hard">
              <div className="flex items-center justify-between">
                <span className="font-black text-fg text-xs flex items-center space-x-1.5 font-display">
                  <Compass className="w-4 h-4 text-accent" />
                  <span>Tọa Độ Địa Lý (WGS-84)</span>
                </span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-surface hover:bg-surface-2 text-fg rounded-xl text-xs font-bold border-2 border-line shadow-hard transition-all cursor-pointer"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-accent" />
                  )}
                  <span>Lấy GPS Thiết Bị</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-bold text-[11px] mb-1">Vĩ Độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    required
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg font-mono focus:outline-none focus:border-accent font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold text-[11px] mb-1">Kinh Độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    required
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg font-mono focus:outline-none focus:border-accent font-bold"
                  />
                </div>
              </div>

              {/* External Map Link */}
              <div className="pt-1 flex justify-end">
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-accent hover:underline font-bold"
                >
                  <span>Xem trên Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Radius Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-fg font-bold">Bán Kính Geofence Cho Phép</label>
                <span className="font-mono font-black text-ink bg-lime px-2.5 py-0.5 rounded-md border border-line text-xs">
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
                className="w-full accent-lime cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted font-medium mt-1">
                <span>10m (Phòng họp/Hội đồng)</span>
                <span>100m (Mặc định)</span>
                <span>1000m (Khu công nghiệp)</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border-2 border-line rounded-xl text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-fg border-2 border-line rounded-xl hover:bg-surface-2 transition-colors cursor-pointer shadow-hard"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard transition-all cursor-pointer uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-ink" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-ink" />
                  <span>{isEditing ? 'Cập Nhật' : 'Lưu Địa Điểm'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
