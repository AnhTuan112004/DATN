import { z } from 'zod';

export const locationSchema = z.object({
  locationId: z.string().trim().optional(),
  name: z.string().trim().min(2, { message: 'Tên địa điểm phải từ 2 ký tự' }),
  latitude: z.number().min(-90).max(90, { message: 'Vĩ độ latitude phải trong khoảng -90 đến 90' }),
  longitude: z.number().min(-180).max(180, { message: 'Kinh độ longitude phải trong khoảng -180 đến 180' }),
  radiusMeters: z.number().min(10, { message: 'Bán kính tối thiểu 10m' }).max(5000, { message: 'Bán kính tối đa 5000m' }).default(100),
}).strict({ message: 'Request chứa trường dữ liệu không hợp lệ' });

export const updateLocationSchema = z.object({
  name: z.string().trim().min(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(10).max(5000).optional(),
}).strict({ message: 'Request chứa trường dữ liệu không hợp lệ' });
