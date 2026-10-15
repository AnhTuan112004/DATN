import { getGeminiClient, getActiveModelName } from './gemini.js';
import { P0_TOOLS_DECLARATIONS } from './tools/declarations.js';
import {
  renderLeaveBalanceTemplate,
  renderPayslipTemplate,
  renderAttendanceTemplate,
  renderTeamLeaveTemplate,
} from './templates/index.js';
import { User, Payroll, AttendanceLog, LeaveRequest } from '../models/index.js';
import { ROLES, GEMINI_TOOLS_P0, AUDIT_ACTIONS } from '../config/constants.js';
import { logAudit } from '../middleware/audit.js';

export const handleChatMessage = async ({ user, message, req = null }) => {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      type: 'text',
      content: 'Trợ lý AI hiện đang bảo trì cấu hình API key. Vui lòng thử lại sau.',
    };
  }

  const modelName = getActiveModelName();

  // Call Gemini to identify function call intent
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ],
    config: {
      systemInstruction: `Bạn là Trợ lý HR AI của PeopleInsight AI.
Nhiệm vụ của bạn là hỗ trợ nhân viên tra cứu số dư phép, phiếu lương, lịch sử chấm công và số liệu thống kê.
Nếu người dùng hỏi thông tin cần truy xuất dữ liệu, hãy gọi tool phù hợp trong danh sách tools được cung cấp.`,
      tools: [{ functionDeclarations: P0_TOOLS_DECLARATIONS }],
    },
  });

  const functionCalls = response.functionCalls;

  // PHƯƠNG ÁN A: Nếu Gemini yêu cầu Function Call, DỪNG LUỒNG LLM!
  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    const toolName = call.name;
    const args = call.args || {};

    // Ghi nhận Audit Log
    await logAudit({
      companyId: user.companyId,
      userId: user.userId,
      action: AUDIT_ACTIONS.AI_TOOL_CALL,
      details: { toolName, args },
      req,
    });

    // 1. Tool: get_leave_balance
    if (toolName === GEMINI_TOOLS_P0.GET_LEAVE_BALANCE) {
      const userData = await User.findById(user.userId).select('leaveBalance');
      const balance = userData?.leaveBalance || { annualTotal: 12, annualUsed: 0, seniorityBonusDays: 0, sickUsed: 0 };
      return {
        type: 'template',
        tool: toolName,
        markdown: renderLeaveBalanceTemplate(balance),
      };
    }

    // 2. Tool: get_payslip
    if (toolName === GEMINI_TOOLS_P0.GET_PAYSLIP) {
      const month = String(args.month || new Date().getMonth() + 1).padStart(2, '0');
      const year = args.year || new Date().getFullYear();
      const period = `${year}-${month}`;

      const payslip = await Payroll.findOne({
        companyId: user.companyId,
        userId: user.userId, // IDOR check: always user's own payroll!
        period,
      });

      return {
        type: 'template',
        tool: toolName,
        markdown: renderPayslipTemplate(payslip),
      };
    }

    // 3. Tool: get_attendance_summary
    if (toolName === GEMINI_TOOLS_P0.GET_ATTENDANCE_SUMMARY) {
      const month = String(args.month || new Date().getMonth() + 1).padStart(2, '0');
      const year = args.year || new Date().getFullYear();
      const periodPrefix = `${year}-${month}`;

      const logs = await AttendanceLog.find({
        companyId: user.companyId,
        userId: user.userId,
        date: { $regex: `^${periodPrefix}` },
      });

      const summaryData = {
        period: `${month}/${year}`,
        standardDays: 22,
        actualDays: logs.filter((l) => l.status === 'VALID').length,
        lateCount: logs.filter((l) => l.isLate).length,
        totalOtHours: logs.reduce((acc, l) => acc + (l.overtimeMinutes || 0), 0) / 60,
        paidLeaveDays: 0,
      };

      return {
        type: 'template',
        tool: toolName,
        markdown: renderAttendanceTemplate(summaryData),
      };
    }

    // 4. Tool: get_team_leave_stats (RBAC restricted)
    if (toolName === GEMINI_TOOLS_P0.GET_TEAM_LEAVE_STATS) {
      if (![ROLES.CEO, ROLES.HR_MANAGER, ROLES.MANAGER].includes(user.role)) {
        return {
          type: 'error',
          markdown: `⛔ Bạn không có quyền xem thống kê nghỉ phép của toàn đội ngũ/phòng ban.`,
        };
      }

      const teamStats = {
        period: `${args.month || 'Tháng hiện tại'}/${args.year || '2026'}`,
        totalEmployees: 50,
        totalRequests: 8,
        absentToday: 2,
        attendanceRate: 96,
      };

      return {
        type: 'template',
        tool: toolName,
        markdown: renderTeamLeaveTemplate(teamStats),
      };
    }
  }

  // Trường hợp không gọi tool (câu hỏi thông thường / trả lời chung)
  return {
    type: 'text',
    content: response.text || 'Tôi có thể giúp bạn tra cứu ngày phép, phiếu lương và tình hình chấm công.',
  };
};
