# 🎓 KẾ HOẠCH TỔNG THỂ TOÀN DIỆN: PEOPLEINSIGHT AI (v6.1 FINAL FREEZE — BẢN ĐẦY ĐỦ)

> **Tên đề tài:**  
> **"Nghiên cứu và xây dựng hệ thống quản lý nhân sự doanh nghiệp thông minh tích hợp trí tuệ nhân tạo (PeopleInsight AI)"**  
> *"Research and Development of an AI-Powered Enterprise Human Resource Management System (PeopleInsight AI)"*  
> **Sinh viên thực hiện:** Nguyễn Anh Tuấn (MSV: 2310900113, Lớp: K23CNT1) — ĐH Nguyễn Trãi  
> **Giảng viên hướng dẫn:** ThS. Lê Trọng Nhất  
> **Phiên bản:** v6.1 FINAL FREEZE (Đóng băng kế hoạch chính thức)

---

## MỤC LỤC CHI TIẾT

1. [Bài toán & Khảo sát đối thủ (Trung thực & Có kiểm chứng)](#1-bai-toan)
2. [Phân tầng phạm vi P0 / P1 / P2 & Thứ tự lùi dự phòng](#2-pham-vi)
3. [Kiến trúc hệ thống & Kiến trúc Sinh trắc học 2 tầng](#3-kien-truc)
4. [Chức năng P0 chi tiết (Làm sâu)](#4-p0)
5. [Chức năng P1 (Chỉ làm nếu P0 xong sớm)](#5-p1)
6. [Thiết kế CSDL Tinh gọn (11 MongoDB Collections)](#6-database)
7. [Tech Stack chuẩn hóa](#7-tech-stack)
8. [Lộ trình 9 tuần thực tế (Kèm viết báo cáo song song)](#8-lo-trinh)
9. [Tuân thủ pháp lý Việt Nam & Nghiệp vụ lương 2026](#9-phap-ly)
10. [Thiết kế thực nghiệm & Bằng chứng báo cáo](#10-thuc-nghiem)
11. [Rủi ro triển khai & Phương án dự phòng](#11-rui-ro)
12. [Bản đồ nội dung 4 Chương chuẩn ĐATN NTU](#12-de-cuong)
13. [Hướng phát triển tương lai (P2 + Xa hơn)](#13-phat-trien)
14. [Checklist bảo vệ ĐATN](#14-checklist)

---

## 1. BÀI TOÁN & KHẢO SÁT ĐỐI THỦ (TRUNG THỰC & CÓ KIỂM CHỨNG) {#1-bai-toan}

### 1.1 Thực trạng & Bài toán tại doanh nghiệp vừa và nhỏ (SME)
- Doanh nghiệp SME tại Việt Nam thường quản lý nhân sự phân mảnh: chấm công bằng máy vân tay cũ dễ ùn tắc hoặc gian lận; tính lương bằng bảng tính Excel thủ công với nguy cơ sai sót cao; quản lý đơn từ qua tin nhắn chat rời rạc.
- Quy trình tính lương cuối tháng tốn nhiều ngày đối soát thủ công, đặc biệt phức tạp khi tính toán tiền làm thêm giờ (OT), làm đêm, các khoản bảo hiểm và thuế TNCN theo các quy định mới hiệu lực năm 2026.
- Chưa có công cụ cảnh báo sớm biến động nhân sự (nguy cơ nghỉ việc) dựa trên dữ liệu định lượng; việc tra cứu quy chế, chế độ lao động phụ thuộc hoàn toàn vào bộ phận HR.

### 1.2 Bảng so sánh giải pháp thực tế
| Tiêu chí so sánh | **PeopleInsight AI** (Đề tài) | **MISA AMIS HRM** | **1Office** | **Base.vn** (Base HRM) |
|:---|:---:|:---:|:---:|:---:|
| **Chấm công nhận diện khuôn mặt** | Kiosk MediaPipe Liveness + Vector Embedding (AES-256-GCM) | Tablet Kiosk & App Mobile | Tích hợp camera AI đối tác | Base Checkin (Base Vision) |
| **Chống gian lận sinh trắc học** | Chuỗi thời gian (chớp mắt, quay đầu) + Nonce 1 lần | Nhận diện tĩnh khuôn mặt | Phụ thuộc camera phần cứng | Nhận diện tĩnh qua app |
| **Payroll chuẩn pháp lý 2026** | Biểu 5 bậc 2026, 2 mốc chính sách, miễn 100% OT hợp lệ | Biểu 7 bậc cũ / cập nhật thủ công | Cấu hình công thức động | Base Payroll (công thức tùy biến) |
| **Chatbot HR nội bộ** | Ép Tool Calling + Markdown Template tĩnh (Phương án A) | Chưa có Chatbot AI sâu | Chatbot FAQ cơ bản | Base Virtual Assistant (FAQ) |
| **Dự báo nguy cơ thôi việc** | Machine Learning định lượng (6 đặc trưng IBM) + XAI | Thống kê tỷ lệ biến động | Báo cáo tỷ lệ nghỉ việc | Báo cáo nhân sự định kỳ |
| **Multi-tenancy & Bảo mật** | Fail-Closed cả Đọc & Ghi (`tenantStore`) | Độc lập phân tán | Multi-tenant SaaS | Multi-tenant SaaS |

---

## 2. PHÂN TẦNG PHẠM VI P0 / P1 / P2 & THỨ TỰ LÙI DỰ PHÒNG {#2-pham-vi}

### 2.1 Bảng phân tầng tính năng
- **P0 (9 Tính năng cốt lõi — Bắt buộc hoàn thành 100% trước cuối Tuần 7):**
  1. Xác thực & Phân quyền RBAC 4 cấp (CEO, HR Manager, Dept Manager, Employee).
  2. Quản lý Hồ sơ nhân sự, cây phòng ban 2 cấp, hợp đồng lao động `contracts[]`.
  3. Chấm công Kiosk FaceID 2 tầng (Client Liveness + Server Verify) & GPS Geofencing & QR động.
  4. Quản lý Đơn từ và Luồng duyệt 2 cấp cố định (Manager $\rightarrow$ HR Manager).
  5. Payroll Engine 2026 (Biểu thuế 5 bậc, 2 mốc chính sách, miễn 100% OT hợp lệ, 22 test cases pass 100%).
  6. Chatbot HR AI Phương án A (Ép Tool Calling `mode: ANY`, Backend render template tĩnh, dừng luồng LLM).
  7. ML Dự báo nguy cơ nghỉ việc (6 đặc trưng định lượng từ IBM Attrition, loại bỏ hoàn toàn biến nhạy cảm).
  8. Hệ thống Cảnh báo HR tự động (Rule-based: đi muộn $\ge 3$ ngày, OT chạm ngưỡng 35–40h, HĐ sắp hết hạn).
  9. Audit Log toàn diện ghi nhận mọi hành động nhạy cảm, chấm công, gọi tool AI.
- **P1 (Tính năng nâng cao — Chỉ triển khai nếu P0 hoàn tất sớm):**
  1. RAG tra cứu nội quy lao động công ty (`policyChunks`).
  2. Hỗ trợ sàng lọc hồ sơ ứng viên bằng AI (`jobPostings` ATS-lite).
  3. WebAuthn / Passkey đăng nhập không mật khẩu.
  4. Docker Compose hoàn chỉnh một lệnh chạy toàn bộ môi trường.
- **P2 (Hướng phát triển tương lai — Ngoài phạm vi đồ án):**
  - Ứng dụng di động Native (React Native/Flutter), tích hợp camera giám sát phần cứng chuyên dụng.

### 2.2 Thứ tự lùi dự phòng khi chậm tiến độ (Checkpoint Cuối Tuần 4)
Nếu cuối Tuần 4 kiểm tra tiến độ Payroll Engine bị chậm, áp dụng cắt giảm theo thứ tự:
1. Cảnh báo HR: Giữ 100% template tĩnh rule-based.
2. Hoãn QR Code động, tập trung duy trì GPS Geofencing và FaceID Kiosk.
3. Hoãn quy trình giải trình công, HR chỉnh sửa bản ghi chấm công trực tiếp trên giao diện Admin.
*Bất biến:* Luôn bảo vệ 4 trụ cột chính: (1) FaceID Kiosk, (2) Payroll Engine 2026, (3) Chatbot Function Calling, (4) ML Dự báo nghỉ việc.

---

## 3. KIẾN TRÚC HỆ THỐNG & KIẾN TRÚC SINH TRẮC HỌC 2 TẦNG {#3-kien-truc}

### 3.1 Kiến trúc tổng thể hệ thống
Hệ thống PeopleInsight AI được thiết kế theo mô hình Monorepo (Frontend Vite React + Backend Express Mongoose):
- **Client (Web Application & Kiosk):** React 19, TypeScript, TailwindCSS, `@mediapipe/tasks-vision`.
- **Backend API Server:** Node.js v20+, Express 5, Mongoose 8, `AsyncLocalStorage` (`tenantStore`).
- **AI / ML Services:** `@google/genai` (Gemini 3.5 Flash & 3.1 Flash Lite), scikit-learn / `onnxruntime-node`.
- **Database:** MongoDB Atlas (11 Collections tinh gọn).

### 3.2 Kiến trúc Sinh trắc học FaceID 2 tầng & Bảo mật Vector
- **Tầng 1 (Client Liveness theo Chuỗi Thời gian):**
  * Sử dụng `@mediapipe/tasks-vision` (Face Landmarker), cấu hình `numFaces: 1` (phát hiện $> 1$ mặt $\rightarrow$ từ chối ngay).
  * Kiểm tra chuỗi trạng thái sinh lý học liên tục: mắt mở ($< 0.2$) $\rightarrow$ nhắm ($> 0.5$) $\rightarrow$ mở lại ($< 0.2$) trong khoảng $100 - 800\text{ms}$; quay đầu Yaw chính diện $\rightarrow$ lệch $\ge 25^\circ \rightarrow$ về chính diện.
  * Thử thách gắn Nonce ngẫu nhiên dùng 1 lần trong RAM server (TTL 60s). Client gửi $V_{\text{start}}$ và $V_{\text{end}}$ để server đối chiếu $d(V_{\text{start}}, V_{\text{end}}) \le 0.40$.
- **Tầng 2 (Bảo mật Vector Sinh trắc học & So khớp 1:N):**
  * Không lưu ảnh thô. Trường `descriptors` trong `faceTemplates` mã hóa AES-256-GCM ở tầng ứng dụng (Application-Layer Encryption dùng khóa trong `.env`).
  * Kiểm soát biên chênh lệch 2 ứng viên gần nhất ($d_1 \le \text{Threshold}$ và $d_2 - d_1 \ge 0.15$). Nếu không thỏa mãn, chuyển sang xác minh 1:1 (nhập mã NV hoặc quét QR trước).
  * Lấy mẫu (Enrollment) bắt buộc do HR giám sát tại văn phòng. Xóa vĩnh viễn vector khi nhân viên rút đồng ý hoặc nghỉ việc theo Luật BVDLCN.

---

## 4. CHỨC NĂNG P0 CHI TIẾT {#4-p0}

### 4.1 Xác thực & Phân quyền (Auth & RBAC)
- Token kép: Access Token (15 phút, Bearer) + Refresh Token (7 ngày, HttpOnly Cookie `SameSite=Lax`, `Secure`).
- Xoay vòng Refresh Token (Rotation) kèm Grace Window 10–30s chống logout oan do 2 tab gửi cùng lúc, tối đa 5 phiên, dọn dẹp token hết hạn bằng `$pull`, tuyệt đối cấm dùng `.save()`.
- Phân quyền tập trung qua hàm `canAccess(user, resource, action)`. Quản lý (`MANAGER`) tuyệt đối không được xem lương nhân viên.

### 4.2 Hồ sơ Nhân sự & Cơ cấu Tổ chức
- CRUD nhân viên, cây phòng ban 2 cấp (`parentId`), mảng hợp đồng `contracts[]` (PROBATION, DEFINITE, INDEFINITE).
- Projection bảo vệ dữ liệu nhạy cảm: `passwordHash`, `refreshTokens[]`, `salaryConfig` luôn đặt `select: false`.

### 4.3 Chấm công Đa phương thức
- **Kiosk FaceID:** Liveness chuỗi thời gian + Face embedding AES-256-GCM.
- **GPS Geofencing:** Haversine, `accuracy < 50m`, bán kính 100m.
- **QR Code động:** `HMAC-SHA256(userId + timestamp + nonce, secret)`, chu kỳ 30s.
- **Xử lý bất thường:** Cron idempotent chốt ABSENT; đơn giải trình công.

### 4.4 Đơn từ & Phê duyệt 2 cấp Cố định
- Luồng duyệt cố định 2 cấp: `PENDING_MANAGER` $\rightarrow$ `MANAGER_APPROVED` $\rightarrow$ `APPROVED` (bởi HR).
- Duyệt phép nguyên tử: Cập nhật trạng thái và trừ số dư phép `leaveBalance.annualRemaining` trong **1 MongoDB Transaction**, chống trừ phép trùng lặp.

### 4.5 Payroll Engine chuẩn Pháp lý 2026
- Phạm vi: Cá nhân cư trú, hợp đồng lao động $\ge 3$ tháng.
- Không hard-code số liệu; logic đọc tham số động từ `companies.settings`.
- **Đổi mới Thuế TNCN 2026:** Toàn bộ 100% tiền lương làm thêm giờ (150%, 200%, 300%) được miễn thuế TNCN nếu thỏa mãn giới hạn giờ ($\le 4\text{h}$/ngày, $\le 40\text{h}$/tháng, $\le 200\text{h}$/năm) và mức trả không vượt Điều 98 BLLĐ.
- Biểu thuế 5 bậc: 10M (5%), 30M (10%), 60M (20%), 100M (30%), >100M (35%).
- Hai mốc chính sách năm 2026:
  * 01/01 – 30/06/2026: Trần BHXH/BHYT 46.8M; trần ăn ca miễn thuế 730.000đ.
  * Từ 01/07/2026: Trần BHXH/BHYT 50.6M; trần ăn ca miễn thuế 1.200.000đ.
- Phân định rõ: `periodDate` (tháng công cho bảo hiểm) và `payDate` (ngày trả cho thuế & ăn ca).
- OT đêm chuẩn Điều 57 NĐ 145/2020: 200% (không làm ngày trước đó) hoặc 210% (có làm ngày trước đó); 270% (nghỉ tuần); 390% (lễ tết).
- Bộ **22 unit test cases** chuẩn xác đối chiếu khớp 100% với bảng tính Excel.

### 4.6 Chatbot HR AI Phương án A
- SDK `@google/genai`, model `gemini-3.5-flash` (dự phòng `gemini-3.1-flash-lite`).
- Ép tool calling (`mode: ANY`), thêm tool `unsupported_request`.
- Chèn ngày/tháng/năm thời gian thực (`Asia/Ho_Chi_Minh`) vào `systemInstruction`.
- Validate tham số bằng Zod `.strict()`, dừng luồng LLM sau khi nhận tool call, Backend tự truy vấn CSDL và render template Markdown tĩnh.
- Tách template phiếu lương làm 2 khối riêng biệt (Thực nhận Net $\leftrightarrow$ Thông tin tính thuế TNCN tham chiếu, không trừ giảm trừ gia cảnh vào lương).

### 4.7 Dự báo Nguy cơ Nghỉ việc (ML)
- Huấn luyện trên IBM HR Attrition với 6 đặc trưng định lượng: `OverTime` ($\ge 4\text{h}$ gán $= 1$), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
- Loại bỏ hoàn toàn `Gender`, `Age`, `MaritalStatus`. Dashboard trực quan hóa Feature Importance.

---

## 5. CHỨC NĂNG P1 (CHỈ LÀM NẾU P0 XONG SỚM) {#5-p1}
1. **RAG tra cứu chính sách công ty (`policyChunks`):** Atlas Vector Search; lưu ý lọc multi-tenant qua tham số `filter` bên trong `$vectorSearch`.
2. **Hỗ trợ sàng lọc hồ sơ ứng viên bằng AI (`jobPostings` ATS-lite):**
   - AI chỉ đóng vai trò trích xuất thông tin có cấu trúc (kỹ năng, kinh nghiệm) và hỗ trợ gợi ý (`RECOMMENDED`, `CONSIDER`, `LOW_MATCH`), con người giữ quyền quyết định tiếp nhận.
   - Điểm số tính toán bằng rubric code tất định; LLM chỉ tóm tắt nhận xét định tính.
   - Bảo vệ an toàn: ẩn PII trước khi gửi LLM, xử lý chống prompt injection, dữ liệu cá nhân có chấp thuận, CV mẫu dùng cho demo.
   - Giới hạn mảng nhúng `candidates[]` tối đa $\le 200$ hồ sơ/tin tuyển dụng để tránh vượt kích thước document 16MB của MongoDB.
3. **WebAuthn / Passkey:** Đăng nhập không mật khẩu bằng vân tay/FaceID trên thiết bị cá nhân.
4. **Docker Compose:** Khởi tạo toàn bộ ứng dụng bằng một câu lệnh.

---

## 6. THIẾT KẾ CSDL TINH GỌN (11 MONGODB COLLECTIONS) {#6-database}
1. `companies` (P0) — Cấu hình toàn công ty (GPS, shifts, kiosk tokens, taxPolicies, insuranceRates, minWageByRegion, otRates).
2. `users` (P0) — Hồ sơ nhân sự, hợp đồng `contracts[]`, số dư phép `leaveBalance`, lương `salaryConfig`.
3. `faceTemplates` (P0) — Vector sinh trắc học AES-256-GCM (`descriptors[]`, `modelId`, `consentPolicyVersion`).
4. `departments` (P0) — Cây phòng ban 2 cấp (`parentId`, `managerId`).
5. `attendanceLogs` (P0) — Nhật ký chấm công (FACE, GPS, QR, deviceId, location).
6. `leaveRequests` (P0) — Đơn từ và vết phê duyệt 2 cấp.
7. `payrolls` (P0) — Bảng lương chốt theo kỳ, khóa kỳ nguyên tử (`periodLockedAt`).
8. `notifications` (P0) — Thông báo thời gian thực qua Socket.io.
9. `auditLogs` (P0) — Nhật ký kiểm toán các hành động nhạy cảm, chấm công, gọi tool AI.
10. `policyChunks` (P1) — Văn bản nội quy phục vụ RAG vector search.
11. `jobPostings` (P1) — Tin tuyển dụng và danh sách hồ sơ ứng viên bóc tách.

---

## 7. TECH STACK CHUẨN HÓA {#7-tech-stack}
- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS / TailwindCSS, `@mediapipe/tasks-vision`, TanStack Query.
- **Backend:** Node.js v20+ LTS, Express 5, Mongoose 8, MongoDB Atlas, `@google/genai`, Socket.io, Zod.
- **ML / AI:** Python scikit-learn (huấn luyện IBM Attrition) $\rightarrow$ ONNX runtime qua `onnxruntime-node` trên Node.js.
- **Testing & Security:** Jest 29, Supertest 7, k6 load testing, OWASP ZAP baseline.

---

## 8. LỘ TRÌNH 9 TUẦN THỰC TẾ (KÈM VIẾT BÁO CÁO SONG SONG) {#8-lo-trinh}

| Tuần | Thời gian | Trọng tâm Phát triển & Thực nghiệm | Báo cáo Viết song song |
|:---:|:---|:---|:---|
| **Tuần 0** | 13–15/10/2026 | Spike FaceID (40 trials), Gemini 3.x Function Calling, Monorepo Setup, Seed 50 NV | Soạn đề cương, viết bản nháp Chương 1 (Bối cảnh, Mục tiêu, Phạm vi) |
| **Tuần 1** | 16–22/10/2026 | Auth & RBAC, Tenant Plugin Fail-Closed Đọc/Ghi, Profile NV, Deploy Vercel/Render | Hoàn thiện Chương 1 (Nền tảng công nghệ, Khung pháp lý 2026) |
| **Tuần 2** | 23–29/10/2026 | FaceID Kiosk Liveness chuỗi thời gian, GPS Geofencing, QR Code động | Viết Chương 2.1–2.3 (Yêu cầu chức năng, Use Case, Kiến trúc hệ thống) |
| **Tuần 3** | 30/10–05/11/2026 | Đơn từ duyệt 2 cấp, Transaction trừ phép, Socket.io, FaceID thực nghiệm đợt 1 | Viết Chương 2.4–2.6 (Thiết kế cơ sở dữ liệu 11 collections, Threat Model) |
| **Tuần 4** | 06–12/11/2026 | Payroll P1 (BHXH, biểu thuế 5 bậc, 2 mốc chính sách). Checkpoint lùi dự phòng | Viết Chương 3.1–3.2 (Thuật toán FaceID 2 tầng, Thuật toán Payroll Engine) |
| **Tuần 5** | 13–19/11/2026 | Payroll P2 (100% miễn thuế OT, OT đêm Điều 57, pass 22 unit tests). Payroll Freeze | Hoàn thiện Chương 3 (Chatbot Phương án A, Mô hình ML Attrition) |
| **Tuần 6** | 20–26/11/2026 | Chatbot HR AI Phương án A, Cảnh báo HR tự động, kiểm thử 130 test prompts | Viết Chương 4.1–4.3 (Thực nghiệm FaceID FAR/FRR, Thực nghiệm Payroll vs Excel) |
| **Tuần 7** | 27/11–03/12/2026 | ML Dự báo nghỉ việc ONNX, Dashboard HR trực quan hóa. **FEATURE FREEZE** | Viết Chương 4.4–4.6 (Thực nghiệm ML, Đánh giá Chatbot, k6 Load test) |
| **Tuần 8** | 04–10/12/2026 | Load test k6, quét bảo mật OWASP ZAP, khảo sát UAT người dùng (SUS $\ge 75$) | Hoàn thiện toàn bộ Chương 4 và Viết Kết luận ($\le 2$ trang) |
| **Tuần 9** | 11–15/12/2026 | Rà soát lỗi, in ấn báo cáo, thiết kế Slide ($\le 15$ slide), quay video demo dự phòng | Nộp bản thảo duyệt GVHD, đóng băng toàn bộ sản phẩm |

---

## 9. TUÂN THỦ PHÁP LÝ VIỆT NAM & NGHIỆP VỤ LƯƠNG 2026 {#9-phap-ly}
- **Bộ luật Lao động 2019 (Luật số 45/2019/QH14):**
  * Điều 98 & Điều 57 Nghị định 145/2020/NĐ-CP: Tiền lương làm thêm giờ ngày thường ($\ge 150\%$), ngày nghỉ hàng tuần ($\ge 200\%$), ngày lễ tết ($\ge 300\%$). OT đêm ngày thường: 200% (không làm thêm ngày) hoặc 210% (có làm thêm ngày).
  * Điều 107: Giới hạn làm thêm giờ $\le 4\text{h}/\text{ngày}, \le 40\text{h}/\text{tháng}, \le 200\text{h}/\text{năm}$.
- **Luật Thuế Thu nhập Cá nhân sửa đổi (Luật số 109/2025/QH15) & Nghị định 253/2026/NĐ-CP:**
  * Điểm đổi mới 2026: Miễn thuế TNCN toàn bộ 100% tiền làm thêm giờ trong hạn mức luật định.
  * Biểu thuế lũy tiến từng phần 5 bậc mới.
  * Nghị quyết số 110/2025/UBTVQH15: Giảm trừ bản thân 15.5M/tháng, giảm trừ người phụ thuộc 6.2M/người/tháng.
  * Nghị định 253/2026/NĐ-CP (Điều 8, Điều 69): Trần tiền ăn ca miễn thuế 730k (trước 01/07/2026) và 1.2M (từ 01/07/2026).
- **Luật Bảo hiểm Xã hội 2024 (Luật số 41/2024/QH15) & Nghị định 161/2026/NĐ-CP:**
  * Trần đóng BHXH/BHYT ($20 \times \text{Lương cơ sở}$): 46.8M (kỳ trước 01/07/2026) và 50.6M (từ 01/07/2026).
  * Trần BHTN: $20 \times \text{Lương tối thiểu vùng}$ (Vùng I năm 2026: 106.2M theo NĐ 293/2025/NĐ-CP).
  * Khoản 3 Điều 85 Luật BHXH: Nghỉ ốm $\ge 14$ ngày làm việc trong tháng được miễn đóng BHXH tháng đó.
- **Luật Bảo vệ Dữ liệu Cá nhân (BVDLCN 91/2025/QH15):**
  * Dữ liệu sinh trắc học khuôn mặt là dữ liệu nhạy cảm: mã hóa AES-256-GCM tầng ứng dụng, không lưu ảnh thô, xóa ngay khi rút chấp thuận.

---

## 10. THIẾT KẾ THỰC NGHIỆM & BẰNG CHỨNG BÁO CÁO {#10-thuc-nghiem}
1. **Thực nghiệm FaceID Kiosk (Đã hoàn thành Spike Tuần 0):**
   * Tập thử nghiệm 40 lượt (20 genuine, 12 impostor, 8 spoof attack 2D) trên 10 đối tượng mẫu.
   * Kết quả: Khoảng cách phân tách an toàn $\Delta = 0.225 > 0$, tỷ lệ chặn giả mạo 100%, độ trễ trung bình 42.8ms, 54.5 FPS.
2. **Thực nghiệm Payroll Engine 2026:**
   * Bộ 22 test cases trong `backend/tests/payroll/calc.test.js` kiểm chứng tự động khớp 100% từng đồng với bảng tính Excel đối chiếu.
3. **Thực nghiệm Chatbot HR AI:**
   * Bộ kiểm thử 130 test prompts đánh giá độ chính xác gọi tool (Target: Accuracy $\ge 95\%$, Hallucination $= 0\%$).
4. **Thực nghiệm Tải & Bảo mật (Tuần 8):**
   * Load test k6: $\ge 100$ concurrent virtual users tại Kiosk check-in, p95 latency $< 1500\text{ms}$.
   * Quét lỗ hổng OWASP ZAP baseline: 0 High, 0 Critical.
   * Khảo sát UAT người dùng: Điểm System Usability Scale (SUS) $\ge 75/100$.

---

## 11. RỦI RO TRIỂN KHAI & PHƯƠNG ÁN DỰ PHÒNG {#11-rui-ro}
1. **Rủi ro cạn Quota Gemini API:** Fallback tự động sang `gemini-3.1-flash-lite` hoặc template tĩnh báo bận, không làm sập server.
2. **Rủi ro camera Kiosk góc chụp xấu / thiếu sáng:** Cơ chế chuyển đổi tự động sang xác minh 1:1 qua mã QR hoặc mã PIN nhân viên.
3. **Rủi ro môi trường Render thiếu thư viện C++ build `onnxruntime-node`:** Kiểm thử build binary ngay Tuần 1; dự phòng bằng mô hình Logistic Regression chạy thuần qua JSON weights trong JavaScript.
4. **Rủi ro thay đổi chính sách lương/thuế:** Toàn bộ tham số lưu động trong `companies.settings`, chỉ cần cập nhật dữ liệu cấu hình mà không sửa mã nguồn.

---

## 12. BẢN ĐỒ NỘI DUNG 4 CHƯƠNG CHUẨN ĐATN NTU {#12-de-cuong}

Cấu trúc báo cáo tuân thủ quy định của Khoa CNTT & CĐS — Trường Đại học Nguyễn Trãi (Tổng dung lượng 62–75 trang, nằm trong khoảng chuẩn 60–80 trang):

| Chương | Tiêu đề chương chuẩn | Nội dung học thuật & Kỹ thuật chi tiết | Số trang dự kiến |
|:---:|:---|:---|:---:|
| **Chương 1** | **Tổng quan & Nền tảng công nghệ** | Bối cảnh chuyển đổi số HRM, khảo sát trung thực các giải pháp (MISA, 1Office, Base.vn); mục tiêu và phạm vi giới hạn của đề tài; cơ sở lý thuyết MediaPipe Face Landmarker & Face Embedding; lý thuyết LLM Function Calling; lý thuyết Học máy giải thích được (XAI); **khung pháp lý tiền lương - thuế TNCN 2026** và Luật Bảo vệ dữ liệu cá nhân. | **15 – 18 trang** |
| **Chương 2** | **Phân tích thiết kế hệ thống** | Phân tích yêu cầu chức năng và phi chức năng; biểu đồ Use Case tổng quát và chi tiết; thiết kế kiến trúc hệ thống tổng thể; mô hình mối đe dọa (Threat Model); kiến trúc bảo mật Multi-tenancy Fail-Closed; ma trận phân quyền RBAC; đặc tả luồng API; thiết kế giao diện người dùng. | **15 – 18 trang** |
| **Chương 3** | **Thuật toán và cơ sở dữ liệu** | Thiết kế CSDL tinh gọn 11 Collections; thuật toán kiểm tra Liveness chuỗi thời gian & mã hóa vector AES-256-GCM; **thuật toán tính lương 3 bước chuẩn 2026** (cơ chế miễn thuế OT, tra cứu chính sách động); quy trình Chatbot Phương án A; mô hình ML dự báo nguy cơ thôi việc. | **18 – 22 trang** |
| **Chương 4** | **Kết quả thực nghiệm & Đánh giá** | Báo cáo thực nghiệm FaceID (chỉ số FAR, FRR, ROC, khoảng cách phân tách an toàn); thực nghiệm đối soát Payroll Engine 22 test cases so với Excel; thực nghiệm 130 test prompts Chatbot AI; kết quả huấn luyện mô hình ML; kết quả kiểm thử tải k6; đánh giá an ninh OWASP ZAP & IDOR; khảo sát mức độ hài lòng người dùng UAT (SUS $\ge 75$); phân tích các hạn chế của hệ thống. | **12 – 15 trang** |
| **Kết luận** | **Kết luận & Hướng phát triển** | Tóm tắt các kết quả đạt được, đóng góp chính của đề tài, các điểm hạn chế và hướng nghiên cứu mở rộng trong tương lai. | **$\le$ 2 trang** |

*Chi tiết quy chuẩn thể thức in ấn, lề trang, cỡ chữ, dãn dòng xem tại tài liệu riêng:* [QUY_DINH_TRINH_BAY_NTU.md](QUY_DINH_TRINH_BAY_NTU.md).

---

## 13. HƯỚNG PHÁT TRIỂN TƯƠNG LAI (P2 + XA HƠN) {#13-phat-trien}
- Ứng dụng di động Native hỗ trợ chấm công offline có mã hóa đồng bộ.
- Tích hợp thiết bị phần cứng chấm công chuyên dụng qua giao thức MQTT/WebSocket an toàn.
- Hệ thống tuyển dụng tự động tích hợp phỏng vấn video AI phân tích biểu cảm.

---

## 14. CHECKLIST BẢO VỆ ĐATN {#14-checklist}
- [ ] Mã nguồn Backend & Frontend đạt chuẩn linter, không còn cảnh báo bảo mật nghiêm trọng.
- [ ] Bộ 22 test cases Payroll Engine pass 100%.
- [ ] Báo cáo Word/PDF hoàn chỉnh 60–80 trang theo đúng mẫu NTU.
- [ ] Slide thuyết trình cô đọng $\le 15$ slide.
- [ ] Video demo dự phòng (Full HD, 3–5 phút) đề phòng sự cố mạng khi báo cáo trước Hội đồng.
- [ ] Hệ thống deploy chạy ổn định trên Render & Vercel.
