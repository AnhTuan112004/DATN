/**
 * Phương án A (Template Rendering):
 * Backend tự render số liệu thực tế vào template Markdown tĩnh.
 * Tuyệt đối không gửi functionResponse chứa thông tin tài chính/lương/cá nhân ngược lại cho LLM.
 */

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

/**
 * 1. Template Số Dư Phép Năm & Phép Ốm
 */
export const renderLeaveBalanceTemplate = (data) => {
  const annualTotal = data.annualTotal || 12;
  const annualUsed = data.annualUsed || 0;
  const seniorityBonusDays = data.seniorityBonusDays || 0;
  const annualRemaining = Math.max(0, annualTotal + seniorityBonusDays - annualUsed);
  const sickUsed = data.sickUsed || 0;
  const sickRemaining = Math.max(0, 30 - sickUsed);

  return `### 📅 Thông Tin Số Dư Phép Năm & Nghỉ Ốm

| Chỉ tiêu nghỉ phép | Số ngày | Căn cứ / Ghi chú |
| :--- | :---: | :--- |
| **Hạn mức phép năm tiêu chuẩn** | **${annualTotal} ngày** | Điều 113 Bộ luật Lao động |
| - Thâm niên công tác cộng thêm | +${seniorityBonusDays} ngày | +1 ngày mỗi 5 năm (Điều 114 BLLĐ) |
| - Số ngày phép năm đã sử dụng | -${annualUsed} ngày | Đã duyệt chính thức |
| **Số ngày phép năm còn lại khả dụng** | **${annualRemaining} ngày** | Khả dụng để xin nghỉ |
| **Nghỉ ốm hưởng chế độ BHXH đã dùng** | **${sickUsed} ngày** | Tối đa 30 ngày/năm (Còn lại: ${sickRemaining} ngày) |`;
};

/**
 * 2. Template Phiếu Lương Chuẩn Phương Án A (2 Khối Riêng Biệt)
 */
export const renderPayslipTemplate = (data) => {
  if (!data) {
    return `⚠️ Không tìm thấy bảng lương cho kỳ yêu cầu. Vui lòng kiểm tra lại kỳ lương hoặc liên hệ Phòng Nhân sự (C&B).`;
  }

  const isLocked = Boolean(data.periodLockedAt);
  const lockStatusBadge = isLocked 
    ? `🔒 **ĐÃ CHỐT KỲ LƯƠNG CHÍNH THỨC** (Khóa ngày: ${new Date(data.periodLockedAt).toLocaleDateString('vi-VN')})` 
    : `⏳ **BẢNG LƯƠNG TẠM TÍNH** (Chưa khóa kỳ chính thức)`;

  return `### 💰 Phiếu Lương Chi Tiết Kỳ ${data.period}
${lockStatusBadge}

#### 1. Khối Thu Nhập & Thực Nhận (Net Salary)
| Khoản mục | Số tiền | Ghi chú pháp lý 2026 |
| :--- | :---: | :--- |
| **Tổng thu nhập (Gross Income)** | **${formatVND(data.grossIncome)}** | Thu nhập trước thuế & bảo hiểm |
| - Lương cơ bản theo ngày công | ${formatVND(data.baseSalaryProrated)} | ${data.actualWorkingDays || 22}/${data.standardWorkingDays || 22} ngày công |
| - Tiền làm thêm giờ (OT) | ${formatVND(data.otPayTotal)} | Miễn thuế: ${formatVND(data.taxExemptOt)} \| Chịu thuế: ${formatVND(data.taxableOt)} |
| - Phụ cấp làm việc ban đêm (22h-06h) | ${formatVND(data.nightPayTotal)} | Phụ cấp đêm 30% |
| - Phụ cấp ăn ca / ăn trưa | ${formatVND(data.mealAllowanceTotal)} | Miễn thuế: ${formatVND(data.taxExemptMeal)} \| Chịu thuế: ${formatVND(data.taxableMeal)} |
| - Tiền thưởng / phụ cấp khác | ${formatVND((data.bonusTotal || 0) + (data.allowanceTotal || 0))} | |
| **Các khoản giảm trừ bắt buộc** | | |
| - Trích đóng Bảo hiểm NLĐ (10.5%) | -${formatVND(data.totalInsuranceEmployee)} | BHXH 8%, BHYT 1.5%, BHTN 1% |
| - Thuế thu nhập cá nhân (TNCN) | -${formatVND(data.personalIncomeTax)} | Biểu thuế lũy tiến 5 bậc mới 2026 |
| **👉 LƯƠNG THỰC NHẬN (NET)** | **${formatVND(data.netSalary)}** | **Số tiền thực chuyển về tài khoản** |

---

#### 2. Khối Tham Chiếu Tính Thuế TNCN (Chỉ mang tính chất giải trình/tham chiếu, KHÔNG TRỪ VÀO LƯƠNG)
| Tham số tính thuế (Luật 109/2025/QH15) | Giá trị tham chiếu | Ý nghĩa pháp lý |
| :--- | :---: | :--- |
| **Tổng thu nhập chịu thuế** | ${formatVND(data.taxableIncome)} | Gross - Các khoản miễn thuế hợp lệ |
| - Giảm trừ gia cảnh bản thân | 15.500.000 ₫ | Theo Nghị quyết 110/2025/UBTVQH15 |
| - Giảm trừ người phụ thuộc | ${formatVND((data.policySnapshot?.dependentDeduction || 6200000) * (data.dependentsCount || 0))} | 6.200.000 ₫ / người phụ thuộc |
| - Giảm trừ đóng bảo hiểm bắt buộc | ${formatVND(data.totalInsuranceEmployee)} | BHXH, BHYT, BHTN trích từ lương |
| **Thu nhập tính thuế (TNTT)** | **${formatVND(data.assessableIncome)}** | Căn cứ áp biểu thuế lũy tiến 5 bậc |
| **Thuế TNCN phát sinh** | **${formatVND(data.personalIncomeTax)}** | 5 bậc: 5%, 10%, 20%, 30%, 35% |

> 📌 *Lưu ý: Các khoản giảm trừ gia cảnh chỉ có giá trị làm giảm thu nhập tính thuế, tuyệt đối không bị trừ vào tiền lương thực nhận của người lao động.*`;
};

/**
 * 3. Template Tổng Hợp Chấm Công
 */
export const renderAttendanceTemplate = (data) => {
  return `### ⏱️ Báo Cáo Tổng Hợp Chấm Công (${data.from} đến ${data.to})

- **Số ngày công thực tế:** **${data.actualDays} ngày** (trên ${data.standardDays} ngày công chuẩn)
- **Số lần đi muộn / về sớm:** **${data.lateCount} lần** ${data.lateCount > 2 ? '⚠️ *(Cần lưu ý nội quy lao động)*' : '✅ *(Tốt)*'}
- **Tổng số giờ làm thêm (OT):** **${data.totalOtHours.toFixed(1)} giờ** (OT ngày: ${data.otWeekdayHours}h, Cuối tuần: ${data.otWeekendHours}h, Ca đêm: ${data.nightHours}h)
- **Số ngày nghỉ phép có lương:** **${data.paidLeaveDays} ngày**
- **Trạng thái chuyên cần:** **${data.attendanceRate}%**`;
};

/**
 * 4. Template Thống Kê Phòng Ban Dành Cho Quản Lý
 */
export const renderTeamLeaveTemplate = (data) => {
  return `### 👥 Báo Cáo Thống Kê Nghỉ Phép Phòng Ban (${data.period})
*Phòng ban: ${data.departmentName || 'Bộ phận trực thuộc'}*

| Chỉ tiêu quản lý đội ngũ | Số liệu thực tế | Đánh giá |
| :--- | :---: | :--- |
| **Tổng số nhân sự trực thuộc** | **${data.totalEmployees} người** | Quy mô bộ phận |
| **Tổng số đơn xin nghỉ phép trong kỳ** | **${data.totalRequests} đơn** | Đã duyệt: ${data.approvedRequests} \| Chờ duyệt: ${data.pendingRequests} |
| **Số lượt làm thêm giờ (OT) toàn đội** | **${data.totalOtHours || 0} giờ** | |
| **Nhân sự vắng mặt hôm nay** | **${data.absentToday} người** | Điểm danh thời gian thực |
| **Tỷ lệ chuyên cần bình quân** | **${data.attendanceRate}%** | ${data.attendanceRate >= 95 ? '🟢 Xuất sắc' : '🟡 Cần cải thiện'} |`;
};

/**
 * 5. Template Từ Chối Lịch Sự Khi Yêu Cầu Ngoài Phạm Vi / Vượt Quyền
 */
export const renderUnsupportedTemplate = () => {
  return `### 💡 Trợ Lý HR AI — Hướng Dẫn Yêu Cầu Hợp Lệ

Yêu cầu của bạn hiện nằm ngoài phạm vi hỗ trợ tự động hoặc bạn đang truy vấn thông tin nhạy cảm của người khác. 

Theo quy chế bảo vệ dữ liệu và Hiến pháp dự án, Trợ lý HR AI chỉ hỗ trợ tra cứu thông tin cá nhân của chính bạn:
- 📅 **Số dư ngày phép:** *"Tôi còn bao nhiêu ngày phép năm?"*
- 💰 **Phiếu lương cá nhân:** *"Xem phiếu lương tháng này của tôi."*
- ⏱️ **Tổng hợp chấm công:** *"Xem tổng hợp công từ đầu tháng đến nay."*
- 📄 **Hợp đồng lao động:** *"Xem hợp đồng lao động của tôi."*
- 👤 **Hồ sơ nhân sự:** *"Xem hồ sơ cá nhân của tôi."*
- *(Dành cho CEO)* 📊 **Báo cáo toàn công ty:** *"Tổng hợp tình hình toàn công ty cho tôi."*

Nếu cần giải đáp các chính sách đặc biệt, xin vui lòng liên hệ trực tiếp **Phòng Nhân sự (HR Department)**.`;
};

/**
 * 6. Template Hợp Đồng Lao Động Cá Nhân
 */
export const renderContractTemplate = (user) => {
  const contracts = user.contracts || [];
  if (contracts.length === 0) {
    return `### 📄 Thông Tin Hợp Đồng Lao Động
**Nhân sự:** **${user.fullName}** (*Mã NV: ${user.employeeCode}*)
**Bộ phận:** ${user.departmentName || 'Công ty'}

⚠️ Hiện tại trên hệ thống chưa có bản ghi hợp đồng lao động điện tử của bạn. Vui lòng liên hệ Phòng Nhân sự (HR) để cập nhật hồ sơ hợp đồng nhé!`;
  }

  const contractTypeNames = {
    PROBATION: 'Thử việc',
    DEFINITE: 'Xác định thời hạn',
    INDEFINITE: 'Không xác định thời hạn',
  };

  const statusBadges = {
    ACTIVE: '🟢 Đang hiệu lực',
    EXPIRED: '🔴 Đã hết hạn',
    TERMINATED: '⚪ Đã chấm dứt',
  };

  const rows = contracts.map((c, idx) => {
    const fromStr = c.effectiveFrom ? new Date(c.effectiveFrom).toLocaleDateString('vi-VN') : '—';
    const toStr = c.effectiveTo ? new Date(c.effectiveTo).toLocaleDateString('vi-VN') : 'Vô thời hạn';
    return `| **#${idx + 1} - ${c.contractNumber}** | ${contractTypeNames[c.contractType] || c.contractType} | ${fromStr} -> ${toStr} | ${formatVND(c.baseSalary)} | ${statusBadges[c.status] || c.status} |`;
  }).join('\n');

  return `### 📄 Thông Tin Hợp Đồng Lao Động Cá Nhân
**Nhân sự:** **${user.fullName}** (*Mã NV: ${user.employeeCode}*)
**Bộ phận:** ${user.departmentName || 'Công ty'}

| Số HĐ | Loại hợp đồng | Thời hạn hiệu lực | Lương đóng BH | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
${rows}

> 📌 *Dữ liệu hợp đồng được bảo mật theo quy định Điều 20 Bộ Luật Lao Động 2019.*`;
};

/**
 * 7. Template Hồ Sơ Thông Tin Nhân Sự Cá Nhân
 */
export const renderProfileTemplate = (user) => {
  const hireDateStr = user.hireDate ? new Date(user.hireDate).toLocaleDateString('vi-VN') : '—';
  const roleNames = {
    CEO: 'Tổng Giám Đốc (CEO)',
    HR_MANAGER: 'Trưởng Phòng Nhân Sự',
    MANAGER: 'Quản Lý Bộ Phận',
    EMPLOYEE: 'Nhân Viên Chính Thức',
  };

  return `### 👤 Hồ Sơ Nhân Sự Cá Nhân
*Dữ liệu trích xuất từ CSDL Nhân sự nội bộ PeopleInsight*

| Thông tin trường | Chi tiết | Ghi chú |
| :--- | :--- | :--- |
| **Họ và tên** | **${user.fullName}** | Nhân sự chính thức |
| **Mã nhân viên** | \`${user.employeeCode}\` | Mã định danh hệ thống |
| **Email công việc** | ${user.email} | Tài khoản đăng nhập |
| **Số điện thoại** | ${user.phone || 'Chưa cập nhật'} | Liên hệ nội bộ |
| **Chức danh / Vai trò** | **${roleNames[user.role] || user.role}** | Phân quyền hệ thống |
| **Phòng ban / Bộ phận** | **${user.departmentName || 'Chưa phân bổ'}** | Đơn vị trực thuộc |
| **Ngày gia nhập công ty** | ${hireDateStr} | Thâm niên công tác |
| **Tổng thâm niên nghề nghiệp** | ${user.totalWorkingYears || 1} năm | Hồ sơ năng lực |
| **Trạng thái tài khoản** | ${user.isActive ? '🟢 Đang hoạt động' : '🔴 Tạm khóa'} | Trực tuyến |

> 🔒 *Mọi dữ liệu cá nhân của bạn được mã hóa và bảo vệ nghiêm ngặt theo Nghị định 13/2023/NĐ-CP.*`;
};

/**
 * 8. Template Báo Cáo Tổng Hợp Toàn Công Ty Dành Riêng Cho CEO
 */
export const renderCeoCompanySummaryTemplate = (data) => {
  const deptRows = (data.departments || []).map((d) => 
    `| **${d.name}** | \`${d.code}\` | ${d.employeeCount} người | ${d.managerName || 'Chưa bổ nhiệm'} |`
  ).join('\n');

  return `### 📊 Báo Cáo Tổng Hợp Tình Hình Toàn Công Ty (Dành Cho CEO)
*Kính gửi Tổng Giám Đốc: Dưới đây là bức tranh vận hành tổng thể của công ty thời điểm hiện tại.*

#### 1. Tổng Quan Quy Mô & Quân Số
- **Tổng số nhân sự hoạt động:** **${data.totalEmployees} nhân sự**
- **Số lượng phòng ban trực thuộc:** **${data.totalDepartments} phòng ban**

| Phòng ban | Mã PB | Quân số | Quản lý phụ trách |
| :--- | :---: | :---: | :--- |
${deptRows || '| Đang cập nhật... | | | |'}

---

#### 2. Tình Hình Chấm Công Hôm Nay (${data.todayDate})
- **Đã check-in có mặt:** **${data.checkedInToday}/${data.totalEmployees} người** (Tỷ lệ có mặt: **${data.attendanceRate}%**)
- **Đi làm đúng giờ:** **${data.onTimeCount} người** | **Đi muộn:** **${data.lateTodayCount} người**
- **Vắng mặt / Chưa check-in:** **${data.absentTodayCount} người**

---

#### 3. Quản Lý Đơn Nghỉ Phép (${data.currentPeriod})
- **Tổng số đơn phát sinh:** **${data.totalLeavesThisMonth} đơn**
- **Đã duyệt chính thức:** ${data.approvedLeaves} đơn | **Đang chờ duyệt:** ${data.pendingLeaves} đơn

---

#### 4. Tổng Hợp Quỹ Lương Kỳ Gần Nhất (${data.latestPayrollPeriod || 'Kỳ gần nhất'})
- **Tổng chi phí lương (Gross):** **${formatVND(data.totalGrossPayroll)}**
- **Tổng lương thực chuyển (Net):** **${formatVND(data.totalNetPayroll)}**
- **Tổng trích đóng BHXH/BHYT/BHTN:** **${formatVND(data.totalInsurance)}**

> 👑 *Báo cáo tổng hợp độc quyền dành riêng cho CEO. Tuyệt mật nội bộ.*`;
};

/**
 * 9. Template Tra Cứu Nhân Sự Cho CEO
 */
export const renderCeoEmployeeLookupTemplate = (data) => {
  const u = data.employee;
  const c = data.activeContract;
  const att = data.attendanceSummary || { actualDays: 0, standardDays: 22, lateCount: 0, totalOtHours: 0 };

  return `### 🔍 Báo Cáo Chi Tiết Nhân Sự Cho CEO
**Nhân sự tra cứu:** **${u.fullName}** (\`${u.employeeCode}\`)
**Bộ phận:** ${u.departmentName || 'Chưa phân bổ'} | **Chức danh:** ${u.role}

#### 1. Hồ Sơ & Hợp Đồng Lao Động
- **Email:** ${u.email} | **SĐT:** ${u.phone || 'Chưa cập nhật'}
- **Ngày vào làm:** ${u.hireDate ? new Date(u.hireDate).toLocaleDateString('vi-VN') : '—'}
- **Hợp đồng hiện tại:** ${c ? `Số HĐ: \`${c.contractNumber}\` (${c.contractType}) - Hiệu lực: ${new Date(c.effectiveFrom).toLocaleDateString('vi-VN')} -> ${c.effectiveTo ? new Date(c.effectiveTo).toLocaleDateString('vi-VN') : 'Vô thời hạn'} (Trạng thái: ${c.status})` : '⚠️ Chưa cập nhật hợp đồng'}
- **Mức lương đóng BH:** ${c ? formatVND(c.baseSalary) : '—'}

#### 2. Tình Hình Chấm Công & Phép Gần Nhất
- **Số ngày công tháng này:** **${att.actualDays}/${att.standardDays} ngày**
- **Số lần đi muộn:** **${att.lateCount} lần** | **Giờ OT:** **${att.totalOtHours}h**
- **Số dư phép năm:** Còn lại **${data.leaveRemaining || 0} ngày** (Đã nghỉ: ${data.leaveUsed || 0} ngày)
${data.latestNetSalary ? `- **Lương thực nhận kỳ gần nhất:** **${formatVND(data.latestNetSalary)}**` : ''}

> 👑 *Tra cứu theo ủy quyền Lãnh đạo cấp cao (CEO).*`;
};
