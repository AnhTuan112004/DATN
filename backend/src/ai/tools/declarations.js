import { Type } from '@google/genai';

export const P0_TOOLS_DECLARATIONS = [
  {
    name: 'get_leave_balance',
    description: 'Tra cứu số dư ngày phép năm, số ngày phép đã dùng và chế độ thâm niên của nhân viên đang đăng nhập.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_payslip',
    description: 'Tra cứu phiếu lương chi tiết theo tháng và năm của nhân viên đang đăng nhập.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        month: {
          type: Type.INTEGER,
          description: 'Tháng cần xem (1 đến 12)',
        },
        year: {
          type: Type.INTEGER,
          description: 'Năm cần xem (ví dụ: 2026)',
        },
      },
      required: ['month', 'year'],
    },
  },
  {
    name: 'get_attendance_summary',
    description: 'Tra cứu tổng hợp tình hình chấm công (số ngày công, số lần đi muộn, số giờ làm thêm) của nhân viên đang đăng nhập.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        month: {
          type: Type.INTEGER,
          description: 'Tháng cần tra cứu (1 đến 12)',
        },
        year: {
          type: Type.INTEGER,
          description: 'Năm cần tra cứu (ví dụ: 2026)',
        },
      },
      required: ['month', 'year'],
    },
  },
  {
    name: 'get_team_leave_stats',
    description: 'Tra cứu thống kê nghỉ phép của phòng ban hoặc đội ngũ (Chỉ dành cho Manager, HR Manager và CEO).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        month: {
          type: Type.INTEGER,
          description: 'Tháng cần xem',
        },
        year: {
          type: Type.INTEGER,
          description: 'Năm cần xem',
        },
      },
      required: ['month', 'year'],
    },
  },
];
