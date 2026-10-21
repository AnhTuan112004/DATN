import { Company, User, Notification, AuditLog } from '../models/index.js';
import { tenantStore } from '../plugins/tenantPlugin.js';
import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';

/**
 * Kiểm tra và gửi thông báo nhắc hạn hợp đồng 30/60 ngày cho một công ty cụ thể
 * Thiết kế bảo đảm tính Idempotent tuyệt đối (chạy nhiều lần trong ngày không trùng thông báo)
 */
export const checkCompanyContractReminders = async (companyId, referenceDate = new Date()) => {
  const store = tenantStore.getStore();
  if (!store?.companyId) {
    return tenantStore.run({ companyId: companyId.toString() }, () =>
      _executeCompanyContractReminders(companyId, referenceDate)
    );
  }
  return _executeCompanyContractReminders(companyId, referenceDate);
};

const _executeCompanyContractReminders = async (companyId, referenceDate = new Date()) => {
  const refDate = new Date(referenceDate);
  refDate.setHours(0, 0, 0, 0);

  // Tìm tất cả nhân viên đang hoạt động có hợp đồng ACTIVE và có ngày hết hạn
  const usersWithActiveContracts = await User.find({
    isActive: true,
    'contracts.status': 'ACTIVE',
    'contracts.effectiveTo': { $ne: null },
  }).select('_id fullName employeeCode departmentId contracts');

  // Tìm danh sách lãnh đạo nhận thông báo (CEO và HR_MANAGER)
  const hrLeaders = await User.find({
    isActive: true,
    role: { $in: [ROLES.CEO, ROLES.HR_MANAGER] },
  }).select('_id fullName email role');

  let notificationsCreated = 0;
  const processedContracts = [];

  for (const user of usersWithActiveContracts) {
    for (const contract of user.contracts || []) {
      if (contract.status !== 'ACTIVE' || !contract.effectiveTo) continue;

      const expiryDate = new Date(contract.effectiveTo);
      expiryDate.setHours(0, 0, 0, 0);

      // Tính số ngày còn lại đến hạn
      const diffTime = expiryDate.getTime() - refDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Xác định mốc cảnh báo (60 ngày hoặc 30 ngày)
      let milestone = null;
      if (diffDays <= 30 && diffDays >= 0) {
        milestone = '30D';
      } else if (diffDays <= 60 && diffDays > 30) {
        milestone = '60D';
      }

      if (!milestone) continue;

      // Base idempotency key cho đợt nhắc này
      const baseKey = `CONTRACT_EXPIRY_${user._id}_${contract.contractNumber}_${milestone}`;

      // Kiểm tra xem đã gửi cho HR/CEO ở mốc này chưa
      const existingNotification = await Notification.findOne({
        'data.baseKey': baseKey,
      });

      if (existingNotification) {
        // Đã gửi trước đó -> Bỏ qua để đảm bảo tính Idempotent
        continue;
      }

      const formattedExpiry = expiryDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const title = `[Nhắc Hạn Hợp Đồng] HĐ ${contract.contractNumber} của ${user.fullName} còn ${diffDays} ngày`;
      const message = `Hợp đồng lao động ${contract.contractNumber} (${contract.contractType}) của nhân sự ${user.fullName} (${user.employeeCode}) sẽ hết hiệu lực vào ngày ${formattedExpiry} (còn ${diffDays} ngày). Vui lòng chuẩn bị quy trình đánh giá và tái ký hợp đồng.`;

      // 1. Gửi thông báo cho toàn bộ CEO và HR Manager
      for (const leader of hrLeaders) {
        await Notification.create({
          companyId,
          userId: leader._id,
          title,
          message,
          type: 'CONTRACT_EXPIRY',
          data: {
            baseKey,
            idempotencyKey: `${baseKey}_${leader._id}`,
            targetUserId: user._id,
            employeeCode: user.employeeCode,
            contractNumber: contract.contractNumber,
            contractType: contract.contractType,
            effectiveTo: contract.effectiveTo,
            daysRemaining: diffDays,
            milestone,
          },
        });
        notificationsCreated++;
      }

      // 2. Gửi thông báo nhắc nhở cho chính nhân viên
      await Notification.create({
        companyId,
        userId: user._id,
        title: `[Nhắc Hạn Hợp Đồng] Hợp đồng lao động của bạn còn ${diffDays} ngày hiệu lực`,
        message: `Hợp đồng lao động số ${contract.contractNumber} của bạn sẽ hết hạn vào ngày ${formattedExpiry}. Phòng Nhân sự sẽ liên hệ bạn để trao đổi về kế hoạch gia hạn hợp đồng.`,
        type: 'CONTRACT_EXPIRY',
        data: {
          baseKey,
          idempotencyKey: `${baseKey}_self`,
          targetUserId: user._id,
          contractNumber: contract.contractNumber,
          effectiveTo: contract.effectiveTo,
          daysRemaining: diffDays,
          milestone,
        },
      });
      notificationsCreated++;

      processedContracts.push({
        employeeCode: user.employeeCode,
        fullName: user.fullName,
        contractNumber: contract.contractNumber,
        diffDays,
        milestone,
      });
    }
  }

  return {
    companyId,
    scannedUsers: usersWithActiveContracts.length,
    contractsChecked: usersWithActiveContracts.length,
    expiringContractsFound: processedContracts.length,
    notificationsCreated,
    processedContracts,
  };
};

/**
 * Quét toàn bộ công ty trong hệ thống có bọc Tenant Context độc lập
 */
export const runAllCompaniesContractReminders = async (referenceDate = new Date()) => {
  const companies = await Company.find().select('_id name code');
  const results = [];
  let totalNotifications = 0;

  for (const company of companies) {
    const compResult = await tenantStore.run(
      { companyId: company._id.toString() },
      async () => {
        return await checkCompanyContractReminders(company._id, referenceDate);
      }
    );

    results.push(compResult);
    totalNotifications += compResult.notificationsCreated;
  }

  return {
    timestamp: new Date().toISOString(),
    totalCompanies: companies.length,
    totalNotificationsCreated: totalNotifications,
    results,
  };
};
