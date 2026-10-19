# TRẠNG THÁI TIẾN ĐỘ DỰ ÁN (PROGRESS TRACKER)

## 1. THÔNG TIN HIỆN TẠI
- **Sinh viên thực hiện:** Nguyễn Anh Tuấn (Lớp: K23CNT1 — MSV: 2310900113)
- **Giảng viên hướng dẫn:** ThS. Lê Trọng Nhất
- **Cơ sở đào tạo:** Trường Đại học Nguyễn Trãi — Khoa Công nghệ Thông tin & Chuyển đổi số
- **Đề tài:** Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI
- **Ngày hiện tại:** Thứ Bảy, 17/10/2026 (Ngày 2 của Tuần 1: 16–22/10/2026)
- **Giai đoạn:** Tuần 1 — Authentication, RBAC, Hồ sơ nhân sự & Deploy khung nền tảng
### ✅ CÁC MỤC TIÊU ĐÃ HOÀN THÀNH (Tính đến 17/10/2026):
- [x] 1. Khung Express 5: cấu trúc thư mục, Mongoose, Helmet, CORS, error handler, 11 Collections chuẩn v6.1 có `companyId`.
- [x] 2. Đăng nhập: JWT access 15 phút + refresh 7 ngày (cookie HttpOnly, SameSite=Lax, path=/api/auth).
- [x] 3. Cơ chế Refresh Token Rotation, Grace Window 20s chống race condition đa tab, phát hiện Token Reuse (thu hồi toàn bộ family). Tối đa 5 phiên hoạt động.
- [x] 4. Toán tử nguyên tử (`$push`/`$pull`) trên `refreshTokens[]`, cấm triệt để `.save()` trên User.
- [x] 5. Multi-tenant Fail-Closed (`tenantPlugin` & `tenantStore` qua `AsyncLocalStorage`), `mongoose.set('sanitizeFilter', true)` và Zod `.strict()`.
- [x] 6. Middleware RBAC 4 cấp (`CEO`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`), hàm tập trung `canAccess(user, resource, action)`, bảo vệ IDOR lương (Manager tuyệt đối không được xem lương nhân viên), tự động ghi `AuditLog` (`VIEW_SALARY_OTHER`).
- [x] 7. Rate Limiting bảo vệ API bằng Sliding Window (`authLimiter` 5 lần/15 phút chống brute-force đăng nhập, `generalLimiter` 100 req/phút toàn hệ thống, `aiChatLimiter` 10 req/phút, `kioskLimiter` 30 req/phút).
- [x] 8. Cây phòng ban 2 cấp (`departments`): API sơ đồ tổ chức cha-con (`parentDepartmentId`, `managerId`, `children[]`, `employeeCount`), giới hạn nghiêm ngặt tối đa 2 cấp (Khối -> Phòng ban), chặn xóa khi còn con hoặc nhân viên trực thuộc.
- [x] 9. CRUD nhân viên (`users`): Tự động sinh mã `NVxxxx` chuẩn tăng liên tục, tính số dư phép năm theo thâm niên Điều 114 BLLĐ (+1 ngày phép mỗi 5 năm), chống Mass Assignment (Zod `.strict()`), projection an toàn tuyệt đối (`salaryConfig`, `refreshTokens[]`, `passwordHash` ẩn hoàn toàn trên `GET /api/users`).
- [x] 10. Quản lý hợp đồng lao động (`contracts[]` subdocuments) & Cấu hình lương riêng: Endpoint quản trị chuyên biệt `PATCH /api/users/:id/role`, `GET/PATCH /api/users/:id/salary`, `POST /api/users/:id/contracts`, tự động xoay trạng thái hợp đồng cũ sang `EXPIRED`, ghi vết `AuditLog` cho mọi thao tác nhạy cảm.
- [x] 11. Upload ảnh đại diện qua Cloudinary (`POST /api/users/:id/avatar`): Multer memoryStorage không lưu đĩa thô, validate dung lượng $\le 2\text{MB}$, lọc MIME type an toàn (`image/jpeg`, `image/png`, `image/webp`), auto-crop $400\times 400$ gravity face qua Cloudinary upload_stream, cập nhật `avatarUrl`, bảo vệ IDOR (nhân viên chỉ up cho mình, HR/CEO up cho nhân sự) và tự động ghi `AuditLog` (`UPDATE_AVATAR`).
- [x] 12. Kiểm thử tự động toàn diện: **69/69 tests PASS (100%)** (RateLimit 3/3, Auth 11/11, RBAC 9/9, Payroll Engine 22/22, Users & Departments 17/17, Avatar Cloudinary 7/7).

- [x] 13. Khung Frontend chuẩn mực (Vite + React 19 + Tailwind CSS + TypeScript): Axios client tích hợp Single-Flight Token Refresh Lock (xử lý concurrency đa tab), AuthContext quản lý phiên tự phục hồi từ HttpOnly cookie, ProtectedRoute phân quyền RBAC 4 cấp, Trang Đăng nhập (LoginPage) thiết kế SaaS hiện đại kèm 1-click Quick Demo Accounts cho 4 vai trò (CEO, HR, Manager, Employee), Bố cục hệ thống (AppLayout) có thanh điều hướng phân vai trò, Dashboard tổng quan 4 trụ cột và trang 403 Forbidden. Đã biên dịch sản phẩm `tsc && vite build` thành công 100%.

### ⏳ NHIỆM VỤ TIẾP THEO CHƯA LÀM (Thứ Tư 21/10/2026):
- [ ] 1. Frontend: Giao diện Danh sách Nhân sự (`/users`) và Sơ đồ Cây Phòng Ban (`/departments`).
- [ ] 2. Admin UI cấu hình địa điểm GPS (`companies.settings.locations`), seed địa điểm «Phòng Bảo vệ ĐATN».
- [ ] 3. Chuẩn bị triển khai thử nghiệm trên Vercel + Render và kiểm thử cookie đa nền tảng.

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
- **Phân hệ Tuyển dụng & AI CV Screening (`jobPostings` - P1):** Đã đặc tả chuẩn hóa quy trình tiếp nhận và sàng lọc hồ sơ tự động. Ứng viên nộp CV (PDF/Text), backend dùng Gemini API phân tích đối chiếu với JD yêu cầu, chấm điểm phù hợp (0–100), bóc tách kỹ năng đạt/thiếu, nhận xét điểm mạnh/yếu và đưa ra quyết định gợi ý (`ACCEPTED`/`REJECTED`/`NEEDS_REVIEW`) nhúng vào `candidates[].aiScreening`.
- **Bảo mật Multi-tenancy Toàn diện (Read/Write Fail-Closed):** Hook `pre('validate')` ghi đè `companyId` và chặn tenant mismatch; `companyId` bất biến (`immutable: true`) có hook chặn cập nhật. Bọc các luồng không có JWT (Login, Kiosk, Cron, Socket.io) trong `tenantStore.run`. Bật `mongoose.set('sanitizeFilter', true)` và Zod `.strict()` chống Mass Assignment / NoSQL Injection.
- **Tính Idempotency & Bất biến Dữ liệu Tài chính:**
  * Phê duyệt nghỉ phép và trừ số dư phép được bọc trong MongoDB Transaction, lỗi trả về mã 409 Conflict hoặc 422, có luồng hoàn phép khi đơn bị hủy.
  * Khóa kỳ lương toàn kỳ với unique index `{ companyId, userId, period }`, hook chặn cập nhật phiếu lương đã khóa (`periodLockedAt != null`), chặn sửa đổi dữ liệu nguồn thuộc kỳ đã khóa.
  * Cơ chế xoay vòng Refresh Token có Grace Window 20s chống đăng xuất oan do request song song từ nhiều tab, dọn token quá hạn bằng `$pull`.
  * Hàm phân quyền tập trung `canAccess(user, resource, action)`, Manager tuyệt đối không được xem lương nhân viên, ghi `auditLogs` khi HR/CEO xem lương người khác.
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
- **19/10/2026 (Hoàn thành sớm Mục tiêu Thứ Ba 20/10 — Khung Frontend Vite + React 19 + Auth & Layout):**
  - **Single-Flight Token Refresh Lock (`frontend/src/api/client.ts`):**
    * Triển khai Axios interceptor bắt lỗi 401, khóa cờ `isRefreshing` và đưa các request đồng thời vào hàng đợi `failedQueue` để tránh spam refresh token.
    * Gọi tự động endpoint `/api/auth/refresh` bằng cookie HttpOnly và tự động replay các request đang chờ sau khi có Access Token mới.
  - **Quản lý Phiên & Phân quyền RBAC (`frontend/src/context/AuthContext.tsx`, `ProtectedRoute.tsx`):**
    * Khởi tạo `AuthContext` tự phục hồi phiên làm việc khi người dùng mở lại trình duyệt hoặc F5 trang.
    * Hỗ trợ hàm kiểm tra quyền `hasRole(roles)` và bọc các route nhạy cảm bằng `ProtectedRoute` (tự động điều hướng sang `/login` hoặc `/unauthorized` khi vi phạm RBAC).
  - **Giao diện Đăng nhập & Layout Doanh nghiệp (`LoginPage.tsx`, `AppLayout.tsx`, `DashboardPage.tsx`):**
    * `LoginPage`: Thiết kế tối ưu thẩm mỹ SaaS dark mode, chống AI slop, tích hợp 1-click Quick Demo Accounts cho 4 vai trò (CEO, HR Manager, Department Manager, Employee) kèm mật khẩu chuẩn `Password123@`, phục vụ trực quan cho việc demo và bảo vệ đồ án.
    * `AppLayout`: Thanh Sidebar phân cấp điều hướng theo đúng vai trò người dùng, Header hiển thị thông tin tenant, huy hiệu chức vụ và nút đăng xuất an toàn.
    * `DashboardPage`: Trình diễn 4 trụ cột kỹ thuật cốt lõi (FaceID Kiosk, Payroll Engine 2026, HR Chatbot Phương án A, ML Retention), thẻ thống kê nhanh và các lối tắt điều hướng.
    * Đã kiểm thử biên dịch sản phẩm: **`tsc && vite build` hoàn thành 100% không có lỗi**.
- **19/10/2026 (Hoàn thành 100% Mục tiêu Thứ Hai 19/10 — Module Upload Ảnh Đại diện Cloudinary & 69/69 Tests Pass):**
  - **Kiến trúc Multer memoryStorage & Cloudinary Stream:**
    * Sử dụng `multer.memoryStorage()` nhằm bảo vệ dữ liệu, không lưu tệp ảnh thô tạm thời lên ổ cứng máy chủ.
    * Lọc định dạng nghiêm ngặt: chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`. Các định dạng khác bị từ chối với lỗi 400.
    * Giới hạn kích thước tệp: tối đa 2MB (`LIMIT_FILE_SIZE`). Vượt ngưỡng bị chặn lập tức và trả thông báo rõ ràng.
    * Cấu hình Cloudinary SDK `upload_stream` với auto-crop vuông $400\times 400$ căn chỉnh theo khuôn mặt (`gravity: 'face'`, `crop: 'fill'`) và tự động chuyển sang WebP tối ưu băng thông.
  - **Bảo mật & Phân quyền RBAC:**
    * Endpoint `POST /api/users/:id/avatar` tích hợp bảo vệ IDOR qua `canAccess()`: Nhân viên chỉ được tự cập nhật ảnh của chính mình (`isSelfBasicUpdate`); CEO và HR Manager được quyền cập nhật cho mọi nhân viên trong cùng công ty. Quản lý (Manager) không có quyền cập nhật ảnh của người khác (bị từ chối 403).
    * Tự động ghi vết `AuditLog` với hành động `UPDATE_AVATAR`, lưu vết `targetUserId`, `employeeCode` và `avatarUrl`.
  - **Kiểm thử tự động toàn diện:**
    * Bổ sung 4 test cases trong `tests/users/users.test.js` và duy trì suite `tests/users/avatar.test.js`.
    * Toàn bộ 6 test suites của Backend: **69/69 tests PASS (100%)**.
- **19/10/2026 (Hoàn thiện toàn diện Báo cáo Đồ án tốt nghiệp: Mở đầu, Chương 1, 15 Hình ảnh thực tế, Humanizer & Xuất Word NTU):**
  - **Áp dụng triệt để kỹ năng `humanizer`:**
    * Quét tự động bằng regex và rà soát toàn bộ văn bản báo cáo (`loi_cam_on.md`, `tom_tat.md`, `mo_dau.md`, `ch1_tong_quan.md`, `tai_lieu_tham_khao.md`).
    * Loại bỏ 100% các dấu hiệu viết văn của AI: triệt tiêu cấu trúc *"không chỉ X mà còn Y"* (Not X but Y), gọt giũa từ ngữ thổi phồng (*"tuyệt đối"*, *"then chốt"*, *"vượt trội hơn"*), xóa bỏ các câu kết sáo rỗng (One-line closers), loại bỏ định dạng bôi đậm đầu dòng máy móc và thuật ngữ nội bộ.
    * Đạt chứng nhận kiểm tra tự động: `ALL FILES 100% CLEAN AND COMPLIANT WITH HUMANIZER SKILL!`.
  - **Tích hợp trọn bộ 15 hình ảnh kỹ thuật thực tế (Chất lượng 300 DPI, Không dùng Generative AI):**
    * *Hình 1.1:* Kiến trúc 4 phân hệ chức năng cốt lõi và dòng chảy dữ liệu khép kín trong HRM (`hinh1_0_hrm_core_modules.png` - Thay thế hoàn toàn Bảng 1.1 theo yêu cầu).
    * *Hình 1.2:* Sơ đồ mô hình hoạt động phân mảnh truyền thống trong quản trị nhân sự và các điểm nghẽn rủi ro tại doanh nghiệp (`hinh1_1_mo_hinh_truyen_thong.png`).
    * *Hình 1.3:* Kịch bản tấn công giả mạo 2D theo tiêu chuẩn ISO/IEC 30107-3 (`hinh1_2_tan_cong_gia_mao_2d.png`).
    * *Hình 1.4:* Cơ chế Virtual DOM và Diffing Algorithm của ReactJS [14] (`hinh1_3_react_virtual_dom.png`).
    * *Hình 1.5:* Hệ thống kiểu tĩnh TypeScript và kiểm tra Props/State an toàn từ mã nguồn Kiosk thực tế (`hinh1_10_typescript_react_typesystem.png`).
    * *Hình 1.6:* Sơ đồ kiến trúc Event Loop và Worker Pool từ tài liệu chính thức Node.js [13] (`official_event_loop.png`).
    * *Hình 1.7:* Sơ đồ hàm Middleware Function từ tài liệu chính thức Express.js [13] (`official_express_middleware.png`).
    * *Hình 1.8:* Chuỗi Middleware Pipeline phân tầng và cơ chế cách ly đa công ty trong Express 5 từ mã nguồn backend thực tế (`hinh1_9_rest_api_express_pipeline.png`).
    * *Hình 1.9:* Mô hình dữ liệu tài liệu BSON và cấu trúc nhúng Embedded Subdocuments trong MongoDB [12] (`hinh1_8_mongodb_document_model.png`).
    * *Hình 1.10:* Lưới 468 điểm mốc không gian 3 chiều từ Google MediaPipe Documentation [8] (`official_mediapipe_keypoints.png`).
    * *Hình 1.11:* Ảnh thực nghiệm webcam bám vết khuôn mặt thực tế từ engine `@vladmandic/face-api` [8] (`screenshot-webcam.png`).
    * *Hình 1.12:* Biểu đồ phân bố khoảng cách Euclid và hiệu năng FPS/độ trễ từ 40 lượt đo thực tế tại Kiosk [experiments/faceid/trials.csv](file:///c:/K23CNT1/DANT/DATN/experiments/faceid/trials.csv).
    * *Hình 1.13:* Luồng xử lý câu hỏi HR Chatbot Gemini Function Calling bảo vệ dữ liệu theo Phương án A [9] (`hinh1_6_chatbot_gemini_flow.png`).
    * *Hình 1.14:* Ranh giới phân loại các thuật toán Học máy từ Scikit-learn Documentation [10] (`official_scikit_learn_classifiers.png`).
    * *Hình 1.15:* Đường cong ROC và Ma trận nhầm lẫn dự báo thôi việc trên tập dữ liệu chuẩn IBM HR Attrition [11] (`hinh1_7_scikit_learn_roc_auc.png`).
  - **Chuẩn hóa Danh mục Tài liệu tham khảo (`docs/report/tai_lieu_tham_khao.md`):**
    * Phân loại chuẩn IEEE/APA gồm 6 văn bản pháp luật Việt Nam ([1]–[6]) và 8 tài liệu kỹ thuật quốc tế ([7]–[14]) kèm đường dẫn URL tra cứu chính thức.
  - **Tự động hóa xuất bản 2 tệp Word chuẩn format Đại học Nguyễn Trãi (NTU):**
    * [docs/report/BAO_CAO_DATN_NTU_MO_DAU_VA_CHUONG_1.docx](file:///c:/K23CNT1/DANT/DATN/docs/report/BAO_CAO_DATN_NTU_MO_DAU_VA_CHUONG_1.docx) (4.94 MB): Bìa chính, Bìa phụ (chữ ký GVHD ThS. Lê Trọng Nhất), Lời cảm ơn, Tóm tắt, Mở đầu, Chương 1 và Tài liệu tham khảo.
    * [docs/report/CHƯƠNG_1_TỔNG_QUAN_PEOPLEINSIGHT_AI.docx](file:///c:/K23CNT1/DANT/DATN/docs/report/CHƯƠNG_1_TỔNG_QUAN_PEOPLEINSIGHT_AI.docx) (4.93 MB).
- **17/10/2026 (Ngày 2 Tuần 1 — Hoàn thành toàn diện Hệ thống Authentication & Multi-tenancy Fail-Closed v6.1):**
  - **Multi-tenancy Fail-Closed Đọc & Ghi (`backend/src/plugins/tenantPlugin.js`):**
    * Tích hợp `AsyncLocalStorage` (`tenantStore`), hook `pre('validate')` tự động gán và kiểm tra `companyId`.
    * Cố định thuộc tính `companyId` là bất biến (`immutable: true`), hook chặn mọi thao tác cập nhật đè `companyId`.
    * Tự động inject filter tenant vào toàn bộ query ops (`find`, `findOne`, `countDocuments`, `distinct`) và unshift `$match` vào pipeline `aggregate`.
    * Xử lý luồng chưa có JWT (Login) với tùy chọn `{ skipTenant: true }` rồi bọc phiên làm việc trong `tenantStore.run({ companyId })`.
    * Tự động kích hoạt `tenantStore.run` trong middleware `authenticate` cho mọi downstream controllers.
    * Bật `mongoose.set('sanitizeFilter', true)` chống NoSQL Injection và Zod `.strict()` chống Mass Assignment.
  - **Cập nhật Schema `User` (`backend/src/models/User.js`):**
    * Thêm cờ `select: false` cho `salaryConfig` và `refreshTokens[]` (bảo vệ tuyệt đối khỏi API projection).
    * `RefreshTokenSchema` hỗ trợ `family` (phát hiện Token Reuse), `rotatedAt` (Grace Window), `deviceId`, `userAgent`, `ip`.
    * Ràng buộc kiến trúc: Chặn triệt để gọi `.save()` khi cập nhật User (`FORBIDDEN_OPERATION`), bắt buộc dùng `$set`, `$push`, `$pull`, `$inc`.
  - **Auth Service & Controller chuẩn v6.1 (`authService.js`, `authController.js`, `authRoutes.js`):**
    * `login`: Cấp Access Token (15m) + Refresh Token (7d) cookie HttpOnly (`SameSite=Lax`, `Path=/api/auth`), dọn token hết hạn và giới hạn tối đa 5 phiên hoạt động bằng `$slice: -5`. Ghi `AuditLog`.
    * `refresh`: Xoay vòng Refresh Token (Refresh Rotation), Grace Window 20s cho phép các tab mở đồng thời refresh mà không bị đăng xuất oan; phát hiện Token Reuse (> 20s) lập tức thu hồi toàn bộ token trong family và ghi cảnh báo an ninh.
    * `logout`: Xóa cookie và dùng `$pull` xóa token trong CSDL một cách nguyên tử.
    * `me`: Trả về thông tin user đã sanitize, populate department.
  - **Middleware RBAC 4 Cấp & Hàm Phân quyền Tập trung `canAccess()` (`backend/src/middleware/rbac.js`):**
    * Định nghĩa cấu trúc tài nguyên (`USER`, `SALARY`, `ATTENDANCE`, `LEAVE_REQUEST`, `PAYROLL`, `RETENTION`, `AUDIT_LOG`) và hành động (`CREATE`, `READ`, `UPDATE`, `DELETE`, `APPROVE_STAGE_1`, `APPROVE_STAGE_2`, `LOCK`).
    * Triển khai hàm tập trung `canAccess(user, resource, action, context)`:
      - **Bảo mật tài chính & IDOR Lương:** Nhân viên chỉ xem lương của chính mình. Quản lý (`MANAGER`) **tuyệt đối không được xem lương hoặc cấu hình lương của nhân viên** (dù là cấp dưới trực tiếp). Chỉ HR Manager và CEO được xem lương nhân viên trong cùng công ty.
      - **Chặn tự duyệt đơn:** Chặn đứng việc Manager/HR tự duyệt đơn nghỉ phép của chính mình (`applicantId !== currentUserId`).
      - **Kiểm soát Tenant Fail-Closed:** Chặn toàn bộ hành vi truy cập chéo tenant (`context.companyId !== user.companyId`).
    * Middleware `authorize(resource, action, getContext)`: Tự động trích xuất context, thẩm định quyền và **tự động ghi `AuditLog` (`VIEW_SALARY_OTHER`)** mỗi khi HR/CEO truy cập xem lương của người khác.
  - **Hệ thống Rate Limiting bảo vệ API bằng Sliding Window (`backend/src/middleware/rateLimiter.js`):**
    * Cơ chế Sliding Window lưu trong RAM có dọn dẹp định kỳ tự động (`unref`), trả về chuẩn HTTP Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
    * Cấu hình 4 tầng phòng thủ chuyên biệt:
      - `authLimiter`: Tối đa 5 lần thử trong 15 phút theo cặp IP + Email (chống Brute-force mật khẩu).
      - `generalLimiter`: Tối đa 100 requests / 1 phút per IP (bảo vệ toàn hệ thống tại `/api`).
      - `aiChatLimiter`: Tối đa 10 requests / 1 phút per User ID (bảo vệ Quota LLM Gemini).
      - `kioskLimiter`: Tối đa 30 requests / 1 phút per Kiosk Device (chống spam FaceID).
  - **Cây Phòng Ban 2 Cấp (`Department`) & CRUD Nhân sự (`User`) — Vượt trước tiến độ Thứ Hai 19/10/2026:**
    * **Cây phòng ban 2 cấp (`backend/src/services/departmentService.js`):**
      - Xây dựng sơ đồ phân cấp tổ chức 2 cấp (`getDepartmentTree`): Khối (cấp 1, `parentDepartmentId: null`) -> Phòng ban (cấp 2, có `parentDepartmentId`), liên kết trưởng bộ phận `managerId` và tổng hợp số lượng nhân sự trực thuộc qua MongoDB aggregation.
      - Ràng buộc Hiến pháp v6.1: Chặn đứng tạo phòng ban cấp 3 (lỗi 400).
      - Ràng buộc an toàn khi xóa (`deleteDepartment`): Chặn xóa phòng ban nếu đang có phòng ban con trực thuộc hoặc đang có nhân viên trực thuộc.
    * **CRUD Nhân sự & An toàn Dữ liệu Tài chính (`backend/src/services/userService.js`):**
      - Tự động sinh mã nhân viên chuẩn liên tục `NVxxxx` (`generateNextEmployeeCode`) bằng cách trích xuất số lớn nhất trong công ty.
      - Tính số dư phép năm ban đầu chuẩn hóa theo thâm niên Điều 114 BLLĐ: cứ đủ 5 năm làm việc được cộng thêm 1 ngày phép (`12 + Math.floor(seniorityYears / 5)`).
      - **Chống Mass Assignment & NoSQL Injection:** Sử dụng Zod schema `.strict()`, loại bỏ triệt để các trường nhạy cảm (`role`, `salaryConfig`) khỏi request tạo/sửa thông thường.
      - **Projection An toàn Tuyệt đối:** API danh sách nhân sự `GET /api/users` ẩn hoàn toàn `salaryConfig`, `refreshTokens[]` và `passwordHash`.
      - **Endpoints Quản trị Chuyên biệt:**
        + `PATCH /api/users/:id/role`: Đổi vai trò (chỉ CEO/HR), ghi AuditLog `UPDATE_ROLE`.
        + `GET /api/users/:id/salary`: Xem cấu hình lương (Manager tuyệt đối bị cấm 403, nhân viên chỉ xem của mình, CEO/HR xem người khác tự động ghi vết AuditLog `VIEW_SALARY_OTHER`).
        + `PATCH /api/users/:id/salary`: Cập nhật cấu hình lương (chỉ CEO/HR), ghi AuditLog `UPDATE_SALARY_CONFIG`.
        + `POST /api/users/:id/contracts`: Thêm hợp đồng lao động mới, xoay trạng thái hợp đồng cũ sang `EXPIRED` bằng `$set` arrayFilters và `$push` hợp đồng mới.
        + `DELETE /api/users/:id`: Xóa mềm (`isActive: false`, chỉ CEO), ghi AuditLog `DEACTIVATE_USER`.
    * **Routes & Controllers:** Mount `departmentRoutes.js` (`/api/departments`) và `userRoutes.js` (`/api/users`) vào Express `app.js` với bảo vệ RBAC và Multi-tenancy Fail-Closed đầy đủ.
  - **Kiểm thử tự động toàn diện:**
    * Bộ test Rate Limiting ([tests/security/rateLimiter.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/security/rateLimiter.test.js)): **3/3 tests PASS (100%)**.
    * Bộ test RBAC & IDOR ([tests/auth/rbac.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/auth/rbac.test.js)): **9/9 tests PASS (100%)**.
    * Bộ test Auth ([tests/auth/auth.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/auth/auth.test.js)): **11/11 tests PASS (100%)**.
    * Bộ test Payroll Engine ([tests/payroll/calc.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/payroll/calc.test.js)): **22/22 tests PASS (100%)**.
    * Bộ test Cây Phòng Ban & CRUD Nhân sự ([tests/users/users.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/users/users.test.js)): **13/13 tests PASS (100%)**.
    * **Tổng cộng: 58/58 tests PASS (100%) toàn bộ hệ thống.**
- **16/10/2026 (Ngày 1 Tuần 1 — Chuẩn hóa Quy chế ĐATN ĐH Nguyễn Trãi & Tối ưu triệt để Chatbot AI Phương án A):**
  - Tích hợp toàn diện biểu mẫu và quy định ĐATN Đại học Nguyễn Trãi (Khoa CNTT & CĐS): Chuyển đổi khung báo cáo sang chuẩn 4 Chương + Kết luận (tối đa 2 trang), dung lượng 60–80 trang, font Times New Roman 13, dãn dòng 1.2, slide tối đa 15 trang. Tạo file mẫu `docs/report/MAU_BAO_CAO_NTU.md` và `docs/QUY_DINH_TRINH_BAY_NTU.md`. Xóa file thừa `ch5_ket_luan.md`, tạo `ket_luan.md`.
  - Cập nhật và tinh chỉnh 6 điểm kỹ thuật & pháp lý cốt lõi cho Chatbot AI Phương án A (`references/chatbot-ai.md`, `declarations.js`, `GEMINI.md`):
    1. Tách template phiếu lương làm 2 khối riêng biệt (Thực nhận Net $\leftrightarrow$ Thông tin tính thuế TNCN). Tuyệt đối không trừ Giảm trừ gia cảnh vào tiền thực nhận. Tách rõ phần OT tính thuế và OT chênh lệch miễn thuế (Điều 98 BLLĐ).
    2. Xóa bỏ hard-code thời hạn bảo lưu phép; khớp đúng các trường schema `users.leaveBalance`.
    3. Chèn ngày/tháng/năm thời gian thực (`Asia/Ho_Chi_Minh`) vào `systemInstruction`.
    4. Bổ sung Zod Schema validation cho toàn bộ 4 tools, kiểm tra $from \le to$, chặn tra cứu kỳ lương tương lai, chỉ hiển thị phiếu lương khi đã khóa sổ (`periodLockedAt`). Lọc tools theo role trước khi gửi cho Gemini (Employee không nhận `get_team_leave_stats`).
    5. Xử lý fallback có phân loại lỗi (không fallback lỗi 400), thêm timeout 8s.
    6. Thêm AuditLog, giới hạn độ dài tin nhắn $\le 500$ ký tự, rate limit theo user, bỏ properties rỗng của `get_leave_balance` để tránh lỗi 400.
  - Kích hoạt Cơ chế Giám sát Tiến độ Chủ động (Schedule Watchdog) trong `GEMINI.md` và `.agents/workflows/start.md`.
  - **Sửa triệt để lỗi Thuế OT theo Luật Thuế TNCN 2025/2026 và hoàn thiện Bộ 22 Test Cases Payroll Engine (`backend/tests/payroll/calc.test.js`):**
    * *Đổi mới cốt lõi:* Từ kỳ tính thuế 2026 (01/01/2026), **toàn bộ 100% tiền lương làm thêm giờ (150%, 200%, 300%) được miễn thuế TNCN** cho cá nhân cư trú (không phải chỉ phần chênh lệch như trước 2026) khi thỏa mãn 2 điều kiện: (1) Nằm trong giới hạn giờ quy định ($\le 4\text{h}/\text{ngày}, \le 40\text{h}/\text{tháng}, \le 200\text{h}/\text{năm}$) và (2) Hệ số chi trả không vượt quy định tại Điều 98 BLLĐ.
    * Tiền OT tính vào thu nhập chịu thuế gồm: tiền ứng với số giờ vượt trần (ngày/tháng/năm) + phần tiền chênh lệch do công ty trả hệ số cao hơn Điều 98.
    * Hỗ trợ đầy đủ 2 nhánh OT đêm theo Điều 57 NĐ 145/2020: 200% (không làm thêm ban ngày trước đó) và 210% (có làm thêm ban ngày trước đó).
    * Phân định rạch ròi `periodDate` (tháng phát sinh lương dùng để áp trần BHXH 46.8M/50.6M) và `payDate` (thời điểm chi trả dùng để áp trần ăn ca 730k/1.2M và chính sách thuế TNCN).
    * Chuẩn hóa nguồn pháp lý: Lương cơ sở NĐ 161/2026/NĐ-CP & Luật BHXH 2024; Trần ăn ca NĐ 253/2026/NĐ-CP (Điều 8 & 69); Giảm trừ gia cảnh NQ 110/2025/UBTVQH15. Gắn nhãn `[Cần xác minh]` cho các khoản loại trừ lương đóng BHXH và phụ cấp đêm.
    * Viết mới toàn bộ bộ 22 unit test cases trong `backend/tests/payroll/calc.test.js` bao quát mọi tình huống biên, tham số hóa 5 bậc thuế, nghỉ ốm $\ge 14$ ngày, chi phí doanh nghiệp 21.5%, làm tròn số nguyên VNĐ half-up, ca tổng hợp toàn diện.
    * **Kết quả kiểm thử tự động:** `PASS tests/payroll/calc.test.js` — **22 passed, 22 total (100% pass)**.
  - **Đồng bộ hóa tài liệu Kế hoạch Tổng thể (`docs/PLAN_FULL.md` & `docs/PLAN.md`):**
    * Khởi tạo bản đầy đủ [PLAN_FULL.md](docs/PLAN_FULL.md) gồm trọn vẹn 14 mục chi tiết (Khảo sát đối thủ, Kiến trúc 2 tầng, P0, P1, CSDL 11 collections, Tech stack, Lộ trình 9 tuần kèm cột Viết báo cáo song song, Tuân thủ pháp lý 2026, Thiết kế thực nghiệm, Rủi ro & Dự phòng, Bản đồ 4 Chương NTU, P2, Checklist bảo vệ).
    * Đồng bộ hóa [PLAN.md](docs/PLAN.md) đảm bảo Mục lục và Thân bài khớp 100% (14/14 mục); xóa bỏ các tham chiếu lỗi thời ("xem 4.5.3", "≥ 21 test case"); chuẩn hóa relative markdown link `docs/QUY_DINH_TRINH_BAY_NTU.md`.
    * Rút gọn P1 ATS CV Screening: AI chỉ gợi ý phân loại (`RECOMMENDED`, `CONSIDER`, `LOW_MATCH`), điểm tính bằng rubric code, LLM nhận xét định tính, bảo vệ PII và prompt injection, giới hạn $\le 200$ ứng viên/tin tuyển dụng.
    * Bổ sung cột "Báo cáo viết song song" vào bảng lộ trình 9 tuần để viết cuốn chiếu từng chương ngay từ Tuần 0–1.
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
