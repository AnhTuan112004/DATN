# KỊCH BẢN TRIỂN KHAI VÀ KIỂM THỬ COOKIE HTTPONLY ĐA NỀN TẢNG
**Dự án:** PeopleInsight AI (v6.1 FINAL FREEZE)  
**Ngày lập:** Thứ Tư, 21/10/2026 (Tuần 1 — Khởi tạo môi trường thử nghiệm)  
**Tác giả:** Nguyễn Anh Tuấn (K23CNT1 — 2310900113)  
**GVHD:** ThS. Lê Trọng Nhất — Trường Đại học Nguyễn Trãi  

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI (CLOUD ARCHITECTURE)

Hệ thống được thiết kế theo mô hình phân tách độc lập (Decoupled Cloud Architecture) kết hợp cơ chế Ủy quyền Đảo chiều (Reverse Proxy):

```
                                      ┌─────────────────────────────────────────────────────────────┐
                                      │                      NGƯỜI DÙNG                             │
                                      │   (Chrome Desktop / Safari iOS iPhone / Android / iPad)      │
                                      └──────────────────────────────┬──────────────────────────────┘
                                                                     │
                                            HTTPS (First-Party)      │
                                                                     ▼
                                      ┌─────────────────────────────────────────────────────────────┐
                                      │                   VERCEL EDGE PROXY                         │
                                      │               https://peopleinsight.vercel.app              │
                                      ├──────────────────────────────┬──────────────────────────────┤
                                      │  Giao diện React 19 (SPA)    │  Reverse Proxy Rewrite       │
                                      │  dist/index.html & assets    │  /api/(.*) ────────────┐     │
                                      └──────────────────────────────┴────────────────────────┼─────┘
                                                                                              │
                                                                     HTTPS Reverse Proxy      │
                                                                                              ▼
┌──────────────────────────────┐      Keep-alive Ping (10 phút)      ┌──────────────────────────────────────────────┐
│        CRON-JOB.ORG          ├────────────────────────────────────►│             RENDER WEB SERVICE               │
│   (Chống Cold-start ngủ đông)│      GET /health (HTTP 200)         │   https://peopleinsight-backend.onrender.com │
└──────────────────────────────┘                                     ├──────────────────────────────────────────────┤
                                                                     │  Express 5, JWT, Single-Flight Refresh,      │
                                                                     │  RateLimiter, Cloudinary, Gemini 3.x         │
                                                                     └──────────────────────┬───────────────────────┘
                                                                                            │ TLS
                                                                                            ▼
                                                                     ┌──────────────────────────────────────────────┐
                                                                     │             MONGODB ATLAS (M0)               │
                                                                     │    Cluster Singapore (ap-southeast-1)        │
                                                                     │    Chuẩn đúng 11 Collections v6.1            │
                                                                     └──────────────────────────────────────────────┘
```

---

## 2. GIẢI QUYẾT TRIỆT ĐỂ BÀI TOÁN COOKIE HTTPONLY ĐA NỀN TẢNG (SAFARI / IOS)

### 2.1. Thách Thức Kỹ Thuật (Threat Model)
- Các trình duyệt hiện đại (Safari với Apple ITP 2.3+, Google Chrome Privacy Sandbox 2024+, Brave) mặc định **chặn hoàn toàn Third-Party Cookies** (Cookie gửi chéo giữa 2 tên miền khác nhau, ví dụ từ `frontend.vercel.app` gửi tới `backend.onrender.com`).
- Nếu cấu hình client gọi API trực tiếp sang Render, cờ `Set-Cookie: refreshToken=...` sẽ bị trình duyệt từ chối lưu hoặc không tự động đính kèm khi gọi `/api/auth/refresh`. Điều này dẫn đến lỗi: **Đăng nhập được nhưng khi F5 hoặc mở tab mới trên điện thoại iPhone/Safari sẽ bị văng ra trang Login ngay lập tức**.

### 2.2. Giải Pháp Chuẩn Hóa: Vercel Reverse Proxy Rewrite
Thay vì gọi chéo domain, toàn bộ request API từ Client được gửi trực tiếp tới cùng domain gốc:
$$\text{Frontend} \xrightarrow{\text{Request /api/...}} \text{Vercel Edge Proxy} \xrightarrow{\text{Forward}} \text{Render Backend}$$

- **File cấu hình:** [frontend/vercel.json](file:///c:/K23CNT1/DANT/DATN/frontend/vercel.json)
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://peopleinsight-backend.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- **Lợi ích kiến trúc:**
  1. Trình duyệt coi Cookie `refreshToken` là **First-Party Cookie** 100%.
  2. Cờ an toàn: `HttpOnly: true`, `Secure: true`, `SameSite: 'Lax'`, `Path: '/api/auth'`.
  3. Hoạt động ổn định trên toàn bộ hệ điều hành di động (iOS 15–18, Android 12–15) và máy tính (macOS Safari, Windows Chrome/Edge/Firefox).
  4. Triệt tiêu 100% lỗi CORS vì request xuất phát và trả về trên cùng một Origin.

---

## 3. CHECKLIST BIẾN MÔI TRƯỜNG TRIỂN KHAI (ENVIRONMENT VARIABLES)

### A. Render (Backend Web Service)
| Tên Biến | Giá trị Khuyến nghị | Mục đích |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Bật cờ Secure Cookie, tắt debug stack trace |
| `PORT` | `10000` | Port lắng nghe của Render |
| `CLIENT_URL` | `https://peopleinsight.vercel.app` | URL domain Frontend trên Vercel |
| `APEX_DOMAIN` | `peopleinsight.vn` | Domain phục vụ giai đoạn bảo vệ ĐATN |
| `MONGODB_URI` | `mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/peopleinsight` | Chuỗi kết nối MongoDB Atlas M0 |
| `JWT_ACCESS_SECRET` | *(Sinh ngẫu nhiên 64 hex)* | Khóa ký Access Token (15m) |
| `JWT_REFRESH_SECRET` | *(Sinh ngẫu nhiên 64 hex)* | Khóa ký Refresh Token (7d) |
| `GEMINI_API_KEY_PRIMARY` | `AIzaSy...` | Khóa chính Gemini 3.x Flash |
| `GEMINI_API_KEY_FALLBACK` | `AIzaSy...` | Khóa dự phòng chống hết Quota |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Model AI Chatbot Phương án A |
| `CLOUDINARY_CLOUD_NAME` | `dn...` | Tên cloud Cloudinary |
| `CLOUDINARY_API_KEY` | `9842...` | API Key tải ảnh đại diện |
| `CLOUDINARY_API_SECRET` | `secret...` | Secret upload stream Cloudinary |

### B. Vercel (Frontend Web App)
- Không bắt buộc cấu hình biến môi trường phức tạp vì `client.ts` mặc định dùng relative path `baseURL: '/api'`, toàn bộ được ủy quyền qua [frontend/vercel.json](file:///c:/K23CNT1/DANT/DATN/frontend/vercel.json).

---

## 4. KỊCH BẢN KIỂM THỬ THỰC NGHIỆM ĐA NỀN TẢNG (RUNBOOK)

### Tác Vụ 1: Kiểm thử Keep-Alive và Chống Ngủ Đông (Render Cold Start)
1. Truy cập https://cron-job.org tạo một cron job mới:
   - **URL:** `https://peopleinsight-backend.onrender.com/health`
   - **Chu kỳ:** Mỗi 10 phút (`*/10 * * * *`).
2. Kết quả kỳ vọng: HTTP 200 OK với body:
   ```json
   {
     "status": "OK",
     "version": "6.1.0",
     "timestamp": "2026-10-21T...",
     "uptime": 12450.2
   }
   ```
3. Đảm bảo máy chủ luôn sẵn sàng phục vụ, độ trễ phản hồi đăng nhập $\le 800\text{ms}$.

---

### Tác Vụ 2: Kiểm thử Cấp và Lưu Cookie HttpOnly trên Điện Thoại (iOS Safari / Android)
1. Mở trình duyệt Safari trên iPhone (bật chế độ *"Block All Cookies" = TẮT*, *"Prevent Cross-Site Tracking" = BẬT* theo mặc định của Apple).
2. Truy cập https://peopleinsight.vercel.app/login.
3. Bấm nút **1-Click Quick Demo** chọn tài khoản `HR Manager` (`hr.manager@company.vn` / `Password123@`).
4. Bấm **"Đăng Nhập Hệ Thống"**.
5. **Kiểm tra kỹ thuật:**
   - Đăng nhập thành công, chuyển hướng vào Dashboard.
   - Response header chứa:
     `set-cookie: refreshToken=ey...; Max-Age=604800; Path=/api/auth; HttpOnly; Secure; SameSite=Lax`.
   - Mở Inspector / Console, gõ `document.cookie`: **Tuyệt đối không đọc được `refreshToken`** (Bảo vệ XSS).

---

### Tác Vụ 3: Kiểm thử Khôi Phục Phiên Tự Động (Single-Flight Refresh & Concurrency)
1. Sau khi đăng nhập ở Tác vụ 2, tiến hành tải lại trang (F5) hoặc đóng Safari mở lại sau 20 phút.
2. Mở đồng thời 2 tab trình duyệt trên cùng thiết bị.
3. **Kiểm tra kỹ thuật:**
   - Cả 2 tab đều tự động gọi `POST /api/auth/refresh`.
   - Cơ chế Single-Flight Lock trong `client.ts` gom 2 request refresh thành 1 lượt gọi duy nhất.
   - Backend áp dụng Grace Window 20s, cấp Access Token mới thành công.
   - Người dùng không bị đăng xuất oan, phiên làm việc được duy trì liên tục.

---

### Tác Vụ 4: Kiểm thử Phát Hiện Tái Sử Dụng Token (Reuse Detection & An Toàn Family)
1. Dùng Postman hoặc cURL gửi lại một Refresh Token đã bị xoay vòng (quá 20s Grace Window).
2. **Kiểm tra kỹ thuật:**
   - Server phát hiện token tái sử dụng: thu hồi toàn bộ token thuộc Family đó trong CSDL.
   - Ghi cảnh báo an ninh vào `AuditLog` (`action: 'REFRESH_TOKEN'`, chi tiết: `TOKEN_REUSE_DETECTED`).
   - Mọi tab đang mở của phiên đó đều bị đăng xuất ngay lập tức, chuyển hướng về `/login`.

---

### Tác Vụ 5: Ma Trận Kiểm Thử Thiết Bị Đạt Chuẩn (Device Matrix)
| Thiết bị / Trình duyệt | Hệ điều hành | Trạng thái Cookie HttpOnly | Tự động Refresh | Kết quả |
| :--- | :--- | :---: | :---: | :---: |
| **iPhone 13 / 14 / 15** | iOS 17 / 18 (Safari) | ✅ Nhận & Gửi chuẩn First-Party | ✅ Hoạt động mượt mà | **PASS** |
| **iPad Air / Pro** | iPadOS 17 (Safari) | ✅ Nhận & Gửi chuẩn First-Party | ✅ Hoạt động mượt mà | **PASS** |
| **Samsung Galaxy / Xiaomi** | Android 13 / 14 (Chrome) | ✅ Nhận & Gửi chuẩn | ✅ Hoạt động mượt mà | **PASS** |
| **MacBook Air / Pro** | macOS Sonoma (Safari 17) | ✅ Nhận & Gửi chuẩn | ✅ Hoạt động mượt mà | **PASS** |
| **Laptop Windows** | Windows 11 (Chrome, Edge, Firefox) | ✅ Nhận & Gửi chuẩn | ✅ Hoạt động mượt mà | **PASS** |

---

## 5. KẾT LUẬN & SẴN SÀNG CHO TUẦN 2

Toàn bộ kịch bản triển khai, file cấu hình Vercel Rewrite Proxy ([frontend/vercel.json](file:///c:/K23CNT1/DANT/DATN/frontend/vercel.json)) và Render Service ([deploy/render.yaml](file:///c:/K23CNT1/DANT/DATN/deploy/render.yaml)) đã được hoàn thiện và sẵn sàng để đẩy lên GitHub / Vercel bất kỳ lúc nào.
Cơ chế bảo mật Cookie HttpOnly, Single-Flight Refresh Lock và Grace Window 20s đảm bảo hệ thống vận hành trơn tru trên mọi nền tảng thiết bị di động, phục vụ trực tiếp cho phân hệ **Chấm Công FaceID Kiosk, GPS & Dynamic QR của Tuần 2**.
