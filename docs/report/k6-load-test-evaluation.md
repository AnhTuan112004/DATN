# BÁO CÁO KHOA HỌC KIỂM THỬ CHỊU TẢI HỆ THỐNG (K6 STRESS TESTING EVALUATION)
**Dự án:** PeopleInsight AI — Nền Tảng Quản Trị Nhân Sự & Chấm Công Sinh Trắc Học Đa Doanh Nghiệp (v6.1 FINAL FREEZE)  
**Thời điểm thực nghiệm:** 26/10/2026  
**Công cụ thực thi:** Grafana k6 v0.54.0 (Binary x64) kết hợp Node.js Runner  
**Phân hệ kiểm thử:** Xác thực JWT, Danh mục Nhân sự, Điểm danh Hôm nay, ML Suy luận Nguy cơ thôi việc, và Trợ lý HR AI Chatbot Phương Án A.

---

## 1. MỤC TIÊU VÀ TIÊU CHUẨN NGHIỆM THU (SLA TARGETS)

Để bảo đảm hệ thống PeopleInsight AI vận hành ổn định trong môi trường doanh nghiệp thực tế khi hàng trăm nhân sự cùng điểm danh đầu giờ và tương tác hệ thống, kịch bản kiểm thử tải đặt ra các chỉ số thỏa thuận mức dịch vụ (SLA) nghiêm ngặt:

1. **Quy mô người dùng ảo (Virtual Users):** Đạt đỉnh **100 VUs đồng thời** (`target: 100`).
2. **Tỷ lệ lỗi toàn hệ thống (Error Rate):** $\text{Failure Rate} < 1.00\%$ trên tổng số requests.
3. **Chỉ số độ trễ dịch vụ (Latency SLA):**
   - $P_{95} \le 500\text{ ms}$ (95% số requests hoàn thành dưới nửa giây).
   - $P_{99} \le 1,000\text{ ms}$ (99% số requests hoàn thành dưới một giây).
4. **Tính toàn vẹn nghiệp vụ (Business Integrity):**
   - 100% request qua đúng cơ chế Multi-tenant Fail-Closed.
   - Không rò rỉ dữ liệu hoặc sai lệch trạng thái người dùng.

---

## 2. THIẾT KẾ KỊCH BẢN TẢI (WORKLOAD PROFILE)

Kịch bản được xây dựng theo mô hình tăng tải bậc thang (Step-up Stress Pattern) trong 70 giây:
- **Giai đoạn 1 (0s – 10s):** Khởi động hệ thống từ 0 lên 25 VUs (Ramp-up).
- **Giai đoạn 2 (10s – 30s):** Tăng tốc áp lực từ 25 lên 100 VUs (Acceleration).
- **Giai đoạn 3 (30s – 60s):** Duy trì áp lực cực đại 100 VUs liên tục trong 30 giây (Sustained Peak).
- **Giai đoạn 4 (60s – 70s):** Hạ tải an toàn từ 100 về 0 VUs (Cooldown).

### Danh mục Endpoint Được Kiểm Thử Trong Từng Vòng Lặp:
1. `GET /health`: Kiểm tra sức khỏe hạ tầng cơ bản.
2. `GET /api/auth/me`: Xác thực token và lấy hồ sơ ngữ cảnh cá nhân.
3. `GET /api/users`: Truy vấn danh sách nhân sự có phân trang và lọc tenant.
4. `GET /api/attendance/today`: Kiểm tra trạng thái điểm danh hôm nay của nhân viên.
5. `GET /api/analytics/attrition-risk`: Kích hoạt bộ suy luận máy học (Logistic Regression) dự báo nguy cơ nghỉ việc toàn công ty.
6. `POST /api/ai/chat`: Kích hoạt Trợ lý HR AI (Phương Án A) tra cứu ngày phép theo tỷ lệ ngẫu nhiên 20% VU.

---

## 3. TỔNG HỢP KẾT QUẢ THỰC NGHIỆM ĐO ĐẠC

Bảng dưới đây trình bày kết quả thực tế đo được từ bộ dữ liệu `experiments/load/k6_results.json`:

| Chỉ số Đo Lường | Ngưỡng Đặt Ra (SLA) | Kết Quả Thực Nghiệm | Đánh Giá Nghiệm Thu |
| :--- | :---: | :---: | :---: |
| **Tổng số requests hoàn tất** | Không giới hạn | **20,904 requests** | Vượt mong đợi |
| **Thông lượng trung bình (RPS)** | $> 100\text{ req/s}$ | **296.70 req/s** | Gấp 3 lần mục tiêu |
| **Tỷ lệ lỗi (Error Rate)** | $< 1.00\%$ | **0.00% (0 / 20,904)** | **Hoàn hảo (100% PASS)** |
| **Thời gian phản hồi trung bình ($Avg$)** | $< 300\text{ ms}$ | **176.89 ms** | Đạt SLA |
| **Độ trễ phân vị $P_{90}$** | $< 400\text{ ms}$ | **310.25 ms** | Đạt SLA |
| **Độ trễ phân vị $P_{95}$** | $< 500\text{ ms}$ | **380.38 ms** | Đạt SLA |
| **Độ trễ phân vị $P_{99}$** | $< 1,000\text{ ms}$ | **519.31 ms** | Đạt SLA |
| **Tỷ lệ kiểm tra nghiệp vụ (Checks)** | $> 99.00\%$ | **100.00% (45,066 / 45,066)** | Tuyệt đối |

---

## 4. CHI TIẾT HIỆU NĂNG THEO TỪNG PHÂN HỆ NGHIỆP VỤ

Biểu đồ phân vị độ trễ của các dịch vụ then chốt ghi nhận dưới áp lực 100 VUs:

```
[Phân Hệ]                                 [P95 Latency]          [Tỷ lệ Thành Công]
Auth Context (GET /api/auth/me)           415.00 ms               100.0%
Personnel Directory (GET /api/users)      421.90 ms               100.0%
Attendance Today (GET /attendance/today)   281.00 ms               100.0%
ML Attrition Risk (GET /analytics)        158.00 ms               100.0%
AI HR Chatbot (POST /api/ai/chat)         143.00 ms               100.0%
```

### Phân Tích Kỹ Thuật:
1. **Phân hệ Máy học Dự báo Thôi việc (ML Retention Predictor):**
   - Đạt độ trễ $P_{95} = 158\text{ ms}$ nhờ kiến trúc thuần số học Logistic Regression trên 6 đặc trưng đo lường (không qua ONNX cồng kềnh) kết hợp bộ nhớ đệm In-Memory TTL 10 giây cho toàn công ty.
   - Cơ chế Multi-tenant Fail-Closed áp dụng `mongoose.trusted(...)` trên dải ngày tháng đảm bảo loại bỏ hoàn toàn lỗi CastError mà vẫn ngăn chặn NoSQL injection.
2. **Trợ lý HR AI Chatbot (Phương Án A):**
   - Đạt $P_{95} = 143\text{ ms}$ cực kỳ ấn tượng nhờ mô hình kết xuất Markdown tĩnh tại Backend kết hợp bộ nhớ đệm phản hồi theo phiên người dùng, loại bỏ chi phí gọi vòng lặp LLM không cần thiết.
3. **Phân hệ Điểm danh (Attendance):**
   - Thời gian xử lý trung bình chỉ $281\text{ ms}$, chứng minh cấu trúc đánh chỉ mục `{ companyId: 1, userId: 1, date: 1 }` và tối ưu hóa câu truy vấn phát huy tối đa hiệu quả khi 100 luồng đọc ghi diễn ra đồng thời.

---

## 5. KẾT LUẬN & ĐÓNG BĂNG KẾT QUẢ TUẦN 8

Thực nghiệm kiểm thử chịu tải k6 đã chứng minh hệ thống **PeopleInsight AI (v6.1 FINAL FREEZE)** hoàn toàn đáp ứng các tiêu chuẩn khắt khe về độ tin cậy, thông lượng và khả năng mở rộng phục vụ cho các doanh nghiệp quy mô vừa và lớn.

- **Toàn bộ 20,904 requests** được xử lý thành công với tỷ lệ lỗi **0.00%**.
- Tốc độ thông lượng **296.7 req/s** và phân vị $P_{95} = 380.38\text{ ms}$ đáp ứng trọn vẹn tiêu chuẩn nghiệm thu Đồ án tốt nghiệp.
- Hồ sơ kết quả thô được lưu trữ tại `experiments/load/k6_results.json` và `experiments/load/k6_summary.txt`.
