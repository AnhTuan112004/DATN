# LỊCH SỬ THAY ĐỔI (CHANGELOG) — PEOPLEINSIGHT AI

Tất cả các điều chỉnh kỹ thuật sau khi đóng băng kế hoạch (v6.1 FINAL FREEZE) sẽ được ghi lại tại đây.

---

## [v6.1.0] - 2026-10-14 (Tuần 0: Khởi động & Spike)
### Khởi tạo
- Thiết lập toàn bộ cơ chế **Bộ nhớ ngoài cố định (External Persistent Memory)** gồm:
  - `GEMINI.md`: Hiến pháp dự án & bảng cấm nhầm lẫn với v3.
  - `docs/PLAN.md`: Kế hoạch chi tiết 14 mục v6.1 FINAL FREEZE.
  - `docs/SCHEDULE.md`: Lịch trình chi tiết 9 tuần (13/10 – 15/12/2026).
  - `docs/PROGRESS.md`: Trạng thái tiến độ & các quyết định kỹ thuật chốt sau Spike.
  - `.agents/workflows/start.md` & `end.md`: Quy trình tự động nạp và lưu ngữ cảnh cho AI.
  - `.agents/skills/peopleinsight-v6/SKILL.md`: Kỹ năng chuyên sâu kiến trúc PeopleInsight v6.1 tích hợp trực tiếp cho Antigravity AI.
- Khởi tạo khung thư mục Monorepo: `backend/`, `frontend/`, `ml/`, `experiments/`, `loadtest/`, `deploy/`.
- **Quyết định điều chỉnh triển khai:** Tạm hoãn mua tên miền apex riêng sang giai đoạn nghiệm thu / hoàn thiện đồ án (Tuần 8–9). Toàn bộ quá trình code và kiểm thử từ Tuần 1 đến Tuần 7 sẽ tập trung chạy trên môi trường `localhost` / mạng LAN và các domain miễn phí của cloud provider.
