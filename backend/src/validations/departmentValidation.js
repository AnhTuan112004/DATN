import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, { message: 'Tên phòng ban phải từ 2 ký tự' }),
  code: z.string().trim().min(2, { message: 'Mã phòng ban phải từ 2 ký tự' }).toUpperCase(),
  parentDepartmentId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  description: z.string().optional().default(''),
}).strict({ message: 'Request chứa trường dữ liệu không được phép' }).transform((val) => ({
  ...val,
  parentDepartmentId: val.parentDepartmentId || val.parentId || null,
}));

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  code: z.string().trim().min(2).toUpperCase().optional(),
  parentDepartmentId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  description: z.string().optional(),
}).strict({ message: 'Request chứa trường dữ liệu không được phép' }).transform((val) => ({
  ...val,
  parentDepartmentId: val.parentDepartmentId !== undefined ? val.parentDepartmentId : (val.parentId !== undefined ? val.parentId : undefined),
}));

