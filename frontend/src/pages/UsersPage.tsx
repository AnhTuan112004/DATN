import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Briefcase,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi, GetUsersParams } from '../api/users';
import { departmentsApi } from '../api/departments';
import { UserItem, DepartmentItem } from '../types/user';
import { UserDetailModal } from '../components/users/UserDetailModal';
import { CreateUserModal } from '../components/users/CreateUserModal';
import { AvatarUploadModal } from '../components/users/AvatarUploadModal';
import { FaceEnrollmentModal } from '../components/users/FaceEnrollmentModal';

const roleLabels: Record<string, string> = {
  CEO: 'Giám đốc điều hành',
  HR_MANAGER: 'Quản lý nhân sự',
  MANAGER: 'Trưởng phòng',
  EMPLOYEE: 'Nhân viên',
};

export const UsersPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isCeoOrHr = hasRole(['CEO', 'HR_MANAGER']);

  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [managers, setManagers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarTargetUser, setAvatarTargetUser] = useState<UserItem | null>(null);
  const [faceEnrollModalOpen, setFaceEnrollModalOpen] = useState(false);
  const [faceEnrollTargetUser, setFaceEnrollTargetUser] = useState<UserItem | null>(null);

  // Modal Chấm dứt hợp đồng / Cho thôi việc
  const [terminateTargetUser, setTerminateTargetUser] = useState<UserItem | null>(null);
  const [terminateReason, setTerminateReason] = useState<string>('Thỏa thuận chấm dứt hợp đồng lao động');
  const [terminating, setTerminating] = useState<boolean>(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  // Fetch departments list
  useEffect(() => {
    departmentsApi
      .getAllDepartments()
      .then((res) => {
        setDepartments(res.data);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách phòng ban:', err);
      });
  }, []);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetUsersParams = {
        page,
        limit,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedDept) params.departmentId = selectedDept;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus !== '') params.isActive = selectedStatus === 'active';

      const res = await usersApi.getUsers(params);
      setUsers(res.users);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);

      const mgrList = res.users.filter((u) => ['CEO', 'HR_MANAGER', 'MANAGER'].includes(u.role));
      setManagers(mgrList);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Không thể tải danh sách nhân sự.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedDept, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDetail = (u: UserItem) => {
    setSelectedUser(u);
    setDetailModalOpen(true);
  };

  const handleOpenAvatarModal = (u: UserItem) => {
    setAvatarTargetUser(u);
    setAvatarModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: UserItem) => {
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
    if (selectedUser?._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
  };

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleConfirmTerminate = async () => {
    if (!terminateTargetUser) return;
    if (!terminateReason.trim()) {
      setTerminateError('Vui lòng nhập lý do chấm dứt hợp đồng theo quy định.');
      return;
    }

    setTerminating(true);
    setTerminateError(null);
    try {
      await usersApi.deleteUser(terminateTargetUser._id, terminateReason.trim());
      setTerminateTargetUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      setTerminateError(
        axiosErr.response?.data?.error ||
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Không thể chấm dứt hợp đồng. Vui lòng thử lại.'
      );
    } finally {
      setTerminating(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDept('');
    setSelectedRole('');
    setSelectedStatus('');
    setPage(1);
  };

  // Quick stats calculations
  const activeCount = users.filter((u) => u.isActive).length;
  const managerCount = users.filter((u) => ['CEO', 'HR_MANAGER', 'MANAGER'].includes(u.role)).length;
  const unassignedDeptCount = users.filter((u) => !u.departmentId).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-white">
      {/* 1. Header & KPI Bento */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-1 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase">
              Hệ Thống Quản Lý Nhân Sự (HRIS)
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Tổng số {total} nhân sự</span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-white leading-tight">
            Hồ Sơ Nhân Sự Toàn Doanh Nghiệp
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Quản lý danh sách nhân viên, thông tin hợp đồng, phân bổ phòng ban, số dư phép năm và cấp quyền FaceID Kiosk.
          </p>
        </div>

        {/* Action Button */}
        {isCeoOrHr && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Nhân Viên Mới</span>
          </button>
        )}
      </div>

      {/* Quick KPI Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs text-slate-400 block font-medium">Tổng nhân sự</span>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">{total}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-800/40 transition-colors">
          <span className="text-xs text-emerald-400 font-medium block flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Đang làm việc
          </span>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">{activeCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-800/40 transition-colors">
          <span className="text-xs text-teal-400 font-medium block flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> Lãnh đạo & Quản lý
          </span>
          <span className="text-2xl font-bold text-teal-300 font-mono mt-1 block">{managerCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-800/40 transition-colors">
          <span className="text-xs text-amber-400 font-medium block flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Chưa phân phòng
          </span>
          <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">{unassignedDeptCount}</span>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc mã nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Tất cả chức vụ</option>
              <option value="CEO">Giám đốc điều hành (CEO)</option>
              <option value="HR_MANAGER">Quản lý nhân sự (HR)</option>
              <option value="MANAGER">Trưởng phòng (Manager)</option>
              <option value="EMPLOYEE">Nhân viên (Employee)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Đã khóa tài khoản</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags & Reset */}
        {(search || selectedDept || selectedRole || selectedStatus) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400">Đang lọc theo:</span>
              {search && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700 text-[11px] font-medium">
                  Từ khóa: &quot;{search}&quot;
                </span>
              )}
              {selectedDept && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700 text-[11px] font-medium">
                  Phòng: {departments.find((d) => d._id === selectedDept)?.name}
                </span>
              )}
              {selectedRole && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 text-[11px] font-medium">
                  Vai trò: {roleLabels[selectedRole] || selectedRole}
                </span>
              )}
              {selectedStatus && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700 text-[11px] font-medium">
                  Trạng thái: {selectedStatus === 'active' ? 'Đang làm việc' : 'Đã khóa'}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-teal-400 hover:text-teal-300 font-semibold text-xs ml-auto shrink-0 transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchUsers}
            className="underline font-bold hover:text-white ml-2 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Main Table Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium tracking-wide">
              <tr>
                <th className="px-5 py-3">Nhân sự</th>
                <th className="px-4 py-3">Mã NV</th>
                <th className="px-4 py-3">Phòng ban</th>
                <th className="px-4 py-3">Chức vụ</th>
                <th className="px-4 py-3">Phép năm</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                      <span className="text-xs">Đang tải danh sách nhân sự...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <Filter className="w-7 h-7 text-slate-600 mb-1" />
                      <span className="text-xs font-semibold text-white">Không tìm thấy nhân sự phù hợp</span>
                      <span className="text-[11px] text-slate-400">
                        Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className={`hover:bg-slate-800/30 transition-colors group border-l-2 ${
                      u.isActive ? 'border-l-teal-500/60' : 'border-l-rose-500/60'
                    }`}
                  >
                    {/* User Profile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-semibold text-xs text-teal-300">
                              {u.fullName.split(' ').pop()?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(u)}
                            className="font-semibold text-xs text-white group-hover:text-teal-400 transition-colors text-left cursor-pointer"
                          >
                            {u.fullName}
                          </button>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-slate-300 font-medium">
                        {u.employeeCode}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 text-slate-200">
                      {u.departmentId ? (
                        <div>
                          <span className="font-medium text-xs text-slate-200">{u.departmentId.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {u.departmentId.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa phân bổ</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          u.role === 'CEO'
                            ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                            : u.role === 'HR_MANAGER'
                            ? 'bg-teal-950/40 text-teal-300 border-teal-800/40'
                            : u.role === 'MANAGER'
                            ? 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>

                    {/* Leave Balance */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-semibold text-white">
                        {u.leaveBalance?.annualRemaining ?? 12}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        /{u.leaveBalance?.annualTotal ?? 12} ngày
                      </span>
                      {u.leaveBalance?.seniorityBonusDays ? (
                        <span className="ml-1 text-[10px] text-emerald-400 font-medium" title="Phép thâm niên Điều 114 BLLĐ">
                          (+{u.leaveBalance.seniorityBonusDays})
                        </span>
                      ) : null}
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          u.isActive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        {u.isActive ? 'Đang làm việc' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {isCeoOrHr && (
                          <button
                            type="button"
                            onClick={() => {
                              setFaceEnrollTargetUser(u);
                              setFaceEnrollModalOpen(true);
                            }}
                            title="Lấy mẫu FaceID trực tiếp có HR giám sát (Luật BVDLCN)"
                            aria-label={`Lấy mẫu FaceID cho ${u.fullName}`}
                            className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenAvatarModal(u)}
                          title="Tải ảnh đại diện"
                          aria-label={`Đổi ảnh đại diện của ${u.fullName}`}
                          className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u)}
                          title="Xem chi tiết hồ sơ"
                          aria-label={`Xem hồ sơ của ${u.fullName}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isCeoOrHr && u.isActive !== false && u.role !== 'CEO' && u._id !== user?._id && (
                          <button
                            type="button"
                            onClick={() => {
                              setTerminateTargetUser(u);
                              setTerminateReason('Thỏa thuận chấm dứt hợp đồng lao động');
                              setTerminateError(null);
                            }}
                            title="Chấm dứt hợp đồng / Cho thôi việc"
                            aria-label={`Chấm dứt hợp đồng đối với ${u.fullName}`}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-800 text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span>Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>/ trang · Tổng số <strong className="text-white">{total}</strong> nhân sự</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 font-mono text-xs text-slate-300">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailModalOpen && selectedUser && (
        <UserDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          user={selectedUser}
          departments={departments}
          managers={managers}
          onUserUpdated={handleUserUpdated}
          onOpenAvatarUpload={handleOpenAvatarModal}
        />
      )}

      {createModalOpen && (
        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          departments={departments}
          managers={managers}
          onUserCreated={handleUserCreated}
        />
      )}

      {avatarModalOpen && avatarTargetUser && (
        <AvatarUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          user={avatarTargetUser}
          onSuccess={handleUserUpdated}
        />
      )}

      {faceEnrollModalOpen && faceEnrollTargetUser && (
        <FaceEnrollmentModal
          isOpen={faceEnrollModalOpen}
          onClose={() => setFaceEnrollModalOpen(false)}
          user={faceEnrollTargetUser}
          onEnrollmentSuccess={() => {
            fetchUsers();
          }}
        />
      )}

      {/* Modal Chấm dứt hợp đồng / Cho thôi việc */}
      {terminateTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Chấm Dứt Hợp Đồng & Cho Thôi Việc</h3>
                <p className="text-xs text-slate-400">Quyết định nhân sự kết thúc công tác</p>
              </div>
            </div>

            {terminateError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {terminateError}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white">
                  {terminateTargetUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{terminateTargetUser.fullName}</div>
                  <div className="text-xs text-slate-400">
                    Mã NV: <span className="font-mono text-slate-200">{terminateTargetUser.employeeCode}</span> • Chức danh: {roleLabels[terminateTargetUser.role] || terminateTargetUser.role}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Căn cứ / Lý do kết thúc công tác <span className="text-rose-400">*</span>
                </label>
                <select
                  className="w-full mb-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                  onChange={(e) => setTerminateReason(e.target.value)}
                  value={terminateReason}
                >
                  <option value="Thỏa thuận chấm dứt hợp đồng lao động">Thỏa thuận chấm dứt hợp đồng lao động (Điều 34 BLLĐ)</option>
                  <option value="Hết hạn hợp đồng lao động">Hết hạn hợp đồng lao động (Điều 34 BLLĐ)</option>
                  <option value="Đơn phương chấm dứt hợp đồng do không hoàn thành KPI">Đơn phương chấm dứt HĐLĐ do không hoàn thành KPI (Điều 36 BLLĐ)</option>
                  <option value="Kỷ luật sa thải theo Điều 125 BLLĐ 2019">Kỷ luật sa thải theo Điều 125 BLLĐ 2019</option>
                  <option value="Người lao động tự ý bỏ việc không lý do chính đáng">Tự ý bỏ việc từ 5 ngày làm việc liên tục (Điều 36 BLLĐ)</option>
                  <option value="Khác">Lý do khác...</option>
                </select>
                <textarea
                  rows={2}
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  placeholder="Ghi rõ chi tiết lý do kết thúc công tác..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Quy trình tự động của hệ thống:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                    <li>Khóa tài khoản và chặn đăng nhập của nhân sự ngay lập tức.</li>
                    <li>Xóa vĩnh viễn vector FaceID theo Luật Bảo vệ dữ liệu cá nhân.</li>
                    <li>Tự động gửi Email thông báo chính thức đến hộp thư của người lao động.</li>
                    <li>Ghi nhận nhật ký kiểm toán (Audit Log) lưu vết người thực hiện.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={terminating}
                onClick={() => setTerminateTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={terminating}
                onClick={handleConfirmTerminate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {terminating ? 'Đang xử lý...' : 'Xác nhận chấm dứt hợp đồng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
