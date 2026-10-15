---
name: peopleinsight-v6-expert
description: Chuyên gia kiến trúc và triển khai dự án PeopleInsight AI (v6.1 FINAL FREEZE), bao gồm chuẩn 11 collections MongoDB, FaceID Kiosk 2 tầng, Payroll Engine 2026 22 cases, HR Chatbot Phương án A, và ML Retention 6 đặc trưng.
---

# PEOPLEINSIGHT AI — v6.1 FINAL FREEZE ARCHITECTURE SKILL

Kỹ năng này cung cấp kiến thức nền tảng và bộ quy tắc kỹ thuật chuyên sâu cho toàn bộ hệ thống PeopleInsight AI. Khi sinh mã nguồn hoặc tư vấn kiến trúc, bắt buộc phải áp dụng các tiêu chuẩn dưới đây:

## 1. CƠ SỞ DỮ LIỆU: 11 COLLECTIONS CHUẨN

```
MongoDB Database: peopleinsight
├── companies               (P0 - Cấu hình tập trung settings)
├── users                   (P0 - Nhân viên, contracts[], leaveBalance, refreshTokens[])
├── faceTemplates           (P0 - Vector sinh trắc học, tách riêng biệt)
├── departments             (P0 - Cây phòng ban 2 cấp)
├── attendanceLogs          (P0 - Nhật ký chấm công FACE/GPS/QR)
├── leaveRequests           (P0 - Đơn từ duyệt 2 cấp)
├── payrolls                (P0 - Bảng lương chốt kỳ + snapshot tham số)
├── notifications           (P0 - Thông báo real-time)
├── auditLogs               (P0 - Kiểm toán an ninh & AI logs)
├── policyChunks            (P1 - RAG nội quy công ty)
└── jobPostings             (P1 - Tuyển dụng & sàng lọc CV)
```

### Các quy tắc Mongoose:
- Mọi model P0 đều có `companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true }`.
- `users.passwordHash`: `{ type: String, required: true, select: false }`.
- Cấm dùng `.save()` khi cập nhật mảng `refreshTokens[]` hoặc số dư `leaveBalance`. Luôn dùng `User.findByIdAndUpdate(id, { $push: ... })` hoặc `{ $inc: ... }`.

## 2. CHATBOT HR AI — PHƯƠNG ÁN A (TEMPLATE RENDERING)
- SDK: `@google/genai`
- Dòng Model: `gemini-3.0-flash` (dự phòng: `gemini-3.1-flash-lite`), cấu hình qua `process.env.GEMINI_MODEL`.
- 4 Tools P0:
  1. `get_leave_balance()`
  2. `get_payslip(month, year)`
  3. `get_attendance_summary(month, year)`
  4. `get_team_leave_stats(departmentId, month, year)` (Chỉ dành cho Manager/HR/CEO)
- **CẤM:** Không được truyền `userId` trong parameters của tool. `userId` và `role` phải được lấy an toàn từ `req.user` (JWT payload).
- **Luồng Phương án A:**
  1. Gửi tin nhắn của người dùng cùng khai báo Function Calling tới Gemini.
  2. Khi Gemini trả về `functionCall`, Backend nhận diện tên tool và tham số.
  3. Backend kiểm tra quyền (RBAC) và xác thực tham số chống IDOR.
  4. Backend trực tiếp truy vấn MongoDB.
  5. **DỪNG LUỒNG LLM:** Không gửi `functionResponse` ngược lại cho Gemini.
  6. Backend dùng Markdown template điền trực tiếp dữ liệu vào và trả về cho Client.

## 3. PAYROLL ENGINE PHÁP LÝ VIỆT NAM 2026
- **Công thức 3 bước:**
  * Bước 1: Gross = Lương theo hợp đồng / ngày công chuẩn * ngày công thực tế + Làm thêm giờ + Phụ cấp + Thưởng.
  * Bước 2: Thu nhập chịu thuế = Gross - (Phần miễn thuế OT + Tiền ăn ca miễn thuế theo kỳ + Phụ cấp đêm miễn thuế).
  * Bước 3: Thu nhập tính thuế = Thu nhập chịu thuế - (BHXH/BHYT/BHTN 10.5% + Giảm trừ bản thân 15.5M + Giảm trừ phụ thuộc 6.2M * số người).
- **2 Kỳ chính sách 2026:**
  * Kỳ trước 01/07/2026: Trần BHXH/BHYT = 46.800.000đ; Trần ăn ca miễn thuế = 730.000đ/tháng.
  * Kỳ từ 01/07/2026: Trần BHXH/BHYT = 50.600.000đ; Trần ăn ca miễn thuế = 1.200.000đ/tháng.
- **Biểu thuế 5 bậc:**
  1. <= 10M: 5%
  2. 10M - 30M: 10%
  3. 30M - 60M: 20%
  4. 60M - 100M: 30%
  5. > 100M: 35%
- **OT & Làm đêm:**
  * OT ngày thường: 150%, nghỉ hàng tuần: 200%, lễ tết: 300%.
  * Làm đêm (22h - 06h): +30% phụ cấp đêm.
  * OT đêm: 210% (ngày thường), 270% (nghỉ tuần), 390% (lễ tết).
- **22 Test Cases:** Bắt buộc phải pass toàn bộ trong `backend/tests/payroll/calc.test.js`.

## 4. FACEID KIOSK 2 TẦNG
- **Tầng 1 (Client):** MediaPipe Face Landmarker kiểm tra Liveness bằng chớp mắt (`eyeBlinkLeft`/`eyeBlinkRight` > 0.5), há miệng (`jawOpen` > 0.3) và quay đầu (Pitch/Yaw) tương ứng với thử thách ngẫu nhiên từ Server.
- **Tầng 2:** Căn chỉnh 2 mắt (affine transformation), trích xuất Face Embedding descriptor.
- Server so khớp khoảng cách Cosine / Euclidean với descriptor trong `faceTemplates`.
- Mã hóa `faceTemplates` at-rest, xóa vĩnh viễn khi nhân viên rút đồng ý (Luật 91/2025/QH15).

## 5. ML DỰ BÁO NGHỈ VIỆC
- IBM HR Attrition dataset.
- Đúng 6 đặc trưng: `OverTime` (0/1), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa quantile 0-1), `NumCompaniesWorked`, `DistanceFromHome`.
- Cấm đưa vào: `Gender`, `Age`, `MaritalStatus`.
- Xuất mô hình sang Node.js chạy offline (JSON coefficients hoặc ONNX).
