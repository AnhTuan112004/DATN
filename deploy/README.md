# TRIỂN KHAI HỆ THỐNG (DEPLOYMENT)

- Frontend: Vercel (`app.domain.vn`)
- Backend: Render (`api.domain.vn`)
- Apex Domain chung: Đảm bảo cookie `HttpOnly; SameSite=Lax` hoạt động trơn tru trên mọi trình duyệt (kể cả Safari/iOS).
- Keep-alive: Cron-job ping định kỳ 10–14 phút endpoint `/health` để Backend không bị rơi vào trạng thái ngủ đông trên gói miễn phí.
