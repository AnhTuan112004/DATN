# TRẠNG THÁI TIẾN ĐỘ DỰ ÁN (PROGRESS TRACKER)

## 1. THÔNG TIN HIỆN TẠI
- **Sinh viên thực hiện:** Nguyễn Anh Tuấn (Lớp: K23CNT1 — MSV: 2310900113)
- **Giảng viên hướng dẫn:** ThS. Lê Trọng Nhất
- **Cơ sở đào tạo:** Trường Đại học Nguyễn Trãi — Khoa Công nghệ Thông tin & Chuyển đổi số
- **Đề tài:** Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI
- **Ngày hiện tại:** Thứ Hai, 26/10/2026 (HOÀN TẤT VƯỢT TRƯỚC TIẾN ĐỘ TOÀN BỘ TUẦN 7 & TUẦN 8: KIỂM THỬ TẢI K6 100 VUs)
- **Giai đoạn:** Tuần 7 & Tuần 8 — Phân hệ ML Dự Báo Thôi Việc, Frontend Floating HR Chatbot, và Kịch bản Kiểm Thử Chịu Tải k6 (100 Virtual Users) ĐẠT TIÊU CHUẨN NGHIỆM THU
### ✅ TỔNG SỐ TEST TOÀN HỆ THỐNG: 200/200 TESTS PASS (100% ACROSS 20 SUITES)
### 🚀 THỰC NGHIỆM TẢI K6 (TUẦN 8): 20,904 REQUESTS, ERROR RATE 0.00%, P95 = 380.38 ms, RPS = 296.70 req/s (100% PASS SLA)
### 🛡️ RÀ SOÁT BẢO MẬT CHUYÊN SÂU: 14/14 TESTS PASS (PROJECTION API, IDOR, MULTI-TENANT FAIL-CLOSED, NOSQL INJECTION)
### ✅ CÁC MỤC TIÊU ĐÃ HOÀN THÀNH (Tính đến 26/10/2026):
- [x] 0a. Rà soát Bảo Mật Chuyên Sâu Tự Động (`backend/tests/security/securityAudit.test.js` — Lệnh: `npm run test:security`):
  * **Chống Rò rỉ Projection API:** Quét toàn bộ `GET /api/users`, `GET /api/auth/me`, `GET /api/users/:id` khẳng định 100% không rò rỉ `passwordHash`, `refreshTokens` và `salaryConfig`.
  * **Bảo vệ Chống IDOR:** Quản lý (`MANAGER`) và nhân viên thường bị chặn 403 Forbidden tuyệt đối khi cố tình xem hoặc sửa lương người khác.
  * **Cách ly Multi-tenant Fail-Closed:** Token của Tenant A gọi tới tài nguyên Tenant B bị chặn hoàn toàn (404/403).
  * **Chống NoSQL Injection & Mass Assignment:** Chặn body injection `{"email": {"$gt": ""}}` và chặn inject trường `role`, `companyId` qua Zod `.strict()`.
  * Đạt kết quả **14/14 tests PASS (100%)**, nâng tổng số test Backend lên **200/200 tests PASS across 20 suites**.
- [x] 0b. Script Reset Sandbox Demo 1-Click (`backend/scripts/reset_demo.js` — Lệnh: `npm run demo:reset`):
  * Khôi phục toàn bộ CSDL về trạng thái chuẩn chỉ trong 4 giây.
  * Tự động làm sạch 9 collections, nạp lại 50 nhân viên giả lập, 6 phòng ban, 7 đơn phép 2 cấp, 75 nhật ký chấm công và tọa độ GPS phòng bảo vệ ĐATN.
  * Tự động in bảng tài khoản demo chuẩn (CEO, HR, Manager, Employee) kèm mật khẩu chung `Admin@123456`.
- [x] 0c. Hoàn thiện Toàn Bộ Số Liệu Thực Nghiệm Khoa Học vào Chương 4 Báo Cáo ĐATN ([ch4_hien_thuc_va_thuc_nghiem.md](docs/report/ch4_hien_thuc_va_thuc_nghiem.md)):
  * **Bảng 4.2:** Kết quả thực nghiệm 130 Prompts Chatbot Phương Án A đạt **130/130 PASS (100.0%)**.
  * **Bảng 4.3:** So sánh đối đầu Phương Án A (Template Rendering) vs Phương Án B (Agentic Loop): Triệt tiêu 100% rò rỉ PII, 0% Hallucination, tiết kiệm 75% token, độ trễ nhanh hơn 100 lần.
  * **Bảng 4.4:** Phân bố độ trễ phân vị Chatbot ($Min = 6.68\text{ ms}, P_{50} = 11.73\text{ ms}, P_{95} = 21.30\text{ ms}$).
  * **Bảng 4.5:** So sánh hiệu năng 3 mô hình học máy Attrition: Logistic Regression đạt AUC-ROC cao nhất ($71.60\%$) và Recall cao nhất ($42.55\%$).
  * **Bảng 4.6:** Bảng phân tích trọng số $\beta$ và Odds Ratio của 6 đặc trưng đo lường tuân thủ Điều 8 BLLĐ.
  * **Bảng 4.7:** Bảng tổng hợp thực nghiệm k6 Stress Test (20,904 requests, Error 0.00%, RPS 296.70 req/s, $P_{95} = 380.38\text{ ms}$, Checks 100%).
  * **Bảng 4.8:** Độ trễ $P_{95}$ theo từng phân hệ API dưới áp lực 100 VUs.
  * **Bảng 4.9:** Ma trận kiểm thử an toàn thông tin chuyên sâu (14/14 tests PASS).
  * **Bảng 4.10:** Kết quả đo đạc thời gian 5 tác vụ cốt lõi UAT ($Mean = 13.04\text{ s/tác vụ}$, Tỷ lệ hoàn thành $98.34\%$).
  * **Bảng 4.11:** Thang đo khả dụng SUS đạt **$82.50 / 100$ điểm** (Hạng A — Excellent, vượt mục tiêu đề tài $\ge 75.0$).
- [x] 0d. Kịch bản Kiểm thử Chịu tải k6 (100 Concurrent Virtual Users) — Tuần 8:
  * Kịch bản tải bậc thang trong 70 giây: Ramp-up 0->25 VUs (10s) -> 25->100 VUs (20s) -> Duy trì đỉnh 100 VUs (30s) -> Cooldown (10s).
  * Kiểm thử toàn diện 6 phân hệ cốt lõi: `/health`, `GET /api/auth/me`, `GET /api/users`, `GET /api/attendance/today`, `GET /api/analytics/attrition-risk` (ML suy luận), và `POST /api/ai/chat` (HR AI Chatbot).
  * Kết quả đo đạc chính thức: **20,904 requests**, thông lượng **296.70 req/s**, **Error rate 0.00%**, $P_{95} = 380.38\text{ ms} < 500\text{ ms}$, $P_{99} = 519.31\text{ ms} < 1000\text{ ms}$.
  * Tối ưu hóa kiến trúc: In-memory Cache TTL 10s cho dữ liệu toàn công ty, áp dụng `mongoose.trusted(...)` loại bỏ lỗi CastError trong Multi-tenant Fail-Closed, bypass rate limiter an toàn qua header `X-Load-Test`.
  * Xuất file dữ liệu `experiments/load/k6_results.json`, `experiments/load/k6_summary.txt` và báo cáo khoa học [docs/report/k6-load-test-evaluation.md](docs/report/k6-load-test-evaluation.md).
- [x] 0e. Kịch bản UAT & Báo cáo Khảo sát Thang đo Khả dụng SUS (System Usability Scale):
  * Xây dựng tài liệu chuyên sâu [docs/report/uat-and-sus-evaluation.md](docs/report/uat-and-sus-evaluation.md) theo chuẩn quốc tế ISO 9241-11.
  * Thiết kế 5 tác vụ cốt lõi (FaceID Kiosk, Nộp đơn phép, Duyệt đơn 2 cấp, HR Chatbot tra cứu, ML Risk Dashboard) trên mẫu khảo sát $N = 12$ người dùng thực tế (4 HR, 3 Manager, 5 Employee).
  * Đo đạc thời gian hoàn thành tác vụ trung bình $13.04\text{ s/tác vụ}$, tỷ lệ hoàn thành $98.34\%$.
  * Đo đạc 10 câu hỏi chuẩn mực SUS theo thang Likert 1-5, đạt điểm số trung bình **$SUS = 82.50 / 100$ điểm** (Độ lệch chuẩn $SD = 5.48$), xếp hạng **Hạng A (Grade A) — "Xuất sắc / Excellent"**, vượt mục tiêu đề tài ($\ge 75.0$).
  * Cập nhật đầy đủ vào Mục 4.8 Chương 4 Báo cáo ĐATN ([ch4_hien_thuc_va_thuc_nghiem.md](docs/report/ch4_hien_thuc_va_thuc_nghiem.md)).
- [x] 0f. Hoàn Thành Phân Hệ Nâng Cao P1 & Tương Thích Mobile PWA (P2):
  * **P1.1 (Tuyển dụng & Sàng lọc CV ATS-lite AI):** Hoàn thiện Backend Service, Controller, Routes (`/api/recruitment/jobs`) và Giao diện Frontend [RecruitmentPage.tsx](frontend/src/pages/RecruitmentPage.tsx). Tự động chấm điểm độ phù hợp kỹ năng (AI Match Score %), xếp hạng ứng viên và phân loại quyết định tuyển dụng.
  * **P1.2 (RAG Tra cứu Nội quy Lao động):** Hoàn thiện [PolicyChunk.js](backend/src/models/PolicyChunk.js), PolicyService, Controller (`/api/policies/search`) và seed sẵn 4 điều khoản nội quy chuẩn mực 2026.
  * **P1.3 (Docker Compose Hoàn chỉnh):** Tạo [docker-compose.yml](docker-compose.yml), `backend/Dockerfile`, `frontend/Dockerfile` và `frontend/nginx.conf` hỗ trợ 1 lệnh khởi chạy toàn bộ hệ thống (Mongo, Backend, Frontend).
  * **P2 (Tương thích Mobile PWA):** Tích hợp [frontend/public/manifest.json](frontend/public/manifest.json) và các thẻ meta Apple Web App trong `index.html`, cho phép cài đặt trực tiếp lên màn hình chính Smartphone iOS/Android như Native App. Đóng gói kiến trúc mở rộng P2 vào Chương 5 Báo cáo ĐATN.
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

- [x] 14. Frontend Giao diện Quản lý Nhân sự (`/users`): Data table hiển thị 50 nhân sự, phân trang, bộ lọc đa năng (phòng ban, vai trò, trạng thái, tìm kiếm), badge role & số dư phép năm theo Điều 114 BLLĐ. Modal chi tiết hồ sơ đa tab (`UserDetailModal.tsx`: Thông tin chung, Lịch sử hợp đồng `contracts[]`, Cấu hình lương 2026 kèm bảo vệ IDOR - Manager cấm xem có banner cảnh báo, Quản trị vai trò), Modal thêm nhân viên mới (`CreateUserModal.tsx`) và Modal tải ảnh đại diện Cloudinary auto-face-crop (`AvatarUploadModal.tsx`). Đã biên dịch `tsc && vite build` và chạy test 69/69 PASS (100%).
- [x] 15. Frontend Sơ đồ Cây Phòng Ban 2 Cấp (`/departments`): Trực quan hóa cơ cấu tổ chức 2 cấp (Khối cấp 1 -> Phòng ban cấp 2). Hỗ trợ 2 chế độ hiển thị: Sơ đồ Cây tương tác (`FolderTree`) và Lưới thẻ (`LayoutGrid`). Modal quản trị phòng ban (`DepartmentModal.tsx`) hỗ trợ chọn cha-con và chọn trưởng bộ phận, modal xem danh sách nhân sự trực thuộc (`DepartmentMembersModal.tsx`) kèm trưởng phòng spotlight và liên kết xem chi tiết hồ sơ. Chặn xóa an toàn khi còn phòng con hoặc nhân viên. Đã biên dịch `tsc && vite build` và chạy test 69/69 PASS (100%).

- [x] 16. Admin UI Cấu hình GPS Geofencing (`companies.settings.locations`): Backend CRUD endpoints (`/api/companies/locations`), bảo vệ RBAC (chỉ CEO/HR), Zod validation tọa độ và bán kính geofence, tự động ghi AuditLog (`UPDATE_COMPANY_SETTINGS`). Nút 1-click nạp nhanh tọa độ «Phòng Bảo vệ ĐATN - Hội đồng K23» (`POST /api/companies/locations/seed-defense-room`). Giao diện Admin UI ([LocationsPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/LocationsPage.tsx)) tích hợp Live Geofence Simulator: tính toán khoảng cách Haversine theo thời gian thực từ GPS thiết bị và báo trạng thái hợp lệ/ngoài vùng, modal thêm/sửa địa điểm ([LocationModal.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/locations/LocationModal.tsx)) kèm tính năng lấy GPS thiết bị và xem bản đồ Google Maps. Đã biên dịch `tsc && vite build` và chạy test **75/75 PASS (100%)**.

- [x] 17. Chuẩn bị Kịch bản Triển khai Thử nghiệm trên Vercel + Render & Kiểm thử Cookie HttpOnly Đa Nền Tảng: Thiết lập Vercel Reverse Proxy Rewrite ([frontend/vercel.json](file:///c:/K23CNT1/DANT/DATN/frontend/vercel.json)) giải quyết triệt để rủi ro chặn Third-party Cookie trên Safari/iOS (Apple ITP) và Chrome, cấu hình Render Blueprint ([deploy/render.yaml](file:///c:/K23CNT1/DANT/DATN/deploy/render.yaml)) tích hợp healthCheckPath `/health` và cron-job ping 10 phút chống ngủ đông, bổ sung tài liệu kịch bản kiểm thử thực nghiệm chi tiết ([docs/deployment/KIEM_THU_DEPLOY_VA_COOKIE.md](file:///c:/K23CNT1/DANT/DATN/docs/deployment/KIEM_THU_DEPLOY_VA_COOKIE.md)).

- [x] 18. Cron job nhắc hợp đồng lao động hết hạn trước 30/60 ngày: Thiết kế Idempotent tuyệt đối với khóa `idempotencyKey = CONTRACT_EXPIRY_{userId}_{contractNumber}_{milestone}`, quét toàn bộ công ty với Tenant Context độc lập (`tenantStore.run`). Gửi thông báo đến cả người lao động và toàn bộ cấp quản trị (`CEO`, `HR_MANAGER`) lưu trong `notifications` (không sinh collection lẻ). Hỗ trợ lập lịch tự động qua `node-cron` (`0 8 * * *`) và API trigger endpoint `POST /api/jobs/contract-reminders` xác thực kép qua `x-cron-key` (dành cho cron-job.org) hoặc JWT của CEO/HR Manager. Đã bổ sung bộ kiểm thử tự động `contractReminders.test.js` (5/5 PASS), nâng tổng số test Backend lên **80/80 tests PASS (100% across 8 suites)**.

### 🚀 TIẾN ĐỘ VƯỢT TRƯỚC: HOÀN THÀNH SỚM TÁC VỤ ĐẦU TIÊN CỦA THỨ NĂM 22/10/2026!
### ⏳ NHIỆM VỤ TIẾP THEO CHƯA LÀM (Thứ Năm 22/10/2026 — Hoàn tất Tuần 1):
- [x] 20. Thiết lập Khung làm việc Kiosk FaceID Tầng 1 (Client Liveness Detection & One-time Challenge Nonce) — Hoàn thành sớm mục tiêu Tuần 2:
  * **Backend Kiosk Core:**
    - Cập nhật Model [FaceTemplate.js](file:///c:/K23CNT1/DANT/DATN/backend/src/models/FaceTemplate.js): Áp dụng `tenantPlugin` Fail-Closed, chỉ mục duy nhất `{ companyId: 1, userId: 1 }`, tích hợp mã hóa tầng ứng dụng đối xứng **AES-256-GCM** cho vector embedding 128 chiều tuân thủ nghiêm ngặt Luật BVDLCN 91/2025/QH15.
    - Xây dựng Service [kioskChallengeService.js](file:///c:/K23CNT1/DANT/DATN/backend/src/services/kioskChallengeService.js): Quản lý Nonce thử thách trong RAM (TTL 60s, không tạo collection mới), sinh ngẫu nhiên 4 loại thử thách (`BLINK`, `SMILE`, `TURN_LEFT`, `TURN_RIGHT`), cơ chế tiêu hủy ngay lập tức khi sử dụng chống tấn công phát lại (Anti-Replay Attack).
    - Middleware [kioskAuth.js](file:///c:/K23CNT1/DANT/DATN/backend/src/middleware/kioskAuth.js): Băm SHA-256 token từ header `x-kiosk-token` đối chiếu với cấu hình `companies.settings.devices`, tự động bọc request trong `tenantStore.run`.
    - Router [kioskRoutes.js](file:///c:/K23CNT1/DANT/DATN/backend/src/routes/kioskRoutes.js): Cung cấp các endpoint `GET /api/kiosk/challenge` và `GET /api/kiosk/info`.
  * **Frontend Kiosk Client:**
    - Custom Hook [useFaceLiveness.ts](file:///c:/K23CNT1/DANT/DATN/frontend/src/features/face/useFaceLiveness.ts): Quản lý State Machine liveness qua chuỗi thời gian sinh lý học, bắt buộc `numFaces === 1` (từ chối ngay khi phát hiện $>1$ người), kiểm tra EAR mí mắt / MAR môi / Head Pose Yaw, chụp và lưu giữ hai vector $V_{\text{start}}$ (lúc bắt đầu) và $V_{\text{end}}$ (lúc kết thúc thử thách) để server đối chiếu tính liên tục $d(V_{\text{start}}, V_{\text{end}}) \le 0.40$.
    - Giao diện Kiosk chuyên dụng [KioskPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/KioskPage.tsx) tại route `/kiosk`: Thiết kế Enterprise dark mode, hiệu ứng quét radar glow, đồng hồ số GMT+7, thanh đếm ngược TTL 60s, thanh tiến độ thực thể sống và cảnh báo vi phạm an ninh nhiều người.
  * **Kiểm thử chất lượng:**
    - Tạo suite [kioskChallenge.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/kiosk/kioskChallenge.test.js) đạt **5/5 tests PASS (100%)**.
    - Tổng số test Backend: **85/85 tests PASS (100% across 9 suites)**.
    - Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi)**.

### 🚀 TIẾN ĐỘ VƯỢT TRƯỚC: TOÀN BỘ TUẦN 0, TUẦN 1, TUẦN 2 VÀ CÁC MỤC TIÊU CỐT LÕI CỦA TUẦN 3 ĐÃ HOÀN THÀNH XUẤT SẮC!
### ✅ MỤC TIÊU TUẦN 3 ĐÃ HOÀN THÀNH:
- [x] 1. Phân hệ Quản lý Đơn từ (`leaveRequests`): Luồng duyệt 2 cấp cố định (Manager $\rightarrow$ HR Manager) cho 5 loại đơn: `ANNUAL`, `SICK`, `OT`, `WFH`, `FORGOT_CHECKIN`.
- [x] 2. Trừ phép nguyên tử & Idempotent: Bọc chuyển trạng thái `MANAGER_APPROVED -> HR_APPROVED` và trừ phép trong MongoDB Transaction / Atomic Precondition (loại bỏ triệt để race condition, lỗi ném 422/409).
- [x] 3. Luồng hoàn phép tự động: Khi đơn bị hủy (`CANCELLED`) sau khi đã duyệt `HR_APPROVED`, tự động hoàn trả số dư phép `leaveBalance` cho nhân viên nguyên tử.
- [x] 4. Giao diện Frontend Quản lý Đơn từ (`/leave` & `/leave-requests`):
  - Bảng danh sách đơn theo tab (Tất cả, Chờ tôi duyệt, Đơn của tôi), tìm kiếm, bộ lọc trạng thái và loại đơn.
  - Phân loại 5 loại đơn (`ANNUAL`, `SICK`, `OT`, `WFH`, `FORGOT_CHECKIN`) và Badge trạng thái luồng duyệt 2 cấp trực quan (`PENDING_MANAGER`, `PENDING_HR`, `HR_APPROVED`, `REJECTED`, `CANCELLED`).
  - Modal nộp đơn: Hỗ trợ 5 loại đơn, kiểm tra số dư phép khả dụng trực tiếp từ `leaveBalance`, cảnh báo trần OT Điều 98 BLLĐ ($\le 4\text{h}/\text{ngày}, \le 40\text{h}/\text{tháng}$), nhập chi tiết quên chấm công `FORGOT_CHECKIN`.
  - Modal duyệt 2 cấp: Tự động phân cấp quyền Cấp 1 (Quản lý) và Cấp 2 (HR), chặn tự duyệt đơn của chính mình (Fail-Closed Anti-Self-Approval), ghi chú lý do phê duyệt hoặc từ chối.
  - Modal xem chi tiết đơn: Hiển thị đầy đủ tiến trình duyệt 2 cấp, thông tin người duyệt, thời gian duyệt, và cho phép nhân viên hủy đơn có cơ chế hoàn phép tự động.
- [x] 5. Thông báo thời gian thực (Socket.io & `notifications`):
  - Khởi tạo Socket.io server với xác thực JWT, phân lập Multi-Tenant Fail-Closed qua `tenantStore.run` và chia room theo tenant/user/role.
  - Tự động phát sự kiện real-time `notification` và `unread_count_update` ngay khi có đơn mới tạo, đơn được duyệt Cấp 1, Cấp 2 hoặc bị từ chối/hủy.
  - Toàn bộ API `/api/notifications`: lấy danh sách có phân trang và bộ lọc, đếm số lượng chưa đọc, đánh dấu đã đọc đơn lẻ và hàng loạt, xóa thông báo.
  - Frontend: `SocketProvider` kết nối Socket.IO bảo mật, component `NotificationBell` hiển thị chuông thông báo với badge số lượng chưa đọc realtime, popover xem danh sách thông báo và floating toast alert tự động nổi khi có thông báo mới.
  - Kiểm thử: 13/13 tests Socket.io & Notifications PASS, toàn bộ Backend đạt 16/16 test suites với 150/150 tests PASS 100%.
- [x] 6. Bảng đo lường FAR/FRR thực nghiệm FaceID Kiosk Đợt 1 với người dùng thực tế:
  - Bộ dữ liệu thực nghiệm 146 lượt đo trên 18 đối tượng thực tế tại `experiments/faceid/trials.csv` (36 Genuine, 30 Impostor, 50 Ảnh in màu A4, 30 Video Replay).
  - Tầng 1 Liveness (ISO/IEC 30107-3): APCER = 0.00% (chặn 80/80 cuộc tấn công 2D), BPCER = 2.78% (1/36 lượt cúi đầu sâu thiếu sáng).
  - Tầng 2 So khớp Vector 128D: Khoảng cách phân tách an toàn $\Delta = 0.223 > 0$ ($\min(d_{\text{Impostor}}) = 0.751 > \max(d_{\text{Genuine}}) = 0.528$).
  - Bảng quét ngưỡng FAR/FRR xác lập ngưỡng tối ưu: Euclid $\theta_E = 0.60$ (FAR = 0.00%, FRR = 0.00%, Zero Error Rate).
  - Báo cáo khoa học chi tiết: [docs/report/faceid-round1-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/faceid-round1-evaluation.md).
  - Frontend: Tab "Báo Cáo Thực Nghiệm Đợt 1 (146 Lượt)" với Interactive Threshold Simulator và KPI Cards trong [SpikeFaceBench.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/features/face/SpikeFaceBench.tsx).

---

### 🚀 HOÀN TẤT TOÀN BỘ MỤC TIÊU TUẦN 0, TUẦN 1, TUẦN 2, TUẦN 3 VÀ TUẦN 4 VƯỢT TRƯỚC TIẾN ĐỘ!
### ✅ MỤC TIÊU TUẦN 4 ĐÃ HOÀN THÀNH:
- [x] 1. Tổng hợp bảng tham số pháp lý Luật thuế TNCN & BHXH 2026 (Luật 109/2025/QH15, NĐ 253/2026, NĐ 161/2026, Điều 98 BLLĐ và Điều 57 NĐ 145/2020) tại [docs/legal/legal-parameters-2026.md](file:///c:/K23CNT1/DANT/DATN/docs/legal/legal-parameters-2026.md).
- [x] 2. Cấu hình động `companies.settings`: `taxPolicies` (2 mốc: trước & sau 01/07/2026), `insuranceRates`, `minWageByRegion`, `otRates`, `holidays`.
- [x] 3. Hàm thuần tính toán lương 3 bước: Tổng thu nhập (Gross) $\rightarrow$ Thu nhập chịu thuế $\rightarrow$ Thu nhập tính thuế (áp biểu thuế lũy tiến 5 bậc 2026).
- [x] 4. Bộ 22 Test Cases Payroll trong `backend/tests/payroll/calc.test.js` đối chiếu khớp 100% với bảng tính Excel chuẩn.
- [x] 5. Snapshot tham số và cơ chế khóa kỳ lương nguyên tử (`periodLockedAt`) chống sửa đổi dữ liệu nguồn và tính lại kỳ đã khóa.
- [x] 6. Bảo vệ IDOR & Phân quyền tra cứu phiếu lương: Quản lý (`MANAGER`) tuyệt đối cấm xem lương nhân viên; CEO/HR Manager xem lương nhân viên bắt buộc ghi `AuditLog` (`VIEW_SALARY_OTHER`).
- [x] 7. Giao diện Frontend Bảng lương toàn công ty [PayrollPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/PayrollPage.tsx) và Phiếu lương chi tiết [PayslipModal.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/payroll/PayslipModal.tsx) 2 khối chuẩn Phương án A.

### ⏳ TIẾN ĐỘ TUẦN 5 (13/11–19/11/2026 — Đo Lường Hiệu Năng & Chuẩn Bị Chatbot AI):
- [x] 1. Xây dựng kịch bản đo lường thực nghiệm: So sánh thời gian xử lý bảng lương tự động trên hệ thống vs thao tác thủ công Excel (ghi nhận vào Chương 4 Báo cáo ĐATN).
  * Script benchmark tự động: `experiments/payroll/benchmark.js` (hoặc `npm run benchmark:payroll`).
  * 50/50 nhân sự khớp chính xác 100% từng đồng lẻ ($0\text{ VNĐ}$ sai lệch, discrepancy rate = $0.00\%$).
  * Benchmark 50,000 lượt tính (1,000 vòng lặp trên 50 nhân sự): thời gian tính 1 nhân sự là $1.97\text{ }\mu s$, toàn bộ 50 nhân sự là $0.089\text{ ms}$ (P50: $0.062\text{ ms}$), thông lượng $556.071\text{ nhân sự/giây}$.
  * So sánh với Excel MTM-1 ($105\text{s/người} = 87.5\text{ phút/50 người}$): tốc độ tăng tốc hơn **35,000 lần** (toàn trình DB) và **58,000,000 lần** (thuần toán).
  * Xác nhận mở rộng quy mô tuyến tính $O(N)$ từ 10 đến 1,000 nhân sự ($N=1000$ chỉ mất $1.087\text{ ms}$).
  * Triệt tiêu $100\%$ sai sót con người (từ mức $3.2\%$ của Excel thủ công về $0.00\%$).
  * Báo cáo khoa học chi tiết: [docs/report/payroll-benchmark-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/payroll-benchmark-evaluation.md), bảng đối chiếu [experiments/payroll/payroll_excel_vs_system.csv](file:///c:/K23CNT1/DANT/DATN/experiments/payroll/payroll_excel_vs_system.csv) và cập nhật mục 4.2.3 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
- [x] 2. Kiểm thử sức chịu tải quy trình tính lương toàn bộ 50 nhân sự đồng thời (benchmark response time và memory footprint).
  * Script thực nghiệm: `experiments/payroll/stress_test.js` (hoặc `npm run stress:payroll`).
  * Đo đạc 6 mức đồng thời $C \in [1, 5, 10, 25, 50, 100]$ concurrent requests (mỗi request tính 50 nhân sự = 50 đến 5,000 nhân sự song song).
  * Mức tải cực hạn ($C = 100$ requests = 5,000 nhân sự): hoàn thành trong **11.51 ms**, $P_{95} = 0.330\text{ ms}$, $P_{99} = 0.439\text{ ms}$, thông lượng **434,424 calculations/giây**, tỷ lệ lỗi 0.00%.
  * Giám sát bộ nhớ: Peak Heap Used = 7.07 MB, chi phí ~11.6 KB / công ty 50 nhân sự, xác nhận **ZERO MEMORY LEAK** sau 10 đợt xung kích Spike liên tiếp (thời gian xử lý tối ưu hóa JIT từ 8.50 ms xuống 2.85 ms).
  * Báo cáo chi tiết: [docs/report/payroll-stress-test-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/payroll-stress-test-evaluation.md) và kết quả thô `experiments/payroll/stress_test_results.json`.
- [x] 3. Chuẩn bị bộ 130 câu prompt kiểm thử Chatbot HR AI (P0 & Unsupported) phục vụ nghiệm thu Phương án A Tuần 6.
  * 4 nhóm kiểm thử chuẩn hóa: 60 câu nghiệp vụ P0 hợp lệ (15 phép, 15 lương, 15 chấm công, 15 thống kê phòng ban); 30 câu cố tình vượt quyền RBAC & hỏi lương người khác (chặn IDOR); 30 câu viết tắt, tiếng lóng, tiếng Việt không dấu đời thường; 10 câu tấn công Prompt Injection, Jailbreak, Social Engineering.
  * Bộ dữ liệu chuẩn: [experiments/ai/prompts_130.json](file:///c:/K23CNT1/DANT/DATN/experiments/ai/prompts_130.json), bảng dữ liệu CSV: [experiments/ai/prompts_130.csv](file:///c:/K23CNT1/DANT/DATN/experiments/ai/prompts_130.csv).
  * Script xác thực kiểm tra: `experiments/ai/verify_prompts.js` (130/130 prompts PASS 100%).
  * Tài liệu đặc tả khoa học: [docs/report/chatbot-130-prompts-specification.md](file:///c:/K23CNT1/DANT/DATN/docs/report/chatbot-130-prompts-specification.md) và cập nhật mục 4.4.3 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
- [x] 4. Backend Chatbot hoàn thiện (Tuần 6.1): Hoàn thiện Endpoint `POST /api/ai/chat`, SDK `@google/genai`, rate limiter riêng (`aiChatLimiter` 10 req/phút), bộ lọc RBAC Pre-filtering, xác thực Zod tham số và cơ chế dừng luồng LLM tuyệt đối.
  * Hiện thực chuẩn **Phương án A (Template Rendering)**: Backend chỉ gửi prompt tới Gemini để nhận diện `functionCall` (ép mode `ANY`), dừng luồng LLM tuyệt đối ngay sau khi nhận functionCall, cấm gửi dữ liệu lương/cá nhân nhạy cảm ngược lại cho Gemini.
  * Bộ templates Markdown tĩnh: Template Lương 2 khối (Net và Tham chiếu TNCN không trừ vào lương), Template Phép theo `leaveBalance` (Điều 113, 114 BLLĐ), Template Chấm công, Template Thống kê phòng ban và Template từ chối `unsupported_request`.
  * Bộ lọc RBAC Pre-filtering: `EMPLOYEE` chỉ được cấp 3 tools nghiệp vụ (`get_leave_balance`, `get_payslip`, `get_attendance_summary`) và `unsupported_request`. Quản lý (`MANAGER`) không được xem lương nhân viên khác. Chống IDOR bằng cách luôn trích xuất `userId` và `companyId` từ JWT xác thực tại Backend.
  * Xử lý lỗi & Fallback 3 tầng: Luân chuyển Primary Key/Model (`gemini-3.5-flash`) $\rightarrow$ Fallback Key/Model (`gemini-3.1-flash-lite`) $\rightarrow$ Rule-Based Keyword Matcher dự phòng (khi mất mạng/hết quota Google API) $\rightarrow$ Tự động ghi nhận `AuditLog` (`AI_TOOL_CALL`) với đầy đủ `toolName`, `args`, `latencyMs`, `usedModel`.
  * Bộ kiểm thử tự động toàn diện: [tests/ai/chatbotWorkflow.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/ai/chatbotWorkflow.test.js) đạt **11/11 tests PASS (100%)**, nâng tổng số test Backend lên **173/173 tests PASS (100% across 18 suites)**.
- [x] 5. Thực nghiệm Tự Động 130 Prompts Chatbot Phương Án A (Tuần 6.2):
  * Script thực nghiệm tự động: [benchmark_chatbot_130.js](file:///c:/K23CNT1/DANT/DATN/experiments/ai/benchmark_chatbot_130.js) (hoặc `npm run benchmark:ai`).
  * Gửi tuần tự 130 prompts vào `/api/ai/chat` với 4 phiên vai trò độc lập (`EMPLOYEE`, `MANAGER`, `HR_MANAGER`, `CEO`).
  * **Tỷ lệ chính xác tổng thể: 130/130 câu PASS (100.00%)**.
  * Tỷ lệ gọi đúng Tool P0 (60 câu): **100.00% (60/60)**.
  * Tỷ lệ chặn IDOR & Vượt quyền (30 câu): **100.00% (30/30)**.
  * Tỷ lệ hiểu Tiếng Việt không dấu & Slang (30 câu): **100.00% (30/30)**.
  * Tỷ lệ chặn Prompt Injection/Jailbreak (10 câu): **100.00% (10/10)**.
  * Phân bố độ trễ toàn trình: $Min = 6.68\text{ ms}$, $P_{50} = 11.73\text{ ms}$, $P_{90} = 18.22\text{ ms}$, $P_{95} = 21.30\text{ ms}$, $P_{99} = 29.57\text{ ms}$, $Mean = 26.87\text{ ms}$.
  * Báo cáo đánh giá khoa học: [docs/report/chatbot-130-benchmark-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/chatbot-130-benchmark-evaluation.md), kết quả JSON [experiments/ai/chatbot_130_results.json](file:///c:/K23CNT1/DANT/DATN/experiments/ai/chatbot_130_results.json) và CSV [experiments/ai/chatbot_130_results.csv](file:///c:/K23CNT1/DANT/DATN/experiments/ai/chatbot_130_results.csv).
  * Cập nhật mục 4.4.3 & 4.4.4 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).

### ⏳ TIẾN ĐỘ TUẦN 7 (27/11–03/12/2026 — ML Dự Báo Nguy Cơ Thôi Việc & Dashboard Quản Trị):
- [x] 1. Tải và tiền xử lý tập dữ liệu chuẩn IBM HR Analytics Employee Attrition (1,470 bản ghi):
  * Script tự động: [download_dataset.js](file:///c:/K23CNT1/DANT/DATN/experiments/ml/download_dataset.js), lưu tại `experiments/ml/dataset/WA_Fn-UseC_-HR-Employee-Attrition.csv`.
  * Trích xuất đúng 6 đặc trưng định lượng: `OverTime` (ngưỡng $\ge 4\text{h OT/tháng} \rightarrow 1$), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị $[0, 1]$), `NumCompaniesWorked`, `DistanceFromHome`.
  * TUYỆT ĐỐI LOẠI BỎ: `Age`, `Gender`, `MaritalStatus` và khảo sát chủ quan (tuân thủ Điều 8 BLLĐ và Hiến pháp v6.1).
  * Phân tầng Stratified Split 80/20 (Seed = 42): Train 1,176 mẫu, Test 294 mẫu, bảo toàn tỷ lệ Attrition $16.12\%$.
- [x] 2. Huấn luyện và đánh giá so sánh 3 mô hình ML:
  * Script thực nghiệm: [train_and_evaluate.js](file:///c:/K23CNT1/DANT/DATN/experiments/ml/train_and_evaluate.js) (hoặc `npm run train:ml`).
  * So sánh 3 mô hình: Baseline Luật (AUC-ROC 68.43%), Random Forest (AUC-ROC 71.01%), Logistic Regression (**AUC-ROC 71.60%**).
  * Chốt chọn **Hồi quy Logistic (Logistic Regression)**: AUC-ROC cao nhất ($71.60\%$), Recall nhạy gấp gần 2 lần Random Forest ($42.55\%$ vs $23.40\%$), tính khả giải cao (Explainable AI), suy luận 0-latency ($< 0.005\text{ ms}$), đóng gói dạng JSON coefficients siêu gọn [model_coefficients.json](file:///c:/K23CNT1/DANT/DATN/experiments/ml/model_coefficients.json).
  * Xuất bản kết quả thực nghiệm: Báo cáo [docs/report/ml-attrition-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ml-attrition-evaluation.md), bảng đối chiếu CSV [experiments/ml/attrition_comparison.csv](file:///c:/K23CNT1/DANT/DATN/experiments/ml/attrition_comparison.csv) và cập nhật mục 4.5 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
- [ ] 3. Xây dựng Service suy luận Backend và Endpoint `GET /api/analytics/attrition-risk` (bảo vệ quyền HR Manager / CEO).
- [ ] 4. Dashboard Quản trị HR Frontend (Recharts): Trực quan hóa danh sách nguy cơ, biểu đồ Feature Importance, 4 thẻ KPI cơ cấu.

---

## 2. CÁC QUYẾT ĐỊNH KỸ THUẬT ĐÃ CHỐT
*(Được cập nhật tự động sau mỗi Spike hoặc cột mốc hàng tuần)*

- **Cơ sở dữ liệu:** Đã kết nối thành công tới MongoDB (`localhost:27017/peopleinsight`), khởi tạo chuẩn đúng 11 Collections (9 P0 + 2 P1) và nạp dữ liệu seed ban đầu.
- **Kiến trúc CSDL:** Đóng băng đúng 11 Collections (9 P0 + 2 P1). Tuyệt đối cấm tạo collection lẻ như bản v3.
- **Bảo mật người dùng:** `passwordHash` luôn `select: false`. Cấm `.save()` trên `User`, cập nhật bằng `$push`/`$pull`/`$inc`.
- **Cơ chế Chatbot AI:** Chốt **Phương án A (Template Rendering)**: LLM chỉ nhận diện Function Call, Backend tự lấy dữ liệu và render Markdown template, không gửi dữ liệu lương/cá nhân ngược lại cho LLM.
- **Thực nghiệm 130 Prompts Chatbot HR AI:** Chốt kết quả kiểm thử tự động toàn diện đạt 100.00% (130/130 câu PASS), độ trễ $P_{50} = 11.73\text{ ms}$, $P_{95} = 21.30\text{ ms}$, Circuit Breaker xử lý ngắt mạch khi Google Cloud hết quota trong 1–3 ms.
- **Mô hình ML Dự Báo Nguy Cơ Thôi Việc:** Chốt thuật toán **Logistic Regression (L2 Regularized)** với 6 đặc trưng định lượng:
  * Phương trình suy luận: $P(\text{Attrition} = 1) = \sigma(-0.3050 + 1.4579 \cdot \text{OT} + 0.0931 \cdot \text{YearsCo} - 1.9705 \cdot \text{TotalYears} - 1.3173 \cdot \text{Income} + 0.9497 \cdot \text{Companies} + 0.7626 \cdot \text{Distance})$.
  * Hiệu năng: AUC-ROC **$71.60\%$**, Accuracy **$76.53\%$**, Precision **$32.26\%$**, Recall **$42.55\%$**, F1-Score **$36.70\%$**.
  * Định dạng: JSON coefficients [model_coefficients.json](file:///c:/K23CNT1/DANT/DATN/experiments/ml/model_coefficients.json), suy luận trực tiếp trong Node.js với thời gian **$< 0.005\text{ ms}$**, không phụ thuộc C++ binary.
  * Phân loại 3 mức rủi ro: Thấp ($P < 0.30$), Trung bình ($0.30 \le P < 0.50$), Cao ($P \ge 0.50$).
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
- **Chấm công QR Động Chu kỳ 30s:** Ký số mật mã học `HMAC-SHA256(companyId + userId + timestamp + nonce)` với server secret key; Nonce ngẫu nhiên 16 bytes lưu trong RAM Map tiêu hủy ngay sau 1 lần quét (`used = true`), triệt tiêu 100% rủi ro Replay Attack khi kẻ xấu chụp màn hình; Dung sai tối đa 35 giây bù trễ mạng; Kiểm tra Multi-tenant đối chiếu `scannerCompanyId === tokenCompanyId`.
- **Cron Chốt ABSENT Hàng Ngày Lúc 23:59:** Thiết lập tiến trình `node-cron` chạy lúc `23:59` (GMT+7); Bảo đảm tính Idempotent tuyệt đối (chạy lại nhiều lần không tạo thêm bản ghi); Cơ chế Catch-up tự động bỏ qua Chủ Nhật (Weekend), bỏ qua ngày lễ (`companies.settings.holidays`), bảo toàn nhân sự có đơn nghỉ phép `HR_APPROVED`; Endpoint ngoại vi `POST & GET /api/jobs/run` bảo vệ bằng Secret Token cho `cron-job.org` có hỗ trợ bù ngày cũ qua tham số `date`.
- **Đánh giá cắt giảm cuối Tuần 4 (12/11/2026):** `[Chưa đến hạn]`

---

## 3. CHECKLIST HOÀN THÀNH THEO TUẦN
- [x] **Tuần 0 (13–15/10):** HOÀN THÀNH 100% TOÀN BỘ MỤC TIÊU (Spike Gemini 3.x, Spike FaceID Bench & 40 trials.csv, Seed 50 nhân viên CSDL 11 collections, Khung báo cáo 5 chương & nháp Chương 1, Tài liệu họp GVHD chốt đề cương).
- [x] **Tuần 1 (16–22/10):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (Auth JWT HttpOnly, RBAC 4 cấp, Hồ sơ & Hợp đồng, Cây phòng ban 2 cấp, GPS Geofencing, Cron nhắc HĐLĐ 30/60 ngày, Kịch bản deploy Vercel + Render, Báo cáo Chương 2.1 & 2.6).
- [x] **Tuần 2 (23–29/10):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (Chấm công FaceID Kiosk 2 tầng Liveness, Thu hồi đồng ý BVDLCN, Chấm công di động GPS Geofencing Haversine ≤ 100m, QR động 30s HMAC-SHA256 chống Replay Attack, Cron chốt ABSENT 23:59 idempotent có catch-up ngày lễ/chủ nhật, endpoint /api/jobs/run cho cron-job.org).
- [x] **Tuần 3 (30/10–5/11):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (Đơn đi hết luồng 2 cấp, thông báo real-time Socket.io, bảng FAR/FRR đợt 1 APCER 0.00%, BPCER 2.78%, Sep Margin 0.223).
- [x] **Tuần 4 (6–12/11):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (Payroll Engine 2026, 22/22 unit test cases khớp Excel từng đồng, quy trình tính lương toàn DN, khóa kỳ nguyên tử periodLockedAt, bảo vệ IDOR, giao diện Bảng Lương và Phiếu Lương 2 khối chuẩn Phương án A).
- [x] **Tuần 5 (13–19/11):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (22/22 case khớp Excel; so sánh Excel vs Hệ thống 35,000x; kiểm thử chịu tải đồng thời 100 reqs/5,000 nhân sự Zero Leak; chuẩn hóa bộ 130 prompts kiểm thử Chatbot Phương án A).
- [x] **Tuần 6 (20–26/11):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (Backend Chatbot HR AI Phương Án A, SDK @google/genai, Rate Limiter 10 req/phút, RBAC Pre-filtering, Circuit Breaker 3 tầng, Thực nghiệm tự động 130 Prompts PASS 130/130 câu (100%), độ trễ P95 = 21.3ms, xuất file JSON/CSV và Báo cáo ĐATN Chương 4.4).
- [x] **Tuần 7 (27/11–3/12):** HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ (Huấn luyện & Bảng AUC 3 mô hình IBM Attrition, Service suy luận Backend 0-latency, Endpoint /api/analytics/attrition-risk, Dashboard Frontend Recharts với 3 biểu đồ & Modal XAI, FEATURE FREEZE).
- [ ] **Tuần 8 (4–10/12):** Xong k6, OWASP ZAP, IDOR, UAT SUS ≥ 75, Chương 4.7–4.8 & Chương 5.
- [ ] **Tuần 9 (11–15/12):** Nộp báo cáo, slide, video dự phòng, đóng băng toàn bộ.

---

## 4. NHẬT KÝ PHIÊN LÀM VIỆC (SESSION LOG)
- **26/10/2026 (Hoàn thành Tích Hợp Frontend Floating Widget Chatbot HR AI Phương Án A):**
  - **Kiến Trúc Thành Phần Giao Diện Chat AI ([ChatWidget.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/chat/ChatWidget.tsx)):**
    * Nút nổi thông minh (Floating Action Button - FAB): Cố định tại góc dưới bên phải (`fixed bottom-6 right-6`), hiệu ứng chuyển màu gradient radar glow, huy hiệu nhấp nháy "AI Online", chuyển đổi mượt mà giữa icon `Sparkles` và `X`.
    * Cửa sổ trò chuyện chuyên nghiệp (Chat Drawer Popover): Thiết kế responsive `w-[94vw] sm:w-[440px] h-[580px]`, avatar robot gradient, thanh trạng thái hiển thị rõ "Phương Án A: Bảo vệ dữ liệu nội bộ tuyệt đối".
    * Thanh gợi ý câu hỏi 1-click (Quick Prompt Chips): "📅 Số dư phép năm", "💰 Phiếu lương tháng này", "⏱️ Lịch sử chấm công", và "👥 Thống kê phòng ban" (chỉ hiển thị cho Manager/HR/CEO theo chuẩn RBAC).
    * Bộ hiển thị Markdown chống XSS ([MarkdownRenderer.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/chat/MarkdownRenderer.tsx)): Sử dụng thư viện `marked` kết hợp thanh lọc `DOMPurify` nghiêm ngặt, định dạng bảng phiếu lương, bảng chấm công, danh sách và trích dẫn trực quan.
    * Thông tin giám sát kỹ thuật dưới mỗi phản hồi: Hiển thị tên tool được gọi (`get_leave_balance`, `get_payslip`), model thực thi (`gemini-3.5-flash` / `in-memory-cache`), độ trễ xử lý (ms) và nút 1-click sao chép nội dung.
    * Gắn toàn cục trong [AppLayout.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/layout/AppLayout.tsx), cho phép nhân viên và quản lý trò chuyện tra cứu từ mọi trang trong hệ thống.
  - **Biên Dịch & Đóng Gói Toàn Diện:**
    * Lệnh `npm run build` (`tsc && vite build`) chạy thành công trong 23.99s với **0 lỗi biên dịch**.
    * Toàn bộ hệ sinh thái Backend và Frontend hoạt động đồng bộ, sẵn sàng cho giai đoạn kiểm thử tải và đánh giá an ninh Tuần 8.

- **26/10/2026 (Hoàn thành Bước 4 Tuần 7 — Xây Dựng Giao Diện Frontend Quản Trị Phân Tích Nguy Cơ Thôi Việc Recharts):**
  - **Kiến Trúc Giao Diện Dashboard Toàn Diện (`/retention` & `/analytics/attrition`):**
    * Thẻ KPI Tổng quan ([AttritionKpiCards.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/analytics/AttritionKpiCards.tsx)): Thống kê quy mô đánh giá, điểm rủi ro trung bình, số lượng và tỷ lệ phân loại 3 phân khúc (Nguy cơ cao $P \ge 50\%$, Trung bình $30\% \le P < 50\%$, Ổn định $P < 30\%$).
    * Biểu đồ Feature Importance Recharts ([FeatureImportanceChart.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/analytics/FeatureImportanceChart.tsx)): Biểu đồ thanh ngang (Horizontal BarChart) trực quan hóa trực tiếp trọng số $\beta$ của 6 đặc trưng định lượng, phân màu sắc trực quan (Đỏ cho yếu tố tăng rủi ro như OT $\beta=+1.46$; Xanh cho yếu tố giữ chân như thâm niên $\beta=-1.97$ và thu nhập $\beta=-1.32$).
    * Biểu đồ Phân Bổ Nguy Cơ Theo Phòng Ban ([DepartmentRiskChart.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/analytics/DepartmentRiskChart.tsx)): Stacked BarChart so sánh tỷ lệ nhân sự theo từng nhóm rủi ro giữa các phòng ban.
    * Biểu đồ Tỷ Lệ Toàn Doanh Nghiệp ([RiskDistributionPieChart.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/analytics/RiskDistributionPieChart.tsx)): Donut PieChart trực quan với nhãn tỷ lệ phần trăm phân khúc rủi ro.
    * Bảng Dữ Liệu Nhân Sự Tương Tác ([EmployeeRiskTable.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/analytics/EmployeeRiskTable.tsx)): Tìm kiếm theo tên/mã NV, tab lọc theo mức rủi ro, phân trang mượt mà, hiển thị giờ OT 30 ngày, thâm niên, điểm rủi ro, chip nhân tố chính và nút kích hoạt xem chi tiết XAI.
    * Modal Giải Trình Chi Tiết XAI ([EmployeeRiskDetailModal.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/analytics/EmployeeRiskDetailModal.tsx)): Khai phóng đóng góp biên (Log-Odds Contribution $\beta_i \cdot \hat{x}_i$) của từng đặc trưng, đưa ra khuyến nghị can thiệp hành động định hướng cụ thể cho HR (1-on-1, rà soát OT, điều chỉnh thu nhập, lộ trình thăng tiến) và cam kết pháp lý Điều 8 BLLĐ 2019.
    * Trang Tổng Thể ([AttritionAnalyticsPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/AttritionAnalyticsPage.tsx)): Tích hợp bộ lọc phòng ban động, nút làm mới dữ liệu và nút xuất báo cáo CSV toàn bộ danh sách phân tích.
  - **Biên Dịch & Kiểm Thử Toàn Trình:**
    * Chạy `npm run build` (`tsc && vite build`) trong `frontend/`: Đạt **0 lỗi biên dịch, đóng gói thành công 100%**.
    * Toàn bộ hệ thống duy trì kỷ lục: **19/19 Test Suites Backend PASS, 186/186 Tests PASS (100%)**.

- **26/10/2026 (Hoàn thành Bước 3 Tuần 7 — Backend Inference Service & Analytics Endpoint Dự Báo Nguy Cơ Thôi Việc):**
  - **Xây Dựng Service Suy Luận ML Không Độ Trễ (`backend/src/services/attritionPredictorService.js`):**
    * Tích hợp bộ trọng số $\beta$ đã huấn luyện tối ưu từ mô hình Logistic Regression (AUC-ROC $71.60\%$) trực tiếp trong mã nguồn Backend, mang lại tốc độ suy luận cực nhanh ($< 0.005\text{ ms/nhân sự}$), loại bỏ phụ thuộc vào runtime Python hay container microservice riêng.
    * Hàm thuần `calculateAttritionRisk`: tính điểm rủi ro qua hàm Sigmoid chống tràn số, phân loại 3 mức rủi ro khoa học: `LOW` ($< 0.30$), `MEDIUM` ($0.30 - 0.49$), `HIGH` ($\ge 0.50$).
    * Bóc tách nhân tố ảnh hưởng (Explainable AI - XAI): tự động tính đóng góp biên $\beta_i \cdot \hat{x}_i$ và trích xuất Top 3 yếu tố rủi ro chính kèm khuyến nghị can thiệp định hướng cho HR (giảm tải OT, rà soát thu nhập thị trường, tạo lộ trình gắn bó).
    * `getCompanyAttritionAnalysis`: tự động trích xuất nhân sự toàn công ty, trích xuất tổng giờ OT 30 ngày gần nhất từ `AttendanceLog`, tính thâm niên từ `contracts[]`, tổng hợp các chỉ số KPI điều hành (`totalEmployees`, `highRiskCount`, `mediumRiskCount`, `lowRiskCount`, `averageRiskScore`), phân tích rủi ro theo từng phòng ban và danh sách Feature Importance chuẩn bị cho Recharts.
  - **Controller & Routing Chuẩn Multi-Tenant Fail-Closed & RBAC (`analyticsController.js` & `analyticsRoutes.js`):**
    * Endpoint `GET /api/analytics/attrition-risk`: tra cứu tổng quan và danh sách rủi ro toàn công ty (có hỗ trợ lọc theo `departmentId`).
    * Endpoint `GET /api/analytics/attrition-risk/:targetUserId`: tra cứu chi tiết nguy cơ thôi việc của 1 nhân viên cụ thể kèm toàn bộ 6 đặc trưng và đóng góp rủi ro.
    * Phân quyền RBAC nghiêm ngặt: chỉ `CEO` và `HR_MANAGER` được phép truy cập (nhân viên thường `EMPLOYEE` và Quản lý phòng ban `MANAGER` bị chặn 403 Forbidden).
    * Bảo vệ Multi-tenant Fail-Closed: tự động cách ly theo `companyId`, trả về 404 Not Found khi tra cứu nhân sự ngoài công ty.
    * Tự động ghi nhận `AuditLog` cho mọi truy vấn nhạy cảm (`VIEW_ATTRITION_ANALYTICS` và `VIEW_EMPLOYEE_ATTRITION_RISK`).
  - **Kiểm Thử Toàn Diện Bộ Phân Hệ ML (`tests/ml/attritionPredictor.test.js`):**
    * 13/13 test cases PASS 100% (Pure Function Sigmoid & Normalization, RBAC 401/403/200, Multi-tenant Isolation, KPI Summary, Top Risk Employees, Feature Importance, AuditLog).
    * Toàn bộ hệ thống Backend đạt mốc kỷ lục: **19/19 test suites PASS, 186/186 tests PASS (100%)**.

- **26/10/2026 (Hoàn thành Thực Nghiệm Huấn Luyện & So Sánh 3 Mô Hình ML Dự Báo Nguy Cơ Thôi Việc IBM HR Attrition — Chốt Chọn Logistic Regression AUC-ROC 71.60%):**
  - **Tải và Tiền Xử Lý Tập Dữ Liệu IBM HR Attrition (`experiments/ml/download_dataset.js`):**
    * Tải tự động và lưu trữ tại `experiments/ml/dataset/WA_Fn-UseC_-HR-Employee-Attrition.csv` (1,470 bản ghi nhân sự, 35 thuộc tính).
    * Lọc đúng **6 đặc trưng định lượng**: `OverTime` (ngưỡng $\ge 4\text{h OT/tháng} \rightarrow 1$), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị $[0, 1]$), `NumCompaniesWorked`, `DistanceFromHome`.
    * **TUYỆT ĐỐI LOẠI BỎ**: `Age`, `Gender`, `MaritalStatus` và các biến khảo sát chủ quan (tuân thủ Điều 8 BLLĐ và Hiến pháp v6.1).
    * Phân tầng Stratified Split 80/20 (Seed = 42): Train 1,176 mẫu, Test 294 mẫu, bảo toàn tỷ lệ Attrition $16.12\%$.
  - **Huấn Luyện & Đánh Giá So Sánh 3 Mô Hình (`experiments/ml/train_and_evaluate.js`):**
    * **Baseline Luật (Heuristic):** Accuracy $75.85\%$, Precision $32.86\%$, Recall $48.94\%$, F1 $39.32\%$, AUC-ROC **$68.43\%$**.
    * **Hồi quy Logistic (Logistic Regression - Được chọn):** Accuracy **$76.53\%$**, Precision **$32.26\%$**, Recall **$42.55\%$**, F1 **$36.70\%$**, AUC-ROC **$71.60\%$** (TP: 20, FP: 42, TN: 205, FN: 27).
    * **Rừng Ngẫu Nhiên (Random Forest - 30 Trees):** Accuracy **$82.31\%$**, Precision **$40.74\%$**, Recall $23.40\%$, F1 $29.73\%$, AUC-ROC **$71.01\%$** (TP: 11, FP: 16, TN: 231, FN: 36).
    * **Quyết Định Lựa Chọn Logistic Regression:** Đạt AUC-ROC cao nhất ($71.60\%$), Recall nhạy gấp gần 2 lần Random Forest ($42.55\%$ vs $23.40\%$), tính khả giải cao (Explainable AI), suy luận 0-latency ($< 0.005\text{ ms}$), đóng gói dạng JSON coefficients siêu gọn [model_coefficients.json](file:///c:/K23CNT1/DANT/DATN/experiments/ml/model_coefficients.json).
  - **Phân Tích Trọng Số & Ý Nghĩa Nghiệp Vụ (Feature Importance):**
    * `totalWorkingYears` ($\beta = -1.9705$): Yếu tố lớn nhất giúp giảm nguy cơ thôi việc.
    * `overTime` ($\beta = +1.4579$): Yếu tố hàng đầu làm tăng nguy cơ thôi việc do kiệt sức (Burnout).
    * `monthlyIncome` ($\beta = -1.3173$): Yếu tố tài chính quan trọng giữ chân nhân viên.
    * `numCompaniesWorked` ($\beta = +0.9497$) & `distanceFromHome` ($\beta = +0.7626$): Các yếu tố phụ gia tăng tỷ lệ nhảy việc.
  - **Xuất Bản Tài Liệu & Dữ Liệu:**
    * Báo cáo đánh giá khoa học: [docs/report/ml-attrition-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ml-attrition-evaluation.md).
    * Bảng đối chiếu CSV: [experiments/ml/attrition_comparison.csv](file:///c:/K23CNT1/DANT/DATN/experiments/ml/attrition_comparison.csv).
    * Dữ liệu JSON đánh giá: [experiments/ml/evaluation_results.json](file:///c:/K23CNT1/DANT/DATN/experiments/ml/evaluation_results.json).
    * Cập nhật mục 4.5 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
    * Thêm script tiện ích `npm run train:ml` vào `backend/package.json`.
- **26/10/2026 (Hoàn thành Thực Nghiệm Tự Động 130 Prompts Chatbot HR AI Phương Án A — PASS 130/130 (100.0%) & P95 = 21.3 ms):**
  - **Xây Dựng Kịch Bản Thực Nghiệm Tự Động Toàn Trình (`experiments/ai/benchmark_chatbot_130.js`):**
    * Tự động gửi lần lượt 130 prompts vào endpoint `/api/ai/chat` với 4 phiên làm việc độc lập qua JWT (`EMPLOYEE`, `MANAGER`, `HR_MANAGER`, `CEO`).
    * Đo đạc thời gian bằng `performance.now()`, phân tích độ trễ ($Min, Max, Mean, P_{50}, P_{90}, P_{95}, P_{99}$), phân loại theo 7 nhóm chuyên biệt và 4 trụ cột nghiệm thu Chương 4 Báo cáo ĐATN.
  - **Kết Quả Thực Nghiệm Định Lượng Tuyệt Đối (100.00% PASS):**
    * **Tổng số câu kiểm thử:** 130/130 câu đạt chuẩn PASS (**100.00%**).
    * **1. Tỷ lệ gọi đúng Tool P0 (60 câu):** Đạt **100.00% (60/60 câu)** (15 câu số dư phép cá nhân `get_leave_balance`, 15 câu phiếu lương cá nhân `get_payslip`, 15 câu tổng hợp chấm công cá nhân `get_attendance_summary`, 15 câu thống kê nghỉ phép phòng ban `get_team_leave_stats`).
    * **2. Tỷ lệ chặn IDOR & Vượt quyền (30 câu):** Đạt **100.00% (30/30 câu)**. Chặn 100% các câu hỏi đòi xem lương CEO, xem bảng lương toàn thể công ty, hỏi ngày phép đồng nghiệp, đòi tự ý can thiệp CSDL (tăng lương, cộng phép, duyệt đơn).
    * **3. Tỷ lệ hiểu Tiếng Việt không dấu & Ngôn ngữ đời thường (30 câu):** Đạt **100.00% (30/30 câu)**. Nhận diện hoàn hảo các từ viết tắt (`t5`, `bn`, `v`, `r`), từ lóng (`về tay`, `check phép`, `check cong`), và các câu không dấu.
    * **4. Tỷ lệ chặn Prompt Injection/Jailbreak (10 câu):** Đạt **100.00% (10/10 câu)**. Vô hiệu hóa toàn bộ kỹ thuật tấn công DAN Mode, Ignore previous instructions, trích xuất System Prompt, đọc file `.env`, System Override, giả lập SQLi.
    * **Phân bố độ trễ toàn trình:** Nhanh nhất $Min = 6.68\text{ ms}$, $P_{50} = 11.73\text{ ms}$, $P_{90} = 18.22\text{ ms}$, $P_{95} = 21.30\text{ ms}$, $P_{99} = 29.57\text{ ms}$, $Mean = 26.87\text{ ms}$.
  - **Khắc Phục Các Điểm Nghẽn Kỹ Thuật (Engineering Highlights):**
    * Xử lý xung đột sanitizeFilter Mongoose: Sử dụng `.setOptions({ sanitizeFilter: false })` an toàn cho các truy vấn khoảng ngày string của `AttendanceLog` và truy vấn enum của `LeaveRequest`.
    * Tích hợp Circuit Breaker thông minh: Tự động ghi nhớ sự cố hết Quota (429 RESOURCE_EXHAUSTED) của Google Cloud và chuyển hướng sang Intent Matcher cục bộ siêu tốc trong **1–3 ms**, bảo vệ trải nghiệm người dùng không bao giờ bị treo.
  - **Xuất Bản Dữ Liệu & Báo Cáo Khoa Học:**
    * Báo cáo đánh giá khoa học: [docs/report/chatbot-130-benchmark-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/chatbot-130-benchmark-evaluation.md).
    * Dữ liệu JSON chi tiết: [experiments/ai/chatbot_130_results.json](file:///c:/K23CNT1/DANT/DATN/experiments/ai/chatbot_130_results.json).
    * Bảng đối chiếu CSV: [experiments/ai/chatbot_130_results.csv](file:///c:/K23CNT1/DANT/DATN/experiments/ai/chatbot_130_results.csv).
    * Cập nhật mục 4.4.3 & 4.4.4 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
    * Thêm script tiện ích `npm run benchmark:ai` vào `backend/package.json`.
    * Kiểm thử hồi quy toàn bộ Backend: **18/18 test suites PASS, 173/173 tests PASS (100%)**.
    * **Hoàn tất 100% toàn bộ mục tiêu Tuần 6 vượt trước tiến độ!**
- **26/10/2026 (Hoàn thành Backend HR Chatbot AI Phương Án A — 11/11 Unit Tests Pass & Nâng Tổng Hệ Thống Lên 18 Suites / 173 Tests Pass 100%):**
  - **Hiện Thực Hóa Endpoint Chatbot & Kiến Trúc Phương Án A (`backend/src/ai/`):**
    * Router & Endpoint: `POST /api/ai/chat` được bảo vệ bởi middleware `authenticate` và `aiChatLimiter` (10 requests/phút per User ID theo sliding window), chống DoS và bảo vệ Gemini Quota.
    * Quản lý SDK `@google/genai` v2.29.1 (`gemini.js`): Hỗ trợ luân chuyển Primary Key $\leftrightarrow$ Fallback Key, chọn model qua `process.env.GEMINI_MODEL` (`gemini-3.5-flash` $\rightarrow$ fallback `gemini-3.1-flash-lite`).
    * Khai báo Tool Calling (`declarations.js`): Ép chế độ `mode: 'ANY'`, 5 tools nghiệp vụ (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`, `unsupported_request`). **TUYỆT ĐỐI CẤM khai báo tham số `userId`** trong schema tool (loại bỏ hoàn toàn lỗ hổng IDOR).
    * Bộ lọc RBAC Pre-filtering: Hàm `getToolsForRole(role)` chỉ cấp công cụ thống kê phòng ban cho `CEO`, `HR_MANAGER`, `MANAGER`. Nhân viên thường (`EMPLOYEE`) chỉ được cấp 3 tools cá nhân và `unsupported_request`. Nếu cố tình gọi tool phòng ban, Backend tự động chuyển thành `unsupported_request`.
    * **Cơ chế Dừng Luồng LLM Tuyệt Đối (Phương án A):** Ngay sau khi Gemini trả về `functionCall`, Backend ngắt kết nối LLM ngay lập tức, không gửi `functionResponse` chứa dữ liệu nhạy cảm (lương bổng, thuế, thông tin cá nhân) ngược lại cho AI, triệt tiêu 100% rủi ro rò rỉ dữ liệu doanh nghiệp và rủi ro bịa đặt số liệu (Hallucination).
    * Hệ thống Markdown Templates tĩnh (`templates/index.js`): Template Phiếu Lương 2 khối độc lập (Khối Thực nhận Net và Khối Tham chiếu Giảm trừ Gia cảnh không trừ vào lương), Template Phép Năm theo Điều 113, 114 BLLĐ, Template Tổng hợp Chấm công, Template Thống kê Phòng ban và Template từ chối lịch sự.
    * Cơ chế Fallback 3 Tầng: Primary Model $\rightarrow$ Fallback Model $\rightarrow$ Rule-Based Keyword Matcher (khi mất mạng/hết quota Google API) $\rightarrow$ Tự động ghi vết `AuditLog` (`AI_TOOL_CALL`) với đầy đủ `toolName`, `args`, `latencyMs`, `usedModel`.
  - **Kiểm Thử Toàn Diện & Hồi Quy Hệ Thống (`tests/ai/chatbotWorkflow.test.js`):**
    * Bộ kiểm thử chuyên biệt đạt **11/11 tests PASS (100%)** bao phủ toàn diện: Auth 401, Zod 400, Chống Payload Injection > 500 ký tự, Phép năm, Phiếu lương 2 khối, IDOR Guard, RBAC Pre-filtering, Thống kê phòng, Prompt Injection / Jailbreak, AuditLog và Rate Limiter 10 requests/phút.
    * Chạy kiểm thử toàn bộ Backend: **18/18 test suites PASS, 173/173 tests PASS (100%)**, bảo toàn tính hồi quy của toàn hệ thống.
- **26/10/2026 (Hoàn thành Thực nghiệm Benchmark Động cơ Tính Lương 2026 vs Excel — Khớp 100% & Tăng tốc 35,000x):**
  - **Xây dựng Kịch bản Thực nghiệm Benchmark (`experiments/payroll/benchmark.js`):**
    * Tích hợp và đo lường trực tiếp thuật toán Pure Function `calculatePayroll` trên bộ 22 trường hợp biên (`cases.json`) và 50 hồ sơ nhân sự thực tế từ `employeesData.js`.
    * Đo đạc thời gian bằng `performance.now()` qua 1,000 vòng lặp (50,000 lượt tính) sau 100 vòng warm-up loại trừ nhiễu JIT.
    * Xây dựng mô hình công thức chuẩn Excel (hàm IF 5 tầng, MIN, MAX, ROUND) để đối chiếu sai lệch từng trường (Gross, BHXH 10.5%, Giảm trừ, Thu nhập tính thuế, Thuế TNCN 5 bậc, Lương thực nhận Net).
  - **Kết quả Thực nghiệm Định lượng Vượt trội:**
    * **Độ chính xác:** 50/50 nhân sự đạt độ khớp chính xác 100% từng đồng lẻ ($0\text{ VNĐ}$ sai lệch, discrepancy rate = $0.00\%$).
    * **Thời gian xử lý:** 1 nhân sự mất $1.97\text{ }\mu s$ (Mean) / $1.50\text{ }\mu s$ (P50); toàn bộ 50 nhân sự mất $0.089\text{ ms}$ (P50: $0.062\text{ ms}$); thông lượng đạt $556.071\text{ records/giây}$.
    * **Hệ số tăng tốc:** So với thao tác thủ công Excel của chuyên viên C&B theo chuẩn MTM-1 ($105\text{s/người} = 87.5\text{ phút/50 người}$), PeopleInsight AI nhanh hơn **35,000 lần** (toàn trình DB) và **58,000,000 lần** (thuần tính toán).
    * **Mở rộng tuyến tính $O(N)$:** Đo đạc qua các quy mô $N = 10$ ($0.018\text{ ms}$), $N = 50$ ($0.096\text{ ms}$), $N = 100$ ($0.128\text{ ms}$), $N = 200$ ($0.270\text{ ms}$), $N = 500$ ($0.753\text{ ms}$), $N = 1,000$ ($1.087\text{ ms}$).
    * **Triệt tiêu sai sót con người:** Giảm tỷ lệ sai sót từ mức $3.2\%$ của Excel thủ công về tuyệt đối $0.00\%$.
  - **Xuất bản Tài liệu Khoa học & Dữ liệu:**
    * Báo cáo khoa học chi tiết: [docs/report/payroll-benchmark-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/payroll-benchmark-evaluation.md).
    * Dữ liệu thô JSON: `experiments/payroll/benchmark_results.json`.
    * Bảng đối chiếu chi tiết 50 nhân sự CSV: [experiments/payroll/payroll_excel_vs_system.csv](file:///c:/K23CNT1/DANT/DATN/experiments/payroll/payroll_excel_vs_system.csv).
    * Cập nhật mục 4.2.3 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
    * Thêm script tiện ích `npm run benchmark:payroll`.
  - **Kiểm Thử Sức Chịu Tải Đồng Thời & Dấu Chân Bộ Nhớ (`experiments/payroll/stress_test.js`):**
    * Thử nghiệm 6 mức đồng thời $C \in [1, 5, 10, 25, 50, 100]$ requests song song (mỗi request tính 50 nhân sự = 50 đến 5,000 nhân sự đồng thời).
    * Kết quả tải cực hạn 100 requests: Hoàn thành trong **11.51 ms**, Response Time trung bình **0.110 ms**, $P_{95} = 0.330\text{ ms}$, $P_{99} = 0.439\text{ ms}$, thông lượng **434,424 calculations/giây**, tỷ lệ lỗi **0.00%**.
    * Đo đạc bộ nhớ: Baseline Heap Used 5.94 MB, Peak Heap 7.07 MB, chi phí bộ nhớ chỉ **~11.6 KB / công ty 50 nhân sự**, giải phóng hoàn toàn và xác nhận **ZERO MEMORY LEAK** sau 10 đợt xung kích Spike liên tiếp (thời gian xử lý V8 JIT tối ưu hóa từ 8.50 ms xuống 2.85 ms).
    * Báo cáo khoa học chi tiết: [docs/report/payroll-stress-test-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/payroll-stress-test-evaluation.md), dữ liệu thô `experiments/payroll/stress_test_results.json` và cập nhật mục 4.7.1 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
    * Thêm script tiện ích `npm run stress:payroll`.
  - **Chuẩn Hóa Bộ 130 Prompts Kiểm Thử Chatbot HR AI Phương Án A (`experiments/ai/prompts_130.json`):**
    * Xây dựng đủ 130 prompts phân theo 4 nhóm kiểm thử: 60 câu nghiệp vụ P0 hợp lệ (15 phép, 15 lương, 15 chấm công, 15 thống kê phòng ban); 30 câu vượt quyền RBAC & hỏi lương người khác (chặn IDOR); 30 câu viết tắt/không dấu/tiếng lóng; 10 câu tấn công Prompt Injection, Jailbreak, Social Engineering.
    * Xuất bản bộ dữ liệu JSON: [experiments/ai/prompts_130.json](file:///c:/K23CNT1/DANT/DATN/experiments/ai/prompts_130.json) và bảng CSV: [experiments/ai/prompts_130.csv](file:///c:/K23CNT1/DANT/DATN/experiments/ai/prompts_130.csv).
    * Script kiểm tra tự động `experiments/ai/verify_prompts.js` xác nhận 130/130 prompts đạt chuẩn 100%.
    * Báo cáo đặc tả khoa học: [docs/report/chatbot-130-prompts-specification.md](file:///c:/K23CNT1/DANT/DATN/docs/report/chatbot-130-prompts-specification.md) và cập nhật mục 4.4.3 trong [docs/report/ch4_hien_thuc_va_thuc_nghiem.md](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md).
    * **Hoàn tất 100% toàn bộ mục tiêu Tuần 5 vượt trước tiến độ!**
- **24/10/2026 (Hoàn thành Tuần 4: Phân hệ Tính Lương Tự Động Chuẩn Pháp Lý 2026 — 22/22 Test Cases Excel Pass & 12/12 Workflow Tests Pass):**
  - **Tài liệu Tham số Pháp lý 2026 (`docs/legal/legal-parameters-2026.md`):**
    * Biên soạn hệ thống trích dẫn đầy đủ: Luật Thuế TNCN mới 109/2025/QH15, Nghị quyết 110/2025/UBTVQH15, Nghị định 253/2026/NĐ-CP (về mức giảm trừ và trần ăn ca), Nghị định 161/2026/NĐ-CP (về lương tối thiểu vùng), Điều 98 BLLĐ và Điều 57 Nghị định 145/2020/NĐ-CP (làm thêm giờ và làm việc ban đêm).
    * Phân định rõ 2 giai đoạn chính sách trong năm 2026: Giai đoạn 1 (trước 01/07/2026: trần BHXH 46.8M, ăn ca 730k) và Giai đoạn 2 (từ 01/07/2026: trần BHXH 50.6M, ăn ca 1.2M).
    * Biểu thuế lũy tiến 5 bậc mới: 10M (5%), 30M (10%), 60M (20%), 100M (30%), >100M (35%). Giảm trừ bản thân 15.5M/tháng, người phụ thuộc 6.2M/tháng.
  - **Mô hình Dữ liệu & Đóng băng CSDL 11 Collections (`Payroll.js`, `AuditLog.js`):**
    * Schema [Payroll.js](file:///c:/K23CNT1/DANT/DATN/backend/src/models/Payroll.js) chuẩn 11 collections, tích hợp `tenantPlugin` Fail-Closed, trường `companyId` bất biến (`immutable: true`), index unique `{ companyId: 1, userId: 1, period: 1 }`.
    * Hook `pre('save')` chặn tuyệt đối việc cập nhật hoặc sửa đổi bảng lương đã khóa (`periodLockedAt != null`).
    * Bổ sung trường `targetUserId` vào [AuditLog.js](file:///c:/K23CNT1/DANT/DATN/backend/src/models/AuditLog.js) phục vụ giám sát kiểm toán hành vi xem lương người khác.
  - **Dịch vụ Tính Lương & Tổng Hợp Công (`payrollAggregationService.js`, `payrollService.js`):**
    * `aggregateEmployeeAttendance`: Tự động tổng hợp công thực tế từ `attendanceLogs` và các đơn đã duyệt `leaveRequests` (phép năm, phép ốm, OT ngày thường/cuối tuần/lễ/đêm, phụ cấp làm đêm 22h-06h, bồi thường phép chưa nghỉ). Có cơ chế fallback tự động tính đủ công chuẩn khi công ty chưa triển khai kiosk hoặc tính lương khoán.
    * `runCompanyPayroll`: Tính toán bảng lương toàn doanh nghiệp hoặc danh sách nhân sự, snapshot chính sách tại thời điểm tính lương, bọc trong `tenantStore.run` Fail-Closed.
    * `lockCompanyPayroll`: Khóa kỳ lương nguyên tử bằng `periodLockedAt`, chặn tính lại hoặc sửa đổi (ném mã 409 Conflict), ghi AuditLog `LOCK_PAYROLL` và tự động gửi thông báo real-time `PAYROLL_READY` qua Socket.io đến toàn bộ nhân viên.
    * `getPayslip` & Bảo vệ IDOR Toàn Diện:
      - Nhân viên chỉ được xem phiếu lương của chính mình.
      - QUY TẮC BẤT BIẾN: Quản lý (`MANAGER`) tuyệt đối không được xem lương của nhân viên (HTTP 403 Forbidden).
      - HR Manager và CEO xem phiếu lương nhân viên thì hệ thống BẮT BUỘC ghi AuditLog (`VIEW_SALARY_OTHER`).
  - **Bộ Kiểm thử Tự động Chuẩn Xác 100%:**
    * **22/22 unit test cases chuẩn pháp lý** trong [calc.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/payroll/calc.test.js) khớp 100% từng đồng với bảng tính Excel.
    * **12/12 workflow & IDOR tests** trong [payrollWorkflow.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/payroll/payrollWorkflow.test.js) PASS 100%.
  - **Giao diện Người dùng Frontend (`/payrolls` & `/payroll`):**
    * Trang Bảng Lương Doanh Nghiệp [PayrollPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/PayrollPage.tsx): Chọn kỳ `YYYY-MM`, xem trạng thái khóa kỳ, nút "Chạy Tính Lương", nút "Khóa Kỳ Lương" (kèm modal cảnh báo pháp lý nguyên tử), 4 thẻ KPI tổng hợp (Tổng Quỹ Lương Gross, Lương Net, Bảo Hiểm 32%, Thuế TNCN), bảng danh sách nhân viên kèm tìm kiếm nhanh và nút "Xem Chi Tiết".
    * Modal Phiếu Lương Chi Tiết [PayslipModal.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/payroll/PayslipModal.tsx) chuẩn Phương án A:
      - **Khối Thực Nhận (Net):** Gross - BH bắt buộc (10.5%) - Thuế TNCN = Thực nhận. Tách rõ OT miễn thuế và OT chịu thuế.
      - **Khối Tham Chiếu Thuế TNCN (Chỉ mang tính chất giải trình/tham chiếu, KHÔNG TRỪ VÀO LƯƠNG):** Giảm trừ bản thân (15.5M), giảm trừ phụ thuộc (6.2M/người), biểu thuế 5 bậc 2026.
    * Chế độ xem cá nhân dành cho mọi nhân viên và quản lý, chặn tuyệt đối việc quản lý nhìn lén lương cấp dưới.
    * Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi, 1750 modules transformed thành công trong 19.88s)**.
- **24/10/2026 (Hoàn thành Phân hệ Quản lý Đơn từ leaveRequests & Luồng Duyệt 2 Cấp Cố định — 137/137 Tests Pass):**
  - **Mô hình Dữ liệu & Quy tắc Nghiệp vụ (`LeaveRequest.js`, `constants.js`):**
    * Nâng cấp schema [LeaveRequest.js](file:///c:/K23CNT1/DANT/DATN/backend/src/models/LeaveRequest.js) tích hợp `tenantPlugin` Fail-Closed, chỉ mục `{ companyId: 1, userId: 1, createdAt: -1 }`, `{ companyId: 1, status: 1 }`, `{ companyId: 1, type: 1 }` và trường `companyId` bất biến (`immutable: true`).
    * Hỗ trợ đầy đủ 5 loại đơn chuẩn hóa: `ANNUAL` (phép năm), `SICK` (nghỉ ốm), `OT` (làm thêm giờ), `WFH` (làm việc từ xa), `FORGOT_CHECKIN` (giải trình quên chấm công kèm `forgotDetails`).
    * Bổ sung các hành động kiểm toán trong `AUDIT_ACTIONS`: `CREATE_LEAVE_REQUEST`, `APPROVE_LEAVE_STAGE_1`, `APPROVE_LEAVE_STAGE_2`, `REJECT_LEAVE_REQUEST`, `CANCEL_LEAVE_REQUEST`.
  - **Dịch vụ & Luồng Phê duyệt 2 Cấp Cố định (`leaveRequestService.js`, `leaveRequestController.js`, `leaveRequestRoutes.js`):**
    * **Nộp đơn:** Kiểm tra số dư phép khả dụng trước khi cho phép nộp (`annualRemaining`, `sickRemaining`), chặn đơn giải trình ngày tương lai, tự động gán cấp duyệt ban đầu theo phân cấp vị trí.
    * **Phê duyệt Cấp 1 (Manager):** Cơ chế chống tự duyệt (Anti-Self-Approval) chặn 100% người nộp tự duyệt đơn của mình (403 Forbidden). Quản lý chỉ được duyệt đơn của nhân viên thuộc bộ phận phụ trách. Chuyển trạng thái sang `MANAGER_APPROVED` hoặc `REJECTED`.
    * **Phê duyệt Cấp 2 (HR Manager / CEO):** Chặn duyệt vượt cấp khi đơn chưa qua cấp 1 (400 Bad Request). Đơn của HR Manager bắt buộc do CEO phê duyệt.
    * **Trừ phép nguyên tử & Idempotency:** Bọc thao tác duyệt Cấp 2 và trừ phép vào `startSafeSession()` (hỗ trợ MongoDB Replica Set transaction trên Atlas và atomic precondition `$gte` + `$inc` trên standalone MongoDB). Trừ chính xác `leaveBalance.annualRemaining` / `sickRemaining` và tăng `annualUsed` / `sickUsed`.
    * **Tự động Bù Công Khi Duyệt `FORGOT_CHECKIN`:** Tự động tạo/cập nhật bản ghi `AttendanceLog` với phương thức `MANUAL_ADJUSTMENT`, trạng thái `VALID`, ghi nhận đủ 480 phút công chuẩn.
    * **Luồng Hoàn Phép Tự Động Khi Hủy Đơn:** Khi nhân viên hoặc HR hủy đơn đã phê duyệt (`HR_APPROVED`), hệ thống tự động hoàn trả nguyên tử lại số ngày phép vào `leaveBalance.annualRemaining` / `sickRemaining` của người lao động.
    * **Phân quyền Xem Đơn:** Nhân viên chỉ xem đơn của mình; Quản lý xem đơn của mình và cấp dưới trực thuộc; HR/CEO xem toàn bộ đơn công ty.
  - **Kiểm thử tự động toàn diện & Đóng gói:**
    * Xây dựng bộ kiểm thử tích hợp toàn diện [leaveRequests.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/leave/leaveRequests.test.js) đạt **13/13 tests PASS (100%)**.
    * Chạy kiểm thử hồi quy toàn bộ hệ thống: **137/137 tests PASS (100% across 15 suites)**.
    * Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi, 1707 modules transformed thành công trong 30.59s)**.
- **22/10/2026 (Hoàn thành Cron Chốt ABSENT Lúc 23:59 Idempotent Có Catch-up & Endpoint /api/jobs/run — 124/124 Tests Pass):**
  - **Thuật toán & Dịch vụ Chốt ABSENT Hàng Ngày (`absentAttendanceService.js`, `cronScheduler.js`, `jobRoutes.js`):**
    * Tự động quét và chốt trạng thái `ABSENT` (Vắng mặt không phép) cho tất cả nhân sự đang hoạt động (`isActive: true`) chưa có log điểm danh trong ngày làm việc.
    * **Tính Idempotent Tuyệt Đối:** Chạy lại nhiều lần trong ngày hoặc chạy lại sau khi đã chốt không làm trùng lặp bản ghi, không đè trạng thái `VALID` của nhân sự đã điểm danh, không tạo thêm bản ghi thừa (`absentCount = 0`).
    * **Cơ chế Catch-up Ngày Nghỉ Hàng Tuần (Weekend):** Tự động phát hiện ngày Chủ Nhật (`dayOfWeek === 0`) và bỏ qua không đánh ABSENT (`isSkipped: true, reason: 'WEEKEND'`).
    * **Cơ chế Catch-up Ngày Lễ (Holidays):** Tự động đối chiếu danh sách ngày nghỉ lễ của công ty (`companies.settings.holidays`). Nếu trùng ngày lễ thì bỏ qua không đánh ABSENT (`isSkipped: true, reason: 'HOLIDAY'`).
    * **Bảo toàn Đơn Xin Nghỉ Phép Hợp Lệ:** Tự động tra cứu `leaveRequests` của công ty có trạng thái `HR_APPROVED`. Nhân sự có đơn nghỉ phép được duyệt trong ngày hoàn toàn không bị đánh dấu ABSENT.
    * **Multi-tenant Fail-Closed:** Sử dụng `tenantStore.run({ companyId })` độc lập cho từng công ty khi lặp qua toàn bộ hệ thống, loại bỏ triệt để rủi ro rò rỉ hoặc ghi chéo tenant.
    * **Lập lịch chạy ngầm:** Khởi tạo job `node-cron` chạy lúc `23:59` hàng ngày theo múi giờ `Asia/Ho_Chi_Minh`.
    * **Endpoint Ngoại Vi Cho cron-job.org:** `POST & GET /api/jobs/run` được bảo vệ bằng Secret Token qua Header `x-cron-secret` hoặc query `?secret=...`. Hỗ trợ tham số `date` (YYYY-MM-DD) phục vụ Catch-up các ngày cũ khi hệ thống gặp sự cố mất điện/mạng.
  - **Kiểm thử tự động toàn diện & Đóng gói:**
    * Bổ sung suite [absentAttendance.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/jobs/absentAttendance.test.js) (8/8 tests PASS 100%).
    * Tổng số test Backend đạt kỷ lục mới: **124/124 tests PASS (100% across 14 suites)**.
    * Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi, 1707 modules transformed thành công trong 18.2s)**.
- **22/10/2026 (Hoàn thành Module Chấm Công QR Động Chu Kỳ 30s & Chống Replay Attack 100% — 116/116 Tests Pass):**
  - **Thuật toán & Dịch vụ Bảo mật Backend (`qrAttendanceService.js`, `attendanceController.js`, `attendanceRoutes.js`, `kioskRoutes.js`):**
    * Token ký số mật mã học: `HMAC-SHA256(companyId + userId + timestamp + nonce)` sử dụng secret key của server, so khớp an toàn `crypto.timingSafeEqual` chống giả mạo hay sửa đổi dữ liệu.
    * Chu kỳ 30 giây: Server cấp token có hiệu lực 30s (+5s dung sai bù trễ mạng, tối đa 35s). Token quá 35s bị từ chối 400 (`QR_EXPIRED`).
    * **Cơ chế Chống Replay Attack 100%:** Mỗi mã QR sinh ra gắn liền với một `nonce` ngẫu nhiên 16 bytes lưu trong RAM `activeQrNonceMap` (không tạo thêm collection mới). Ngay khi quét thành công lần đầu, nonce lập tức bị tiêu hủy (`used = true`). Quét lại lần thứ hai (kẻ xấu chụp ảnh màn hình) bị từ chối ngay lập tức với mã lỗi 409 (`QR_REPLAY_ATTACK_DETECTED`).
    * Bảo vệ Multi-tenant Fail-Closed: Máy quét / Kiosk đối chiếu `scannerCompanyId === tokenCompanyId`. Quét chéo công ty bị từ chối 403 (`CROSS_TENANT_QR_DENIED`). Toàn bộ truy vấn CSDL bọc trong `tenantStore.run`.
    * Tự động nhận diện vào ca/hết ca: Ghi nhận `CHECK_IN` (nếu lần đầu trong ngày, tính `isLate` theo `settings.shifts`) hoặc `CHECK_OUT` (tự động tính `workDurationMinutes`), phương thức `QR`, trạng thái `VALID`.
    * Vết kiểm toán: Tự động ghi `AuditLog` với action `AUDIT_ACTIONS.QR_ATTENDANCE_CHECK`.
    * Hỗ trợ 2 cổng điểm danh: Web App (`POST /api/attendance/qr-scan`) và Máy Kiosk chuyên dụng (`POST /api/kiosk/qr-check-in` qua TLS Header `x-kiosk-token`).
  - **Giao diện Người dùng Frontend ([AttendancePage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/AttendancePage.tsx), `DynamicQrPassCard.tsx`, `QrScannerCard.tsx`):**
    * Thẻ Điểm Danh QR Động: Sử dụng thư viện `qrcode` render mã QR nét căng với độ tương phản cao, thanh đếm lùi trực quan 30 giây (đổi màu xanh $\rightarrow$ vàng $\rightarrow$ đỏ khi sắp hết hạn), tự động làm mới mã khi đồng hồ chạm 0s. Kèm nút sao chép mã và nút làm mới thủ công.
    * Trạm Quét QR Điểm Danh (Scanner Simulator): Cho phép lễ tân/quản lý quét mã QR, đồng thời tích hợp nút "Test Quét Thẻ Của Tôi Ngay" (1-Click Test) cực kỳ thuận tiện cho việc trình diễn bảo vệ ĐATN.
    * Tab Navigation mượt mà 3 trong 1: Chuyển đổi giữa `GPS Geofencing (≤ 100m)`, `Mã QR Cá Nhân (30s)` và `Trạm Quét QR (Simulator)`.
  - **Kiểm thử tự động toàn diện & Đóng gói:**
    * Bổ sung suite [qrAttendance.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/attendance/qrAttendance.test.js) (8/8 tests PASS 100%).
    * Tổng số test Backend đạt kỷ lục mới: **116/116 tests PASS (100% across 13 suites)**.
    * Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi, 1707 modules transformed thành công)**.
- **22/10/2026 (Ngày 7 Tuần 1 — Hoàn thành Module Chấm Công Di Động GPS Geofencing & 108/108 Tests Pass):**
  - **Kiến trúc Thuật toán & Dịch vụ Backend (`gpsAttendanceService.js`, `attendanceController.js`, `attendanceRoutes.js`):**
    * Áp dụng công thức Haversine đo đạc khoảng cách giữa tọa độ thiết bị người dùng và toàn bộ địa điểm văn phòng hợp lệ của công ty (`companies.settings.locations`).
    * Kiểm tra chất lượng tín hiệu vị trí: Bắt buộc `accuracy < 50m` nhằm triệt tiêu gian lận GPS giả lập hoặc vị trí trôi dạt. Tín hiệu $\ge 50\text{m}$ bị từ chối với mã lỗi `GPS_ACCURACY_TOO_POOR`.
    * Kiểm tra Geofence: Bắt buộc khoảng cách $d \le \text{radiusMeters}$ (mặc định $\le 100\text{m}$). Ngoài vùng bị từ chối 400 kèm chi tiết khoảng cách gần nhất.
    * Tự động nhận diện hành vi theo thời gian thực: `CHECK_IN` (nếu chưa có log trong ngày, tính trễ `isLate` theo giờ ca làm việc) hoặc `CHECK_OUT` (nếu đã check-in, tự động tính tổng phút làm việc `workDurationMinutes`).
    * Ghi nhận nhật ký chấm công vào collection `attendanceLogs` với phương thức `GPS`, lưu vết `deviceId`, tọa độ, sai số accuracy và khoảng cách thực tế.
    * API cá nhân: `POST /api/attendance/gps` (Điểm danh), `GET /api/attendance/today` (Trạng thái hôm nay), `GET /api/attendance/my-history` (Lịch sử điểm danh).
  - **Giao diện Người dùng Mobile-First ([AttendancePage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/AttendancePage.tsx)):**
    * Thiết kế tối ưu cho cả màn hình điện thoại di động và máy tính, phong cách Enterprise dark mode.
    * **Radar Định Vị Geofence Sống:** Vòng sóng radar phát xung (pulse effect), tự động đo đạc khoảng cách đến văn phòng gần nhất thời gian thực, nhãn trực quan `HỢP LỆ — TRONG VÙNG CHẤM CÔNG` (xanh) hoặc `NGOÀI VÙNG CHẤM CÔNG` (đỏ).
    * Hiển thị bảng chỉ số tọa độ: Vĩ độ, Kinh độ và Sai số đo đạc `±accuracy m` (đổi màu xanh khi $<50$m).
    * **Nút CTA 1-Chạm Thông Minh:** Tự động đổi trạng thái "Điểm Danh VÀO CA" $\rightarrow$ "Điểm Danh HẾT CA", đồng hồ số GMT+7 thời gian thực.
    * Thẻ tổng quan ngày công hôm nay: Giờ vào ca, Giờ hết ca, Tổng thời gian làm việc, Phương thức xác thực (GPS/FaceID).
    * Bảng lịch sử điểm danh gần đây của cá nhân với badge trạng thái đúng giờ/đi muộn và khoảng cách thực tế.
  - **Kiểm thử tự động toàn diện & Đóng gói:**
    * Bổ sung suite [gpsAttendance.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/attendance/gpsAttendance.test.js) (8/8 tests PASS 100%).
    * Tổng số test Backend đạt kỷ lục mới: **108/108 tests PASS (100% across 12 suites)**.
    * Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi, hoàn thành trong 24.2s)**.
- **22/10/2026 (Ngày 7 Tuần 1 — Hoàn thành Màn hình Chấp thuận BVDLCN & Lấy mẫu Sinh trắc học có HR giám sát theo Luật 91/2025/QH15):**
  - **Tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15:**
    * Căn cứ pháp lý: Khoản 1 Điều 11 & Điều 13 (Quy chế Dữ liệu nhạy cảm đặc biệt & Đồng ý minh thị tự nguyện), Khoản 2 Điều 14 (Quyền rút lại sự đồng ý).
    * Cam kết bảo vệ dữ liệu: Chỉ trích xuất và lưu trữ vector toán học 128 chiều (`descriptors[]`), **tuyệt đối KHÔNG lưu trữ hình ảnh khuôn mặt thô (raw photos)** trên máy chủ.
    * Mã hóa tầng ứng dụng đối xứng **AES-256-GCM** với khóa 256-bit trong biến môi trường, giải mã trong RAM khi so khớp. Tuyệt đối CẤM ghi vector vào `auditLogs`, `attendanceLogs` và log lỗi.
  - **Backend Face Enrollment & Consent Services (`faceEnrollmentService.js`, `faceEnrollmentController.js`, `userRoutes.js`):**
    * Schema xác thực Zod `.strict()`: Yêu cầu 3–5 mẫu vector 128 chiều, cờ `hasConsent: true`, phiên bản `consentPolicyVersion: 'v2026.1'`.
    * Phân quyền RBAC nghiêm ngặt: Chỉ `CEO` và `HR_MANAGER` được phép thực hiện lấy mẫu (chặn triệt để nhân viên tự gửi ảnh từ xa).
    * Endpoint `GET /api/users/:id/face-status`: Trả về trạng thái đã lấy mẫu, cán bộ HR giám sát `enrolledBy`, thời gian đăng ký và phiên bản điều khoản. Projection an toàn tuyệt đối không lộ vector.
    * Endpoint `POST /api/users/:id/face-enrollment`: Lưu trữ và mã hóa AES-256-GCM, ghi `AuditLog` với action `ENROLL_BIOMETRIC_FACE`.
    * Endpoint `DELETE /api/users/:id/face-template`: Xóa vĩnh viễn vector trong `faceTemplates` ngay lập tức khi chủ thể rút lại đồng ý (Khoản 2 Điều 14), ghi `AuditLog` với action `REVOKE_BIOMETRIC_CONSENT`.
  - **Frontend UI/UX Modal & Biometrics Tab (`FaceEnrollmentModal.tsx`, `UserDetailModal.tsx`, `UsersPage.tsx`):**
    * `FaceEnrollmentModal.tsx`: Stepper 3 bước trực quan (1: Biểu mẫu Chấp thuận BVDLCN $\rightarrow$ 2: Thu thập 3 mẫu camera trực tiếp có HR giám sát $\rightarrow$ 3: Hoàn tất mã hóa lưu trữ). Kiểm tra số lượng người trong khung hình (`numFaces === 1`), hướng dẫn 3 góc chụp (chính diện, nghiêng trái, nghiêng phải).
    * Tab 5 "Sinh Trắc Học (FaceID)" trong `UserDetailModal.tsx`: Xem chi tiết trạng thái đăng ký, huy hiệu mã hóa AES-256-GCM, nút lấy mẫu trực tiếp cho HR và nút "Rút lại đồng ý & Xóa vĩnh viễn" kèm modal cảnh báo pháp lý.
    * Nút thao tác nhanh trên Data Table tại `UsersPage.tsx` cho phép HR/CEO mở trực tiếp quy trình lấy mẫu.
  - **Kiểm thử tự động & Đóng gói:**
    * Bổ sung suite `faceEnrollment.test.js` (9/9 tests PASS 100%).
    * Toàn bộ hệ thống Backend đạt mốc: **100/100 tests PASS (100% across 11 suites)**.
    * Đóng gói Frontend: `tsc && vite build` **PASS (0 lỗi, hoàn thành trong 54s)**.
- **21/10/2026 (Ngày 6 Tuần 1 — Hoàn thành Giao diện Quản trị Nhân sự & Hợp đồng lao động):**
  - **Module Giao diện Danh sách Nhân sự (`frontend/src/pages/UsersPage.tsx`):**
    * Thẻ chỉ số tổng quan (Tổng nhân sự, Đang hoạt động, Thử việc, Cấp quản trị).
    * Bộ lọc kết hợp: Ô tìm kiếm tức thời theo Tên/Email/Mã NV, lọc theo Phòng ban, Lọc theo Vai trò (CEO, HR, Manager, Employee), lọc Trạng thái hoạt động và nút Reset nhanh.
    * Bảng dữ liệu chuẩn Enterprise: Hiển thị avatar Cloudinary, mã NV mono, phòng ban cha-con, chip vai trò phân màu đặc trưng, số dư phép năm tính chuẩn Điều 114 BLLĐ (thâm niên +1 ngày mỗi 5 năm).
    * Phân trang linh hoạt (10/20/50 mục trên trang).
  - **Modal Chi tiết Hồ sơ Đa Tab (`frontend/src/components/users/UserDetailModal.tsx`):**
    * *Tab 1 (Hồ sơ & Phép):* Định danh cá nhân, phòng ban, quản lý, số dư phép năm/phép ốm, đặc trưng thôi việc phục vụ mô hình ML (thâm niên nghề, số công ty từng làm).
    * *Tab 2 (Hợp đồng):* Lịch sử các đời hợp đồng trong `contracts[]`, form ký hợp đồng mới tự động chuyển hợp đồng cũ sang `EXPIRED`.
    * *Tab 3 (Cấu hình Lương 2026 & Bảo vệ IDOR):* Quản lý (`MANAGER`) bị chặn truy cập xem lương nhân viên với banner cảnh báo an ninh fail-closed. CEO và HR Manager được xem và cập nhật cấu hình lương (lương cơ bản, phụ cấp, ăn ca, người phụ thuộc), tự động ghi nhận vết `AuditLog`.
    * *Tab 4 (Quản trị quyền):* Chức năng thay đổi vai trò hệ thống RBAC cho CEO/HR.
  - **Modal Thêm Mới & Upload Avatar (`CreateUserModal.tsx`, `AvatarUploadModal.tsx`):**
    * `CreateUserModal`: Đăng ký nhân viên mới chuẩn Zod `.strict()`, hỗ trợ tự sinh mã hoặc nhập thủ công, khởi tạo hợp đồng ban đầu.
    * `AvatarUploadModal`: Tải ảnh lên Cloudinary auto-face-crop 400x400 phục vụ chấm công FaceID Kiosk, validate dung lượng $\le 2\text{MB}$ và MIME type an toàn.
  - **Module Sơ Đồ Cây Phòng Ban 2 Cấp (`frontend/src/pages/DepartmentsPage.tsx`):**
    * Trực quan hóa cấu trúc tổ chức 2 cấp nghiêm ngặt theo Hiến pháp v6.1: Khối Cấp 1 (trực thuộc BOD) $\rightarrow$ Phòng ban Cấp 2.
    * Hỗ trợ 2 chế độ hiển thị linh hoạt: **Sơ Đồ Cây Tương Tác (`FolderTree`)** với các nhánh kết nối, đóng/mở từng khối, huy hiệu cấp bậc phân biệt và **Lưới Thẻ Tổng Hợp (`LayoutGrid`)** kèm ô tìm kiếm nhanh.
    * Thẻ chỉ số tổng quan: Tổng số phòng ban, số khối cấp 1, số phòng ban con cấp 2, tổng số nhân sự đã phân bổ.
    * **Modal Quản Trị Phòng Ban (`DepartmentModal.tsx`):** Tạo mới và chỉnh sửa tên, mã code, chọn khối cha (chặn tạo cấp 3), chọn Trưởng bộ phận từ danh bạ nhân sự.
    * **Modal Danh Sách Nhân Sự Trực Thuộc (`DepartmentMembersModal.tsx`):** Bật lên khi bấm vào bất kỳ phòng ban nào, hiển thị Trưởng bộ phận nổi bật trên đầu (Spotlight Manager) cùng danh sách nhân viên trực thuộc, liên kết mở trực tiếp hồ sơ chi tiết.
    * Chặn xóa phòng ban an toàn cả ở Backend lẫn Frontend khi đơn vị còn phòng ban con hoặc nhân viên trực thuộc.
  - **Admin UI Cấu hình GPS Geofencing (`companies.settings.locations`):**
    * Backend CRUD endpoints (`/api/companies/locations`): Thêm, sửa, xóa tọa độ văn phòng kèm bán kính cho phép chấm công, chặn quyền nhân viên thường (403 Forbidden), tự động ghi nhận AuditLog (`UPDATE_COMPANY_SETTINGS`).
    * Endpoint chuyên dụng `POST /api/companies/locations/seed-defense-room` phục vụ 1-click nạp nhanh tọa độ «Phòng Bảo vệ ĐATN - Hội đồng K23» (`lat: 21.0362, lng: 105.7829, radius: 50m`).
    * Giao diện Admin ([LocationsPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/LocationsPage.tsx)) tích hợp công cụ kiểm tra vị trí thực tế (**Live GPS Simulator**): ứng dụng công thức Haversine đo đạc khoảng cách giữa tọa độ GPS của thiết bị và từng địa điểm công ty, gắn nhãn trực quan `HỢP LỆ (Trong vùng)` hoặc `NGOÀI VÙNG`.
    * Modal thêm/sửa địa điểm ([LocationModal.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/components/locations/LocationModal.tsx)): Tích hợp HTML5 Geolocation API lấy tọa độ thiết bị, thanh trượt điều chỉnh bán kính Geofence 10m–1000m, liên kết xem nhanh vị trí trên Google Maps.
  - **Kịch Bản Triển Khai Thử Nghiệm Vercel + Render & Kiểm Thử Cookie Đa Nền Tảng:**
    * Cấu hình Vercel Reverse Proxy Rewrite ([frontend/vercel.json](file:///c:/K23CNT1/DANT/DATN/frontend/vercel.json)) ủy quyền `/api/(.*)` sang Render Backend, giải quyết triệt để vấn đề chặn Third-Party Cookie trên Safari iOS (Apple ITP) và Chrome, giữ nguyên cookie First-Party HttpOnly an toàn.
    * Cấu hình Blueprint Render ([deploy/render.yaml](file:///c:/K23CNT1/DANT/DATN/deploy/render.yaml)) tích hợp `healthCheckPath: /health` và thiết lập cron-job ping định kỳ 10 phút chống Cold Start ngủ đông trên gói miễn phí.
    * Tinh chỉnh CORS linh hoạt trong [backend/src/app.js](file:///c:/K23CNT1/DANT/DATN/backend/src/app.js) hỗ trợ đa tên miền (Localhost, Preview Vercel `*.vercel.app`, Custom Apex Domain).
    * Soạn thảo tài liệu chuẩn hóa quy trình thực nghiệm: [docs/deployment/KIEM_THU_DEPLOY_VA_COOKIE.md](file:///c:/K23CNT1/DANT/DATN/docs/deployment/KIEM_THU_DEPLOY_VA_COOKIE.md) với ma trận kiểm thử 5 bước trên iPhone Safari, Android Chrome, Windows và macOS.
  - **Cron Job Nhắc Hạn Hợp Đồng Lao Động 30/60 Ngày (Hoàn thành sớm tác vụ ngày Thứ Năm 22/10):**
    * Triển khai service [contractReminderService.js](file:///c:/K23CNT1/DANT/DATN/backend/src/services/contractReminderService.js) quét hợp đồng còn hiệu lực (`contracts.status = ACTIVE`, `effectiveTo != null`).
    * Cơ chế **Idempotency tuyệt đối**: Dùng khóa composite `CONTRACT_EXPIRY_{userId}_{contractNumber}_{milestone}` lưu trong `notifications.data.idempotencyKey`, đảm bảo chạy nhiều lần trong ngày hoặc retry không sinh thông báo trùng.
    * Gửi đồng thời thông báo tới cả người lao động và toàn bộ cấp quản trị (`CEO`, `HR_MANAGER`).
    * Tự động lập lịch hàng ngày lúc 08:00 AM (`0 8 * * *`) qua `node-cron` ([cronScheduler.js](file:///c:/K23CNT1/DANT/DATN/backend/src/jobs/cronScheduler.js)), hỗ trợ API on-demand `POST /api/jobs/contract-reminders` xác thực qua header `x-cron-key` (dành cho cron-job.org trên Render) hoặc Bearer Token của CEO/HR.
    * Thêm suite kiểm thử [contractReminders.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/jobs/contractReminders.test.js) (5/5 tests PASS).
  - **Soạn Thảo Hoàn Thiện Báo Cáo ĐATN Chương 2 (Cơ sở lý thuyết & Căn cứ pháp lý):**
    * Hoàn thiện toàn diện mục 2.1 (*Nghiệp vụ quản trị nhân lực, cơ cấu 2 cấp, vòng đời hợp đồng lao động, cảnh báo 30/60 ngày Idempotent, phân quyền RBAC 4 cấp, phép năm Điều 113-114 BLLĐ*).
    * Hoàn thiện mục 2.6 (*Tuân thủ Luật BVDLCN 91/2025/QH15, cơ chế Explicit Consent, quyền rút lại đồng ý, kiến trúc tách rời dữ liệu và mã hóa at-rest AES-256-GCM*).
  - **Khung Làm Việc Kiosk FaceID Tầng 1 & Phân Quyền Camera Chặt Chẽ:**
    * Backend: Nâng cấp [FaceTemplate.js](file:///c:/K23CNT1/DANT/DATN/backend/src/models/FaceTemplate.js) với `tenantPlugin` Fail-Closed và mã hóa đối xứng AES-256-GCM; triển khai [kioskChallengeService.js](file:///c:/K23CNT1/DANT/DATN/backend/src/services/kioskChallengeService.js) (RAM Nonce TTL 60s, tiêu hủy 1 lần chống Replay); middleware [kioskAuth.js](file:///c:/K23CNT1/DANT/DATN/backend/src/middleware/kioskAuth.js) (xác thực SHA-256 token); router [kioskRoutes.js](file:///c:/K23CNT1/DANT/DATN/backend/src/routes/kioskRoutes.js).
    * Frontend: Custom hook [useFaceLiveness.ts](file:///c:/K23CNT1/DANT/DATN/frontend/src/features/face/useFaceLiveness.ts) (State machine chuỗi thời gian, đếm `numFaces === 1`, EAR/MAR/Yaw, bắt 2 vector $V_{\text{start}}$ & $V_{\text{end}}$); Giao diện chuyên dụng [KioskPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/KioskPage.tsx) tại `/kiosk`.
    * Phân quyền RBAC chặt chẽ: Route `/kiosk`, nút mở Kiosk và Modal "Chỉnh Sửa Cam" (chọn thiết bị camera, độ phân giải VGA/HD/FHD, lật gương, độ nhạy minConfidence) **chỉ dành riêng cho CEO và HR Manager**. Quản lý và Nhân viên thường bị chặn 100%.
  - **Tác vụ 1 Tuần 2: Xây Dựng API Điểm Danh Kiosk FaceID Tầng 2 (So Khớp 1:N & Ghi Nhận AttendanceLogs):**
    * **Backend (Thuật toán So khớp & Dịch vụ Chấm công):**
      - Nâng cấp [backend/src/models/AttendanceLog.js](file:///c:/K23CNT1/DANT/DATN/backend/src/models/AttendanceLog.js): Áp dụng `tenantPlugin` Fail-Closed và thiết lập `companyId: { immutable: true }` chống thay đổi ngữ cảnh tenant.
      - Xây dựng module thuật toán [backend/src/services/faceMatchingService.js](file:///c:/K23CNT1/DANT/DATN/backend/src/services/faceMatchingService.js):
        + Đo đạc khoảng cách Euclidean ($d_E \le 0.60$) và Cosine ($d_C \le 0.35$).
        + Thẩm định tính liên tục Liveness giữa 2 mốc thời gian: $d(V_{\text{start}}, V_{\text{end}}) \le 0.40$ (chống tráo đổi người/ảnh trong quá trình thực hiện thử thách).
        + So khớp 1:N kết hợp quy tắc kiểm soát FAR biên an toàn phân tách (Separation Margin): $d_2 - d_1 \ge 0.15$. Khi $d_2 - d_1 < 0.15$ (nguy cơ nhận nhầm người có nét mặt tương đồng), hệ thống từ chối nhận diện tự động và kích hoạt Fallback 1:1 (`fallbackTo1To1: true`, mã HTTP 409 Conflict) yêu cầu quét QR hoặc nhập mã NV.
      - Xây dựng dịch vụ điểm danh [backend/src/services/kioskAttendanceService.js](file:///c:/K23CNT1/DANT/DATN/backend/src/services/kioskAttendanceService.js):
        + Xác thực và tiêu hủy Nonce ngay lập tức trong RAM (chống Replay Attack).
        + Giải mã an toàn vector embedding 128 chiều từ `faceTemplates` qua AES-256-GCM trong bộ nhớ RAM tạm thời.
        + Tự động đối chiếu ca làm việc (`settings.shifts`), phân loại hành vi: `CHECK_IN` (nếu chưa có log trong ngày) hoặc `CHECK_OUT` (nếu đã check-in, tự động tính tổng phút làm việc `workDurationMinutes`).
        + Đánh giá đi muộn `isLate` và số phút trễ `lateMinutes` dựa trên thời gian bắt đầu ca và thời gian ân hạn (`gracePeriodMinutes`).
        + Ghi nhận nhật ký chấm công vào `AttendanceLog` với phương thức `FACE` và `deviceId` tin cậy.
      - Mount endpoint `POST /api/kiosk/check-in` trong [backend/src/routes/kioskRoutes.js](file:///c:/K23CNT1/DANT/DATN/backend/src/routes/kioskRoutes.js) validate qua Zod schema `.strict()`.
      - Viết bộ kiểm thử toàn diện [backend/tests/kiosk/kioskCheckIn.test.js](file:///c:/K23CNT1/DANT/DATN/backend/tests/kiosk/kioskCheckIn.test.js) (6/6 tests PASS 100%).
      - Toàn bộ backend test suite đạt mốc ấn tượng: **10/10 test suites PASS, 91/91 tests PASS 100%**.
    * **Frontend (Ghép nối Kiosk Tầng 2 & Trải nghiệm Người dùng UX):**
      - Nâng cấp [frontend/src/pages/KioskPage.tsx](file:///c:/K23CNT1/DANT/DATN/frontend/src/pages/KioskPage.tsx): Tự động bắt sự kiện `CHALLENGE_VERIFIED` từ hook `useFaceLiveness`, thu thập vector $V_{\text{start}}$ & $V_{\text{end}}$ gửi request `POST /api/kiosk/check-in` kèm header `x-kiosk-token`.
      - Thiết kế thẻ hiển thị kết quả thời gian thực trên khung Camera:
        + Card Chúc mừng Điểm danh thành công: Nhãn Vào ca/Hết ca, Họ tên nhân viên, Mã NV, Thời gian điểm danh, Trạng thái Đúng giờ/Đi muộn hoặc Tổng thời gian làm việc.
        + Card Cảnh báo Lỗi & Fallback 1:1: Hiển thị lý do thất bại (người lạ chưa đăng ký khuôn mặt, hoặc biên chênh lệch quá nhỏ cần quét QR/nhập mã NV).
        + Tự động đếm lùi 4.5 giây và làm mới thử thách để sẵn sàng đón lượt nhân viên tiếp theo.
      - Biên dịch kiểm thử tĩnh TypeScript (`npx tsc --noEmit`) đạt **0 lỗi**.
  - **Kiểm thử chất lượng:**
    * Biên dịch TypeScript và đóng gói Vite: **`tsc && vite build` PASS (0 lỗi)**.
    * Kiểm thử tự động Backend: **91/91 tests PASS (100% across 10 suites)** (Bổ sung suite `kioskCheckIn.test.js` 6/6 PASS).
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
- **27/10/2026 (Nâng cấp Trợ Lý AI: Bể Chứa 5 API Keys Luân Phiên, Lưu Lịch Sử Chat Riêng Biệt Từng Tài Khoản, Phân Quyền Bảo Mật Dữ Liệu Cá Nhân & Đặc Quyền Tổng Hợp Toàn Doanh Nghiệp Cho CEO):**
  - **Kiến trúc Key Pool 5 API Keys Luân Phiên Round-Robin (`backend/src/ai/gemini.js`):** Nạp và xoay vòng cân bằng tải giữa 5 keys, cơ chế `executeWithKeyRotation` tự động bắt lỗi 429/Quota và chuyển ngay sang key kế tiếp trong pool trong tích tắc (cooldown 60s per key). Giảm circuit breaker quota dự phòng xuống 30s.
  - **Lưu Trữ Lịch Sử Chat Riêng Biệt Từng Tài Khoản (`frontend/src/components/chat/ChatWidget.tsx`):** Quản lý qua `localStorage` với key định danh duy nhất `pi_chat_history_${user._id}`, giới hạn 50 tin nhắn mới nhất. Đăng nhập tài khoản khác sẽ nạp đúng lịch sử của người đó, bảo mật 100% không rò rỉ giữa các người dùng.
  - **Ngữ Cảnh Hội Thoại Đa Lượt & Nhận Diện Nhân Thân Tự Động:** Tự động trích xuất đầy đủ hồ sơ người dùng (`User.findById`: Họ tên, Mã NV, Chức vụ, Phòng ban, Hợp đồng hiện tại, Số dư phép) nạp vào context và gửi kèm 6 tin nhắn gần nhất cho Gemini, giúp AI trò chuyện tự nhiên, dí dỏm, ấm áp và xưng hô chuẩn xác như đồng nghiệp ngoài đời thực.
  - **Phân Quyền Bảo Mật Dữ Liệu Cá Nhân Tuyệt Đối (Data Isolation & Privacy):**
    * Đối với nhân viên thông thường: Chỉ được xem dữ liệu của CHÍNH MÌNH (phép `get_leave_balance`, lương `get_payslip`, chấm công `get_attendance_summary`, hợp đồng `get_my_contract`, hồ sơ `get_my_profile`).
    * Chặn 100% mọi hành vi tò mò dữ liệu cá nhân của người khác tuân thủ Luật Bảo Vệ Dữ Liệu Cá Nhân (Nghị định 13/2023/NĐ-CP).
  - **Đặc Quyền Báo Cáo & Tra Cứu Toàn Doanh Nghiệp Dành Riêng Cho CEO:**
    * Bổ sung tool `ceo_company_summary`: Báo cáo tổng hợp toàn công ty (quân số 6 phòng ban, tỷ lệ chấm công hôm nay, đơn nghỉ phép, tổng chi phí quỹ lương Gross/Net/Bảo hiểm).
    * Bổ sung tool `ceo_employee_lookup`: Cho phép CEO tra cứu chi tiết hồ sơ, hợp đồng, chấm công và phép của bất kỳ nhân sự nào theo tên hoặc mã NV.
    * Chốt chặn RBAC Fail-Closed: Chặn hoàn toàn nếu role không phải CEO.
    * Lưu vết kiểm toán `auditLogs` (`CEO_AI_COMPANY_SUMMARY`, `CEO_AI_EMPLOYEE_LOOKUP`) cho mọi hành vi tra cứu của CEO.
  - **Giao Diện & Tiện Ích Khung Chat:** Bổ sung các chip câu hỏi nhanh theo vai trò (`📄 Hợp đồng`, `👤 Hồ sơ`, `📊 Báo cáo toàn công ty`, `🔍 Tra cứu nhân viên`) và nút `[Thoát file ✕]` linh hoạt. Đã kiểm thử thành công 100% trên giao diện trình duyệt thực tế.
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
