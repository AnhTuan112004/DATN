# CHƯƠNG 3: PHÂN TÍCH YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG

---

## 3.1. PHÂN TÍCH YÊU CẦU HỆ THỐNG
- 3.1.1. Yêu cầu chức năng (Functional Requirements):
  - Nhóm 1: Quản trị tài khoản, xác thực đa phiên, phân quyền RBAC 4 cấp (`CEO`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`).
  - Nhóm 2: Chấm công đa phương thức (Kiosk FaceID 2 tầng, GPS Geofencing, Dynamic QR 30 giây).
  - Nhóm 3: Quản lý hồ sơ nhân viên, hợp đồng lao động, sơ đồ tổ chức phòng ban 2 cấp.
  - Nhóm 4: Nộp và duyệt đơn từ 2 cấp cố định (ANNUAL, SICK, OT, WFH, FORGOT_CHECKIN).
  - Nhóm 5: Động cơ tính lương tự động, khóa kỳ lương nguyên tử, tra cứu phiếu lương.
  - Nhóm 6: Trợ lý ảo HR AI hỏi đáp chính sách và tra cứu dữ liệu cá nhân theo Phương án A.
  - Nhóm 7: Dashboard phân tích biến động nhân sự và cảnh báo nguy cơ thôi việc.
- 3.1.2. Yêu cầu phi chức năng (Non-functional Requirements):
  - Hiệu năng: Độ trễ API p95 < 200ms; độ trễ chấm công FaceID < 100ms; FPS camera $\ge 30$.
  - An toàn thông tin: Mã hóa mật khẩu bcrypt, JWT Access/Refresh tokens xoay vòng (HttpOnly Cookie), phòng chống IDOR, SQL/NoSQL Injection, XSS, CSRF.
  - Tính sẵn sàng và khả năng mở rộng: Kiến trúc Stateless REST API, MongoDB M0/Cluster.
  - Tính khả dụng: Giao diện trực quan, responsive tương thích mobile và desktop, UAT SUS $\ge 75$.

## 3.2. MÔ HÌNH ĐE DỌA (THREAT MODEL) VÀ THIẾT KẾ AN TOÀN BẢO MẬT
- 3.2.1. Đe dọa tấn công chấm công giả mạo (Presentation Attack / Spoofing) và giải pháp Liveness 2 tầng.
- 3.2.2. Đe dọa tấn công chuyển quyền bất hợp pháp (IDOR) trên API phiếu lương / đơn từ và giải pháp kiểm tra quyền sở hữu tại Backend.
- 3.2.3. Đe dọa rò rỉ dữ liệu cá nhân nhạy cảm qua LLM (Data Exfiltration via GenAI) và giải pháp Phương án A (Template Rendering).
- 3.2.4. Đe dọa chiếm đoạt phiên đăng nhập (Token Hijacking) và giải pháp Refresh Token Rotation với cơ chế phát hiện tái sử dụng token.

## 3.3. KIẾN TRÚC HỆ THỐNG TỔNG THỂ VÀ THIẾT KẾ KIOSK FACEID 2 TẦNG
- 3.3.1. Sơ đồ kiến trúc tổng thể Client - Server - Database - AI Engine.
- 3.3.2. Thiết kế chi tiết luồng Kiosk FaceID 2 tầng:
  - Cơ chế bắt tay cấp thử thách ngẫu nhiên từ Server (Challenge-Response nonce có thời hạn 60s).
  - Luồng đánh giá Liveness trên WebAssembly MediaPipe tại Client.
  - Luồng trích xuất vector 128 chiều và so khớp với `faceTemplates`.
- 3.3.3. Thiết kế Dynamic QR Code: Mã hóa HMAC-SHA256 với chu kỳ 30s và nonce dùng 1 lần (Single-use Nonce).
- 3.3.4. Thiết kế GPS Geofencing: Thuật toán khoảng cách Haversine và bán kính cho phép.

## 3.4. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN 11 COLLECTIONS (ERD & DATA DICTIONARY)
- 3.4.1. Sơ đồ quan hệ thực thể (ERD) và chiến lược nhúng tài liệu (Embedding vs Referencing).
- 3.4.2. Đặc tả chi tiết 9 Collections cốt lõi (P0):
  1. `companies`: Cấu hình toàn công ty, ca làm việc, GPS, thiết bị Kiosk, chính sách thuế 2 mốc, bảo hiểm, ngày lễ.
  2. `users`: Hồ sơ nhân sự, chức vụ, nhúng `contracts[]`, `leaveBalance`, `salaryConfig`, `refreshTokens[]`.
  3. `faceTemplates`: Lưu trữ vector sinh trắc học 128 chiều tách biệt, mã hóa at-rest.
  4. `departments`: Cây phòng ban 2 cấp (`parentDepartmentId`, `managerId`).
  5. `attendanceLogs`: Nhật ký chấm công (FACE, GPS, QR, MANUAL_ADJUSTMENT).
  6. `leaveRequests`: Đơn từ kèm luồng duyệt 2 cấp (`managerApproval`, `hrApproval`).
  7. `payrolls`: Bảng lương chốt kỳ, snapshot tham số, khóa kỳ nguyên tử (`periodLockedAt`).
  8. `notifications`: Thông báo hệ thống thời gian thực (Socket.io).
  9. `auditLogs`: Nhật ký kiểm toán mọi hành vi nhạy cảm.
- 3.4.3. Đặc tả 2 Collections mở rộng (P1): `policyChunks`, `jobPostings`.

## 3.5. THIẾT KẾ API RESTFUL, PHÂN QUYỀN RBAC VÀ GIAO TIẾP THỜI GIAN THỰC
- 3.5.1. Thiết kế định dạng phản hồi API chuẩn (`success`, `data`, `message`, `errorCode`).
- 3.5.2. Ma trận phân quyền RBAC 4 cấp (`CEO`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`).
- 3.5.3. Thiết kế luồng sự kiện Socket.io cho thông báo tức thời.
- 3.5.4. Đặc tả tài liệu Swagger / OpenAPI 3.0.
