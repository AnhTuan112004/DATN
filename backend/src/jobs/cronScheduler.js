import cron from 'node-cron';
import { runAllCompaniesContractReminders } from '../services/contractReminderService.js';
import { runAllCompaniesAbsentCheck } from '../services/absentAttendanceService.js';

let contractReminderTask = null;
let absentCheckTask = null;

/**
 * Khởi tạo tiến trình lập lịch chạy ngầm cho toàn hệ thống
 */
export const initCronJobs = () => {
  // 1. Lịch chạy nhắc hạn hợp đồng hàng ngày lúc 08:00 AM (giờ Việt Nam Asia/Ho_Chi_Minh)
  contractReminderTask = cron.schedule(
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

  // 2. Lịch chạy chốt ABSENT cho nhân sự không điểm danh lúc 23:59 hàng ngày (Asia/Ho_Chi_Minh)
  absentCheckTask = cron.schedule(
    '59 23 * * *',
    async () => {
      console.log('[Cron Job] ⏰ 23:59 - Bắt đầu quét chốt vắng mặt không phép (ABSENT) toàn hệ thống...');
      try {
        const summary = await runAllCompaniesAbsentCheck();
        console.log(
          `[Cron Job] ✅ Hoàn tất chốt ABSENT ngày ${summary.date}: Đã xử lý ${summary.totalProcessedCompanies} công ty, đánh dấu ${summary.totalAbsentMarked} nhân sự vắng mặt.`
        );
      } catch (err) {
        console.error('[Cron Job] ❌ Lỗi khi chốt ABSENT hàng ngày:', err);
      }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh',
    }
  );

  console.log('🕒 Cron Job Scheduler đã được khởi tạo: (1) Quét hợp đồng lúc 08:00 AM, (2) Chốt ABSENT lúc 23:59 PM.');
  return { contractReminderTask, absentCheckTask };
};

/**
 * Kích hoạt thủ công quét nhắc hạn hợp đồng (phục vụ webhook cron-job.org hoặc API kiểm thử)
 */
export const triggerContractRemindersOnDemand = async (referenceDate) => {
  return await runAllCompaniesContractReminders(referenceDate);
};

/**
 * Kích hoạt thủ công chốt ABSENT (phục vụ webhook cron-job.org hoặc catch-up ngày cũ)
 */
export const triggerAbsentCheckOnDemand = async (referenceDate) => {
  return await runAllCompaniesAbsentCheck(referenceDate);
};

