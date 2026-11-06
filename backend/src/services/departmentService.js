import { Department } from '../models/Department.js';
import { User } from '../models/User.js';

/**
 * Lấy cây phòng ban 2 cấp kèm số lượng nhân sự
 * Phân quyền: CEO & HR_MANAGER xem toàn bộ; MANAGER & EMPLOYEE chỉ xem phòng ban được phân công / quản lý
 */
export const getDepartmentTree = async (user = null) => {
  const departments = await Department.find()
    .populate('managerId', 'fullName employeeCode email avatarUrl')
    .sort({ name: 1 })
    .lean();

  // Đếm số lượng nhân viên theo phòng ban
  const deptUserCounts = await User.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  deptUserCounts.forEach((c) => {
    if (c._id) countMap.set(c._id.toString(), c.count);
  });

  const departmentList = departments.map((d) => ({
    ...d,
    employeeCount: countMap.get(d._id.toString()) || 0,
  }));

  // Xây dựng cây 2 cấp
  const rootDepartments = [];
  const childMap = new Map();

  departmentList.forEach((dept) => {
    if (dept.parentDepartmentId) {
      const parentId = dept.parentDepartmentId.toString();
      if (!childMap.has(parentId)) {
        childMap.set(parentId, []);
      }
      childMap.get(parentId).push(dept);
    } else {
      rootDepartments.push(dept);
    }
  });

  const fullTree = rootDepartments.map((root) => ({
    ...root,
    children: childMap.get(root._id.toString()) || [],
  }));

  // 1. CEO và HR Manager xem toàn bộ cơ cấu tổ chức công ty
  if (!user || user.role === 'CEO' || user.role === 'HR_MANAGER') {
    return fullTree;
  }

  // 2. MANAGER & EMPLOYEE: Chỉ ai được phân công vào phòng ban nào thì mới được xem phòng ban đó
  const userDoc = await User.findById(user.id || user.userId).select('departmentId').lean();
  const assignedDeptId = userDoc?.departmentId ? userDoc.departmentId.toString() : null;

  // Lấy thêm các phòng ban mà user đang trực tiếp làm Trưởng phòng / Trưởng khối
  const managedDepts = await Department.find({ managerId: user.id || user.userId }).select('_id').lean();
  const accessibleDeptIds = new Set();
  if (assignedDeptId) accessibleDeptIds.add(assignedDeptId);
  managedDepts.forEach((d) => accessibleDeptIds.add(d._id.toString()));

  // Chưa được phân công vào phòng ban nào
  if (accessibleDeptIds.size === 0) {
    return [];
  }

  // Lọc cây phòng ban theo phạm vi được phân công
  const filteredTree = [];
  for (const root of fullTree) {
    const rootId = root._id.toString();
    const isRootAccessible = accessibleDeptIds.has(rootId);

    const allowedChildren = (root.children || []).filter((child) =>
      accessibleDeptIds.has(child._id.toString())
    );

    if (isRootAccessible) {
      // Nếu được phân công trực tiếp vào Khối cấp 1, hiển thị khối cấp 1 này
      filteredTree.push(root);
    } else if (allowedChildren.length > 0) {
      // Nếu được phân công vào phòng ban con cấp 2, hiển thị khối cha nhưng CHỈ chứa đúng phòng ban con của mình
      filteredTree.push({
        ...root,
        children: allowedChildren,
      });
    }
  }

  return filteredTree;
};

/**
 * Lấy danh sách phẳng tất cả phòng ban theo thẩm quyền
 */
export const getAllDepartments = async (user = null) => {
  if (!user || user.role === 'CEO' || user.role === 'HR_MANAGER') {
    return await Department.find()
      .populate('managerId', 'fullName employeeCode')
      .populate('parentDepartmentId', 'name code')
      .sort({ name: 1 });
  }

  const userDoc = await User.findById(user.id || user.userId).select('departmentId').lean();
  const assignedDeptId = userDoc?.departmentId ? userDoc.departmentId.toString() : null;

  const managedDepts = await Department.find({ managerId: user.id || user.userId }).select('_id').lean();
  const accessibleDeptIds = new Set();
  if (assignedDeptId) accessibleDeptIds.add(assignedDeptId);
  managedDepts.forEach((d) => accessibleDeptIds.add(d._id.toString()));

  return await Department.find({ _id: { $in: Array.from(accessibleDeptIds) } })
    .populate('managerId', 'fullName employeeCode')
    .populate('parentDepartmentId', 'name code')
    .sort({ name: 1 });
};

/**
 * Lấy chi tiết một phòng ban (kiểm tra phân quyền)
 */
export const getDepartmentById = async (id, user = null) => {
  const dept = await Department.findById(id)
    .populate('managerId', 'fullName employeeCode email phone')
    .populate('parentDepartmentId', 'name code');

  if (!dept) {
    const error = new Error('Phòng ban không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (user && user.role !== 'CEO' && user.role !== 'HR_MANAGER') {
    const userDoc = await User.findById(user.id || user.userId).select('departmentId').lean();
    const assignedDeptId = userDoc?.departmentId ? userDoc.departmentId.toString() : null;
    const isManager =
      (dept.managerId?._id && dept.managerId._id.toString() === (user.id || user.userId)) ||
      (dept.managerId && dept.managerId.toString() === (user.id || user.userId));
    const isDirectlyAssigned = assignedDeptId === dept._id.toString();
    const isParentAssigned =
      dept.parentDepartmentId &&
      assignedDeptId === (dept.parentDepartmentId._id?.toString() || dept.parentDepartmentId.toString());

    if (!isManager && !isDirectlyAssigned && !isParentAssigned) {
      const error = new Error('Bạn không có quyền truy cập vào thông tin phòng ban này');
      error.statusCode = 403;
      throw error;
    }
  }

  return dept;
};

/**
 * Tạo mới phòng ban
 */
export const createDepartment = async (data) => {
  const existing = await Department.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    const error = new Error(`Mã phòng ban ${data.code} đã tồn tại trong công ty`);
    error.statusCode = 409;
    throw error;
  }

  const parentId = data.parentDepartmentId || data.parentId || null;
  if (parentId) {
    const parentDept = await Department.findById(parentId);
    if (!parentDept) {
      const error = new Error('Phòng ban cha không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Hiến pháp v6.1: Cây phòng ban 2 cấp
    if (parentDept.parentDepartmentId) {
      const error = new Error('Cơ cấu tổ chức giới hạn tối đa 2 cấp phòng ban');
      error.statusCode = 400;
      throw error;
    }
  }

  const cleanData = { ...data };
  delete cleanData.parentId;
  cleanData.parentDepartmentId = parentId;
  cleanData.code = data.code.toUpperCase();

  return await Department.create(cleanData);
};

/**
 * Cập nhật thông tin phòng ban
 */
export const updateDepartment = async (id, data) => {
  if (data.code) {
    const duplicate = await Department.findOne({
      _id: { $ne: id },
      code: data.code.toUpperCase(),
    });
    if (duplicate) {
      const error = new Error(`Mã phòng ban ${data.code} đã được sử dụng`);
      error.statusCode = 409;
      throw error;
    }
    data.code = data.code.toUpperCase();
  }

  const cleanData = { ...data };
  if ('parentId' in cleanData) {
    cleanData.parentDepartmentId = cleanData.parentId;
    delete cleanData.parentId;
  }

  if (cleanData.parentDepartmentId) {
    if (cleanData.parentDepartmentId.toString() === id.toString()) {
      const error = new Error('Phòng ban không thể làm cha của chính nó');
      error.statusCode = 400;
      throw error;
    }
    const parentDept = await Department.findById(cleanData.parentDepartmentId);
    if (!parentDept) {
      const error = new Error('Phòng ban cha không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    if (parentDept.parentDepartmentId) {
      const error = new Error('Cơ cấu tổ chức giới hạn tối đa 2 cấp phòng ban');
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await Department.findOneAndUpdate(
    { _id: id },
    { $set: cleanData },
    { new: true, runValidators: true }
  ).populate('managerId', 'fullName employeeCode');

  if (!updated) {
    const error = new Error('Phòng ban không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

/**
 * Xóa phòng ban (kiểm tra an toàn)
 */
export const deleteDepartment = async (id) => {
  if (!id) {
    const error = new Error('Department ID is required');
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra phòng ban con
  const hasChildren = await Department.countDocuments({ parentDepartmentId: id });
  if (hasChildren > 0) {
    const error = new Error('Không thể xóa phòng ban đang có phòng ban con trực thuộc');
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra nhân viên trực thuộc
  const hasEmployees = await User.countDocuments({ departmentId: id, isActive: true });
  if (hasEmployees > 0) {
    const error = new Error(`Không thể xóa: Có ${hasEmployees} nhân viên đang trực thuộc phòng ban này`);
    error.statusCode = 400;
    throw error;
  }

  const deleted = await Department.findOneAndDelete({ _id: id });
  if (!deleted) {
    const error = new Error('Phòng ban không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return { success: true, message: 'Đã xóa phòng ban thành công' };
};
