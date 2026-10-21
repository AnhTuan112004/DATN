import React, { useState, useRef } from 'react';
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
      setSuccessMsg('Đã cập nhật ảnh đại diện lên Cloudinary (auto-crop face 400x400) thành công!');
      setTimeout(() => {
        onSuccess(res.data.user);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const errResponse = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setError(errResponse?.error || 'Có lỗi xảy ra khi tải ảnh lên máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Cập Nhật Ảnh Đại Diện</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              Cập nhật ảnh cho nhân sự: <span className="font-medium text-slate-200">{user.fullName}</span> (
              {user.employeeCode})
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ảnh tự động căn chỉnh khuôn mặt (face-crop 400×400) phục vụ xác thực FaceID Kiosk.
            </p>
          </div>

          {/* Preview Circle */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/40 bg-slate-950 flex items-center justify-center shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Camera className="w-10 h-10 mb-1 opacity-50" />
                    <span className="text-xs">Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-transform hover:scale-105"
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
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-center justify-between">
              <span className="truncate max-w-[240px]">{selectedFile.name}</span>
              <span className="text-slate-400 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-indigo-600/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải lên...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Lưu Ảnh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
