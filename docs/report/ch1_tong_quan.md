# CHƯƠNG 1: TỔNG QUAN VÀ CƠ SỞ THỰC TIỄN

---

## 1.1. BỐI CẢNH NGHIÊN CỨU VÀ THỰC TRẠNG QUẢN TRỊ NHÂN SỰ

### 1.1.1. Xu hướng chuyển đổi số trong Quản trị Nguồn nhân lực (HRM)
Trong kỷ nguyên cách mạng công nghiệp lần thứ tư, quản trị nguồn nhân lực (Human Resource Management - HRM) không còn đơn thuần là công tác hành chính giấy tờ, theo dõi chấm công và chi trả lương cuối tháng. HRM đã chuyển mình trở thành một bộ phận chiến lược, trực tiếp quyết định đến năng lực cạnh tranh, sự gắn kết nội bộ và tối ưu hóa chi phí vận hành của doanh nghiệp.

Theo các khảo sát quốc tế và trong nước về chuyển đổi số nhân sự, các doanh nghiệp đang đối mặt với những thách thức mang tính hệ thống khi vận hành các quy trình thủ công hoặc sử dụng các phần mềm rời rạc, chắp vá:
1. **Điểm nghẽn trong công tác chấm công truyền thống:** Các phương pháp ghi nhận thời gian làm việc cổ điển (thẻ từ RFID, dấu vân tay cơ học) bộc lộ nhiều điểm yếu cố hữu:
   - Hiện tượng chấm công hộ (Buddy Punching) diễn ra phổ biến với thẻ từ.
   - Đầu đọc vân tay quang học thường xuyên gặp lỗi nhận diện khi tay dính bụi bẩn, ướt, mòn vân tay; đặc biệt tiềm ẩn nguy cơ lây nhiễm vi khuẩn tại các điểm tập trung đông người vào đầu giờ làm việc.
   - Thiết bị máy chấm công vật lý thường tách biệt với hệ thống phần mềm quản trị, dẫn tới việc nhân viên C&B (Compensation & Benefits) phải định kỳ trích xuất dữ liệu qua USB hoặc mạng LAN nội bộ, mất từ 2 đến 3 ngày mỗi cuối tháng để đối soát, làm sạch và xử lý các trường hợp quên quẹt thẻ.
2. **Nhu cầu sinh trắc học không tiếp xúc (Contactless Biometrics) và nguy cơ giả mạo 2D:**
   - Việc chuyển dịch sang công nghệ nhận diện khuôn mặt (FaceID) là xu thế tất yếu nhờ tính tiện lợi và tốc độ xử lý nhanh. Tuy nhiên, phần lớn các giải pháp giá rẻ trên thị trường hiện nay chỉ so khớp hình ảnh khuôn mặt tĩnh mà **không tích hợp cơ chế kiểm tra thực thể sống (Liveness Detection)**. 
   - Điều này tạo ra lỗ hổng bảo mật nghiêm trọng: nhân viên có thể sử dụng ảnh in màu trên giấy A4, ảnh hiển thị trên màn hình điện thoại hoặc video ghi hình sẵn (Presentation Attacks) để qua mặt hệ thống chấm công một cách dễ dàng.
3. **Sự dịch chuyển của Pháp lý Lao động và Thuế Thu nhập cá nhân năm 2026 tại Việt Nam:**
   - Năm 2026 đánh dấu bước ngoặt lớn trong hệ thống pháp luật lao động và tài chính của Việt Nam với việc ban hành và thực thi **Luật Thuế Thu nhập cá nhân mới** và các Nghị định hướng dẫn thi hành (Nghị định 253/2026/NĐ-CP, Nghị định 161/2026/NĐ-CP).
   - Biểu thuế lũy tiến từng phần được tinh gọn từ 7 bậc xuống **5 bậc mới** với các ngưỡng thu nhập tính thuế cách biệt (10 triệu, 30 triệu, 60 triệu, 100 triệu đồng).
   - Mức giảm trừ gia cảnh được nâng mạnh lên **15.500.000 đồng/tháng** đối với người nộp thuế và **6.200.000 đồng/tháng** đối với mỗi người phụ thuộc.
   - Đặc biệt, trong năm 2026 xuất hiện **hai mốc chuyển tiếp chính sách (Dual-phase Policy)**:
     - *Giai đoạn 1 (01/01/2026 – 30/06/2026):* Trần đóng BHXH/BHYT là 46.800.000 đồng; trần tiền ăn ca miễn thuế TNCN là 730.000 đồng/tháng.
     - *Giai đoạn 2 (từ 01/07/2026 trở đi):* Trần đóng BHXH/BHYT được điều chỉnh lên 50.600.000 đồng; trần tiền ăn ca miễn thuế nâng lên 1.200.000 đồng/tháng.
   - Bên cạnh đó, các quy định khắt khe về trần làm thêm giờ (không quá 4 giờ/ngày, 40 giờ/tháng, 200 giờ/năm), phụ cấp làm việc ban đêm (tối thiểu 30%) và làm thêm giờ ban đêm (hệ số 210%, 270%, 390%) khiến việc tính lương bằng các bảng tính Excel truyền thống trở nên vô cùng phức tạp, dễ xảy ra sai sót số liệu và tiềm ẩn rủi ro tranh chấp lao động hoặc xử phạt thuế.
4. **Bảo mật dữ liệu cá nhân nhạy cảm trong làn sóng ứng dụng AI:**
   - Ngày 01/01/2026, **Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15** chính thức có hiệu lực với chế tài nghiêm ngặt. Dữ liệu khuôn mặt (vector sinh trắc học) và dữ liệu tiền lương, thuế được xếp vào nhóm "Dữ liệu cá nhân nhạy cảm".
   - Việc các doanh nghiệp tích hợp các mô hình ngôn ngữ lớn (Large Language Models - LLM) như OpenAI GPT hay Google Gemini để xây dựng chatbot hỗ trợ nội bộ thường tiềm ẩn rủi ro rò rỉ dữ liệu (Data Leakage): nếu hệ thống gửi thẳng thông tin tài chính, lương bổng và định danh nhân viên lên máy chủ LLM công cộng thông qua câu phản hồi `functionResponse`, doanh nghiệp sẽ trực tiếp vi phạm quy định về bảo vệ dữ liệu và bảo mật thông tin nội bộ.
5. **Vấn đề chảy máu chất xám và tỷ lệ thôi việc (Attrition Rate):**
   - Chi phí để tuyển dụng và đào tạo một nhân sự mới thường cao gấp 1,5 đến 2 lần thu nhập năm của nhân sự đó. Tuy nhiên, các nhà quản lý thường chỉ nắm bắt được ý định nghỉ việc khi nhân viên đã nộp đơn xin thôi việc. Việc thiếu các mô hình phân tích dữ liệu lớn và học máy (Machine Learning) để cảnh báo sớm nguy cơ thôi việc khiến doanh nghiệp luôn ở thế bị động. Đồng thời, việc ứng dụng ML trong nhân sự cần đảm bảo đạo đức AI, loại bỏ tuyệt đối các thiên kiến xã hội (về giới tính, tuổi tác, tình trạng hôn nhân).

---

## 1.2. MỤC TIÊU NGHIÊN CỨU, ĐỐI TƯỢNG VÀ PHẠM VI ĐỀ TÀI

### 1.2.1. Mục tiêu tổng quát
Xây dựng một hệ thống phần mềm quản trị nhân sự và chấm công thông minh toàn diện mang tên **PeopleInsight AI**, kết hợp chặt chẽ giữa kiến trúc Web hiện đại, công nghệ sinh trắc học khuôn mặt chống giả mạo 2 tầng trên thiết bị Kiosk, động cơ tính lương tự động tuân thủ chuẩn mực pháp lý Việt Nam năm 2026, trợ lý ảo HR AI an toàn dữ liệu nhạy cảm và mô hình học máy cảnh báo nguy cơ thôi việc khách quan.

### 1.2.2. Mục tiêu cụ thể
Để đạt được mục tiêu tổng quát, đề tài xác định 5 mục tiêu kỹ thuật cụ thể:
1. **Xây dựng Kiosk Chấm công Sinh trắc học 2 tầng (Two-tier Biometric Kiosk):**
   - *Tầng 1 (Liveness Detection):* Triển khai mô hình phát hiện khuôn mặt và 68 điểm mốc hình học (Landmarks) cục bộ trên trình duyệt Web client, tính toán các chỉ số hình học EAR (Eye Aspect Ratio), MAR (Mouth Aspect Ratio) và ma trận góc quay đầu (Pitch/Yaw) để kiểm tra các hành động chớp mắt, há miệng theo thử thách ngẫu nhiên từ Server, ngăn chặn 100% các cuộc tấn công giả mạo bằng ảnh in 2D hoặc video phát lại.
   - *Tầng 2 (Feature Embedding & Matching):* Trích xuất vector đặc trưng khuôn mặt 128 chiều (`Float32Array(128)`), tiến hành so khớp danh tính bằng khoảng cách Euclid ($d_E \le 0.60$) và Cosine ($d_C \le 0.35$). Đảm bảo toàn bộ mô hình và weights chạy offline 100% trên client/server nội bộ với giấy phép mã nguồn mở hợp pháp (MIT / Apache 2.0).
2. **Hiện thực hóa Động cơ Tính lương (Payroll Engine) chuẩn Pháp lý 2026:**
   - Chuẩn hóa công thức tính lương 3 bước: Tổng thu nhập (Gross) $\rightarrow$ Thu nhập chịu thuế $\rightarrow$ Thu nhập tính thuế $\rightarrow$ Lương thực nhận (Net).
   - Tự động áp dụng linh hoạt 2 mốc chính sách trước và sau ngày 01/07/2026 (trần BHXH 46.8M / 50.6M; trần ăn ca 730k / 1.2M; trần BHTN 20 lần lương tối thiểu vùng I: 106.2M).
   - Áp dụng biểu thuế lũy tiến 5 bậc mới (5%, 10%, 20%, 30%, 35%) và kiểm thử đạt độ khớp 100% trên bộ 22 trường hợp thực nghiệm (Test Cases) đối chiếu trực tiếp với bảng tính Excel chuẩn mực.
   - Thiết lập cơ chế khóa kỳ lương nguyên tử (`periodLockedAt`) lưu trữ snapshot tham số chính sách tại thời điểm chốt sổ, ngăn chặn việc sửa đổi dữ liệu quá khứ.
3. **Phát triển Trợ lý ảo HR Chatbot AI theo Phương án A (Template Rendering):**
   - Ứng dụng SDK `@google/genai` với mô hình Gemini thế hệ mới (`gemini-3-flash-preview`), khai thác cơ chế Function Calling với 4 công cụ P0 cốt lõi (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`).
   - Thực thi nghiêm ngặt **Phương án A**: Dừng luồng xử lý của LLM ngay sau khi nhận được `functionCall`, Backend tự thực hiện thẩm định RBAC/IDOR, tự truy vấn CSDL nội bộ và render kết quả vào Markdown template tĩnh để trả về cho người dùng. **Tuyệt đối không gửi dữ liệu lương, số dư bảo hiểm hoặc định danh người dùng ngược lại cho Gemini**.
4. **Xây dựng Mô hình Machine Learning Dự báo thôi việc (Retention Predictor):**
   - Huấn luyện trên tập dữ liệu chuẩn mực IBM HR Attrition, chỉ chắt lọc đúng **6 đặc trưng định lượng khách quan**: `OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
   - **Loại bỏ hoàn toàn các biến nhạy cảm** (`Gender`, `Age`, `MaritalStatus`) và các câu hỏi khảo sát sự hài lòng mang tính chủ quan để đảm bảo nguyên tắc đạo đức AI và bình đẳng lao động.
   - Đánh giá so sánh giữa Baseline Luật, Logistic Regression và Random Forest trên đường cong ROC và chỉ số AUC.
5. **Thiết kế Kiến trúc Cơ sở dữ liệu Tinh gọn và Bảo mật Đa tầng:**
   - Đóng băng mô hình dữ liệu MongoDB đúng **11 Collections** (9 P0 + 2 P1), loại bỏ hoàn toàn các bảng lẻ tẻ gây phân mảnh dữ liệu.
   - Phân quyền RBAC 4 cấp (`CEO`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`), mã hóa mật khẩu bằng bcrypt, ẩn hoàn toàn trường `passwordHash` (`select: false`), chống rò rỉ dữ liệu qua phép kết nối `$lookup`.
   - Thiết lập quy trình duyệt đơn từ 2 cấp cố định (Manager $\rightarrow$ HR Manager) với các thao tác cập nhật nguyên tử `$push`/`$pull`/`$inc`, ngăn ngừa triệt để lỗi tranh chấp dữ liệu (Race Condition).

### 1.2.3. Đối tượng nghiên cứu
- **Đối tượng khoa học:**
  - Kỹ thuật thị giác máy tính phát hiện khuôn mặt, trích xuất điểm mốc và kiểm tra thực thể sống dựa trên cử động mắt, miệng và góc xoay đầu.
  - Giải thuật so khớp vector đặc trưng trong không gian Euclidean 128 chiều.
  - Kỹ thuật điều hướng gọi hàm (Function Calling) trên mô hình ngôn ngữ lớn và giải pháp bảo vệ dữ liệu nhạy cảm bằng Template Rendering.
  - Các thuật toán học máy phân loại nhị phân trong bài toán dự báo biến động nhân sự.
  - Các quy chuẩn toán học và thuật toán tài chính trong tính toán thuế thu nhập cá nhân lũy tiến và bảo hiểm bắt buộc theo luật định.
- **Đối tượng ứng dụng:**
  - Quy trình quản lý hồ sơ nhân sự, phân cấp phòng ban, theo dõi chấm công đa phương thức (FaceID, GPS Geofencing, Dynamic QR), quy trình nộp và phê duyệt đơn từ (nghỉ phép, làm thêm giờ, làm việc từ xa, giải trình công) và công tác tính lương tại các doanh nghiệp vừa và nhỏ (SMEs).

### 1.2.4. Phạm vi và Giới hạn đề tài
- **Phạm vi nghiệp vụ & Pháp lý:**
  - Đối tượng áp dụng tính lương là cá nhân cư trú ký hợp đồng lao động có thời hạn từ 3 tháng trở lên tại Việt Nam.
  - Hệ thống áp dụng quy chuẩn pháp lý có hiệu lực từ ngày 01/01/2026 theo Bộ luật Lao động 2019, Luật Thuế TNCN mới và các văn bản hướng dẫn thi hành.
  - Không bao gồm các nghiệp vụ chuyên biệt của lao động người nước ngoài không cư trú hoặc hợp đồng cộng tác viên dịch vụ dưới 3 tháng (áp dụng khấu trừ cố định 10%).
- **Phạm vi kỹ thuật & Hạ tầng:**
  - Module chấm công khuôn mặt hoạt động trên nền tảng Web thông qua trình duyệt tiêu chuẩn (Chrome, Edge, Safari), sử dụng webcam thông thường với độ phân giải 720p trở lên, không yêu cầu thiết bị phần cứng cảm biến chiều sâu chuyên dụng (IR / ToF).
  - Dữ liệu thử nghiệm hệ thống được giả lập với quy mô 50 nhân viên bao gồm đầy đủ cấu trúc phòng ban 2 cấp, đa dạng hợp đồng, thâm niên và các trường hợp chấm công thực tế.
  - Việc thu thập và xử lý vector sinh trắc học tuân thủ triệt để Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15: chỉ lưu vector số thực 128-D trong collection độc lập, không lưu trữ ảnh khuôn mặt gốc và xóa vĩnh viễn dữ liệu khi nhân viên rút lại sự đồng ý.

---

## 1.3. PHƯƠNG PHÁP NGHIÊN CỨU VÀ QUY TRÌNH TRIỂN KHAI

### 1.3.1. Phương pháp nghiên cứu
Đề tài kết hợp giữa các phương pháp nghiên cứu lý thuyết và thực nghiệm kỹ thuật:
1. **Phương pháp phân tích - tổng hợp tài liệu:** Nghiên cứu kỹ lưỡng các văn bản quy phạm pháp luật gốc (Luật 109/2025/QH15, Nghị định 253/2026/NĐ-CP, Nghị định 161/2026/NĐ-CP, Điều 98 BLLĐ và Nghị định 145/2020/NĐ-CP) nhằm xây dựng bảng tham số và đặc tả yêu cầu nghiệp vụ chính xác tuyệt đối.
2. **Phương pháp thực nghiệm kỹ thuật (Spike & Prototyping):** Tiến hành Spike kỹ thuật độc lập để lựa chọn mô hình nhận diện khuôn mặt phù hợp, đo đạc ngưỡng tách biệt Euclid/Cosine, kiểm tra giấy phép mã nguồn và kiểm thử khả năng gọi Tool của Gemini 3.x trước khi tiến hành xây dựng hệ thống chính thức.
3. **Phương pháp kiểm thử đối chiếu (Comparative Testing):** Xây dựng bộ 22 test cases tính lương để đối chiếu kết quả từng đồng lẻ giữa động cơ tính toán của hệ thống và bảng tính Excel kế toán chuẩn mực.
4. **Phương pháp khảo sát đánh giá người dùng (UAT):** Ứng dụng thang đo chuẩn quốc tế SUS (System Usability Scale) trên nhóm người dùng mẫu (HR, Quản lý, Nhân viên) với mục tiêu đạt điểm đánh giá $SUS \ge 75$.

### 1.3.2. Quy trình triển khai đồ án (Lộ trình 10 tuần đóng băng)
Đề tài được tổ chức thực hiện nghiêm ngặt theo lộ trình đóng băng **v6.1 FINAL FREEZE** từ Tuần 0 đến Tuần 9:
- **Tuần 0 (13/10 – 15/10/2026):** Spike kỹ thuật FaceID & Gemini, khởi tạo Monorepo, nạp CSDL seed 50 nhân viên.
- **Tuần 1 (16/10 – 22/10/2026):** Xác thực JWT, Cookie HttpOnly, RBAC 4 cấp, quản lý hồ sơ nhân viên, triển khai hạ tầng.
- **Tuần 2 (23/10 – 29/10/2026):** Kiosk FaceID Liveness 2 tầng, GPS Geofencing, Dynamic QR 30s.
- **Tuần 3 (30/10 – 05/11/2026):** Đơn từ duyệt 2 cấp, Socket.io thông báo, thực nghiệm FaceID đợt 1.
- **Tuần 4 (06/11 – 12/11/2026):** Payroll Engine phần 1 (BHXH, biểu thuế 5 bậc mới, đối chiếu 8-10 cases).
- **Tuần 5 (13/11 – 19/11/2026):** Payroll Engine phần 2 (OT, làm đêm, tiền ăn ca, hoàn tất 22/22 cases Excel, đóng băng Payroll).
- **Tuần 6 (20/11 – 26/11/2026):** HR Chatbot AI Phương án A, bộ 130 prompts kiểm thử, hệ thống cảnh báo HR.
- **Tuần 7 (27/11 – 03/12/2026):** Mô hình ML IBM Attrition 6 đặc trưng, Dashboard quản trị, FEATURE FREEZE.
- **Tuần 8 (04/12 – 10/12/2026):** Tải k6, kiểm tra an toàn OWASP ZAP, đánh giá UAT SUS $\ge 75$.
- **Tuần 9 (11/12 – 15/12/2026):** Hoàn thiện báo cáo, diễn tập demo, đóng gói sản phẩm tốt nghiệp.

---

## 1.4. ĐÓNG GÓP KHOA HỌC VÀ BỐ CỤC BÁO CÁO

### 1.4.1. Đóng góp chính của đề tài
1. **Về mặt công nghệ:** Đề xuất và hiện thực hóa thành công kiến trúc Kiosk FaceID 2 tầng hoàn toàn trên trình duyệt Web client với chi phí phần cứng tối thiểu, kết hợp kiểm tra Liveness bằng hành vi tương tác ngẫu nhiên và trích xuất vector 128D offline đạt độ trễ thấp ($\sim 42.8$ ms) và tỷ lệ chặn giả mạo 100%.
2. **Về mặt an toàn thông tin & bảo vệ dữ liệu:** Đề xuất và chứng minh tính ưu việt của **Phương án A (Template Rendering)** trong ứng dụng GenAI cho doanh nghiệp: tận dụng khả năng hiểu ngôn ngữ tự nhiên và trích xuất tham số của LLM nhưng tuyệt đối bảo vệ dữ liệu nhạy cảm nội bộ không bị rò rỉ ra bên ngoài.
3. **Về mặt nghiệp vụ & pháp lý:** Hiện thực hóa một trong những công cụ tính lương nguồn mở đầu tiên tại Việt Nam đáp ứng đầy đủ và chuẩn xác các chính sách pháp lý lao động, bảo hiểm và thuế TNCN có hiệu lực trong năm 2026 với 2 mốc chuyển tiếp và biểu thuế 5 bậc mới.
4. **Về mặt ứng dụng AI có trách nhiệm:** Xây dựng mô hình dự báo thôi việc minh bạch, công bằng dựa trên 6 đặc trưng định lượng thuần túy, nói không với định kiến giới tính và xã hội.

### 1.4.2. Bố cục của Báo cáo Đồ án tốt nghiệp
Báo cáo gồm 5 chương chính:
- **Chương 1: Tổng quan và Cơ sở thực tiễn** (Trình bày bối cảnh, thực trạng, mục tiêu, đối tượng, phạm vi và phương pháp nghiên cứu).
- **Chương 2: Cơ sở lý thuyết và Căn cứ pháp lý** (Trình bày cơ sở nghiệp vụ HRM, căn cứ pháp lý tiền lương - thuế 2026, lý thuyết nhận diện khuôn mặt sinh trắc học, cơ chế LLM Function Calling, học máy và Luật BVDLCN).
- **Chương 3: Phân tích yêu cầu và Thiết kế hệ thống** (Đặc tả yêu cầu chức năng, phi chức năng, Threat Model, kiến trúc tổng thể, thiết kế Kiosk FaceID, mô hình CSDL 11 collections và thiết kế API).
- **Chương 4: Hiện thực hóa và Đánh giá thực nghiệm** (Trình bày chi tiết việc cài đặt các phân hệ, kết quả kiểm thử 22 cases Payroll, thực nghiệm Kiosk FaceID, đánh giá 130 prompts Chatbot, huấn luyện mô hình ML, kiểm thử tải k6 và UAT).
- **Chương 5: Kết luận, Hạn chế và Hướng phát triển** (Tổng kết các đóng góp, phân tích thẳng thắn các hạn chế kỹ thuật hiện tại và đề xuất hướng nghiên cứu mở rộng trong tương lai).
