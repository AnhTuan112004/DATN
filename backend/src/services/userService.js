import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { AuditLog } from '../models/AuditLog.js';
import { FaceTemplate } from '../models/FaceTemplate.js';
import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';
import { uploadAvatarToCloudinary } from '../config/cloudinary.js';
import { EmailService } from './emailService.js';
import { createAndSendNotification } from './notificationService.js';

/**
 * Sinh mã nhân viên tự động NVxxxx
 */
export const generateNextEmployeeCode = async () => {
  const lastUser = await User.findOne({ employeeCode: { $regex: /^NV\d+$/ } })
    .sort({ employeeCode: -1 })
    .select('employeeCode');

  if (!lastUser || !lastUser.employeeCode) {
    return 'NV0001';
  }

  const match = lastUser.employeeCode.match(/^NV(\d+)$/);
  if (!match) return 'NV0001';

  const nextNum = parseInt(match[1], 10) + 1;
  return `NV${String(nextNum).padStart(4, '0')}`;
};

/**
 * Lấy danh sách nhân viên có phân trang, lọc và bảo vệ Projection
 */
export const getUsers = async ({
  page = 1,
  limit = 20,
  departmentId,
  role,
  isActive,
  search,
  currentUser,
}) => {
  const query = {};

  if (departmentId) query.departmentId = departmentId;
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ fullName: regex }, { employeeCode: regex }, { email: regex }];
  }

  // Quản lý xem cấp dưới hoặc thành viên cùng phòng ban
  if (currentUser && currentUser.role === ROLES.MANAGER) {
    query.$or = [
      { managerId: currentUser.id },
      { departmentId: currentUser.departmentId },
      { _id: currentUser.id },
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

  // BẢO VỆ PROJECTION: Tuyệt đối không chọn salaryConfig, passwordHash, refreshTokens
  const [users, total, activeCount, leadershipCount, unassignedDeptCount] = await Promise.all([
    User.find(query)
      .populate('departmentId', 'name code')
      .populate('managerId', 'fullName employeeCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    User.countDocuments(query),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: { $in: [ROLES.CEO, ROLES.HR_MANAGER, ROLES.MANAGER] } }),
    User.countDocuments({ departmentId: null }),
  ]);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
    stats: {
      totalEmployees: total,
      activeCount,
      leadershipCount,
      unassignedDeptCount,
    },
  };
};

/**
 * Lấy chi tiết hồ sơ một nhân viên
 */
export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('departmentId', 'name code')
    .populate('managerId', 'fullName employeeCode email')
    .populate('roleProposal.proposedBy', 'fullName employeeCode email role')
    .populate('roleProposal.decidedBy', 'fullName employeeCode email role');

  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Tạo mới nhân viên
 */
export const createUser = async (data, actor) => {
  // Kiểm tra email duy nhất
  const existingEmail = await User.findOne({ email: data.email.toLowerCase() }).setOptions({ skipTenant: true });
  if (existingEmail) {
    const error = new Error(`Email ${data.email} đã được đăng ký trong hệ thống`);
    error.statusCode = 409;
    throw error;
  }

  // Mã nhân viên
  let employeeCode = data.employeeCode;
  if (!employeeCode) {
    employeeCode = await generateNextEmployeeCode();
  } else {
    const existingCode = await User.findOne({ employeeCode });
    if (existingCode) {
      const error = new Error(`Mã nhân viên ${employeeCode} đã tồn tại`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Mã hóa mật khẩu ban đầu
  const passwordHash = await bcrypt.hash(data.password || 'Admin@123456', 10);

  // Tính số dư phép năm theo Điều 114 BLLĐ (thâm niên)
  const hireDateObj = data.hireDate ? new Date(data.hireDate) : new Date();
  const currentYear = new Date().getFullYear();
  const seniorityYears = Math.max(0, currentYear - hireDateObj.getFullYear());
  const seniorityBonusDays = Math.floor(seniorityYears / 5);
  const annualTotal = 12 + seniorityBonusDays;

  // Hợp đồng lao động khởi tạo (nếu có)
  const contracts = [];
  if (data.contract) {
    contracts.push({
      contractNumber: `HDLD-${hireDateObj.getFullYear()}-${employeeCode}`,
      contractType: data.contract.contractType,
      effectiveFrom: new Date(data.contract.effectiveFrom),
      effectiveTo: data.contract.effectiveTo ? new Date(data.contract.effectiveTo) : null,
      baseSalary: data.contract.baseSalary,
      allowance: data.contract.allowance || 0,
      status: 'ACTIVE',
      signedDate: hireDateObj,
    });
  }

  const newUser = await User.create({
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    employeeCode,
    phone: data.phone || null,
    departmentId: data.departmentId || null,
    managerId: data.managerId || null,
    role: data.role || ROLES.EMPLOYEE,
    passwordHash,
    hireDate: hireDateObj,
    contracts,
    leaveBalance: {
      annualTotal,
      annualRemaining: annualTotal,
      annualUsed: 0,
      seniorityBonusDays,
      sickUsed: 0,
      sickRemaining: 30,
    },
    salaryConfig: data.contract
      ? {
          baseSalary: data.contract.baseSalary,
          positionAllowance: data.contract.allowance || 0,
          mealAllowance: 0,
          dependentsCount: 0,
          isResident: true,
          contractDurationMonths: 12,
        }
      : undefined,
  });

  // Ghi AuditLog
  if (actor) {
    await AuditLog.create({
      companyId: newUser.companyId,
      userId: actor.id,
      action: 'CREATE_USER',
      details: { newUserId: newUser._id, employeeCode },
    });
  }

  return await getUserById(newUser._id);
};

/**
 * Cập nhật thông tin nhân viên thông thường (Chống Mass Assignment)
 */
export const updateUser = async (id, data, actor) => {
  const oldUser = await User.findById(id).populate('departmentId', 'name');
  if (!oldUser) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Bảo vệ thẩm quyền phân cấp Fail-Closed: Chỉ CEO mới có quyền trực tiếp điều chuyển phòng ban hoặc cán bộ quản lý
  const isChangingDept = data.departmentId !== undefined && (oldUser.departmentId?._id?.toString() || null) !== (data.departmentId ? data.departmentId.toString() : null);
  const isChangingMgr = data.managerId !== undefined && (oldUser.managerId?.toString() || null) !== (data.managerId ? data.managerId.toString() : null);

  if ((isChangingDept || isChangingMgr) && actor && actor.role !== ROLES.CEO) {
    const error = new Error('Chỉ Tổng Giám Đốc (CEO) mới có thẩm quyền điều chuyển phòng ban và bổ nhiệm cán bộ quản lý trực tiếp. HR chỉ có quyền lập đề xuất.');
    error.statusCode = 403;
    throw error;
  }

  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true, runValidators: true }
  ).populate('departmentId', 'name code').populate('managerId', 'fullName employeeCode email');

  // Ghi AuditLog nếu có sự thay đổi điều chuyển do CEO thực hiện
  if ((isChangingDept || isChangingMgr) && actor) {
    await AuditLog.create({
      companyId: updated.companyId,
      userId: actor.id || actor._id,
      action: 'TRANSFER_DEPARTMENT',
      details: {
        targetUserId: id,
        oldDepartment: oldUser.departmentId?.name || 'Chưa phân bổ',
        newDepartment: updated.departmentId?.name || 'Chưa phân bổ',
        oldManagerId: oldUser.managerId,
        newManagerId: updated.managerId?._id || updated.managerId,
      },
    });
  }

  // Tự động gửi Email điều chuyển phòng ban nếu phòng ban thay đổi
  if (
    isChangingDept &&
    data.departmentId &&
    updated.email
  ) {
    EmailService.sendDepartmentTransferEmail({
      employeeEmail: updated.email,
      employeeName: updated.fullName,
      oldDepartmentName: oldUser?.departmentId?.name || 'Chưa phân bổ',
      newDepartmentName: updated.departmentId?.name || 'Phòng ban mới',
      roleTitle: updated.role,
    }).catch((err) => console.warn('[EmailService] Lỗi gửi email điều chuyển phòng ban:', err.message));
  }

  return updated;
};

/**
 * Endpoint quản trị chuyên biệt: Đổi Role nhân viên (Chỉ CEO có quyền quyết định)
 */
export const updateUserRole = async (id, newRole, actor) => {
  if (actor.role !== ROLES.CEO) {
    const error = new Error('Chỉ Tổng Giám Đốc (CEO) mới có quyền trực tiếp thay đổi vai trò người dùng');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const oldRole = user.role;
  const updated = await User.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        role: newRole,
        'roleProposal.status': 'APPROVED',
        'roleProposal.decidedBy': actor.id || actor._id,
        'roleProposal.decidedAt': new Date(),
        'roleProposal.comment': 'Bổ nhiệm trực tiếp bởi Tổng Giám Đốc (CEO)',
      },
    },
    { new: true }
  )
    .populate('roleProposal.proposedBy', 'fullName employeeCode email role')
    .populate('roleProposal.decidedBy', 'fullName employeeCode email role');

  await AuditLog.create({
    companyId: user.companyId,
    userId: actor.id || actor._id,
    action: AUDIT_ACTIONS.UPDATE_ROLE,
    details: { targetUserId: id, oldRole, newRole },
  });

  // Tự động gửi Email thông báo thăng chức / điều chỉnh vai trò
  if (user.email && oldRole !== newRole) {
    EmailService.sendPromotionEmail({
      employeeEmail: user.email,
      employeeName: user.fullName,
      oldRole,
      newRole,
    }).catch((err) => console.warn('[EmailService] Lỗi gửi email thăng chức:', err.message));
  }

  return updated;
};

/**
 * HR Manager gửi đề xuất điều chỉnh vai trò / bổ nhiệm lên CEO
 */
export const proposeUserRole = async (id, { proposedRole, reason }, actor) => {
  if (actor.role !== ROLES.HR_MANAGER && actor.role !== ROLES.CEO) {
    const error = new Error('Chỉ Quản lý Nhân sự (HR Manager) và CEO mới được phép gửi đề xuất bổ nhiệm vai trò');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === proposedRole) {
    const error = new Error(`Nhân viên ${user.fullName} hiện tại đã giữ vai trò ${proposedRole}`);
    error.statusCode = 422;
    throw error;
  }

  const proposal = {
    proposedRole,
    reason: reason ? reason.trim() : 'Đề xuất điều chỉnh vai trò từ HR Manager',
    proposedBy: actor.id || actor._id,
    proposedAt: new Date(),
    status: 'PENDING',
    decidedBy: null,
    decidedAt: null,
    comment: '',
  };

  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: { roleProposal: proposal } },
    { new: true }
  ).populate('roleProposal.proposedBy', 'fullName employeeCode email role');

  await AuditLog.create({
    companyId: user.companyId,
    userId: actor.id || actor._id,
    action: AUDIT_ACTIONS.PROPOSE_ROLE,
    details: { targetUserId: id, currentRole: user.role, proposedRole, reason },
  });

  // Gửi thông báo cho Ban Giám Đốc (CEO)
  try {
    const ceos = await User.find({ companyId: user.companyId, role: ROLES.CEO, isActive: true });
    for (const ceo of ceos) {
      await createAndSendNotification({
        companyId: user.companyId,
        userId: ceo._id,
        title: '👑 Đề xuất bổ nhiệm vai trò cần CEO phê duyệt',
        message: `${actor.fullName || 'Quản lý Nhân Sự'} đã gửi đề xuất bổ nhiệm nhân viên ${user.fullName} (${user.employeeCode}) sang vai trò "${proposedRole}". Vui lòng xem xét phê duyệt.`,
        type: 'ROLE_PROPOSAL',
        data: { targetUserId: id, proposedRole, requiresApproval: true },
      });
    }
  } catch (err) {
    console.warn('[Notification Error]', err.message);
  }

  return updated;
};

/**
 * CEO phê duyệt hoặc từ chối đề xuất bổ nhiệm vai trò từ HR
 */
export const approveUserRoleProposal = async (id, { decision, comment }, actor) => {
  if (actor.role !== ROLES.CEO) {
    const error = new Error('Chỉ Tổng Giám Đốc (CEO) mới có quyền phê duyệt đề xuất bổ nhiệm vai trò');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (!user.roleProposal || user.roleProposal.status !== 'PENDING') {
    const error = new Error('Nhân viên này không có đề xuất vai trò nào đang chờ duyệt');
    error.statusCode = 400;
    throw error;
  }

  const oldRole = user.role;
  const proposedRole = user.roleProposal.proposedRole;
  const isApproved = decision === 'APPROVE';

  const updateFields = {
    'roleProposal.status': isApproved ? 'APPROVED' : 'REJECTED',
    'roleProposal.decidedBy': actor.id || actor._id,
    'roleProposal.decidedAt': new Date(),
    'roleProposal.comment': comment ? comment.trim() : (isApproved ? 'Đã phê duyệt' : 'Từ chối'),
  };

  if (isApproved) {
    updateFields.role = proposedRole;
  }

  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: updateFields },
    { new: true }
  )
    .populate('roleProposal.proposedBy', 'fullName employeeCode email role')
    .populate('roleProposal.decidedBy', 'fullName employeeCode email role');

  await AuditLog.create({
    companyId: user.companyId,
    userId: actor.id || actor._id,
    action: isApproved ? AUDIT_ACTIONS.APPROVE_ROLE_PROPOSAL : AUDIT_ACTIONS.REJECT_ROLE_PROPOSAL,
    details: { targetUserId: id, oldRole, newRole: isApproved ? proposedRole : oldRole, decision, comment },
  });

  // Tự động gửi Email thông báo thăng chức nếu phê duyệt
  if (isApproved && user.email) {
    EmailService.sendPromotionEmail({
      employeeEmail: user.email,
      employeeName: user.fullName,
      oldRole,
      newRole: proposedRole,
    }).catch((err) => console.warn('[EmailService] Lỗi gửi email thăng chức:', err.message));
  }

  // Gửi thông báo cho HR Manager đã đề xuất và nhân sự được bổ nhiệm
  try {
    const hrId = user.roleProposal.proposedBy;
    if (hrId) {
      await createAndSendNotification({
        companyId: user.companyId,
        userId: hrId,
        title: isApproved ? '✅ Đề xuất vai trò đã được CEO phê duyệt' : '❌ Đề xuất vai trò bị CEO từ chối',
        message: `Tổng Giám Đốc (CEO) đã ${isApproved ? 'phê duyệt quyết định' : 'từ chối'} đề xuất bổ nhiệm vai trò "${proposedRole}" cho nhân viên ${user.fullName}.`,
        type: 'ROLE_PROPOSAL',
        data: { targetUserId: id, decision },
      });
    }

    if (isApproved) {
      await createAndSendNotification({
        companyId: user.companyId,
        userId: id,
        title: '🎉 Quyết định bổ nhiệm vai trò mới',
        message: `Chúc mừng bạn! Tổng Giám Đốc (CEO) đã phê duyệt bổ nhiệm bạn sang vai trò "${proposedRole}".`,
        type: 'ROLE_PROPOSAL',
        data: { targetUserId: id, newRole: proposedRole },
      });
    }
  } catch (notifErr) {
    console.warn('[Notification Error]', notifErr.message);
  }

  return updated;
};

/**
 * Hủy bỏ đề xuất vai trò đang chờ duyệt (Người lập HR hoặc CEO)
 */
export const cancelUserRoleProposal = async (id, actor) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (!user.roleProposal || user.roleProposal.status !== 'PENDING') {
    const error = new Error('Không có đề xuất vai trò nào đang chờ duyệt');
    error.statusCode = 400;
    throw error;
  }

  const updated = await User.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        'roleProposal.status': 'CANCELLED',
        'roleProposal.decidedBy': actor.id || actor._id,
        'roleProposal.decidedAt': new Date(),
        'roleProposal.comment': 'Đề xuất đã bị hủy bỏ bởi người lập',
      },
    },
    { new: true }
  );

  // Gửi thông báo khi đề xuất bị rút lại
  try {
    const ceos = await User.find({ companyId: user.companyId, role: ROLES.CEO, isActive: true });
    for (const ceo of ceos) {
      if (ceo._id.toString() !== (actor.id || actor._id).toString()) {
        await createAndSendNotification({
          companyId: user.companyId,
          userId: ceo._id,
          title: 'ℹ️ Đề xuất bổ nhiệm vai trò đã được rút lại',
          message: `Quản lý Nhân Sự đã rút lại đề xuất bổ nhiệm cho nhân viên ${user.fullName} (${user.employeeCode}).`,
          type: 'ROLE_PROPOSAL',
          data: { targetUserId: id },
        });
      }
    }
  } catch (notifErr) {
    console.warn('[Notification Error]', notifErr.message);
  }

  return updated;
};

/**
 * HR Manager gửi đề xuất điều chuyển phòng ban / cán bộ quản lý lên CEO
 */
export const proposeUserTransfer = async (id, { proposedDepartmentId, proposedManagerId, reason }, actor) => {
  if (actor.role !== ROLES.HR_MANAGER && actor.role !== ROLES.CEO) {
    const error = new Error('Chỉ Quản lý Nhân sự (HR Manager) và CEO mới được phép gửi đề xuất điều chuyển');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(id).populate('departmentId', 'name');
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  let deptName = 'Chưa phân bổ';
  if (proposedDepartmentId) {
    const dept = await Department.findById(proposedDepartmentId);
    if (dept) deptName = dept.name;
  }

  let mgrName = 'Không có';
  if (proposedManagerId) {
    const mgr = await User.findById(proposedManagerId);
    if (mgr) mgrName = mgr.fullName;
  }

  await AuditLog.create({
    companyId: user.companyId,
    userId: actor.id || actor._id,
    action: 'PROPOSE_TRANSFER',
    details: {
      targetUserId: id,
      targetUserName: user.fullName,
      proposedDepartmentId,
      proposedDepartmentName: deptName,
      proposedManagerId,
      proposedManagerName: mgrName,
      reason,
    },
  });

  // Gửi thông báo trực tiếp tới Ban Giám Đốc (CEO)
  try {
    const ceos = await User.find({ companyId: user.companyId, role: ROLES.CEO, isActive: true });
    for (const ceo of ceos) {
      await createAndSendNotification({
        companyId: user.companyId,
        userId: ceo._id,
        title: '📋 Tờ trình: Đề xuất điều chuyển nhân sự cần CEO phê chuẩn',
        message: `${actor.fullName || 'HR Manager'} đã gửi tờ trình đề xuất điều chuyển nhân sự ${user.fullName} (${user.employeeCode}) sang ${deptName} (Quản lý: ${mgrName}). Lý do: ${reason.trim()}`,
        type: 'TRANSFER_PROPOSAL',
        data: { targetUserId: id, proposedDepartmentId, proposedManagerId, reason, requiresApproval: true },
      });
    }
  } catch (err) {
    console.warn('[Notification Error]', err.message);
  }

  return {
    success: true,
    message: 'Đã gửi tờ trình đề xuất điều chuyển lên Ban Giám Đốc (CEO) thành công! Thông báo đã được chuyển tới CEO.',
  };
};

/**
 * Endpoint quản trị chuyên biệt: Cập nhật Cấu hình Lương
 */
export const updateUserSalaryConfig = async (id, salaryConfig, actor) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: { salaryConfig } },
    { new: true }
  ).select('+salaryConfig');

  await AuditLog.create({
    companyId: user.companyId,
    userId: actor.id,
    action: AUDIT_ACTIONS.UPDATE_SALARY_CONFIG,
    details: { targetUserId: id, newSalary: salaryConfig.baseSalary },
  });

  return updated.salaryConfig;
};

/**
 * Lấy cấu hình lương của nhân viên (Chỉ HR/CEO hoặc chính mình)
 */
export const getUserSalaryConfig = async (id) => {
  const user = await User.findById(id).select('+salaryConfig');
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return user.salaryConfig;
};

/**
 * Thêm hợp đồng lao động mới vào contracts[]
 */
export const addContract = async (userId, contractData, actor) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const currentYear = new Date().getFullYear();
  const contractNumber = `HDLD-${currentYear}-${user.employeeCode}-${(user.contracts?.length || 0) + 1}`;

  const newContract = {
    contractNumber,
    contractType: contractData.contractType,
    baseSalary: contractData.baseSalary,
    allowance: contractData.allowance || 0,
    effectiveFrom: new Date(contractData.effectiveFrom),
    effectiveTo: contractData.effectiveTo ? new Date(contractData.effectiveTo) : null,
    status: 'ACTIVE',
    signedDate: new Date(),
  };

  // Cập nhật trạng thái các hợp đồng cũ thành EXPIRED và thêm hợp đồng mới bằng $push
  await User.updateOne(
    { _id: userId, 'contracts.status': 'ACTIVE' },
    { $set: { 'contracts.$[elem].status': 'EXPIRED' } },
    { arrayFilters: [{ 'elem.status': 'ACTIVE' }] }
  );

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    {
      $push: { contracts: newContract },
      $set: {
        'salaryConfig.baseSalary': contractData.baseSalary,
        'salaryConfig.positionAllowance': contractData.allowance || 0,
      },
    },
    { new: true }
  );

  if (actor) {
    await AuditLog.create({
      companyId: user.companyId,
      userId: actor.id,
      action: 'ADD_CONTRACT',
      details: { targetUserId: userId, contractNumber },
    });
  }

  return updatedUser.contracts[updatedUser.contracts.length - 1];
};

/**
 * Chấm dứt hợp đồng / Sa thải / Vô hiệu hóa tài khoản nhân viên (isActive = false)
 * Tuân thủ Luật BVDLCN: Tự động xóa vĩnh viễn template FaceID sinh trắc học
 * và gửi Email thông báo chính thức.
 */
export const deleteUser = async (id, actor, { reason } = {}) => {
  const actorId = actor?.userId || actor?.id;

  const target = await User.findById(id);
  if (!target) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Chặn tự vô hiệu hóa tài khoản của chính mình
  if (actorId && actorId.toString() === id.toString()) {
    const error = new Error('Bạn không thể tự chấm dứt hợp đồng hoặc vô hiệu hóa tài khoản của chính mình');
    error.statusCode = 400;
    throw error;
  }

  // Chặn vô hiệu hóa tài khoản Tổng Giám Đốc (CEO)
  if (target.role === ROLES.CEO) {
    const error = new Error('Không thể vô hiệu hóa tài khoản Tổng Giám Đốc (CEO)');
    error.statusCode = 403;
    throw error;
  }

  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: { isActive: false } },
    { new: true }
  );

  // Xóa vĩnh viễn dữ liệu sinh trắc học FaceID khi nhân sự nghỉ việc theo Luật BVDLCN
  await FaceTemplate.deleteOne({ companyId: updated.companyId, userId: id });

  if (actor) {
    await AuditLog.create({
      companyId: updated.companyId,
      userId: actorId,
      action: 'DEACTIVATE_USER',
      details: {
        targetUserId: id,
        employeeCode: updated.employeeCode,
        fullName: updated.fullName,
        reason: reason || 'Chấm dứt hợp đồng lao động',
      },
    });
  }

  // Tự động gửi Email thông báo chấm dứt hợp đồng nếu nhân viên có email
  if (updated.email) {
    EmailService.sendTerminationEmail({
      employeeEmail: updated.email,
      employeeName: updated.fullName,
      reason: reason || 'Quyết định kết thúc hợp đồng lao động từ Ban Giám Đốc',
    }).catch((err) => console.warn('[EmailService] Lỗi gửi email chấm dứt hợp đồng:', err.message));
  }

  return { success: true, message: 'Đã hoàn tất thủ tục chấm dứt hợp đồng và vô hiệu hóa tài khoản nhân viên' };
};

/**
 * Upload ảnh đại diện lên Cloudinary và cập nhật avatarUrl vào User
 */
export const updateUserAvatar = async (id, fileBuffer, actor) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const publicId = `avatar_${user.companyId}_${user.employeeCode}`;
  const uploadResult = await uploadAvatarToCloudinary(fileBuffer, {
    folder: 'peopleinsight/avatars',
    publicId,
  });

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { $set: { avatarUrl: uploadResult.url } },
    { new: true }
  ).populate('departmentId', 'name code');

  if (actor) {
    await AuditLog.create({
      companyId: user.companyId,
      userId: actor.userId || actor.id,
      action: AUDIT_ACTIONS.UPDATE_AVATAR,
      details: {
        targetUserId: id,
        employeeCode: user.employeeCode,
        avatarUrl: uploadResult.url,
      },
    });
  }

  return updatedUser;
};
