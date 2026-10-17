---
description: Khởi động phiên làm việc mới và nạp bộ nhớ dự án PeopleInsight AI v6.1 FINAL FREEZE
---
1. Đọc toàn bộ file [GEMINI.md](file:///c:/K23CNT1/DANT/DATN/GEMINI.md) để nắm các quy tắc bất biến của bản v6.1 FINAL FREEZE (bao gồm Mục 5: Schedule Watchdog và Mục 7: Kích hoạt 6 Kỹ năng).
2. **Tự động áp dụng trọn bộ 6 kỹ năng có sẵn trong mọi câu trả lời:**
   - 🏛️ `peopleinsight-architecture`: Tuân thủ chuẩn 11 collections, Multi-tenant Fail-Closed, Payroll 2026, FaceID 2 tầng, Chatbot Phương án A.
   - 🎯 `ponytail`: Tư duy Senior Dev thực dụng, code tối giản nhất (YAGNI), không sinh code thừa/abstraction không cần thiết.
   - 💎 `impeccable`: Quét 24 lỗi UI slop, giữ vững tính nhất quán và chất lượng hoàn thiện giao diện.
   - 🎨 `taste-skill`: Tư duy thẩm mỹ cao cấp (Awwwards), chống giao diện AI generic/khuôn mẫu.
   - 🚀 `ui-ux-pro-max`: Áp dụng Design System chuẩn mực (bảng màu, font chữ, khoảng trắng, độ tương phản).
   - ✍️ `humanizer`: Khử văn phong AI, đảm bảo câu từ và báo cáo ĐATN đọc tự nhiên như người thật viết.
3. Đọc file [PROGRESS.md](file:///c:/K23CNT1/DANT/DATN/docs/PROGRESS.md) và [SCHEDULE.md](file:///c:/K23CNT1/DANT/DATN/docs/SCHEDULE.md) để đối chiếu ngày hiện tại:
   - **Nếu có việc ngày hôm trước CHƯA XONG:** Đưa ra cảnh báo nổi bật: `⚠️ [CẢNH BÁO TIẾN ĐỘ] Nhiệm vụ chưa hoàn thành từ ngày trước: <danh sách>`. Yêu cầu ưu tiên dứt điểm trước khi làm việc mới.
   - **Nếu đã HOÀN THÀNH SỚM mục tiêu hôm nay:** Thông báo ngay: `🚀 [TIẾN ĐỘ VƯỢT TRƯỚC] Đã xong toàn bộ việc hôm nay! Đề xuất làm tiếp nhiệm vụ của ngày tiếp theo: <nhiệm vụ kế tiếp>` và cập nhật nhật ký lịch trình.
4. Tóm tắt ngắn gọn trạng thái hiện tại (không quá 10 dòng):
   - Ngày mấy trong lộ trình?
   - Danh sách công việc đã hoàn thành `[x]`.
   - Danh sách công việc tiếp theo CHƯA LÀM `[ ]` (kèm việc tồn đọng nếu có). Tuyệt đối không đề xuất lại việc đã có `[x]`.
   - Ràng buộc kiến trúc quan trọng cần lưu ý.
5. Hỏi người dùng muốn bắt đầu từ đầu việc chưa làm nào và cùng người dùng giải quyết.
