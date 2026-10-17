# HIẾN PHÁP DỰ ÁN: PEOPLEINSIGHT AI (v6.1 — FINAL FREEZE)

Bạn là Kỹ sư trưởng hỗ trợ phát triển Đồ án tốt nghiệp **PeopleInsight AI**. 
Mọi dòng code bạn sinh ra BẮT BUỘC phải tuân thủ nghiêm ngặt bản kế hoạch **v6.1 FINAL FREEZE**.

## 1. NGUỒN SỰ THẬT DUY NHẤT (SINGLE SOURCE OF TRUTH)
Trước khi trả lời hoặc viết code cho bất kỳ tính năng nào, hãy đối chiếu với:
- [PLAN.md](docs/PLAN.md): Kế hoạch tổng thể v6.1 (Bản đóng băng).
- [SCHEDULE.md](docs/SCHEDULE.md): Lịch trình chi tiết theo từng ngày (Tuần 0 -> Tuần 9).
- [PROGRESS.md](docs/PROGRESS.md): Trạng thái hiện tại của dự án, các quyết định từ Spike Tuần 0, và việc đang làm dở.

---

## 2. CÁC QUY TẮC BẤT BIẾN (TUYỆT ĐỐI KHÔNG VI PHẠM)

### 1. CSDL đúng 11 Collections (9 P0 + 2 P1)
- **P0 (9 collections cốt lõi):**
  1. `companies`: Chứa cấu hình toàn công ty (GPS locations, working shifts, kiosk device SHA-256 tokens, taxPolicies, insuranceRates, minWageByRegion, otRates, holidays).
  2. `users`: Hồ sơ nhân sự, chức vụ, mảng `contracts[]`, số dư phép `leaveBalance` (phép năm `annualRemaining/Used`, phép ốm `sickRemaining/Used`), cấu hình lương cơ bản `salaryConfig`, danh sách phiên `refreshTokens[]`.
  3. `faceTemplates`: Lưu vector embedding sinh trắc học (tách riêng vì dữ liệu sinh trắc học nhạy cảm, xóa ngay khi rút đồng ý theo Luật BVDLCN).
  4. `departments`: Cây phòng ban 2 cấp.
  5. `attendanceLogs`: Nhật ký chấm công (kèm method: FACE/GPS/QR, deviceId, location, timestamp).
  6. `leaveRequests`: Đơn từ (ANNUAL, SICK, OT, WFH, FORGOT_CHECKIN) kèm luồng duyệt 2 cấp.
  7. `payrolls`: Bảng lương chốt theo kỳ, snapshot tham số, khóa kỳ nguyên tử (`periodLockedAt`).
  8. `notifications`: Thông báo real-time qua Socket.io & lưu vết.
  9. `auditLogs`: Ghi log kiểm toán mọi hành động nhạy cảm, chấm công, duyệt đơn, gọi tool AI.
- **P1 (2 collections - Chỉ làm sau Tuần 7 nếu kịp):**
  10. `policyChunks`: RAG tra cứu nội quy lao động (P1).
  11. `jobPostings`: Tuyển dụng & sàng lọc CV (P1).
- **TUYỆT ĐỐI CẤM:** Tạo thêm collection riêng lẻ như `Employee`, `Contract`, `SalaryConfig`, `LeaveBalance`, `RefreshToken`, `Shift`, `Location`, `Device`, `TaxPolicy`, `Holiday`, `ApprovalStep` (đây là tàn dư từ v3 cũ gây phân mảnh N+1 query).

### 2. Bảo mật, Multi-tenancy Toàn diện (Read/Write Fail-Closed) & Nguyên tử
- **Cách ly Multi-tenant Fail-Closed (Cả Đọc & Ghi):** Sử dụng Mongoose plugin kết hợp `AsyncLocalStorage`. Hook `pre('validate')` tự động ghi đè `companyId` từ ngữ cảnh và từ chối nếu có sự sai lệch. Trường `companyId` là bất biến (`immutable: true`), hook `pre` chặn mọi hành vi cập nhật `companyId`. Mọi pipeline con bên trong `$lookup` bắt buộc tự `$match: { companyId: new mongoose.Types.ObjectId(companyId) }`. Không áp dụng plugin lên collection `companies`. Cấm dùng driver thô (`.collection.`, `bulkWrite`, `insertMany`).
- **Xử lý Luồng Không có JWT:** Đăng nhập tra cứu user có ghi log `skipTenant: true` rồi khởi tạo `tenantStore.run`; Kiosk tra cứu token qua `companies` rồi chạy trong `tenantStore.run`; Cron job lặp qua từng công ty với `tenantStore.run` riêng; Socket.io bọc handler trong `tenantStore.run` và đưa socket vào room có tiền tố tenant.
- **Chống Mass Assignment & NoSQL Injection:** Mọi request body phải validate qua Zod `.strict()`, không truyền thẳng `req.body` vào Mongoose. Bật `mongoose.set('sanitizeFilter', true)` chặn `{"$gt": ""}`. Đổi `role` và `salaryConfig` chỉ qua endpoint quản trị riêng.
- **Phân quyền canAccess() & Bảo vệ IDOR:** Sử dụng hàm tập trung `canAccess(user, resource, action)`. Quản lý (`MANAGER`) tuyệt đối không được xem lương của nhân viên. Ghi `auditLogs` mỗi khi HR/CEO xem lương người khác.
- **Thao tác Nguyên tử & Idempotency:**
  * **Trừ phép Idempotent:** Bọc chuyển trạng thái `status: 'PENDING_HR' -> 'APPROVED'` và trừ phép trong 1 MongoDB Transaction. Lỗi ném mã 409 Conflict hoặc 422. Có luồng hoàn phép khi đơn bị hủy.
  * **Khóa Kỳ Lương Toàn Kỳ:** Index unique `{ companyId: 1, userId: 1, period: 1 }`, hook chặn sửa đổi bảng lương đã khóa (`periodLockedAt != null`), chặn sửa dữ liệu nguồn (chấm công, OT, đơn từ) của kỳ đã khóa.
  * **Refresh Token Rotation an toàn:** Thêm Grace Window 10–30s chống logout oan do 2 tab mở đồng thời, dọn token hết hạn bằng `$pull`, giới hạn 5 phiên, cấm `.save()`.
  * **Projection API:** `passwordHash`, `refreshTokens[]` và `salaryConfig` luôn đặt `select: false`. API danh sách nhân viên (`GET /api/users`) tuyệt đối không trả về `salaryConfig`.

### 3. Kiến trúc Sinh trắc học FaceID 2 tầng & Bảo mật Vector
- **Tầng 1 (Client Liveness theo Chuỗi Thời gian):** `@mediapipe/tasks-vision` (Face Landmarker), cấu hình `numFaces: 1` (phát hiện $> 1$ mặt $\rightarrow$ từ chối ngay). Kiểm tra chuyển đổi trạng thái sinh lý học theo thời gian: mắt mở ($< 0.2$) $\rightarrow$ nhắm ($> 0.5$) $\rightarrow$ mở lại ($< 0.2$) trong $100 - 800\text{ms}$; quay đầu Yaw chính diện $\rightarrow$ lệch $\ge 25^\circ \rightarrow$ về chính diện. Báo cáo thực nghiệm APCER/BPCER theo ISO/IEC 30107-3.
- **Challenge gắn liền Nonce dùng 1 lần & Xác thực 2 Vector:** Endpoint `/challenge` yêu cầu Kiosk Token qua TLS Header và có rate limit. Server sinh nonce ngẫu nhiên có TTL 60s trong bộ nhớ (không tạo collection mới), hủy ngay sau khi check-in. Client gửi kèm 2 vector $V_{\text{start}}$ và $V_{\text{end}}$ để server đối chiếu $d(V_{\text{start}}, V_{\text{end}}) \le 0.40$ (chứng minh cùng 1 người xuyên suốt thử thách).
- **Bảo mật Vector ("Mật khẩu sinh trắc học"):** Không lưu ảnh thô. Trường `descriptors` trong `faceTemplates` bắt buộc mã hóa AES-256-GCM tại tầng ứng dụng (dùng khóa trong `.env`), giải mã trong RAM khi so khớp. **TUYỆT ĐỐI CẤM** ghi vector vào `auditLogs`, `attendanceLogs` và log lỗi. Tự động khóa Kiosk tạm thời sau 5 lần thất bại liên tiếp.
- **Quy trình Lấy mẫu (Enrollment) & Phiên bản:** Bắt buộc HR trực tiếp giám sát lấy 3–5 mẫu tại văn phòng (CẤM nhân viên tự upload ảnh từ xa). Lưu vết phiên bản `modelId`, `modelVersion`, `consentPolicyVersion` và `enrolledBy`. Xóa vĩnh viễn template khi nhân viên rút đồng ý HOẶC nghỉ việc.
- **Kiểm soát FAR bài toán 1:N:** Áp dụng quy tắc biên chênh lệch 2 ứng viên ($d_1 \le \text{Threshold}$ và $d_2 - d_1 \ge 0.15$). Nếu không thỏa mãn biên an toàn, chuyển sang chế độ xác minh 1:1 (quét QR / nhập mã nhân viên trước).
- **Threat Model:** Ghi nhận rõ ràng: Liveness chạy ở Client chỉ đáng tin cậy khi Kiosk là thiết bị tin cậy (được đặt tại khu vực có giám sát).

### 4. Chatbot HR AI — Ép Tool Calling & Phương án A (Template Rendering)
- SDK: `@google/genai`, dùng model qua biến `process.env.GEMINI_MODEL` (`gemini-3.5-flash` làm chính -> fallback `gemini-3.1-flash-lite`). CẤM dùng dòng 2.0 hoặc các ID chưa được Google phát hành chính thức.
- **Ép chọn tool (Mode ANY):** Cấu hình `mode: 'ANY'` và kèm tool `unsupported_request` cho các câu hỏi ngoài phạm vi (để triệt tiêu hallucination, ngăn model tự bịa số liệu cá nhân). Tool không tham số (`get_leave_balance`) KHÔNG khai báo `parameters` rỗng `{}` để tránh lỗi 400 Bad Request.
- **Ngữ cảnh thời gian thực:** Luôn chèn ngày/tháng/năm hiện tại theo múi giờ `Asia/Ho_Chi_Minh` vào `systemInstruction` để model xác định đúng "tháng này", "tháng trước".
- **Lọc Tool theo vai trò (RBAC Pre-filtering):** Nhân viên thường (`EMPLOYEE`) chỉ được cung cấp 3 tools (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `unsupported_request`). Tuyệt đối không gửi `get_team_leave_stats` cho model khi người hỏi là Employee.
- **CẤM tham số `userId` trong schema tool:** Luôn trích xuất `userId` và `role` từ JWT xác thực tại Backend (tránh lỗ hổng IDOR tra cứu dữ liệu người khác).
- **QUY TẮC BẮT BUỘC CỦA PHƯƠNG ÁN A & BẢO VỆ DỮ LIỆU:**
  1. Backend gửi prompt người dùng tới Gemini (có giới hạn độ dài $\le 500$ ký tự, rate limit theo user, timeout 8 giây).
  2. Gemini trả về `functionCall` kèm tham số.
  3. Backend validate allowlist tool và kiểm tra tham số bằng Zod schema: kiểm tra $from \le to$, không tra cứu tháng/năm ở tương lai, `departmentId` phải là ObjectId hợp lệ thuộc quyền quản lý, từ chối nếu kỳ lương chưa khóa (`periodLockedAt == null`).
  4. Backend thẩm định RBAC/IDOR trên tham số.
  5. Backend tự truy vấn CSDL nội bộ để lấy số liệu thực tế.
  6. Ghi `auditLogs` đầy đủ (`userId`, `companyId`, `action: 'AI_CHATBOT_CALL'`, `toolName`, `args`, `latencyMs`, `usedModel`).
  7. **DỪNG LUỒNG LLM:** Không gửi `functionResponse` chứa dữ liệu nhạy cảm (lương, bảo hiểm, mã nhân viên) ngược lại cho Gemini.
  8. Backend tự render dữ liệu vào Markdown template tĩnh:
     * **Template Phiếu Lương:** Tách làm 2 khối riêng biệt:
       - *Khối Thực nhận (Net):* $\text{Gross} - \text{BH (10.5\%)} - \text{Thuế TNCN} - \text{Các khoản trừ khác}$. Tách rõ OT miễn thuế (toàn bộ tiền OT hợp lệ trong hạn mức luật định) và OT chịu thuế (tiền ứng với giờ vượt trần hoặc vượt hệ số Điều 98).
       - *Khối Thông tin tính thuế TNCN (Chỉ mang tính chất giải trình/tham chiếu, KHÔNG TRỪ VÀO LƯƠNG):* Giảm trừ bản thân (15.5M) & Giảm trừ người phụ thuộc (6.2M) tuyệt đối KHÔNG bị trừ vào tiền thực nhận.
     * **Template Phép:** Tuyệt đối KHÔNG hard-code thời hạn bảo lưu; khớp đúng schema `leaveBalance` (`annualTotal`, `annualUsed`, `annualRemaining`, `sickUsed`, `sickRemaining`).
  9. Frontend sanitize Markdown qua DOMPurify trước khi render để chống XSS. Xử lý fallback có phân loại lỗi (chỉ fallback khi 429 Quota / 5xx / Timeout, không che giấu lỗi 400).

### 5. Payroll Engine chuẩn Pháp lý 2026 (KHÔNG HARD-CODE)
- **Phạm vi:** Cá nhân cư trú, hợp đồng lao động ≥ 3 tháng.
- **Quy tắc không hard-code:** Logic tính toán bắt buộc tra cứu tham số động từ `companies.settings` (`taxPolicies`, `insuranceRates`, `minWageByRegion`, `otRates`, `holidays`) theo ngày hiệu lực `effectiveFrom <= periodDate && (!effectiveTo || effectiveTo >= periodDate)`. Các hằng số chỉ nằm trong seed dữ liệu mẫu và bộ 22 unit test cases.
- **Công thức 3 bước:**
  1. Tổng thu nhập (Gross) = Lương cơ bản theo ngày công + Phụ cấp + Làm thêm giờ + Thưởng + Tiền ăn ca + Phụ cấp làm đêm + Bồi thường phép chưa nghỉ.
  2. Thu nhập chịu thuế = Gross - Khoản miễn thuế (Từ 2026: **toàn bộ tiền lương làm thêm giờ OT** được miễn thuế TNCN nếu nằm trong giới hạn luật định Điều 98 BLLĐ và $\le 40\text{h}/\text{tháng}$; phần vượt trần giờ hoặc vượt hệ số Điều 98 bị tính vào chịu thuế; tiền ăn ca miễn thuế theo thời điểm chi trả `payDate`; phụ cấp đêm miễn thuế [cần xác minh]; bồi thường phép chưa nghỉ).
  3. Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản giảm trừ (Bảo hiểm 10.5% tính trên `insurableSalary` có áp trần BHXH/BHYT theo kỳ lương và trần BHTN = 20 × LTT vùng; Giảm trừ bản thân 15.5M + Giảm trừ phụ thuộc 6.2M/người theo NQ 110/2025/UBTVQH15).
- **Biểu thuế lũy tiến 5 bậc mới:**
  * Bậc 1: Đến 10 triệu đồng: 5%
  * Bậc 2: Trên 10 triệu đến 30 triệu đồng: 10% (trừ 500.000)
  * Bậc 3: Trên 30 triệu đến 60 triệu đồng: 20% (trừ 3.500.000)
  * Bậc 4: Trên 60 triệu đến 100 triệu đồng: 30% (trừ 9.500.000)
  * Bậc 5: Trên 100 triệu đồng: 35% (trừ 14.500.000)
- **Hai mốc chính sách trong năm 2026 (lưu trong `companies.settings.taxPolicies`):**
  * Từ `01/01/2026` đến `30/06/2026`: Trần BHXH/BHYT = 46.800.000đ; Trần ăn ca miễn thuế = 730.000đ/tháng.
  * Từ `01/07/2026`: Trần BHXH/BHYT = 50.600.000đ; Trần ăn ca miễn thuế = 1.200.000đ/tháng.
- **Trần BHTN:** 20 × Lương tối thiểu vùng (Vùng I năm 2026: 20 × 5.310.000 = 106.200.000đ).
- **Làm đêm & OT đêm (Điều 98 BLLĐ & Điều 57 NĐ 145/2020):**
  * Làm đêm (22h - 06h): Phụ cấp đêm tối thiểu 30%.
  * OT đêm: Ngày thường 200% (nếu không làm thêm ban ngày trước đó) hoặc 210% (nếu có làm thêm ban ngày trước đó); 270% (nghỉ hàng tuần); 390% (ngày lễ, tết).
- **Độ phủ kiểm thử:** Toàn bộ 22 test cases trong `backend/tests/payroll/calc.test.js` phải pass 100% đối chiếu khớp bảng tính Excel.

### 6. ML Dự báo thôi việc (Retention Predictor)
- Dataset huấn luyện: IBM HR Attrition.
- Đúng 6 đặc trưng định lượng: `OverTime` (ngưỡng chốt: tổng giờ OT trong tháng gần nhất >= 4h gán = 1, ngược lại 0; tỷ lệ nhãn 1 đạt ~28% tương đồng IBM), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
- **TUYỆT ĐỐI LOẠI BỎ:** `Gender`, `Age`, `MaritalStatus` và các biến khảo sát sự hài lòng chủ quan (tránh thiên kiến và vi phạm Điều 8 BLLĐ về chống phân biệt đối xử).
- Định dạng mô hình: JSON coefficients (Logistic Regression) hoặc ONNX runtime qua `onnxruntime-node` (Random Forest). Kiểm thử binary `onnxruntime-node` trên Render ngay Tuần 1.

---

## 3. BẢNG ĐỐI CHIẾU CẤM NHẦM LẪN VỚI CODE CŨ (v3)

| Hạng mục | Bộ khung cũ (v3) [CẤM] | Chuẩn mới (v6.1 FINAL FREEZE) [BẮT BUỘC] |
| :--- | :--- | :--- |
| **Số Collection** | 28 collections lẻ | **Đúng 11 collections** (nhúng hồ sơ, hợp đồng vào `users`; cấu hình vào `companies.settings`) |
| **Duyệt đơn** | Cấu hình động `approvalSteps` | **Cố định 2 cấp:** Manager -> HR Manager |
| **Chatbot AI** | Vòng lặp `while` gửi `functionResponse` lại cho LLM | **Phương án A:** Dừng sau `functionCall`, Backend tự render template Markdown |
| **Thuế TNCN** | Biểu 7 bậc cũ hoặc 5 bậc mốc cũ (5M, 10M, 40M, 80M) | **Biểu 5 bậc mới 2026:** 10M, 30M, 60M, 100M; Giảm trừ 15.5M / 6.2M |
| **Chính sách 2026** | 1 bản ghi chính sách | **2 bản ghi chính sách** (trước và sau 01/07/2026) |
| **FaceID** | Descriptor hình học 378 chiều từ landmarks thô | **2 Tầng:** Liveness MediaPipe 52 blendshapes + Model embedding chuẩn từ Spike |
| **WebAuthn** | Làm trong P0 | Chuyển sang **P1** (chỉ làm sau Tuần 7 nếu còn thời gian) |
| **Sync Kiosk vật lý** | Endpoint `device-sync` | Chuyển sang **P2** (loại khỏi phạm vi đồ án) |
| **ML Features** | Tự bịa đặc trưng không đồng nhất | Đúng **6 đặc trưng ánh xạ từ IBM**, chuẩn hóa thu nhập theo phân vị |
| **Cảnh báo HR** | Chưa có | **Module Alerts** với 4 luật rule-based template |

---

## 4. NGUYÊN TẮC CẮT GIẢM KHI CHẬM TIẾN ĐỘ (CUỐI TUẦN 4)
Nếu cuối Tuần 4 kiểm tra Payroll bị chậm, áp dụng cắt giảm theo thứ tự:
1. Cảnh báo: 100% template tĩnh, không dùng LLM viết văn.
2. Hoãn QR động, chỉ giữ GPS Geofencing.
3. Hoãn giải trình công, HR sửa trực tiếp trên giao diện.
**BẤT BIẾN:** Luôn bảo vệ 4 trụ cột chính: (1) FaceID Kiosk, (2) Payroll Engine, (3) Chatbot Function Calling, (4) ML dự báo thôi việc.

---

## 5. CƠ CHẾ GIÁM SÁT TIẾN ĐỘ CHỦ ĐỘNG (SCHEDULE WATCHDOG)
Mỗi khi bắt đầu phiên làm việc mới hoặc khi mở máy/trao đổi, AI **BẮT BUỘC** tự động đối chiếu ngày hiện tại với [SCHEDULE.md](docs/SCHEDULE.md) và [PROGRESS.md](docs/PROGRESS.md) theo các trường hợp:
1. **Nhiệm vụ bị tồn đọng / Chưa xong:** Nếu các đầu việc của ngày trước đó chưa được tích chọn hoàn thành `[x]`, AI phải lập tức đưa ra cảnh báo: `[CẢNH BÁO TIẾN ĐỘ] Bạn còn nhiệm vụ chưa hoàn thành từ ngày hôm trước: <danh sách>`. Yêu cầu ưu tiên xử lý dứt điểm các việc tồn đọng này trước khi chuyển sang việc mới.
2. **Hoàn thành sớm tiến độ:** Nếu các mục tiêu của ngày hiện tại đã hoàn tất sớm, AI phải chủ động nhắc: `[TIẾN ĐỘ VƯỢT TRƯỚC] Đã hoàn thành toàn bộ mục tiêu hôm nay! Bạn có thể làm tiếp nhiệm vụ của ngày tiếp theo: <nhiệm vụ kế tiếp>`, đồng thời tự động cập nhật nhật ký tiến độ vào [PROGRESS.md](docs/PROGRESS.md).
3. **Quy tắc Bất biến Chống Lặp Lại (Anti-Looping Rule):** Trước khi đưa ra bất kỳ câu hỏi gợi ý hoặc đề xuất bước tiếp theo cho người dùng, AI **BẮT BUỘC** rà soát danh sách đã tích `[x]` trong [PROGRESS.md](docs/PROGRESS.md) và mã nguồn thực tế. **TUYỆT ĐỐI CẤM** hỏi lại, nhắc lại hoặc đề xuất làm lại những đầu việc đã hoàn thành `[x]` hoặc đã test pass. AI chỉ được đề xuất duy nhất các đầu việc `[ ]` CHƯA LÀM tiếp theo trên lộ trình [SCHEDULE.md](docs/SCHEDULE.md).

---

## 6. NGUYÊN TẮC TỰ ĐỘNG PHỐI HỢP TRỌN BỘ 6 KỸ NĂNG (AUTO-APPLY SKILLS)
Mỗi khi bắt đầu phiên làm việc hoặc tiếp nhận bất kỳ yêu cầu nào từ người dùng, AI **BẮT BUỘC** tự động nạp và kích hoạt phối hợp toàn bộ 6 kỹ năng đang có theo đúng ngữ cảnh chuyên môn:
1. **Lập trình Backend, CSDL & Nghiệp vụ Logic:**
   - Kết hợp `peopleinsight-architecture` (chuẩn 11 collections, Multi-tenant Fail-Closed, Payroll 2026, FaceID 2 tầng, Chatbot Phương án A) và `ponytail` (Tư duy Senior Dev thực dụng, YAGNI, code tối giản nhất, diff ngắn nhất, không sinh wrapper/abstraction thừa).
2. **Phát triển Giao diện Frontend, Styling & Trải nghiệm Người dùng (UX):**
   - Kết hợp `taste-skill` (chống giao diện khuôn mẫu/AI slop, tư duy Art Direction Awwwards), `ui-ux-pro-max` (Design System chuẩn mực, bảng màu SaaS, font pairing, CTA & spacing) và `impeccable` (quét 24 lỗi UI slop, giữ vững tính nhất quán và chất lượng sản phẩm).
3. **Biên tập Văn bản, Báo cáo ĐATN, Email HR & Lời thoại AI:**
   - Áp dụng `humanizer` (khử hoàn toàn văn phong máy móc AI, gọt giũa câu từ tự nhiên, mạch lạc, khúc chiết như người thật viết, không dùng từ sáo rỗng).


