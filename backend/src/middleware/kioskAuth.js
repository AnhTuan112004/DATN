import crypto from 'crypto';
import { Company } from '../models/Company.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

/**
 * Middleware xác thực thiết bị Kiosk qua Header x-kiosk-token
 * Kiểm tra hash SHA-256 đối chiếu với settings.devices trong Company
 * Tự động kích hoạt Multi-tenant Fail-Closed context cho toàn bộ request kiosk
 */
export const authenticateKioskDevice = async (req, res, next) => {
  try {
    const rawToken = req.headers['x-kiosk-token'];
    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu bị từ chối: Thiếu Header x-kiosk-token để xác thực thiết bị Kiosk',
      });
    }

    // Băm SHA-256 để so khớp với token hash lưu trong CSDL
    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    // Tra cứu công ty sở hữu thiết bị Kiosk đang kích hoạt (không dùng tenantStore vì chưa có tenant)
    const company = await Company.findOne({
      'settings.devices.kioskSecretTokenHash': tokenHash,
      'settings.devices.isActive': true,
    }).select('_id name settings.devices');

    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Thiết bị Kiosk chưa được ủy quyền, bị vô hiệu hóa hoặc mã Token không chính xác',
      });
    }

    // Tìm thiết bị cụ thể trong mảng devices
    const device = company.settings.devices.find(
      (d) => d.kioskSecretTokenHash === tokenHash && d.isActive === true
    );

    if (!device) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thiết bị Kiosk hợp lệ trong cấu hình công ty',
      });
    }

    req.kiosk = {
      companyId: company._id,
      companyName: company.name,
      deviceId: device.deviceId,
      description: device.description || 'Kiosk Device',
    };

    // Bọc toàn bộ pipeline xử lý tiếp theo trong Tenant Context của công ty này
    return tenantStore.run({ companyId: company._id.toString() }, () => {
      next();
    });
  } catch (error) {
    next(error);
  }
};
