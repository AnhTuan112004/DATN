import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveApi } from '../../api/leave';
import { LeaveRequestType, CreateLeaveRequestPayload } from '../../types/leave';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import {
  X,
  Calendar,
  HeartPulse,
  Clock,
  Home,
  FileQuestion,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface CreateLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLeaveModal: React.FC<CreateLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);
  const { user } = useAuth();

  const [selectedType, setSelectedType] = useState<LeaveRequestType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [otHours, setOtHours] = useState<number>(2);
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Fields for FORGOT_CHECKIN
  const [targetDate, setTargetDate] = useState('');
  const [checkType, setCheckType] = useState<'CHECK_IN' | 'CHECK_OUT' | 'BOTH'>('CHECK_IN');
  const [requestedTime, setRequestedTime] = useState('08:30');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      setTargetDate(today);
      setDurationDays(1);
      setOtHours(2);
      setReason('');
      setAttachmentUrl('');
      setError(null);
    }
  }, [isOpen]);

  // Auto calculate duration in days
  useEffect(() => {
    if (startDate && endDate && selectedType !== 'FORGOT_CHECKIN') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
      if (diffDays > 0) {
        setDurationDays(diffDays);
      }
    }
  }, [startDate, endDate, selectedType]);

  if (!isOpen) return null;

  const annualRemaining = user?.leaveBalance?.annualRemaining ?? 12;
  const sickRemaining = user?.leaveBalance?.sickRemaining ?? 30;

  const typeCards: Array<{
    type: LeaveRequestType;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badge?: string;
  }> = [
    {
      type: 'ANNUAL',
      title: 'Phép Năm',
      desc: 'Nghỉ hưởng nguyên lương',
      icon: Calendar,
      color: 'emerald',
      badge: `Còn ${annualRemaining} ngày`,
    },
    {
      type: 'SICK',
      title: 'Nghỉ Ốm',
      desc: 'Hưởng chế độ BHXH',
      icon: HeartPulse,
      color: 'purple',
      badge: `Còn ${sickRemaining} ngày`,
    },
    {
      type: 'OT',
      title: 'Làm Thêm Giờ',
      desc: 'Tăng ca ngoài giờ làm việc',
      icon: Clock,
      color: 'amber',
      badge: 'Điều 98 BLLĐ',
    },
    {
      type: 'WFH',
      title: 'Làm Từ Xa',
      desc: 'Làm việc tại nhà / Remote',
      icon: Home,
      color: 'sky',
    },
    {
      type: 'FORGOT_CHECKIN',
      title: 'Giải Trình Công',
      desc: 'Quên check-in / check-out',
      icon: FileQuestion,
      color: 'indigo',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason || reason.trim().length < 3) {
      setError('Vui lòng nhập lý do nộp đơn (tối thiểu 3 ký tự).');
      return;
    }

    if (selectedType === 'ANNUAL' && durationDays > annualRemaining) {
      setError(`Số dư phép năm không đủ (còn ${annualRemaining} ngày, yêu cầu ${durationDays} ngày).`);
      return;
    }

    if (selectedType === 'SICK' && durationDays > sickRemaining) {
      setError(`Số dư phép ốm không đủ (còn ${sickRemaining} ngày, yêu cầu ${durationDays} ngày).`);
      return;
    }

    if (selectedType === 'OT' && (otHours <= 0 || otHours > 12)) {
      setError('Số giờ làm thêm OT phải nằm trong khoảng từ 0.5 đến 12 giờ.');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateLeaveRequestPayload = {
        type: selectedType,
        startDate: selectedType === 'FORGOT_CHECKIN' ? `${targetDate}T00:00:00.000Z` : `${startDate}T00:00:00.000Z`,
        endDate: selectedType === 'FORGOT_CHECKIN' ? `${targetDate}T23:59:59.000Z` : `${endDate}T23:59:59.000Z`,
        durationDays: selectedType === 'FORGOT_CHECKIN' ? 1 : durationDays,
        reason: reason.trim(),
        attachmentUrl: attachmentUrl.trim() || null,
      };

      if (selectedType === 'OT') {
        payload.otHoursRequested = otHours;
      }

      if (selectedType === 'FORGOT_CHECKIN') {
        payload.forgotDetails = {
          targetDate,
          checkType,
          requestedTime,
        };
      }

      await leaveApi.createLeaveRequest(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
      setError(
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Không thể nộp đơn. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-leave-modal-title"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 id="create-leave-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Tạo Đơn Nghỉ Phép & Đề Xuất Công
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Đơn sẽ được tự động chuyển theo luồng duyệt 2 cấp cố định (Quản lý trực tiếp → HR Manager).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ tạo đơn"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Chọn loại đơn */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              1. Chọn Loại Đơn Yêu Cầu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {typeCards.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item.type)}
                    className={`relative p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <IconComponent className={`w-4 h-4 text-${item.color}-400`} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</p>
                    </div>
                    {item.badge && (
                      <span className="mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Cấu hình chi tiết theo từng loại đơn */}
          {selectedType === 'FORGOT_CHECKIN' ? (
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <FileQuestion className="w-4 h-4" />
                Thông tin giải trình quên chấm công
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ngày quên công</label>
                  <input
                    type="date"
                    value={targetDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Trường hợp quên</label>
                  <select
                    value={checkType}
                    onChange={(e) => setCheckType(e.target.value as 'CHECK_IN' | 'CHECK_OUT' | 'BOTH')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CHECK_IN">Quên Check-in (Vào ca)</option>
                    <option value="CHECK_OUT">Quên Check-out (Hết ca)</option>
                    <option value="BOTH">Quên cả hai (Cả ngày)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Giờ đề nghị ghi nhận</label>
                  <input
                    type="time"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Khoảng thời gian áp dụng
                </span>
                <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Tổng: {durationDays} ngày
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Tùy chọn 0.5 ngày (nửa ngày) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDurationDays(0.5)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    durationDays === 0.5
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Nửa ngày (0.5 ngày)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationDays(1)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    durationDays === 1
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  1 ngày trọn vẹn
                </button>
              </div>

              {/* Nếu là OT: Cấu hình số giờ OT */}
              {selectedType === 'OT' && (
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Số giờ làm thêm đề xuất (OT)
                    </label>
                    <span className="text-xs text-slate-400">{otHours} giờ</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={otHours}
                    onChange={(e) => setOtHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                  {otHours > 4 && (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 flex-shrink-0" />
                      Lưu ý: Điều 98 BLLĐ khuyến cáo số giờ làm thêm tối đa không quá 4h/ngày.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Đính kèm giấy tờ y tế (cho đơn ốm) */}
          {selectedType === 'SICK' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link chứng từ / Giấy xác nhận khám chữa bệnh (nếu có)
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* 4. Lý do nộp đơn */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              2. Lý Do & Nội Dung Chi Tiết <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ghi rõ lý do xin nghỉ hoặc giải trình công tác..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="app-button text-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang Gửi Đơn...
                </>
              ) : (
                'Gửi Đơn Phê Duyệt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
