import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

import { Notification } from '../src/models/Notification.js';
import { User } from '../src/models/User.js';
import { Company } from '../src/models/Company.js';
import { tenantStore } from '../src/plugins/tenantPlugin.js';

async function main() {
  const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleinsight').replace('localhost', '127.0.0.1');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB via 127.0.0.1');

  const company = await Company.findOne({});
  if (!company) {
    console.log('No company found');
    process.exit(1);
  }

  await tenantStore.run({ companyId: company._id.toString() }, async () => {
    // 1. CEO (Nguyễn Văn An - EMP001 hoặc role CEO)
    const ceo = await User.findOne({ role: 'CEO' }) || await User.findOne({ employeeCode: 'EMP001' });
    if (ceo) {
      console.log('Seeding notifications for CEO:', ceo.fullName);
      await Notification.deleteMany({ userId: ceo._id });
      await Notification.create([
        {
          companyId: company._id,
          userId: ceo._id,
          title: '👑 Đề xuất bổ nhiệm vai trò cần CEO phê duyệt',
          message: 'Quản lý Nhân Sự Lê Thị Bình đã lập tờ trình đề xuất bổ nhiệm vai trò "MANAGER" cho nhân viên Vũ Hoàng Nam (EMP006). Vui lòng xem xét phê duyệt.',
          type: 'ROLE_PROPOSAL',
          data: { requiresApproval: true, proposedRole: 'MANAGER' },
          isRead: false,
          createdAt: new Date(Date.now() - 25 * 60 * 1000),
        },
        {
          companyId: company._id,
          userId: ceo._id,
          title: '📋 Đơn từ chờ duyệt Cấp 2 (Ban Giám Đốc)',
          message: 'Trưởng phòng IT đã duyệt đơn ANNUAL (3.0 ngày) của Trịnh Quốc Bảo (EMP011). Đang chờ Ban Giám Đốc / HR phê duyệt cấp cuối.',
          type: 'LEAVE_REQUEST',
          data: { requiresApproval: true },
          isRead: false,
          createdAt: new Date(Date.now() - 75 * 60 * 1000),
        },
        {
          companyId: company._id,
          userId: ceo._id,
          title: '💰 Bảng lương kỳ 10/2026 đã sẵn sàng rà soát',
          message: 'Bảng lương kỳ 10/2026 toàn công ty đã hoàn tất tính toán tự động. Vui lòng rà soát và thực hiện khóa kỳ lương nguyên tử.',
          type: 'PAYROLL_READY',
          data: { requiresApproval: true },
          isRead: false,
          createdAt: new Date(Date.now() - 3 * 3600 * 1000),
        },
      ]);
    }

    // 2. HR Manager (Lê Thị Bình - EMP002 hoặc role HR_MANAGER)
    const hrMgr = await User.findOne({ role: 'HR_MANAGER' }) || await User.findOne({ employeeCode: 'EMP002' });
    if (hrMgr) {
      console.log('Seeding notifications for HR Manager:', hrMgr.fullName);
      await Notification.deleteMany({ userId: hrMgr._id });
      await Notification.create([
        {
          companyId: company._id,
          userId: hrMgr._id,
          title: '📋 Yêu cầu duyệt đơn nghỉ phép mới',
          message: 'Nhân viên Trịnh Quốc Bảo (EMP011) vừa được Quản lý IT duyệt đơn nghỉ phép 3 ngày, đang chờ HR xử lý.',
          type: 'LEAVE_REQUEST',
          data: { requiresApproval: true },
          isRead: false,
          createdAt: new Date(Date.now() - 40 * 60 * 1000),
        },
        {
          companyId: company._id,
          userId: hrMgr._id,
          title: '⏰ Cảnh báo Hợp đồng lao động sắp hết hạn',
          message: 'Hợp đồng lao động của nhân viên Trần Minh Tâm sẽ hết hạn sau 25 ngày. Vui lòng chuẩn bị phụ lục hoặc gia hạn.',
          type: 'CONTRACT_EXPIRY',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 3600 * 1000),
        },
      ]);
    }

    // 3. Employee (Đỗ Quang Huy - EMP009)
    const huy = await User.findOne({ employeeCode: 'EMP009' });
    if (huy) {
      console.log('Found user:', huy.fullName, huy.email, huy._id);
      await Notification.deleteMany({ userId: huy._id });
      await Notification.create([
        {
          companyId: company._id,
          userId: huy._id,
          title: 'Đơn làm thêm giờ (OT) đã được phê duyệt',
          message: 'Đơn làm thêm giờ (3.0 giờ) ngày 22/10/2026 cho Dự án Sprint 4 đã được Quản lý IT phê duyệt thành công.',
          type: 'LEAVE_REQUEST',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        },
        {
          companyId: company._id,
          userId: huy._id,
          title: 'Phiếu lương Tháng 11/2026 đã sẵn sàng',
          message: 'Bảng lương kỳ 11/2026 đã được phòng nhân sự chốt. Thực nhận: 29.493.000 đ. Bấm để xem chi tiết.',
          type: 'PAYROLL_READY',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 3600 * 1000),
        },
        {
          companyId: company._id,
          userId: huy._id,
          title: 'Điểm danh vào ca thành công hôm nay',
          message: 'Bạn đã điểm danh vào ca lúc 08:24 tại máy Kiosk FaceID văn phòng (Đúng giờ). Chúc bạn ngày làm việc hiệu quả!',
          type: 'ATTENDANCE_ALERT',
          isRead: false,
          createdAt: new Date(Date.now() - 10 * 3600 * 1000),
        },
      ]);
      console.log('Seeded fresh notifications successfully!');
    }
  });

  await mongoose.disconnect();
}

main().catch(console.error);
