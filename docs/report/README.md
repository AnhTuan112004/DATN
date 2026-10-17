# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP: PEOPLEINSIGHT AI (v6.1 FINAL FREEZE)

**Đề tài:** Nghiên cứu và Xây dựng Hệ thống Quản trị Nhân sự & Chấm công Thông minh PeopleInsight AI ứng dụng Sinh trắc học Khuôn mặt 2 tầng và Trí tuệ Nhân tạo Tạo sinh An toàn Dữ liệu

---

## CẤU TRÚC BÁO CÁO ĐỒ ÁN TỐT NGHIỆP (CHUẨN 4 CHƯƠNG ĐH NGUYỄN TRÃI)
*Quy định dung lượng: 60 – 80 trang (tính từ Chương 1 đến trước Phụ lục). Khổ A4, font Times New Roman 13, dãn dòng 1.2 lines.*

- **PHẦN ĐẦU (Đánh số trang La Mã i, ii, iii...):**
  - Trang bìa chính (Bìa cứng xanh, chữ nhũ vàng) & Trang bìa phụ
  - Lời cảm ơn
  - Tóm tắt nội dung đồ án (Tiếng Việt & Abstract Tiếng Anh)
  - Mục lục
  - Danh mục hình vẽ
  - Danh mục bảng
  - Danh mục từ viết tắt
- **MỞ ĐẦU (1 – 3 trang):** Bối cảnh, lý do chọn đề tài, mục tiêu, đối tượng, phạm vi nghiên cứu và phương pháp tiếp cận.
- **[CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI VÀ NỀN TẢNG CÔNG NGHỆ](file:///c:/K23CNT1/DANT/DATN/docs/report/ch1_tong_quan.md) (15 – 20 trang):**
  - 1.1. Bối cảnh nghiên cứu, thực trạng quản trị nhân sự và bài toán an toàn dữ liệu sinh trắc học
  - 1.2. Khung pháp lý tiền lương - thuế TNCN 2026 và Luật Bảo vệ dữ liệu cá nhân (91/2025/QH15)
  - 1.3. Nền tảng công nghệ nhận diện khuôn mặt & chống giả mạo Liveness 2 tầng
  - 1.4. Nền tảng Trí tuệ nhân tạo tạo sinh (Gemini 3.x Function Calling) & Scikit-learn Machine Learning
  - 1.5. Tech stack phát triển ứng dụng web (React 19, TypeScript, Node.js Express 5, MongoDB Atlas)
- **[CHƯƠNG 2. PHÂN TÍCH THIẾT KẾ HỆ THỐNG](file:///c:/K23CNT1/DANT/DATN/docs/report/ch2_co_so_ly_thuyet.md) (15 – 20 trang):**
  - 2.1. Phân tích yêu cầu chức năng (Biểu đồ Use Case tổng quát và chi tiết cho 4 tác nhân)
  - 2.2. Phân tích yêu cầu phi chức năng & Mô hình đe dọa (Threat Model, chống IDOR)
  - 2.3. Thiết kế kiến trúc tổng thể hệ thống (Multi-tenancy Fail-Closed, Kiosk FaceID 2 tầng, Chatbot Phương án A)
  - 2.4. Thiết kế luồng xử lý (Biểu đồ Sequence: Điểm danh Kiosk Liveness, Duyệt đơn 2 cấp, Chốt lương, Sàng lọc CV)
- **[CHƯƠNG 3. THUẬT TOÁN VÀ CƠ SỞ DỮ LIỆU](file:///c:/K23CNT1/DANT/DATN/docs/report/ch3_thiet_ke_he_thong.md) (15 – 20 trang):**
  - 3.1. Thiết kế Cơ sở dữ liệu chuẩn hóa đúng 11 Collections (9 P0 + 2 P1), Sơ đồ ERD và Data Dictionary
  - 3.2. Thuật toán kiểm tra Liveness qua 52 Blendshapes và Trích xuất/So khớp Vector Face 128-D
  - 3.3. Thuật toán Payroll Engine 2026 (Công thức 3 bước, 5 bậc thuế mới, trần BHXH và các mốc chính sách)
  - 3.4. Thuật toán Chatbot AI HR Phương án A (Zod validation, dừng LLM, render template tĩnh)
  - 3.5. Thuật toán Học máy Dự báo thôi việc (IBM Attrition) & Thuật toán Sàng lọc hồ sơ ứng viên (AI CV Screening)
- **[CHƯƠNG 4. KẾT QUẢ THỰC NGHIỆM](file:///c:/K23CNT1/DANT/DATN/docs/report/ch4_hien_thuc_va_thuc_nghiem.md) (15 – 20 trang):**
  - 4.1. Kết quả thực nghiệm Kiosk FaceID (40 lượt đo `trials.csv`, độ trễ 42.8ms, tỷ lệ chặn giả mạo 100%)
  - 4.2. Kết quả kiểm thử Payroll Engine (22 test cases đối chiếu bảng tính Excel khớp 100%)
  - 4.3. Kết quả đánh giá HR Chatbot AI (Bộ 130 câu hỏi thử nghiệm, tỷ lệ chặn IDOR & gọi đúng tool)
  - 4.4. Kết quả đánh giá Mô hình ML Dự báo thôi việc (Đường cong ROC, AUC, Feature Importance)
  - 4.5. Kết quả kiểm thử tải k6 (100 concurrent users trên Atlas M0) & Đánh giá an toàn OWASP ZAP
  - 4.6. Đánh giá trải nghiệm người dùng thực tế (Khảo sát UAT trên 15 người dùng, điểm đo lường SUS $\ge$ 75)
- **[KẾT LUẬN](file:///c:/K23CNT1/DANT/DATN/docs/report/ket_luan.md) (Tối đa 02 trang):** Đánh giá mức độ hoàn thành so với mục tiêu, đóng góp khoa học, các hạn chế và hướng phát triển tương lai.
- **TÀI LIỆU THAM KHẢO:** Xếp riêng tiếng Việt và tiếng Anh, chuẩn trích dẫn IEEE/APA.
- **PHỤ LỤC:**
  - Phụ lục A: Bảng kiểm thử 22 Test Cases Payroll Excel
  - Phụ lục B: Bộ 130 Prompts kiểm thử Chatbot AI
  - Phụ lục C: Bảng dữ liệu thực nghiệm FaceID 40 trials
  - Phụ lục D: Hướng dẫn cài đặt và vận hành hệ thống

---
*Tham khảo chi tiết quy định định dạng tại: [QUY_DINH_TRINH_BAY_NTU.md](file:///c:/K23CNT1/DANT/DATN/docs/QUY_DINH_TRINH_BAY_NTU.md).*
