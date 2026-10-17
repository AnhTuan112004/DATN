# 🎓 ĐỒ ÁN TỐT NGHIỆP: PEOPLEINSIGHT AI (v6.1 — FINAL FREEZE)

> **Tên đề tài:**
> **"Nghiên cứu và xây dựng hệ thống quản lý nhân sự doanh nghiệp thông minh tích hợp trí tuệ nhân tạo (PeopleInsight AI)"**
>
> *"Research and Development of an AI-Powered Enterprise Human Resource Management System (PeopleInsight AI)"*

> [!IMPORTANT]
> **Thời gian thực tế từ lịch trường:**
> | Mốc | Thời gian | Trọng tâm |
> |:---|:---|:---|
> | Phân công GVHD | 1/10 – 15/10/2026 | Khảo sát bài toán, chốt đề cương, chọn model nhận diện & test Gemini |
> | **Thực hiện ĐATN** | **15/10 – 15/12/2026 (9 tuần)** | **Code P0, làm thực nghiệm, viết báo cáo** |
> | Đóng băng code & Duyệt báo cáo | 15/12 – 30/12/2026 | Duyệt GVHD & GVPB, nâng gói Render duy trì ổn định đến ngày bảo vệ |
> | Hội đồng chấm ĐATN | 1/1 – 8/1/2027 | Báo cáo, trình chiếu demo thực tế |
> | Hoàn thiện hồ sơ | 9/1 – 15/1/2027 | Nộp bản lưu thư viện |

> [!CAUTION]
> **BẢN v6.1 LÀ BẢN ĐÓNG BĂNG KẾ HOẠCH CHÍNH THỨC.**
> Mọi thay đổi phát sinh trong quá trình code sẽ được ghi vào **changelog riêng** và chỉ liên quan đến chi tiết triển khai, không mở rộng scope.

> [!NOTE]
> **Phạm vi đối tượng thuế:** Payroll Engine chỉ hỗ trợ **cá nhân cư trú** có hợp đồng lao động **≥ 3 tháng**. Hợp đồng ngắn hơn và cá nhân không cư trú nằm ngoài phạm vi đồ án.

---

## MỤC LỤC

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
- Doanh nghiệp SME tại Việt Nam thường quản lý nhân sự phân mảnh: chấm công một nơi (máy vân tay cũ), tính lương bằng bảng tính Excel thủ công, giải quyết đơn từ qua tin nhắn rời rạc.
- Quy trình tính lương cuối tháng tốn nhiều thời gian đối soát thủ công, dễ sai sót khi tính toán tiền làm thêm giờ (OT), làm đêm, các khoản bảo hiểm và thuế TNCN theo các quy định mới hiệu lực năm 2026.
- Chưa có công cụ cảnh báo sớm biến động nhân sự (nguy cơ nghỉ việc) dựa trên dữ liệu định lượng; việc tra cứu quy chế, chế độ lao động phụ thuộc hoàn toàn vào bộ phận HR.

### 1.2 Bảng so sánh giải pháp (Khảo sát trung thực, trích dẫn nguồn thực tế)

> [!NOTE]
> Bảng khảo sát tôn trọng tính năng thực tế của các giải pháp thương mại tại Việt Nam. RAG được gắn nhãn **(P1)** vì chỉ triển khai nếu hoàn tất P0 trước Tuần 7.

| Tiêu chí so sánh | **PeopleInsight AI** (Đề tài) | **MISA AMIS HRM** [1] | **1Office** [2] | **Base.vn** (Base HRM) [3] |
|:---|:---:|:---:|:---:|:---:|
| **Chấm công nhận diện khuôn mặt** | ✅ Kiosk MediaPipe Liveness + Face Embedding | ✅ Tablet Kiosk & App Mobile | ⚠️ Tích hợp camera AI đối tác (HANET) [2] | ✅ Base Checkin (Base Vision) |
| **Chấm công GPS & QR Code** | ✅ Geofencing + QR động (HMAC nonce) | ✅ GPS, QR động, Wi-Fi | ⚠️ GPS, QR, Wi-Fi [2] | ⚠️ GPS, QR, Wi-Fi [3] |
| **Trợ lý AI hội thoại tiếng Việt** | ✅ Gemini Function Calling + RBAC | ✅ Trợ lý ảo MISA AVA | ⚠️ Trợ lý AI tạo sinh văn bản | ⚠️ Tích hợp bot cơ bản [3] |
| **Dự báo nghỉ việc (Turnover Prediction)** | ✅ ML có Feature Importance (XAI) | ❌ Không công bố công khai (10/2026) | ❌ Không công bố công khai (10/2026) | ❌ Không công bố công khai (10/2026) |
| **RAG tra cứu chính sách / BLLĐ** | ⚠️ **(P1)** RAG Vector Search | ❌ Chatbot theo kịch bản quy tắc | ❌ Không có RAG | ❌ Không có RAG |
| **Minh bạch thuật toán & Chỉ số thực nghiệm** | ✅ Công bố FAR, FRR, ROC, AUC, p95 | ❌ Thương mại đóng kín | ❌ Thương mại đóng kín | ❌ Thương mại đóng kín |
| **Mô hình tiếp cận & Mã nguồn** | ✅ Kiến trúc mở phục vụ nghiên cứu | ☁️ Thương mại độc quyền | ☁️ Thương mại độc quyền | ☁️ Thương mại độc quyền |

*Nguồn tham khảo (truy cập tháng 10/2026):*
- [1] MISA AMIS: amis.misa.vn — Hệ thống quản lý nhân sự tích hợp Chấm công khuôn mặt, trợ lý MISA AVA, GPS.
- [2] 1Office: 1office.vn — Nền tảng quản trị tổng thể doanh nghiệp; chấm công khuôn mặt thông qua tích hợp phần hardware camera AI đối tác (HANET); hỗ trợ GPS, QR.
- [3] Base.vn: base.vn — Bộ giải pháp Base HRM gồm Base Checkin (Base Vision), Base Timeoff, Base Payroll; tích hợp bot hỗ trợ cơ bản.

**Điểm khác biệt cốt lõi (Value Proposition) của đề tài PeopleInsight AI:**
1. **Kiến trúc Sinh trắc học 2 tầng:** Google MediaPipe Face Landmarker (Liveness Blendshapes) + mô hình Face Embedding chuyên biệt, so khớp an toàn phía Server.
2. **AI Function Calling có kiểm soát ngữ cảnh & RBAC:** Mọi thao tác truy xuất thông tin cá nhân đều qua các hàm kiểm quyền nghiêm ngặt; số liệu lương do Backend render bằng template (Phương án A).
3. **Mô hình học máy dự báo nghỉ việc có giải thích (XAI):** Huấn luyện trên IBM Attrition, trích xuất Feature Importance.
4. **Báo cáo thực nghiệm mở:** Đánh giá định lượng chi tiết (FAR/FRR trên đường cong ROC, AUC-ROC, kiểm thử tải).

---

## 2. PHÂN TẦNG PHẠM VI P0 / P1 / P2 & THỨ TỰ LÙI DỰ PHÒNG {#2-pham-vi}

> [!IMPORTANT]
> **Quy tắc 9 tuần:** Hội đồng chấm dựa trên **chiều sâu kỹ thuật, tính chính xác nghiệp vụ và khả năng giải thích**, không chấm số lượng tính năng chưa hoàn thiện.

### P0 — BẮT BUỘC LÀM SÂU (9 tuần cốt lõi)
1. **Xác thực & RBAC 4 cấp:** CEO / HR Manager / Manager / Employee. `companyId` sẵn sàng multi-tenant.
2. **Hồ sơ nhân viên & Sơ đồ tổ chức:** Cây phòng ban 2 cấp, hợp đồng lao động dạng mảng, cảnh báo hết hạn hợp đồng.
3. **Chấm công Đa phương thức:**
   - **FaceID Kiosk:** MediaPipe Liveness Blendshapes + Face Embedding (model xác định sau spike, so khớp Server, ngưỡng hiệu chỉnh theo ROC).
   - **Chấm công Di động:** GPS Geofencing + QR Code động (HMAC nonce 30s).
   - **Giải trình công.**
4. **Đơn từ & Phê duyệt 2 cấp (Manager → HR).**
5. **Payroll Engine chuẩn 2026:**
   - Tham số hóa chính sách theo `effectiveFrom/To`.
   - Miễn thuế OT / làm đêm / phép chưa nghỉ / tiền ăn ca theo Luật 109/2025/QH15 (áp dụng cho **kỳ tính thuế 2026**, tức cả 12 tháng cho cá nhân cư trú; xem mục 4.5 và [payroll-2026.md](.agents/skills/peopleinsight-architecture/references/payroll-2026.md)).
   - Biểu thuế 5 bậc (10M-30M-60M-100M), BHXH 2 chiều có trần.
   - **Bộ 22 unit test cases** chuẩn xác đối chiếu khớp 100% với Excel.
6. **Chatbot HR AI (Gemini Function Calling) — Phương án A (Template Rendering):** LLM chỉ chọn tool + tham số; số liệu lương do Backend render bằng template, không gửi qua LLM.
   - **Cảnh báo bất thường Rule-based + Template.**
7. **Dự báo nghỉ việc (ML):** IBM Attrition, Feature Importance, Dashboard.
8. **Audit Log & Thông báo real-time Socket.io.**

### P1 — NẾU KỊP (Chỉ làm nếu P0 xong sớm)
- WebAuthn/Passkey, RAG tra cứu chính sách, Cảnh báo Proactive ML (> 0.7), Đổi ca & Công tác, ATS-lite & AI CV Screening, Docker Compose.

### P2 — HƯỚNG PHÁT TRIỂN (Không code trong ĐATN)
- Tích hợp máy chấm công ZKTeco/Ronald Jack, OKR, xếp ca OR-Tools, Multi-tenant SaaS.

### ⚠️ Thứ tự lùi dự phòng
Nếu cuối Tuần 4 Payroll Engine chậm:
1. Cắt LLM viết văn cho cảnh báo → 100% template tĩnh.
2. Tạm hoãn QR Code động → Chỉ GPS.
3. Tạm hoãn Giải trình công → HR sửa trực tiếp.
👉 **Giữ 4 trụ:** FaceID Kiosk, Payroll Engine, Chatbot Function Calling, ML Dự báo.

---

## 3. KIẾN TRÚC HỆ THỐNG & KIẾN TRÚC SINH TRẮC HỌC 2 TẦNG {#3-kien-truc}

### 3.1 Kiến trúc tổng thể hệ thống

```
┌──────────────────────────────────────────────────────────────┐
│   FRONTEND (React 19 + TypeScript + Vite)                    │
│   ├── MediaPipe Face Landmarker (Wasm/WebGL 60 FPS)          │
│   ├── Face Embedding Extractor (model xác định sau spike)    │
│   └── Giao diện người dùng (không lộ Gemini API Key)         │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTPS / WSS (Cùng Apex Domain)
┌────────────────────▼─────────────────────────────────────────┐
│   BACKEND (Node.js LTS + Express)                            │
│   ├── Auth & RBAC Middleware (JWT Kép: Access 15p + Refresh) │
│   ├── Face Vector Matching Service (Cosine / Euclidean)      │
│   ├── Payroll Engine (Tham số hóa 2026, Transaction MongoDB) │
│   ├── AI Module: Gemini Function Calling (SDK @google/genai) │
│   └── ML Inference Service (Dự báo nghỉ việc)                │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐       ┌─────────────────────────────────┐
│ MongoDB Atlas │       │ Google Gemini API               │
│ (11 Colls)    │       │ GEMINI_MODEL (dòng 3.x only)    │
│ 9 P0 + 2 P1   │       │ Fallback: 3.5-flash → 3.1-lite  │
└───────────────┘       └─────────────────────────────────┘
```

> [!IMPORTANT]
> **Model AI:** Chỉ dòng 3.x (`gemini-3.5-flash` → `gemini-3.1-flash-lite`, cấu hình linh hoạt qua biến môi trường `GEMINI_MODEL`). Dòng `gemini-2.0-flash` đã deprecated. Smoke test Function Calling ngay Spike Tuần 0.

---

### 3.2 Kiến trúc Chấm công Khuôn mặt 2 tầng (Hybrid Biometrics)

```
[Luồng Video từ Camera Kiosk / Thiết bị]
         │
         ▼
[TẦNG 1: Google MediaPipe Face Landmarker] (Client-side)
  ├── 478 3D Landmarks & Transformation Matrix (Pitch / Yaw / Roll)
  ├── 52 Facial Blendshapes (eyeBlink, jawOpen)
  └── Liveness Check (chống ảnh tĩnh 2D / replay video đơn giản)
         │
     (Nếu ĐẠT Liveness)
         ▼
[TẦNG 2: Căn chỉnh & Face Embedding] (Client / Server)
  ├── Face Alignment dựa trên toạ độ 2 mắt từ Landmark
  ├── Trích xuất Vector Embedding bằng model (xác định sau spike)
  └── Gửi Vector + Kiosk Token (Hash SHA-256) lên Backend API
         │
         ▼
[Xác thực Danh tính tại Backend]
  ├── So khớp Cosine / Euclidean với faceTemplates
  └── Ngưỡng hiệu chỉnh qua đường cong ROC thực nghiệm
         │
         ▼
[Ghi nhận lượt Chấm công Thành công]
```

---

### 3.3 Kiến trúc Chatbot HR AI — Phương án A (Template Rendering)

```
Người dùng đặt câu hỏi
    │
    ▼
Backend nhận request (userId & role từ JWT)
    │
    ▼
Gọi Gemini với 4 Tools P0 (userId tự động lấy từ JWT tại Backend):
    ├── get_leave_balance()
    ├── get_payslip(month, year)
    ├── get_attendance_summary(from, to)
    └── get_team_leave_stats(departmentId) — Chỉ HR/Manager
    │
    ▼
Mỗi Tool kiểm tra RBAC → Truy vấn DB → Trả kết quả cho Backend
    │
    ▼
Backend render kết quả bằng template Markdown cố định → Trả client
(Backend dừng ngay sau khi nhận Tool Call; TUYỆT ĐỐI KHÔNG gửi functionResponse ngược lại cho LLM để đảm bảo số liệu thực không đi qua mô hình AI)
    │
    ▼
Ghi log: auditLogs (userId, tool, input, latencyMs)
```

---

## 4. CHỨC NĂNG P0 CHI TIẾT {#4-p0}

### 4.1 Xác thực & Phân quyền (Auth & RBAC)
- Token kép: Access 15p + Refresh 7 ngày (HttpOnly Cookie, SameSite=Lax/Strict).
- Tối đa 5 phiên đồng thời, phát hiện tái sử dụng Refresh Token → Thu hồi toàn bộ.
- RBAC 4 cấp: CEO → HR Manager → Manager → Employee. `companyId` cô lập dữ liệu.

### 4.2 Hồ sơ Nhân viên & Cơ cấu Tổ chức
- CRUD nhân viên, ảnh Cloudinary, cây phòng ban 2 cấp (`parentId`).
- Hợp đồng: mảng `contracts[]` có `effectiveFrom/To/status`. Cron nhắc trước 30/60 ngày.

### 4.3 Chấm công Đa phương thức
- **Kiosk FaceID:** MediaPipe Liveness + Face Embedding tại Server; ngưỡng từ ROC thực tế.
- **GPS Geofencing:** Haversine, `accuracy < 50m`, bán kính 100m. Toạ độ cấu hình qua Admin UI, seed "Phòng bảo vệ ĐATN" cho demo.
- **QR Code động:** `HMAC-SHA256(userId + timestamp + nonce, secret)`, chu kỳ 30s, nonce 1 lần.
- **Xử lý bất thường:** Cron Idempotent chốt ABSENT; Đơn giải trình công.

### 4.4 Đơn từ & Phê duyệt 2 cấp
- Manager → HR Manager. Loại đơn: ANNUAL, SICK, OT (kiểm trần 40h/tháng), WFH, FORGOT_CHECKIN.
- Real-time qua Socket.io.

### 4.5 Payroll Engine chuẩn 2026
- Phạm vi: Cá nhân cư trú, hợp đồng ≥ 3 tháng.
- Công thức 3 bước: Tổng thu nhập -> Thu nhập chịu thuế -> Thu nhập tính thuế.
- **Đổi mới Thuế TNCN 2026:** Toàn bộ 100% tiền làm thêm giờ OT (150%, 200%, 300%) được miễn thuế TNCN nếu nằm trong giới hạn luật định (Điều 98 BLLĐ, $\le 4\text{h}$/ngày, $\le 40\text{h}$/tháng, $\le 200\text{h}$/năm). Phần vượt trần giờ hoặc vượt hệ số Điều 98 tính vào chịu thuế.
- Biểu thuế 5 bậc: 10M (5%), 30M (10%), 60M (20%), 100M (30%), >100M (35%).
- Giảm trừ gia cảnh (NQ 110/2025/UBTVQH15): Bản thân 15.5M, người phụ thuộc 6.2M.
- Hai mốc chính sách năm 2026 (áp dụng theo `periodDate` cho bảo hiểm và `payDate` cho thuế/ăn ca):
  * 1/1 – 30/6/2026: Trần BHXH 46.8M (NĐ 161/2026 & Luật BHXH 2024), tiền ăn ca miễn thuế 730.000đ (NĐ 253/2026).
  * Từ 1/7/2026: Trần BHXH 50.6M, tiền ăn ca miễn thuế 1.200.000đ.
- Trần BHTN = 20 × Lương tối thiểu vùng (Vùng I = 106.200.000đ).
- OT đêm (Điều 57 NĐ 145/2020): Ngày thường 200% (không làm thêm ban ngày trước đó) hoặc 210% (có làm thêm ban ngày trước đó); 270% (nghỉ tuần); 390% (lễ tết).
- Bộ 22 test case đối chiếu khớp 100% với Excel.

### 4.6 Chatbot HR AI & Cảnh báo Bất thường
- SDK `@google/genai`, model dòng 3.x.
- 4 Tools: `get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`.
- Dừng sau `functionCall`, render template Markdown tĩnh.
- Cảnh báo Rule-based: Đi muộn ≥ 3 ngày, quên check-out ≥ 2 lần/tuần, OT chạm 35–40h, HĐ còn ≤ 30 ngày.

### 4.7 Dự báo Nguy cơ Nghỉ việc (ML)
- Huấn luyện trên IBM Attrition với 6 đặc trưng định lượng: `OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
- Loại bỏ `Gender`, `Age`, `MaritalStatus`.
- Dashboard HR trực quan hóa Feature Importance.

---

## 5. CHỨC NĂNG P1 (CHỈ LÀM NẾU P0 XONG SỚM) {#5-p1}
1. **RAG tra cứu chính sách công ty (`policyChunks`):** Atlas Vector Search; lưu ý lọc multi-tenant qua tham số `filter: { companyId: { $eq: tenantId } }` bên trong `$vectorSearch`.
2. **Hỗ trợ sàng lọc hồ sơ ứng viên bằng AI (`jobPostings` ATS-lite):**
   - AI chỉ đóng vai trò trích xuất thông tin có cấu trúc (kỹ năng, số năm kinh nghiệm, học vấn) và đưa ra gợi ý phân loại (`RECOMMENDED` / `CONSIDER` / `LOW_MATCH` — Ưu tiên xem xét / Cần xem xét / Ít phù hợp); con người giữ quyền quyết định tiếp nhận (tránh rủi ro tự động loại ứng viên).
   - Điểm số tính toán bằng rubric code tất định trong backend; LLM chỉ tóm tắt nhận xét điểm mạnh/yếu định tính.
   - Cơ chế bảo vệ: Ẩn thông tin định danh (tên, ảnh, giới tính, tuổi) trước khi gửi LLM; coi nội dung CV là dữ liệu không tin cậy (chống prompt injection); ứng viên phải chấp thuận xử lý dữ liệu cá nhân; dùng CV giả lập cho demo và thực nghiệm; có phương án dự phòng cho file scan.
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
- **Bộ luật Lao động 2019 (Luật số 45/2019/QH14) & Nghị định 145/2020/NĐ-CP (Điều 57):**
  * Làm thêm giờ ngày thường: $\ge 150\%$; ngày nghỉ hàng tuần: $\ge 200\%$; ngày lễ tết: $\ge 300\%$.
  * OT đêm ngày thường: 200% (không làm thêm ngày trước đó) hoặc 210% (có làm thêm ngày trước đó); 270% (nghỉ tuần); 390% (lễ tết).
  * Giới hạn giờ làm thêm: $\le 4\text{h}/\text{ngày}, \le 40\text{h}/\text{tháng}, \le 200\text{h}/\text{năm}$.
- **Luật Thuế Thu nhập Cá nhân sửa đổi (Luật số 109/2025/QH15) & Nghị định 253/2026/NĐ-CP:**
  * Điểm đổi mới 2026: Miễn thuế TNCN toàn bộ 100% tiền làm thêm giờ trong hạn mức luật định. Phần giờ vượt trần hoặc hệ số vượt Điều 98 tính vào thu nhập chịu thuế.
  * Biểu thuế lũy tiến từng phần 5 bậc mới (10M, 30M, 60M, 100M).
  * Giảm trừ gia cảnh (NQ 110/2025/UBTVQH15): Bản thân 15.5M/tháng, người phụ thuộc 6.2M/người/tháng.
  * Trần tiền ăn ca miễn thuế (Điều 8 & 69 NĐ 253/2026): 730k (trước 01/07/2026) và 1.2M (từ 01/07/2026).
- **Luật Bảo hiểm Xã hội 2024 & Nghị định 161/2026/NĐ-CP:**
  * Trần đóng BHXH/BHYT: 46.8M (trước 01/07/2026) và 50.6M (từ 01/07/2026).
  * Trần BHTN: 20 × Lương tối thiểu vùng (Vùng I: 106.2M theo NĐ 293/2025/NĐ-CP).
  * Khoản 3 Điều 85 Luật BHXH: Nghỉ ốm $\ge 14$ ngày làm việc trong tháng được miễn đóng BHXH tháng đó.
- **Luật Bảo vệ Dữ liệu Cá nhân (BVDLCN):**
  * Dữ liệu sinh trắc học khuôn mặt được bảo mật qua mã hóa AES-256-GCM tầng ứng dụng, không lưu ảnh thô, xóa ngay khi rút chấp thuận.
- Chi tiết tham chiếu đầy đủ: xem [payroll-2026.md](../.agents/skills/peopleinsight-architecture/references/payroll-2026.md).

---

## 10. THIẾT KẾ THỰC NGHIỆM & BẰNG CHỨNG BÁO CÁO {#10-thuc-nghiem}
1. **Thực nghiệm FaceID Kiosk (Đã hoàn thành Spike Tuần 0):**
   * Tập thử nghiệm 40 lượt (20 genuine, 12 impostor, 8 spoof attack 2D) trên 10 đối tượng mẫu.
   * Kết quả: Khoảng cách phân tách an toàn $\Delta = 0.225 > 0$, tỷ lệ chặn giả mạo 100%, độ trễ trung bình 42.8ms, 54.5 FPS.
2. **Thực nghiệm Payroll Engine 2026:**
   * Bộ **22 test cases** trong `backend/tests/payroll/calc.test.js` kiểm chứng tự động khớp 100% từng đồng với bảng tính Excel đối chiếu.
3. **Thực nghiệm Chatbot HR AI:**
   * Bộ kiểm thử 130 test prompts đánh giá độ chính xác gọi tool (Target: Accuracy $\ge 95\%$, Hallucination $= 0\%$).
4. **Thực nghiệm Tải & Bảo mật (Tuần 8):**
   * Load test k6: $\ge 100$ concurrent virtual users tại Kiosk check-in, p95 latency $< 1500\text{ms}$.
   * Quét lỗ hổng OWASP ZAP baseline: 0 High, 0 Critical; kiểm thử IDOR trên API.
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

*Chi tiết quy chuẩn thể thức in ấn, lề trang, cỡ chữ, dãn dòng xem tại tài liệu riêng:* [QUY_DINH_TRINH_BAY_NTU.md](QUY_DINH_TRINH_BAY_NTU.md) *(đối chiếu với văn bản chính thức của trường hoặc GVHD).*

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

*(Bản kế hoạch chi tiết mở rộng toàn diện: xem tại [PLAN_FULL.md](docs/PLAN_FULL.md)).*


