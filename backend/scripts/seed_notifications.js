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
    const huy = await User.findOne({ employeeCode: 'EMP009' });
    if (!huy) {
      console.log('EMP009 not found');
      return;
    }

    console.log('Found user:', huy.fullName, huy.email, huy._id);

    const existing = await Notification.find({ userId: huy._id });
    console.log('Existing notifications for Huy:', JSON.stringify(existing, null, 2));

    // Clear existing for Huy and insert 3 crisp notifications
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
    console.log('Seeded 3 fresh notifications for Đỗ Quang Huy successfully!');
  });

  await mongoose.disconnect();
}

main().catch(console.error);
