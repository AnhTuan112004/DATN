import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  FolderTree,
  Plus,
  RefreshCw,
  Users,
  UserCheck,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  AlertCircle,
  CheckCircle2,
  Search,
  LayoutGrid,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { departmentsApi } from '../api/departments';
import { usersApi } from '../api/users';
import { DepartmentItem, UserItem } from '../types/user';
import { DepartmentModal } from '../components/departments/DepartmentModal';
import { DepartmentMembersModal } from '../components/departments/DepartmentMembersModal';
import { UserDetailModal } from '../components/users/UserDetailModal';

export const DepartmentsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isCeoOrHr = hasRole(['CEO', 'HR_MANAGER']);
  const isCeo = hasRole(['CEO']);

  // Data states
  const [departmentTree, setDepartmentTree] = useState<DepartmentItem[]>([]);
  const [managers, setManagers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // View mode: 'tree' | 'grid'
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [search, setSearch] = useState('');

  // Expanded nodes in tree
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<DepartmentItem | null>(null);
  const [parentDeptForNew, setParentDeptForNew] = useState<DepartmentItem | null>(null);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedDeptForMembers, setSelectedDeptForMembers] = useState<DepartmentItem | null>(null);

  const [selectedUserDetail, setSelectedUserDetail] = useState<UserItem | null>(null);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);

  // Load tree and potential managers
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [treeRes, usersRes] = await Promise.all([
        departmentsApi.getDepartmentTree(),
        usersApi.getUsers({ limit: 100 }),
      ]);

      setDepartmentTree(treeRes.data);

      // Mặc định mở rộng tất cả các khối cấp 1
      const defaultExpanded: Record<string, boolean> = {};
      treeRes.data.forEach((root) => {
        defaultExpanded[root._id] = true;
      });
      setExpandedNodes(defaultExpanded);

      // Lọc danh sách quản lý tiềm năng
      const eligibleManagers = usersRes.users.filter((u) =>
        ['CEO', 'HR_MANAGER', 'MANAGER'].includes(u.role)
      );
      setManagers(eligibleManagers);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Không thể tải dữ liệu sơ đồ phòng ban.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Toggle tree node expansion
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open create root department
  const handleOpenCreateRoot = () => {
    setDeptToEdit(null);
    setParentDeptForNew(null);
    setDeptModalOpen(true);
  };

  // Open create child department
  const handleOpenCreateChild = (parentDept: DepartmentItem) => {
    setDeptToEdit(null);
    setParentDeptForNew(parentDept);
    setDeptModalOpen(true);
  };

  // Open edit department
  const handleOpenEdit = (dept: DepartmentItem) => {
    setDeptToEdit(dept);
    setParentDeptForNew(null);
    setDeptModalOpen(true);
  };

  // Open members modal
  const handleOpenMembers = (dept: DepartmentItem) => {
    setSelectedDeptForMembers(dept);
    setMembersModalOpen(true);
  };

  // Open user detail from member list
  const handleViewUserDetail = (user: UserItem) => {
    setSelectedUserDetail(user);
    setUserDetailModalOpen(true);
  };

  // Delete department
  const handleDelete = async (dept: DepartmentItem) => {
    const isRoot = !dept.parentDepartmentId;
    const confirmText = `Bạn có chắc chắn muốn xóa ${isRoot ? 'Khối' : 'Phòng ban'} "${dept.name}" (${dept.code})?`;
    if (!window.confirm(confirmText)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await departmentsApi.deleteDepartment(dept._id);
      setSuccessMsg(res.message || 'Đã xóa phòng ban thành công.');
      fetchDepartments();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Không thể xóa phòng ban. Hãy đảm bảo không còn phòng ban con hoặc nhân viên trực thuộc.';
      setError(errMsg);
    }
  };

  // Calculate statistics
  const totalRoots = departmentTree.length;
  const totalChildren = departmentTree.reduce((acc, root) => acc + (root.children?.length || 0), 0);
  const totalDepts = totalRoots + totalChildren;
  const totalAssignedStaff = departmentTree.reduce((acc, root) => {
    let sum = root.employeeCount || 0;
    if (root.children) {
      root.children.forEach((c) => {
        sum += c.employeeCount || 0;
      });
    }
    return acc + sum;
  }, 0);

  // Filtered department list for search
  const filteredTree = departmentTree.filter((root) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const matchRoot = root.name.toLowerCase().includes(q) || root.code.toLowerCase().includes(q);
    const matchChild = root.children?.some(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
    return matchRoot || matchChild;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Hệ Thống HRM</span>
            <span>&bull;</span>
            <span className="text-indigo-400 font-medium">Cơ Cấu Tổ Chức</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center space-x-3">
            <span>Sơ Đồ Cây Phòng Ban</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              2 Cấp Tối Đa
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hiến pháp v6.1: Giới hạn nghiêm ngặt 2 cấp (Khối Cấp 1 &rarr; Phòng ban Cấp 2). Chặn xóa đơn vị khi còn con
            hoặc nhân sự trực thuộc.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => fetchDepartments()}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Làm mới sơ đồ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isCeoOrHr && (
            <button
              onClick={handleOpenCreateRoot}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khối / Phòng Ban</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng Phòng Ban</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-100 font-mono mt-2">{totalDepts}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Toàn bộ cơ cấu tổ chức</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Khối Chức Năng (Cấp 1)</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 font-mono mt-2">{totalRoots}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Trực thuộc Ban Giám Đốc</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Phòng Ban Con (Cấp 2)</span>
            <GitBranch className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 font-mono mt-2">{totalChildren}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Trực thuộc các khối</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Nhân Sự Đã Phân Bổ</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{totalAssignedStaff}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Đang hoạt động trong sơ đồ</span>
        </div>
      </div>

      {/* Control Bar: View Mode & Search */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên khối hoặc mã phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Sơ Đồ Cây</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Lưới Thẻ</span>
          </button>
        </div>
      </div>

      {/* Notification / Error alerts */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE TREE CHART (SƠ ĐỒ CÂY 2 CẤP) */}
      {viewMode === 'tree' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2 bg-slate-900/40 border border-slate-800 rounded-3xl">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs">Đang tải và dựng cây phân cấp phòng ban...</span>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-400">Không tìm thấy phòng ban nào phù hợp</p>
              <p className="text-xs text-slate-600">Thử tìm kiếm với từ khóa khác hoặc tạo khối phòng ban mới.</p>
            </div>
          ) : (
            filteredTree.map((root) => {
              const isExpanded = !!expandedNodes[root._id];
              const hasChildren = root.children && root.children.length > 0;

              return (
                <div
                  key={root._id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 hover:border-slate-700/80 transition-all"
                >
                  {/* Root Department Card (Cấp 1) */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/20 border border-indigo-500/30 rounded-2xl shadow-inner">
                    <div className="flex items-center space-x-3.5">
                      <button
                        onClick={() => toggleNode(root._id)}
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
                        <Layers className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-100">{root.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                            {root.code}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full">
                            Khối Cấp 1
                          </span>
                        </div>

                        {root.description && (
                          <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-1">
                            {root.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Actions of Root */}
                    <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto text-xs">
                      {/* Manager */}
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-400">Trưởng khối:</span>
                        <span className="font-semibold text-slate-200">
                          {root.managerId ? root.managerId.fullName : 'Chưa bổ nhiệm'}
                        </span>
                      </div>

                      {/* Members Count Badge */}
                      <button
                        onClick={() => handleOpenMembers(root)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl font-medium transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{root.employeeCount || 0} nhân sự</span>
                      </button>

                      {/* Admin Actions */}
                      {isCeoOrHr && (
                        <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
                          <button
                            onClick={() => handleOpenCreateChild(root)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Thêm phòng ban con (Cấp 2)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(root)}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Chỉnh sửa khối"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isCeo && (
                            <button
                              onClick={() => handleDelete(root)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Xóa khối"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Children Departments (Cấp 2) */}
                  {isExpanded && (
                    <div className="pl-6 sm:pl-10 space-y-3 relative border-l-2 border-dashed border-indigo-500/30 ml-5 pt-1">
                      {hasChildren ? (
                        root.children!.map((child) => (
                          <div
                            key={child._id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400 shrink-0">
                                <GitBranch className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                    {child.name}
                                  </h4>
                                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium bg-slate-800 text-slate-300 rounded">
                                    {child.code}
                                  </span>
                                  <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                                    Cấp 2
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                                  <span>
                                    Trưởng phòng:{' '}
                                    <span className="text-slate-300 font-medium">
                                      {child.managerId ? child.managerId.fullName : 'Chưa có'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-auto text-xs">
                              <button
                                onClick={() => handleOpenMembers(child)}
                                className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs transition-colors"
                              >
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{child.employeeCount || 0} nhân sự</span>
                              </button>

                              {isCeoOrHr && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleOpenEdit(child)}
                                    className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Sửa phòng ban"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {isCeo && (
                                    <button
                                      onClick={() => handleDelete(child)}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                      title="Xóa phòng ban"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800/60">
                          Chưa có phòng ban con nào trực thuộc khối này.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: CARD GRID (LƯỚI THẺ TỔNG HỢP) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTree.map((root) => (
            <div
              key={root._id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{root.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-indigo-400 border border-slate-700">
                        {root.code}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Khối Cấp 1
                  </span>
                </div>

                {root.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{root.description}</p>
                )}

                {/* Manager */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 block">
                    Trưởng Khối:
                  </span>
                  <div className="font-semibold text-slate-200">
                    {root.managerId ? (
                      <span>
                        {root.managerId.fullName} ({root.managerId.employeeCode})
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Chưa bổ nhiệm</span>
                    )}
                  </div>
                </div>

                {/* Children Summary */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Phòng Ban Trực Thuộc ({root.children?.length || 0}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {root.children && root.children.length > 0 ? (
                      root.children.map((child) => (
                        <div
                          key={child._id}
                          onClick={() => handleOpenMembers(child)}
                          className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs hover:border-slate-700 cursor-pointer transition-colors"
                        >
                          <span className="font-medium text-slate-300">{child.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {child.employeeCount || 0} nhân sự
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600 italic">Chưa có phòng ban con</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => handleOpenMembers(root)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Xem {root.employeeCount || 0} nhân sự &rarr;
                </button>

                {isCeoOrHr && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(root)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isCeo && (
                      <button
                        onClick={() => handleDelete(root)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {deptModalOpen && (
        <DepartmentModal
          isOpen={deptModalOpen}
          onClose={() => setDeptModalOpen(false)}
          onSuccess={() => fetchDepartments()}
          departmentToEdit={deptToEdit}
          parentDeptForNew={parentDeptForNew}
          rootDepartments={departmentTree}
          managers={managers}
        />
      )}

      {selectedDeptForMembers && (
        <DepartmentMembersModal
          department={selectedDeptForMembers}
          isOpen={membersModalOpen}
          onClose={() => setMembersModalOpen(false)}
          onViewUserDetail={handleViewUserDetail}
        />
      )}

      {selectedUserDetail && (
        <UserDetailModal
          user={selectedUserDetail}
          isOpen={userDetailModalOpen}
          onClose={() => setUserDetailModalOpen(false)}
          onUserUpdated={() => fetchDepartments()}
          onOpenAvatarUpload={() => {}}
        />
      )}
    </div>
  );
};

export default DepartmentsPage;
