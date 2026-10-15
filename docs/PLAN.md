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
5. [Chức năng P1 (Nếu kịp sau Tuần 7)](#5-p1)
6. [Thiết kế CSDL Tinh gọn (11 MongoDB Collections)](#6-database)
7. [Tech Stack chuẩn hóa](#7-tech-stack)
8. [Lộ trình 9 tuần thực tế](#8-lo-trinh)
9. [Tuân thủ pháp lý Việt Nam & Nghiệp vụ lương 2026](#9-phap-ly)
10. [Thiết kế thực nghiệm & Bằng chứng báo cáo](#10-thuc-nghiem)
11. [Rủi ro triển khai & Phương án dự phòng](#11-rui-ro)
12. [Đề cương 5 Chương chuẩn ĐATN](#12-de-cuong)
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
   - Miễn thuế OT / làm đêm / phép chưa nghỉ / tiền ăn ca theo Luật 109/2025/QH15 (áp dụng cho **kỳ tính thuế 2026**, tức cả 12 tháng cho cá nhân cư trú; xem 4.5.3).
   - Biểu thuế 5 bậc (10M-30M-60M-100M), BHXH 2 chiều có trần.
   - **≥ 21 test case** (bộ 22 dòng) đối chiếu Excel.
6. **Chatbot HR AI (Gemini Function Calling) — Phương án A (Template Rendering):** LLM chỉ chọn tool + tham số; số liệu lương do Backend render bằng template, không gửi qua LLM.
   - **Cảnh báo bất thường Rule-based + Template.**
7. **Dự báo nghỉ việc (ML):** IBM Attrition, Feature Importance, Dashboard.
8. **Audit Log & Thông báo real-time Socket.io.**

### P1 — NẾU KỊP (sau Tuần 7)
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
│ 9 P0 + 2 P1   │       │ Fallback: 3.0-flash → 3.1-lite  │
└───────────────┘       └─────────────────────────────────┘
```

> [!IMPORTANT]
> **Model AI:** Chỉ dòng 3.x (`gemini-3.0-flash` → `gemini-3.1-flash-lite`, cấu hình linh hoạt qua biến môi trường `GEMINI_MODEL`). Dòng `gemini-2.0-flash` đã deprecated. Smoke test Function Calling ngay Spike Tuần 0.

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
- Biểu thuế 5 bậc: 10M (5%), 30M (10%), 60M (20%), 100M (30%), >100M (35%).
- Giảm trừ gia cảnh: Bản thân 15.5M, người phụ thuộc 6.2M.
- Hai mốc chính sách năm 2026:
  * 1/1 – 30/6/2026: Trần BHXH 46.8M, tiền ăn ca miễn thuế 730.000đ.
  * Từ 1/7/2026: Trần BHXH 50.6M, tiền ăn ca miễn thuế 1.200.000đ.
- Trần BHTN = 20 × Lương tối thiểu vùng (Vùng I = 106.200.000đ).
- OT đêm: 210% (ngày thường), 270% (nghỉ tuần), 390% (lễ tết).
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

## 5. CHỨC NĂNG P1 (NẾU KỊP SAU TUẦN 7) {#5-p1}
1. WebAuthn / Passkey.
2. RAG tra cứu chính sách công ty (`policyChunks`).
3. Cảnh báo Proactive ML (> 0.7).
4. Đổi ca & Công tác.
5. ATS-lite & AI CV Screening (`jobPostings`).
6. Docker Compose.

---

## 6. THIẾT KẾ CSDL TINH GỌN (11 MongoDB Collections) {#6-database}
1. `companies` (P0)
2. `users` (P0)
3. `faceTemplates` (P0)
4. `departments` (P0)
5. `attendanceLogs` (P0)
6. `leaveRequests` (P0)
7. `payrolls` (P0)
8. `notifications` (P0)
9. `auditLogs` (P0)
10. `policyChunks` (P1)
11. `jobPostings` (P1)

---

## 7. TECH STACK CHUẨN HÓA {#7-tech-stack}
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, `@mediapipe/tasks-vision`, TanStack Query.
- **Backend:** Node.js v20+ LTS, Express 5, Mongoose v8, MongoDB Atlas, `@google/genai` (Gemini 3.x), Socket.io.
- **ML:** Python scikit-learn (IBM Attrition train → export weights JSON/ONNX chạy ở Node.js).
- **Test:** Jest, Supertest, k6.

---

## 8. LỘ TRÌNH 9 TUẦN (13/10/2026 – 15/12/2026) {#8-lo-trinh}
- **Tuần 0 (13–15/10):** Spike FaceID + Gemini 3.x Function Calling + Setup Monorepo.
- **Tuần 1 (16–22/10):** Auth & RBAC + Profile + Deploy khung Vercel + Render.
- **Tuần 2 (23–29/10):** FaceID Kiosk Liveness + GPS + QR.
- **Tuần 3 (30/10–5/11):** Đơn từ duyệt 2 cấp + Socket.io + FaceID thực nghiệm đợt 1.
- **Tuần 4 (6–12/11):** Payroll P1 (BHXH, biểu thuế 5 bậc). Checkpoint cắt giảm nếu chậm.
- **Tuần 5 (13–19/11):** Payroll P2 (OT, đêm, miễn thuế, 22 test case). Payroll freeze.
- **Tuần 6 (20–26/11):** Chatbot Phương án A + Cảnh báo Rule-based (130 test prompts).
- **Tuần 7 (27/11–3/12):** ML Dự báo + Dashboard HR. **FEATURE FREEZE.**
- **Tuần 8 (4–10/12):** Load test k6 + OWASP ZAP + UAT SUS ≥ 75.
- **Tuần 9 (11–15/12):** Nộp báo cáo, slide, video demo dự phòng, đóng băng toàn bộ.
- **Đệm (15/12/2026–8/1/2027):** Duy trì hệ thống, bảo vệ trước Hội đồng.
