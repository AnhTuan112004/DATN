import { Type } from '@google/genai';

/**
 * 1. Tool tra cứu số dư phép cá nhân (Không có tham số để tránh lỗi 400 với properties rỗng)
 */
export const TOOL_LEAVE_BALANCE = {
  name: 'get_leave_balance',
  description: 'Tra cứu số dư ngày phép năm, số ngày phép đã dùng và số ngày phép ốm CÁ NHÂN của chính nhân viên đang đăng nhập (tuyệt đối không dùng cho tra cứu phòng ban, bộ phận, team).',
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
  description: 'Tra cứu báo cáo thống kê tình hình nghỉ phép của một phòng ban, bộ phận hoặc đội ngũ trực thuộc quản lý.',
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
 * 5. Tool tra cứu hợp đồng lao động cá nhân
 */
export const TOOL_MY_CONTRACT = {
  name: 'get_my_contract',
  description: 'Tra cứu thông tin chi tiết hợp đồng lao động CÁ NHÂN của chính người dùng đang đăng nhập (loại hợp đồng thử việc/xác định/không xác định thời hạn, ngày ký, ngày hết hạn, mức đóng bảo hiểm, trạng thái).',
};

/**
 * 6. Tool tra cứu hồ sơ thông tin cá nhân
 */
export const TOOL_MY_PROFILE = {
  name: 'get_my_profile',
  description: 'Tra cứu hồ sơ nhân sự CÁ NHÂN của chính người dùng đang đăng nhập (họ tên, mã nhân viên, chức vụ, phòng ban, email, số điện thoại, ngày vào làm, tổng thâm niên).',
};

/**
 * 7. Tool báo cáo tổng hợp toàn công ty (DÀNH RIÊNG CHO CEO)
 */
export const TOOL_CEO_COMPANY_SUMMARY = {
  name: 'ceo_company_summary',
  description: 'Dành riêng cho Tổng Giám Đốc (CEO): Tra cứu báo cáo tổng hợp toàn công ty bao gồm tổng số lượng nhân sự, phân bổ từng phòng ban, tình hình điểm danh chấm công hôm nay, đơn nghỉ phép trong tháng và tổng quỹ lương kỳ gần nhất.',
};

/**
 * 8. Tool tra cứu thông tin nhân sự bất kỳ trong công ty (DÀNH RIÊNG CHO CEO)
 */
export const TOOL_CEO_EMPLOYEE_LOOKUP = {
  name: 'ceo_employee_lookup',
  description: 'Dành riêng cho Tổng Giám Đốc (CEO): Tra cứu hồ sơ, hợp đồng lao động, chấm công và phép của một nhân viên cụ thể trong công ty theo tên hoặc mã nhân viên để tổng hợp báo cáo cho CEO.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      keyword: {
        type: Type.STRING,
        description: 'Tên hoặc mã nhân viên cần tra cứu (ví dụ: EMP002, Nguyễn Văn B)',
      },
    },
    required: ['keyword'],
  },
};

/**
 * 9. Tool hỗ trợ ép Mode ANY khi yêu cầu ngoài phạm vi hoặc cố tình tra cứu trái phép
 */
export const TOOL_UNSUPPORTED = {
  name: 'unsupported_request',
  description: 'Bắt buộc gọi tool này khi câu hỏi ngoài phạm vi nghiệp vụ (thời tiết, giải trí...) hoặc khi nhân viên thông thường cố tình tra cứu lương, hợp đồng, chấm công của người khác.',
};

export const P0_TOOLS_DECLARATIONS = [
  TOOL_LEAVE_BALANCE,
  TOOL_PAYSLIP,
  TOOL_ATTENDANCE_SUMMARY,
  TOOL_MY_CONTRACT,
  TOOL_MY_PROFILE,
  TOOL_TEAM_LEAVE_STATS,
  TOOL_CEO_COMPANY_SUMMARY,
  TOOL_CEO_EMPLOYEE_LOOKUP,
  TOOL_UNSUPPORTED,
];

/**
 * Lọc danh sách công cụ gửi cho AI dựa trên Role của người dùng:
 * - EMPLOYEE: Chỉ có công cụ tra cứu dữ liệu của CHÍNH MÌNH (phép, lương, công, hợp đồng, hồ sơ).
 * - MANAGER: Thêm công cụ xem thống kê phòng ban mình quản lý.
 * - CEO: Có toàn quyền xem dữ liệu cá nhân + Báo cáo tổng hợp toàn công ty + Tra cứu nhân viên bất kỳ.
 */
export function getToolsForRole(role) {
  const personalTools = [
    TOOL_LEAVE_BALANCE,
    TOOL_PAYSLIP,
    TOOL_ATTENDANCE_SUMMARY,
    TOOL_MY_CONTRACT,
    TOOL_MY_PROFILE,
    TOOL_UNSUPPORTED,
  ];

  if (role === 'CEO') {
    return [
      ...personalTools,
      TOOL_TEAM_LEAVE_STATS,
      TOOL_CEO_COMPANY_SUMMARY,
      TOOL_CEO_EMPLOYEE_LOOKUP,
    ];
  }

  if (['HR_MANAGER', 'MANAGER'].includes(role)) {
    return [
      ...personalTools,
      TOOL_TEAM_LEAVE_STATS,
    ];
  }

  return personalTools;
}
