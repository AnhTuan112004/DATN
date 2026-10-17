# PeopleInsight AI (v6.1 FINAL FREEZE)

> **Hệ thống Quản lý Nhân sự Doanh nghiệp Thông minh tích hợp Trí tuệ Nhân tạo**  
> *(Research and Development of an AI-Powered Enterprise Human Resource Management System)*

---

## 🗺️ Bản Đồ Cấu Trúc Thư Mục Dự Án (Directory Structure)

Dự án được phân cấp rõ ràng theo mô hình Monorepo module hóa, tách biệt rạch ròi giữa Backend, Frontend, Tài liệu Đồ án, Học máy và Kỹ năng AI:

```text
DATN/
├── 📁 .vscode/                 # Cấu hình IDE (Tự động gom nhóm file nesting, ẩn thư mục rác)
├── 📁 .agents/                 # Trợ lý AI & Bộ kỹ năng chuyên sâu
│   ├── 📁 skills/             # 6 Kỹ năng AI: Architecture, Ponytail, Humanizer, Impeccable, Taste, UI-UX
│   └── 📁 workflows/          # Quy trình làm việc tự động (/start, /end)
│
├── 📁 backend/                 # Máy chủ API (Node.js Express 5 + MongoDB)
│   ├── 📁 src/
│   │   ├── 📁 config/         # Cấu hình môi trường, hằng số (constants, env)
│   │   ├── 📁 controllers/    # Bộ điều khiển tiếp nhận request & trả lời
│   │   ├── 📁 middleware/     # Bảo vệ: Auth JWT, RBAC 4 cấp, Rate Limiter
│   │   ├── 📁 models/         # ĐÚNG 11 Mongoose Collections v6.1 (Fail-Closed Multi-tenancy)
│   │   ├── 📁 plugins/        # TenantPlugin (cách ly tenant bằng AsyncLocalStorage)
│   │   ├── 📁 routes/         # Các định tuyến API (/auth, /users, /departments...)
│   │   ├── 📁 services/       # Nghiệp vụ: Auth, Payroll Engine 2026, FaceID, User/Dept
│   │   └── 📁 validations/    # Zod schemas (.strict() chống Mass Assignment)
│   ├── 📁 tests/              # 58/58 Tests tự động (Auth, RBAC, Users, Payroll 22 cases)
│   └── 📁 scripts/            # Dữ liệu mẫu (Seed 50 nhân viên chuẩn BLLĐ 2026)
│
├── 📁 frontend/                # Ứng dụng Web Client (React + TypeScript + Vite)
│   ├── 📁 src/
│   │   ├── 📁 components/     # UI components (Header, Sidebar, Forms, Cards)
│   │   ├── 📁 pages/          # Các màn hình: Dashboard, Kiosk FaceID, Payroll, Leaves
│   │   └── 📁 services/       # Gọi API backend qua Axios/Fetch
│   └── 📁 public/             # Assets tĩnh, Logo, Weights mô hình nhận diện
│
├── 📁 docs/                    # Toàn bộ Hồ sơ & Tài liệu Đồ án Tốt nghiệp
│   ├── 📄 PLAN.md             # Kế hoạch tổng thể v6.1 đóng băng (14 mục chi tiết)
│   ├── 📄 SCHEDULE.md         # Lịch trình chi tiết 9 tuần (Tuần 0 -> Tuần 9)
│   ├── 📄 PROGRESS.md         # Nhật ký tiến độ thực tế, quyết định kỹ thuật đã chốt
│   ├── 📄 QUY_DINH_NTU.md     # Chuẩn thể thức ĐATN Trường Đại học Nguyễn Trãi
│   ├── 📁 report/             # Bản thảo 4 Chương báo cáo ĐATN + Kết luận
│   ├── 📁 spike/              # Báo cáo thực nghiệm FaceID & Gemini Function Calling
│   └── 📁 meeting/            # Biên bản họp với Giảng viên hướng dẫn
│
├── 📁 experiments/             # Dữ liệu đo đạc thực nghiệm (trials.csv 40 lượt FaceID)
├── 📁 ml/                      # Module Học máy dự báo thôi việc (IBM HR Attrition 6 đặc trưng)
├── 📁 deploy/                  # File cấu hình triển khai Cloud (Render backend, Vercel frontend)
├── 📁 loadtest/                # Kịch bản kiểm thử tải hệ thống (k6 / Artillery)
│
├── 📄 GEMINI.md               # HIẾN PHÁP DỰ ÁN (Single Source of Truth - Các quy tắc bất biến)
└── 📄 README.md               # Hướng dẫn tổng quan dự án
```

---

## ⚡ 4 Trụ Cột Kỹ Thuật Cốt Lõi (v6.1 FINAL FREEZE)
1. **FaceID Kiosk 2 tầng:** MediaPipe Face Landmarker Liveness (52 Blendshapes + Pose Yaw/Pitch) + Trích xuất Face Embedding so khớp tại Server (Khoảng cách Euclid $\le 0.60$, Cosine $\le 0.35$).
2. **Payroll Engine chuẩn Pháp lý 2026:** Công thức 3 bước, thuế lũy tiến 5 bậc, trần BHXH/BHTN theo vùng, miễn thuế OT/đêm/phép/ăn ca (khớp 100% bộ 22 test cases Excel).
3. **Chatbot HR AI (Phương án A):** Gemini 3.x Function Calling + Backend Markdown Template Rendering (chặn hoàn toàn việc truyền dữ liệu lương nhạy cảm ngược lại cho LLM).
4. **Học máy Dự báo Nghỉ việc (ML):** Huấn luyện trên IBM Attrition với 6 đặc trưng định lượng, chuẩn hóa thu nhập theo phân vị, giải thích qua Feature Importance.

---

## 📚 Bộ Nhớ Ngoài Cố Định (External Persistent Memory)
- [GEMINI.md](file:///c:/K23CNT1/DANT/DATN/GEMINI.md): Hiến pháp dự án & các quy tắc bất biến.
- [docs/PLAN.md](file:///c:/K23CNT1/DANT/DATN/docs/PLAN.md): Kế hoạch tổng thể v6.1 FINAL FREEZE.
- [docs/SCHEDULE.md](file:///c:/K23CNT1/DANT/DATN/docs/SCHEDULE.md): Lịch trình chi tiết 9 tuần.
- [docs/PROGRESS.md](file:///c:/K23CNT1/DANT/DATN/docs/PROGRESS.md): Trạng thái tiến độ thực tế & quyết định kỹ thuật đã chốt.
- [.agents/workflows/start.md](file:///c:/K23CNT1/DANT/DATN/.agents/workflows/start.md): Workflow khởi động ca làm việc (`/start`).
- [.agents/workflows/end.md](file:///c:/K23CNT1/DANT/DATN/.agents/workflows/end.md): Workflow kết thúc ca làm việc (`/end`).