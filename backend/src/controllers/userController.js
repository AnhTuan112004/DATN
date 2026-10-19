import * as userService from '../services/userService.js';
import {
  createUserSchema,
  updateUserSchema,
  updateRoleSchema,
  updateSalaryConfigSchema,
  addContractSchema,
} from '../validations/userValidation.js';

/**
 * GET /api/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, departmentId, role, isActive, search } = req.query;
    const result = await userService.getUsers({
      page,
      limit,
      departmentId,
      role,
      isActive,
      search,
      currentUser: req.user,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 */
export const createUser = async (req, res, next) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const newUser = await userService.createUser(validatedData, req.user);
    res.status(201).json({
      success: true,
      message: 'Tạo hồ sơ nhân viên thành công',
      data: newUser,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);
    const updated = await userService.updateUser(req.params.id, validatedData, req.user);
    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ nhân viên thành công',
      data: updated,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/users/:id/role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = updateRoleSchema.parse(req.body);
    const updated = await userService.updateUserRole(req.params.id, role, req.user);
    res.status(200).json({
      success: true,
      message: `Đã thay đổi vai trò thành ${role}`,
      data: updated,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Vai trò không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * GET /api/users/:id/salary
 */
export const getUserSalary = async (req, res, next) => {
  try {
    const salaryConfig = await userService.getUserSalaryConfig(req.params.id);
    res.status(200).json({
      success: true,
      data: salaryConfig,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/salary
 */
export const updateUserSalary = async (req, res, next) => {
  try {
    const validatedSalary = updateSalaryConfigSchema.parse(req.body);
    const updatedSalary = await userService.updateUserSalaryConfig(req.params.id, validatedSalary, req.user);
    res.status(200).json({
      success: true,
      message: 'Cập nhật cấu hình lương thành công',
      data: updatedSalary,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Cấu hình lương không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * POST /api/users/:id/contracts
 */
export const addContract = async (req, res, next) => {
  try {
    const validatedContract = addContractSchema.parse(req.body);
    const newContract = await userService.addContract(req.params.id, validatedContract, req.user);
    res.status(201).json({
      success: true,
      message: 'Thêm hợp đồng lao động mới thành công',
      data: newContract,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Thông tin hợp đồng không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/avatar
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn tệp ảnh đại diện để tải lên (tên trường: avatar)',
      });
    }

    const updatedUser = await userService.updateUserAvatar(req.params.id, req.file.buffer, req.user);
    res.status(200).json({
      success: true,
      message: 'Tải lên và cập nhật ảnh đại diện thành công',
      data: {
        avatarUrl: updatedUser.avatarUrl,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
