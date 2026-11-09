import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { departmentsApi, CreateDepartmentInput, UpdateDepartmentInput } from '../../api/departments';
import { DepartmentItem, UserItem } from '../../types/user';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentToEdit?: DepartmentItem | null;
  parentDeptForNew?: DepartmentItem | null;
  rootDepartments: DepartmentItem[];
  managers: UserItem[];
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departmentToEdit,
  parentDeptForNew,
  rootDepartments,
  managers,
}) => {
  const isEditing = !!departmentToEdit;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    parentDepartmentId: '',
    managerId: '',
    description: '',
  });

  useEffect(() => {
    if (departmentToEdit) {
      setForm({
        name: departmentToEdit.name,
        code: departmentToEdit.code,
        parentDepartmentId: departmentToEdit.parentDepartmentId || '',
        managerId: departmentToEdit.managerId?._id || '',
        description: departmentToEdit.description || '',
      });
    } else {
      setForm({
        name: '',
        code: '',
        parentDepartmentId: parentDeptForNew ? parentDeptForNew._id : '',
        managerId: '',
        description: '',
      });
    }
    setError(null);
  }, [departmentToEdit, parentDeptForNew, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && departmentToEdit) {
        const payload: UpdateDepartmentInput = {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim(),
          parentDepartmentId: form.parentDepartmentId || null,
          managerId: form.managerId || null,
        };
        await departmentsApi.updateDepartment(departmentToEdit._id, payload);
      } else {
        const payload: CreateDepartmentInput = {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim(),
          parentDepartmentId: form.parentDepartmentId || null,
          managerId: form.managerId || null,
        };
        await departmentsApi.createDepartment(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(errData?.error || errData?.message || 'Có lỗi xảy ra khi lưu phòng ban.');
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
      <div className="relative w-full max-w-lg bg-surface border-2 border-line rounded-3xl shadow-hard-lg overflow-hidden flex flex-col text-fg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime/20 border-2 border-line flex items-center justify-center text-ink shadow-hard">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-black text-lg text-fg font-display">
              {isEditing ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Khối / Phòng Ban Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
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
                Tên Khối / Phòng Ban <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Khối Kỹ Thuật hoặc Phòng Frontend"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
              />
            </div>

            <div>
              <label className="block text-fg font-bold mb-1">
                Mã Định Danh (Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="TECH, DEV, HR, FIN..."
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted font-mono focus:outline-none focus:border-accent font-medium shadow-hard"
              />
              <span className="text-[11px] text-muted font-medium mt-1 block">
                Mã viết hoa, duy nhất trong toàn công ty.
              </span>
            </div>

            <div>
              <label className="block text-fg font-bold mb-1">
                Phòng ban cha (Cơ cấu tối đa 2 cấp)
              </label>
              <select
                value={form.parentDepartmentId}
                onChange={(e) => setForm({ ...form, parentDepartmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
              >
                <option value="">-- Là Khối Cấp 1 (Trực thuộc BOD) --</option>
                {rootDepartments
                  .filter((rd) => !departmentToEdit || rd._id !== departmentToEdit._id)
                  .map((root) => (
                    <option key={root._id} value={root._id}>
                      {root.name} ({root.code}) — Cấp 1
                    </option>
                  ))}
              </select>
              <span className="text-[11px] text-muted font-medium mt-1 block">
                Nếu chọn Khối cha, đơn vị này sẽ là Phòng ban Cấp 2. Giới hạn nghiêm ngặt tối đa 2 cấp.
              </span>
            </div>

            <div>
              <label className="block text-fg font-bold mb-1">Trưởng Bộ Phận / Quản Lý</label>
              <select
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
              >
                <option value="">-- Chưa bổ nhiệm --</option>
                {managers.map((mgr) => (
                  <option key={mgr._id} value={mgr._id}>
                    {mgr.fullName} ({mgr.employeeCode}) — {mgr.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-fg font-bold mb-1">Mô Tả Chức Năng</label>
              <textarea
                rows={3}
                placeholder="Mô tả chức năng, nhiệm vụ chính của bộ phận..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium resize-none shadow-hard"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border-2 border-line rounded-xl text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
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
                  <span>{isEditing ? 'Cập Nhật' : 'Tạo Phòng Ban'}</span>
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
