import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const { user, refreshUser, hasRole } = useAuth();
  const isCeoOrHr = hasRole(['CEO', 'HR_MANAGER']);

  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [managers, setManagers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyStats, setCompanyStats] = useState<{
    totalEmployees: number;
    activeCount: number;
    leadershipCount: number;
    unassignedDeptCount: number;
  } | null>(null);

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
      if (res.stats) {
        setCompanyStats(res.stats);
      }

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
    if (!updatedUser) return;
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
    if (selectedUser?._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
    if (user?._id === updatedUser._id) {
      refreshUser?.();
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

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-fg">
      {/* 1. Header & KPI Bento */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-2 border-b-2 border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-muted bg-surface-2 border border-line px-2 py-0.5 rounded uppercase tracking-wider">
              Hệ Thống Quản Lý Nhân Sự (HRIS)
            </span>
            <span className="text-muted">·</span>
            <span className="text-xs text-muted font-medium">Tổng số {total} nhân sự</span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-fg leading-tight font-display">
            Hồ sơ nhân sự toàn doanh nghiệp
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            Quản lý danh sách nhân viên, thông tin hợp đồng, phân bổ phòng ban, số dư phép năm và cấp quyền FaceID Kiosk.
          </p>
        </div>

        {/* Action Button */}
        {isCeoOrHr && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-lime text-ink border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 text-xs font-semibold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-ink" strokeWidth={2.5} />
            <span>Thêm nhân viên mới</span>
          </button>
        )}
      </div>

      {/* Compact Status Chips Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border-2 border-line shadow-hard-sm">
          <span className="text-muted font-medium">Tổng nhân sự:</span>
          <span className="font-bold text-fg font-mono">{total}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border-2 border-line shadow-hard-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-muted font-medium">Đang làm việc:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{companyStats?.activeCount ?? total}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border-2 border-line shadow-hard-sm">
          <span className="text-muted font-medium">Lãnh đạo &amp; Quản lý:</span>
          <span className="font-bold text-sky-700 dark:text-sky-300 font-mono">{companyStats?.leadershipCount ?? managers.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border-2 border-line shadow-hard-sm">
          <span className="text-muted font-medium">Chưa phân phòng:</span>
          <span className="font-bold text-muted font-mono">{companyStats?.unassignedDeptCount ?? 0}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border-2 border-line shadow-hard-sm sm:ml-auto">
          <span className="text-muted font-medium">Trang:</span>
          <span className="font-bold text-primary font-mono">{page}/{totalPages || 1}</span>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="rounded-2xl bg-surface border-2 border-line p-4 shadow-hard space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc mã nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted text-xs focus:outline-none focus:border-primary transition font-medium"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-fg text-xs focus:outline-none focus:border-primary cursor-pointer font-medium"
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
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-fg text-xs focus:outline-none focus:border-primary cursor-pointer font-medium"
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
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-fg text-xs focus:outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Đã khóa tài khoản</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags & Reset */}
        {(search || selectedDept || selectedRole || selectedStatus) && (
          <div className="flex items-center justify-between pt-3 border-t border-line/40 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted">Đang lọc theo:</span>
              {search && (
                <span className="px-2 py-0.5 rounded-md bg-surface-2 text-fg border border-line text-[11px] font-medium font-mono">
                  Từ khóa: &quot;{search}&quot;
                </span>
              )}
              {selectedDept && (
                <span className="px-2 py-0.5 rounded-md bg-surface-2 text-fg border border-line text-[11px] font-medium">
                  Phòng: {departments.find((d) => d._id === selectedDept)?.name}
                </span>
              )}
              {selectedRole && (
                <span className="px-2 py-0.5 rounded-md bg-surface-2 text-fg border border-line text-[11px] font-medium">
                  Vai trò: {roleLabels[selectedRole] || selectedRole}
                </span>
              )}
              {selectedStatus && (
                <span className="px-2 py-0.5 rounded-md bg-surface-2 text-fg border border-line text-[11px] font-medium">
                  Trạng thái: {selectedStatus === 'active' ? 'Đang làm việc' : 'Đã khóa'}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-primary hover:underline font-bold text-xs ml-auto shrink-0 transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-peach/30 border-2 border-line rounded-xl text-ink text-xs flex items-center justify-between shadow-hard-sm">
          <span>{error}</span>
          <button
            onClick={fetchUsers}
            className="underline font-bold hover:text-primary ml-2 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Main Table Card */}
      <div className="rounded-2xl bg-surface border-2 border-line overflow-hidden shadow-hard">
        {/* Mobile View: Stacked Cards (Visible on sm:hidden) */}
        <div className="space-y-3 p-3 sm:hidden">
          {loading ? (
            <div className="py-12 text-center text-muted">
              <RefreshCw className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
              <span>Đang tải danh sách nhân sự...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted">
              <p className="text-xs font-semibold text-fg">Không tìm thấy nhân sự</p>
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                className={`p-4 rounded-xl bg-surface border-2 border-line shadow-hard-sm space-y-3 border-l-4 ${
                  u.isActive ? 'border-l-emerald-500' : 'border-l-rose-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-line bg-surface-2 flex items-center justify-center shrink-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-xs text-primary font-mono">
                          {u.fullName.split(' ').pop()?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(u)}
                        className="font-semibold text-xs text-fg hover:text-primary text-left cursor-pointer"
                      >
                        {u.fullName}
                      </button>
                      <p className="text-[11px] text-muted font-mono">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${
                      u.isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {u.isActive ? 'Đang làm việc' : 'Đã khóa'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-line/30">
                  <div>
                    <span className="text-[10px] text-muted block">Mã &amp; Phòng:</span>
                    <span className="font-mono text-[11px] text-fg font-semibold">{u.employeeCode}</span>
                    <span className="text-[11px] text-muted block truncate">{u.departmentId?.name || 'Chưa phân bổ'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Vai trò &amp; Phép:</span>
                    <span className="text-[11px] font-semibold text-fg block">{u.role}</span>
                    <span className="font-mono text-[11px] text-primary font-bold">{u.leaveBalance?.annualRemaining ?? 12} ngày còn lại</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/30">
                  {(isCeoOrHr || u._id === user?._id) && (
                    <button
                      type="button"
                      onClick={() => handleOpenAvatarModal(u)}
                      className="px-2.5 py-1 text-fg bg-surface-2 hover:bg-surface border border-line rounded-lg text-xs cursor-pointer shadow-xs"
                    >
                      Đổi ảnh
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(u)}
                    className="px-3 py-1 bg-lime text-ink border border-line rounded-lg text-xs font-semibold cursor-pointer shadow-xs hover:translate-x-0.5 hover:translate-y-0.5 transition"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table (Hidden on Mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b-2 border-line text-muted font-mono font-bold text-[10px] uppercase tracking-wider">
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
            <tbody className="divide-y divide-line/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-muted">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-xs">Đang tải danh sách nhân sự...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-muted">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <Filter className="w-7 h-7 text-muted mb-1 opacity-50" />
                      <span className="text-xs font-semibold text-fg">Không tìm thấy nhân sự phù hợp</span>
                      <span className="text-[11px] text-muted">
                        Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-surface-2/60 transition-colors group"
                  >
                    {/* User Profile with Left Border */}
                    <td className={`px-5 py-3.5 border-l-4 ${u.isActive ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-line bg-surface-2 flex items-center justify-center shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-semibold text-xs text-primary font-mono">
                              {u.fullName.split(' ').pop()?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(u)}
                            className="font-semibold text-xs text-fg group-hover:text-primary transition-colors text-left cursor-pointer"
                          >
                            {u.fullName}
                          </button>
                          <p className="text-[11px] text-muted font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-fg font-bold">
                        {u.employeeCode}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5">
                      {u.departmentId ? (
                        <div>
                          <span className="font-semibold text-xs text-fg">{u.departmentId.name}</span>
                          <span className="text-[10px] text-muted block font-mono">
                            {u.departmentId.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted italic text-[11px]">Chưa phân bổ</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          u.role === 'CEO'
                            ? 'bg-lilac text-ink border-line'
                            : u.role === 'HR_MANAGER'
                            ? 'bg-sky text-ink border-line'
                            : u.role === 'MANAGER'
                            ? 'bg-peach text-ink border-line'
                            : 'bg-surface-2 text-fg border-line/60 font-medium'
                        }`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>

                    {/* Leave Balance */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-bold text-fg">
                        {u.leaveBalance?.annualRemaining ?? 12}
                      </span>
                      <span className="text-[11px] text-muted">
                        /{u.leaveBalance?.annualTotal ?? 12} ngày
                      </span>
                      {u.leaveBalance?.seniorityBonusDays ? (
                        <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold" title="Phép thâm niên Điều 114 BLLĐ">
                          (+{u.leaveBalance.seniorityBonusDays})
                        </span>
                      ) : null}
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                          u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
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
                            className="p-1.5 text-muted hover:text-fg hover:bg-surface-2 rounded-lg border border-transparent hover:border-line transition cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenAvatarModal(u)}
                          title="Tải ảnh đại diện"
                          aria-label={`Đổi ảnh đại diện của ${u.fullName}`}
                          className="p-1.5 text-muted hover:text-fg hover:bg-surface-2 rounded-lg border border-transparent hover:border-line transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u)}
                          title="Xem chi tiết hồ sơ"
                          aria-label={`Xem hồ sơ của ${u.fullName}`}
                          className="p-1.5 text-muted hover:text-fg hover:bg-surface-2 rounded-lg border border-transparent hover:border-line transition cursor-pointer"
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
                            className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-400 transition cursor-pointer"
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t-2 border-line bg-surface-2/40 text-xs text-muted gap-3">
          <div className="flex items-center space-x-2">
            <span>Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-surface border border-line text-fg text-xs focus:outline-none cursor-pointer font-mono font-medium shadow-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>/ trang · Tổng số <strong className="text-fg font-mono">{total}</strong> nhân sự</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-fg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 font-mono text-xs text-fg font-bold">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-fg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
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
      {terminateTargetUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-lg bg-surface border-2 border-line rounded-3xl shadow-hard-lg p-6 text-fg">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-line">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border-2 border-line flex items-center justify-center text-rose-700 shadow-hard">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-fg font-display">Chấm Dứt Hợp Đồng & Cho Thôi Việc</h3>
                <p className="text-xs text-muted font-medium">Quyết định nhân sự kết thúc công tác</p>
              </div>
            </div>

            {terminateError && (
              <div className="mt-4 p-3 bg-rose-500/10 border-2 border-line rounded-xl text-xs font-bold text-rose-700">
                {terminateError}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="p-3.5 bg-surface-2 rounded-2xl border-2 border-line flex items-center gap-3 shadow-hard">
                <div className="w-10 h-10 rounded-xl bg-lime border-2 border-line flex items-center justify-center font-black text-ink shadow-hard">
                  {terminateTargetUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-fg text-sm">{terminateTargetUser.fullName}</div>
                  <div className="text-xs text-muted font-medium mt-0.5">
                    Mã NV: <span className="font-mono font-bold text-fg">{terminateTargetUser.employeeCode}</span> • Chức danh: {roleLabels[terminateTargetUser.role] || terminateTargetUser.role}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  Căn cứ / Lý do kết thúc công tác <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full mb-2 bg-surface-2 border-2 border-line rounded-xl px-3 py-2 text-xs text-fg focus:outline-none focus:border-accent cursor-pointer font-medium shadow-hard"
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
                  className="w-full bg-surface-2 border-2 border-line rounded-xl p-3 text-xs text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
                />
              </div>

              <div className="p-3.5 bg-amber-400/20 border-2 border-line rounded-2xl flex items-start gap-2.5 text-xs text-fg shadow-hard font-medium">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-fg font-display">Quy trình tự động của hệ thống:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-fg">
                    <li>Khóa tài khoản và chặn đăng nhập của nhân sự ngay lập tức.</li>
                    <li>Xóa vĩnh viễn vector FaceID theo Luật Bảo vệ dữ liệu cá nhân.</li>
                    <li>Tự động gửi Email thông báo chính thức đến hộp thư của người lao động.</li>
                    <li>Ghi nhận nhật ký kiểm toán (Audit Log) lưu vết người thực hiện.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t-2 border-line">
              <button
                type="button"
                disabled={terminating}
                onClick={() => setTerminateTargetUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-fg border-2 border-line hover:bg-surface-2 transition cursor-pointer shadow-hard"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={terminating}
                onClick={handleConfirmTerminate}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border-2 border-line shadow-hard transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:opacity-50"
              >
                {terminating ? 'Đang xử lý...' : 'Xác nhận chấm dứt hợp đồng'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsersPage;
