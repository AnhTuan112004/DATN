/**
 * Phương án A (Template Rendering):
 * Backend tự render số liệu thực tế vào template Markdown tĩnh.
 * Tuyệt đối không gửi functionResponse chứa thông tin tài chính/lương/cá nhân ngược lại cho LLM.
 */

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

const getGreetingName = (user) => {
  if (!user) return 'bạn';
  if (user.role === 'CEO') return `anh ${user.fullName || 'Sếp'}`;
  if (user.role === 'HR_MANAGER') return `chị ${user.fullName || 'HR'}`;
  return user.fullName || 'bạn';
};

/**
 * 1. Template Số Dư Phép Năm & Phép Ốm
 */
export const renderLeaveBalanceTemplate = (data, user) => {
  const name = getGreetingName(user);
  const annualTotal = data.annualTotal || 12;
  const annualUsed = data.annualUsed || 0;
  const seniorityBonusDays = data.seniorityBonusDays || 0;
  const annualRemaining = Math.max(0, annualTotal + seniorityBonusDays - annualUsed);
  const sickUsed = data.sickUsed || 0;
  const sickRemaining = Math.max(0, 30 - sickUsed);

  return `Dạ em gửi **${name}** thông tin số dư phép năm và nghỉ ốm tính đến thời điểm hiện tại nhé:

### 📅 Thông Tin Số Dư Phép Năm & Nghỉ Ốm

| Chỉ tiêu nghỉ phép | Số ngày | Căn cứ / Ghi chú |
| :--- | :---: | :--- |
| **Hạn mức phép năm tiêu chuẩn** | **${annualTotal} ngày** | Điều 113 Bộ luật Lao động |
| - Thâm niên công tác cộng thêm | +${seniorityBonusDays} ngày | +1 ngày mỗi 5 năm (Điều 114 BLLĐ) |
| - Số ngày phép năm đã sử dụng | -${annualUsed} ngày | Đã duyệt chính thức |
| **Số ngày phép năm còn lại khả dụng** | **${annualRemaining} ngày** | Khả dụng để xin nghỉ |
| **Nghỉ ốm hưởng chế độ BHXH đã dùng** | **${sickUsed} ngày** | Tối đa 30 ngày/năm (Còn lại: ${sickRemaining} ngày) |

💡 *Bật mí nhỏ:* Bạn hiện còn **${annualRemaining} ngày phép** khả dụng. Nếu có kế hoạch nghỉ ngơi, bạn nhớ làm đơn xin phép trước trên hệ thống để cấp trên duyệt nhé! Cần em hỗ trợ gì thêm cứ nhắn em nha 😊`;
};

/**
 * 2. Template Phiếu Lương Chuẩn Phương Án A (2 Khối Riêng Biệt)
 */
export const renderPayslipTemplate = (data, user) => {
  const name = getGreetingName(user);
  if (!data) {
    return `Dạ **${name}** ơi, em đã tra cứu trên hệ thống nhưng chưa tìm thấy bảng lương cho kỳ này. 

Có thể kỳ lương đang trong quá trình tổng hợp hoặc chưa được phòng C&B chốt. Bạn vui lòng kiểm tra lại kỳ cần xem (ví dụ: *tháng 10 năm 2026*) hoặc liên hệ Phòng Nhân sự để được hỗ trợ nhé!`;
  }

  const isLocked = Boolean(data.periodLockedAt);
  const lockStatusBadge = isLocked 
    ? `🔒 **ĐÃ CHỐT KỲ LƯƠNG CHÍNH THỨC** (Khóa ngày: ${new Date(data.periodLockedAt).toLocaleDateString('vi-VN')})` 
    : `⏳ **BẢNG LƯƠNG TẠM TÍNH** (Chưa khóa kỳ chính thức)`;

  return `Dạ em gửi **${name}** chi tiết phiếu lương **Kỳ ${data.period}** của mình đây ạ:

### 💰 Phiếu Lương Chi Tiết Kỳ ${data.period}
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

✨ *Lưu ý:* Bảng tính trên áp dụng chuẩn Luật Thuế TNCN mới 2026 và mức giảm trừ gia cảnh 15.5M/6.2M. Nếu bạn có bất kỳ câu hỏi nào về các khoản giảm trừ, cứ nhắn cho em nhé!`;
};

/**
 * 3. Template Tổng Hợp Chấm Công
 */
export const renderAttendanceTemplate = (data, user) => {
  const name = getGreetingName(user);
  return `Dạ em đã tổng hợp tình hình chấm công của **${name}** từ ngày **${data.from}** đến **${data.to}** như sau ạ:

### ⏱️ Báo Cáo Tổng Hợp Chấm Công (${data.from} đến ${data.to})

- **Số ngày công thực tế:** **${data.actualDays} ngày** (trên ${data.standardDays} ngày công chuẩn)
- **Số lần đi muộn / về sớm:** **${data.lateCount} lần** ${data.lateCount > 2 ? '⚠️ *(Bạn nhớ chú ý giờ giấc để đảm bảo nội quy chuyên cần nhé!)*' : '✅ *(Rất tốt, phong độ làm việc rất chuẩn chỉnh!)*'}
- **Tổng số giờ làm thêm (OT):** **${data.totalOtHours.toFixed(1)} giờ** (OT ngày: ${data.otWeekdayHours.toFixed(1)}h, Cuối tuần: ${data.otWeekendHours.toFixed(1)}h, Ca đêm: ${data.nightHours.toFixed(1)}h)
- **Số ngày nghỉ phép có lương:** **${data.paidLeaveDays} ngày**
- **Trạng thái chuyên cần:** **${data.attendanceRate}%**

✨ Chúc bạn có những ngày làm việc thật nhiều năng lượng và hiệu quả nhé!`;
};

/**
 * 4. Template Thống Kê Phòng Ban Dành Cho Quản Lý
 */
export const renderTeamLeaveTemplate = (data, user) => {
  const name = getGreetingName(user);
  return `Dạ kính gửi Quản lý **${name}**, dưới đây là báo cáo thống kê tình hình đội ngũ phòng ban trong kỳ **${data.period}**:

### 👥 Báo Cáo Thống Kê Nghỉ Phép Phòng Ban (${data.period})
*Phòng ban: ${data.departmentName || 'Bộ phận trực thuộc'}*

| Chỉ tiêu quản lý đội ngũ | Số liệu thực tế | Đánh giá |
| :--- | :---: | :--- |
| **Tổng số nhân sự trực thuộc** | **${data.totalEmployees} người** | Quy mô bộ phận |
| **Tổng số đơn xin nghỉ phép trong kỳ** | **${data.totalRequests} đơn** | Đã duyệt: ${data.approvedRequests} \| Chờ duyệt: ${data.pendingRequests} |
| **Số lượt làm thêm giờ (OT) toàn đội** | **${data.totalOtHours || 0} giờ** | |
| **Nhân sự vắng mặt hôm nay** | **${data.absentToday} người** | Điểm danh thời gian thực |
| **Tỷ lệ chuyên cần bình quân** | **${data.attendanceRate}%** | ${data.attendanceRate >= 95 ? '🟢 Xuất sắc' : '🟡 Cần cải thiện'} |

> 🔒 *Lưu ý bảo mật: Theo phân quyền hệ thống, Quản lý bộ phận chỉ được xem dữ liệu chuyên cần, tuyệt đối không được xem dữ liệu lương của nhân viên.*`;
};

/**
 * 5. Template Từ Chối Lịch Sự Khi Yêu Cầu Ngoài Phạm Vi / Vượt Quyền
 */
export const renderUnsupportedTemplate = (user) => {
  const name = getGreetingName(user);
  return `Dạ chào **${name}**! 

Yêu cầu này hiện nằm ngoài phạm vi hỗ trợ hoặc bạn đang truy vấn thông tin nhạy cảm của nhân sự khác.

Theo **Luật Bảo Vệ Dữ Liệu Cá Nhân** (Nghị định 13/2023/NĐ-CP) và Quy chế Bảo mật Doanh nghiệp:
🔒 **Dữ liệu nhân sự là tuyệt mật nội bộ**: Chỉ có Ban Giám Đốc (CEO) và Trưởng phòng Nhân sự (HR) mới có thẩm quyền xem báo cáo tổng thể hoặc tra cứu dữ liệu của người khác.
🔒 **Tuyệt đối không phát tán ra ngoài**: Hệ thống AI của PeopleInsight được vận hành cục bộ bên trong công ty, cam kết không bao giờ rò rỉ bất kỳ thông tin nào ra bên ngoài.

Em luôn sẵn sàng hỗ trợ bạn tra cứu các thông tin cá nhân của chính mình:
- 📅 **Số dư ngày phép:** *"Tôi còn bao nhiêu ngày phép năm?"*
- 💰 **Phiếu lương cá nhân:** *"Xem phiếu lương tháng này của tôi."*
- ⏱️ **Tổng hợp chấm công:** *"Xem chấm công từ đầu tháng đến nay."*
- 📄 **Hợp đồng lao động:** *"Xem hợp đồng lao động của tôi."*
- 👤 **Hồ sơ nhân sự:** *"Xem hồ sơ cá nhân của tôi."*
- 📖 **Nội quy công ty:** *"Quy định làm thêm giờ OT như thế nào?"*

Bạn cần em hỗ trợ nội dung nào thì cứ nhắn em nhé! 😊`;
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

/**
 * 10. Template Tra Cứu Nội Quy Lao Động & Quy Chế Công Ty (RAG Policy)
 */
export const renderPolicyTemplate = (policies, query = '', user) => {
  const name = getGreetingName(user);
  if (!policies || policies.length === 0) {
    return `Dạ **${name}** ơi, em đã tìm kiếm trong Quy chế nội bộ nhưng chưa thấy điều khoản nào khớp với từ khóa: **"${query}"**.

💡 **Bạn có thể thử tìm với các chủ đề:**
- *Thời giờ làm việc, giờ làm ca, nghỉ trưa, đi muộn*
- *Chế độ nghỉ phép năm, nghỉ ốm, chế độ thai sản*
- *Quy định làm thêm giờ (OT), hệ số lương OT 2026*
- *Quy định trang phục, tác phong công sở, văn hóa doanh nghiệp*

Nếu bạn có câu hỏi đặc thù nào khác, vui lòng liên hệ trực tiếp **Phòng Nhân sự (HR)** để được hỗ trợ cụ thể nhé!`;
  }

  const items = policies.map((p, idx) => `
#### ${idx + 1}. ${p.title}
- **Danh mục:** \`${p.category || 'NỘI QUY CHUNG'}\`
${p.sourceDocument ? `- **Căn cứ văn bản:** *${p.sourceDocument}*` : ''}
> ${p.content}
`).join('\n---\n');

  return `Dạ theo Nội quy lao động và Quy chế nội bộ của công ty, em xin giải đáp thắc mắc về *"**${query || 'nội quy'}**"* cho **${name}** như sau ạ:

### 📖 Trích Dẫn Nội Quy & Quy Chế Doanh Nghiệp
*Từ khóa tra cứu: **"${query || 'Toàn bộ nội quy'}"***

${items}

---
💡 *Căn cứ: Các quy định trên được ban hành tuân thủ Bộ luật Lao động 2019 và Quy chế nội bộ hiện hành của doanh nghiệp.*`;
};

