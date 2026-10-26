/**
 * SCRIPT RESET SANDBOX DEMO 1-CLICK (PEOPLEINSIGHT AI)
 * Khôi phục toàn bộ CSDL về trạng thái chuẩn chỉ trong 3 giây phục vụ diễn tập & bảo vệ ĐATN.
 * Lệnh chạy: npm run demo:reset
 */

import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import {
  Company,
  User,
  Department,
  AttendanceLog,
  LeaveRequest,
  Payroll,
  Notification,
  AuditLog,
  FaceTemplate,
} from '../src/models/index.js';
import { seedDatabase } from './seed/seed.js';

async function resetDemoSandbox() {
  console.log('\n=============================================================');
  console.log('🔄 BẮT ĐẦU RESET SANDBOX CƠ SỞ DỮ LIỆU DEMO (PEOPLEINSIGHT AI)');
  console.log('=============================================================');
  console.log(`[1/4] Đang kết nối tới MongoDB: ${config.mongodb.uri.split('@')[1] || config.mongodb.uri}...`);

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    console.log('✅ Kết nối MongoDB thành công.');

    console.log('[2/4] Đang làm sạch dữ liệu cũ và các bản ghi phát sinh trong quá trình kiểm thử...');
    await Promise.all([
      AttendanceLog.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Payroll.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      User.deleteMany({}),
      Department.deleteMany({}),
      FaceTemplate.deleteMany({}),
      Company.deleteMany({}),
    ]);
    console.log('✅ Đã dọn dẹp sạch sẽ 9 collections cốt lõi.');

    console.log('[3/4] Đang nạp dữ liệu chuẩn 50 nhân viên & cấu hình phòng bảo vệ ĐATN...');
    // Gọi hàm seedDatabase gốc
    await seedDatabase();

    console.log('[4/4] Hoàn tất khôi phục Sandbox Demo!');
    console.log('-------------------------------------------------------------');
    console.log('📌 BẢNG TÀI KHOẢN DIỄN TẬP BẢO VỆ ĐATN:');
    console.log('  1. Tổng Giám Đốc (CEO):      ceo@peopleinsight.vn');
    console.log('  2. Trưởng Phòng NS (HR):     hr.huong@peopleinsight.vn');
    console.log('  3. Trưởng Phòng IT (Mgr):    mgr.it@peopleinsight.vn');
    console.log('  4. Nhân Viên (Employee):     le.minh.tri@peopleinsight.vn (EMP009)');
    console.log('  🔑 Mật khẩu chung:           Admin@123456');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ [Reset Thất bại]', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('reset_demo.js')) {
  resetDemoSandbox();
}

export default resetDemoSandbox;
