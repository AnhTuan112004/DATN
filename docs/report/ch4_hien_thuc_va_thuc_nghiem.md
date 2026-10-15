# CHƯƠNG 4: HIỆN THỰC HÓA VÀ ĐÁNH GIÁ THỰC NGHIỆM

---

## 4.1. HIỆN THỰC HÓA ĐỘNG CƠ TÍNH LƯƠNG (PAYROLL ENGINE 2026)
- 4.1.1. Cài đặt thuật toán thuần (Pure Function) tính toán 3 bước:
  - Bước 1: Tính Tổng thu nhập (Gross = Base + Allowances + OT + Bonus + Meal).
  - Bước 2: Tính Thu nhập chịu thuế = Gross - Các khoản miễn thuế (chênh lệch OT, ăn ca vượt trần, phụ cấp đêm, phép chưa nghỉ).
  - Bước 3: Tính Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản giảm trừ (BHXH 10.5% có trần + Bản thân 15.5M + Phụ thuộc 6.2M/người).
- 4.1.2. Hiện thực hóa việc chọn động chính sách theo ngày hiệu lực (trước và sau 01/07/2026).
- 4.1.3. Cài đặt thuật toán tính thuế lũy tiến từng phần 5 bậc mới.
- 4.1.4. Cơ chế khóa kỳ lương nguyên tử bằng MongoDB Transaction và tạo snapshot tham số.

## 4.2. BỘ KIỂM THỬ 22 TEST CASES ĐỐI CHIẾU BẢNG TÍNH LƯƠNG EXCEL
- 4.2.1. Thiết kế bộ dữ liệu kiểm thử 22 trường hợp bao phủ toàn diện các tình huống biên:
  - Case 1: Lương cơ bản không OT, không phụ thuộc (Kỳ trước 01/07).
  - Case 2: Lương cao chạm trần BHXH, có phụ thuộc.
  - Case 3–7: Các trường hợp OT ngày thường, nghỉ tuần, ngày lễ.
  - Case 8–9: Làm ca đêm và OT ban đêm.
  - Case 10: Chi trả tiền bồi thường ngày phép chưa sử dụng.
  - Case 11–12: Nhân viên vào/thôi việc giữa kỳ lương, nghỉ ốm hưởng BHXH.
  - Case 13–16: Các điểm biên bậc thuế (10M, 30M, 60M, 100M).
  - Case 17a, 17b: Kiểm thử trần ăn ca 730k (trước 01/07/2026).
  - Case 18a, 18b: Kiểm thử trần ăn ca 1.2M (từ 01/07/2026).
  - Case 19: Phụ cấp ban đêm và miễn thuế ca đêm.
  - Case 20: Trường hợp tổng hợp đa phức hợp.
  - Case 21–22: Trường hợp giảm trừ tối đa và kiểm tra biên.
- 4.2.2. Bảng kết quả đối chiếu tự động bằng Jest Unit Tests: Đạt độ khớp 100% đến từng đồng lẻ.

## 4.3. HIỆN THỰC HÓA VÀ THỰC NGHIỆM KIOSK FACEID 2 TẦNG
- 4.3.1. Cài đặt luồng Liveness Tầng 1 với `@vladmandic/face-api` (EAR, MAR, Yaw) và cấp thử thách ngẫu nhiên.
- 4.3.2. Cài đặt luồng so khớp Tầng 2 với vector 128-D và lưu trữ trong `faceTemplates`.
- 4.3.3. Kết quả đo đạc thực nghiệm trên 10 đối tượng mẫu với 40 lượt thử (`trials.csv`):
  - Phân bố khoảng cách Euclid: Genuine ($0.290 - 0.535$) vs Impostor ($0.760 - 1.084$).
  - Khoảng cách phân tách an toàn: $\Delta = 0.225 > 0$.
  - Tỷ lệ phát hiện và chặn đứng tấn công giả mạo 2D: 100% (8/8 lượt tấn công).
  - Độ trễ trung bình: 42.8 ms, Tốc độ khung hình: 54.5 FPS.
- 4.3.4. Đánh giá tỷ lệ sai số FAR (False Acceptance Rate) và FRR (False Rejection Rate).

## 4.4. HIỆN THỰC HÓA HR CHATBOT AI VÀ ĐÁNH GIÁ PHƯƠNG ÁN A
- 4.4.1. Cài đặt Endpoint Chatbot với SDK `@google/genai` và 4 Tools Function Calling P0 (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`).
- 4.4.2. Hiện thực hóa Phương án A (Template Rendering) với cơ chế thẩm định RBAC/IDOR tại Backend.
- 4.4.3. Thực nghiệm đánh giá trên bộ 130 prompts thử nghiệm:
  - 60 câu truy vấn hợp lệ: Tỷ lệ trích xuất đúng tool và render chính xác.
  - 30 câu cố tình vượt quyền RBAC / hỏi lương người khác: 100% bị từ chối truy cập.
  - 30 câu viết tắt, tiếng Việt không dấu: Khả năng xử lý tự nhiên của Gemini 3.x.
  - 10 câu thử nghiệm tấn công Prompt Injection: Đảm bảo dữ liệu hệ thống an toàn.
- 4.4.4. Đo đạc độ trễ phản hồi (p50, p95) và cơ chế bộ đệm cache câu hỏi thường gặp.

## 4.5. HIỆN THỰC HÓA MÔ HÌNH ML DỰ BÁO NGUY CƠ THÔI VIỆC
- 4.5.1. Tiền xử lý tập dữ liệu IBM HR Attrition: Lọc 6 đặc trưng, chuẩn hóa phân vị thu nhập, phân tầng train/test 80/20.
- 4.5.2. Huấn luyện và so sánh hiệu năng các mô hình: Baseline Luật, Logistic Regression, Random Forest.
- 4.5.3. Đánh giá chất lượng mô hình: Ma trận nhầm lẫn (Confusion Matrix), Precision, Recall, F1-Score, diện tích dưới đường cong ROC (AUC-ROC).
- 4.5.4. Đánh giá mức độ quan trọng của đặc trưng (Feature Importance) và tích hợp mô hình suy luận vào Node.js Backend.

## 4.6. DASHBOARD QUẢN TRỊ VÀ HỆ THỐNG CẢNH BÁO HR RULE-BASED
- 4.6.1. Thiết kế Dashboard trực quan hóa với Recharts (biểu đồ cơ cấu nhân sự, biến động lương, tỷ lệ vắng mặt, phân bố nguy cơ thôi việc).
- 4.6.2. Cài đặt 4 luật cảnh báo sớm (Early Warnings) định kỳ qua Cron-job:
  - Đi muộn $\ge 3$ lần trong tuần.
  - Quên quẹt thẻ về $\ge 2$ lần trong tuần.
  - Số giờ làm thêm (OT) chạm ngưỡng cảnh báo 35–40 giờ/tháng.
  - Hợp đồng lao động còn hiệu lực $\le 30$ ngày.

## 4.7. KIỂM THỬ HIỆU NĂNG TẢI VÀ KIỂM TRA BẢO MẬT HỆ THỐNG
- 4.7.1. Kiểm thử tải k6: Giả lập 100 người dùng đồng thời trên hạ tầng MongoDB Atlas M0, đo đạc RPS, p95 Latency và tỷ lệ lỗi.
- 4.7.2. Kiểm thử an toàn thông tin với OWASP ZAP: Rà quét lỗ hổng SQLi/NoSQLi, XSS, CSRF, cấu hình Helmet và Cookie HttpOnly.
- 4.7.3. Kiểm thử kiểm toán truy cập IDOR trên 100% các API nhạy cảm.

## 4.8. ĐÁNH GIÁ TRẢI NGHIỆM NGƯỜI DÙNG (UAT) VÀ THANG ĐO SUS
- 4.8.1. Thiết kế kịch bản thử nghiệm UAT cho 3 nhóm đối tượng: Cán bộ Nhân sự (HR), Quản lý phòng ban (Manager), Nhân viên (Employee).
- 4.8.2. Đo đạc thời gian hoàn thành các tác vụ cốt lõi (Chấm công mặt, Nộp đơn nghỉ, Duyệt đơn 2 cấp, Chốt bảng lương, Chatbot tra cứu).
- 4.8.3. Kết quả đánh giá theo thang đo quốc tế SUS (System Usability Scale): Phân tích điểm số chi tiết từng tiêu chí, mục tiêu đạt $SUS \ge 75$.
