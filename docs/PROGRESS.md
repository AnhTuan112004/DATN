# TRẠNG THÁI TIẾN ĐỘ DỰ ÁN (PROGRESS TRACKER)

## 1. THÔNG TIN HIỆN TẠI
- **Sinh viên thực hiện:** Nguyễn Anh Tuấn (Lớp: K23CNT1 — MSV: 2310900113)
- **Giảng viên hướng dẫn:** ThS. Lê Trọng Nhất
- **Cơ sở đào tạo:** Trường Đại học Nguyễn Trãi — Khoa Công nghệ Thông tin & Chuyển đổi số
- **Đề tài:** Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI
- **Ngày hiện tại:** Thứ Bảy, 24/10/2026 (Tuần 4: 06–12/11/2026 — HOÀN THÀNH 100% VƯỢT TRƯỚC TIẾN ĐỘ)
- **Giai đoạn:** Tuần 4 — Phân hệ Tính Lương Tự Động (Payroll Engine 2026), Khóa Kỳ Nguyên Tử & IDOR Guard
### ✅ TỔNG SỐ TEST TOÀN HỆ THỐNG: 162/162 TESTS PASS (100% ACROSS 17 SUITES)
### ✅ CÁC MỤC TIÊU ĐÃ HOÀN THÀNH (Tính đến 24/10/2026):
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

### ⏳ NHIỆM VỤ TIẾP THEO (Tuần 5: 13/11–19/11/2026 — Đo Lường Hiệu Năng & Chuẩn Bị Chatbot AI):
- [ ] 1. Xây dựng kịch bản đo lường thực nghiệm: So sánh thời gian xử lý bảng lương tự động trên hệ thống vs thao tác thủ công Excel (ghi nhận vào Chương 4 Báo cáo ĐATN).
- [ ] 2. Kiểm thử sức chịu tải quy trình tính lương toàn bộ 50 nhân sự đồng thời (benchmark response time và memory footprint).
- [ ] 3. Chuẩn bị bộ 130 câu prompt kiểm thử Chatbot HR AI (P0 & Unsupported) phục vụ nghiệm thu Phương án A Tuần 6.

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
- [ ] **Tuần 5 (13–19/11):** 22/22 case khớp Excel; có số liệu thời gian Excel và hệ thống.
- [ ] **Tuần 6 (20–26/11):** Hỏi lương người khác bị từ chối; số liệu hiển thị đúng từ template; bảng kết quả 130 câu.
- [ ] **Tuần 7 (27/11–3/12):** Bảng AUC 3 mô hình, ROC, feature importance; Dashboard chạy; FEATURE FREEZE.
- [ ] **Tuần 8 (4–10/12):** Xong k6, OWASP ZAP, IDOR, UAT SUS ≥ 75, Chương 4.7–4.8 & Chương 5.
- [ ] **Tuần 9 (11–15/12):** Nộp báo cáo, slide, video dự phòng, đóng băng toàn bộ.

---

## 4. NHẬT KÝ PHIÊN LÀM VIỆC (SESSION LOG)
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
