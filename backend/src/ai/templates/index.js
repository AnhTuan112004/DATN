/**
 * Phương án A (Template Rendering):
 * Backend tự render số liệu thực tế vào template Markdown tĩnh.
 * Tuyệt đối không gửi functionResponse chứa thông tin tài chính/lương ngược lại cho LLM.
 */

export const renderLeaveBalanceTemplate = (data) => {
  return `### 📅 Thông Tin Số Dư Phép Năm

- **Tổng số phép trong năm:** ${data.annualTotal} ngày
- **Số ngày đã sử dụng:** ${data.annualUsed} ngày
- **Phép thâm niên cộng thêm:** ${data.seniorityBonusDays} ngày (Theo Điều 114 BLLĐ)
- **Số ngày phép còn lại:** **${data.annualTotal + data.seniorityBonusDays - data.annualUsed} ngày**
- **Nghỉ ốm đã hưởng:** ${data.sickUsed} ngày`;
};

export const renderPayslipTemplate = (data) => {
  if (!data) {
    return `⚠️ Không tìm thấy bảng lương cho kỳ yêu cầu. Vui lòng kiểm tra lại kỳ lương hoặc liên hệ HR.`;
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return `### 💰 Phiếu Lương Kỳ ${data.period}

| Mục | Số tiền |
| :--- | :--- |
| **Tổng thu nhập (Gross)** | **${formatVND(data.grossIncome)}** |
| - Lương cơ bản theo ngày công | ${formatVND(data.baseSalaryProrated)} |
| - Tiền làm thêm giờ (OT) | ${formatVND(data.otPayTotal)} |
| - Tiền phụ cấp ca đêm | ${formatVND(data.nightPayTotal)} |
| - Phụ cấp ăn trưa / ca | ${formatVND(data.mealAllowanceTotal)} |
| **Các khoản giảm trừ** | |
| - Bảo hiểm NLĐ (BHXH, BHYT, BHTN) | -${formatVND(data.totalInsuranceEmployee)} |
| - Thuế thu nhập cá nhân (TNCN) | -${formatVND(data.personalIncomeTax)} |
| **Lương thực nhận (Net)** | **${formatVND(data.netSalary)}** |

> *Trạng thái:* ${data.periodLockedAt ? '🔒 Đã chốt kỳ lương chính thức' : '⏳ Tạm tính'}`;
};

export const renderAttendanceTemplate = (data) => {
  return `### ⏱️ Tổng Hợp Chấm Công Kỳ ${data.period}

- **Số ngày công chuẩn:** ${data.standardDays} ngày
- **Số ngày công thực tế:** **${data.actualDays} ngày**
- **Số lần đi muộn / về sớm:** ${data.lateCount} lần
- **Tổng số giờ làm thêm (OT):** ${data.totalOtHours} giờ
- **Số ngày nghỉ có phép:** ${data.paidLeaveDays} ngày`;
};

export const renderTeamLeaveTemplate = (data) => {
  return `### 👥 Thống Kê Nghỉ Phép Phòng Ban (${data.period})

- **Tổng số nhân sự:** ${data.totalEmployees} người
- **Tổng số đơn nghỉ phép trong tháng:** ${data.totalRequests} đơn
- **Số nhân sự vắng mặt hôm nay:** ${data.absentToday} người
- **Tỷ lệ chuyên cần phòng ban:** **${data.attendanceRate}%**`;
};
