# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CĂN CỨ PHÁP LÝ

---

## 2.1. NGHIỆP VỤ QUẢN TRỊ NHÂN LỰC VÀ TIỀN LƯƠNG TRONG DOANH NGHIỆP
- 2.1.1. Chu trình quản lý vòng đời nhân viên (Employee Lifecycle): Tuyển dụng, Thử việc, Ký hợp đồng, Chấm công, Tính lương, Đào tạo, Đánh giá và Thôi việc.
- 2.1.2. Cơ chế phân quyền và luồng phê duyệt đơn từ 2 cấp (Manager $\rightarrow$ HR Manager).
- 2.1.3. Chế độ nghỉ phép năm theo Điều 113–114 Bộ luật Lao động 2019 (cộng thâm niên 1 ngày mỗi 5 năm).

## 2.2. KHUNG PHÁP LÝ TIỀN LƯƠNG, BẢO HIỂM VÀ THUẾ TNCN NĂM 2026
- 2.2.1. Các văn bản quy phạm pháp luật nền tảng: Bộ luật Lao động 2019, Luật Thuế TNCN mới (Luật số 109/2025/QH15), Nghị định 253/2026/NĐ-CP, Nghị định 161/2026/NĐ-CP, Nghị định 145/2020/NĐ-CP.
- 2.2.2. Biểu thuế thu nhập cá nhân lũy tiến từng phần 5 bậc mới (10M - 5%, 30M - 10%, 60M - 20%, 100M - 30%, trên 100M - 35%).
- 2.2.3. Mức giảm trừ gia cảnh (15.5 triệu đồng cho bản thân, 6.2 triệu đồng cho người phụ thuộc).
- 2.2.4. Hai mốc chuyển tiếp chính sách trong năm 2026:
  - Giai đoạn 1 (01/01/2026 – 30/06/2026): Trần BHXH/BHYT 46.800.000đ; Trần ăn ca miễn thuế 730.000đ.
  - Giai đoạn 2 (từ 01/07/2026): Trần BHXH/BHYT 50.600.000đ; Trần ăn ca miễn thuế 1.200.000đ.
- 2.2.5. Chế độ làm thêm giờ (OT) và làm việc ban đêm theo Điều 98 BLLĐ và Điều 55 NĐ 145/2020:
  - Hệ số OT ban ngày: 150% (ngày thường), 200% (nghỉ hàng tuần), 300% (ngày lễ).
  - Phụ cấp làm đêm 22h–06h: tối thiểu 30%.
  - OT ban đêm: 210% (ngày thường), 270% (nghỉ hàng tuần), 390% (ngày lễ).
  - Trần OT: không quá 4h/ngày, 40h/tháng, 200h/năm.

## 2.3. CÔNG NGHỆ SINH TRẮC HỌC KHUÔN MẶT VÀ CHỐNG GIẢ MẠO 2D
- 2.3.1. Các kỹ thuật phát hiện khuôn mặt: SSD MobileNetV1, MediaPipe Face Landmarker.
- 2.3.2. Kiểm tra thực thể sống (Liveness Detection): 52 Blendshapes, EAR (Eye Aspect Ratio), MAR (Mouth Aspect Ratio), Head Pose Estimation (Yaw/Pitch) qua ma trận biến đổi.
- 2.3.3. Trích xuất Face Embedding 128 chiều (`face_recognition_model`) và giải thuật đo khoảng cách Euclid / Cosine.
- 2.3.4. Đánh giá tính hợp pháp bản quyền mã nguồn và weights: Giấy phép MIT / Apache 2.0; tuyệt đối không sử dụng tập dữ liệu vi phạm đạo đức MS-Celeb-1M.

## 2.4. TRÍ TUỆ NHÂN TẠO TẠO SINH VÀ BẢO VỆ DỮ LIỆU NHẠY CẢM
- 2.4.1. Tổng quan về Mô hình Ngôn ngữ Lớn (LLM) và cơ chế Function Calling trên dòng Gemini 3.x (`gemini-3-flash-preview`).
- 2.4.2. So sánh hai trường phái ứng dụng Function Calling:
  - Trường phái kinh điển (gửi `functionResponse` ngược lại cho LLM viết văn).
  - **Phương án A (Template Rendering):** Dừng luồng LLM sau `functionCall`, Backend tự truy vấn CSDL và render Markdown template tĩnh.
- 2.4.3. Phân tích rủi ro an toàn thông tin: Lỗ hổng rò rỉ dữ liệu tài chính (Data Leakage) và phòng chống tấn công Prompt Injection.

## 2.5. HỌC MÁY DỰ BÁO BIẾN ĐỘNG NHÂN SỰ VÀ ĐẠO ĐỨC AI
- 2.5.1. Bài toán dự báo nguy cơ nhân viên thôi việc (Employee Attrition Prediction).
- 2.5.2. Tập dữ liệu chuẩn mực IBM HR Attrition.
- 2.5.3. Nguyên tắc công bằng và đạo đức AI: Loại bỏ biến nhạy cảm (Gender, Age, MaritalStatus); chỉ sử dụng 6 đặc trưng định lượng khách quan (`OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` phân vị, `NumCompaniesWorked`, `DistanceFromHome`).

## 2.6. TUÂN THỦ LUẬT BẢO VỆ DỮ LIỆU CÁ NHÂN (LUẬT BVDLCN 91/2025/QH15)
- 2.6.1. Quy định về dữ liệu cá nhân nhạy cảm (sinh trắc học, thu nhập, lịch sử vị trí).
- 2.6.2. Cơ chế chấp thuận tường minh (Explicit Consent) và chức năng rút lại sự đồng ý: Xóa vĩnh viễn vector khuôn mặt trong collection `faceTemplates`.
- 2.6.3. Kiến trúc lưu trữ tách biệt và mã hóa at-rest.
