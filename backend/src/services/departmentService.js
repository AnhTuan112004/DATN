import { Department } from '../models/Department.js';
import { User } from '../models/User.js';

/**
 * Lấy cây phòng ban 2 cấp kèm số lượng nhân sự
 */
export const getDepartmentTree = async () => {
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

  return rootDepartments.map((root) => ({
    ...root,
    children: childMap.get(root._id.toString()) || [],
  }));
};

/**
 * Lấy danh sách phẳng tất cả phòng ban
 */
export const getAllDepartments = async () => {
  return await Department.find()
    .populate('managerId', 'fullName employeeCode')
    .populate('parentDepartmentId', 'name code')
    .sort({ name: 1 });
};

/**
 * Lấy chi tiết một phòng ban
 */
export const getDepartmentById = async (id) => {
  const dept = await Department.findById(id)
    .populate('managerId', 'fullName employeeCode email phone')
    .populate('parentDepartmentId', 'name code');

  if (!dept) {
    const error = new Error('Phòng ban không tồn tại');
    error.statusCode = 404;
    throw error;
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
