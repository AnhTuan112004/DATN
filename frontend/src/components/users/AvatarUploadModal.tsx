import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { usersApi } from '../../api/users';
import { UserItem } from '../../types/user';

interface AvatarUploadModalProps {
  user: UserItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserItem) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate kích thước <= 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError('Kích thước ảnh vượt quá giới hạn 2MB theo quy định bảo mật.');
      return;
    }

    // Validate MIME types an toàn
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG hoặc WebP.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await usersApi.uploadAvatar(user._id, selectedFile);
      setSuccessMsg('Đã cập nhật ảnh đại diện thành công!');
      setTimeout(() => {
        const returnedUser =
          (res as any)?.data?.user ||
          (res as any)?.user ||
          (res as any)?.data ||
          { ...user, avatarUrl: (res as any)?.data?.avatarUrl };
        onSuccess(returnedUser);
        onClose();
      }, 600);
    } catch (err: unknown) {
      const errResponse = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setError(errResponse?.error || 'Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-surface border-2 border-line rounded-3xl shadow-hard-lg overflow-hidden text-fg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime/20 border-2 border-line flex items-center justify-center text-ink shadow-hard">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-black text-base text-fg font-display">Cập Nhật Ảnh Đại Diện</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition-colors cursor-pointer shadow-hard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-xs text-muted font-medium">
              Nhân sự: <span className="font-bold text-fg">{user.fullName}</span> ({user.employeeCode})
            </p>
            <p className="text-[11px] text-muted mt-1">
              Ảnh tự động căn chỉnh khuôn mặt (face-crop 400×400) phục vụ xác thực FaceID Kiosk.
            </p>
          </div>

          {/* Preview Circle */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-dashed border-line bg-surface-2 flex items-center justify-center shadow-hard">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted">
                    <Camera className="w-10 h-10 mb-1 opacity-50" />
                    <span className="text-xs font-bold">Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-lime text-ink border-2 border-line rounded-xl shadow-hard transition-transform hover:scale-105 cursor-pointer"
                title="Chọn ảnh mới"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* File Selected Name */}
          {selectedFile && (
            <div className="p-3 bg-surface-2 border-2 border-line rounded-xl text-xs text-fg flex items-center justify-between font-bold">
              <span className="truncate max-w-[240px]">{selectedFile.name}</span>
              <span className="text-muted font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border-2 border-line rounded-xl text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2 p-3 bg-lime/20 border-2 border-line rounded-xl text-fg text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-ink" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-surface-2 border-t-2 border-line">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-fg border-2 border-line rounded-xl hover:bg-surface transition-colors cursor-pointer shadow-hard"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard transition-all uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ink" />
                <span>Đang tải lên...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-ink" />
                <span>Lưu Ảnh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
