# THAM CHIẾU: CHATBOT HR AI & PHƯƠNG ÁN A (TEMPLATE RENDERING)

> **Mục tiêu:** Cung cấp trợ lý hội thoại thông minh hỗ trợ nhân viên tra cứu chế độ, ngày phép, bảng lương cá nhân; đồng thời bảo vệ 100% dữ liệu nhạy cảm bằng kiến trúc **Phương án A (Template Rendering)** kết hợp **Ép Function Calling (Mode ANY)**.

---

## 1. CẤU HÌNH MODEL, SDK & NGỮ CẢNH THỜI GIAN

- **SDK chính thức:** `@google/genai`
- **Model ID:**
  * **Chính:** `process.env.GEMINI_MODEL` (Mặc định: `gemini-3.5-flash` hoặc `gemini-3-flash-preview`).
  * **Dự phòng (Fallback):** `process.env.GEMINI_FALLBACK_MODEL` (Mặc định: `gemini-3.1-flash-lite`).
- **Ngữ cảnh thời gian thực (BẮT BUỘC):**
  * LLM không tự biết thời gian thực. Bắt buộc chèn ngày giờ hiện tại theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`) vào `systemInstruction` để model diễn giải chính xác các cụm từ *"tháng này"*, *"tháng trước"*, *"năm nay"*:
    ```javascript
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const dynamicSystemInstruction = `Bạn là Trợ lý Nhân sự PeopleInsight AI. 
Hôm nay là ngày ${vnDateStr} (Múi giờ Việt Nam).
- Tháng hiện tại: Tháng ${currentMonth}/${currentYear}.
- Tháng trước: Tháng ${prevMonth}/${prevYear}.
Nhiệm vụ của bạn là chọn đúng MỘT function call phù hợp nhất với yêu cầu. Với mọi yêu cầu ngoài phạm vi nghiệp vụ được cấp, bắt buộc gọi "unsupported_request".`;
    ```
- **Xử lý ngữ cảnh đa lượt (Multi-turn Context):**
  * Gửi kèm tối đa 3-5 tin nhắn `user` gần nhất để hiểu các câu hỏi nối tiếp như *"Còn tháng trước thì sao?"*, nhưng **tuyệt đối KHÔNG gửi dữ liệu kết quả tool/bảng lương ngược lại cho LLM** (nguyên tắc bất biến của Phương án A).

---

## 2. KHAI BÁO CÁC TOOLS P0 & LỌC THEO PHÂN QUYỀN (RBAC)

> [!CAUTION]
> **QUY TẮC AN TOÀN TUYỆT ĐỐI:** 
> 1. Không bao giờ khai báo tham số `userId` trong schema gửi cho Gemini. `userId` và `role` phải được trích xuất trực tiếp từ JWT xác thực của người dùng đang đăng nhập (`req.user`).
> 2. **Lọc danh sách Tools theo Role trước khi gửi cho Model:** Nhân viên thường (`EMPLOYEE`) tuyệt đối không nhìn thấy tool quản lý phòng ban `get_team_leave_stats` trong khai báo gửi sang Gemini. Điều này giảm thiểu tối đa nguy cơ model gọi nhầm tool vượt quyền.

```javascript
import { Type, FunctionCallingMode } from '@google/genai';

// 1. Tool không tham số: Không khai báo parameters rỗng {} để tránh lỗi 400 Bad Request
export const TOOL_LEAVE_BALANCE = {
  name: 'get_leave_balance',
  description: 'Tra cứu số dư ngày nghỉ phép năm và phép ốm của nhân viên đang đăng nhập.'
  // Không có khóa parameters
};

// 2. Tool tra cứu phiếu lương
export const TOOL_PAYSLIP = {
  name: 'get_payslip',
  description: 'Tra cứu chi tiết phiếu lương cá nhân của nhân viên đang đăng nhập theo tháng và năm cụ thể.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      month: { type: Type.INTEGER, description: 'Tháng cần xem lương (1 đến 12).' },
      year: { type: Type.INTEGER, description: 'Năm cần xem lương (ví dụ: 2026).' }
    },
    required: ['month', 'year']
  }
};

// 3. Tool tổng hợp công
export const TOOL_ATTENDANCE_SUMMARY = {
  name: 'get_attendance_summary',
  description: 'Tra cứu tổng hợp tình hình chấm công (ngày công, đi muộn, làm thêm giờ) trong khoảng thời gian.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      from: { type: Type.STRING, description: 'Ngày bắt đầu định dạng YYYY-MM-DD.' },
      to: { type: Type.STRING, description: 'Ngày kết thúc định dạng YYYY-MM-DD.' }
    },
    required: ['from', 'to']
  }
};

// 4. Tool thống kê đội ngũ (Chỉ cho Manager / HR / CEO)
export const TOOL_TEAM_LEAVE_STATS = {
  name: 'get_team_leave_stats',
  description: 'Thống kê tình hình nghỉ phép của phòng ban hoặc đội ngũ trực thuộc quản lý.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      departmentId: { type: Type.STRING, description: 'Mã ObjectId của phòng ban cần thống kê.' },
      month: { type: Type.INTEGER, description: 'Tháng thống kê (1-12).' },
      year: { type: Type.INTEGER, description: 'Năm thống kê.' }
    },
    required: ['departmentId', 'month', 'year']
  }
};

// 5. Tool chặn yêu cầu ngoài phạm vi
export const TOOL_UNSUPPORTED = {
  name: 'unsupported_request',
  description: 'Bắt buộc gọi tool này khi câu hỏi của người dùng nằm ngoài các nghiệp vụ trên, hoặc hỏi về người khác, chính trị, viết văn tự do.'
};

/**
 * Lọc danh sách tools hợp lệ dựa trên Role của người dùng
 */
export function getToolsForRole(role) {
  const baseTools = [TOOL_LEAVE_BALANCE, TOOL_PAYSLIP, TOOL_ATTENDANCE_SUMMARY, TOOL_UNSUPPORTED];
  if (['CEO', 'HR_MANAGER', 'MANAGER'].includes(role)) {
    return [TOOL_LEAVE_BALANCE, TOOL_PAYSLIP, TOOL_ATTENDANCE_SUMMARY, TOOL_TEAM_LEAVE_STATS, TOOL_UNSUPPORTED];
  }
  return baseTools;
}
```

---

## 3. THẨM ĐỊNH THAM SỐ NGHIÊM NGẶT PHÍA BACKEND (ZOD SCHEMAS)

Mọi tham số do Gemini trả về bắt buộc phải vượt qua bước thẩm định dữ liệu bằng Zod trước khi chạm vào CSDL:

```javascript
import { z } from 'zod';
import mongoose from 'mongoose';

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

// 1. Schema tra cứu phiếu lương (Không xem tương lai)
export const PayslipQuerySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(currentYear)
}).refine(data => {
  if (data.year === currentYear && data.month > currentMonth) return false;
  return true;
}, { message: 'Không thể tra cứu phiếu lương của kỳ trong tương lai.' });

// 2. Schema tra cứu chấm công (Khoảng cách tối đa 90 ngày, from <= to)
export const AttendanceQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng from phải là YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng to phải là YYYY-MM-DD')
}).refine(data => {
  const startDate = new Date(data.from);
  const endDate = new Date(data.to);
  if (startDate > endDate) return false;
  const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  return diffDays <= 90;
}, { message: 'Khoảng thời gian tra cứu không hợp lệ (tối đa 90 ngày và from <= to).' });

// 3. Schema thống kê phòng ban
export const TeamLeaveStatsQuerySchema = z.object({
  departmentId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Mã phòng ban departmentId không đúng định dạng ObjectId.'
  }),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(currentYear)
});
```

---

## 4. QUY TRÌNH CONTROLLER HOÀN CHỈNH: RATE LIMIT, AUDIT LOG, TIMEOUT & FALLBACK

```javascript
// backend/src/controllers/chatController.js
import { GoogleGenAI, FunctionCallingMode } from '@google/genai';
import { getToolsForRole } from '../ai/tools/declarations.js';
import { AuditLog } from '../models/AuditLog.js';
import { Payroll } from '../models/Payroll.js';

export async function chatHandler(req, res) {
  const startTime = Date.now();
  const { message } = req.body;
  const { id: userId, role, companyId } = req.user;

  // 1. Kiểm tra độ dài đầu vào
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Nội dung tin nhắn vượt quá giới hạn 500 ký tự.' });
  }

  // 2. Lấy danh sách tools tương ứng với vai trò
  const availableTools = getToolsForRole(role);
  const allowedNames = availableTools.map(t => t.name);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const chatConfig = {
    systemInstruction: `Bạn là Trợ lý Nhân sự PeopleInsight AI. 
Hôm nay là ngày ${now.toLocaleDateString('vi-VN')} (Tháng ${currentMonth}/${currentYear}).
Hãy chọn đúng một tool phù hợp để thực thi. Nếu câu hỏi không nằm trong quyền hạn, hãy gọi unsupported_request.`,
    tools: [{ functionDeclarations: availableTools }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } }
  };

  let response;
  let usedModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  // 3. Gọi Gemini với Timeout 8 giây & Fallback phân loại lỗi
  try {
    const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_PRIMARY });
    response = await Promise.race([
      aiClient.models.generateContent({
        model: usedModel,
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: chatConfig
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_8S')), 8000))
    ]);
  } catch (primaryErr) {
    console.warn(`Lỗi model chính (${usedModel}):`, primaryErr.message);

    // Không fallback nếu là lỗi 400 (do cấu hình schema sai)
    if (primaryErr.status === 400) {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ tới mô hình AI.' });
    }

    // Chỉ fallback với lỗi tạm thời (Quota 429, 5xx, Timeout)
    try {
      usedModel = process.env.GEMINI_MODEL_FALLBACK || 'gemini-3.1-flash-lite';
      const fallbackClient = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY_FALLBACK || process.env.GEMINI_API_KEY_PRIMARY 
      });
      response = await Promise.race([
        fallbackClient.models.generateContent({
          model: usedModel,
          contents: [{ role: 'user', parts: [{ text: message }] }],
          config: chatConfig
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_8S')), 8000))
      ]);
    } catch (fallbackErr) {
      console.error('Cả 2 model Gemini đều thất bại:', fallbackErr.message);
      return res.json({ 
        text: 'Hệ thống trợ lý AI hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau giây lát.' 
      });
    }
  }

  const call = response.functionCalls?.[0];
  const latencyMs = Date.now() - startTime;

  // 4. Kiểm tra Tool Allowlist
  if (!call || !allowedNames.includes(call.name)) {
    return res.json({ text: 'Yêu cầu của bạn hiện chưa được hỗ trợ.' });
  }

  // 5. Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId,
    action: 'AI_CHATBOT_CALL',
    details: {
      toolName: call.name,
      args: call.args,
      latencyMs,
      usedModel
    }
  }).catch(e => console.error('Lỗi ghi AuditLog:', e.message));

  // 6. Xử lý yêu cầu ngoài phạm vi
  if (call.name === 'unsupported_request') {
    return res.json({
      text: 'Yêu cầu của bạn nằm ngoài phạm vi hỗ trợ của Trợ lý PeopleInsight AI. Tôi chỉ hỗ trợ tra cứu ngày phép, phiếu lương, bảng công và thống kê phòng ban thuộc quyền.'
    });
  }

  // 7. Thực thi Tool & Render Markdown Template chuẩn mực
  try {
    const markdown = await executeToolAndRenderTemplate(call.name, call.args, { userId, role, companyId });
    return res.json({ text: markdown });
  } catch (bizErr) {
    return res.json({ text: `⚠️ ${bizErr.message}` });
  }
}
```

---

## 5. TEMPLATE MARKDOWN TĨNH CHUẨN XÁC VỀ MẶT PHÁP LÝ & TÀI CHÍNH

### 5.1 Template Phiếu Lương (`get_payslip`)
> [!IMPORTANT]
> **Quy chuẩn hiển thị:** Tách làm 2 khối rõ ràng.
> - **Khối 1 (Thực nhận):** $\text{Net} = \text{Gross} - \text{BH (10.5\%)} - \text{Thuế TNCN} - \text{Các khoản trừ khác}$.
> - **Khối 2 (Thu nhập tính thuế):** Chỉ để thông tin, **tuyệt đối không trừ Giảm trừ gia cảnh vào tiền thực nhận**.
> - Tách rõ phần **OT chịu thuế** và **khoản chênh lệch OT miễn thuế** theo Điều 98 BLLĐ.
> - Định dạng tiền tệ dùng `Intl.NumberFormat('vi-VN')` với dấu phân cách hàng nghìn.

```markdown
### 💰 PHIẾU LƯƠNG KỲ THÁNG {{month}}/{{year}}
*Trạng thái: Đã chốt sổ và khóa kỳ nguyên tử*

#### 1. THU NHẬP & THỰC NHẬN (NET)
- **Lương thời gian (theo công thực tế):** {{formatVND(baseEarned)}}
- **Tiền làm thêm giờ (OT):** {{formatVND(otTotal)}}
  * *Trong đó phần OT tính thuế:* {{formatVND(otTaxable)}}
  * *Khoản chênh lệch OT được miễn thuế (Điều 98 BLLĐ):* {{formatVND(otTaxExempt)}}
- **Tiền ăn ca & Phụ cấp khác:** {{formatVND(allowancesTotal)}}
- **Tiền thưởng / Thu nhập bổ sung:** {{formatVND(bonus)}}
- **👉 TỔNG THU NHẬP (GROSS):** **{{formatVND(grossSalary)}}**
---
- **Bảo hiểm trích trừ vào lương (10.5% trên mức đóng {{formatVND(insurableSalary)}}):** -{{formatVND(insuranceTotal)}}
  * *BHXH (8.0%):* -{{formatVND(bhxh)}}
  * *BHYT (1.5%):* -{{formatVND(bhyt)}}
  * *BHTN (1.0%):* -{{formatVND(bhtn)}}
- **Thuế Thu nhập Cá nhân (TNCN) tạm tính:** -{{formatVND(pit)}}
---
- **💵 THỰC NHẬN (NET):** **{{formatVND(netSalary)}}**

---

#### 2. THÔNG TIN THAM CHIẾU TÍNH THUẾ TNCN (BIỂU 5 BẬC NĂM 2026)
*(Khoản này phục vụ công thức khấu trừ thuế, KHÔNG trừ trực tiếp vào thu nhập thực nhận)*
- **Thu nhập chịu thuế:** {{formatVND(taxableIncome)}}
- **Các khoản giảm trừ:**
  * Giảm trừ bản thân: {{formatVND(15500000)}}
  * Giảm trừ người phụ thuộc ({{dependents}} người × 6.200.000đ): {{formatVND(dependentsRelief)}}
  * Bảo hiểm bắt buộc được trừ: {{formatVND(insuranceTotal)}}
- **Thu nhập tính thuế (TNTT):** {{formatVND(assessableIncome)}}
- **Bậc thuế lũy tiến áp dụng:** {{taxBracketInfo}}
```

### 5.2 Template Số Dư Phép (`get_leave_balance`)
> [!IMPORTANT]
> Không hard-code thời hạn bảo lưu. Khớp chính xác các trường trong schema `users.leaveBalance`:
> - `annualTotal` = $12 + \lfloor \text{thâm niên} / 5 \rfloor$.
> - `annualUsed`, `annualRemaining`.
> - `sickUsed`, `sickRemaining`.

```markdown
### 📋 THÔNG TIN SỐ DƯ NGÀY NGHỈ PHÉP
- **Tổng số ngày phép năm được cấp (theo thâm niên Điều 114 BLLĐ):** {{annualTotal}} ngày
- **Phép năm đã sử dụng:** {{annualUsed}} ngày
- **👉 Số ngày phép năm còn lại:** **{{annualRemaining}} ngày**
---
- **Phép ốm đau đã hưởng bảo hiểm:** {{sickUsed}} ngày
- **Số ngày phép ốm còn lại trong định mức:** {{sickRemaining}} ngày
```

---

## 6. SANITIZE ĐẦU RA VÀ TÍNH MINH BẠCH KHI BÁO CÁO KHOA HỌC

1. **Client-side Markdown Sanitization:** 
   Tại Frontend, khi hiển thị Markdown trả về từ server, bắt buộc dùng `DOMPurify` để khử mã độc:
   ```javascript
   import DOMPurify from 'dompurify';
   import { marked } from 'marked';

   const cleanHtml = DOMPurify.sanitize(marked.parse(markdownText));
   ```
2. **Minh bạch về Dữ liệu trong Báo cáo ĐATN & Giao diện:**
   - Đặt dòng thông báo dưới khung chat: 
     > *"Câu hỏi của bạn được xử lý định tuyến qua AI. Toàn bộ số liệu lương và dữ liệu cá nhân được kết xuất trực tiếp trên máy chủ nội bộ, không bao giờ gửi ra bên ngoài."*
   - Trong Chương 4 báo cáo ĐATN: Đưa vào bài kiểm thử so sánh độ chính xác của **Gemini Function Calling vs. Phân loại từ khóa / Regex Baseline** trên bộ 130 câu hỏi thử nghiệm để làm nổi bật ưu thế xử lý tiếng Việt không dấu, câu hỏi viết tắt và câu hỏi lắt léo của LLM.
