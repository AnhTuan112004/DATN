import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { usersApi } from '../../api/users';
import { UserItem, DepartmentItem, ContractType } from '../../types/user';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: UserItem) => void;
  departments: DepartmentItem[];
  managers: UserItem[];
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  departments,
  managers,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    employeeCode: '',
    phone: '',
    departmentId: '',
    managerId: '',
    password: 'Password123@',
    hireDate: new Date().toISOString().split('T')[0],
    includeContract: true,
    contractType: 'DEFINITE' as ContractType,
    baseSalary: 15000000,
    allowance: 1000000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        departmentId: form.departmentId ? form.departmentId : null,
        managerId: form.managerId ? form.managerId : null,
        hireDate: form.hireDate,
      };

      if (form.employeeCode.trim()) {
        payload.employeeCode = form.employeeCode.trim().toUpperCase();
      }

      if (form.includeContract) {
        payload.contract = {
          contractType: form.contractType,
          baseSalary: Number(form.baseSalary),
          allowance: Number(form.allowance),
          effectiveFrom: form.effectiveFrom,
          effectiveTo: form.contractType === 'INDEFINITE' ? null : form.effectiveTo,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await usersApi.createUser(payload as any);
      onUserCreated(res.data);
      onClose();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string; details?: Array<{ field: string; message: string }> } } })?.response?.data;
      if (errData?.details && errData.details.length > 0) {
        setError(errData.details.map((d) => d.message).join(', '));
      } else {
        setError(errData?.error || 'Có lỗi xảy ra khi tạo mới nhân viên.');
      }
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
      <div className="relative w-full max-w-2xl bg-surface border-2 border-line rounded-3xl shadow-hard-lg overflow-hidden flex flex-col max-h-[90vh] text-fg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime/20 border-2 border-line flex items-center justify-center text-ink shadow-hard">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-black text-lg text-fg font-display">Thêm Mới Hồ Sơ Nhân Sự</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition-colors cursor-pointer shadow-hard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-fg border-b-2 border-line pb-2 font-display">
              1. Thông Tin Định Danh Nhân Viên
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-fg font-bold mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">
                  Email doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="an.nguyen@company.vn"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">
                  Mã nhân viên (Để trống để tự sinh NVxxxx)
                </label>
                <input
                  type="text"
                  placeholder="Để trống = tự động NV00xx"
                  value={form.employeeCode}
                  onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted font-mono focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">Phòng ban trực thuộc</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                >
                  <option value="">-- Chưa phân bổ --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">Quản lý trực tiếp</label>
                <select
                  value={form.managerId}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                >
                  <option value="">-- BOD / Không có --</option>
                  {managers.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>
                      {mgr.fullName} ({mgr.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">Mật khẩu khởi tạo</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg font-mono focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>

              <div>
                <label className="block text-fg font-bold mb-1">Ngày vào làm</label>
                <input
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hợp đồng khởi tạo */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b-2 border-line pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-fg font-display">
                2. Hợp Đồng Lao Động Ban Đầu
              </h4>
              <label className="flex items-center space-x-2 text-xs text-fg font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includeContract}
                  onChange={(e) => setForm({ ...form, includeContract: e.target.checked })}
                  className="w-4 h-4 rounded border-2 border-line accent-lime cursor-pointer"
                />
                <span>Kèm hợp đồng ban đầu</span>
              </label>
            </div>

            {form.includeContract && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-2 p-4 border-2 border-line rounded-2xl shadow-hard">
                <div>
                  <label className="block text-fg font-bold mb-1">Loại Hợp Đồng</label>
                  <select
                    value={form.contractType}
                    onChange={(e) => setForm({ ...form, contractType: e.target.value as ContractType })}
                    className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                  >
                    <option value="PROBATION">Thử việc (PROBATION)</option>
                    <option value="DEFINITE">Xác định thời hạn (DEFINITE)</option>
                    <option value="INDEFINITE">Không xác định thời hạn (INDEFINITE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-fg font-bold mb-1">Lương Cơ Bản Theo HĐ (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={form.baseSalary}
                    onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard"
                  />
                </div>

                <div>
                  <label className="block text-fg font-bold mb-1">Phụ Cấp Hợp Đồng (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={form.allowance}
                    onChange={(e) => setForm({ ...form, allowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard"
                  />
                </div>

                <div>
                  <label className="block text-fg font-bold mb-1">Ngày Bắt Đầu Hiệu Lực</label>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                  />
                </div>

                {form.contractType !== 'INDEFINITE' && (
                  <div>
                    <label className="block text-fg font-bold mb-1">Ngày Hết Hạn</label>
                    <input
                      type="date"
                      value={form.effectiveTo}
                      onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border-2 border-line rounded-xl text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3.5 bg-rose-500/10 border-2 border-line rounded-2xl text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
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
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-ink" />
                  <span>Tạo Nhân Viên</span>
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
