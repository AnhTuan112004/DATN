import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, UserCheck, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { usersApi } from '../../api/users';
import { DepartmentItem, UserItem } from '../../types/user';
import { formatDate } from '../../utils/formatters';

interface DepartmentMembersModalProps {
  department: DepartmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewUserDetail?: (user: UserItem) => void;
}

export const DepartmentMembersModal: React.FC<DepartmentMembersModalProps> = ({
  department,
  isOpen,
  onClose,
  onViewUserDetail,
}) => {
  const [members, setMembers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department && isOpen) {
      setLoading(true);
      setError(null);
      usersApi
        .getUsers({ departmentId: department._id, limit: 100 })
        .then((res) => {
          setMembers(res.users);
        })
        .catch((err) => {
          console.error('Lỗi tải danh sách thành viên:', err);
          setError('Không thể tải danh sách nhân viên trực thuộc phòng ban.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [department, isOpen]);

  if (!isOpen || !department) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-surface border-2 border-line rounded-3xl shadow-hard-lg overflow-hidden flex flex-col max-h-[88vh] text-fg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-black rounded-xl bg-lime text-ink border-2 border-line font-mono shadow-hard">
              {department.code}
            </span>
            <div>
              <h3 className="font-black text-fg text-lg font-display">{department.name}</h3>
              <p className="text-xs text-muted font-medium">
                {department.parentDepartmentId ? 'Phòng ban Cấp 2' : 'Khối chức năng Cấp 1'} •{' '}
                <span className="text-fg font-bold">{members.length} nhân sự trực thuộc</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition-colors cursor-pointer shadow-hard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Manager Spotlight Card */}
          {department.managerId ? (
            <div className="p-4 bg-lime/10 border-2 border-line rounded-2xl flex items-center justify-between shadow-hard">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-lime border-2 border-line flex items-center justify-center text-ink font-bold shadow-hard">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-fg font-display">
                      Trưởng Bộ Phận / Quản Lý
                    </span>
                    <span className="px-2 py-0.5 text-[10px] rounded-md bg-surface border border-line text-fg font-mono font-bold">
                      {department.managerId.employeeCode}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-fg mt-0.5">{department.managerId.fullName}</h4>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-surface-2 border-2 border-dashed border-line rounded-2xl text-xs text-muted flex items-center space-x-2 font-medium">
              <UserCheck className="w-4 h-4 text-muted" />
              <span>Chưa bổ nhiệm Trưởng bộ phận chính thức cho đơn vị này.</span>
            </div>
          )}

          {/* Members Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-fg flex items-center space-x-2 font-display">
              <Users className="w-4 h-4 text-accent" />
              <span>Danh Sách Nhân Viên Trực Thuộc ({members.length})</span>
            </h4>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span className="text-xs font-bold">Đang tải danh sách nhân sự...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 bg-rose-500/10 border-2 border-line rounded-2xl text-rose-700 text-xs font-bold">
                {error}
              </div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center text-muted text-xs border-2 border-dashed border-line rounded-2xl font-bold">
                Chưa có nhân viên nào được phân bổ vào phòng ban này.
              </div>
            ) : (
              <div className="border-2 border-line rounded-2xl overflow-hidden bg-surface shadow-hard">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 border-b-2 border-line text-fg font-black uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Nhân Sự</th>
                      <th className="px-4 py-3">Mã NV</th>
                      <th className="px-4 py-3">Chức Vụ</th>
                      <th className="px-4 py-3">Liên Hệ</th>
                      <th className="px-4 py-3">Ngày Gia Nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-line font-medium">
                    {members.map((m) => (
                      <tr
                        key={m._id}
                        onClick={() => onViewUserDetail?.(m)}
                        className="hover:bg-surface-2 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 font-bold text-fg group-hover:text-accent transition-colors">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-line bg-surface-2 flex items-center justify-center text-xs font-bold text-fg shrink-0 shadow-hard">
                              {m.avatarUrl ? (
                                <img src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover" />
                              ) : (
                                m.fullName.charAt(0)
                              )}
                            </div>
                            <span>{m.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-fg text-xs">
                          {m.employeeCode}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border border-line bg-surface-2 text-fg">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-fg">
                          <div className="flex flex-col space-y-0.5 text-xs font-medium">
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-muted" />
                              <span>{m.email}</span>
                            </span>
                            {m.phone && (
                              <span className="flex items-center space-x-1 text-muted">
                                <Phone className="w-3 h-3" />
                                <span>{m.phone}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-fg font-mono text-xs">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-muted" />
                            <span>{formatDate(m.hireDate)}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-2 border-t-2 border-line">
          <span className="text-xs text-muted font-bold">Bấm vào hàng nhân sự để xem chi tiết hồ sơ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer uppercase tracking-wider"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
