import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Họ và tên phải có tối thiểu 2 ký tự' }),
  email: z.string().trim().toLowerCase().email({ message: 'Email không hợp lệ' }),
  employeeCode: z.string().trim().optional(),
  phone: z.string().trim().optional().default(''),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  password: z.string().min(6).optional().default('Admin@123456'),
  hireDate: z.string().optional(),
  // Khởi tạo hợp đồng ban đầu (tùy chọn)
  contract: z.object({
    contractType: z.enum(['PROBATION', 'DEFINITE', 'INDEFINITE']).default('DEFINITE'),
    baseSalary: z.number().min(0, { message: 'Lương cơ bản không được âm' }),
    allowance: z.number().min(0).optional().default(0),
    effectiveFrom: z.string(),
    effectiveTo: z.string().nullable().optional(),
  }).optional(),
}).strict({ message: 'Cấm truyền trường dữ liệu ngoài phạm vi (Mass Assignment Prevention)' });

// Cập nhật thông tin thông thường (TUYỆT ĐỐI KHÔNG cho đổi role hoặc salaryConfig ở đây)
export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
}).strict({ message: 'Chỉnh sửa role hoặc lương phải qua endpoint quản trị chuyên biệt' });

// Endpoint quản trị riêng biệt: Đổi Role
export const updateRoleSchema = z.object({
  role: z.nativeEnum(ROLES, { message: 'Vai trò chức vụ không hợp lệ' }),
}).strict();

// Endpoint quản trị riêng biệt: Cập nhật Cấu hình Lương
export const updateSalaryConfigSchema = z.object({
  baseSalary: z.number().min(0, { message: 'Lương cơ bản không được âm' }),
  positionAllowance: z.number().min(0).optional().default(0),
  mealAllowance: z.number().min(0).optional().default(0),
  dependentsCount: z.number().int().min(0).optional().default(0),
  isResident: z.boolean().optional().default(true),
  contractDurationMonths: z.number().int().min(1).optional().default(12),
}).strict();

// Thêm hợp đồng lao động mới vào contracts[]
export const addContractSchema = z.object({
  contractType: z.enum(['PROBATION', 'DEFINITE', 'INDEFINITE']),
  baseSalary: z.number().min(0),
  allowance: z.number().min(0).optional().default(0),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable().optional(),
}).strict();
