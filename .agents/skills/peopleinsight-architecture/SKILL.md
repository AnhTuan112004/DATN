---
name: peopleinsight-architecture
description: Dùng khi viết hoặc sửa code, schema Mongoose, API, test, nghiệp vụ tính lương 2026, FaceID Kiosk, Chatbot AI hoặc ML cho PeopleInsight AI (v6.1 FINAL FREEZE).
---

# PEOPLEINSIGHT AI — ARCHITECTURE SKILL (v6.1 FINAL FREEZE)

> **Mục đích:** Hướng dẫn trợ lý AI và kỹ sư phát triển sinh mã nguồn chuẩn xác, tuân thủ tuyệt đối kế hoạch đóng băng v6.1, kiến trúc an ninh fail-closed cả đọc/ghi và nghiệp vụ pháp lý Việt Nam 2026.  
> **Single Source of Truth:** `docs/PLAN.md` và `docs/SCHEDULE.md`. Nếu nội dung trong skill có điểm xung đột với PLAN.md, **PLAN.md luôn là chuẩn cao nhất**, AI phải cảnh báo và xin xác nhận từ người dùng chứ không tự ý thay đổi.

---

## 1. NGUYÊN TẮC BẤT BIẾN CỐT LÕI (KÈM LÝ DO KỸ THUẬT)

### 1.1 Cơ sở dữ liệu: Đúng 11 Collections (9 P0 + 2 P1)
- **9 Collections P0 (Bắt buộc):** `companies`, `users`, `faceTemplates`, `departments`, `attendanceLogs`, `leaveRequests`, `payrolls`, `notifications`, `auditLogs`.
- **2 Collections P1 (Chỉ sau Tuần 7 nếu kịp):** `policyChunks`, `jobPostings`.
- **TUYỆT ĐỐI CẤM:** Tạo thêm collection riêng lẻ như `Employee`, `Contract`, `SalaryConfig`, `LeaveBalance`, `RefreshToken`, `Shift`, `Location`, `Device`, `TaxPolicy`, `Holiday`, `ApprovalStep`.  
  *Lý do:* Thiết kế v6.1 đã chốt cứng 11 collections để tối ưu mô hình dữ liệu (nhúng cấu hình công ty vào `companies.settings`, nhúng hồ sơ và hợp đồng vào `users`). Việc tùy tiện tạo thêm collection mới sẽ phá vỡ schema chuẩn, làm hỏng các truy vấn nghiệp vụ, phá vỡ bộ test tự động và vi phạm cấu trúc đã cam kết trong hồ sơ ĐATN.

---

### 1.2 Cách ly Multi-tenant (Fail-Closed Cả Đọc & Ghi) & Bảo mật Toàn diện
- **Cơ chế Fail-Closed Đọc & Ghi:** Sử dụng Mongoose Plugin kết hợp `AsyncLocalStorage` (`tenantStore`).
  * **Đường Đọc:** Mọi truy vấn `find`, `findOne`, `aggregate` tự động gán `companyId`. Nếu thiếu context tenant trong store, hệ thống ném ngoại lệ `SECURITY_ERROR` ngay lập tức (fail-closed), tuyệt đối không để truy vấn chạy tự do.
  * **Đường Ghi:** Hook `pre('validate')` tự động ghi đè hoặc từ chối nếu `companyId` trong payload không khớp với ngữ cảnh tenant hiện tại. Trường `companyId` được đặt `immutable: true` trong schema, đồng thời hook intercept mọi câu lệnh update (`findOneAndUpdate`, `updateOne`, `updateMany`, `findByIdAndUpdate`) để chặn hành vi cố tình thay đổi `companyId` (ngăn chuyển dịch tài liệu sang tenant khác).
  * **Cấm driver thô:** Tuyệt đối không dùng `Model.collection`, `bulkWrite`, `insertMany` không qua middleware Mongoose.
  * *Lý do:* Cơ chế fail-open hoặc chỉ chặn đường đọc sẽ để hở đường ghi khi attacker truyền `companyId` lạ trong body request, dẫn đến ô nhiễm dữ liệu chéo giữa các doanh nghiệp.
- **Không áp dụng plugin lên collection `companies`:** Vì `companies` lưu trữ danh sách tenant toàn hệ thống.
- **Lưu ý Đặc biệt về `$lookup` & `$vectorSearch` (RAG P1):**
  * **Với `$lookup`:** Plugin không tự động can thiệp vào pipeline con của stage `$lookup`, do đó mọi lệnh `$lookup` bắt buộc lập trình viên phải tự viết `$match: { companyId: new mongoose.Types.ObjectId(tenantId) }`.
  * **Với `$vectorSearch` (Atlas Vector Search):** Trong MongoDB Atlas, `$vectorSearch` bắt buộc phải là stage đầu tiên của aggregation pipeline (`pipeline[0]`). Việc plugin dùng `unshift({ $match })` sẽ làm pipeline bị lỗi cú pháp MongoDB. Vì vậy, với collection `policyChunks`, việc lọc tenant bắt buộc phải cấu hình bên trong tham số `filter: { companyId: { $eq: tenantId } }` của `$vectorSearch`.
- **Xử lý Luồng Không có JWT (Bắt buộc bọc trong `tenantStore.run`):**
  1. *Đăng nhập / Refresh Token:* Tra cứu người dùng qua email với option `{ skipTenant: true }` (bắt buộc ghi audit log nội bộ), sau khi xác thực thành công thì bọc toàn bộ phiên làm việc kế tiếp trong `tenantStore.run({ companyId: user.companyId }, fn)`.
  2. *Kiosk Check-in:* Tra cứu công ty qua mã băm SHA-256 của Kiosk Token từ TLS Header (`x-kiosk-token`), sau đó bọc phiên check-in trong `tenantStore.run({ companyId }, fn)`.
  3. *Cron Jobs:* Lặp qua từng công ty đang hoạt động, mỗi công ty xử lý độc lập trong một ngữ cảnh `tenantStore.run({ companyId: company._id }, fn)` riêng biệt.
  4. *Socket.io:* Bọc event handler trong `tenantStore.run({ companyId }, fn)` và phân loại socket client vào các room có tiền tố `tenant_${companyId}` để cách ly kênh phát tín hiệu real-time.
- **Chống Mass Assignment & NoSQL Injection:**
  * Mọi endpoint nhận dữ liệu phải validate qua schema Zod `.strict()` với danh sách trường được phép rõ ràng.
  * Cập nhật `role` và `salaryConfig` chỉ được thực hiện qua các endpoint quản trị chuyên biệt của HR (`PATCH /api/users/:id/role`, `PATCH /api/users/:id/salary`).
  * Bật `mongoose.set('sanitizeFilter', true)` ở tầng khởi tạo server để triệt tiêu NoSQL Injection (chặn các payload dạng `{"$gt": ""}`).
- **Phân quyền Tập trung (canAccess) & IDOR Protection:**
  * Toàn bộ controller dùng chung hàm phân quyền `canAccess(user, resource, action)` với ma trận quyền (RBAC Matrix) rõ ràng.
  * Quản lý (`MANAGER`) tuyệt đối không được xem lương hoặc cấu hình lương của nhân viên. Ghi `auditLogs` mỗi khi HR/CEO truy cập bảng lương của người khác.
- **Bảo vệ Dữ liệu Nhạy cảm (Projection):**
  * `passwordHash`, `refreshTokens[]` và `salaryConfig` phải đặt `select: false` trong schema `User`.
  * API danh sách nhân viên (`GET /api/users`) tuyệt đối không trả về `salaryConfig`.
  * Mọi câu lệnh `$lookup` vào `users` bắt buộc dùng `$project` loại bỏ các trường nhạy cảm trên.
- **Thao tác Nguyên tử & Idempotency:**
  * **Duyệt phép:** Phải là một MongoDB Transaction kết hợp cập nhật trạng thái đơn (điều kiện `status: 'MANAGER_APPROVED'` $\rightarrow$ `HR_APPROVED`) và trừ số dư phép `leaveBalance.annualRemaining` trong cùng một giao dịch, chống trừ phép 2 lần khi HR thao tác đồng thời.
  * **Refresh Token Rotation an toàn:** Thêm Grace Window (10–30s) chống logout oan do 2 tab trình duyệt refresh đồng thời, giới hạn tối đa 5 phiên, dọn dẹp token hết hạn bằng `$pull`, cấm dùng `.save()`.
  * **Khóa kỳ lương toàn kỳ:** Schema `Payroll` có index unique `{ companyId: 1, userId: 1, period: 1 }` và hook chặn cập nhật khi `periodLockedAt != null`, đồng thời chặn sửa dữ liệu nguồn (chấm công, OT, đơn từ) của kỳ đã bị khóa.

---

### 1.3 Payroll Engine 2026: KHÔNG Hard-code số liệu vào Logic
- **Nguyên tắc không Hard-code:** Logic tính toán bắt buộc tra cứu tham số động từ `companies.settings` (`taxPolicies`, `insuranceRates`, `minWageByRegion`, `otRates`, `holidays`).
- **Phân định rạch ròi Thời điểm Hiệu lực (`periodDate` vs `payDate`):**
  * *Bảo hiểm xã hội / BHYT / BHTN:* Tính theo tháng phát sinh tiền lương (`periodDate`, ví dụ `"2026-06"` $\rightarrow$ áp trần BHXH 46.8M).
  * *Thuế TNCN & Trần ăn ca:* Tính theo thời điểm thực tế chi trả thu nhập (`payDate`, ví dụ `"2026-07-05"` $\rightarrow$ áp trần ăn ca 1.2M theo Điều 8 & 69 NĐ 253).
- **Cơ chế Miễn thuế Làm thêm giờ (OT) Đổi mới năm 2026:**
  * Từ kỳ tính thuế 2026 (01/01/2026), **toàn bộ 100% tiền lương làm thêm giờ (150%, 200%, 300%) được miễn thuế TNCN** cho cá nhân cư trú nếu thỏa mãn:
    1. Số giờ OT nằm trong giới hạn luật định: $\le 4\text{h}/\text{ngày}$, $\le 40\text{h}/\text{tháng}$, $\le 200\text{h}/\text{năm}$ (Điều 107 BLLĐ).
    2. Hệ số chi trả không vượt quy định tại Điều 98 BLLĐ (150%, 200%, 300%).
  * Phần tiền OT bị tính vào thu nhập chịu thuế gồm: tiền ứng với số giờ vượt trần + phần tiền chênh do công ty tự trả hệ số cao hơn Điều 98.
- **Làm đêm & OT đêm chuẩn Điều 57 NĐ 145/2020:**
  * Làm đêm (22h - 06h): Phụ cấp đêm tối thiểu 30% `[Cần xác minh theo Điều 26 NĐ 253]`.
  * OT đêm ngày thường: Hệ số **200%** (nếu không làm thêm ban ngày trước đó) hoặc **210%** (nếu có làm thêm ban ngày trước đó); 270% (nghỉ hàng tuần); 390% (ngày lễ, tết). Cả hai nhánh đều được miễn thuế 100% khi trong hạn mức luật định.
- **Biểu thuế lũy tiến 5 bậc mới (Kỳ tính thuế 2026):**
  * Bậc 1: Đến 10 triệu đồng: 5% ($0.05 \times \text{TNTT}$)
  * Bậc 2: Trên 10 đến 30 triệu đồng: 10% ($0.10 \times \text{TNTT} - 500.000$)
  * Bậc 3: Trên 30 đến 60 triệu đồng: 20% ($0.20 \times \text{TNTT} - 3.500.000$)
  * Bậc 4: Trên 60 đến 100 triệu đồng: 30% ($0.30 \times \text{TNTT} - 9.500.000$)
  * Bậc 5: Trên 100 triệu đồng: 35% ($0.35 \times \text{TNTT} - 14.500.000$)
- **Căn cứ Pháp lý Chuẩn xác:**
  * Trần BHXH/BHYT: Lương cơ sở (NĐ 161/2026/NĐ-CP: 2.34M lên 2.53M từ 01/07/2026) và Luật BHXH 2024.
  * Trần ăn ca: Điều 8 & 69 Nghị định 253/2026/NĐ-CP (730k trước 01/07; 1.2M từ 01/07/2026).
  * Giảm trừ gia cảnh: 15.5M bản thân, 6.2M người phụ thuộc theo Nghị quyết 110/2025/UBTVQH15.
  * Lương đóng bảo hiểm (`insurableSalary`): Gắn nhãn `[Cần xác minh danh mục các khoản loại trừ cụ thể theo Luật BHXH 2024 hiệu lực từ 01/07/2025]`.
- **Số học tiền tệ:** Dùng số nguyên VNĐ (`Math.round` half-up), chỉ làm tròn ở các dòng mục kết quả cuối.
- Chi tiết công thức và bộ 22 test cases: xem `references/payroll-2026.md`.

---

### 1.4 Chatbot HR AI: Ép Tool Calling & Phương án A (Template Rendering)
- SDK: `@google/genai`. Model cấu hình qua `process.env.GEMINI_MODEL` (mặc định: `gemini-3.5-flash`, dự phòng: `gemini-3.1-flash-lite`).
- **Ép chọn tool (Mode ANY):** Cấu hình `toolConfig: { functionCallingConfig: { mode: 'ANY' } }` và thêm tool `unsupported_request` cho các câu hỏi ngoài phạm vi nghiệp vụ nhân sự.  
  *Lý do:* Triệt tiêu hiện tượng hallucination, ngăn model tự ý phát ngôn hoặc bịa đặt số liệu lương bổng/phép cá nhân.
- **Ngữ cảnh thời gian thực:** Luôn chèn ngày/tháng/năm hiện tại theo múi giờ `Asia/Ho_Chi_Minh` vào `systemInstruction` để model xác định đúng "tháng này", "tháng trước".
- **Lọc Tool theo vai trò (RBAC Pre-filtering):** Nhân viên (`EMPLOYEE`) chỉ nhận 4 tools (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `unsupported_request`). Tuyệt đối không gửi `get_team_leave_stats` cho model khi người hỏi là Employee.
- **CẤM tham số `userId` trong schema Tool:** Backend tự động lấy `userId`, `role`, `companyId` từ JWT. Tool không có tham số (`get_leave_balance`) KHÔNG khai báo `parameters: {}` rỗng để tránh lỗi 400 Bad Request.
- **Quy trình Phương án A:**
  1. Backend gửi prompt người dùng tới Gemini (giới hạn độ dài $\le 500$ ký tự, timeout 8 giây).
  2. Nhận `functionCall` từ Gemini.
  3. Validate allowlist tool. Nếu là `unsupported_request` hoặc không hợp lệ -> lập tức trả thông báo cố định `MSG_UNSUPPORTED` mà không chạy vào hàm template.
  4. Parse và kiểm tra tham số bằng Zod schema `.strict()`. Nếu sai tham số -> trả `MSG_BAD_ARGS`.
  5. Backend thẩm định quyền RBAC/IDOR trên tham số (chặn tra cứu tương lai, chỉ xem lương khi kỳ đã khóa sổ `periodLockedAt != null`).
  6. Backend tự truy vấn CSDL nội bộ để lấy số liệu thực tế.
  7. Ghi `AuditLog` (`actorId: userId`, `action: 'AI_TOOL'`, `aiToolInfo: { toolName, latencyMs }`).
  8. **DỪNG LUỒNG LLM:** Không gửi `functionResponse` chứa dữ liệu nhạy cảm ngược lại cho Gemini.
  9. Backend tự render dữ liệu vào Markdown template tĩnh:
     * *Template Phiếu Lương:* Tách riêng Khối Thực nhận (Net = Gross - BH - Thuế) và Khối Thông tin tính thuế (Chỉ mang tính giải trình, tuyệt đối KHÔNG trừ giảm trừ gia cảnh vào tiền thực nhận). Bóc tách rõ OT miễn thuế và OT chịu thuế.
     * *Template Phép:* Khớp đúng các trường trong schema `users.leaveBalance`.
  10. Frontend sanitize Markdown qua DOMPurify trước khi render.
- **Fallback có phân loại lỗi:** Chỉ kích hoạt gọi model dự phòng khi gặp lỗi tạm thời (429 Quota Exceeded, 5xx Server Error, Timeout). KHÔNG fallback khi gặp lỗi 400 (Bad Request). Lần gọi fallback thứ hai bắt buộc bọc trong `try/catch` để trả câu thông báo thân thiện nếu cả 2 model đều không khả dụng.

---

### 1.5 FaceID Kiosk & Mô hình ML Dự báo Thôi việc
- **FaceID 2 tầng & Bảo mật Sinh trắc học:**
  * **Tầng 1 (Client Liveness theo Chuỗi Thời gian):** `@mediapipe/tasks-vision` (Face Landmarker), cấu hình `numFaces: 1` (phát hiện $> 1$ mặt $\rightarrow$ từ chối ngay). Kiểm tra chuỗi trạng thái sinh lý học: mắt mở ($< 0.2$) $\rightarrow$ nhắm ($> 0.5$) $\rightarrow$ mở lại ($< 0.2$) trong $100 - 800\text{ms}$; quay đầu Yaw chính diện $\rightarrow$ lệch $\ge 25^\circ \rightarrow$ về chính diện.
  * **Challenge & 2 Vector:** Server cấp nonce ngẫu nhiên dùng 1 lần trong RAM (TTL 60s). Client gửi kèm $V_{\text{start}}$ và $V_{\text{end}}$ để server xác thực $d(V_{\text{start}}, V_{\text{end}}) \le 0.40$.
  * **Bảo mật Vector Sinh trắc học:** Không lưu ảnh thô. Trường `descriptors` trong `faceTemplates` bắt buộc mã hóa AES-256-GCM tại tầng ứng dụng (Application-Layer Encryption dùng khóa trong `.env`), giải mã trong RAM khi so khớp. TUYỆT ĐỐI CẤM ghi vector vào `auditLogs`, `attendanceLogs` và log lỗi. Tự động khóa Kiosk tạm thời sau 5 lần thất bại liên tiếp.
  * **Lấy mẫu (Enrollment):** Bắt buộc HR trực tiếp giám sát lấy 3–5 mẫu tại văn phòng (CẤM nhân viên tự upload ảnh từ xa). Lưu vết phiên bản `modelId`, `modelVersion`, `consentPolicyVersion` và `enrolledBy`. Xóa vĩnh viễn template khi nhân viên rút đồng ý HOẶC nghỉ việc (theo Luật Bảo vệ dữ liệu cá nhân - BVDLCN).
  * **Kiểm soát FAR 1:N:** Áp dụng quy tắc biên chênh lệch 2 ứng viên ($d_1 \le \text{Threshold}$ và $d_2 - d_1 \ge 0.15$). Nếu không thỏa mãn biên an toàn, chuyển sang xác minh 1:1 (quét QR / nhập mã nhân viên).
- **ML Dự báo thôi việc:**
  * Dataset: IBM HR Attrition. Đúng 6 đặc trưng định lượng: `OverTime` (ngưỡng chốt: tổng giờ OT trong tháng gần nhất $\ge 4\text{h}$ gán $= 1$, ngược lại $= 0$), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
  * **TUYỆT ĐỐI LOẠI BỎ:** `Gender`, `Age`, `MaritalStatus` và các biến khảo sát sự hài lòng chủ quan (tránh thiên kiến và vi phạm Điều 8 BLLĐ về chống phân biệt đối xử).
  * Triển khai: Logistic Regression (JSON weights), Random Forest (ONNX qua `onnxruntime-node`). Kiểm thử binary `onnxruntime-node` trên môi trường Render ngay Tuần 1.
  * Chi tiết: xem `references/faceid-ml.md`.

---

## 2. CODE SNIPPETS CHUẨN MẪU

### Snippet 1: Mongoose Tenant Plugin Fail-Closed Đọc & Ghi (AsyncLocalStorage)
```javascript
// backend/src/plugins/tenantPlugin.js
import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose from 'mongoose';

export const tenantStore = new AsyncLocalStorage();

const TENANT_QUERY_OPS = [
  'find', 'findOne', 'countDocuments', 'distinct'
];

const TENANT_UPDATE_OPS = [
  'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'
];

export function tenantPlugin(schema) {
  // 1. Trường companyId là bắt buộc và bất biến
  schema.add({
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
      immutable: true // Chống đổi tenant sau khi tạo
    }
  });

  const getTenantId = (options) => {
    if (options?.skipTenant) return null; // Chỉ cho phép script seed/cron nội bộ, bắt buộc ghi log
    const store = tenantStore.getStore();
    const id = store?.companyId;
    if (!id) {
      throw new Error('SECURITY_ERROR: Missing tenant context in query (Fail-Closed)');
    }
    return id;
  };

  // 2. Bảo vệ đường Ghi (pre-validate): Tự động gán hoặc kiểm tra companyId
  schema.pre('validate', function () {
    const id = getTenantId();
    if (id) {
      if (this.companyId && this.companyId.toString() !== id.toString()) {
        throw new Error('SECURITY_ERROR: Cannot write document to different tenant');
      }
      this.companyId = id;
    }
  });

  // 3. Bảo vệ đường Đọc (Query Hooks)
  TENANT_QUERY_OPS.forEach((op) => {
    schema.pre(op, function () {
      const id = getTenantId(this.getOptions());
      if (id) {
        this.where({ companyId: id });
      }
    });
  });

  // 4. Bảo vệ đường Cập nhật (Update Hooks): Chặn cập nhật đè companyId
  TENANT_UPDATE_OPS.forEach((op) => {
    schema.pre(op, function () {
      const id = getTenantId(this.getOptions());
      if (id) {
        this.where({ companyId: id });
        const update = this.getUpdate();
        if (update && (update.companyId || update.$set?.companyId)) {
          throw new Error('SECURITY_ERROR: Modifying companyId is forbidden');
        }
      }
    });
  });

  // 5. Bảo vệ Aggregate (chèn match tenant vào đầu pipeline, ngoại trừ $vectorSearch của RAG)
  schema.pre('aggregate', function () {
    const id = getTenantId(this.options);
    if (id) {
      const firstStage = this.pipeline()[0];
      // Nếu là $vectorSearch của Atlas (RAG P1), không unshift $match mà phải filter bên trong stage
      if (!firstStage || !firstStage.$vectorSearch) {
        this.pipeline().unshift({ $match: { companyId: new mongoose.Types.ObjectId(id) } });
      }
    }
  });
}
```

---

### Snippet 2: Giao Dịch Duyệt Phép Nguyên Tử (Idempotent Transaction)
```javascript
// backend/src/services/leaveService.js
import mongoose from 'mongoose';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';

export async function approveLeaveByHR({ leaveRequestId, companyId, hrUserId }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Chuyển trạng thái đơn từ MANAGER_APPROVED sang APPROVED một cách nguyên tử
    const leave = await LeaveRequest.findOneAndUpdate(
      {
        _id: leaveRequestId,
        companyId,
        status: 'MANAGER_APPROVED' // Điều kiện chặn duyệt trùng lặp
      },
      {
        $set: {
          status: 'APPROVED',
          'approvalFlow.hr': {
            approvedBy: hrUserId,
            approvedAt: new Date(),
            status: 'APPROVED'
          }
        }
      },
      { session, new: true }
    );

    if (!leave) {
      throw new Error('INVALID_STATUS: Đơn không ở trạng thái chờ HR duyệt hoặc đã được xử lý!');
    }

    // 2. Trừ số dư phép trong cùng một giao dịch (nếu là nghỉ phép năm)
    if (leave.type === 'ANNUAL') {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: leave.userId,
          companyId,
          'leaveBalance.annualRemaining': { $gte: leave.daysCount } // Chặn âm phép
        },
        {
          $inc: {
            'leaveBalance.annualUsed': leave.daysCount,
            'leaveBalance.annualRemaining': -leave.daysCount
          }
        },
        { session, new: true }
      );

      if (!updatedUser) {
        throw new Error('INSUFFICIENT_LEAVE_BALANCE: Số dư phép năm của nhân viên không đủ!');
      }
    }

    await session.commitTransaction();
    return leave;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

### Snippet 3: Luồng Chatbot HR Phương án A (Ép Tool Calling, Zod Validation, Dự phòng Phân loại Lỗi)
```javascript
// backend/src/controllers/chatController.js
import { GoogleGenAI } from '@google/genai';
import { getToolsForRole, ALLOWED_TOOL_NAMES, TOOL_SCHEMAS } from '../ai/tools/declarations.js';
import { executeToolAndRenderTemplate } from '../ai/templates/index.js';
import { AuditLog } from '../models/AuditLog.js';

const MSG_UNSUPPORTED = 'Yêu cầu của bạn nằm ngoài phạm vi hỗ trợ của Trợ lý Nhân sự PeopleInsight AI. Vui lòng liên hệ Phòng Nhân sự để được giải đáp.';
const MSG_BAD_ARGS = 'Thông tin tra cứu không hợp lệ hoặc thiếu tham số thời gian. Vui lòng thử lại.';
const MSG_SERVICE_ERROR = 'Hệ thống Trợ lý AI đang bận xử lý hoặc gặp sự cố tạm thời. Vui lòng thử lại sau giây lát.';

export async function handleAIChat(req, res) {
  const { message } = req.body;
  const { id: userId, role, companyId } = req.user;

  // 1. Chèn ngày giờ thời gian thực theo múi giờ Việt Nam
  const todayVietnam = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const systemInstruction = `Hôm nay là ngày ${todayVietnam} (giờ Việt Nam). Bạn là Trợ lý Nhân sự PeopleInsight AI. Bắt buộc chọn đúng 1 tool phù hợp để trả lời. Với mọi câu hỏi ngoài nghiệp vụ nhân sự/chính sách/cá nhân, bắt buộc gọi unsupported_request.`;

  // 2. Lọc tools theo vai trò RBAC trước khi gửi cho Gemini
  const activeTools = getToolsForRole(role);

  const payload = {
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: activeTools }],
      toolConfig: { functionCallingConfig: { mode: 'ANY' } }
    }
  };

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let response;

  try {
    // Thử model chính với timeout 8s
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      ...payload
    });
  } catch (err) {
    // Chỉ fallback khi lỗi tạm thời (429 Quota, 5xx Server Error, Timeout); không fallback khi lỗi 400 Bad Request
    const isTemporaryError = err?.status === 429 || err?.status >= 500 || err?.name === 'AbortError' || err?.message?.includes('timeout');
    if (!isTemporaryError) {
      return res.status(400).json({ text: MSG_BAD_ARGS });
    }

    try {
      response = await ai.models.generateContent({
        model: process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite',
        ...payload
      });
    } catch (fallbackErr) {
      return res.status(503).json({ text: MSG_SERVICE_ERROR });
    }
  }

  // 3. Kiểm tra Tool Call & Xử lý trường hợp unsupported_request
  const call = response.functionCalls?.[0];
  if (!call || !ALLOWED_TOOL_NAMES.includes(call.name) || call.name === 'unsupported_request') {
    return res.json({ text: MSG_UNSUPPORTED });
  }

  // 4. Validate tham số bằng Zod .strict()
  const schema = TOOL_SCHEMAS[call.name];
  const parsed = schema ? schema.safeParse(call.args ?? {}) : { success: true, data: call.args };
  if (!parsed.success) {
    return res.json({ text: MSG_BAD_ARGS });
  }

  // 5. Phương án A: Dừng luồng LLM, Backend tự truy vấn CSDL và render Markdown template
  const t0 = Date.now();
  const text = await executeToolAndRenderTemplate(call.name, parsed.data, { userId, role, companyId });
  const latencyMs = Date.now() - t0;

  // 6. Ghi Audit Log hành động gọi tool AI
  await AuditLog.create({
    actorId: userId,
    companyId,
    action: 'AI_CHATBOT_CALL',
    aiToolInfo: {
      toolName: call.name,
      args: parsed.data,
      latencyMs,
      usedModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
    }
  });

  return res.json({ text });
}
```

---

## 3. CHECKLIST KIỂM THỬ TỰ ĐỘNG HÓA (CI & LOCAL)

Khi review mã nguồn, chạy các lệnh grep và unit test sau trong CI / Terminal:

- [ ] **Kiểm tra model ID cấm:**
  ```bash
  grep -rnE "gemini-[23]\.0" backend/src frontend/src
  ```
  *(Kết quả bắt buộc là 0 dòng. Chỉ cho phép dùng `gemini-3.5-flash` và `gemini-3.1-flash-lite`).*

- [ ] **Kiểm tra hard-code hằng số thuế / bảo hiểm:**
  ```bash
  grep -rnE "(46[._]?800[._]?000|50[._]?600[._]?000|730[._]?000|1[._]?200[._]?000|15[._]?500[._]?000|6[._]?200[._]?000)" backend/src/services/payroll/
  ```
  *(Kết quả bắt buộc là 0 dòng. Các con số chỉ nằm trong seed DB hoặc test cases).*

- [ ] **Kiểm tra cấm `.save()` trên model User:**
  ```bash
  grep -rn "\.save()" backend/src/
  ```
  *(Không được gọi `.save()` trên User document khi sửa đổi mảng token hoặc số dư ngày phép).*

- [ ] **Kiểm tra Projection bảo vệ trường nhạy cảm:**
  API `/api/users` tuyệt đối không trả về `passwordHash`, `refreshTokens[]`, và `salaryConfig`.

- [ ] **Kiểm tra Multi-tenant Fail-Closed:**
  Chạy `npm test backend/tests/security/` chứng minh truy vấn thiếu ngữ cảnh tenant sẽ lập tức throw error và truy vấn tenant A không lấy được dữ liệu tenant B.

- [ ] **Kiểm tra Payroll Engine 22 Test Cases:**
  Chạy `npm test backend/tests/payroll/calc.test.js` -> Toàn bộ **22/22 test cases pass 100%**.
