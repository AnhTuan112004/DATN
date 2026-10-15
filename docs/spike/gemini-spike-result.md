# KẾT QUẢ THỰC NGHIỆM SPIKE ②: GEMINI FUNCTION CALLING

- **Thời gian thực nghiệm:** 00:12:51 15/10/2026
- **Model tối ưu:** `gemini-3-flash-preview`
- **SDK chính thức:** `@google/genai` (v2.29.1)
- **Cơ chế:** Luân chuyển 2 API Keys + Tự động Retry 503
- **Tỷ lệ gọi đúng Tool:** 100% (4/4 test cases P0)
- **Độ trễ phản hồi trung bình:** `1821ms`

## Bảng kết quả đo lường:
| STT | Câu truy vấn (Prompt) | Tool được model kích hoạt | Tham số trích xuất | Độ trễ | Kết quả |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | "Cho tôi xem số ngày phép năm còn lại của tôi." | `get_leave_balance` | `{}` | 1949ms | ✅ PASS |
| 2 | "Xem phiếu lương tháng 5 năm 2026 của tôi." | `get_payslip` | `{"year":2026,"month":5}` | 1597ms | ✅ PASS |
| 3 | "Tháng 4 năm 2026 tôi đi muộn mấy lần và làm được bao nhiêu ngày công?" | `get_attendance_summary` | `{"year":2026,"month":4}` | 1752ms | ✅ PASS |
| 4 | "Thống kê tình hình nghỉ phép của cả phòng ban trong tháng 6 năm 2026." | `get_team_leave_stats` | `{"year":2026,"month":6}` | 1987ms | ✅ PASS |

## Kết luận & Quyết định kỹ thuật:
1. **Model chốt:** Chọn `gemini-3-flash-preview` làm model mặc định cho hệ thống (biến `GEMINI_MODEL`).
2. **Tuân thủ Phương án A:** Model trả về `functionCall` chính xác cùng tham số `month`, `year`. Backend tự render số liệu mà không cần gửi dữ liệu tài chính ngược lại cho Google.
3. Đã ghi nhận quyết định vào `docs/PROGRESS.md`.
