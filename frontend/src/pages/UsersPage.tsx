import React, { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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
  const { hasRole } = useAuth();
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
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Không thể tải danh sách nhân sự.';
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

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDept('');
    setSelectedRole('');
    setSelectedStatus('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
            Hồ sơ nhân sự
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Tổng số {total} nhân sự toàn doanh nghiệp.
          </p>
        </div>

        {/* Action Button */}
        {isCeoOrHr && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="app-button shrink-0 text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm nhân viên</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="app-surface p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc mã nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="app-input !pl-9 text-xs"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="app-input text-xs"
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
              className="app-input text-xs"
            >
              <option value="">Tất cả chức vụ</option>
              <option value="CEO">Giám đốc điều hành</option>
              <option value="HR_MANAGER">Quản lý nhân sự</option>
              <option value="MANAGER">Trưởng phòng</option>
              <option value="EMPLOYEE">Nhân viên</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="app-input text-xs"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Đã khóa tài khoản</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags & Reset */}
        {(search || selectedDept || selectedRole || selectedStatus) && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[var(--text-muted)]">Đang lọc theo:</span>
              {search && (
                <span className="px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                  Từ khóa: &quot;{search}&quot;
                </span>
              )}
              {selectedDept && (
                <span className="px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                  Phòng: {departments.find((d) => d._id === selectedDept)?.name}
                </span>
              )}
              {selectedRole && (
                <span className="px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                  Vai trò: {roleLabels[selectedRole] || selectedRole}
                </span>
              )}
              {selectedStatus && (
                <span className="px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                  Trạng thái: {selectedStatus === 'active' ? 'Đang làm việc' : 'Đã khóa'}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-[var(--accent)] hover:underline font-medium text-xs ml-auto shrink-0"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-[var(--radius)] text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchUsers}
            className="underline font-semibold hover:text-rose-800 dark:hover:text-rose-200 ml-2"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="app-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--text-muted)] font-medium">
              <tr>
                <th className="px-5 py-3">Nhân sự</th>
                <th className="px-4 py-3">Mã nhân viên</th>
                <th className="px-4 py-3">Phòng ban</th>
                <th className="px-4 py-3">Chức vụ</th>
                <th className="px-4 py-3">Phép năm</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent)]" />
                      <span>Đang tải danh sách nhân sự...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-7 h-7 text-[var(--text-muted)] mb-1" />
                      <span className="text-sm font-medium text-[var(--text)]">Không tìm thấy nhân sự phù hợp</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors group">
                    {/* User Profile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-semibold text-xs text-[var(--text)]">
                              {u.fullName.split(' ').pop()?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(u)}
                            className="font-medium text-xs text-[var(--text)] group-hover:text-[var(--accent)] transition-colors text-left"
                          >
                            {u.fullName}
                          </button>
                          <p className="text-[11px] text-[var(--text-muted)]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-[var(--text)] font-medium">
                        {u.employeeCode}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 text-[var(--text)]">
                      {u.departmentId ? (
                        <div>
                          <span className="font-medium text-xs text-[var(--text)]">{u.departmentId.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                            {u.departmentId.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-[11px]">Chưa phân bổ</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          u.role === 'CEO'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : u.role === 'HR_MANAGER'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : u.role === 'MANAGER'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>

                    {/* Leave Balance */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-medium text-[var(--text)]">
                        {u.leaveBalance?.annualRemaining ?? 12}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        /{u.leaveBalance?.annualTotal ?? 12} ngày
                      </span>
                      {u.leaveBalance?.seniorityBonusDays ? (
                        <span className="ml-1 text-[10px] text-[var(--accent)] font-semibold" title="Phép thâm niên Điều 114 BLLĐ">
                          (+{u.leaveBalance.seniorityBonusDays})
                        </span>
                      ) : null}
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.isActive
                            ? 'bg-[var(--success-bg)] text-[var(--success-text)] border border-emerald-500/20'
                            : 'bg-[var(--danger-bg)] text-[var(--danger-text)] border border-rose-500/20'
                        }`}
                      >
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
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-muted)] rounded-[var(--radius)] transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenAvatarModal(u)}
                          title="Tải ảnh đại diện"
                          aria-label={`Đổi ảnh đại diện của ${u.fullName}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-muted)] rounded-[var(--radius)] transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u)}
                          title="Xem chi tiết hồ sơ"
                          aria-label={`Xem hồ sơ của ${u.fullName}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-[var(--radius)] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)] gap-3">
          <div className="flex items-center space-x-2">
            <span>
              Hiển thị <span className="font-medium text-[var(--text)]">{users.length}</span> / {total} nhân sự
            </span>
            <span>&bull;</span>
            <div className="flex items-center space-x-1">
              <span>Mỗi trang:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-[var(--text)] px-2">
              Trang {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onUserUpdated={handleUserUpdated}
          onOpenAvatarUpload={(u) => handleOpenAvatarModal(u)}
          departments={departments}
          managers={managers}
        />
      )}

      {createModalOpen && (
        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onUserCreated={handleUserCreated}
          departments={departments}
          managers={managers}
        />
      )}

      {avatarTargetUser && (
        <AvatarUploadModal
          user={avatarTargetUser}
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          onSuccess={handleUserUpdated}
        />
      )}

      {faceEnrollTargetUser && (
        <FaceEnrollmentModal
          user={faceEnrollTargetUser}
          isOpen={faceEnrollModalOpen}
          onClose={() => setFaceEnrollModalOpen(false)}
          onEnrollmentSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UsersPage;
