import * as departmentService from '../services/departmentService.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validations/departmentValidation.js';

/**
 * GET /api/departments (Cây phòng ban 2 cấp)
 */
export const getDepartmentTree = async (req, res, next) => {
  try {
    const tree = await departmentService.getDepartmentTree();
    res.status(200).json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/departments/list (Danh sách phẳng)
 */
export const getAllDepartments = async (req, res, next) => {
  try {
    const list = await departmentService.getAllDepartments();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/departments/:id
 */
export const getDepartmentById = async (req, res, next) => {
  try {
    const dept = await departmentService.getDepartmentById(req.params.id);
    res.status(200).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/departments
 */
export const createDepartment = async (req, res, next) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);
    const newDept = await departmentService.createDepartment(validatedData);
    res.status(201).json({
      success: true,
      message: 'Tạo phòng ban thành công',
      data: newDept,
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
 * PATCH /api/departments/:id
 */
export const updateDepartment = async (req, res, next) => {
  try {
    const validatedData = updateDepartmentSchema.parse(req.body);
    const updated = await departmentService.updateDepartment(req.params.id, validatedData);
    res.status(200).json({
      success: true,
      message: 'Cập nhật phòng ban thành công',
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
 * DELETE /api/departments/:id
 */
export const deleteDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
