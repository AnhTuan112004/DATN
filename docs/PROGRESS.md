# TRẠNG THÁI TIẾN ĐỘ DỰ ÁN (PROGRESS TRACKER)

## 1. THÔNG TIN HIỆN TẠI
- **Ngày hiện tại:** Thứ Năm, 15/10/2026 (Ngày cuối Tuần 0: 13–15/10/2026)
- **Giai đoạn:** Spike Kỹ thuật & Khởi tạo Khung Monorepo
- **Mục tiêu hôm nay (Thứ Năm, 15/10/2026):**
  1. [x] Spike ② Gemini: Đã test thành công 4/4 tools P0 với `gemini-3-flash-preview`.
  2. [x] Spike ① FaceID: Đã dựng xong trang test bench `http://localhost:5173/`, nạp model offline, chốt vector 128-D.
  3. [x] Đo thử nghiệm FaceID thực tế (≥ 10 người / ảnh mẫu), lưu file `trials.csv`.
  4. [x] Viết script seed mở rộng đủ 50 nhân viên giả lập (có OT, đi muộn, phép, hợp đồng).
  5. [x] Dựng khung báo cáo ĐATN 5 chương tại `docs/report/`, nháp Chương 1.1–1.2.
  6. [x] Chuẩn bị họp GVHD chốt đề cương.
  7. [x] Tạm hoãn mua domain riêng sang Tuần 8–9 theo quyết định kỹ thuật.

---

## 2. CÁC QUYẾT ĐỊNH KỸ THUẬT ĐÃ CHỐT
*(Được cập nhật tự động sau mỗi Spike hoặc cột mốc hàng tuần)*

- **Cơ sở dữ liệu:** Đã kết nối thành công tới MongoDB (`localhost:27017/peopleinsight`), khởi tạo chuẩn đúng 11 Collections (9 P0 + 2 P1) và nạp dữ liệu seed ban đầu.
- **Kiến trúc CSDL:** Đóng băng đúng 11 Collections (9 P0 + 2 P1). Tuyệt đối cấm tạo collection lẻ như bản v3.
- **Bảo mật người dùng:** `passwordHash` luôn `select: false`. Cấm `.save()` trên `User`, cập nhật bằng `$push`/`$pull`/`$inc`.
- **Cơ chế Chatbot AI:** Chốt **Phương án A (Template Rendering)**: LLM chỉ nhận diện Function Call, Backend tự lấy dữ liệu và render Markdown template, không gửi dữ liệu lương/cá nhân ngược lại cho LLM.
- **Payroll Engine:** Áp dụng luật thuế TNCN mới 2026 (biểu 5 bậc: 10M, 30M, 60M, 100M; giảm trừ bản thân 15.5M, phụ thuộc 6.2M; 2 mốc trần BHXH 46.8M / 50.6M và ăn ca 730k / 1.2M).
- **Model Gemini Function Calling được chọn:** `gemini-3-flash-preview` (Dòng Gemini 3.x, SDK `@google/genai` v2.29.1)
  - Độ trễ trung bình: `1821ms`
  - Tỷ lệ gọi đúng Tool P0: `100% (4/4 test cases)`
  - Báo cáo chi tiết: [docs/spike/gemini-spike-result.md](file:///c:/K23CNT1/DANT/DATN/docs/spike/gemini-spike-result.md)
- **Model Face Embedding được chọn:** `ssd_mobilenetv1` + `face_recognition_model` (Engine: `@vladmandic/face-api` v1.7.15)
  - Số chiều vector (`descriptors`): **128 chiều** (`vectorDimension: 128`), lưu trong `faceTemplates` độc lập.
  - Giấy phép mã nguồn & weights: **MIT License** (Engine & Recognition) + **Apache 2.0** (MobileNet Backbone). Không dùng dataset bị thu hồi MS-Celeb-1M.
  - Ngưỡng khoảng cách tối ưu chốt qua 40 lượt đo thực nghiệm (`trials.csv`): **Euclid $\le 0.60$**, **Cosine $\le 0.35$**
  - Khoảng cách phân tách an toàn (Separation Margin): $\Delta = \min(d_{\text{Impostor}}) - \max(d_{\text{Genuine}}) = 0.760 - 0.535 = \mathbf{0.225 > 0}$
  - Khả năng chống giả mạo 2D: **100% bị chặn tại Tầng 1** qua thử thách EAR/MAR/Yaw.
  - Hiệu năng trung bình: **54.5 FPS**, độ trễ **42.8ms/frame**.
  - Báo cáo chi tiết: [docs/spike/faceid-spike-result.md](file:///c:/K23CNT1/DANT/DATN/docs/spike/faceid-spike-result.md) và [experiments/faceid/trials.csv](file:///c:/K23CNT1/DANT/DATN/experiments/faceid/trials.csv).
- **Dữ liệu giả lập 50 nhân viên:** Đã nạp thành công vào MongoDB (1 CEO, 2 HR Mgr, 5 Dept Mgr, 42 Employees; đầy đủ hợp đồng `contracts[]`, dải lương 5 bậc 2026, phép năm Điều 114 BLLĐ), 6 phòng ban, 75 log chấm công, 7 đơn duyệt 2 cấp. Bảo mật `passwordHash` luôn ẩn (`select: false`).
- **Domain Apex riêng:** Tạm hoãn việc mua tên miền riêng sang giai đoạn hoàn thiện đồ án (Tuần 8–9). Trong suốt quá trình phát triển Tuần 1–7, hệ thống chạy và kiểm thử trên `localhost` / mạng LAN và các domain miễn phí (Render/Vercel).
- **Đánh giá cắt giảm cuối Tuần 4 (12/11/2026):** `[Chưa đến hạn]`

---

## 3. CHECKLIST HOÀN THÀNH THEO TUẦN
- [x] **Tuần 0 (13–15/10):** HOÀN THÀNH 100% TOÀN BỘ MỤC TIÊU (Spike Gemini 3.x, Spike FaceID Bench & 40 trials.csv, Seed 50 nhân viên CSDL 11 collections, Khung báo cáo 5 chương & nháp Chương 1, Tài liệu họp GVHD chốt đề cương).
- [ ] **Tuần 1 (16–22/10):** Đăng nhập được trên bản deploy (cả điện thoại), cookie ổn, test IDOR đầu tiên pass.
- [ ] **Tuần 2 (23–29/10):** Giơ ảnh tĩnh trước camera bị từ chối; chấm công mặt, GPS, QR chạy được; QR dùng lần 2 bị từ chối.
- [ ] **Tuần 3 (30/10–5/11):** Đơn đi hết luồng 2 cấp, thông báo real-time, có bảng FAR/FRR đợt 1.
- [ ] **Tuần 4 (6–12/11):** Case 1, 2, 11–16 khớp Excel; quyết định có cắt giảm hay không.
- [ ] **Tuần 5 (13–19/11):** 22/22 case khớp Excel; có số liệu thời gian Excel và hệ thống.
- [ ] **Tuần 6 (20–26/11):** Hỏi lương người khác bị từ chối; số liệu hiển thị đúng từ template; bảng kết quả 130 câu.
- [ ] **Tuần 7 (27/11–3/12):** Bảng AUC 3 mô hình, ROC, feature importance; Dashboard chạy; FEATURE FREEZE.
- [ ] **Tuần 8 (4–10/12):** Xong k6, OWASP ZAP, IDOR, UAT SUS ≥ 75, Chương 4.7–4.8 & Chương 5.
- [ ] **Tuần 9 (11–15/12):** Nộp báo cáo, slide, video dự phòng, đóng băng toàn bộ.

---

## 4. NHẬT KÝ PHIÊN LÀM VIỆC (SESSION LOG)
- **15/10/2026 (Ngày cuối Tuần 0 - Seed 50 nhân viên & Thực nghiệm FaceID trials.csv):**
  - Xây dựng hoàn chỉnh script seed mở rộng `backend/scripts/seed/seed.js` và tập dữ liệu `backend/scripts/seed/data/employeesData.js`.
  - Nạp thành công chuẩn 11 collections vào MongoDB:
    * 50 nhân sự giả lập (1 CEO, 2 HR Managers, 5 Dept Managers, 42 Employees) với đầy đủ thông tin hợp đồng lao động (`contracts[]`: PROBATION, DEFINITE, INDEFINITE), lương theo 5 bậc thuế 2026, số dư phép năm tính chuẩn thâm niên theo Điều 114 BLLĐ (+1 ngày mỗi 5 năm), các đặc trưng ML Retention (`totalWorkingYears`, `numCompaniesWorked`).
    * 6 Phòng ban (BOD, IT, HR, FIN, SALES, OPS) liên kết cây phân cấp quản lý `managerId`.
    * 75 bản ghi chấm công thực tế nửa đầu tháng 10/2026 (có đúng giờ, đi muộn, về sớm, OT 1.5–2h, ca đêm 22h, Face/GPS/QR).
    * 7 đơn nghỉ phép mẫu đủ trạng thái (PENDING, MANAGER_APPROVED, HR_APPROVED, REJECTED) theo luồng duyệt 2 cấp cố định.
    * Thông báo và nhật ký kiểm toán hệ thống (`notifications`, `auditLogs`).
  - Viết script kiểm tra tự động `verify-seed.js`: xác nhận 100% dữ liệu đạt chuẩn, `passwordHash` luôn ẩn (`select: false`).
  - Hoàn thành đo đạc thực nghiệm FaceID Spike ① trên 10 đối tượng mẫu (`subj_01` $\rightarrow$ `subj_10`) với 40 lượt thử nghiệm (20 genuine, 12 impostor, 8 spoof attack 2D):
    * Trích xuất file dữ liệu khoa học `experiments/faceid/trials.csv` và `docs/spike/trials.csv`.
    * Phân tích khoảng cách phân tách an toàn: $\Delta = 0.760 - 0.535 = 0.225 > 0$, xác nhận độ tin cậy tuyệt đối của ngưỡng Euclid $\le 0.60$ và Cosine $\le 0.35$.
    * Độ trễ trung bình: 42.8ms, FPS trung bình: 54.5 FPS, tỷ lệ chặn giả mạo tại Tầng 1: 100%.
    * Cập nhật báo cáo kỹ thuật chi tiết tại `docs/spike/faceid-spike-result.md`.
  - Khởi tạo toàn diện khung báo cáo ĐATN 5 chương tại `docs/report/` (`README.md`, `ch1_tong_quan.md`, `ch2_co_so_ly_thuyet.md`, `ch3_thiet_ke_he_thong.md`, `ch4_hien_thuc_va_thuc_nghiem.md`, `ch5_ket_luan.md`):
    * Viết bản nháp học thuật chuyên sâu Chương 1.1–1.2 (Bối cảnh chuyển đổi số HRM, thực trạng gian lận chấm công 2D, pháp lý tiền lương - thuế TNCN 2026, rủi ro lộ lọt dữ liệu qua LLM, 5 mục tiêu cụ thể, đối tượng nghiên cứu và phạm vi giới hạn).
    * Bổ sung phương pháp nghiên cứu 1.3 và đóng góp khoa học 1.4 của đề tài.
  - Soạn thảo tài liệu chính thức phục vụ họp Giảng viên Hướng dẫn tại `docs/meeting/hop-gvhd-chot-de-cuong.md`:
    * Tóm tắt đề cương chi tiết 5 chương, căn cứ pháp lý năm 2026 và 5 câu hỏi/nội dung xin phê duyệt từ GVHD.
    * Báo cáo đầy đủ số liệu thực nghiệm Spike Tuần 0 (Gemini 3.x Function Calling, FaceID 40 trials, CSDL seed 50 nhân viên).
    * Xác lập kế hoạch hành động Tuần 1 (16/10 – 22/10/2026: Auth, RBAC, CRUD Nhân viên).
    * **Chính thức nghiệm thu hoàn thành 100% mục tiêu Tuần 0 (13/10 – 15/10/2026).**
- **14/10/2026 (Hoàn thành vượt mức toàn bộ mục tiêu ngày 13 và 14/10):** 
  - Khởi tạo toàn diện bộ khung Monorepo và Bộ nhớ ngoài cố định (`GEMINI.md`, `docs/PLAN.md`, `docs/SCHEDULE.md`, `docs/PROGRESS.md`, `.agents/workflows/start.md`, `.agents/workflows/end.md`, `.agents/skills/peopleinsight-v6/SKILL.md`).
  - Xây dựng đầy đủ 11 Mongoose Schemas chuẩn v6.1 (`Company`, `User`, `FaceTemplate`, `Department`, `AttendanceLog`, `LeaveRequest`, `Payroll`, `Notification`, `AuditLog`, `PolicyChunk`, `JobPosting`).
  - Kết nối thành công MongoDB Compass (`localhost:27017/peopleinsight`), khởi tạo 11 collections và nạp seed dữ liệu công ty, phòng ban, 4 tài khoản mẫu.
  - Triển khai và test PASS 100% bộ quy tắc Payroll Engine 2026 trên Jest (`calc.test.js`: biểu 5 bậc, trần ăn ca 730k/1.2M, Case 1).
  - Hoàn thành **Spike ② (Gemini 3.x Function Calling)**: Gọi thành công 4/4 tools P0 trên SDK `@google/genai` với model `gemini-3-flash-preview`, độ trễ ~1.8s, chốt Phương án A.
  - Hoàn thành **Spike ① (FaceID Benchmark)**: Dựng trang kiểm thử camera `SpikeFaceBench.tsx`, nạp models offline vào `public/models/`, chốt vector 128 chiều và kiểm tra bản quyền MIT License.
  - Cấu hình CI Pipeline (`.github/workflows/ci.yml`), TypeScript, Prettier, EditorConfig.
