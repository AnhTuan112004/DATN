import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  companyId,
  userId = null,
  action,
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || null;
    const userAgent = req?.headers['user-agent'] || null;

    await AuditLog.create({
      companyId,
      userId,
      action,
      ipAddress,
      userAgent,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`[AuditLog Error] Failed to record audit log: ${error.message}`);
  }
};
