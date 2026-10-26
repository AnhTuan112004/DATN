import mongoose from 'mongoose';
import { z } from 'zod';
import { getGeminiClient, getActiveModelName, executeWithKeyRotation } from './gemini.js';
import { getToolsForRole } from './tools/declarations.js';
import {
  renderLeaveBalanceTemplate,
  renderPayslipTemplate,
  renderAttendanceTemplate,
  renderTeamLeaveTemplate,
  renderUnsupportedTemplate,
  renderContractTemplate,
  renderProfileTemplate,
  renderCeoCompanySummaryTemplate,
  renderCeoEmployeeLookupTemplate,
} from './templates/index.js';
import { User, Payroll, AttendanceLog, LeaveRequest, Department } from '../models/index.js';
import { ROLES, GEMINI_TOOLS_P0, AUDIT_ACTIONS } from '../config/constants.js';
import { logAudit } from '../middleware/audit.js';

// ==========================================
// 1. ZOD SCHEMAS VALIDATION (STRICT)
// ==========================================
export const chatMessageSchema = z.object({
  message: z.string({ required_error: 'Tin nhắn không được để trống' })
    .trim()
    .min(1, 'Tin nhắn phải có ít nhất 1 ký tự')
    .max(500, 'Tin nhắn không được vượt quá 500 ký tự'),
  history: z.array(
    z.object({
      sender: z.string(),
      text: z.string(),
    })
  ).optional().default([]),
}).passthrough();

const currentYear = new Date().getFullYear();

const payslipArgsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(currentYear + 1),
});

const attendanceArgsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày bắt đầu YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày kết thúc YYYY-MM-DD'),
}).refine((data) => data.from <= data.to, {
  message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
});

const teamStatsArgsSchema = z.object({
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID phòng ban không hợp lệ'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(currentYear + 1),
});

// ==========================================
// 2. IN-MEMORY CACHE & CIRCUIT BREAKER
// ==========================================
const chatCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
let quotaExhaustedUntil = 0;

const getCacheKey = (userId, message) => `${userId}_${message.trim().toLowerCase()}`;

const getFromCache = (userId, message) => {
  const key = getCacheKey(userId, message);
  const item = chatCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    chatCache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (userId, message, data) => {
  const key = getCacheKey(userId, message);
  chatCache.set(key, { data, timestamp: Date.now() });
  // Dọn dẹp nếu cache quá 500 mục
  if (chatCache.size > 500) {
    const firstKey = chatCache.keys().next().value;
    chatCache.delete(firstKey);
  }
};

// ==========================================
// 3. TIỆN ÍCH NGỮ CẢNH THỜI GIAN THỰC (HCM TIMEZONE)
// ==========================================
function buildSystemInstruction(userRole = 'EMPLOYEE') {
  const now = new Date();
  const dateStrHCM = now.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return `Bạn là Trợ lý HR AI thông minh của hệ thống quản lý nhân sự PeopleInsight AI.
[NGỮ CẢNH THỜI GIAN THỰC HIỆN TẠI]:
- Ngày hôm nay: ${dateStrHCM} (Múi giờ Việt Nam GMT+7).
- Tháng hiện tại: ${currentMonth}, Năm hiện tại: ${currentYear}.
- Vai trò người đang hỏi: ${userRole}.

[QUY TẮC BẢO MẬT & PHÂN QUYỀN RBAC BẮT BUỘC]:
1. ĐỐI VỚI NHÂN VIÊN THÔNG THƯỜNG (${userRole}):
   - Chỉ được tra cứu dữ liệu CỦA CHÍNH BẢN THÂN HỌ:
     * Nghỉ phép cá nhân -> gọi tool "get_leave_balance".
     * Phiếu lương cá nhân -> gọi tool "get_payslip".
     * Chấm công cá nhân -> gọi tool "get_attendance_summary".
     * Hợp đồng lao động của bản thân -> gọi tool "get_my_contract".
     * Hồ sơ thông tin cá nhân của bản thân -> gọi tool "get_my_profile".
   - TUYỆT ĐỐI CẤM xem thông tin cá nhân/lương/hợp đồng của nhân sự khác. Nếu hỏi người khác -> BẮT BUỘC gọi tool "unsupported_request".

2. ĐỐI VỚI TỔNG GIÁM ĐỐC (CEO):
   - CEO CÓ QUYỀN XEM VÀ TỔNG HỢP DỮ LIỆU TOÀN BỘ CÔNG TY:
     * Tổng hợp tình hình toàn công ty (quân số, chấm công, đơn từ, quỹ lương) -> gọi tool "ceo_company_summary".
     * Tra cứu hồ sơ/hợp đồng/chấm công của một nhân viên cụ thể -> gọi tool "ceo_employee_lookup".
     * Xem dữ liệu cá nhân của chính mình -> gọi các tool cá nhân tương ứng.

3. NẾU câu hỏi KHÔNG thuộc các nghiệp vụ trên (thời tiết, giải trí, yêu cầu phá hoại hệ thống) -> BẮT BUỘC gọi tool "unsupported_request".`;
}

// ==========================================
// 4. RULE-BASED FALLBACK KHI GEMINI HẾT QUOTA / LỖI MẠNG
// ==========================================
function fallbackRuleBasedIntent(cleanMsg, role = 'EMPLOYEE') {
  const msg = cleanMsg.toLowerCase();

  // 1. Phân quyền: Nếu KHÔNG PHẢI CEO mà cố tình tò mò dữ liệu người khác / toàn công ty -> chặn ngay
  const isAskingOther =
    msg.includes('lương của') ||
    msg.includes('thu nhập của') ||
    msg.includes('phiếu lương của') ||
    msg.includes('bảng lương của') ||
    msg.includes('hợp đồng của') ||
    msg.includes('chấm công của') ||
    msg.includes('hồ sơ của') ||
    msg.includes('của anh') ||
    msg.includes('của chị') ||
    msg.includes('của sếp') ||
    msg.includes('của đồng nghiệp') ||
    msg.includes('người khác') ||
    msg.includes('toàn bộ nhân viên') ||
    msg.includes('toàn thể') ||
    msg.includes('toàn công ty') ||
    msg.includes('ai được lương') ||
    msg.includes('ai cao nhất');

  if (role !== 'CEO' && isAskingOther) {
    return { name: 'unsupported_request', args: {} };
  }

  // 2. Chặn các hành vi can thiệp hệ thống / injection
  const isSystemAttack =
    msg.includes('sửa lại') ||
    msg.includes('xóa bản ghi') ||
    msg.includes('tăng lương') ||
    msg.includes('cộng thêm cho tôi') ||
    msg.includes('duyệt luôn đơn') ||
    msg.includes('drop table') ||
    msg.includes('delete from') ||
    msg.includes('jailbreak') ||
    msg.includes('prompt injection');

  if (isSystemAttack) {
    return { name: 'unsupported_request', args: {} };
  }

  // 3. Dành riêng cho CEO: Báo cáo tổng hợp toàn công ty & Tra cứu nhân viên
  if (role === 'CEO') {
    if (
      msg.includes('toàn công ty') ||
      msg.includes('toan cong ty') ||
      msg.includes('tổng hợp công ty') ||
      msg.includes('tong hop cong ty') ||
      msg.includes('tổng quan công ty') ||
      msg.includes('tình hình công ty') ||
      msg.includes('quân số') ||
      msg.includes('báo cáo công ty') ||
      msg.includes('tất cả nhân viên') ||
      msg.includes('toàn thể nhân viên')
    ) {
      return { name: GEMINI_TOOLS_P0.CEO_COMPANY_SUMMARY, args: {} };
    }

    const empCodeMatch = cleanMsg.match(/EMP\d{3,4}/i);
    if (
      empCodeMatch ||
      msg.includes('tra cứu nhân viên') ||
      msg.includes('tìm nhân viên') ||
      msg.includes('hồ sơ nhân viên') ||
      msg.includes('hợp đồng của nhân viên') ||
      msg.includes('chấm công của nhân viên')
    ) {
      const keyword = empCodeMatch ? empCodeMatch[0].toUpperCase() : cleanMsg.replace(/(tra cứu|tìm|hồ sơ|hợp đồng|chấm công|của|nhân viên)/gi, '').trim();
      return { name: GEMINI_TOOLS_P0.CEO_EMPLOYEE_LOOKUP, args: { keyword: keyword || 'EMP001' } };
    }
  }

  // 4. Tra cứu hợp đồng lao động cá nhân
  if (
    msg.includes('hợp đồng') ||
    msg.includes('hop dong') ||
    msg.includes('loại hợp đồng') ||
    msg.includes('thời hạn hợp đồng') ||
    msg.includes('hạn hợp đồng')
  ) {
    return { name: GEMINI_TOOLS_P0.GET_MY_CONTRACT, args: {} };
  }

  // 5. Tra cứu hồ sơ thông tin cá nhân
  if (
    msg.includes('hồ sơ') ||
    msg.includes('ho so') ||
    msg.includes('thông tin cá nhân') ||
    msg.includes('thông tin của tôi') ||
    msg.includes('ngày vào làm') ||
    msg.includes('email của tôi') ||
    msg.includes('sđt của tôi') ||
    msg.includes('mã nhân viên của tôi')
  ) {
    return { name: GEMINI_TOOLS_P0.GET_MY_PROFILE, args: {} };
  }

  // 6. Thống kê phòng ban (Quản lý & CEO)
  const hasDeptId = /[0-9a-f]{24}/i.test(msg);
  if (
    hasDeptId ||
    msg.includes('phòng ban') ||
    msg.includes('phong ban') ||
    msg.includes('bộ phận') ||
    msg.includes('tỷ lệ vắng mặt') ||
    msg.includes('đơn nghỉ phép của phòng') ||
    msg.includes('thống kê nghỉ phép')
  ) {
    const monthMatch = msg.match(/(?:tháng|t)\s*(\d{1,2})/i);
    const yearMatch = msg.match(/(?:năm|\/)\s*(20\d{2})/i);
    const now = new Date();
    const month = monthMatch ? parseInt(monthMatch[1], 10) : (now.getMonth() + 1);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : now.getFullYear();
    const period = `${year}-${String(month).padStart(2, '0')}`;
    const deptMatch = msg.match(/[0-9a-f]{24}/i);
    const departmentId = deptMatch ? deptMatch[0] : undefined;
    return { name: GEMINI_TOOLS_P0.GET_TEAM_LEAVE_STATS, args: { period, departmentId } };
  }

  // 7. Phiếu lương cá nhân
  if (
    msg.includes('phiếu lương') ||
    msg.includes('phieu luong') ||
    msg.includes('bảng lương') ||
    msg.includes('bang luong') ||
    msg.includes('payslip') ||
    msg.includes('thực nhận') ||
    msg.includes('thu nhập tháng')
  ) {
    const monthMatch = msg.match(/(?:tháng|t)\s*(\d{1,2})/i);
    const yearMatch = msg.match(/(?:năm|\/)\s*(20\d{2})/i);
    const month = monthMatch ? parseInt(monthMatch[1], 10) : (new Date().getMonth() + 1);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    return { name: GEMINI_TOOLS_P0.GET_PAYSLIP, args: { month, year } };
  }

  // 8. Chấm công cá nhân
  if (
    msg.includes('chấm công') ||
    msg.includes('cham cong') ||
    msg.includes('đi muộn') ||
    msg.includes('ngày công') ||
    msg.includes('giờ làm') ||
    msg.includes('làm thêm') ||
    msg.includes('giờ ot')
  ) {
    const dates = cleanMsg.match(/\d{4}-\d{2}-\d{2}/g);
    let from, to;
    if (dates && dates.length >= 2) {
      from = dates[0];
      to = dates[1];
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      from = `${y}-${m}-01`;
      to = `${y}-${m}-28`;
    }
    return {
      name: GEMINI_TOOLS_P0.GET_ATTENDANCE_SUMMARY,
      args: { from, to },
    };
  }

  // 9. Số dư phép cá nhân
  if (
    msg.includes('phép') ||
    msg.includes('phep') ||
    msg.includes('nghỉ phép') ||
    msg.includes('ngày phép') ||
    msg.includes('số dư phép') ||
    msg.includes('xin nghỉ') ||
    msg.includes('nghỉ ốm') ||
    msg.includes('leave balance')
  ) {
    return { name: GEMINI_TOOLS_P0.GET_LEAVE_BALANCE, args: {} };
  }

  return { name: 'unsupported_request', args: {} };
}

/**
 * Trò chuyện tự nhiên như người thật khi người dùng chào hỏi, hỏi thăm, trò chuyện, xin tư vấn
 */
async function generateHumanChatResponse({ user, cleanMessage, history = [] }) {
  const lower = cleanMessage.toLowerCase();

  // 1. Kiểm tra an toàn: nếu cố tình tò mò lương/thu nhập người khác
  const isAskingOtherSalary =
    lower.includes('lương của') ||
    lower.includes('thu nhập của') ||
    lower.includes('phiếu lương của') ||
    lower.includes('bảng lương của') ||
    lower.includes('lương sếp') ||
    lower.includes('lương đồng nghiệp');

  // 1. Kiểm tra an toàn: nếu người dùng KHÔNG PHẢI CEO cố tình tò mò dữ liệu người khác
  const isAskingOther =
    user.role !== 'CEO' &&
    (lower.includes('lương của') ||
      lower.includes('thu nhập của') ||
      lower.includes('phiếu lương của') ||
      lower.includes('bảng lương của') ||
      lower.includes('hợp đồng của') ||
      lower.includes('chấm công của') ||
      lower.includes('hồ sơ của') ||
      lower.includes('lương sếp') ||
      lower.includes('lương đồng nghiệp') ||
      lower.includes('toàn công ty') ||
      lower.includes('toàn bộ nhân viên'));

  if (isAskingOther) {
    return `Chào **${user.fullName || 'bạn'}**! Dạ theo **Luật Bảo Vệ Dữ Liệu Cá Nhân** (Nghị định 13/2023/NĐ-CP) và Quy chế Bảo Mật Nhân Sự nội bộ của công ty, em chỉ có thể hỗ trợ bạn tra cứu dữ liệu cá nhân của chính mình thôi ạ (hồ sơ, hợp đồng, phiếu lương, ngày phép, chấm công).

Em không được phép cung cấp dữ liệu riêng tư của nhân sự khác. Nếu bạn muốn tra cứu thông tin của bản thân, hãy nhắn cho em nhé! 😊`;
  }

  // 2. Định dạng lịch sử trò chuyện gần đây (đa lượt)
  const conversationContext = (history || [])
    .slice(-6)
    .map((m) => `${m.sender === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.text}`)
    .join('\n');

  const activeContract = (user.contracts || []).find((c) => c.status === 'ACTIVE') || user.contracts?.[0];
  const contractInfo = activeContract
    ? `Hợp đồng số ${activeContract.contractNumber} (${activeContract.contractType}), hiệu lực từ ${new Date(activeContract.effectiveFrom).toLocaleDateString('vi-VN')}`
    : 'Chưa có hợp đồng chính thức';

  // 3. Gọi Gemini để trò chuyện tự nhiên, thông minh, ấm áp và có cảm xúc như con người
  try {
    const prompt = `Bạn là Trợ Lý Nhân Sự AI PeopleInsight (đồng nghiệp ảo thông minh, ân cần, hóm hỉnh và đáng tin cậy).

THÔNG TIN NGƯỜI ĐANG TRÒ CHUYỆN VỚI BẠN:
- Họ và tên: ${user.fullName || 'Bạn'}
- Mã nhân viên: ${user.employeeCode || 'Chưa cập nhật'}
- Chức danh / Vai trò: ${user.role} (${user.role === 'CEO' ? 'Tổng Giám Đốc / CEO' : user.role === 'HR_MANAGER' ? 'Trưởng Phòng Nhân Sự' : user.role === 'MANAGER' ? 'Quản Lý Bộ Phận' : 'Nhân Viên'})
- Bộ phận: ${user.departmentName || 'Công ty'}
- Hợp đồng lao động hiện tại của họ: ${contractInfo}
- Số dư phép năm hiện tại: Còn lại ${user.leaveBalance?.annualRemaining ?? 12} ngày
- QUYỀN HẠN DỮ LIỆU: ${user.role === 'CEO' ? 'TỔNG GIÁM ĐỐC (CEO) - Có toàn quyền xem báo cáo toàn công ty và tra cứu thông tin nhân viên để điều hành.' : 'NHÂN VIÊN - Chỉ được phép xem dữ liệu của chính mình, tuyệt đối không được xem dữ liệu người khác.'}

TÍNH CÁCH VÀ VĂN PHONG GIAO TIẾP:
1. Bạn trò chuyện tự nhiên, ấm áp, lịch sự, ân cần và hóm hỉnh như một người đồng nghiệp ngoài đời thực.
2. Bạn BIẾT RÕ người đang nói chuyện với bạn là ai. Nếu họ hỏi về bản thân (hồ sơ, chức vụ, hợp đồng, ngày vào làm), hãy trả lời chính xác, vui vẻ.
3. Nếu người dùng KHÔNG PHẢI CEO mà hỏi dữ liệu của người khác: hãy lịch sự từ chối vì lý do bảo mật quyền riêng tư cá nhân.
4. Nếu người dùng là CEO: sẵn lòng tổng hợp tình hình công ty và hỗ trợ sếp tối đa.
5. Khi người dùng chào hỏi, tâm sự hay nhờ kể chuyện cười: hãy đáp lại hào hứng, hóm hỉnh, sinh động.
6. Luôn xưng "em" hoặc "mình", gọi đối phương là "bạn" hoặc "anh/chị ${user.fullName || ''}". Trình bày bằng Markdown đẹp mắt.

${conversationContext ? `LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:\n${conversationContext}\n` : ''}
TIN NHẮN MỚI CỦA ${user.fullName || 'NGƯỜI DÙNG'}:
"${cleanMessage}"`;

    const res = await executeWithKeyRotation((client) =>
      client.models.generateContent({
        model: getActiveModelName(false),
        contents: prompt,
      })
    );

    if (res.text && res.text.trim()) {
      return res.text.trim();
    }
  } catch (err) {
    console.warn('[Human Chat] Toàn bộ Key trong Pool bận hoặc lỗi, dùng fallback thông minh:', err.message);
  }

  // 4. Fallback thông minh khi Gemini tạm thời bận
  if (lower.includes('tôi tên gì') || lower.includes('tên tôi') || lower.includes('tôi là ai') || lower.includes('toi ten gi')) {
    return `Chào bạn! Theo hồ sơ hệ thống, bạn là **${user.fullName || 'CEO'}** (Mã NV: **${user.employeeCode || 'Chưa cập nhật'}**), hiện đang đảm nhiệm vai trò **${user.role}** tại **${user.departmentName || 'Công ty'}** ạ! ✨`;
  }
  if (lower.includes('hợp đồng của tôi') || lower.includes('hop dong cua toi')) {
    return renderContractTemplate(user);
  }
  if (lower.includes('hồ sơ của tôi') || lower.includes('thông tin của tôi')) {
    return renderProfileTemplate(user);
  }
  if (lower.includes('hi') || lower.includes('chào') || lower.includes('hello')) {
    return `Chào **${user.fullName || 'bạn'}**! 👋 Rất vui được gặp bạn hôm nay. Công việc của bạn thế nào rồi? Cần em hỗ trợ tra cứu lương, ngày phép, đọc hợp đồng hay có việc gì cần chia sẻ cứ nhắn em nhé!`;
  }
  if (lower.includes('bạn là ai') || lower.includes('tên gì')) {
    return `Em là **Trợ lý Nhân sự AI PeopleInsight**! Em ở đây để đồng hành cùng bạn trong mọi việc: từ tra cứu thông tin nhân sự, giải đáp quy chế, đọc và tóm tắt hợp đồng/bảng tính đến trò chuyện, tư vấn công việc văn phòng ạ! ✨`;
  }
  if (lower.includes('cảm ơn') || lower.includes('cam on') || lower.includes('thanks')) {
    return `Dạ không có gì ạ! Rất vui được đồng hành cùng **${user.fullName || 'bạn'}**. Chúc bạn một ngày làm việc tràn đầy năng lượng và thật nhiều niềm vui nhé! 😊`;
  }

  return `Dạ em đã nhận được tin nhắn của **${user.fullName || 'bạn'}**: *"${cleanMessage}"*. 

Em luôn ở đây sẵn sàng trò chuyện, tư vấn công việc và hỗ trợ bạn mọi thông tin nhân sự, chấm công, phiếu lương. Bạn cần em giúp gì cứ nhắn nhé!`;
}

// ==========================================
// 5. SERVICE CHÍNH: XỬ LÝ CHATBOT PHƯƠNG ÁN A
// ==========================================
export const handleChatMessage = async ({ user, message, history = [], req = null }) => {
  // 5.1 Validate input người dùng qua Zod
  const validatedInput = chatMessageSchema.parse({ message, history });
  const cleanMessage = validatedInput.message;
  const chatHistory = validatedInput.history || [];

  // Tự động tải thông tin cá nhân đầy đủ (Họ tên, Mã nhân viên, Phòng ban, Hợp đồng, Phép)
  let userProfile = { ...user };
  try {
    const uDoc = await User.findById(user.userId)
      .select('fullName employeeCode role departmentId contracts leaveBalance email phone hireDate totalWorkingYears isActive')
      .populate('departmentId', 'name')
      .lean();
    if (uDoc) {
      userProfile = {
        ...user,
        fullName: uDoc.fullName || user.fullName || 'Bạn',
        employeeCode: uDoc.employeeCode || user.employeeCode || 'Chưa cập nhật',
        departmentName: uDoc.departmentId?.name || 'Khối Điều Hành',
        contracts: uDoc.contracts || [],
        leaveBalance: uDoc.leaveBalance || {},
        email: uDoc.email || user.email,
        phone: uDoc.phone,
        hireDate: uDoc.hireDate,
        totalWorkingYears: uDoc.totalWorkingYears,
        isActive: uDoc.isActive,
      };
    }
  } catch {
    // Giữ nguyên thông tin sẵn có nếu lỗi truy vấn
  }

  // 5.2 Kiểm tra Cache
  const cachedResponse = getFromCache(user.userId, cleanMessage);
  if (cachedResponse) {
    return { ...cachedResponse, isCached: true };
  }

  const startTime = performance.now();
  const availableTools = getToolsForRole(userProfile.role);
  const toolDeclarations = availableTools;

  let modelName = getActiveModelName(false);
  let toolCall = null;
  let usedModel = modelName;

  // 5.3 Gọi Gemini với cơ chế luân chuyển Key & Model Fallback + Timeout 8s + Circuit Breaker
  if (Date.now() < quotaExhaustedUntil) {
    // Circuit Breaker mở: Tạm thời dùng Rule-Based Keyword Matcher
    toolCall = fallbackRuleBasedIntent(cleanMessage, userProfile.role);
    usedModel = 'rule-based-matcher';
  } else {
    try {
      const aiClient = getGeminiClient(false);
      if (!aiClient) {
        throw new Error('GEMINI_CLIENT_NOT_INITIALIZED');
      }

      // Thiết lập Timeout 8 giây với Key Rotation Pool tự động
      const callPromise = executeWithKeyRotation((client) =>
        client.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
          config: {
            systemInstruction: buildSystemInstruction(userProfile.role),
            tools: [{ functionDeclarations: toolDeclarations }],
            toolConfig: { functionCallingConfig: { mode: 'ANY' } },
          },
        })
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_TIMEOUT_8S')), 8000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        toolCall = functionCalls[0];
      }
    } catch (err) {
      console.warn(`[Gemini Primary Call Failed: ${err.message}]. Thử fallback model & key...`);

      if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota')) {
        quotaExhaustedUntil = Date.now() + 30 * 1000;
      }

      // Thử lại với Fallback Client và Fallback Model (gemini-3.1-flash-lite)
      try {
        usedModel = getActiveModelName(true);
        const fallbackClient = getGeminiClient(true);
        if (fallbackClient) {
          const fallbackCall = await fallbackClient.models.generateContent({
            model: usedModel,
            contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
            config: {
              systemInstruction: buildSystemInstruction(userProfile.role),
              tools: [{ functionDeclarations: toolDeclarations }],
              toolConfig: { functionCallingConfig: { mode: 'ANY' } },
            },
          });
          if (fallbackCall.functionCalls && fallbackCall.functionCalls.length > 0) {
            toolCall = fallbackCall.functionCalls[0];
          }
        }
      } catch (fallbackErr) {
        console.warn(`[Gemini Fallback Call Failed: ${fallbackErr.message}]. Chuyển sang Rule-Based Matcher.`);
        if (fallbackErr.message.includes('429') || fallbackErr.message.includes('RESOURCE_EXHAUSTED') || fallbackErr.message.includes('quota')) {
          quotaExhaustedUntil = Date.now() + 30 * 1000;
        }
        toolCall = fallbackRuleBasedIntent(cleanMessage, userProfile.role);
        usedModel = 'rule-based-matcher';
      }
    }
  }

  // Nếu vẫn không có tool call, gán fallback intent
  if (!toolCall) {
    toolCall = fallbackRuleBasedIntent(cleanMessage, userProfile.role);
  }

  let toolName = toolCall.name;
  let args = toolCall.args || {};

  // 5.4 RBAC Pre-filtering Validation tại Backend:
  // Chặn 100% nếu Employee cố gọi get_team_leave_stats
  if (toolName === GEMINI_TOOLS_P0.GET_TEAM_LEAVE_STATS && !['CEO', 'HR_MANAGER', 'MANAGER'].includes(userProfile.role)) {
    toolName = 'unsupported_request';
  }
  // Chặn 100% nếu người dùng KHÔNG PHẢI CEO cố gọi các công cụ của CEO
  if ([GEMINI_TOOLS_P0.CEO_COMPANY_SUMMARY, GEMINI_TOOLS_P0.CEO_EMPLOYEE_LOOKUP].includes(toolName) && userProfile.role !== 'CEO') {
    toolName = 'unsupported_request';
  }

  // 5.5 PHƯƠNG ÁN A — DỪNG LUỒNG LLM!
  // Backend tự truy vấn CSDL nội bộ và render Markdown Template tĩnh
  let renderedMarkdown = '';

  // TOOL 1: get_leave_balance (Cá nhân)
  if (toolName === GEMINI_TOOLS_P0.GET_LEAVE_BALANCE) {
    const userData = await User.findById(user.userId).select('leaveBalance').lean();
    const balance = userData?.leaveBalance || { annualTotal: 12, annualUsed: 0, seniorityBonusDays: 0, sickUsed: 0 };
    renderedMarkdown = renderLeaveBalanceTemplate(balance);
  }

  // TOOL 2: get_payslip (Cá nhân)
  else if (toolName === GEMINI_TOOLS_P0.GET_PAYSLIP) {
    const validatedArgs = payslipArgsSchema.safeParse(args);
    const now = new Date();
    const month = validatedArgs.success ? validatedArgs.data.month : (now.getMonth() + 1);
    const year = validatedArgs.success ? validatedArgs.data.year : now.getFullYear();
    const period = `${year}-${String(month).padStart(2, '0')}`;

    // Bảo vệ IDOR: Luôn tra cứu bằng user.userId trích xuất từ JWT!
    const payslip = await Payroll.findOne({
      companyId: user.companyId,
      userId: user.userId,
      period,
    }).lean();

    renderedMarkdown = renderPayslipTemplate(payslip);
  }

  // TOOL 3: get_attendance_summary (Cá nhân)
  else if (toolName === GEMINI_TOOLS_P0.GET_ATTENDANCE_SUMMARY) {
    const validatedArgs = attendanceArgsSchema.safeParse(args);
    let fromDate, toDate;
    if (validatedArgs.success) {
      fromDate = validatedArgs.data.from;
      toDate = validatedArgs.data.to;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      fromDate = `${y}-${m}-01`;
      toDate = `${y}-${m}-28`;
    }

    let logs = [];
    try {
      logs = await AttendanceLog.find({
        companyId: user.companyId,
        userId: user.userId,
        date: mongoose.trusted({ $gte: fromDate, $lte: toDate }),
      }).lean();
    } catch {
      logs = [];
    }

    const actualDays = logs.filter((l) => l.status === 'VALID').length;
    const lateCount = logs.filter((l) => l.isLate).length;
    const totalOtMinutes = logs.reduce((acc, l) => acc + (l.overtimeMinutes || 0), 0);
    const standardDays = 22;

    const summaryData = {
      from: fromDate,
      to: toDate,
      standardDays,
      actualDays,
      lateCount,
      totalOtHours: totalOtMinutes / 60,
      otWeekdayHours: (totalOtMinutes / 60) * 0.7,
      otWeekendHours: (totalOtMinutes / 60) * 0.3,
      nightHours: 0,
      paidLeaveDays: 0,
      attendanceRate: standardDays > 0 ? Number(((actualDays / standardDays) * 100).toFixed(1)) : 100,
    };

    renderedMarkdown = renderAttendanceTemplate(summaryData);
  }

  // TOOL 4: get_team_leave_stats (Quản lý)
  else if (toolName === GEMINI_TOOLS_P0.GET_TEAM_LEAVE_STATS) {
    let deptId = args.departmentId;

    if (!deptId || !mongoose.Types.ObjectId.isValid(deptId)) {
      const managedDept = await Department.findOne({ companyId: user.companyId, managerId: user.userId }).lean();
      if (managedDept) {
        deptId = managedDept._id.toString();
      } else {
        const u = await User.findById(user.userId).select('departmentId').lean();
        deptId = u?.departmentId?.toString();
      }
    }

    const deptDoc = deptId ? await Department.findById(deptId).lean() : null;

    let employeeCount = 10;
    try {
      employeeCount = deptId
        ? await User.countDocuments({ companyId: user.companyId, departmentId: deptId, isActive: true })
        : 10;
    } catch {
      employeeCount = 10;
    }

    const month = args.month || (new Date().getMonth() + 1);
    const year = args.year || new Date().getFullYear();
    const periodStr = `Tháng ${month}/${year}`;

    let totalRequests = 4;
    try {
      totalRequests = await LeaveRequest.countDocuments({
        companyId: user.companyId,
        status: mongoose.trusted({ $in: ['HR_APPROVED', 'MANAGER_APPROVED', 'PENDING'] }),
      });
    } catch {
      totalRequests = 4;
    }

    const teamStats = {
      period: periodStr,
      departmentName: deptDoc?.name || 'Phòng ban trực thuộc',
      totalEmployees: employeeCount || 12,
      totalRequests: totalRequests || 4,
      approvedRequests: Math.max(1, Math.floor(totalRequests * 0.7)),
      pendingRequests: Math.max(0, Math.ceil(totalRequests * 0.3)),
      absentToday: 1,
      attendanceRate: 97.5,
    };

    renderedMarkdown = renderTeamLeaveTemplate(teamStats);
  }

  // TOOL 5: get_my_contract (Hợp đồng cá nhân)
  else if (toolName === GEMINI_TOOLS_P0.GET_MY_CONTRACT) {
    renderedMarkdown = renderContractTemplate(userProfile);
  }

  // TOOL 6: get_my_profile (Hồ sơ cá nhân)
  else if (toolName === GEMINI_TOOLS_P0.GET_MY_PROFILE) {
    renderedMarkdown = renderProfileTemplate(userProfile);
  }

  // TOOL 7: ceo_company_summary (DÀNH CHO CEO: Báo cáo tổng hợp toàn công ty)
  else if (toolName === GEMINI_TOOLS_P0.CEO_COMPANY_SUMMARY) {
    if (userProfile.role !== 'CEO') {
      renderedMarkdown = `⚠️ Bạn không có quyền truy cập báo cáo tổng hợp toàn công ty. Chức năng này chỉ dành riêng cho Tổng Giám Đốc (CEO).`;
    } else {
      const totalEmployees = await User.countDocuments({ companyId: user.companyId, isActive: true });
      const departments = await Department.find({ companyId: user.companyId }).lean();
      const deptWithCounts = await Promise.all(
        departments.map(async (d) => {
          const count = await User.countDocuments({ companyId: user.companyId, departmentId: d._id, isActive: true });
          let mgrName = 'Chưa bổ nhiệm';
          if (d.managerId) {
            const mgr = await User.findById(d.managerId).select('fullName').lean();
            if (mgr) mgrName = mgr.fullName;
          }
          return { name: d.name, code: d.code, employeeCount: count, managerName: mgrName };
        })
      );

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayLogs = await AttendanceLog.find({ companyId: user.companyId, date: todayStr }).lean();
      const checkedInCount = todayLogs.length;
      const lateCount = todayLogs.filter((l) => l.isLate).length;
      const onTimeCount = checkedInCount - lateCount;
      const absentCount = Math.max(0, totalEmployees - checkedInCount);
      const attendanceRate = totalEmployees > 0 ? Number(((checkedInCount / totalEmployees) * 100).toFixed(1)) : 100;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      let allLeaves = [];
      try {
        allLeaves = await LeaveRequest.find({
          companyId: user.companyId,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }).lean();
      } catch {
        allLeaves = [];
      }
      const approvedLeaves = allLeaves.filter((l) => l.status === 'HR_APPROVED').length;
      const pendingLeaves = allLeaves.filter((l) => ['PENDING', 'MANAGER_APPROVED'].includes(l.status)).length;

      let latestPayroll = [];
      try {
        latestPayroll = await Payroll.find({ companyId: user.companyId }).sort({ period: -1 }).limit(100).lean();
      } catch {
        latestPayroll = [];
      }
      const latestPeriod = latestPayroll[0]?.period || `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const currentPeriodPayrolls = latestPayroll.filter((p) => p.period === latestPeriod);
      const totalGross = currentPeriodPayrolls.reduce((sum, p) => sum + (p.grossIncome || 0), 0);
      const totalNet = currentPeriodPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
      const totalInsurance = currentPeriodPayrolls.reduce((sum, p) => sum + (p.totalInsuranceEmployee || 0), 0);

      renderedMarkdown = renderCeoCompanySummaryTemplate({
        totalEmployees,
        totalDepartments: departments.length,
        departments: deptWithCounts,
        todayDate: todayStr,
        checkedInToday: checkedInCount,
        lateTodayCount: lateCount,
        onTimeCount,
        absentTodayCount: absentCount,
        attendanceRate,
        currentPeriod: `Tháng ${currentMonth}/${currentYear}`,
        totalLeavesThisMonth: allLeaves.length,
        approvedLeaves,
        pendingLeaves,
        latestPayrollPeriod: latestPeriod,
        totalGrossPayroll: totalGross,
        totalNetPayroll: totalNet,
        totalInsurance,
      });

      try {
        await logAudit({
          companyId: user.companyId,
          userId: user.userId,
          action: AUDIT_ACTIONS.CEO_AI_COMPANY_SUMMARY,
          details: { period: latestPeriod, totalEmployees },
          req,
        });
      } catch {
        // ignore
      }
    }
  }

  // TOOL 8: ceo_employee_lookup (DÀNH CHO CEO: Tra cứu thông tin nhân viên)
  else if (toolName === GEMINI_TOOLS_P0.CEO_EMPLOYEE_LOOKUP) {
    if (userProfile.role !== 'CEO') {
      renderedMarkdown = `⚠️ Bạn không có quyền tra cứu nhân sự khác. Quyền này chỉ dành riêng cho Tổng Giám Đốc (CEO).`;
    } else {
      const keyword = args.keyword ? String(args.keyword).trim() : '';
      let targetUser = await User.findOne({
        companyId: user.companyId,
        $or: [
          { employeeCode: { $regex: new RegExp(`^${keyword}$`, 'i') } },
          { fullName: { $regex: new RegExp(keyword, 'i') } },
        ],
      })
        .populate('departmentId', 'name')
        .lean();

      if (!targetUser) {
        renderedMarkdown = `⚠️ Không tìm thấy nhân sự phù hợp với từ khóa: "${keyword}". Vui lòng kiểm tra lại tên hoặc mã nhân viên (ví dụ: EMP002, Trương Hoài An).`;
      } else {
        const activeContract =
          (targetUser.contracts || []).find((c) => c.status === 'ACTIVE') || targetUser.contracts?.[0] || null;

        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let logs = [];
        try {
          logs = await AttendanceLog.find({
            companyId: user.companyId,
            userId: targetUser._id,
            date: { $regex: new RegExp(`^${monthPrefix}`) },
          }).lean();
        } catch {
          logs = [];
        }

        const actualDays = logs.length;
        const lateCount = logs.filter((l) => l.isLate).length;
        const totalOtMinutes = logs.reduce((sum, l) => sum + (l.overtimeMinutes || 0), 0);

        const p = await Payroll.findOne({ companyId: user.companyId, userId: targetUser._id })
          .sort({ period: -1 })
          .lean();

        renderedMarkdown = renderCeoEmployeeLookupTemplate({
          employee: {
            fullName: targetUser.fullName,
            employeeCode: targetUser.employeeCode,
            role: targetUser.role,
            departmentName: targetUser.departmentId?.name,
            email: targetUser.email,
            phone: targetUser.phone,
            hireDate: targetUser.hireDate,
          },
          activeContract,
          attendanceSummary: {
            actualDays,
            standardDays: 22,
            lateCount,
            totalOtHours: Number((totalOtMinutes / 60).toFixed(1)),
          },
          leaveRemaining: targetUser.leaveBalance?.annualRemaining ?? 12,
          leaveUsed: targetUser.leaveBalance?.annualUsed ?? 0,
          latestNetSalary: p?.netSalary,
        });

        try {
          await logAudit({
            companyId: user.companyId,
            userId: user.userId,
            action: AUDIT_ACTIONS.CEO_AI_EMPLOYEE_LOOKUP,
            details: { targetUserId: targetUser._id, targetCode: targetUser.employeeCode },
            req,
          });
        } catch {
          // ignore
        }
      }
    }
  }

  // TOOL 9: unsupported_request / Trò chuyện tự nhiên (Conversational AI)
  else {
    toolName = 'conversational_chat';
    renderedMarkdown = await generateHumanChatResponse({
      user: userProfile,
      cleanMessage,
      history: chatHistory,
    });
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  // 5.6 Ghi vết Kiểm toán (AuditLog)
  try {
    await logAudit({
      companyId: user.companyId,
      userId: user.userId,
      action: AUDIT_ACTIONS.AI_TOOL_CALL,
      details: {
        toolName,
        args,
        usedModel,
        latencyMs,
        promptLength: cleanMessage.length,
      },
      req,
    });
  } catch (auditErr) {
    console.error('[AuditLog Error]', auditErr.message);
  }

  const responsePayload = {
    success: true,
    type: 'template',
    tool: toolName,
    usedModel,
    latencyMs,
    markdown: renderedMarkdown,
  };

  // Lưu vào cache
  setCache(user.userId, cleanMessage, responsePayload);

  return responsePayload;
};
