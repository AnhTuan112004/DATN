# PeopleInsight AI (v6.1 FINAL FREEZE)

> **Hệ thống Quản lý Nhân sự Doanh nghiệp Thông minh tích hợp Trí tuệ Nhân tạo**  
> *(Research and Development of an AI-Powered Enterprise Human Resource Management System)*

---

## 4 Trụ Cột Kỹ Thuật Cốt Lõi
1. **FaceID Kiosk 2 tầng:** MediaPipe Face Landmarker Liveness (52 Blendshapes + Pose Yaw/Pitch) + Trích xuất Face Embedding so khớp tại Server.
2. **Payroll Engine chuẩn Pháp lý 2026:** Công thức 3 bước, thuế lũy tiến 5 bậc, trần BHXH/BHTN theo vùng, miễn thuế OT/đêm/phép/ăn ca (đối chiếu khớp 22 test case Excel).
3. **Chatbot HR AI (Phương án A):** Gemini 3.x Function Calling + Backend Markdown Template Rendering (không truyền dữ liệu lương ngược lại cho LLM).
4. **Học máy Dự báo Nghỉ việc (ML):** Huấn luyện trên IBM Attrition với 6 đặc trưng định lượng, giải thích mô hình qua Feature Importance.

---

## Bộ Nhớ Ngoài Cố Định (External Persistent Memory)
- [GEMINI.md](file:///c:/K23CNT1/DANT/DATN/GEMINI.md): Hiến pháp dự án & các quy tắc bất biến.
- [docs/PLAN.md](file:///c:/K23CNT1/DANT/DATN/docs/PLAN.md): Kế hoạch chi tiết v6.1 FINAL FREEZE (14 mục).
- [docs/SCHEDULE.md](file:///c:/K23CNT1/DANT/DATN/docs/SCHEDULE.md): Lịch trình theo tuần và ngày (Tuần 0 -> Tuần 9).
- [docs/PROGRESS.md](file:///c:/K23CNT1/DANT/DATN/docs/PROGRESS.md): Trạng thái tiến độ thực tế & quyết định kỹ thuật đã chốt.
- [.agents/workflows/start.md](file:///c:/K23CNT1/DANT/DATN/.agents/workflows/start.md): Workflow mở đầu ca làm việc.
- [.agents/workflows/end.md](file:///c:/K23CNT1/DANT/DATN/.agents/workflows/end.md): Workflow kết thúc ca làm việc.