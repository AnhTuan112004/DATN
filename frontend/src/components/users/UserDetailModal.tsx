import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User as UserIcon,
  Briefcase,
  Calendar,
  CreditCard,
  Shield,
  ShieldAlert,
  Plus,
  Clock,
  Building,
  CheckCircle2,
  FileCheck,
  Camera,
  Loader2,
  Edit3,
  Trash2,
  AlertTriangle,
  Lock,
  UserCheck,
  ShieldCheck,
  Send,
  Sparkles,
  XCircle,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users';
import { formatVND, formatDate } from '../../utils/formatters';
import { faceApi } from '../../api/face';
import { UserItem, Contract, SalaryConfig, ContractType } from '../../types/user';
import { FaceStatusResponse } from '../../types/face';
import { Role } from '../../types/auth';
import { FaceEnrollmentModal } from './FaceEnrollmentModal';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface UserDetailModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserItem) => void;
  onOpenAvatarUpload: (user: UserItem) => void;
  departments?: Array<{ _id: string; name: string; code: string; level?: number }>;
  managers?: Array<{ _id: string; fullName: string; employeeCode: string; role?: string }>;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  onOpenAvatarUpload,
  departments = [],
  managers = [],
}) => {
  const { user: currentUser, hasRole } = useAuth();
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'salary' | 'admin' | 'biometrics'>('overview');

  // Biometrics & Consent state (Luật BVDLCN 91/2025/QH15)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [revokingConsent, setRevokingConsent] = useState(false);
  const [revokeSuccessMsg, setRevokeSuccessMsg] = useState<string | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  // Department & Manager transfer state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedMgrId, setSelectedMgrId] = useState<string>('');
  const [deptUpdating, setDeptUpdating] = useState(false);
  const [deptMsg, setDeptMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transfer proposal states (HR Manager lập tờ trình đề xuất lên CEO)
  const [transferProposalReason, setTransferProposalReason] = useState('');
  const [proposingTransfer, setProposingTransfer] = useState(false);
  const [proposedDeptId, setProposedDeptId] = useState('');
  const [proposedMgrId, setProposedMgrId] = useState('');

  // Salary state
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [salarySuccess, setSalarySuccess] = useState<string | null>(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState<SalaryConfig>({
    baseSalary: 0,
    positionAllowance: 0,
    mealAllowance: 0,
    dependentsCount: 0,
    isResident: true,
    contractDurationMonths: 12,
  });

  // Contract form state
  const [showAddContract, setShowAddContract] = useState(false);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState<{
    contractNumber: string;
    contractType: ContractType;
    effectiveFrom: string;
    effectiveTo: string;
    baseSalary: number;
    allowance: number;
  }>({
    contractNumber: '',
    contractType: 'DEFINITE',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baseSalary: 15000000,
    allowance: 2000000,
  });

  // Role admin state
  const [selectedRole, setSelectedRole] = useState<Role>(user?.role || 'EMPLOYEE');
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleMsg, setRoleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role proposal states (HR đề xuất, CEO xét duyệt)
  const [proposalReason, setProposalReason] = useState('');
  const [proposingRole, setProposingRole] = useState(false);
  const [reviewingProposal, setReviewingProposal] = useState(false);
  const [proposalMsg, setProposalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      const currentDeptId = typeof user.departmentId === 'object' && user.departmentId ? user.departmentId._id : (user.departmentId || '');
      const currentMgrId = typeof user.managerId === 'object' && user.managerId ? user.managerId._id : (user.managerId || '');
      setSelectedDeptId(currentDeptId);
      setSelectedMgrId(currentMgrId);
      setProposedDeptId(currentDeptId);
      setProposedMgrId(currentMgrId);
      setTransferProposalReason('');
      setShowAddContract(false);
      setEditingSalary(false);
      setSalaryError(null);
      setSalarySuccess(null);
      setRoleMsg(null);
      setProposalMsg(null);
      setProposalReason('');
      setDeptMsg(null);
      // Gợi ý số HĐ tiếp theo
      const nextContractNum = `HĐ-${user.employeeCode}-${(user.contracts?.length || 0) + 1}`;
      setContractForm((prev) => ({ ...prev, contractNumber: nextContractNum }));
    }
  }, [user]);

  // Load salary config when tab opens
  useEffect(() => {
    if (activeTab === 'salary' && user) {
      // Nếu là Manager xem nhân viên khác: Chặn lập tức ở frontend (bảo vệ IDOR)
      const isSelf = currentUser?._id === user._id;
      const canView = hasRole(['CEO', 'HR_MANAGER']) || isSelf;

      if (!canView) {
        setSalaryError('Bảo vệ IDOR: Quản lý (Manager) tuyệt đối không được phép xem cấu hình lương của nhân sự.');
        return;
      }

      setSalaryLoading(true);
      setSalaryError(null);
      usersApi
        .getUserSalary(user._id)
        .then((res) => {
          setSalaryConfig(res.data);
          setSalaryForm(res.data);
        })
        .catch((err) => {
          const errMsg = err.response?.data?.error || 'Không thể tải cấu hình lương.';
          setSalaryError(errMsg);
        })
        .finally(() => {
          setSalaryLoading(false);
        });
    }
  }, [activeTab, user, currentUser, hasRole]);

  // Load face status when biometrics tab opens
  const loadFaceStatus = React.useCallback(async () => {
    if (!user) return;
    setFaceLoading(true);
    setFaceError(null);
    setRevokeSuccessMsg(null);
    try {
      const res = await faceApi.getFaceStatus(user._id);
      setFaceStatus(res.data);
    } catch (err: unknown) {
      console.error('Lỗi tải trạng thái FaceID:', err);
      const errMsg = err instanceof Error ? err.message : 'Không thể tải trạng thái sinh trắc học';
      setFaceError(errMsg);
    } finally {
      setFaceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'biometrics') {
      loadFaceStatus();
    }
  }, [activeTab, loadFaceStatus]);

  // Handle Revoke Consent (Khoản 2 Điều 14 Luật BVDLCN)
  const handleRevokeConsent = async () => {
    if (!user) return;
    setRevokingConsent(true);
    try {
      await faceApi.revokeConsent(user._id);
      setRevokeSuccessMsg('Đã rút lại sự đồng ý và xóa vĩnh viễn dữ liệu sinh trắc học theo Luật BVDLCN số 91/2025/QH15');
      setRevokeConfirmOpen(false);
      await loadFaceStatus();
    } catch (err: unknown) {
      console.error('Lỗi thu hồi đồng ý FaceID:', err);
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi thu hồi sự đồng ý';
      alert(errMsg);
    } finally {
      setRevokingConsent(false);
    }
  };

  if (!isOpen || !user) return null;

  const isSelf = currentUser?._id === user._id;
  const isCeoOrHr = hasRole(['CEO', 'HR_MANAGER']);
  const isCeo = currentUser?.role === 'CEO' || hasRole('CEO');
  const isHr = currentUser?.role === 'HR_MANAGER' || hasRole('HR_MANAGER');
  const isManager = currentUser?.role === 'MANAGER' && !isSelf;

  // Submit salary update
  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalaryLoading(true);
    setSalaryError(null);
    setSalarySuccess(null);

    try {
      const res = await usersApi.updateUserSalary(user._id, salaryForm);
      setSalaryConfig(res.data);
      setEditingSalary(false);
      setSalarySuccess('Đã cập nhật cấu hình lương và ghi nhận AuditLog thành công.');
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi cập nhật cấu hình lương.';
      setSalaryError(errMsg);
    } finally {
      setSalaryLoading(false);
    }
  };

  // Submit new contract
  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractSubmitting(true);
    setContractError(null);

    try {
      const res = await usersApi.addContract(user._id, {
        contractNumber: contractForm.contractNumber,
        contractType: contractForm.contractType,
        effectiveFrom: contractForm.effectiveFrom,
        effectiveTo: contractForm.contractType === 'INDEFINITE' ? null : contractForm.effectiveTo,
        baseSalary: Number(contractForm.baseSalary),
        allowance: Number(contractForm.allowance),
      });

      // Cập nhật lại user detail
      const updatedContracts = [...(user.contracts || []).map((c) => ({ ...c, status: 'EXPIRED' as const })), res.data];
      const updatedUser: UserItem = { ...user, contracts: updatedContracts };
      onUserUpdated(updatedUser);
      setShowAddContract(false);
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi khi ký hợp đồng mới.';
      setContractError(errMsg);
    } finally {
      setContractSubmitting(false);
    }
  };

  // Submit role update (Chỉ CEO)
  const handleUpdateRole = async () => {
    if (selectedRole === user.role) return;
    setRoleUpdating(true);
    setRoleMsg(null);

    try {
      const res = await usersApi.updateUserRole(user._id, selectedRole);
      onUserUpdated(res.data);
      setRoleMsg({ type: 'success', text: `Tổng Giám Đốc (CEO) đã trực tiếp cập nhật vai trò sang ${selectedRole} thành công! Hệ thống đã gửi email thông báo bổ nhiệm.` });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi khi cập nhật vai trò.';
      setRoleMsg({ type: 'error', text: errMsg });
    } finally {
      setRoleUpdating(false);
    }
  };

  // Submit role proposal (HR Manager đề xuất lên CEO)
  const handleProposeRole = async () => {
    if (selectedRole === user.role) {
      setProposalMsg({ type: 'error', text: 'Vui lòng chọn vai trò khác với vai trò hiện tại của nhân viên.' });
      return;
    }
    if (!proposalReason.trim()) {
      setProposalMsg({ type: 'error', text: 'Vui lòng nhập lý do đề xuất bổ nhiệm để CEO xem xét.' });
      return;
    }
    setProposingRole(true);
    setProposalMsg(null);

    try {
      const res = await usersApi.proposeUserRole(user._id, selectedRole, proposalReason.trim());
      onUserUpdated(res.data);
      setProposalMsg({ type: 'success', text: `Đã gửi đề xuất bổ nhiệm vai trò ${selectedRole} lên Tổng Giám Đốc (CEO) phê duyệt thành công!` });
      setProposalReason('');
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
                     (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi gửi đề xuất vai trò.';
      setProposalMsg({ type: 'error', text: errMsg });
    } finally {
      setProposingRole(false);
    }
  };

  // Review proposal (CEO Approve / Reject)
  const handleReviewProposal = async (decision: 'APPROVE' | 'REJECT') => {
    setReviewingProposal(true);
    setProposalMsg(null);

    try {
      const res = await usersApi.approveRoleProposal(user._id, decision);
      onUserUpdated(res.data);
      setProposalMsg({
        type: 'success',
        text: decision === 'APPROVE'
          ? `Tổng Giám Đốc (CEO) đã phê duyệt và chính thức bổ nhiệm vai trò ${user.roleProposal?.proposedRole}!`
          : 'Tổng Giám Đốc (CEO) đã từ chối đề xuất bổ nhiệm vai trò này.',
      });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
                     (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi xử lý đề xuất.';
      setProposalMsg({ type: 'error', text: errMsg });
    } finally {
      setReviewingProposal(false);
    }
  };

  // Cancel proposal (HR rút lại đề xuất)
  const handleCancelProposal = async () => {
    setReviewingProposal(true);
    setProposalMsg(null);

    try {
      const res = await usersApi.cancelRoleProposal(user._id);
      onUserUpdated(res.data);
      setProposalMsg({ type: 'success', text: 'Đã hủy bỏ đề xuất điều chỉnh vai trò thành công.' });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error || 'Lỗi khi hủy đề xuất.';
      setProposalMsg({ type: 'error', text: errMsg });
    } finally {
      setReviewingProposal(false);
    }
  };

  // Submit department & manager transfer
  const handleUpdateDepartment = async () => {
    if (!user) return;
    setDeptUpdating(true);
    setDeptMsg(null);

    try {
      const payload: { departmentId?: string | null; managerId?: string | null } = {
        departmentId: selectedDeptId || null,
        managerId: selectedMgrId || null,
      };
      const res = await usersApi.updateUser(user._id, payload);
      onUserUpdated(res.data);
      setDeptMsg({
        type: 'success',
        text: 'Đã điều chuyển nhân sự thành công! Email thông báo chính thức đã tự động gửi tới hòm thư nhân viên.',
      });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi khi điều chuyển nhân sự.';
      setDeptMsg({ type: 'error', text: errMsg });
    } finally {
      setDeptUpdating(false);
    }
  };

  // Submit department & manager proposal (HR gửi tờ trình lên CEO)
  const handleProposeTransfer = async () => {
    if (!user) return;
    if (!transferProposalReason.trim()) {
      setDeptMsg({ type: 'error', text: 'Vui lòng nhập lý do điều chuyển để lập tờ trình lên Ban Giám Đốc (CEO).' });
      return;
    }
    setProposingTransfer(true);
    setDeptMsg(null);

    try {
      const res = await usersApi.proposeUserTransfer(user._id, {
        proposedDepartmentId: proposedDeptId || null,
        proposedManagerId: proposedMgrId || null,
        reason: transferProposalReason.trim(),
      });
      setDeptMsg({
        type: 'success',
        text: res.message || 'Đã gửi tờ trình đề xuất điều chuyển lên Ban Giám Đốc (CEO) thành công! Thông báo đã chuyển tới CEO.',
      });
      setTransferProposalReason('');
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi khi gửi đề xuất điều chuyển.';
      setDeptMsg({ type: 'error', text: errMsg });
    } finally {
      setProposingTransfer(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-modal-title"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-4xl bg-surface border-2 border-line rounded-3xl shadow-hard-lg flex flex-col max-h-[92vh] overflow-hidden text-fg"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface-2 text-fg">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-lime text-ink border border-line font-mono shadow-xs">
              Mã NV: {user.employeeCode}
            </span>
            <h2 id="user-detail-modal-title" className="text-sm font-bold text-fg">
              Hồ sơ nhân viên
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết hồ sơ"
            className="p-1.5 text-muted hover:text-fg hover:bg-surface rounded-xl border border-transparent hover:border-line transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Identity Bar */}
        <div className="p-6 bg-surface border-b-2 border-line text-fg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
            {/* Avatar with quick change */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-line bg-surface-2 shadow-hard-xs flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-primary font-display">
                    {user.fullName.split(' ').pop()?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              {(isCeoOrHr || isSelf) && (
                <button
                  type="button"
                  onClick={() => onOpenAvatarUpload(user)}
                  title="Cập nhật ảnh qua Cloudinary auto-face-crop"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-lime text-ink border border-line rounded-xl shadow-hard-xs transition-all hover:scale-105 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Metadata */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xl sm:text-2xl font-black text-fg font-display">{user.fullName}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border border-line shadow-xs ${
                    user.role === 'CEO'
                      ? 'bg-sky text-ink'
                      : user.role === 'HR_MANAGER'
                      ? 'bg-lime text-ink'
                      : user.role === 'MANAGER'
                      ? 'bg-lilac text-ink'
                      : 'bg-surface-2 text-fg'
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                    user.isActive !== false
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                  }`}
                >
                  {user.isActive !== false ? 'Đang làm việc' : 'Đã vô hiệu hóa'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted font-medium">
                <span className="flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-muted" />
                  <span>
                    Phòng ban: {user.departmentId?.name
                      ? `${user.departmentId.name} (${user.departmentId.code})`
                      : (user.role === 'CEO' ? 'Ban Giám Đốc' : 'Chưa phân bổ')}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <UserIcon className="w-3.5 h-3.5 text-muted" />
                  <span>
                    Quản lý: {user.managerId?.fullName
                      ? `${user.managerId.fullName} (${user.managerId.employeeCode})`
                      : 'Không có'}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span>Gia nhập: {formatDate(user.hireDate)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-6 border-b-2 border-line overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-line bg-lime text-ink shadow-hard-xs'
                  : 'border-transparent text-muted hover:text-fg hover:bg-surface-2'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Hồ sơ & Nghỉ phép</span>
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'contracts'
                  ? 'border-line bg-lime text-ink shadow-hard-xs'
                  : 'border-transparent text-muted hover:text-fg hover:bg-surface-2'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Hợp đồng ({user.contracts?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'salary'
                  ? 'border-line bg-lime text-ink shadow-hard-xs'
                  : 'border-transparent text-muted hover:text-fg hover:bg-surface-2'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Lương & Thuế</span>
            </button>
            {isCeoOrHr && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'border-line bg-lime text-ink shadow-hard-xs'
                    : 'border-transparent text-muted hover:text-fg hover:bg-surface-2'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Quản trị quyền</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('biometrics')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'biometrics'
                  ? 'border-line bg-lime text-ink shadow-hard-xs'
                  : 'border-transparent text-muted hover:text-fg hover:bg-surface-2'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>FaceID Sinh trắc</span>
              {faceStatus?.hasFaceRegistered && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5 border border-line" />
              )}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg text-fg">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cards row: Leave Balances & Seniority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Annual Leave */}
                <div className="p-4 bg-surface border-2 border-line rounded-2xl shadow-hard-xs text-fg">
                  <div className="flex items-center justify-between text-xs text-muted mb-2 font-mono font-bold">
                    <span>Phép Năm (Điều 114 BLLĐ)</span>
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-fg font-mono">
                      {user.leaveBalance?.annualRemaining ?? 12}
                    </span>
                    <span className="text-xs text-muted font-bold font-mono">
                      / {user.leaveBalance?.annualTotal ?? 12} ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-2 font-medium">
                    Đã dùng: {user.leaveBalance?.annualUsed ?? 0} ngày • Thâm niên +
                    {user.leaveBalance?.seniorityBonusDays ?? 0} ngày (1 ngày/5 năm).
                  </p>
                </div>

                {/* Card 2: Sick Leave */}
                <div className="p-4 bg-surface border-2 border-line rounded-2xl shadow-hard-xs text-fg">
                  <div className="flex items-center justify-between text-xs text-muted mb-2 font-mono font-bold">
                    <span>Nghỉ Ốm Hưởng BHXH</span>
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-fg font-mono">
                      {user.leaveBalance?.sickRemaining ?? 30}
                    </span>
                    <span className="text-xs text-muted font-bold font-mono">/ 30 ngày</span>
                  </div>
                  <p className="text-[11px] text-muted mt-2 font-medium">
                    Đã dùng: {user.leaveBalance?.sickUsed ?? 0} ngày (nghỉ &ge; 14 ngày không đóng BHXH).
                  </p>
                </div>

                {/* Card 3: ML Retention Indicators */}
                <div className="p-4 bg-surface border-2 border-line rounded-2xl shadow-hard-xs text-fg">
                  <div className="flex items-center justify-between text-xs text-muted mb-2 font-mono font-bold">
                    <span>Đặc Trưng Thôi Việc (ML)</span>
                    <FileCheck className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="space-y-1.5 text-xs text-fg">
                    <div className="flex justify-between">
                      <span className="text-muted">Tổng thâm niên nghề:</span>
                      <span className="font-bold text-fg font-mono">{user.totalWorkingYears ?? 1} năm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Số công ty từng làm:</span>
                      <span className="font-bold text-fg font-mono">{user.numCompaniesWorked ?? 1}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Information Grid */}
              <div className="bg-surface border-2 border-line rounded-2xl p-5 space-y-4 shadow-hard-xs text-fg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-mono flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-primary" />
                  <span>Thông Tin Định Danh &amp; Liên Hệ</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted block mb-1 font-mono text-[11px]">Họ và tên:</span>
                    <span className="font-bold text-fg text-sm">{user.fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-mono text-[11px]">Mã nhân viên:</span>
                    <span className="font-mono font-bold text-primary">{user.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-mono text-[11px]">Email doanh nghiệp:</span>
                    <span className="font-bold text-fg">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-mono text-[11px]">Số điện thoại:</span>
                    <span className="font-bold text-fg">{user.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-mono text-[11px]">Phòng ban trực thuộc:</span>
                    <span className="font-bold text-fg">
                      {user.departmentId ? `${user.departmentId.name} (${user.departmentId.code})` : 'Chưa phân bổ'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-mono text-[11px]">Quản lý trực tiếp:</span>
                    <span className="font-bold text-fg">
                      {user.managerId ? `${user.managerId.fullName} (${user.managerId.employeeCode})` : 'BOD / Tổng giám đốc'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACTS */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Lịch Sử Hợp Đồng Lao Động</h4>
                  <p className="text-xs text-slate-400">
                    Mảng contracts[] lưu các đời hợp đồng; khi ký HĐ mới, HĐ cũ tự động chuyển sang EXPIRED.
                  </p>
                </div>
                {isCeoOrHr && !showAddContract && (
                  <button
                    onClick={() => setShowAddContract(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ký Hợp Đồng Mới</span>
                  </button>
                )}
              </div>

              {/* Form Add Contract */}
              {showAddContract && (
                <form
                  onSubmit={handleAddContract}
                  className="p-5 bg-surface border-2 border-line rounded-2xl space-y-4 shadow-hard-xs text-fg animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b-2 border-line pb-3">
                    <span className="text-xs font-bold text-fg uppercase tracking-wider font-mono">
                      Thêm Hợp Đồng Lao Động Mới
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddContract(false)}
                      className="text-xs text-muted hover:text-fg font-bold cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-muted font-bold mb-1 font-mono">Số Hợp Đồng</label>
                      <input
                        type="text"
                        value={contractForm.contractNumber}
                        onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-muted font-bold mb-1 font-mono">Loại Hợp Đồng</label>
                      <select
                        value={contractForm.contractType}
                        onChange={(e) =>
                          setContractForm({ ...contractForm, contractType: e.target.value as ContractType })
                        }
                        className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-primary font-medium"
                      >
                        <option value="PROBATION">Thử việc (PROBATION)</option>
                        <option value="DEFINITE">Xác định thời hạn (DEFINITE)</option>
                        <option value="INDEFINITE">Không xác định thời hạn (INDEFINITE)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-muted font-bold mb-1 font-mono">Ngày Hiệu Lực</label>
                      <input
                        type="date"
                        value={contractForm.effectiveFrom}
                        onChange={(e) => setContractForm({ ...contractForm, effectiveFrom: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    {contractForm.contractType !== 'INDEFINITE' && (
                      <div>
                        <label className="block text-muted font-bold mb-1 font-mono">Ngày Hết Hạn</label>
                        <input
                          type="date"
                          value={contractForm.effectiveTo}
                          onChange={(e) => setContractForm({ ...contractForm, effectiveTo: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-muted font-bold mb-1 font-mono">Lương Cơ Bản Theo HĐ (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        step="500000"
                        value={contractForm.baseSalary}
                        onChange={(e) => setContractForm({ ...contractForm, baseSalary: Number(e.target.value) })}
                        required
                        className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-primary font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-muted font-bold mb-1 font-mono">Phụ Cấp Hợp Đồng (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={contractForm.allowance}
                        onChange={(e) => setContractForm({ ...contractForm, allowance: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg focus:outline-none focus:border-primary font-mono font-bold"
                      />
                    </div>
                  </div>

                  {contractError && (
                    <div className="p-3 bg-rose-500/10 border-2 border-rose-500 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold">
                      {contractError}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContract(false)}
                      className="px-4 py-2 text-xs font-bold text-muted hover:text-fg"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={contractSubmitting}
                      className="inline-flex items-center space-x-2 px-5 py-2 bg-lime text-ink border-2 border-line rounded-xl text-xs font-bold disabled:opacity-50 shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                    >
                      {contractSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Lưu Hợp Đồng</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Contracts List Table */}
              <div className="border-2 border-line rounded-2xl overflow-hidden bg-surface shadow-hard-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 border-b-2 border-line text-fg font-black uppercase tracking-wider text-[11px] font-mono">
                      <tr>
                        <th className="px-4 py-3">Số HĐ</th>
                        <th className="px-4 py-3">Loại HĐ</th>
                        <th className="px-4 py-3">Thời Hạn</th>
                        <th className="px-4 py-3">Lương Cơ Bản</th>
                        <th className="px-4 py-3">Phụ Cấp</th>
                        <th className="px-4 py-3">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-line/20">
                      {user.contracts && user.contracts.length > 0 ? (
                        user.contracts.map((contract: Contract, idx: number) => (
                          <tr key={contract._id || idx} className="hover:bg-surface-2 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-primary">
                              {contract.contractNumber}
                            </td>
                            <td className="px-4 py-3 text-fg font-medium">
                              {contract.contractType === 'PROBATION' && 'Thử việc'}
                              {contract.contractType === 'DEFINITE' && 'Xác định thời hạn'}
                              {contract.contractType === 'INDEFINITE' && 'Không xác định'}
                            </td>
                            <td className="px-4 py-3 text-muted font-medium">
                              {formatDate(contract.effectiveFrom)} &rarr;{' '}
                              {contract.effectiveTo ? formatDate(contract.effectiveTo) : 'Vô thời hạn'}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-200">
                              {formatVND(contract.baseSalary)}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {formatVND(contract.allowance || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  contract.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {contract.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            Chưa có hợp đồng lao động nào được ghi nhận.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY CONFIG */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              {/* IDOR Protection Notice for Manager */}
              {isManager && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-xs text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-rose-200 mb-1">
                      Bảo vệ dữ liệu tài chính
                    </h5>
                    <p>
                      Quản lý phòng ban (Manager) tuyệt đối không có quyền xem hoặc sửa cấu hình lương của nhân sự trực
                      thuộc. Thao tác vi phạm sẽ bị từ chối với mã 403 Forbidden và tự động ghi vết AuditLog an ninh.
                    </p>
                  </div>
                </div>
              )}

              {/* For Authorized: CEO, HR or Self */}
              {!isManager && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">
                        Cấu Hình Lương & Tham Số Thuế TNCN 2026
                      </h4>
                      <p className="text-xs text-slate-400">
                        Áp dụng biểu thuế 5 bậc mới (10M–30M–60M–100M), giảm trừ bản thân 15.5M, phụ thuộc 6.2M.
                      </p>
                    </div>
                    {isCeoOrHr && !editingSalary && salaryConfig && (
                      <button
                        onClick={() => setEditingSalary(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Chỉnh Sửa Lương</span>
                      </button>
                    )}
                  </div>

                  {salaryLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs font-semibold">Đang tải cấu hình lương an toàn...</span>
                    </div>
                  ) : salaryError ? (
                    <div className="p-4 bg-rose-500/10 border-2 border-rose-500 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-bold">
                      {salaryError}
                    </div>
                  ) : salaryConfig ? (
                    editingSalary ? (
                      /* Form edit salary */
                      <form onSubmit={handleUpdateSalary} className="p-5 bg-surface border-2 border-line rounded-2xl space-y-4 shadow-hard-xs text-fg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block text-muted font-bold mb-1 font-mono">Lương Cơ Bản Đóng BHXH (VNĐ)</label>
                            <input
                              type="number"
                              min="0"
                              step="500000"
                              value={salaryForm.baseSalary}
                              onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) })}
                              required
                              className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg font-mono font-bold focus:outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-muted mt-0.5 block font-mono">
                              Trần BHXH/BHYT: 46.8M (đến 30/6/2026) / 50.6M (từ 1/7/2026).
                            </span>
                          </div>

                          <div>
                            <label className="block text-muted font-bold mb-1 font-mono">Phụ Cấp Chức Vụ (VNĐ)</label>
                            <input
                              type="number"
                              min="0"
                              step="100000"
                              value={salaryForm.positionAllowance}
                              onChange={(e) =>
                                setSalaryForm({ ...salaryForm, positionAllowance: Number(e.target.value) })
                              }
                              className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-muted font-bold mb-1 font-mono">Tiền Ăn Ca Miễn Thuế (VNĐ/tháng)</label>
                            <input
                              type="number"
                              min="0"
                              step="50000"
                              value={salaryForm.mealAllowance}
                              onChange={(e) => setSalaryForm({ ...salaryForm, mealAllowance: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg font-mono font-bold focus:outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-muted mt-0.5 block font-mono">
                              Mức trần miễn thuế: 730.000đ (đến 30/6) &rarr; 1.200.000đ (từ 1/7).
                            </span>
                          </div>

                          <div>
                            <label className="block text-muted font-bold mb-1 font-mono">Số Người Phụ Thuộc (6.2M/người)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={salaryForm.dependentsCount}
                              onChange={(e) =>
                                setSalaryForm({ ...salaryForm, dependentsCount: Number(e.target.value) })
                              }
                              className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-muted font-bold mb-1 font-mono">Thời Hạn HĐ Lao Động (Tháng)</label>
                            <input
                              type="number"
                              min="1"
                              value={salaryForm.contractDurationMonths}
                              onChange={(e) =>
                                setSalaryForm({ ...salaryForm, contractDurationMonths: Number(e.target.value) })
                              }
                              className="w-full px-3 py-2 bg-surface-2 border-2 border-line rounded-xl text-fg font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-6">
                            <input
                              type="checkbox"
                              id="isResident"
                              checked={salaryForm.isResident}
                              onChange={(e) => setSalaryForm({ ...salaryForm, isResident: e.target.checked })}
                              className="w-4 h-4 rounded text-primary border-2 border-line bg-surface-2"
                            />
                            <label htmlFor="isResident" className="text-fg font-bold cursor-pointer">
                              Cá nhân cư trú (áp dụng biểu lũy tiến 5 bậc)
                            </label>
                          </div>
                        </div>

                        {salarySuccess && (
                          <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            {salarySuccess}
                          </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingSalary(false)}
                            className="px-4 py-2 text-xs font-bold text-muted hover:text-fg cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            type="submit"
                            disabled={salaryLoading}
                            className="inline-flex items-center space-x-2 px-5 py-2 bg-lime text-ink border-2 border-line rounded-xl text-xs font-bold disabled:opacity-50 shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                          >
                            {salaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>Lưu Cấu Hình</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Display salary data */
                      <div className="bg-surface border-2 border-line rounded-2xl p-5 space-y-4 shadow-hard-xs text-fg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3.5 bg-surface-2 rounded-xl border border-line">
                            <span className="text-muted block mb-1 font-mono text-[11px] font-bold">Lương Cơ Bản Đóng BHXH:</span>
                            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {formatVND(salaryConfig.baseSalary)}
                            </span>
                          </div>
                          <div className="p-3.5 bg-surface-2 rounded-xl border border-line">
                            <span className="text-muted block mb-1 font-mono text-[11px] font-bold">Phụ Cấp Chức Vụ:</span>
                            <span className="text-base font-black font-mono text-fg">
                              {formatVND(salaryConfig.positionAllowance || 0)}
                            </span>
                          </div>
                          <div className="p-3.5 bg-surface-2 rounded-xl border border-line">
                            <span className="text-muted block mb-1 font-mono text-[11px] font-bold">Tiền Ăn Ca Miễn Thuế:</span>
                            <span className="text-base font-black font-mono text-fg">
                              {formatVND(salaryConfig.mealAllowance || 0)}
                            </span>
                          </div>
                          <div className="p-3.5 bg-surface-2 rounded-xl border border-line">
                            <span className="text-muted block mb-1 font-mono text-[11px] font-bold">Người Phụ Thuộc (Giảm trừ):</span>
                            <span className="text-base font-black font-mono text-fg">
                              {salaryConfig.dependentsCount} người ({formatVND(salaryConfig.dependentsCount * 6200000)}/tháng)
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted pt-2 border-t-2 border-line/40 flex items-center justify-between font-mono font-medium">
                          <span>
                            Trạng thái thuế: {salaryConfig.isResident ? 'Cá nhân cư trú' : 'Không cư trú (20%)'} • HĐ{' '}
                            {salaryConfig.contractDurationMonths} tháng.
                          </span>
                          <span className="text-primary font-bold">Tự động AuditLog: VIEW_SALARY_OTHER</span>
                        </div>
                      </div>
                    )
                  ) : null}
                </>
              )}
            </div>
          )}

          {/* TAB 4: ADMIN */}
          {activeTab === 'admin' && isCeoOrHr && (
            <div className="space-y-6">
              {/* KHỐI 1: TỜ TRÌNH / ĐỀ XUẤT ĐANG CHỜ DUYỆT (NẾU CÓ) */}
              {user.roleProposal?.status === 'PENDING' && (
                <div className="p-5 bg-amber-950/20 border border-amber-500/40 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">
                          Đề Xuất Điều Chỉnh Vai Trò Đang Chờ Duyệt
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Đề xuất bởi: <span className="text-slate-200 font-semibold">{user.roleProposal.proposedBy?.fullName || 'Quản lý Nhân Sự'}</span>
                          {user.roleProposal.proposedBy?.employeeCode && ` (${user.roleProposal.proposedBy.employeeCode})`} • {formatDate(user.roleProposal.proposedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
                      Chờ CEO Phê Duyệt
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Vai Trò Hiện Tại:</span>
                      <span className="font-bold text-slate-300">{user.role}</span>
                    </div>
                    <div className="p-3 bg-teal-950/60 rounded-xl border border-teal-800/60">
                      <span className="text-teal-400 block mb-1 font-semibold">Vai Trò Đề Xuất Mới:</span>
                      <span className="font-bold text-teal-300 text-sm">{user.roleProposal.proposedRole}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">Lý Do Đề Xuất Bổ Nhiệm:</span>
                    <p className="text-slate-200 italic whitespace-pre-wrap">{user.roleProposal.reason || 'Không có ghi chú thêm.'}</p>
                  </div>

                  {/* Hành động phê duyệt dành cho CEO */}
                  {isCeo && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-500/20">
                      <p className="text-xs text-amber-400/90 font-medium flex items-center space-x-1.5">
                        <Shield className="w-4 h-4 flex-shrink-0" />
                        <span>Thẩm quyền quyết định: <strong>Tổng Giám Đốc (CEO)</strong></span>
                      </p>
                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={reviewingProposal}
                          onClick={() => handleReviewProposal('REJECT')}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Từ Chối</span>
                        </button>
                        <button
                          type="button"
                          disabled={reviewingProposal}
                          onClick={() => handleReviewProposal('APPROVE')}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                        >
                          {reviewingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>Chấp Thuận & Bổ Nhiệm</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Thông tin dành cho HR khi đang chờ CEO */}
                  {!isCeo && isHr && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-500/20">
                      <p className="text-xs text-slate-400">
                        Đề xuất đã được gửi lên Ban Giám Đốc. Vui lòng chờ CEO xem xét và ra quyết định.
                      </p>
                      <button
                        type="button"
                        disabled={reviewingProposal}
                        onClick={handleCancelProposal}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rút lại đề xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* KHỐI 2: ĐIỀU CHỈNH HOẶC ĐỀ XUẤT VAI TRÒ */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span>
                      {isCeo
                        ? 'Quyền Hạn Tổng Giám Đốc (CEO) — Điều Chỉnh Vai Trò Trực Tiếp'
                        : 'Lập Tờ Trình Đề Xuất Đổi Vai Trò Lên CEO'}
                    </span>
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isCeo
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-indigo-500/10 text-teal-400 border-indigo-500/30'
                    }`}
                  >
                    {isCeo ? 'Quyền Hạn CEO' : 'Đề Xuất Nhân Sự (HR)'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {isCeo
                    ? 'Tổng Giám Đốc (CEO) có toàn quyền quyết định và thay đổi vai trò hệ thống của nhân sự ngay lập tức. Mọi thay đổi đều được lưu vết kiểm toán (AuditLog) và gửi email quyết định bổ nhiệm.'
                    : 'Theo quy định phân quyền, chỉ có Tổng Giám Đốc (CEO) mới có quyền trực tiếp thay đổi quyền hạn nhân viên. Phòng Nhân sự (HR) có thẩm quyền lập đề xuất bổ nhiệm kèm lý do để CEO xem xét phê duyệt.'}
                </p>

                {/* Nếu là CEO: Đổi trực tiếp */}
                {isCeo ? (
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="w-full sm:w-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="EMPLOYEE">Nhân Viên (EMPLOYEE)</option>
                      <option value="MANAGER">Quản Lý Phòng Ban (MANAGER)</option>
                      <option value="HR_MANAGER">Quản Lý Nhân Sự (HR_MANAGER)</option>
                      <option value="CEO">Tổng Giám Đốc (CEO)</option>
                    </select>

                    <button
                      onClick={handleUpdateRole}
                      disabled={roleUpdating || selectedRole === user.role}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
                    >
                      {roleUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Xác Nhận Đổi Vai Trò Ngay</span>
                    </button>
                  </div>
                ) : (
                  /* Nếu là HR Manager: Form đề xuất lên CEO */
                  <div className="space-y-3 pt-2">
                    {user.roleProposal?.status === 'PENDING' ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                        Nhân viên đang có đề xuất điều chỉnh vai trò sang <strong>{user.roleProposal.proposedRole}</strong> đang chờ CEO duyệt. Bạn có thể rút lại đề xuất ở khung phía trên nếu muốn gửi đề xuất khác.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 text-xs mb-1 font-medium">Vai trò đề xuất mới *</label>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as Role)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                            >
                              <option value="EMPLOYEE">Nhân Viên (EMPLOYEE)</option>
                              <option value="MANAGER">Quản Lý Phòng Ban (MANAGER)</option>
                              <option value="HR_MANAGER">Quản Lý Nhân Sự (HR_MANAGER)</option>
                              <option value="CEO">Tổng Giám Đốc (CEO)</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-400 text-xs mb-1 font-medium">Lý do đề xuất bổ nhiệm / điều chỉnh *</label>
                            <input
                              type="text"
                              value={proposalReason}
                              onChange={(e) => setProposalReason(e.target.value)}
                              placeholder="VD: Đạt KPI xuất sắc Q3/2026, đề xuất thăng chức Trưởng phòng..."
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleProposeRole}
                            disabled={proposingRole || selectedRole === user.role || !proposalReason.trim()}
                            className="inline-flex items-center space-x-2 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
                          >
                            {proposingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>Gửi Đề Xuất Lên CEO</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {roleMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      roleMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {roleMsg.text}
                  </div>
                )}

                {proposalMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      proposalMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {proposalMsg.text}
                  </div>
                )}
              </div>

              {/* Khối Điều chuyển phòng ban & Quản lý trực tiếp */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>Điều Chuyển Phòng Ban & Quản Lý Trực Tiếp</span>
                  </h4>
                  {isCeo ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Thẩm Quyền Phê Chuẩn (CEO)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Chỉ Lập Đề Xuất (HR)
                    </span>
                  )}
                </div>

                {isCeo ? (
                  /* GIAO DIỆN DÀNH CHO TỔNG GIÁM ĐỐC (CEO): TRỰC TIẾP PHÊ DUYỆT ĐIỀU CHUYỂN */
                  <>
                    <p className="text-xs text-slate-400">
                      Thẩm quyền Ban Giám Đốc: Trực tiếp điều chuyển nhân sự sang phòng ban mới hoặc bổ nhiệm cán bộ quản lý trực tiếp. Hệ thống tự động gửi email quyết định điều chuyển đến nhân viên.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1.5 font-medium">Phòng Ban Mới</label>
                        <select
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                        >
                          <option value="">-- Chưa phân bổ / Không thuộc phòng --</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name} ({dept.code}) {dept.level === 1 ? '• Khối cấp 1' : '• Phòng cấp 2'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1.5 font-medium">Cán Bộ Quản Lý Trực Tiếp</label>
                        <select
                          value={selectedMgrId}
                          onChange={(e) => setSelectedMgrId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                        >
                          <option value="">-- Ban Giám Đốc (CEO) / Không có --</option>
                          {managers
                            .filter((m) => m._id !== user._id) // Không chọn chính mình làm quản lý của mình
                            .map((mgr) => (
                              <option key={mgr._id} value={mgr._id}>
                                {mgr.fullName} ({mgr.employeeCode}) - {mgr.role}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">
                        💡 Thẩm quyền CEO: Thao tác này sẽ trực tiếp cập nhật cây nhân sự và gửi email quyết định điều chuyển.
                      </span>
                      <button
                        type="button"
                        onClick={handleUpdateDepartment}
                        disabled={deptUpdating}
                        className="inline-flex items-center space-x-2 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
                      >
                        {deptUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Xác Nhận Điều Chuyển (CEO)</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* GIAO DIỆN DÀNH CHO QUẢN LÝ NHÂN SỰ (HR_MANAGER): CHỈ ĐƯỢC PHÉP LẬP ĐỀ XUẤT LÊN CEO */
                  <div className="space-y-4">
                    {/* Banner cảnh báo phân định thẩm quyền */}
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-300">
                          Thẩm quyền điều chuyển thuộc về Tổng Giám Đốc (CEO)
                        </p>
                        <p className="text-[11px] text-amber-400/90 leading-relaxed">
                          Phòng Quản lý Nhân sự (HR_MANAGER) chỉ có quyền lập đề xuất/tờ trình lên Ban Giám Đốc. HR không có thẩm quyền tự ý điều chuyển nhân sự hoặc thay đổi cán bộ quản lý trực tiếp.
                        </p>
                      </div>
                    </div>

                    {/* Khung xem thông tin hiện tại (Read-only) */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Phòng ban hiện tại:</span>
                        <span className="text-slate-200 font-semibold">
                          {user.departmentId?.name ? `${user.departmentId.name} (${user.departmentId.code})` : 'Chưa phân bổ'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Quản lý trực tiếp hiện tại:</span>
                        <span className="text-slate-200 font-semibold">
                          {user.managerId?.fullName ? `${user.managerId.fullName} (${user.managerId.employeeCode})` : 'Ban Giám Đốc (CEO)'}
                        </span>
                      </div>
                    </div>

                    {/* Form lập tờ trình đề xuất điều chuyển lên Ban Giám Đốc */}
                    <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-3">
                      <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                        <Send className="w-3.5 h-3.5 text-teal-400" />
                        <span>Lập Tờ Trình Đề Xuất Điều Chuyển Lên Ban Giám Đốc</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Phòng ban đề xuất chuyển đến</label>
                          <select
                            value={proposedDeptId}
                            onChange={(e) => setProposedDeptId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                          >
                            <option value="">-- Chọn phòng ban mới đề xuất --</option>
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name} ({dept.code}) {dept.level === 1 ? '• Khối cấp 1' : '• Phòng cấp 2'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Cán bộ quản lý đề xuất bổ nhiệm</label>
                          <select
                            value={proposedMgrId}
                            onChange={(e) => setProposedMgrId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                          >
                            <option value="">-- Chọn quản lý mới đề xuất --</option>
                            {managers
                              .filter((m) => m._id !== user._id)
                              .map((mgr) => (
                                <option key={mgr._id} value={mgr._id}>
                                  {mgr.fullName} ({mgr.employeeCode}) - {mgr.role}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-xs mb-1 font-medium">
                          Lý do đề xuất điều chuyển *
                        </label>
                        <input
                          type="text"
                          value={transferProposalReason}
                          onChange={(e) => setTransferProposalReason(e.target.value)}
                          placeholder="VD: Điều chuyển tăng cường nhân sự kỹ thuật cho dự án mới, nâng cao hiệu quả..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-[11px] text-slate-400">
                          Thông báo tờ trình sẽ được gửi tức thì đến hộp thư và chuông thông báo của CEO.
                        </span>
                        <button
                          type="button"
                          onClick={handleProposeTransfer}
                          disabled={proposingTransfer || !transferProposalReason.trim()}
                          className="inline-flex items-center space-x-2 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
                        >
                          {proposingTransfer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          <span>Gửi Đề Xuất Lên CEO</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {deptMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      deptMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {deptMsg.text}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BIOMETRICS & CONSENT (LUẬT BVDLCN 91/2025) */}
          {activeTab === 'biometrics' && (
            <div className="space-y-6">
              {/* Banner pháp lý BVDLCN */}
              <div className="p-4 rounded-2xl bg-surface border-2 border-line flex items-start gap-3.5 shadow-hard-xs text-fg">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-muted leading-relaxed font-medium">
                  <strong className="text-fg font-bold">Quy chế Dữ liệu Sinh trắc học:</strong> Hệ thống tuân thủ nghiêm ngặt Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. Chỉ lưu trữ vector toán học 128 chiều đã mã hóa <strong>AES-256-GCM</strong>, tuyệt đối không lưu ảnh chụp thô. Nhân viên có quyền rút lại đồng ý và xóa vĩnh viễn dữ liệu bất kỳ lúc nào.
                </div>
              </div>

              {revokeSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{revokeSuccessMsg}</span>
                </div>
              )}

              {faceLoading ? (
                <div className="p-12 flex flex-col items-center justify-center text-muted text-xs gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="font-semibold">Đang kiểm tra dữ liệu sinh trắc học an toàn...</span>
                </div>
              ) : faceError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{faceError}</span>
                  <button onClick={loadFaceStatus} className="ml-auto underline cursor-pointer">Thử lại</button>
                </div>
              ) : faceStatus?.hasFaceRegistered ? (
                /* ĐÃ ĐĂNG KÝ MẪU */
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-surface border-2 border-line relative overflow-hidden shadow-hard-xs text-fg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-lime text-ink border-2 border-line flex items-center justify-center shadow-hard-xs font-bold">
                          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-fg font-display">
                              Khuôn Mặt Đã Được Đăng Ký Hợp Lệ
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-lime text-ink text-[10px] font-bold border border-line">
                              {faceStatus.sampleCount} Mẫu (128D)
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5 font-medium">
                            Sẵn sàng điểm danh tại tất cả thiết bị FaceID Kiosk thuộc công ty.
                          </p>
                        </div>
                      </div>

                      {/* Nút hành động cho HR hoặc Chủ thể */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isCeoOrHr && (
                          <button
                            type="button"
                            onClick={() => setEnrollModalOpen(true)}
                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-fg bg-surface-2 hover:bg-surface border-2 border-line rounded-xl shadow-xs transition cursor-pointer"
                          >
                            Lấy mẫu lại
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRevokeConfirmOpen(true)}
                          className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Rút đồng ý &amp; Xóa mẫu</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata chi tiết */}
                    <div className="mt-5 pt-4 border-t-2 border-line/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted font-bold font-mono text-[11px]">Thời gian chấp thuận &amp; Lấy mẫu:</span>
                        <p className="font-bold text-fg mt-0.5 font-mono">
                          {faceStatus.consent?.registeredAt
                            ? new Date(faceStatus.consent.registeredAt).toLocaleString('vi-VN')
                            : 'Chưa xác định'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted font-bold font-mono text-[11px]">Cán bộ HR trực tiếp giám sát:</span>
                        <p className="font-bold text-primary mt-0.5">
                          {faceStatus.consent?.enrolledBy
                            ? `${faceStatus.consent.enrolledBy.fullName} (${faceStatus.consent.enrolledBy.employeeCode})`
                            : 'Quản trị viên'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted font-bold font-mono text-[11px]">Phiên bản điều khoản BVDLCN:</span>
                        <p className="font-mono text-fg font-bold mt-0.5">
                          {faceStatus.consent?.consentPolicyVersion || 'v2026.1'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted font-bold font-mono text-[11px]">Thuật toán &amp; Mã hóa At-Rest:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Lock className="w-3.5 h-3.5" />
                          AES-256-GCM (MobileNet SSD 128D)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CHƯA ĐĂNG KÝ MẪU */
                <div className="p-8 rounded-2xl bg-surface border-2 border-line shadow-hard-xs text-center space-y-4 text-fg">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-black text-fg font-display">
                      Chưa Đăng Ký Dữ Liệu Khuôn Mặt
                    </h4>
                    <p className="text-xs text-muted mt-1 leading-relaxed font-medium">
                      Nhân sự chưa có vector embedding để điểm danh FaceID. Theo quy định tại Luật BVDLCN, việc lấy mẫu bắt buộc phải có sự hiện diện và giám sát trực tiếp của Cán bộ Nhân sự (HR).
                    </p>
                  </div>

                  {isCeoOrHr ? (
                    <button
                      type="button"
                      onClick={() => setEnrollModalOpen(true)}
                      className="px-6 py-2.5 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition inline-flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Bắt đầu Lấy mẫu có HR giám sát (BVDLCN)</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-surface-2 border-2 border-line text-xs text-muted inline-block font-medium">
                      💡 Vui lòng liên hệ Bộ phận Nhân sự (HR) để thực hiện thủ tục lấy mẫu trực tiếp tại văn phòng.
                    </div>
                  )}
                </div>
              )}

              {/* Modal xác nhận rút lại đồng ý */}
              {revokeConfirmOpen && (
                <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/5 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-200">
                        Xác nhận rút lại đồng ý theo Khoản 2 Điều 14 Luật BVDLCN số 91/2025?
                      </h5>
                      <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                        Toàn bộ vector khuôn mặt của nhân viên sẽ bị <strong>xóa vĩnh viễn</strong> khỏi cơ sở dữ liệu ngay lập tức. Sau khi xóa, nhân viên không thể điểm danh bằng FaceID và phải chuyển sang hình thức chấm công khác.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={revokingConsent}
                      onClick={() => setRevokeConfirmOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                    >
                      Giữ lại
                    </button>
                    <button
                      type="button"
                      disabled={revokingConsent}
                      onClick={handleRevokeConsent}
                      className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow transition flex items-center gap-1.5"
                    >
                      {revokingConsent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Xác nhận xóa vĩnh viễn
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-2 border-t-2 border-line">
          <span className="text-xs text-muted font-mono font-bold">
            Tenant: {currentUser?.companyId || 'company_default'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer uppercase tracking-wider"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        user={user}
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onEnrollmentSuccess={() => {
          loadFaceStatus();
        }}
      />
    </div>,
    document.body
  );
};
