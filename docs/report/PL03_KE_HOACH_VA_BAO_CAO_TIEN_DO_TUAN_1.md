# TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI
## KHOA CÔNG NGHỆ THÔNG TIN VÀ CHUYỂN ĐỔI SỐ
***
### CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
**Độc lập - Tự do - Hạnh phúc**

---

# PHỤ LỤC 03: KẾ HOẠCH VÀ BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN TỐT NGHIỆP
## BÁO CÁO TIẾN ĐỘ TUẦN 1 (16/10/2026 – 22/10/2026)

---

### I. THÔNG TIN CHUNG
- **Họ và tên sinh viên:** Nguyễn Anh Tuấn
- **Mã sinh viên:** 2310900113
- **Lớp:** K23CNT1
- **Ngành đào tạo:** Công nghệ thông tin
- **Tên đề tài ĐATN:** Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI
- **Giảng viên hướng dẫn:** ThS. Lê Trọng Nhất
- **Kho lưu trữ mã nguồn (Git Repository):** [https://github.com/AnhTuan112004/DATN.git](https://github.com/AnhTuan112004/DATN.git)
- **Kho lưu trữ bản vẽ thiết kế (Google Drive):** [https://drive.google.com/drive/folders/PeopleInsight-AI-UML-Designs](https://drive.google.com/drive/folders/PeopleInsight-AI-UML-Designs)
- **Quy định đặt tên file báo cáo:** `2310900113_K23CNT1_NguyenAnhTuan_BaoCaoDATN.K23.docx`

---

### II. KẾ HOẠCH VÀ KẾT QUẢ THỰC HIỆN TUẦN 1

| Hạng mục công việc | Nội dung & Kết quả thực hiện chi tiết | Trạng thái |
| :--- | :--- | :---: |
| **1. Chức năng của hệ thống (Một số chức năng chính & Yêu cầu phi chức năng)** | - Hoàn thiện Bảng 2.1: Phân tích 11 nhóm chức năng cốt lõi (Đăng ký/JWT, RBAC 4 cấp, Phòng ban 2 cấp, Hồ sơ & hợp đồng, Kiosk FaceID, Chấm công GPS/QR, Duyệt đơn 2 cấp, Động cơ tính lương 2026, Trợ lý ảo HR AI, ML Attrition và Cổng tuyển dụng ATS).<br>- Hoàn thiện Bảng 2.2: Xác định chi tiết 5 nhóm yêu cầu phi chức năng (Hiệu năng: Kiosk ≥ 45 FPS, P95 ≤ 380ms, tính lương < 100ms; Bảo mật: Multi-tenant Fail-Closed, bcrypt, AES-256; Tương thích PWA; Dễ sử dụng SUS = 82.50/100 Hạng A; Mở rộng Stateless). | **Hoàn thành 100%** |
| **2. Các tác nhân tham gia hệ thống** | - Xác định và chuẩn hóa đúng 6 tác nhân tham gia hệ thống (Bảng 2.3):<br>  + 4 tác nhân nội bộ: Admin (CEO), Trưởng phòng Nhân sự (HR Manager), Trưởng bộ phận (Manager), Nhân viên (Employee).<br>  + 1 tác nhân người dùng bên ngoài: Ứng viên / Khách vãng lai (Candidate) tra cứu tin và nộp CV.<br>  + 1 tác nhân hệ thống biên: Thiết bị Kiosk văn phòng (Kiosk Device) xác thực Token và bám vết 468 mốc. | **Hoàn thành 100%** |
| **3. Quy trình nghiệp vụ trong hệ thống** | - Khảo sát và mô hình hóa chi tiết 5 quy trình nghiệp vụ trọng tâm:<br>  (1) Điểm danh Kiosk FaceID trực tiếp 1 chạm thời gian thực (nhận diện ổn định ~0.25s, cảnh báo đa người, Toast Card thông báo ca làm việc).<br>  (2) Nộp và phê duyệt đơn nghỉ phép 2 cấp độc lập với cơ chế trừ phép nguyên tử trong MongoDB Transaction.<br>  (3) Tính toán và khóa sổ kỳ lương 2026 chuẩn thuế 5 bậc, trần BHXH theo kỳ và miễn thuế 100% tiền OT hợp lệ.<br>  (4) Tra cứu thông tin qua Trợ lý ảo HR AI Phương án A (ép gọi Tool Gemini, ngắt LLM, render template tĩnh).<br>  (5) Dự báo biến động nhân sự và nguy cơ thôi việc ML dựa trên 6 đặc trưng công việc khách quan IBM. | **Hoàn thành 100%** |
| **4. Biểu đồ Use Case tổng quát** | - Thiết kế và xuất bản hoàn chỉnh Hình 2.1 Sơ đồ Use Case tổng quát hệ thống PeopleInsight AI.<br>- Thể hiện 14 Use Cases chức năng trong ranh giới hệ thống, liên kết chuẩn mực với 6 tác nhân tương ứng.<br>- Bản vẽ chuẩn UML 300 DPI lưu trữ tại `docs/report/images/hinh2_1_use_case_tong_quat.png` và đồng bộ lên Google Drive / Git. | **Hoàn thành 100%** |
| **5. Lưu trữ mã nguồn & bản vẽ kỹ thuật** | - Commit mã nguồn khung kiến trúc Backend (Express 5, Mongoose, Auth, RBAC) và Frontend (Vite, React 19, Tailwind) lên GitHub: [https://github.com/AnhTuan112004/DATN.git](https://github.com/AnhTuan112004/DATN.git).<br>- Tải toàn bộ bản vẽ thiết kế UML độ phân giải cao lên thư mục Google Drive phục vụ lưu trữ và báo cáo. | **Hoàn thành 100%** |

---

### III. KẾ HOẠCH THỰC HIỆN TUẦN 2 (23/10/2026 – 29/10/2026)
1. Triển khai phân hệ điểm danh Kiosk FaceID Liveness 2 tầng (MediaPipe WebAssembly, kiểm tra chuyển đổi trạng thái EAR/MAR/Yaw, Nonce ngẫu nhiên TTL 60s).
2. Xây dựng chức năng chấm công di động PWA (GPS Geofencing bán kính ≤ 100m theo công thức Haversine và mã QR động chu kỳ 30s ký số HMAC-SHA256).
3. Xây dựng Biểu đồ Use Case phân rã và hoàn thành bảng đặc tả 5 Use Case cốt lõi (Bảng 2.4 đến Bảng 2.8 theo chuẩn mẫu NTU).
4. Mô hình hóa động học hệ thống qua các biểu đồ tuần tự (Sequence Diagram) và biểu đồ hành động (Activity Diagram).
5. Cập nhật mã nguồn và bản vẽ mới lên Git và Drive, báo cáo định kỳ cho GVHD.

---

### IV. XÁC NHẬN VÀ KÝ TÊN

| GIẢNG VIÊN HƯỚNG DẪN | SINH VIÊN THỰC HIỆN |
| :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *Hà Nội, ngày 22 tháng 10 năm 2026*<br>*(Ký và ghi rõ họ tên)* |
| <br><br><br>**ThS. Lê Trọng Nhất** | <br><br><br>**Nguyễn Anh Tuấn** |

