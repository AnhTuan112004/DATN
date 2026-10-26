import { PolicyChunk } from '../models/PolicyChunk.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

export class PolicyService {
  /**
   * Tìm kiếm nội quy lao động công ty theo từ khóa
   */
  static async searchPolicies(queryText, category = null) {
    const tenant = tenantStore.getStore();
    const filter = { companyId: tenant?.companyId };
    if (category) filter.category = category;

    if (queryText && queryText.trim()) {
      const regex = new RegExp(queryText.trim(), 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }

    return PolicyChunk.find(filter).sort({ createdAt: -1 }).limit(10);
  }

  /**
   * Tạo đoạn nội quy mới
   */
  static async createPolicy(data) {
    const tenant = tenantStore.getStore();
    const policy = new PolicyChunk({
      ...data,
      companyId: tenant?.companyId,
    });
    return policy.save();
  }

  /**
   * Seed dữ liệu mẫu nội quy lao động chuẩn nếu chưa có
   */
  static async seedDefaultPoliciesIfEmpty(companyId) {
    const count = await PolicyChunk.countDocuments({ companyId });
    if (count > 0) return;

    const samplePolicies = [
      {
        companyId,
        title: 'Thời giờ làm việc và nghỉ ngơi',
        content: 'Thời gian làm việc tiêu chuẩn từ 08:30 đến 17:30 các ngày từ Thứ Hai đến Thứ Sáu. Thời gian nghỉ trưa từ 12:00 đến 13:00. Nhân viên đi muộn quá 15 phút cần báo cáo quản lý.',
        category: 'WORKING_HOURS',
        sourceDocument: 'Nội quy lao động 2026 - Điều 4',
      },
      {
        companyId,
        title: 'Chính sách Chế độ Nghỉ phép năm và Phép ốm',
        content: 'Người lao động làm đủ 12 tháng được nghỉ 12 ngày phép năm nguyên lương. Cứ mỗi 05 năm làm việc được cộng thêm 01 ngày theo Điều 114 BLLĐ. Nghỉ ốm đau có giấy viện C được hưởng trợ cấp BHXH.',
        category: 'LEAVE_POLICY',
        sourceDocument: 'Nội quy lao động 2026 - Điều 12',
      },
      {
        companyId,
        title: 'Quy tắc Làm thêm giờ (OT) và Chế độ đãi ngộ',
        content: 'Giờ làm thêm không quá 4h/ngày và 40h/tháng. Tiền làm thêm ngày thường hưởng 150%, ngày nghỉ tuần hưởng 200%, ngày lễ tết hưởng 300%. Toàn bộ tiền OT hợp lệ được miễn thuế TNCN từ năm 2026.',
        category: 'OT_POLICY',
        sourceDocument: 'Nội quy lao động 2026 - Điều 18',
      },
      {
        companyId,
        title: 'Quy định Trang phục & Văn hóa Doanh nghiệp',
        content: 'Trang phục lịch sự, thanh lịch (Business Casual). Thứ Sáu được mặc trang phục tự do phù hợp môi trường công sở. Nghiêm cấm mọi hành vi phân biệt đối xử theo Điều 8 BLLĐ.',
        category: 'CULTURE_POLICY',
        sourceDocument: 'Quy chế văn hóa doanh nghiệp - Điều 2',
      },
    ];

    await PolicyChunk.insertMany(samplePolicies);
  }
}
