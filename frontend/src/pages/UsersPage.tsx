import React, { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Shield,
  Clock,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
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

export const UsersPage: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth();
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

  // Stats calculation
  const stats = {
    total: total,
    active: users.filter((u) => u.isActive).length,
    probation: users.filter((u) => u.contracts?.[0]?.contractType === 'PROBATION').length,
    leaders: users.filter((u) => ['CEO', 'HR_MANAGER', 'MANAGER'].includes(u.role)).length,
  };

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

      // Lưu danh sách các quản lý để chọn khi tạo mới
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

  // Handle open user detail
  const handleOpenDetail = (u: UserItem) => {
    setSelectedUser(u);
    setDetailModalOpen(true);
  };

  // Handle open avatar modal
  const handleOpenAvatarModal = (u: UserItem) => {
    setAvatarTargetUser(u);
    setAvatarModalOpen(true);
  };

  // Handle user updated from modal
  const handleUserUpdated = (updatedUser: UserItem) => {
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
    if (selectedUser?._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
  };

  // Handle user created
  const handleUserCreated = () => {
    fetchUsers();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedDept('');
    setSelectedRole('');
    setSelectedStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Hệ Thống HRM</span>
            <span>&bull;</span>
            <span className="text-indigo-400 font-medium">Quản Trị Hồ Sơ Nhân Sự</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center space-x-3">
            <span>Danh Bạ & Hồ Sơ Nhân Sự</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {total} nhân sự
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bảo vệ Projection an toàn: Tuyệt đối ẩn `salaryConfig` và `refreshTokens[]`. Tuân thủ Điều 114 BLLĐ về số
            dư phép năm.
          </p>
        </div>

        {/* Action Button */}
        {isCeoOrHr && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Mới Nhân Viên</span>
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng Nhân Sự</span>
            <UsersIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-100 font-mono mt-2">{total}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Toàn công ty ({currentUser?.companyId || 'DATN'})</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Đang Hoạt Động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{stats.active}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Tài khoản hợp lệ</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">HĐ Thử Việc</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono mt-2">{stats.probation}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">HĐ loại PROBATION</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Cấp Quản Trị</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 font-mono mt-2">{stats.leaders}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">CEO, HR Mgr & Dept Mgr</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc mã NV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tất cả chức vụ</option>
              <option value="CEO">Tổng Giám Đốc (CEO)</option>
              <option value="HR_MANAGER">Quản Lý Nhân Sự (HR)</option>
              <option value="MANAGER">Trưởng Phòng Ban (Mgr)</option>
              <option value="EMPLOYEE">Nhân Viên (Employee)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Đã vô hiệu hóa</option>
            </select>

            <button
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {error && (
          <div className="m-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Nhân Sự</th>
                <th className="px-4 py-3.5">Mã NV</th>
                <th className="px-4 py-3.5">Phòng Ban</th>
                <th className="px-4 py-3.5">Chức Vụ</th>
                <th className="px-4 py-3.5">Phép Năm (Đ114)</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Đang tải danh bạ nhân sự...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-600 mb-1" />
                      <span className="text-sm font-medium text-slate-400">Không tìm thấy nhân sự phù hợp</span>
                      <span className="text-xs text-slate-600">
                        Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(u)}
                  >
                    {/* User Profile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-xs text-indigo-400">
                                {u.fullName.split(' ').pop()?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                            {u.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-medium text-[11px]">
                        {u.employeeCode}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {u.departmentId ? (
                        <div>
                          <span className="font-medium text-slate-200">{u.departmentId.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {u.departmentId.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Chưa phân bổ</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          u.role === 'CEO'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : u.role === 'HR_MANAGER'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                            : u.role === 'MANAGER'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Leave Balance */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-semibold text-slate-200">
                        {u.leaveBalance?.annualRemaining ?? 12}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        /{u.leaveBalance?.annualTotal ?? 12} ngày
                      </span>
                      {u.leaveBalance?.seniorityBonusDays ? (
                        <span className="ml-1 text-[10px] text-indigo-400 font-semibold" title="Phép thâm niên Điều 114">
                          (+{u.leaveBalance.seniorityBonusDays})
                        </span>
                      ) : null}
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {u.isActive ? 'Đang làm việc' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        {isCeoOrHr && (
                          <button
                            type="button"
                            onClick={() => {
                              setFaceEnrollTargetUser(u);
                              setFaceEnrollModalOpen(true);
                            }}
                            title="Lấy mẫu FaceID trực tiếp có HR giám sát (Luật BVDLCN)"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenAvatarModal(u)}
                          title="Tải ảnh đại diện Cloudinary"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u)}
                          title="Xem chi tiết hồ sơ, hợp đồng & sinh trắc học"
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span>
              Hiển thị <span className="font-semibold text-slate-200">{users.length}</span> / {total} nhân sự
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
                className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
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
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              Trang {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
