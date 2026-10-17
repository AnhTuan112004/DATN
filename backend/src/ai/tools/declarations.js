import { Type } from '@google/genai';

/**
 * 1. Tool tra cứu số dư phép cá nhân (Không có tham số để tránh lỗi 400 với properties rỗng)
 */
export const TOOL_LEAVE_BALANCE = {
  name: 'get_leave_balance',
  description: 'Tra cứu số dư ngày phép năm, số ngày phép đã dùng và số ngày phép ốm của nhân viên đang đăng nhập.',
};

/**
 * 2. Tool tra cứu phiếu lương cá nhân
 */
export const TOOL_PAYSLIP = {
  name: 'get_payslip',
  description: 'Tra cứu chi tiết phiếu lương (thu nhập, các khoản giảm trừ, bảo hiểm, thuế TNCN, thực nhận) theo tháng và năm của nhân viên đang đăng nhập.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      month: {
        type: Type.INTEGER,
        description: 'Tháng cần xem lương (1 đến 12)',
      },
      year: {
        type: Type.INTEGER,
        description: 'Năm cần xem lương (ví dụ: 2026)',
      },
    },
    required: ['month', 'year'],
  },
};

/**
 * 3. Tool tra cứu tổng hợp chấm công cá nhân
 */
export const TOOL_ATTENDANCE_SUMMARY = {
  name: 'get_attendance_summary',
  description: 'Tra cứu tổng hợp tình hình chấm công (số ngày công thực tế, số lần đi muộn, số giờ làm thêm OT) trong một khoảng thời gian.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      from: {
        type: Type.STRING,
        description: 'Ngày bắt đầu định dạng YYYY-MM-DD',
      },
      to: {
        type: Type.STRING,
        description: 'Ngày kết thúc định dạng YYYY-MM-DD',
      },
    },
    required: ['from', 'to'],
  },
};

/**
 * 4. Tool tra cứu thống kê nghỉ phép của phòng ban (Chỉ cấp quyền cho Manager, HR Manager và CEO)
 */
export const TOOL_TEAM_LEAVE_STATS = {
  name: 'get_team_leave_stats',
  description: 'Tra cứu thống kê tình hình nghỉ phép của một phòng ban hoặc đội ngũ trực thuộc quản lý.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      departmentId: {
        type: Type.STRING,
        description: 'Mã phòng ban (ObjectId) cần thống kê',
      },
      month: {
        type: Type.INTEGER,
        description: 'Tháng cần xem (1 đến 12)',
      },
      year: {
        type: Type.INTEGER,
        description: 'Năm cần xem (ví dụ: 2026)',
      },
    },
    required: ['departmentId', 'month', 'year'],
  },
};

/**
 * 5. Tool hỗ trợ ép Mode ANY khi yêu cầu ngoài phạm vi
 */
export const TOOL_UNSUPPORTED = {
  name: 'unsupported_request',
  description: 'Bắt buộc gọi tool này khi câu hỏi của người dùng nằm ngoài các nghiệp vụ trên (như hỏi về thời tiết, thể thao, chính trị, tra cứu lương người khác hoặc yêu cầu không liên quan).',
};

export const P0_TOOLS_DECLARATIONS = [
  TOOL_LEAVE_BALANCE,
  TOOL_PAYSLIP,
  TOOL_ATTENDANCE_SUMMARY,
  TOOL_TEAM_LEAVE_STATS,
  TOOL_UNSUPPORTED,
];

/**
 * Lọc danh sách công cụ gửi cho AI dựa trên Role của người dùng
 * Nhân viên thường (EMPLOYEE) không được nhìn thấy tool get_team_leave_stats
 */
export function getToolsForRole(role) {
  const employeeTools = [
    TOOL_LEAVE_BALANCE,
    TOOL_PAYSLIP,
    TOOL_ATTENDANCE_SUMMARY,
    TOOL_UNSUPPORTED,
  ];

  if (['CEO', 'HR_MANAGER', 'MANAGER'].includes(role)) {
    return [
      TOOL_LEAVE_BALANCE,
      TOOL_PAYSLIP,
      TOOL_ATTENDANCE_SUMMARY,
      TOOL_TEAM_LEAVE_STATS,
      TOOL_UNSUPPORTED,
    ];
  }

  return employeeTools;
}
