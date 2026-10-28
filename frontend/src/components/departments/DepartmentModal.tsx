import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100">
              {isEditing ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Khối / Phòng Ban Mới'}
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
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tên Khối / Phòng Ban <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Khối Kỹ Thuật hoặc Phòng Frontend"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Mã Định Danh (Code) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="TECH, DEV, HR, FIN..."
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Mã viết hoa, duy nhất trong toàn công ty.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Phòng ban cha (Cơ cấu tối đa 2 cấp)
              </label>
              <select
                value={form.parentDepartmentId}
                onChange={(e) => setForm({ ...form, parentDepartmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
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
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Nếu chọn Khối cha, đơn vị này sẽ là Phòng ban Cấp 2. Giới hạn nghiêm ngặt tối đa 2 cấp.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Trưởng Bộ Phận / Quản Lý</label>
              <select
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
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
              <label className="block text-slate-300 font-medium mb-1">Mô Tả Chức Năng</label>
              <textarea
                rows={3}
                placeholder="Mô tả chức năng, nhiệm vụ chính của bộ phận..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
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
                  <span>{isEditing ? 'Cập Nhật' : 'Tạo Phòng Ban'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
