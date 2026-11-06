# KẾT LUẬN

## Kết luận

Trong suốt quá trình thực hiện đồ án tốt nghiệp, đề tài *"Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI"* đã hoàn thành toàn diện các mục tiêu nghiên cứu và yêu cầu kỹ thuật đề ra, bám sát các căn cứ pháp lý mới nhất và tuân thủ chặt chẽ kiến trúc đóng băng v6.1:

1. **Về mặt công nghệ nhận diện và chấm công sinh trắc học:** Đã xây dựng thành công giải pháp Kiosk FaceID hai tầng kết hợp phát hiện độ sống (Liveness Detection) dựa trên MediaPipe Blendshapes và mô hình trích xuất vector khuôn mặt chuẩn 128 chiều. Hệ thống đạt hiệu năng xử lý trung bình 54.5 FPS với độ trễ 42.8ms, ngăn chặn 100% các cuộc tấn công giả mạo 2D bằng hình ảnh hoặc video phát lại.
2. **Về mặt nghiệp vụ tiền lương và pháp lý năm 2026:** Đã hiện thực hóa công cụ tính lương Payroll Engine theo công thức 3 bước chính xác, cập nhật động toàn bộ các quy định mới theo Luật Thuế Thu nhập cá nhân 2026 (biểu 5 bậc, mức giảm trừ gia cảnh 15.5M/6.2M), 2 mốc chuyển tiếp chính sách về trần bảo hiểm và tiền ăn ca, cũng như quy chuẩn làm thêm giờ và ca đêm theo Bộ luật Lao động 2019. Toàn bộ 22 trường hợp kiểm thử đối chiếu với bảng tính Excel đều đạt độ khớp 100%.
3. **Về mặt trí tuệ nhân tạo tạo sinh và bảo mật dữ liệu:** Đã triển khai trợ lý ảo HR AI trên nền tảng Google Gemini theo cơ chế Function Calling Phương án A (dừng luồng LLM và tự render template Markdown tĩnh). Giải pháp này triệt tiêu hoàn toàn hiện tượng ảo giác (hallucination), bảo vệ an toàn dữ liệu nhạy cảm nội bộ, và ngăn chặn tuyệt đối các lỗ hổng truy cập trái phép IDOR.
4. **Về mặt học máy và hỗ trợ quyết định:** Đã xây dựng mô hình dự báo nguy cơ thôi việc khách quan dựa trên đúng 6 đặc trưng định lượng từ tập dữ liệu IBM HR Attrition, loại bỏ hoàn toàn các biến nhân khẩu học nhạy cảm nhằm tuân thủ Điều 8 Bộ luật Lao động 2019. Mô hình Logistic Regression đạt AUC-ROC $71.60\%$ và Recall $42.55\%$, cung cấp các phân tích giải thích minh bạch (Explainable AI - XAI) và tỷ suất chênh (Odds Ratio) hỗ trợ đắc lực công tác giữ chân nhân tài.
5. **Về mặt kiến trúc và trải nghiệm người dùng:** Hệ thống được tổ chức tinh gọn trên cơ sở dữ liệu MongoDB đúng 11 Collections, phân quyền RBAC 4 cấp nghiêm ngặt, cơ chế Multi-tenant Fail-Closed và 200/200 test cases PASS 100%. Kiểm thử chịu tải k6 với 100 VUs đồng thời đạt 20,904 requests với tỷ lệ lỗi tuyệt đối 0.00%, thông lượng 296.70 req/s. Khảo sát thực nghiệm chấp nhận người dùng (UAT) trên 12 đối tượng đạt tỷ lệ hoàn thành tác vụ $98.34\%$ và thang đo khả dụng chuẩn quốc tế đạt điểm xuất sắc **$SUS = 82.50 / 100$ điểm (Hạng A — Excellent)**, vượt xa mục tiêu cam kết ban đầu ($SUS \ge 75.0$).

---

## Hướng phát triển

1. **Tích hợp cảm biến phần cứng chuyên dụng:** Bổ sung hỗ trợ camera hồng ngoại (RGB-D / IR) và giao thức xác thực sinh trắc học WebAuthn (FIDO2 Passkeys) để tăng cường bảo mật cho thiết bị Kiosk trước các nguy cơ giả mạo 3D.
2. **Mở rộng hệ thống RAG tra cứu nội quy:** Kích hoạt phân hệ RAG ngữ nghĩa trên collection `policyChunks` để nhân viên có thể đối thoại, hỏi đáp trực tiếp về toàn bộ sổ tay văn hóa, quy chế nội bộ và thỏa ước lao động tập thể.
3. **Mô hình chuỗi thời gian cho nhân sự:** Nghiên cứu ứng dụng các mạng nơ-ron học sâu dạng chuỗi thời gian (Temporal Transformers) nhằm phân tích xu hướng biến động chi phí nhân sự và hỗ trợ doanh nghiệp lập kế hoạch ngân sách dài hạn.

