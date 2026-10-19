# PHẦN MỞ ĐẦU

---

### 1. Đặt vấn đề

Quản trị nguồn nhân lực (Human Resource Management, viết tắt là HRM) đóng vai trò quan trọng trong việc vận hành và phát triển của mỗi tổ chức. Tại các doanh nghiệp vừa và nhỏ (SMEs) ở Việt Nam hiện nay, công tác quản trị nhân sự vẫn bộc lộ nhiều điểm nghẽn trong vận hành thực tế:

Thứ nhất là bất cập trong khâu ghi nhận ngày công. Nhiều đơn vị vẫn dùng thẻ từ hoặc máy chấm công vân tay. Thẻ từ dễ phát sinh tình trạng chấm công hộ. Đầu đọc vân tay thường gặp lỗi khi tay ướt, dính bụi bẩn hoặc vân tay mờ, dễ gây ùn ứ vào giờ cao điểm. Một số nơi đã chuyển sang nhận diện khuôn mặt nhưng chủ yếu dùng các thiết bị giá rẻ chỉ đối sánh ảnh tĩnh 2D, không có cơ chế phát hiện thực thể sống (Liveness Detection). Hệ thống dạng này dễ bị đánh lừa bởi ảnh in màu hoặc video phát lại trên điện thoại.

Thứ hai là sự thay đổi lớn về chính sách thuế và bảo hiểm xã hội trong năm 2026. Luật Thuế Thu nhập cá nhân mới áp dụng biểu lũy tiến 5 bậc, nâng mức giảm trừ gia cảnh lên 15,5 triệu đồng đối với người nộp thuế và 6,2 triệu đồng đối với mỗi người phụ thuộc. Năm tài chính 2026 còn có hai mốc chuyển tiếp chính sách về trần đóng bảo hiểm xã hội (46,8 triệu đồng trong 6 tháng đầu năm và 50,6 triệu đồng từ ngày 01/07/2026) cùng trần tiền ăn ca miễn thuế (730.000 đồng và 1.200.000 đồng). Việc tính lương dựa trên các bảng tính Excel thủ công rất dễ nhầm lẫn công thức, làm tăng rủi ro sai sót tài chính và khiếu nại nội bộ.

Thứ ba là vấn đề an toàn dữ liệu khi ứng dụng Trí tuệ nhân tạo. Sự xuất hiện của các mô hình ngôn ngữ lớn (LLM) hỗ trợ tốt cho việc giải đáp thông tin nội bộ. Tuy nhiên, nếu gửi trực tiếp dữ liệu nhân sự lên các dịch vụ đám mây công cộng mà không có lớp kiểm soát, thông tin nhạy cảm như mức lương, số tài khoản hoặc dữ liệu sinh trắc học có nguy cơ bị lộ lọt, vi phạm Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. Ngoài ra, các nhà quản lý cũng thiếu công cụ định lượng khách quan để nhận diện sớm nguy cơ thôi việc của nhân viên nhằm kịp thời có giải pháp giữ chân nhân tài.

Từ những yêu cầu thực tế đó, đề tài *"Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI"* được triển khai nhằm xây dựng một giải pháp phần mềm quản trị nhân sự có khả năng chấm công chống gian lận, tự động tính lương đúng quy định pháp luật năm 2026, hỗ trợ tra cứu thông tin an toàn dữ liệu và dự báo biến động nhân sự một cách khách quan.

---

### 2. Mục tiêu đề tài

#### 2.1. Mục tiêu tổng quát
Nghiên cứu, thiết kế và phát triển hệ thống phần mềm quản trị nhân sự PeopleInsight AI. Hệ thống tích hợp chấm công khuôn mặt chống giả mạo tại thiết bị Kiosk, động cơ tính lương tự động cập nhật chính sách pháp lý năm 2026, trợ lý ảo tra cứu thông tin nhân sự có cơ chế bảo vệ dữ liệu nhạy cảm và mô hình học máy cảnh báo nguy cơ thôi việc.

#### 2.2. Mục tiêu cụ thể
1. Xây dựng phân hệ Kiosk chấm công sinh trắc học hai tầng:
   - Tầng 1 (Client Liveness): Sử dụng MediaPipe Face Landmarker để kiểm tra phản xạ sinh lý học theo thời gian (chớp mắt, cử động miệng, quay đầu) đáp ứng thử thách ngẫu nhiên từ máy chủ, ngăn chặn tấn công giả mạo 2D bằng ảnh in hoặc video.
   - Tầng 2 (Server Matching): Trích xuất vector đặc trưng 128 chiều (`Float32Array`), so khớp danh tính bằng khoảng cách Euclid và Cosine với độ trễ dưới 50ms mỗi khung hình, vận hành hoàn toàn nội bộ để bảo đảm quyền riêng tư.
2. Hiện thực hóa động cơ tính lương (Payroll Engine) theo quy định năm 2026:
   - Áp dụng quy trình tính toán ba bước: Tổng thu nhập, Thu nhập chịu thuế, Thu nhập tính thuế và Lương thực nhận Net.
   - Tự động tra cứu tham số theo ngày hiệu lực, xử lý chính xác hai giai đoạn chuyển tiếp trong năm 2026 cùng biểu thuế lũy tiến 5 bậc. Đạt độ chính xác 100% trên bộ 22 trường hợp kiểm thử đối chiếu với bảng tính Excel chuẩn.
   - Khóa kỳ lương nguyên tử (`periodLockedAt`) và lưu snapshot tham số để đảm bảo tính bất biến của dữ liệu lịch sử.
3. Phát triển trợ lý ảo HR Chatbot an toàn dữ liệu:
   - Ứng dụng mô hình Google Gemini qua cơ chế gọi hàm (Function Calling) để tiếp nhận và phân tích câu hỏi của nhân viên.
   - Ngắt luồng xử lý của LLM ngay sau khi xác định được hàm nghiệp vụ. Máy chủ nội bộ tự kiểm tra quyền truy cập, truy vấn cơ sở dữ liệu và điền số liệu vào mẫu Markdown định sẵn, không gửi dữ liệu lương hay thông tin cá nhân ra dịch vụ bên ngoài.
4. Xây dựng mô hình học máy dự báo thôi việc (Retention Predictor):
   - Huấn luyện mô hình phân loại trên tập dữ liệu IBM HR Attrition dựa trên 6 đặc trưng định lượng đo lường công việc, loại bỏ các biến nhạy cảm về nhân khẩu học (giới tính, tuổi tác, tình trạng hôn nhân) theo quy định chống phân biệt đối xử của Bộ luật Lao động 2019.
5. Thiết kế kiến trúc cơ sở dữ liệu và cơ chế bảo mật:
   - Quy hoạch cơ sở dữ liệu MongoDB gồm 11 collections có cấu trúc rõ ràng, hạn chế tình trạng truy vấn phân mảnh.
   - Thiết lập cơ chế cách ly dữ liệu đa công ty (Multi-tenancy Fail-Closed), phân quyền truy cập 4 cấp (RBAC), mã hóa thông tin xác thực và ghi vết nhật ký kiểm toán (Audit Logs) cho các thao tác quan trọng.

---

### 3. Phạm vi đề tài

#### 3.1. Phạm vi nghiệp vụ và đối tượng áp dụng
- Phạm vi nghiệp vụ: Quản lý cơ cấu tổ chức và phòng ban hai cấp; quản lý hồ sơ nhân viên và hợp đồng lao động; ghi nhận chấm công đa phương thức (Kiosk khuôn mặt, GPS, mã QR); quy trình phê duyệt đơn từ hai cấp (Quản lý trực tiếp đến Trưởng phòng Nhân sự); tính toán và chốt sổ bảng lương định kỳ; giải đáp thông tin nhân sự tự động; dự báo nguy cơ thôi việc.
- Đối tượng tính lương: Cá nhân cư trú có hợp đồng lao động từ 3 tháng trở lên tại Việt Nam theo Bộ luật Lao động 2019, Luật Thuế Thu nhập cá nhân mới và các văn bản hướng dẫn thi hành năm 2026.
- Giới hạn nghiệp vụ: Đề tài chưa xử lý các trường hợp tính thuế đối với cá nhân không cư trú hoặc hợp đồng thử việc dưới 3 tháng áp dụng khấu trừ 10%.

#### 3.2. Phạm vi kỹ thuật và môi trường triển khai
- Thiết bị Kiosk: Chạy trên trình duyệt web tiêu chuẩn hỗ trợ WebRTC và WebAssembly, sử dụng camera độ phân giải HD 720p thông dụng, không cần cảm biến chiều sâu chuyên dụng.
- Dữ liệu thực nghiệm: Đánh giá hệ thống trên bộ dữ liệu kiểm thử gồm 50 nhân sự thuộc 6 phòng ban với các tình huống công và đơn từ thực tế.
- Bảo mật thông tin: Vector khuôn mặt được mã hóa và lưu tách rời thông tin định danh người dùng. Hệ thống không lưu trữ ảnh gốc, tuân thủ quy định của Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.

---

### 4. Giải pháp công nghệ

Hệ thống PeopleInsight AI được xây dựng dựa trên các công nghệ chủ đạo:
- Giao diện người dùng (Frontend): Sử dụng thư viện ReactJS cùng ngôn ngữ TypeScript và công cụ đóng gói Vite. Giao diện được thiết kế tương thích đa thiết bị, gồm màn hình Kiosk chấm công, trang quản trị của cán bộ nhân sự và trang tự phục vụ cho nhân viên.
- Máy chủ dịch vụ (Backend): Sử dụng Node.js cùng khung ứng dụng Express 5 theo mô hình phân tầng Controller, Service và Model. Tích hợp cơ chế cô lập dữ liệu đa công ty qua `AsyncLocalStorage` và middleware kiểm soát quyền truy cập RBAC.
- Cơ sở dữ liệu: Hệ quản trị NoSQL MongoDB và thư viện Mongoose ODM với cấu trúc 11 collections, sử dụng các thao tác cập nhật nguyên tử để bảo đảm toàn vẹn dữ liệu.
- Thị giác máy tính và Trí tuệ nhân tạo:
  + Thư viện Google MediaPipe Face Landmarker trích xuất 468 điểm mốc không gian và 52 blendshapes để kiểm tra độ sống khuôn mặt.
  + Mạng nơ-ron MobileNet Backbone trích xuất vector đặc trưng 128 chiều, so khớp danh tính nội bộ bằng khoảng cách Euclid và Cosine.
  + Mô hình Google Gemini xử lý ngôn ngữ tự nhiên thông qua cơ chế Function Calling an toàn dữ liệu.
  + Thư viện Scikit-learn xây dựng mô hình phân loại dự báo thôi việc (Logistic Regression, Random Forest) trên 6 biến định lượng từ tập dữ liệu IBM HR Attrition.

---

### 5. Bố cục của đồ án

Báo cáo tốt nghiệp gồm phần mở đầu, kết luận và 4 chương nội dung chính theo quy định của Khoa Công nghệ Thông tin và Chuyển đổi số, Trường Đại học Nguyễn Trãi:
- Phần Mở đầu: Trình bày lý do chọn đề tài, mục tiêu, phạm vi nghiên cứu, giải pháp công nghệ và cấu trúc báo cáo.
- Chương 1. Tổng quan đề tài và nền tảng công nghệ: Trình bày tổng quan nghiệp vụ quản trị nhân sự, các khó khăn trong phương thức quản lý truyền thống, xu hướng ứng dụng công nghệ, phân tích cơ sở lý thuyết của các công nghệ sử dụng trong hệ thống.
- Chương 2. Khảo sát và phân tích hệ thống: Khảo sát hiện trạng, phân tích yêu cầu chức năng và phi chức năng, xác định các tác nhân, xây dựng biểu đồ Use Case, biểu đồ tuần tự và biểu đồ hoạt động cho các quy trình nghiệp vụ cốt lõi.
- Chương 3. Thiết kế hệ thống và cơ sở dữ liệu: Thiết kế kiến trúc tổng thể, thiết kế giao diện người dùng, sơ đồ lớp chi tiết và cấu trúc cơ sở dữ liệu 11 collections trên MongoDB.
- Chương 4. Xây dựng ứng dụng và kết quả thực nghiệm: Trình bày môi trường triển khai, quy trình cài đặt các phân hệ chính và kết quả đánh giá thực nghiệm (độ chính xác nhận diện khuôn mặt, kiểm thử tính lương, độ trễ phản hồi trợ lý ảo và đánh giá tải hệ thống).
- Kết luận và hướng phát triển: Tổng kết các kết quả đạt được, chỉ ra những điểm còn hạn chế và hướng mở rộng nghiên cứu tiếp theo.
