# CHƯƠNG 5: KẾT LUẬN, HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN

---

## 5.1. KẾT LUẬN VỀ CÁC KẾT QUẢ ĐẠT ĐƯỢC
- 5.1.1. Hoàn thành toàn diện 4 trụ cột công nghệ cốt lõi theo đúng cam kết bản đóng băng v6.1 FINAL FREEZE:
  1. Kiosk FaceID Liveness 2 tầng chạy mượt mà trên trình duyệt Web (54.5 FPS, độ trễ 42.8ms, tỷ lệ chặn giả mạo 100%).
  2. Payroll Engine chuẩn hóa pháp lý năm 2026 với biểu thuế 5 bậc và 2 mốc chính sách, vượt qua 22/22 test cases đối chiếu khớp 100% với Excel.
  3. Trợ lý ảo HR AI theo Phương án A bảo vệ tuyệt đối dữ liệu nhạy cảm nội bộ, phản hồi chính xác 4 công cụ P0.
  4. Mô hình ML dự báo nguy cơ thôi việc khách quan, công bằng trên 6 đặc trưng định lượng chuẩn hóa từ IBM HR Attrition.
- 5.1.2. Xây dựng thành công kiến trúc hệ thống tinh gọn đúng 11 Collections, bảo mật RBAC 4 cấp, giao tiếp thời gian thực Socket.io và trải nghiệm người dùng đạt chuẩn $SUS \ge 75$.

## 5.2. CÁC HẠN CHẾ KỸ THUẬT HIỆN TẠI (TRUNG THỰC KHOA HỌC)
- 5.2.1. Hạn chế của cơ chế Liveness tại Client:
  - Phụ thuộc vào chất lượng camera và điều kiện ánh sáng môi trường thực tế (trong môi trường cực kỳ thiếu sáng dưới 50 lux, khoảng cách nhận diện tăng nhẹ).
  - Khả năng chống các cuộc tấn công tinh vi dạng mặt nạ silicon 3D (3D Mask Attacks) còn hạn chế do không có cảm biến chiều sâu chuyên dụng (IR/ToF).
- 5.2.2. Hạn chế của Mô hình Machine Learning Dự báo thôi việc:
  - Mô hình hiện được huấn luyện trên tập dữ liệu tổng quát của tập đoàn IBM (Mỹ); mặc dù các đặc trưng đã được chuẩn hóa phân vị để phản ánh tương quan vị trí, mô hình vẫn cần thêm dữ liệu biến động nhân sự thực tế tại thị trường Việt Nam để hiệu chỉnh độ nhạy tối ưu.
  - Quy mô thử nghiệm 50 nhân viên giả lập chỉ mang tính chất minh họa chứng minh tính khả thi của giải thuật và luồng dữ liệu (Proof of Concept).
- 5.2.3. Hạn chế của Chatbot Phương án A:
  - Do dừng luồng LLM và render bằng template Markdown tĩnh để đảm bảo an toàn dữ liệu, câu trả lời của trợ lý ảo không mang tính chất đàm thoại bay bổng, tự nhiên như các mô hình sinh văn bản tự do. Tuy nhiên, đây là sự đánh đổi có chủ đích và bắt buộc vì lý do bảo mật dữ liệu nhân sự nhạy cảm.

## 5.3. HƯỚNG PHÁT TRIỂN VÀ MỞ RỘNG TRONG TƯƠNG LAI
- 5.3.1. Nâng cấp bảo mật sinh trắc học với cảm biến phần cứng chuyên dụng (RGB-D / Infrared) và WebAuthn (Passkeys FIDO2) cho quy trình đăng nhập không cần mật khẩu.
- 5.3.2. Mở rộng hệ thống RAG (Retrieval-Augmented Generation) tra cứu sổ tay nội quy lao động và chính sách phúc lợi nội bộ công ty dựa trên collection `policyChunks` (P1).
- 5.3.3. Tích hợp phân hệ tuyển dụng và sàng lọc CV ứng viên thông minh với collection `jobPostings` (P1).
- 5.3.4. Nghiên cứu huấn luyện mô hình học máy trên dữ liệu chuỗi thời gian (Recurrent Neural Networks / Temporal Transformers) để dự báo biến động lương và ngân sách nhân sự dài hạn cho doanh nghiệp.
