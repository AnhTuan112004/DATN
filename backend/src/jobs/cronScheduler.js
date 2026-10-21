import cron from 'node-cron';
import { runAllCompaniesContractReminders } from '../services/contractReminderService.js';

let cronTask = null;

/**
 * Khởi tạo tiến trình lập lịch chạy ngầm cho toàn hệ thống
 */
export const initCronJobs = () => {
  // Lịch chạy hàng ngày lúc 08:00 AM (giờ Việt Nam Asia/Ho_Chi_Minh)
  cronTask = cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('[Cron Job] ⏰ Bắt đầu quét kiểm tra hợp đồng lao động sắp hết hạn (30/60 ngày)...');
      try {
        const summary = await runAllCompaniesContractReminders();
        console.log(
          `[Cron Job] ✅ Hoàn tất quét hợp đồng: Đã xử lý ${summary.totalCompanies} công ty, gửi ${summary.totalNotificationsCreated} thông báo.`
        );
      } catch (err) {
        console.error('[Cron Job] ❌ Lỗi khi thực hiện quét hợp đồng lao động:', err);
      }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh',
    }
  );

  console.log('🕒 Cron Job Scheduler đã được khởi tạo: Quét hợp đồng lao động lúc 08:00 AM hàng ngày.');
  return cronTask;
};

/**
 * Kích hoạt thủ công ngay lập tức (phục vụ webhook cron-job.org hoặc API kiểm thử)
 */
export const triggerContractRemindersOnDemand = async (referenceDate) => {
  return await runAllCompaniesContractReminders(referenceDate);
};
