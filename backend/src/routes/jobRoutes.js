import express from 'express';
import {
  triggerContractRemindersOnDemand,
  triggerAbsentCheckOnDemand,
} from '../jobs/cronScheduler.js';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

/**
 * Middleware xác thực gọi Job:
 * Chấp nhận Header x-cron-secret / x-cron-key HOẶC query ?secret=... / ?key=... (cho cron-job.org)
 * HOẶC Bearer Token của CEO / HR Manager
 */
const authenticateJobCaller = (req, res, next) => {
  const cronKey = req.headers['x-cron-key'];
  const cronSecret =
    req.headers['x-cron-secret'] ||
    req.query.secret ||
    req.query.key;

  const validSecret = config.security.cronJobApiKey || process.env.CRON_SECRET || 'default_cron_job_api_key_secret';

  // 1. Nếu có cung cấp cron-key hoặc cron-secret
  if (cronKey) {
    if (cronKey === validSecret) {
      req.jobTriggerSource = 'CRON_KEY';
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu bị từ chối: Secret Token không chính xác',
      error: 'Invalid cron secret token',
    });
  }

  if (cronSecret) {
    if (cronSecret === validSecret) {
      req.jobTriggerSource = 'CRON_SECRET';
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu bị từ chối: Secret Token không chính xác',
      error: 'Invalid cron secret token',
    });
  }

  // 2. Nếu không có secret token và cũng không có Authorization header
  if (!req.headers.authorization && !req.cookies?.accessToken) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu bị từ chối: Thiếu Secret Token cho cron-job.org (x-cron-secret) hoặc token xác thực người dùng',
      error: 'Missing cron secret or auth token',
    });
  }

  // 3. Nếu có token JWT, kiểm tra quyền CEO / HR_MANAGER
  return authenticate(req, res, () => {
    if ([ROLES.CEO, ROLES.HR_MANAGER].includes(req.user?.role)) {
      req.jobTriggerSource = 'USER_ROLE';
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối: Chỉ CEO hoặc HR Manager được kích hoạt Job thủ công',
      error: 'Forbidden: Insufficient permissions',
    });
  });
};

/**
 * Handler thực thi job (hỗ trợ cả GET và POST cho cron-job.org)
 */
const handleJobExecution = async (req, res, next) => {
  try {
    const jobType = req.body?.type || req.body?.jobType || req.query?.type || req.query?.jobType || 'absent_check';
    const referenceDate = req.body?.date || req.body?.referenceDate || req.query?.date || req.query?.referenceDate || new Date();

    let result = {};

    if (jobType === 'absent_check') {
      result = await triggerAbsentCheckOnDemand(referenceDate);
    } else if (jobType === 'contract_reminders' || jobType === 'contract-reminders') {
      result = await triggerContractRemindersOnDemand(referenceDate);
    } else if (jobType === 'all') {
      const [absentRes, contractRes] = await Promise.all([
        triggerAbsentCheckOnDemand(referenceDate),
        triggerContractRemindersOnDemand(referenceDate),
      ]);
      result = { absentCheck: absentRes, contractReminders: contractRes };
    } else {
      return res.status(400).json({
        success: false,
        message: `Loại job '${jobType}' không được hỗ trợ. Các loại hợp lệ: absent_check, contract_reminders, all`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã hoàn tất thực thi tác vụ nền [${jobType}]`,
      jobType,
      triggerSource: req.jobTriggerSource,
      data: {
        triggerSource: req.jobTriggerSource,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint chuẩn phục vụ cron-job.org:
 * POST & GET /api/jobs/run
 */
router.post('/run', authenticateJobCaller, handleJobExecution);
router.get('/run', authenticateJobCaller, handleJobExecution);

/**
 * POST /api/jobs/absent-check
 * Kích hoạt chốt ABSENT thủ công hoặc catch-up ngày cũ
 */
router.post('/absent-check', authenticateJobCaller, async (req, res, next) => {
  try {
    const referenceDate = req.body?.date || req.body?.referenceDate || req.query?.date || new Date();
    const result = await triggerAbsentCheckOnDemand(referenceDate);

    res.status(200).json({
      success: true,
      message: `Đã hoàn tất tiến trình chốt vắng mặt không phép (ABSENT) ngày ${result.date}`,
      triggerSource: req.jobTriggerSource,
      data: {
        triggerSource: req.jobTriggerSource,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
});

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
      triggerSource: req.jobTriggerSource,
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
