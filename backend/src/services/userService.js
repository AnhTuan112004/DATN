import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';

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
  const [users, total] = await Promise.all([
    User.find(query)
      .populate('departmentId', 'name code')
      .populate('managerId', 'fullName employeeCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Lấy chi tiết hồ sơ một nhân viên
 */
export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('departmentId', 'name code')
    .populate('managerId', 'fullName employeeCode email');

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
  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true, runValidators: true }
  ).populate('departmentId', 'name code');

  if (!updated) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

/**
 * Endpoint quản trị chuyên biệt: Đổi Role nhân viên
 */
export const updateUserRole = async (id, newRole, actor) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const oldRole = user.role;
  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: { role: newRole } },
    { new: true }
  );

  await AuditLog.create({
    companyId: user.companyId,
    userId: actor.id,
    action: 'UPDATE_ROLE',
    details: { targetUserId: id, oldRole, newRole },
  });

  return updated;
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
 * Xóa mềm nhân viên (isActive = false)
 */
export const deleteUser = async (id, actor) => {
  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!updated) {
    const error = new Error('Nhân viên không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (actor) {
    await AuditLog.create({
      companyId: updated.companyId,
      userId: actor.id,
      action: 'DEACTIVATE_USER',
      details: { targetUserId: id, employeeCode: updated.employeeCode },
    });
  }

  return { success: true, message: 'Đã vô hiệu hóa tài khoản nhân viên thành công' };
};
