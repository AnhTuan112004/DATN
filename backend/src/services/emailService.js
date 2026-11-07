/**
 * Dịch vụ gửi Email thông báo tự động cho hệ thống PeopleInsight AI
 * Tích hợp Nodemailer gửi Email thật qua giao thức SMTP (Gmail App Password / SendGrid / Custom SMTP)
 */
import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log(`[EmailService] Khởi tạo SMTP Transporter thành công cho tài khoản: ${user}`);
  }
  return transporter;
};

const sendMailHelper = async ({ to, subject, text, html, companyName = 'PeopleInsight AI' }) => {
  const client = getTransporter();
  let sentRealEmail = false;
  let messageId = null;

  if (client && process.env.SMTP_USER && to) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"${companyName}" <${process.env.SMTP_USER}>`;
      const info = await client.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });
      sentRealEmail = true;
      messageId = info.messageId;
      console.log(`\x1b[32m[EmailService] Đã gửi EMAIL THẬT qua SMTP tới: ${to} (MessageId: ${messageId})\x1b[0m`);
    } catch (sendError) {
      console.error(`\x1b[31m[EmailService] Lỗi khi gửi SMTP tới ${to}:\x1b[0m`, sendError.message);
    }
  } else {
    console.log('\x1b[33m%s\x1b[0m', `ℹ️ [EmailService] Ghi log thông báo tới ${to} (Chủ đề: ${subject}):`);
    console.log('\x1b[36m%s\x1b[0m', text);
  }

  return { success: true, sentRealEmail, messageId, sentTo: to, subject, sentAt: new Date() };
};

export class EmailService {
  /**
   * 1. Gửi thư mời phỏng vấn đến ứng viên trúng tuyển vòng lọc hồ sơ AI
   */
  static async sendInterviewInvitationEmail({
    candidateEmail,
    candidateName,
    jobTitle,
    interviewDate,
    interviewTime,
    interviewLocation,
    interviewType = 'Trực tiếp tại văn phòng',
    interviewerName = 'Hội đồng Tuyển dụng',
    notes = '',
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const formattedDate = interviewDate || 'Thứ Hai tuần tới';
    const formattedTime = interviewTime || '09:00 AM';
    const formattedLocation = interviewLocation || 'Tầng 5, Tòa nhà Trụ sở Doanh nghiệp PeopleInsight';
    const subject = `[${companyName}] THƯ MỜI PHỎNG VẤN — VỊ TRÍ ${jobTitle.toUpperCase()}`;

    const textContent = `
Kính gửi ${candidateName},

Phòng Nhân sự ${companyName} xin chúc mừng bạn!
Hồ sơ ứng tuyển của bạn cho vị trí "${jobTitle}" đã vượt qua vòng sàng lọc sơ bộ bằng AI với kết quả xuất sắc.

Chúng tôi trân trọng kính mời bạn tham dự buổi phỏng vấn trực tiếp:
- Vị trí: ${jobTitle}
- Thời gian: ${formattedTime} — Ngày ${formattedDate}
- Địa điểm: ${formattedLocation} (${interviewType})
- Người phỏng vấn: ${interviewerName}
${notes ? `- Ghi chú chuẩn bị: ${notes}\n` : ''}

Bạn vui lòng phản hồi email này để xác nhận tham dự.

Trân trọng,
Ban Tuyển dụng ${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #ffffff; padding: 28px 32px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .content { padding: 32px; }
    .highlight-card { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
    .info-label { font-weight: 600; width: 140px; color: #0f766e; flex-shrink: 0; }
    .info-value { color: #1e293b; font-weight: 500; }
    .footer { background: #f1f5f9; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyName}</h1>
      <p>Hệ Thống Quản Trị Nhân Sự & Tuyển Dụng AI</p>
    </div>
    <div class="content">
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Kính gửi ${candidateName},</div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Phòng Nhân sự <strong>${companyName}</strong> xin chúc mừng bạn! Hồ sơ ứng tuyển của bạn cho vị trí 
        <strong style="color: #0f766e;">${jobTitle}</strong> đã hoàn thành xuất sắc vòng sàng lọc sơ bộ.
      </p>
      <div class="highlight-card">
        <div class="info-row"><div class="info-label">📅 Thời gian:</div><div class="info-value"><strong>${formattedTime} — Ngày ${formattedDate}</strong></div></div>
        <div class="info-row"><div class="info-label">📍 Địa điểm:</div><div class="info-value">${formattedLocation} (${interviewType})</div></div>
        <div class="info-row"><div class="info-label">👤 Người phỏng vấn:</div><div class="info-value">${interviewerName}</div></div>
      </div>
      ${notes ? `<p style="font-size: 13px; color: #92400e; background: #fffbeb; padding: 10px 14px; border-radius: 6px;"><strong>📝 Ghi chú:</strong> ${notes}</p>` : ''}
      <p style="font-size: 14px; color: #334155; margin-top: 24px;">Trân trọng,<br><strong>Ban Tuyển Dụng & Nhân Sự ${companyName}</strong></p>
    </div>
    <div class="footer">Email tự động gửi từ hệ thống PeopleInsight AI. Mọi thắc mắc xin phản hồi trực tiếp email này.</div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: candidateEmail, subject, text: textContent, html: htmlContent, companyName });
  }

  /**
   * 2. Gửi thông báo quyết định bổ nhiệm / thăng chức chức vụ mới
   */
  static async sendPromotionEmail({
    employeeEmail,
    employeeName,
    oldRole,
    newRole,
    effectiveDate = 'Hôm nay',
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const roleLabels = {
      CEO: 'Tổng Giám Đốc Điều Hành (CEO)',
      HR_MANAGER: 'Trưởng Phòng Nhân Sự (HR Manager)',
      MANAGER: 'Trưởng Phòng Ban (Manager)',
      EMPLOYEE: 'Chuyên Viên / Nhân Viên (Employee)',
    };

    const newRoleTitle = roleLabels[newRole] || newRole;
    const oldRoleTitle = roleLabels[oldRole] || oldRole;
    const subject = `[${companyName}] QUYẾT ĐỊNH BỔ NHIỆM & THĂNG CHỨC — ${employeeName.toUpperCase()}`;

    const textContent = `
Kính gửi ${employeeName},

Ban Giám Đốc và Phòng Nhân sự ${companyName} trân trọng thông báo quyết định bổ nhiệm nhân sự:
- Nhân viên: ${employeeName}
- Vai trò trước đây: ${oldRoleTitle}
- Chức danh bổ nhiệm mới: ${newRoleTitle}
- Ngày bắt đầu hiệu lực: ${effectiveDate}

Ban Lãnh đạo ghi nhận sự cống hiến, nỗ lực và kết quả làm việc xuất sắc của bạn trong thời gian qua. Chúc bạn gặt hái nhiều thành công rực rỡ ở vị trí mới!

Trân trọng,
Ban Giám Đốc ${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; padding: 28px 32px; }
    .content { padding: 32px; }
    .highlight { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">${companyName}</h1>
      <p style="margin:4px 0 0 0; opacity: 0.9; font-size: 13px;">Quyết Định Bổ Nhiệm & Điều Chỉnh Vai Trò Nhân Sự</p>
    </div>
    <div class="content">
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Kính gửi ${employeeName},</div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Ban Giám Đốc xin chúc mừng bạn! Căn cứ vào năng lực chuyên môn và đóng góp vượt trội, bạn đã chính thức được bổ nhiệm vào vị trí mới:
      </p>
      <div class="highlight">
        <p style="margin: 6px 0;">🎯 <strong>Chức danh mới:</strong> <span style="color: #6d28d9; font-weight: bold;">${newRoleTitle}</span></p>
        <p style="margin: 6px 0;">💼 <strong>Vị trí trước đây:</strong> ${oldRoleTitle}</p>
        <p style="margin: 6px 0;">📅 <strong>Ngày hiệu lực:</strong> ${effectiveDate}</p>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Chúc bạn tiếp tục phát huy tinh thần tiên phong và đạt được nhiều thành tựu lớn cùng tập thể công ty!
      </p>
      <p style="font-size: 14px; margin-top: 24px;">Trân trọng,<br><strong>Ban Giám Đốc & Khối Nhân Sự ${companyName}</strong></p>
    </div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: employeeEmail, subject, text: textContent, html: htmlContent, companyName });
  }

  /**
   * 3. Gửi thông báo điều chuyển phòng ban công tác
   */
  static async sendDepartmentTransferEmail({
    employeeEmail,
    employeeName,
    oldDepartmentName,
    newDepartmentName,
    roleTitle = 'Nhân viên',
    effectiveDate = 'Hôm nay',
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const subject = `[${companyName}] QUYẾT ĐỊNH ĐIỀU CHUYỂN PHÒNG BAN — ${employeeName.toUpperCase()}`;

    const textContent = `
Kính gửi ${employeeName},

Phòng Nhân sự ${companyName} xin thông báo quyết định điều chuyển đơn vị công tác của bạn:
- Nhân sự: ${employeeName}
- Đơn vị trước đây: ${oldDepartmentName || 'Chưa phân bổ'}
- Đơn vị chuyển đến: ${newDepartmentName}
- Vai trò: ${roleTitle}
- Ngày áp dụng: ${effectiveDate}

Bạn vui lòng liên hệ với Trưởng phòng ban mới để nhận bàn giao công việc và sắp xếp vị trí ngồi.

Trân trọng,
Phòng Nhân Sự ${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 24px 32px;">
      <h2 style="margin:0;">${companyName}</h2>
      <p style="margin:4px 0 0; font-size: 13px;">Quyết Định Điều Chuyển Công Tác</p>
    </div>
    <div style="padding: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      <p>Kính gửi <strong>${employeeName}</strong>,</p>
      <p>Theo kế hoạch phân bổ nguồn lực doanh nghiệp, Ban Lãnh đạo xin thông báo điều chuyển công tác của bạn:</p>
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0;">🏢 <strong>Phòng ban chuyển tới:</strong> <span style="color: #0369a1; font-weight: bold;">${newDepartmentName}</span></p>
        <p style="margin: 4px 0;">📁 <strong>Phòng ban trước:</strong> ${oldDepartmentName || 'Chưa phân bổ'}</p>
        <p style="margin: 4px 0;">📅 <strong>Thời gian áp dụng:</strong> ${effectiveDate}</p>
      </div>
      <p>Chúc bạn hòa nhập nhanh chóng và hoàn thành xuất sắc các mục tiêu tại đơn vị mới.</p>
      <p style="margin-top: 24px;">Trân trọng,<br><strong>Phòng Nhân Sự ${companyName}</strong></p>
    </div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: employeeEmail, subject, text: textContent, html: htmlContent, companyName });
  }

  /**
   * 4. Gửi thông báo quyết định chấm dứt hợp đồng lao động / thôi việc
   */
  static async sendTerminationEmail({
    employeeEmail,
    employeeName,
    reason = 'Theo nguyện vọng cá nhân / Hết hạn hợp đồng',
    effectiveDate = 'Hôm nay',
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const subject = `[${companyName}] THÔNG BÁO VỀ VIỆC CHẤM DỨT HỢP ĐỒNG LAO ĐỘNG — ${employeeName.toUpperCase()}`;

    const textContent = `
Kính gửi ${employeeName},

Phòng Nhân sự ${companyName} xin thông báo về việc kết thúc thời gian công tác của bạn tại công ty kể từ ngày ${effectiveDate}.
- Lý do: ${reason}

Bạn vui lòng hoàn tất các thủ tục bàn giao tài sản, tài liệu công việc và liên hệ bộ phận C&B để làm thủ tục chốt sổ BHXH và thanh toán các chế độ theo quy định.

Cảm ơn bạn vì những đóng góp trong suốt thời gian đồng hành cùng ${companyName}. Chúc bạn nhiều sức khỏe và may mắn trên chặng đường sự nghiệp tiếp theo!

Trân trọng,
Ban Giám Đốc & Phòng Nhân Sự ${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff; padding: 24px 32px;">
      <h2 style="margin:0;">${companyName}</h2>
      <p style="margin:4px 0 0; font-size: 13px;">Thông Báo Quyết Định Nhân Sự</p>
    </div>
    <div style="padding: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      <p>Kính gửi <strong>${employeeName}</strong>,</p>
      <p>Công ty xin thông báo về việc chấm dứt hợp đồng lao động và bàn giao công việc của bạn:</p>
      <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 16px 0; color: #9f1239;">
        <p style="margin: 4px 0;">📅 <strong>Ngày có hiệu lực:</strong> ${effectiveDate}</p>
        <p style="margin: 4px 0;">📝 <strong>Lý do:</strong> ${reason}</p>
      </div>
      <p>Bạn vui lòng phối hợp cùng Trưởng bộ phận để hoàn tất biên bản bàn giao và nhận quyết toán quyền lợi từ phòng C&B.</p>
      <p style="margin-top: 24px;">Trân trọng,<br><strong>Phòng Nhân Sự ${companyName}</strong></p>
    </div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: employeeEmail, subject, text: textContent, html: htmlContent, companyName });
  }

  /**
   * 5. Gửi thông báo báo cáo chấm công hàng ngày / Cảnh báo đi muộn
   */
  static async sendAttendanceNotificationEmail({
    employeeEmail,
    employeeName,
    date,
    checkInTime,
    status = 'PRESENT',
    method = 'FACE',
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const isLate = status === 'LATE';
    const subject = `[${companyName}] ${isLate ? '⚠️ CẢNH BÁO ĐI MUỘN' : '✅ XÁC NHẬN CHẤM CÔNG'} NGÀY ${date}`;

    const textContent = `
Xin chào ${employeeName},

Hệ thống chấm công AI ghi nhận lượt điểm danh của bạn:
- Ngày: ${date}
- Giờ vào: ${checkInTime}
- Trạng thái: ${isLate ? 'ĐI MUỘN' : 'ĐÚNG GIỜ'}
- Phương thức: ${method === 'FACE' ? 'Nhận diện khuôn mặt FaceID' : 'Định vị GPS Geofencing'}

Trân trọng,
Bộ phận Chấm công & Tiền lương ${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: ${isLate ? '#ea580c' : '#0f766e'}; color: #ffffff; padding: 20px 24px;">
      <h3 style="margin:0;">${companyName} — Nhật Ký Chấm Công</h3>
    </div>
    <div style="padding: 24px; font-size: 14px; color: #334155; line-height: 1.6;">
      <p>Xin chào <strong>${employeeName}</strong>,</p>
      <div style="background: ${isLate ? '#fff7ed' : '#f0fdf4'}; border: 1px solid ${isLate ? '#ffedd5' : '#dcfce7'}; border-radius: 8px; padding: 14px; margin: 12px 0;">
        <p style="margin: 4px 0;">📅 <strong>Ngày:</strong> ${date}</p>
        <p style="margin: 4px 0;">⏰ <strong>Giờ ghi nhận:</strong> <strong>${checkInTime}</strong></p>
        <p style="margin: 4px 0;">📌 <strong>Trạng thái:</strong> <span style="font-weight: bold; color: ${isLate ? '#c2410c' : '#15803d'};">${isLate ? 'ĐI MUỘN' : 'ĐÚNG GIỜ (HỢP LỆ)'}</span></p>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 16px;">Email tự động gửi từ hệ thống PeopleInsight AI.</p>
    </div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: employeeEmail, subject, text: textContent, html: htmlContent, companyName });
  }

  /**
   * 6. Gửi email thông báo kết quả phê duyệt đơn từ (Cấp 2 - HR Manager / CEO)
   */
  static async sendLeaveApprovalEmail({
    employeeEmail,
    employeeName,
    type,
    durationDays,
    startDate,
    endDate,
    decision,
    approverName = 'Phòng Nhân sự & Ban Giám Đốc',
    comment = '',
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const isApproved = decision === 'APPROVE' || decision === 'HR_APPROVED';
    const typeMap = {
      ANNUAL: 'Nghỉ phép năm',
      SICK: 'Nghỉ ốm hưởng BHXH',
      OT: 'Đăng ký làm thêm giờ (OT)',
      WFH: 'Làm việc từ xa (WFH)',
      FORGOT_CHECKIN: 'Giải trình quên chấm công',
    };
    const typeLabel = typeMap[type] || type || 'Đơn từ nhân sự';

    const formatDateStr = (d) => {
      if (!d) return '';
      const dateObj = new Date(d);
      return isNaN(dateObj.getTime()) ? String(d) : dateObj.toLocaleDateString('vi-VN');
    };

    const startStr = formatDateStr(startDate);
    const endStr = formatDateStr(endDate);
    const dateRangeStr = startStr === endStr ? startStr : `${startStr} — ${endStr}`;

    const subject = `[${companyName}] ${isApproved ? '✅ ĐƠN ĐÃ ĐƯỢC DUYỆT CHÍNH THỨC' : '❌ ĐƠN TỪ ĐÃ BỊ TỪ CHỐI'} — ${typeLabel.toUpperCase()}`;

    const textContent = `
Kính gửi ${employeeName},

Hệ thống PeopleInsight AI xin thông báo:
Đơn của bạn (${typeLabel}) đã được ${approverName} xử lý phê duyệt cấp cuối:
- Trạng thái: ${isApproved ? 'ĐÃ ĐƯỢC PHÊ DUYỆT CHÍNH THỨC' : 'BỊ TỪ CHỐI'}
- Thời gian: ${dateRangeStr} (${durationDays} ngày)
- Ý kiến / Lý do: ${comment || (isApproved ? 'Đã chấp thuận theo đúng quy chế' : 'Không có')}

Trân trọng,
${approverName}
${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: ${isApproved ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'}; color: #ffffff; padding: 24px 28px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${companyName}</h2>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Thông Báo Kết Quả Phê Duyệt Đơn Từ</p>
    </div>
    <div style="padding: 28px; font-size: 14px; color: #334155; line-height: 1.6;">
      <p style="margin-top: 0;">Kính gửi <strong>${employeeName}</strong>,</p>
      <p>Yêu cầu đơn từ của bạn đã được Phòng Nhân sự / Ban Giám Đốc xử lý phê duyệt với kết quả như sau:</p>

      <div style="background: ${isApproved ? '#ecfdf5' : '#fff1f2'}; border: 1px solid ${isApproved ? '#a7f3d0' : '#fecdd3'}; border-radius: 10px; padding: 18px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 140px;">Loại đơn:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Thời gian:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${dateRangeStr} (${durationDays} ngày)</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Trạng thái:</td>
            <td style="padding: 4px 0;">
              <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-weight: 700; font-size: 12px; background: ${isApproved ? '#059669' : '#e11d48'}; color: #ffffff;">
                ${isApproved ? 'ĐÃ PHÊ DUYỆT CHÍNH THỨC' : 'TỪ CHỐI'}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Người duyệt:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${approverName}</td>
          </tr>
          ${comment ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Ghi chú / Lý do:</td>
            <td style="padding: 4px 0; color: #0f172a;">${comment}</td>
          </tr>` : ''}
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        ${isApproved ? 'Số dư phép và dữ liệu công của bạn đã được cập nhật nguyên tử trên hệ thống.' : 'Nếu có thắc mắc, vui lòng liên hệ trực tiếp Quản lý hoặc phòng Nhân sự.'}
      </p>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
        Email thông báo tự động từ phân hệ Quản lý Đơn từ — PeopleInsight AI.
      </div>
    </div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: employeeEmail, subject, text: textContent, html: htmlContent, companyName });
  }

  /**
   * 7. Gửi email thông báo phiếu lương khi kỳ lương được chốt / khóa
   */
  static async sendPayslipEmail({
    employeeEmail,
    employeeName,
    period,
    grossSalary = 0,
    netSalary = 0,
    totalInsurance = 0,
    pitTax = 0,
    actualWorkingDays = 0,
    companyName = 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  }) {
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const subject = `[${companyName}] 💰 THÔNG BÁO PHIẾU LƯƠNG KỲ THÁNG ${period}`;

    const textContent = `
Kính gửi ${employeeName},

Phòng Kế toán & Quản trị Nhân sự ${companyName} xin gửi thông báo phiếu lương kỳ tháng ${period}:
- Số ngày công thực tế: ${actualWorkingDays} ngày
- Tổng thu nhập (Gross): ${formatCurrency(grossSalary)}
- Trừ Bảo hiểm (BHXH, BHYT, BHTN - 10.5%): ${formatCurrency(totalInsurance)}
- Thuế TNCN tạm nộp: ${formatCurrency(pitTax)}
- THỰC NHẬN VỀ TÀI KHOẢN (NET): ${formatCurrency(netSalary)}

Bạn vui lòng đăng nhập vào cổng PeopleInsight AI để tra cứu chi tiết các khoản phụ cấp, giải trình thuế và lưu phiếu lương.

Trân trọng,
Phòng Kế toán & Quản trị Nhân sự
${companyName}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #047857 0%, #059669 100%); color: #ffffff; padding: 24px 30px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${companyName}</h2>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Thông Báo Phiếu Lương Kỳ Tháng ${period}</p>
    </div>
    <div style="padding: 28px; font-size: 14px; color: #334155; line-height: 1.6;">
      <p style="margin-top: 0;">Kính gửi <strong>${employeeName}</strong>,</p>
      <p>Bảng lương kỳ tháng <strong>${period}</strong> của bạn đã được chốt và hoàn tất phê duyệt chi trả. Dưới đây là tóm tắt các khoản lương và khấu trừ:</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 18px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Số ngày công thực tế:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${actualWorkingDays} ngày</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Tổng thu nhập (Gross):</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(grossSalary)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Bảo hiểm bắt buộc (10.5%):</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">-${formatCurrency(totalInsurance)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Thuế TNCN tạm tính:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">-${formatCurrency(pitTax)}</td>
          </tr>
          <tr style="background: #ecfdf5;">
            <td style="padding: 12px 8px; font-weight: 700; color: #047857; font-size: 14px;">THỰC NHẬN VỀ TÀI KHOẢN (NET):</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: 800; color: #047857; font-size: 16px;">${formatCurrency(netSalary)}</td>
          </tr>
        </table>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #1e40af; margin-bottom: 16px;">
        💡 <strong>Ghi chú:</strong> Các khoản giảm trừ gia cảnh (bản thân 15.5M, người phụ thuộc 6.2M theo luật 2026) chỉ dùng để xác định thu nhập tính thuế, tuyệt đối không bị trừ vào tiền thực nhận của bạn.
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Vui lòng đăng nhập vào hệ thống PeopleInsight AI để tra cứu chi tiết phiếu lương và tải file bảng lương cá nhân.
      </p>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
        Email được gửi tự động từ phân hệ Quản lý Tiền lương & Thuế — PeopleInsight AI.
      </div>
    </div>
  </div>
</body>
</html>
`;

    return sendMailHelper({ to: employeeEmail, subject, text: textContent, html: htmlContent, companyName });
  }
}
