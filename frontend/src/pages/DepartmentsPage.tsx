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
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { departmentsApi } from '../api/departments';
import { usersApi } from '../api/users';
import { DepartmentItem, UserItem } from '../types/user';
import { DepartmentModal } from '../components/departments/DepartmentModal';
import { DepartmentMembersModal } from '../components/departments/DepartmentMembersModal';
import { UserDetailModal } from '../components/users/UserDetailModal';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { getDepartmentTheme } from '../utils/departmentColors';

export const DepartmentsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
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

    try {
      await departmentsApi.deleteDepartment(dept._id);
      setSuccessMsg(`Đã xóa thành công ${isRoot ? 'Khối' : 'Phòng ban'} "${dept.name}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
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
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-fg">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-2 border-b-2 border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-muted bg-surface-2 border border-line px-2 py-0.5 rounded uppercase tracking-wider">
              {isCeoOrHr ? 'Cơ Cấu Tổ Chức Doanh Nghiệp' : 'Phòng Ban Trực Thuộc'}
            </span>
            <span className="text-muted">·</span>
            <span className="text-xs text-muted font-medium">
              {isCeoOrHr ? `Tổng cộng ${totalDepts} đơn vị` : `Phạm vi: ${user?.fullName || 'Nhân sự'}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-fg leading-tight font-display">
            {isCeoOrHr ? 'Sơ Đồ Phân Cấp Phòng Ban' : 'Cơ Cấu Bộ Phận Của Bạn'}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            {isCeoOrHr
              ? 'Thiết lập cơ cấu chuẩn 2 cấp (Khối chức năng cấp 1 → Phòng chuyên môn cấp 2), bổ nhiệm trưởng bộ phận và quản lý nhân sự trực thuộc.'
              : 'Theo quy chế phân quyền bảo mật, bạn chỉ xem được cơ cấu tổ chức và danh sách nhân sự thuộc phòng ban được phân công.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => fetchDepartments()}
            className="p-2.5 rounded-xl border-2 border-line bg-surface hover:bg-surface-2 text-fg shadow-hard transition cursor-pointer"
            title="Làm mới sơ đồ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          {isCeoOrHr && (
            <button
              onClick={handleOpenCreateRoot}
              className="px-4 py-2.5 rounded-xl bg-lime text-ink border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-ink" strokeWidth={2.5} />
              <span>Thêm Khối Cấp 1</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Stats Strip */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border-2 border-line shadow-hard-sm text-xs">
        <span className="flex items-center gap-1.5 text-muted font-medium">
          <Layers className="w-3.5 h-3.5 text-muted" />
          <span>Tổng đơn vị: <strong className="font-mono text-fg font-bold">{totalDepts}</strong></span>
        </span>
        <span className="text-line/40">·</span>
        <span className="flex items-center gap-1.5 text-muted font-medium">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span>Khối Cấp 1: <strong className="font-mono text-primary font-bold">{totalRoots}</strong></span>
        </span>
        <span className="text-line/40">·</span>
        <span className="flex items-center gap-1.5 text-muted font-medium">
          <GitBranch className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Phòng ban Cấp 2: <strong className="font-mono text-sky-700 dark:text-sky-300 font-bold">{totalChildren}</strong></span>
        </span>
        <span className="text-line/40">·</span>
        <span className="flex items-center gap-1.5 text-muted font-medium">
          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Nhân sự đã phân bổ: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{totalAssignedStaff}</strong></span>
        </span>
      </div>

      {/* 2. Control Bar: View Mode & Search */}
      <div className="rounded-2xl bg-surface border-2 border-line p-3.5 shadow-hard flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên khối hoặc mã phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted text-xs focus:outline-none focus:border-primary transition font-medium"
          />
        </div>

        {/* View mode toggle with UnderlineTabs */}
        <UnderlineTabs
          tabs={[
            { id: 'tree', label: 'Sơ Đồ Cây', icon: <FolderTree className="w-3.5 h-3.5" /> },
            { id: 'grid', label: 'Lưới Thẻ', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
          ]}
          activeTab={viewMode}
          onChange={(m) => setViewMode(m as 'tree' | 'grid')}
        />
      </div>

      {/* Notification / Error alerts */}
      {error && (
        <div className="p-4 bg-peach/30 border-2 border-line rounded-2xl text-ink text-xs flex items-center space-x-2 shadow-hard-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-ink" strokeWidth={2.5} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-line rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 shadow-hard-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE TREE CHART (SƠ ĐỒ CÂY 2 CẤP) */}
      {viewMode === 'tree' && (
        <div className="space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted space-y-2 bg-surface border-2 border-line rounded-2xl shadow-hard">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Đang tải và dựng cây phân cấp phòng ban...</span>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="py-20 text-center text-muted bg-surface border-2 border-dashed border-line rounded-2xl space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-muted mb-2 opacity-50" />
              <p className="text-sm font-bold text-fg">
                {isCeoOrHr
                  ? 'Không tìm thấy phòng ban nào phù hợp'
                  : 'Bạn chưa được phân bổ vào phòng ban nào'}
              </p>
              <p className="text-xs text-muted max-w-md mx-auto">
                {isCeoOrHr
                  ? 'Thử tìm kiếm với từ khóa khác hoặc tạo khối phòng ban mới.'
                  : 'Theo quy định bảo mật, nhân sự chỉ xem được cơ cấu và thành viên thuộc phòng ban mà mình được phân công. Vui lòng liên hệ HR để được xếp phòng ban.'}
              </p>
            </div>
          ) : (
            filteredTree.map((root) => {
              const isExpanded = !!expandedNodes[root._id];
              const hasChildren = root.children && root.children.length > 0;
              const deptTheme = getDepartmentTheme(root.code || root.name);

              return (
                <div
                  key={root._id}
                  className={`rounded-2xl bg-surface border-2 border-line p-5 shadow-hard space-y-4 border-l-4 ${deptTheme.borderLeft}`}
                >
                  {/* Root Department Card (Cấp 1) */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-surface-2 hover:border-primary transition">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleNode(root._id)}
                        className="p-1.5 text-muted hover:text-fg rounded-xl transition cursor-pointer"
                        title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-primary" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted" />
                        )}
                      </button>

                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-line shadow-xs ${deptTheme.badge}`}>
                        <Layers className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-fg">{root.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-mono font-bold text-fg bg-surface border border-line rounded-lg shadow-xs">
                            {root.code}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border border-line ${deptTheme.badge}`}>
                            Khối Cấp 1
                          </span>
                        </div>

                        {root.description && (
                          <p className="text-xs text-muted mt-1 max-w-xl line-clamp-1">
                            {root.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Actions of Root */}
                    <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto text-xs">
                      {/* Manager */}
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface border border-line rounded-xl text-muted shadow-xs">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Trưởng khối:</span>
                        <span className="font-bold text-fg">
                          {root.managerId ? root.managerId.fullName : 'Chưa bổ nhiệm'}
                        </span>
                      </div>

                      {/* Members Strip with Signature Dots */}
                      <button
                        onClick={() => handleOpenMembers(root)}
                        className="px-3 py-1.5 bg-surface hover:bg-surface-2 text-fg border border-line rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                        title={`Xem ${root.employeeCount || 0} nhân sự thuộc ${root.name}`}
                      >
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(6, root.employeeCount || 0) }).map((_, i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${deptTheme.dot}`} />
                          ))}
                        </div>
                        <span>{root.employeeCount || 0} nhân sự</span>
                      </button>

                      {/* Admin Actions */}
                      {isCeoOrHr && (
                        <div className="flex items-center space-x-1 border-l border-line/40 pl-2">
                          <button
                            onClick={() => handleOpenCreateChild(root)}
                            className="p-2 text-muted hover:text-fg hover:bg-surface rounded-xl border border-transparent hover:border-line transition cursor-pointer"
                            title="Thêm phòng ban con (Cấp 2)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(root)}
                            className="p-2 text-muted hover:text-fg hover:bg-surface rounded-xl border border-transparent hover:border-line transition cursor-pointer"
                            title="Chỉnh sửa khối"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isCeo && (
                            <button
                              onClick={() => handleDelete(root)}
                              className="p-2 text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-400 transition cursor-pointer"
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
                    <div className="pl-6 sm:pl-10 space-y-2.5 relative border-l-2 border-dashed border-line/40 ml-6 pt-1">
                      {hasChildren ? (
                        root.children!.map((child) => {
                          const childTheme = getDepartmentTheme(child.code || child.name);
                          return (
                            <div
                              key={child._id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface-2 border border-line rounded-xl hover:border-primary transition group border-l-4 ${childTheme.borderLeft} shadow-xs`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <GitBranch className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={2} />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-xs font-bold text-fg">
                                      {child.name}
                                    </h4>
                                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-fg bg-surface border border-line rounded-lg shadow-xs">
                                      {child.code}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border border-line ${childTheme.badge}`}>
                                      Phòng Cấp 2
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-[11px] text-muted mt-0.5">
                                    <span>
                                      Trưởng phòng:{' '}
                                      <span className="text-fg font-semibold">
                                        {child.managerId ? child.managerId.fullName : 'Chưa có'}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 self-end sm:self-auto text-xs">
                                <button
                                  onClick={() => handleOpenMembers(child)}
                                  className="px-3 py-1.5 bg-surface hover:bg-surface-2 text-fg border border-line rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                                  title={`Xem ${child.employeeCount || 0} nhân sự thuộc ${child.name}`}
                                >
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, child.employeeCount || 0) }).map((_, i) => (
                                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${childTheme.dot}`} />
                                    ))}
                                  </div>
                                  <span>{child.employeeCount || 0} nhân sự</span>
                                </button>

                              {isCeoOrHr && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleOpenEdit(child)}
                                    className="p-1.5 text-muted hover:text-fg hover:bg-surface rounded-xl border border-transparent hover:border-line transition cursor-pointer"
                                    title="Sửa phòng ban"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {isCeo && (
                                    <button
                                      onClick={() => handleDelete(child)}
                                      className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-400 transition cursor-pointer"
                                      title="Xóa phòng ban"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                      ) : (
                        <div className="p-3.5 text-xs text-muted italic bg-surface-2 rounded-xl border border-dashed border-line/40">
                          Chưa có phòng ban con nào trực thuộc khối này. Bấm &quot;+&quot; ở trên để tạo phòng ban con.
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
              className="rounded-2xl bg-surface border-2 border-line p-5 shadow-hard flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-primary font-bold shrink-0 shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-fg text-sm">{root.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-surface-2 text-fg border border-line font-bold shadow-xs">
                        {root.code}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-lime text-ink border border-line shadow-xs">
                    Khối Cấp 1
                  </span>
                </div>

                {root.description && (
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">{root.description}</p>
                )}

                {/* Manager */}
                <div className="p-3 bg-surface-2 border border-line rounded-xl text-xs space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-muted block">
                    Trưởng Khối:
                  </span>
                  <div className="font-semibold text-fg">
                    {root.managerId ? (
                      <span>
                        {root.managerId.fullName} ({root.managerId.employeeCode})
                      </span>
                    ) : (
                      <span className="text-muted italic">Chưa bổ nhiệm</span>
                    )}
                  </div>
                </div>

                {/* Children Summary */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-fg block font-mono">
                    Phòng Ban Trực Thuộc ({root.children?.length || 0}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {root.children && root.children.length > 0 ? (
                      root.children.map((child) => (
                        <div
                          key={child._id}
                          onClick={() => handleOpenMembers(child)}
                          className="flex items-center justify-between p-2.5 bg-surface-2 border border-line rounded-xl text-xs hover:border-primary cursor-pointer transition shadow-xs"
                        >
                          <span className="font-semibold text-fg">{child.name}</span>
                          <span className="text-[10px] font-mono text-muted font-bold">
                            {child.employeeCount || 0} nhân sự
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted italic">Chưa có phòng ban con</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-line text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenMembers(root)}
                  className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem {root.employeeCount || 0} nhân sự</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {isCeoOrHr && (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(root)}
                      className="p-1.5 text-muted hover:text-fg hover:bg-surface-2 rounded-xl border border-transparent hover:border-line transition cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isCeo && (
                      <button
                        type="button"
                        onClick={() => handleDelete(root)}
                        className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-400 transition cursor-pointer"
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
