import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' }),
  deviceId: z.string().optional().default('web'),
}).strict({ message: 'Request chứa trường dữ liệu không được phép (Mass Assignment Prevention)' });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
  deviceId: z.string().optional().default('web'),
}).strict({ message: 'Request chứa trường dữ liệu không được phép' }).default({});
