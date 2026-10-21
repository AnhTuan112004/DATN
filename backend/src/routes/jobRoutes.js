import express from 'express';
import { triggerContractRemindersOnDemand } from '../jobs/cronScheduler.js';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

/**
 * Middleware xác thực gọi Job:
 * Chấp nhận Header x-cron-key (cho cron-job.org) HOẶC Bearer Token của CEO/HR Manager
 */
const authenticateJobCaller = (req, res, next) => {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && cronKey === config.security.cronJobApiKey) {
    req.jobTriggerSource = 'CRON_KEY';
    return next();
  }

  // Nếu không có cronKey, dùng xác thực JWT
  return authenticate(req, res, () => {
    if ([ROLES.CEO, ROLES.HR_MANAGER].includes(req.user?.role)) {
      req.jobTriggerSource = 'USER_ROLE';
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối: Chỉ CEO hoặc HR Manager được kích hoạt Job thủ công',
    });
  });
};

/**
 * POST /api/jobs/contract-reminders
 * Kích hoạt quét nhắc nhở hạn hợp đồng (idempotent)
 */
router.post('/contract-reminders', authenticateJobCaller, async (req, res, next) => {
  try {
    const referenceDate = req.body?.referenceDate || req.query?.referenceDate || new Date();
    const result = await triggerContractRemindersOnDemand(referenceDate);

    res.status(200).json({
      success: true,
      message: 'Đã hoàn tất tiến trình quét và nhắc nhở hạn hợp đồng lao động',
      data: {
        triggerSource: req.jobTriggerSource,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
