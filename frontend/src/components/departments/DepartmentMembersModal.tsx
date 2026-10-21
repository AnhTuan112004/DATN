import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { usersApi } from '../../api/users';
import { DepartmentItem, UserItem } from '../../types/user';

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa rõ';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {department.code}
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">{department.name}</h3>
              <p className="text-xs text-slate-400">
                {department.parentDepartmentId ? 'Phòng ban Cấp 2' : 'Khối chức năng Cấp 1'} •{' '}
                <span className="text-indigo-400 font-medium">{members.length} nhân sự trực thuộc</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Manager Spotlight Card */}
          {department.managerId ? (
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Trưởng Bộ Phận / Quản Lý
                    </span>
                    <span className="px-2 py-0.2 text-[10px] rounded bg-indigo-500/10 text-indigo-300 font-mono">
                      {department.managerId.employeeCode}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{department.managerId.fullName}</h4>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span>Chưa bổ nhiệm Trưởng bộ phận chính thức cho đơn vị này.</span>
            </div>
          )}

          {/* Members Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Danh Sách Nhân Viên Trực Thuộc ({members.length})</span>
            </h4>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Đang tải danh sách nhân sự...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs">
                {error}
              </div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                Chưa có nhân viên nào được phân bổ vào phòng ban này.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Nhân Sự</th>
                      <th className="px-4 py-3">Mã NV</th>
                      <th className="px-4 py-3">Chức Vụ</th>
                      <th className="px-4 py-3">Liên Hệ</th>
                      <th className="px-4 py-3">Ngày Gia Nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => (
                      <tr
                        key={m._id}
                        onClick={() => onViewUserDetail?.(m)}
                        className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">
                              {m.avatarUrl ? (
                                <img src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover" />
                              ) : (
                                m.fullName.charAt(0)
                              )}
                            </div>
                            <span>{m.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-400 text-[11px]">
                          {m.employeeCode}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.role === 'CEO'
                                ? 'bg-purple-500/10 text-purple-400'
                                : m.role === 'HR_MANAGER'
                                ? 'bg-sky-500/10 text-sky-400'
                                : m.role === 'MANAGER'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <div className="flex flex-col space-y-0.5 text-[11px]">
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{m.email}</span>
                            </span>
                            {m.phone && (
                              <span className="flex items-center space-x-1 text-slate-500">
                                <Phone className="w-3 h-3" />
                                <span>{m.phone}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
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
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <span className="text-xs text-slate-500">Bấm vào hàng nhân sự để xem chi tiết hồ sơ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
