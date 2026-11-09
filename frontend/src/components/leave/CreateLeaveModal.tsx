import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  FileText,
  UploadCloud,
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
  const [attachmentName, setAttachmentName] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

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
      setAttachmentName('');
      setFileUploadError(null);
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
    {
      type: 'CUSTOM',
      title: 'Đơn Tự Do',
      desc: 'Đính kèm tệp Word / PDF',
      icon: FileText,
      color: 'rose',
      badge: 'Đính kèm Word/PDF',
    },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFileUploadError('Dung lượng tệp vượt quá 15MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    setIsUploadingFile(true);
    setFileUploadError(null);

    try {
      const res = await leaveApi.uploadAttachment(file);
      setAttachmentUrl(res.url);
      setAttachmentName(res.originalName || file.name);
    } catch (err: any) {
      setFileUploadError(
        err.response?.data?.error || err.message || 'Không thể tải lên tệp văn bản. Vui lòng thử lại.'
      );
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentUrl('');
    setAttachmentName('');
    setFileUploadError(null);
  };

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
        attachmentName: attachmentName.trim() || null,
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-leave-modal-title"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface border-2 border-line rounded-3xl shadow-hard-lg p-6 text-fg custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-line">
          <div>
            <h2 id="create-leave-modal-title" className="text-xl font-black text-fg flex items-center gap-2 font-display">
              <div className="w-8 h-8 rounded-lg bg-lime/20 border-2 border-line flex items-center justify-center text-ink shadow-hard">
                <Calendar className="w-4 h-4" />
              </div>
              Tạo Đơn Nghỉ Phép & Đề Xuất Công
            </h2>
            <p className="text-xs text-muted font-medium mt-1">
              Đơn sẽ được tự động chuyển theo luồng duyệt 2 cấp cố định (Quản lý trực tiếp → HR Manager).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ tạo đơn"
            className="p-1.5 rounded-xl text-fg hover:bg-surface-2 border-2 border-line shadow-hard transition-colors cursor-pointer"
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
            <label className="block text-xs font-black uppercase tracking-wider text-fg mb-2 font-display">
              1. Chọn Loại Đơn Yêu Cầu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {typeCards.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item.type)}
                    className={`relative p-3.5 rounded-2xl border-2 border-line text-left transition-all duration-150 flex flex-col justify-between cursor-pointer shadow-hard ${
                      isSelected
                        ? 'bg-lime text-ink font-bold'
                        : 'bg-surface-2 text-fg hover:bg-surface'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-ink' : 'text-accent'}`} />
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-ink font-black" />}
                      </div>
                      <p className={`text-xs font-black font-display ${isSelected ? 'text-ink' : 'text-fg'}`}>{item.title}</p>
                      <p className={`text-[11px] line-clamp-1 mt-0.5 font-medium ${isSelected ? 'text-ink/80' : 'text-muted'}`}>{item.desc}</p>
                    </div>
                    {item.badge && (
                      <span className={`mt-2 inline-block text-[10px] px-2 py-0.5 rounded-md border border-line font-bold font-mono ${
                        isSelected ? 'bg-surface text-ink' : 'bg-surface text-fg'
                      }`}>
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
            <div className="p-4 bg-surface-2 border-2 border-line rounded-2xl space-y-4 shadow-hard">
              <div className="flex items-center gap-2 text-xs font-black text-fg font-display">
                <FileQuestion className="w-4 h-4 text-accent" />
                Thông tin giải trình quên chấm công
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1">Ngày quên công</label>
                  <input
                    type="date"
                    value={targetDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-surface border-2 border-line rounded-xl px-3 py-2 text-xs text-fg font-bold focus:outline-none focus:border-accent shadow-hard cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg mb-1">Trường hợp quên</label>
                  <select
                    value={checkType}
                    onChange={(e) => setCheckType(e.target.value as 'CHECK_IN' | 'CHECK_OUT' | 'BOTH')}
                    className="w-full bg-surface border-2 border-line rounded-xl px-3 py-2 text-xs text-fg font-bold focus:outline-none focus:border-accent shadow-hard cursor-pointer"
                  >
                    <option value="CHECK_IN">Quên Check-in (Vào ca)</option>
                    <option value="CHECK_OUT">Quên Check-out (Hết ca)</option>
                    <option value="BOTH">Quên cả hai (Cả ngày)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg mb-1">Giờ đề nghị ghi nhận</label>
                  <input
                    type="time"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full bg-surface border-2 border-line rounded-xl px-3 py-2 text-xs text-fg font-bold focus:outline-none focus:border-accent shadow-hard"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-2 border-2 border-line rounded-2xl space-y-4 shadow-hard">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-fg flex items-center gap-1.5 font-display">
                  <Calendar className="w-4 h-4 text-accent" />
                  Khoảng thời gian áp dụng
                </span>
                <span className="text-xs text-ink font-black bg-lime px-2.5 py-0.5 rounded-md border border-line shadow-hard">
                  Tổng: {durationDays} ngày
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface border-2 border-line rounded-xl px-3 py-2 text-xs text-fg font-bold focus:outline-none focus:border-accent shadow-hard cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface border-2 border-line rounded-xl px-3 py-2 text-xs text-fg font-bold focus:outline-none focus:border-accent shadow-hard cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Tùy chọn 0.5 ngày (nửa ngày) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDurationDays(0.5)}
                  className={`text-xs px-3 py-1.5 rounded-xl border-2 border-line transition-all cursor-pointer font-bold shadow-hard ${
                    durationDays === 0.5
                      ? 'bg-lime text-ink font-black'
                      : 'bg-surface text-fg hover:bg-surface-2'
                  }`}
                >
                  Nửa ngày (0.5 ngày)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationDays(1)}
                  className={`text-xs px-3 py-1.5 rounded-xl border-2 border-line transition-all cursor-pointer font-bold shadow-hard ${
                    durationDays === 1
                      ? 'bg-lime text-ink font-black'
                      : 'bg-surface text-fg hover:bg-surface-2'
                  }`}
                >
                  1 ngày trọn vẹn
                </button>
              </div>

              {/* Nếu là OT: Cấu hình số giờ OT */}
              {selectedType === 'OT' && (
                <div className="pt-3 border-t-2 border-line">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-fg font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent" />
                      Số giờ làm thêm đề xuất (OT)
                    </label>
                    <span className="text-xs font-black text-fg">{otHours} giờ</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={otHours}
                    onChange={(e) => setOtHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface border-2 border-line rounded-xl px-3 py-2 text-xs text-fg font-bold focus:outline-none focus:border-accent shadow-hard"
                    required
                  />
                  {otHours > 4 && (
                    <p className="text-[11px] text-amber-700 font-bold mt-1.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      Lưu ý: Điều 98 BLLĐ khuyến cáo số giờ làm thêm tối đa không quá 4h/ngày.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2.5 Đính kèm văn bản Word (.docx, .doc) hoặc PDF */}
          <div className="p-4 bg-surface-2 border-2 border-line rounded-2xl space-y-3 shadow-hard">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-fg flex items-center gap-1.5 font-display">
                <FileText className="w-4 h-4 text-accent" />
                <span>Văn bản đơn / Đề xuất (Word .docx, .doc hoặc PDF)</span>
                {selectedType === 'CUSTOM' && <span className="text-rose-500 font-bold">*</span>}
              </label>
              {selectedType === 'CUSTOM' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-lime text-ink border border-line font-black">
                  Tải tệp Word lên đây
                </span>
              ) : (
                <span className="text-[10px] text-muted font-bold">Tùy chọn</span>
              )}
            </div>

            {selectedType === 'CUSTOM' && (
              <p className="text-[11px] text-fg leading-relaxed bg-surface p-3 rounded-xl border-2 border-line font-medium shadow-hard">
                💡 <strong>Hướng dẫn:</strong> Bạn có thể viết đơn bằng Microsoft Word trên máy tính, sau đó tải tệp lên đây. Trưởng phòng và HR Manager sẽ đọc trực tiếp văn bản này để phê duyệt.
              </p>
            )}

            {attachmentUrl ? (
              <div className="p-3 bg-lime/20 border-2 border-line rounded-2xl flex items-center justify-between gap-3 animate-fadeIn shadow-hard">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-lime border-2 border-line flex items-center justify-center shrink-0 text-ink shadow-hard font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-fg truncate">
                      {attachmentName || 'Tài liệu đã tải lên'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Đã lưu tệp, sẵn sàng gửi duyệt 2 cấp
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="text-xs text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-500/10 rounded-xl transition cursor-pointer border border-line"
                  title="Gỡ bỏ tệp để chọn tệp khác"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <label className="border-2 border-dashed border-line hover:border-accent rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-surface hover:bg-surface-2 transition group shadow-hard">
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf,.odt,.txt,image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile}
                    className="hidden"
                  />
                  {isUploadingFile ? (
                    <div className="flex items-center gap-2 text-xs text-accent font-bold py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tải tệp văn bản Word/PDF lên máy chủ...</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <UploadCloud className="w-7 h-7 mx-auto text-muted group-hover:text-accent transition" />
                      <p className="text-xs text-fg font-black font-display">
                        Bấm vào đây để chọn tệp văn bản từ máy tính
                      </p>
                      <p className="text-[11px] text-muted font-medium">
                        Chấp nhận Microsoft Word (.docx, .doc), PDF (Dung lượng tối đa 15MB)
                      </p>
                    </div>
                  )}
                </label>
                {fileUploadError && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fileUploadError}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 4. Lý do nộp đơn */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-fg mb-1.5 font-display">
              2. Lý Do & Nội Dung Chi Tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ghi rõ lý do xin nghỉ hoặc giải trình công tác..."
              className="w-full bg-surface-2 border-2 border-line rounded-2xl p-3.5 text-xs text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard resize-none"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-fg border-2 border-line rounded-xl hover:bg-surface-2 transition-colors cursor-pointer shadow-hard"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard transition-all cursor-pointer uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-ink" />
                  Đang Gửi Đơn...
                </>
              ) : (
                'Gửi Đơn Phê Duyệt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
