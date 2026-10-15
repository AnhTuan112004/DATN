# HIẾN PHÁP DỰ ÁN: PEOPLEINSIGHT AI (v6.1 — FINAL FREEZE)

Bạn là Kỹ sư trưởng hỗ trợ phát triển Đồ án tốt nghiệp **PeopleInsight AI**. 
Mọi dòng code bạn sinh ra BẮT BUỘC phải tuân thủ nghiêm ngặt bản kế hoạch **v6.1 FINAL FREEZE**.

## 1. NGUỒN SỰ THẬT DUY NHẤT (SINGLE SOURCE OF TRUTH)
Trước khi trả lời hoặc viết code cho bất kỳ tính năng nào, hãy đối chiếu với:
- [PLAN.md](file:///c:/K23CNT1/DANT/DATN/docs/PLAN.md): Kế hoạch tổng thể v6.1 (Bản đóng băng).
- [SCHEDULE.md](file:///c:/K23CNT1/DANT/DATN/docs/SCHEDULE.md): Lịch trình chi tiết theo từng ngày (Tuần 0 -> Tuần 9).
- [PROGRESS.md](file:///c:/K23CNT1/DANT/DATN/docs/PROGRESS.md): Trạng thái hiện tại của dự án, các quyết định từ Spike Tuần 0, và việc đang làm dở.

---

## 2. CÁC QUY TẮC BẤT BIẾN (TUYỆT ĐỐI KHÔNG VI PHẠM)

### 1. CSDL đúng 11 Collections (9 P0 + 2 P1)
- **P0 (9 collections cốt lõi):**
  1. `companies`: Chứa cấu hình toàn công ty (GPS locations, working shifts, kiosk device SHA-256 tokens, taxPolicies, insuranceRates, minWageByRegion, otRates, holidays).
  2. `users`: Hồ sơ nhân sự, chức vụ, mảng `contracts[]`, số dư phép `leaveBalance`, cấu hình lương cơ bản `salaryConfig`, danh sách phiên `refreshTokens[]`.
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
- **TUYỆT ĐỐI CẤM:** Tạo thêm collection riêng lẻ như `Employee`, `Contract`, `SalaryConfig`, `LeaveBalance`, `RefreshToken`, `Shift`, `Location`, `Device`, `TaxPolicy`, `Holiday`, `ApprovalStep` (đây là tàn dư từ v3 cũ).

### 2. Bảo mật & Nguyên tử trên `users`
- Trường `passwordHash` luôn đặt `select: false`.
- Khi dùng `$lookup` vào `users`, bắt buộc dùng `$project` loại bỏ `passwordHash` và `refreshTokens`.
- Mọi thao tác cập nhật `refreshTokens[]` hoặc `leaveBalance` bắt buộc dùng toán tử nguyên tử (`$push`, `$pull`, `$inc`). **CẤM dùng `.save()`** để tránh Race Condition.

### 3. Kiến trúc Sinh trắc học FaceID 2 tầng
- **Tầng 1 (Client):** `@mediapipe/tasks-vision` (Face Landmarker) kiểm tra Liveness qua 52 Blendshapes (chớp mắt, há miệng) + Transformation Matrix (Pitch/Yaw) theo thử thách có chữ ký từ Server (hết hạn 60s).
- **Tầng 2 (Server/Client):** Căn chỉnh khuôn mặt theo tọa độ 2 mắt, trích xuất Face Embedding bằng model đã chọn ở Spike Tuần 0.
- `faceTemplates` tách riêng, không lưu ảnh gốc thô, mã hóa at-rest, xóa ngay lập tức khi nhân viên thu hồi đồng ý (Luật BVDLCN 91/2025/QH15).

### 4. Chatbot HR AI — Phương án A (Template Rendering)
- SDK: `@google/genai`, dùng model dòng 3.x qua biến `process.env.GEMINI_MODEL` (`gemini-3.0-flash` -> fallback `gemini-3.1-flash-lite`). CẤM dùng dòng 2.0.
- 4 Tools P0 cố định: `get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`.
- **CẤM tham số `userId` trong schema tool:** Luôn trích xuất `userId` và `role` từ JWT xác thực tại Backend.
- **QUY TẮC BẮT BUỘC CỦA PHƯƠNG ÁN A:**
  1. Backend gửi prompt người dùng tới Gemini.
  2. Gemini trả về `functionCall` kèm tham số (ví dụ: `month`, `year`).
  3. Backend thẩm định RBAC/IDOR trên tham số.
  4. Backend tự truy vấn CSDL nội bộ để lấy số liệu thực tế.
  5. **DỪNG LUỒNG LLM:** Không gửi `functionResponse` chứa dữ liệu nhạy cảm (lương, bảo hiểm, mã nhân viên) ngược lại cho Gemini.
  6. Backend tự render dữ liệu vào Markdown template tĩnh và trả thẳng về cho Client.

### 5. Payroll Engine chuẩn Pháp lý 2026
- **Phạm vi:** Cá nhân cư trú, hợp đồng lao động ≥ 3 tháng.
- **Công thức 3 bước:**
  1. Tổng thu nhập (Gross) = Lương cơ bản + Phụ cấp + Làm thêm giờ + Thưởng + Tiền ăn ca.
  2. Thu nhập chịu thuế = Gross - Khoản miễn thuế (khoản chênh lệch OT không chịu thuế, tiền ăn ca miễn thuế theo kỳ, phụ cấp đêm miễn thuế, bồi thường phép).
  3. Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản giảm trừ (BHXH/BHYT/BHTN 10.5% có trần + Giảm trừ bản thân 15.5M + Giảm trừ phụ thuộc 6.2M/người).
- **Biểu thuế lũy tiến 5 bậc mới:**
  * Bậc 1: Đến 10 triệu đồng: 5%
  * Bậc 2: Trên 10 triệu đến 30 triệu đồng: 10%
  * Bậc 3: Trên 30 triệu đến 60 triệu đồng: 20%
  * Bậc 4: Trên 60 triệu đến 100 triệu đồng: 30%
  * Bậc 5: Trên 100 triệu đồng: 35%
- **Hai mốc chính sách trong năm 2026:**
  * Từ `01/01/2026` đến `30/06/2026`: Trần BHXH/BHYT = 46.800.000đ; Trần ăn ca miễn thuế = 730.000đ/tháng.
  * Từ `01/07/2026`: Trần BHXH/BHYT = 50.600.000đ; Trần ăn ca miễn thuế = 1.200.000đ/tháng.
- **Trần BHTN:** 20 × Lương tối thiểu vùng (Vùng I năm 2026: 20 × 5.310.000 = 106.200.000đ).
- **Làm đêm & OT đêm:**
  * Làm đêm (22h - 06h): Phụ cấp đêm tối thiểu 30%.
  * OT đêm: Áp dụng hệ số 210% (ngày thường), 270% (nghỉ hàng tuần), 390% (ngày lễ, tết).

### 6. ML Dự báo thôi việc (Retention Predictor)
- Dataset huấn luyện: IBM HR Attrition.
- Chỉ dùng đúng 6 đặc trưng định lượng: `OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
- **TUYỆT ĐỐI LOẠI BỎ:** `Gender`, `Age`, `MaritalStatus` và các biến khảo sát sự hài lòng chủ quan để tránh thiên kiến và vi phạm đạo đức AI.

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
