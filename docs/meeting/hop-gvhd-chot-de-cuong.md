# TÀI LIỆU BÁO CÁO GIẢNG VIÊN HƯỚNG DẪN: CHỐT ĐỀ CƯƠNG & BÁO CÁO KẾT QUẢ SPIKE TUẦN 0

---

## I. THÔNG TIN CHUNG
- **Đề tài ĐATN:** Nghiên cứu và Xây dựng Hệ thống Quản trị Nhân sự & Chấm công Thông minh PeopleInsight AI ứng dụng Sinh trắc học Khuôn mặt 2 tầng và Trí tuệ Nhân tạo Tạo sinh An toàn Dữ liệu
- **Sinh viên thực hiện:** Nguyễn Anh Tuấn (K23CNT1 - ĐATN)
- **Giảng viên Hướng dẫn (GVHD):** [Tên Thầy/Cô Hướng dẫn]
- **Thời gian thực hiện đồ án:** 13/10/2026 – 15/12/2026 (10 tuần đóng băng theo bản kế hoạch v6.1 FINAL FREEZE)
- **Thời điểm báo cáo:** Thứ Năm, ngày 15/10/2026 (Kết thúc Tuần 0 - Spike Kỹ thuật & Khởi động)

---

## II. TỔNG QUAN ĐỀ CƯƠNG CHI TIẾT (5 CHƯƠNG BÁO CÁO ĐATN)

Báo cáo Đồ án tốt nghiệp được xây dựng theo chuẩn mực học thuật 5 chương với các đóng góp cụ thể:

### 1. Chương 1: Tổng quan và Cơ sở Thực tiễn
- Bối cảnh chuyển đổi số trong HRM, các hạn chế cố hữu của máy chấm công vân tay/thẻ từ truyền thống.
- Thực trạng lỗ hổng chấm công giả mạo 2D (Presentation Attacks qua ảnh in, màn hình điện thoại) khi thiếu kiểm tra thực thể sống (Liveness Detection).
- Sự dịch chuyển của Pháp lý Lao động và Thuế TNCN tại Việt Nam trong năm 2026: Biểu thuế 5 bậc mới, mức giảm trừ gia cảnh (15.5M / 6.2M), **2 mốc chuyển tiếp chính sách trong cùng năm 2026** (trước và sau 01/07/2026), trần BHXH, trần BHTN và quy chuẩn OT / ca đêm.
- Nguy cơ lộ lọt dữ liệu nhạy cảm (Data Leakage) khi tích hợp LLM và yêu cầu tuân thủ **Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15**.
- Xác định 5 mục tiêu cụ thể, đối tượng nghiên cứu và phạm vi áp dụng (doanh nghiệp SMEs, hợp đồng $\ge 3$ tháng).

### 2. Chương 2: Cơ sở Lý thuyết và Căn cứ Pháp lý
- Nghiệp vụ quản trị nhân lực vòng đời nhân viên (Employee Lifecycle), luồng duyệt đơn 2 cấp (Manager $\rightarrow$ HR Manager) và chế độ phép năm thâm niên (Điều 114 BLLĐ).
- Căn cứ pháp lý gốc: Luật Thuế TNCN mới (Luật số 109/2025/QH15), Nghị định 253/2026/NĐ-CP, Nghị định 161/2026/NĐ-CP, Điều 98 BLLĐ 2019 và Nghị định 145/2020/NĐ-CP.
- Lý thuyết thị giác máy tính: MediaPipe Face Landmarker, 52 Blendshapes, trích xuất Face Embedding 128 chiều (`Float32Array(128)`), giải thuật so khớp Euclid / Cosine. Kiểm toán bản quyền MIT / Apache 2.0 (không dùng dataset MS-Celeb-1M bị thu hồi).
- Trí tuệ nhân tạo tạo sinh & Cơ chế bảo vệ dữ liệu nhạy cảm: Đề xuất **Phương án A (Template Rendering)** ngăn chặn rò rỉ dữ liệu cá nhân.
- Học máy dự báo thôi việc & Đạo đức AI: Bộ 6 đặc trưng định lượng chuẩn hóa từ IBM HR Attrition, loại bỏ hoàn toàn thiên kiến xã hội (Gender, Age, MaritalStatus).
- Tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15: Cơ chế xóa bỏ sinh trắc học khi nhân viên rút đồng ý.

### 3. Chương 3: Phân tích Yêu cầu và Thiết kế Hệ thống
- Đặc tả yêu cầu chức năng (7 nhóm) và phi chức năng (Latency p95 < 200ms, FPS $\ge 30$, bảo mật OWASP).
- Mô hình đe dọa (Threat Model): Chống giả mạo khuôn mặt, chống chiếm đoạt phiên token, phòng ngừa lỗ hổng IDOR.
- Thiết kế Kiosk FaceID 2 tầng, Dynamic QR 30s (HMAC-SHA256 nonce 1 lần), GPS Geofencing (Haversine).
- Thiết kế Cơ sở dữ liệu đóng băng đúng **11 Collections** (9 P0 + 2 P1) trên MongoDB:
  * 9 Collections P0: `companies`, `users`, `faceTemplates`, `departments`, `attendanceLogs`, `leaveRequests`, `payrolls`, `notifications`, `auditLogs`.
  * 2 Collections P1: `policyChunks`, `jobPostings`.
- Thiết kế API RESTful, RBAC 4 cấp (`CEO`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`) và Socket.io thời gian thực.

### 4. Chương 4: Hiện thực hóa và Đánh giá Thực nghiệm
- Cài đặt Payroll Engine 3 bước với 2 mốc chính sách năm 2026.
- Bộ kiểm thử 22 Test Cases đối chiếu bảng tính lương Excel khớp 100% đến từng đồng lẻ.
- Thực nghiệm Kiosk FaceID 2 tầng trên 10 đối tượng mẫu với 40 lượt thử nghiệm (`trials.csv`): Phân tích khoảng cách phân tách an toàn ($\Delta = 0.225 > 0$), tỷ lệ chặn giả mạo 100%, độ trễ 42.8ms, 54.5 FPS.
- Đánh giá HR Chatbot AI Phương án A trên bộ 130 prompts thử nghiệm (hợp lệ, vượt quyền RBAC, viết tắt, prompt injection).
- Huấn luyện mô hình ML IBM Attrition 6 đặc trưng (so sánh Baseline, Logistic Regression, Random Forest, đường cong ROC và AUC).
- Dashboard Quản trị và hệ thống cảnh báo sớm 4 luật rule-based.
- Kiểm thử tải k6 (100 VUs) và đánh giá trải nghiệm người dùng UAT đạt chuẩn $SUS \ge 75$.

### 5. Chương 5: Kết luận, Hạn chế và Hướng Phát triển
- Đánh giá mức độ hoàn thành so với mục tiêu ban đầu.
- Phân tích trung thực các hạn chế kỹ thuật hiện tại: Liveness Client phụ thuộc ánh sáng môi trường, dataset ML của Mỹ cần thêm dữ liệu Việt Nam hóa, đánh đổi văn phong chatbot để lấy sự an toàn dữ liệu tuyệt đối.
- Đề xuất các hướng phát triển mở rộng: Cảm biến độ sâu chuyên dụng, WebAuthn Passkeys, RAG tra cứu nội quy lao động (P1), tuyển dụng AI (P1).

---

## III. BÁO CÁO KẾT QUẢ NGHIÊN CỨU THỬ NGHIỆM (SPIKE TUẦN 0)

Trong giai đoạn Tuần 0 (13/10 – 15/10/2026), sinh viên đã hoàn thành 100% các mục tiêu Spike kỹ thuật đặt ra:

### 1. Spike ①: Khảo sát Sinh trắc học FaceID & Thẩm định Bản quyền
- **Bộ thư viện & Mô hình được chọn:** `@vladmandic/face-api` (v1.7.15) với Face Detector `ssd_mobilenetv1` + `face_recognition_model`.
- **Số chiều vector đặc trưng:** Chuẩn **128 chiều** (`vectorDimension: 128`), lưu trong collection `faceTemplates` độc lập, không lưu ảnh gốc.
- **Thẩm định Bản quyền & Đạo đức AI:** Đạt 100% tiêu chuẩn học thuật. Mã nguồn và weights tuân thủ giấy phép **MIT / Apache 2.0**. Hoàn toàn **KHÔNG sử dụng** tập dữ liệu vi phạm nhân quyền MS-Celeb-1M.
- **Kết quả thực nghiệm trên 10 đối tượng mẫu (40 lượt thử nghiệm trong `trials.csv`):**
  * Tốc độ khung hình trung bình: **54.5 FPS** (đáp ứng xuất sắc điều kiện thời gian thực 30–60 FPS).
  * Độ trễ xử lý toàn chu trình: **42.8 ms** / frame.
  * Khoảng cách Euclid người thật (Genuine): $0.290 - 0.535$ (Trung bình: $0.404$).
  * Khoảng cách Euclid kẻ mạo danh (Impostor): $0.760 - 1.084$ (Trung bình: $0.885$).
  * **Khoảng cách phân tách an toàn (Separation Margin):** $\Delta = \min(d_{\text{Impostor}}) - \max(d_{\text{Genuine}}) = 0.760 - 0.535 = \mathbf{0.225 > 0}$.
  * **Khả năng chống giả mạo:** 100% (8/8) các đợt tấn công bằng ảnh in A4, ảnh điện thoại và video tablet đều bị từ chối ngay tại Tầng 1 do không vượt qua thử thách ngẫu nhiên EAR/MAR/Yaw.
  * **Chốt ngưỡng so khớp tối ưu:** **Euclid $\le 0.60$** và **Cosine $\le 0.35$**.

### 2. Spike ②: Kiểm thử Function Calling với Google Gemini 3.x
- **SDK & Model được chọn:** SDK `@google/genai` (v2.29.1) với mô hình `gemini-3-flash-preview` (Dòng 3.x mới nhất).
- **Độ trễ trung bình:** **1.821 ms** / lượt gọi tool.
- **Độ chính xác gọi Tool P0:** **100% (4/4 test cases)** gọi chính xác các công cụ:
  1. `get_leave_balance` (Tra cứu số dư phép năm, thâm niên).
  2. `get_payslip` (Tra cứu chi tiết phiếu lương theo kỳ).
  3. `get_attendance_summary` (Tổng hợp công, đi muộn, làm thêm giờ).
  4. `get_team_leave_stats` (Thống kê nghỉ phép của phòng ban dành cho Quản lý).
- **Quyết định bảo mật Phương án A (Template Rendering):**
  * Không đưa tham số `userId` vào schema định nghĩa tool (luôn lấy `userId` và `role` từ JWT xác thực tại Backend để chống tấn công IDOR).
  * Backend dừng luồng LLM ngay sau khi nhận được `functionCall`, tự truy vấn CSDL nội bộ và render kết quả vào Markdown template tĩnh.
  * **Cam kết:** Tuyệt đối không gửi dữ liệu lương, số dư bảo hiểm hoặc thông tin cá nhân ngược lại cho Google Gemini.

### 3. Khởi tạo Khung Monorepo & CSDL chuẩn 11 Collections
- Thiết lập thành công Monorepo (`backend/`, `frontend/`, `ml/`, `docs/`, `experiments/`) với TypeScript, ESLint, Prettier, Jest, EditorConfig và GitHub Actions CI.
- Xây dựng đầy đủ 11 Mongoose Schemas chuẩn v6.1 FINAL FREEZE: `Company`, `User`, `FaceTemplate`, `Department`, `AttendanceLog`, `LeaveRequest`, `Payroll`, `Notification`, `AuditLog`, `PolicyChunk`, `JobPosting`.
- Triển khai script nạp dữ liệu (`seed.js`) hoàn tất nạp vào MongoDB:
  * **50 nhân sự giả lập:** 1 CEO, 2 HR Managers, 5 Dept Managers, 42 Employees với đầy đủ hợp đồng (`PROBATION`, `DEFINITE`, `INDEFINITE`), dải lương theo 5 bậc thuế 2026, phép năm tính chuẩn thâm niên theo Điều 114 BLLĐ (+1 ngày mỗi 5 năm), các đặc trưng ML IBM Attrition.
  * **6 phòng ban** liên kết cây phân cấp `managerId`.
  * **75 bản ghi chấm công thực tế** nửa đầu tháng 10/2026 (có đúng giờ, đi muộn, về sớm, OT 2h, ca đêm 22h, Face/GPS/QR).
  * **7 đơn nghỉ phép mẫu** đủ trạng thái (`PENDING`, `MANAGER_APPROVED`, `HR_APPROVED`, `REJECTED`) theo luồng duyệt 2 cấp.
  * Đảm bảo an toàn: Trường `passwordHash` luôn ẩn (`select: false`).
- Hiện thực hóa và kiểm thử tự động Payroll Engine 2026 với Jest (`calc.test.js` PASS 100%): Biểu 5 bậc mới, trần ăn ca 730k / 1.2M, Case 1.

---

## IV. NỘI DUNG XIN Ý KIẾN VÀ PHÊ DUYỆT CỦA GVHD

Sinh viên kính trình Giảng viên Hướng dẫn xem xét và cho ý kiến chỉ đạo về 5 nội dung trọng tâm sau:

1. **Phê duyệt Tên đề tài và Cấu trúc 5 chương báo cáo:**
   - Kính xin Thầy/Cô thông qua tên đề tài chính thức và bố cục chi tiết 5 chương của đồ án như đã trình bày tại Mục II.
2. **Phê duyệt Phương án A cho Trợ lý ảo HR Chatbot AI:**
   - Để bảo đảm an toàn dữ liệu cá nhân nhạy cảm theo Luật BVDLCN số 91/2025/QH15, sinh viên xin phép áp dụng triệt để **Phương án A (Template Rendering)**: LLM chỉ trích xuất tham số gọi hàm, Backend tự lấy dữ liệu nội bộ và render Markdown template tĩnh, không gửi dữ liệu lương ngược lại cho LLM. Sinh viên xin ý kiến GVHD về sự đánh đổi này (ưu tiên bảo mật tuyệt đối thay vì văn phong đàm thoại tự do).
3. **Phê duyệt Kiến trúc Kiosk FaceID Liveness 2 tầng trên Web Client:**
   - Xin ý kiến GVHD về giải pháp kiểm tra thực thể sống Liveness bằng 52 Blendshapes + Landmarks hình học trên camera thông thường (webcam 720p), kết hợp thử thách ngẫu nhiên từ Server để chống ảnh in 2D và video mà không cần đầu tư cảm biến chiều sâu hồng ngoại (IR/ToF) đắt tiền.
4. **Phê duyệt Phạm vi Bộ 22 Test Cases tính lương đối chiếu Excel chuẩn 2026:**
   - Xin ý kiến GVHD về phạm vi 22 trường hợp kiểm thử đối chiếu bảng lương (bao phủ cá nhân cư trú hợp đồng $\ge 3$ tháng, 2 mốc chuyển tiếp 01/07/2026, trần BHXH, trần BHTN, các loại OT ngày/đêm và các điểm biên bậc thuế).
5. **Phê duyệt Phương án Tên miền & Môi trường Kiểm thử:**
   - Trong quá trình phát triển từ Tuần 1 đến Tuần 7, hệ thống chạy và kiểm thử trên `localhost`, mạng LAN và các nền tảng đám mây miễn phí (Render, Vercel). Việc mua và cấu hình tên miền riêng (`.vn` hoặc `.com`) xin phép được thực hiện ở Tuần 8–9 khi hoàn thiện đóng gói đồ án để tối ưu chi phí và tránh rủi ro chứng chỉ HTTPS sớm.

---

## V. KẾ HOẠCH HÀNH ĐỘNG TUẦN 1 (16/10/2026 – 22/10/2026)

Ngay sau khi được GVHD phê duyệt đề cương, sinh viên sẽ triển khai các công việc của Tuần 1:
- **T6 16/10:** Khởi tạo khung Express 5, tích hợp Mongoose, Helmet, CORS, Error Handler, khởi tạo 4 Model cơ sở (`Company`, `User`, `Department`, `AuditLog`).
- **T7 17/10:** Hiện thực hóa Authentication: JWT Access (15 phút) + Refresh Token (7 ngày) lưu cookie HttpOnly SameSite=Lax; cơ chế Refresh Token Rotation nguyên tử ngăn chặn tấn công chiếm phiên.
- **CN 18/10:** Xây dựng Middleware phân quyền RBAC 4 cấp, ghi log kiểm toán `auditLogs`, Rate Limiting, viết unit test chống lỗ hổng IDOR đầu tiên.
- **T2 19/10:** Xây dựng API CRUD nhân viên trong `users`, quản lý mảng hợp đồng `contracts[]`, cây phòng ban 2 cấp.
- **T3 20/10:** Xây dựng giao diện Frontend (Vite + React 19 + Tailwind CSS), trang đăng nhập, Protected Routes, Axios Interceptor tự refresh token đơn luồng (single-flight lock).
- **T4 21/10:** Giao diện danh sách nhân sự, sơ đồ phòng ban, cấu hình địa điểm GPS Geofencing; deploy thử nghiệm bản dựng đầu tiên lên Vercel + Render.
- **T5 22/10:** Cài đặt Cron-job nhắc hạn hợp đồng lao động 30/60 ngày; viết nội dung Chương 2.1 và 2.6 (nghiệp vụ HRM và Luật BVDLCN).
- **Tiêu chí nghiệm thu Tuần 1:** Đăng nhập thành công trên bản deploy (cả desktop và mobile), cookie ổn định, test IDOR đầu tiên pass.

---
*Hà Nội, ngày 15 tháng 10 năm 2026*  
**Sinh viên thực hiện**  
*(Ký và ghi rõ họ tên)*  

**Nguyễn Anh Tuấn**
