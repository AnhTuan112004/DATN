import re

ch2_path = r'c:\K23CNT1\DANT\DATN\docs\report\ch2_khao_sat_va_phan_tich.md'

with open(ch2_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Table 2.1
old_table_2_1 = re.search(r'### Bảng 2\.1\. Một số chức năng chính của hệ thống PeopleInsight AI\s*\n\n\|.*?\n(?=---|\n### 2\.1\.2)', content, re.DOTALL)

new_table_2_1 = """### Bảng 2.1. Một số chức năng chính của hệ thống PeopleInsight AI

| Yêu cầu chức năng | Mô tả |
| :--- | :--- |
| **Đăng ký và xác thực tài khoản** | Nhân viên và quản trị viên đăng nhập hệ thống an toàn bằng email và mật khẩu; hệ thống cấp mã phiên làm việc bảo mật (JWT Token) với cơ chế tự động gia hạn phiên an toàn, bảo vệ tài khoản khi người dùng mở nhiều tab làm việc đồng thời và tự động thu hồi phiên đăng nhập khi phát hiện dấu hiệu bất thường. |
| **Quản trị phân quyền 4 cấp** | Thiết lập ma trận phân quyền theo vai trò rõ ràng gồm 4 cấp: Ban Giám đốc (`CEO`), Trưởng phòng Nhân sự (`HR_MANAGER`), Trưởng bộ phận (`MANAGER`) và Nhân viên (`EMPLOYEE`); kiểm soát quyền truy cập chặt chẽ, bảo vệ thông tin nhạy cảm, tuyệt đối không cho phép cấp quản lý xem mức lương và thông tin thu nhập của nhân viên dưới quyền. |
| **Quản lý sơ đồ phòng ban 2 cấp** | Xây dựng sơ đồ cơ cấu tổ chức doanh nghiệp phân cấp 2 tầng (Khối chức năng → Phòng ban trực thuộc); gán người phụ trách quản lý, theo dõi số lượng nhân sự trực thuộc và kiểm soát an toàn dữ liệu khi luân chuyển hoặc tinh gọn phòng ban. |
| **Quản lý hồ sơ nhân sự và hợp đồng** | Quản lý thông tin lý lịch nhân sự, tự động cấp mã nhân viên theo quy chuẩn `NVxxxx`; theo dõi các loại hợp đồng lao động (thử việc, có thời hạn và không xác định thời hạn) theo Bộ luật Lao động 2019; hệ thống tự động quét và gửi thông báo nhắc nhở khi hợp đồng sắp đến hạn (trước 30 ngày và 60 ngày). |
| **Điểm danh khuôn mặt Kiosk FaceID** | Nhận diện khuôn mặt thông minh 2 lớp tại máy Kiosk văn phòng: Lớp 1 kiểm tra người thật (độ sống) thông qua các chuyển động tự nhiên như chớp mắt, quay đầu theo chỉ dẫn ngẫu nhiên trên màn hình nhằm chống gian lận bằng ảnh in hoặc video phát lại; Lớp 2 trích xuất đặc trưng sinh trắc học và đối chiếu với dữ liệu nhân sự để ghi nhận giờ đến làm việc. |
| **Chấm công di động GPS & QR động** | Hỗ trợ nhân viên chấm công linh hoạt qua điện thoại thông minh khi ở trong phạm vi văn phòng công ty (định vị vị trí GPS bán kính cho phép); hoặc điểm danh bằng mã QR động được làm mới tự động mỗi 30 giây trên màn hình văn phòng, ngăn chặn triệt để hành vi chụp ảnh màn hình gửi cho đồng nghiệp chấm công hộ. |
| **Quản lý và phê duyệt đơn từ 2 cấp** | Số hóa quy trình nộp và xử lý 5 loại đơn công tác (nghỉ phép năm, nghỉ ốm, làm thêm giờ, làm việc từ xa, giải trình quên chấm công); áp dụng quy trình duyệt 2 cấp độc lập: Trưởng bộ phận duyệt kế hoạch → Trưởng phòng Nhân sự phê duyệt hoàn tất, hệ thống tự động trừ ngày phép vào quỹ phép cá nhân một cách chính xác. |
| **Động cơ tính lương tự động 2026** | Tự động hóa quy trình tính lương 3 bước: Tổng thu nhập (Gross) → Thu nhập chịu thuế → Thu nhập tính thuế & Thực nhận (Net); cập nhật Biểu thuế TNCN lũy tiến 5 bậc mới theo Luật Thuế TNCN số 109/2025/QH15; xử lý chính xác các mức trần bảo hiểm xã hội và tiền ăn ca theo quy định mới năm 2026; miễn thuế thu nhập đối với tiền làm thêm giờ theo luật; hỗ trợ khóa sổ kỳ lương để cố định số liệu tài chính lịch sử. |
| **Trợ lý ảo HR AI tra cứu tự phục vụ** | Trợ lý ảo hỗ trợ nhân viên tra cứu nhanh chóng số dư ngày phép, phiếu lương, lịch sử chấm công bằng câu hỏi tiếng Việt tự nhiên; áp dụng cơ chế an toàn thông tin nội bộ khép kín (Phương án A), tự động tra cứu dữ liệu trong hệ thống và trình bày kết quả thành bảng biểu trực quan mà không gửi thông tin tài chính ra dịch vụ trí tuệ nhân tạo bên ngoài. |
| **Dự báo nguy cơ thôi việc Machine Learning** | Phân tích tự động các chỉ số làm việc khách quan (giờ làm thêm, thu nhập, thâm niên làm việc, khoảng cách đi làm) bằng mô hình học máy; phân loại nhân viên theo 3 mức độ rủi ro (Thấp, Trung bình, Cao); chỉ ra các nhóm nguyên nhân chính trên biểu đồ trực quan giúp phòng nhân sự chủ động có biện pháp đối thoại, đãi ngộ và giữ chân nhân tài. |
| **Cổng thông tin tuyển dụng & Nộp CV (AI ATS)** | Cung cấp cổng thông tin doanh nghiệp (Landing Page) cho phép ứng viên bên ngoài tra cứu danh sách việc làm đang mở, nộp hồ sơ xin việc trực tuyến và tải tệp CV; hệ thống trí tuệ nhân tạo tự động phân tích hồ sơ, đánh giá độ phù hợp của kỹ năng giúp bộ phận nhân sự sàng lọc ứng viên nhanh chóng. |
"""

if old_table_2_1:
    content = content[:old_table_2_1.start()] + new_table_2_1 + content[old_table_2_1.end():]
    print("Updated Table 2.1 successfully")

# 2. Update Table 2.2
old_table_2_2 = re.search(r'### Bảng 2\.2\. Yêu cầu phi chức năng của hệ thống PeopleInsight AI\s*\n\n\|.*?\n(?=---|\n### 2\.1\.3)', content, re.DOTALL)

new_table_2_2 = """### Bảng 2.2. Yêu cầu phi chức năng của hệ thống PeopleInsight AI

| Yêu cầu | Mô tả chi tiết |
| :--- | :--- |
| **Hiệu suất (Performance)** | - Tốc độ nhận diện khuôn mặt và kiểm tra người thật tại máy Kiosk đạt ≥ 45 khung hình/giây (FPS), độ trễ xử lý cực nhanh dưới 50 ms/khung hình.<br>- Thời gian phản hồi trung bình của toàn bộ các chức năng hệ thống đạt dưới 380 ms dưới áp lực kiểm thử 100 người dùng truy cập đồng thời.<br>- Động cơ tính lương tự động xử lý toàn bộ 50 nhân viên trong thời gian dưới 100 ms, bảo đảm tính toán tức thì, không gây nghẽn hệ thống. |
| **Bảo mật (Security)** | - Mật khẩu người dùng được mã hóa băm một chiều an toàn bằng thuật toán tiêu chuẩn cao.<br>- Bảo vệ phiên làm việc qua cơ chế tự động xoay vòng mã truy cập, tự động dọn dẹp các phiên làm việc hết hạn và chống đăng xuất ngoài ý muốn khi mở nhiều tab.<br>- Cô lập dữ liệu đa doanh nghiệp tuyệt đối tại tầng xử lý hệ thống, ngăn chặn triệt để hành vi can thiệp trái phép vào dữ liệu công ty khác hoặc xem thông tin người khác.<br>- Dữ liệu sinh trắc học khuôn mặt được mã hóa bảo vệ tại tầng ứng dụng, tuyệt đối không lưu trữ ảnh khuôn mặt thô của nhân viên theo Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. |
| **Tương thích (Compatibility)** | - Giao diện hoạt động mượt mà trên tất cả các trình duyệt web hiện đại phổ biến (Google Chrome, Microsoft Edge, Apple Safari, Mozilla Firefox).<br>- Hỗ trợ cài đặt và sử dụng thuận tiện dưới dạng ứng dụng trên điện thoại thông minh chạy hệ điều hành Android và iOS.<br>- Tương thích hoàn chỉnh với camera của máy tính, điện thoại và thiết bị Kiosk chuyên dụng phục vụ điểm danh thời gian thực. |
| **Dễ sử dụng (Usability)** | - Giao diện người dùng được thiết kế khoa học, hiện đại, màu sắc trang nhã, bố cục rõ ràng theo chuẩn trải nghiệm ứng dụng doanh nghiệp.<br>- Đạt điểm số Thang đo Khả dụng Hệ thống rất cao **SUS = 82.50 / 100 điểm** (Xếp hạng A — Xuất sắc) trong khảo sát người dùng thực tế.<br>- Khung chat Trợ lý ảo tích hợp các nút câu hỏi gợi ý nhanh tiện lợi, giúp nhân viên tra cứu 1-chạm mà không cần nhớ cú pháp. |
| **Khả năng mở rộng (Scalability)** | - Kiến trúc hệ thống phi trạng thái, cho phép dễ dàng nâng cấp mở rộng quy mô phục vụ doanh nghiệp từ vài chục đến hàng nghìn nhân sự.<br>- Cơ sở dữ liệu chuẩn hóa đúng 11 bảng danh mục rõ ràng, chỉ mục tìm kiếm tối ưu, tốc độ truy vấn nhanh và ổn định.<br>- Đóng gói hoàn chỉnh hỗ trợ triển khai nhanh chóng trên các nền tảng máy chủ đám mây. |
"""

if old_table_2_2:
    content = content[:old_table_2_2.start()] + new_table_2_2 + content[old_table_2_2.end():]
    print("Updated Table 2.2 successfully")

# 3. Update Section 2.1.4 (Quy trình nghiệp vụ)
old_sec_2_1_4 = re.search(r'### 2\.1\.4 Quy trình nghiệp vụ trong hệ thống\s*\n\n.*?(?=---|\n### 2\.1\.5)', content, re.DOTALL)

new_sec_2_1_4 = """### 2.1.4 Quy trình nghiệp vụ trong hệ thống

Phần này giới thiệu chi tiết 5 quy trình nghiệp vụ cốt lõi của hệ thống, các đối tượng tham gia và mục tiêu thực hiện:

1. **Quy trình điểm danh nhận diện khuôn mặt Kiosk FaceID 2 lớp:**
   - *Đối tượng tham gia:* Nhân viên (`EMPLOYEE`), Thiết bị Kiosk (`Kiosk Device`), Máy chủ hệ thống.
   - *Mục đích thực hiện:* Ghi nhận ngày công chính xác, ngăn chặn triệt để hành vi chấm công hộ và chống các hình thức giả mạo bằng ảnh in hoặc video quay sẵn theo tiêu chuẩn quốc tế ISO/IEC 30107-3.
   - *Hoạt động nghiệp vụ:* Nhân viên bước vào khu vực điểm danh trước camera Kiosk → Hệ thống phát hiện khuôn mặt và đưa ra chỉ dẫn hành động ngẫu nhiên (chớp mắt hoặc quay đầu) → Nhân viên thực hiện theo hướng dẫn → Lớp 1 kiểm tra người thật qua chuyển động mắt và cử động tự nhiên → Lớp 2 trích xuất đặc trưng sinh trắc học và so khớp với danh sách nhân sự công ty → Ghi nhận giờ vào ca hợp lệ và hiển thị thông báo điểm danh thành công kèm âm thanh chào mừng.

2. **Quy trình nộp và phê duyệt đơn từ 2 cấp độc lập:**
   - *Đối tượng tham gia:* Nhân viên (`EMPLOYEE`), Trưởng bộ phận (`MANAGER`), Trưởng phòng Nhân sự (`HR_MANAGER`).
   - *Mục đích thực hiện:* Số hóa toàn diện quy trình xin nghỉ phép, làm thêm giờ (OT), làm việc tại nhà (WFH) và giải trình chấm công; bảo đảm sự phê duyệt sát sao của quản lý trực tiếp và quản lý quỹ phép của phòng nhân sự.
   - *Hoạt động nghiệp vụ:* Nhân viên nộp đơn trực tuyến trên ứng dụng → Hệ thống tự động kiểm tra số ngày phép khả dụng và giới hạn giờ làm thêm hợp lệ → Đơn được gửi đến Trưởng bộ phận duyệt kế hoạch chuyên môn (Cấp 1) → Sau khi được duyệt, đơn tự động chuyển tiếp lên Trưởng phòng Nhân sự duyệt chung cuộc (Cấp 2) → Hệ thống cập nhật trạng thái đã duyệt, tự động trừ số ngày nghỉ vào quỹ phép của nhân viên và gửi thông báo hoàn tất cho các bên liên quan.

3. **Quy trình tính toán và khóa sổ bảng lương tự động năm 2026:**
   - *Đối tượng tham gia:* Trưởng phòng Nhân sự (`HR_MANAGER`), Ban Giám đốc (`CEO`), Động cơ tính lương tự động.
   - *Mục đích thực hiện:* Tính toán bảng lương hàng tháng tự động, chính xác 100%, tuân thủ các quy định mới của Luật Thuế TNCN số 109/2025/QH15 và chính sách bảo hiểm năm 2026, khóa cố định dữ liệu tài chính lịch sử để phục vụ quyết toán.
   - *Hoạt động nghiệp vụ:* Hàng tháng, cán bộ nhân sự kích hoạt tính lương → Hệ thống tự động tổng hợp ngày công thực tế, giờ làm thêm và đơn nghỉ phép từ sổ chấm công → Áp dụng quy trình tính lương 3 bước chuẩn năm 2026: Tính Tổng thu nhập (Gross), miễn thuế thu nhập đối với toàn bộ tiền làm thêm giờ theo luật, trích các khoản bảo hiểm bắt buộc và tính thuế TNCN theo Biểu thuế lũy tiến 5 bậc mới → Cán bộ nhân sự rà soát bảng lương và thực hiện khóa sổ kỳ lương để cố định số liệu, chống sửa đổi dữ liệu quá khứ → Hệ thống phát hành phiếu lương cá nhân chi tiết đến từng nhân viên.

4. **Quy trình tra cứu thông tin nhân sự qua Trợ lý ảo HR AI an toàn:**
   - *Đối tượng tham gia:* Nhân viên (`EMPLOYEE`), Trợ lý ảo AI, Cơ sở dữ liệu nội bộ.
   - *Mục đích thực hiện:* Hỗ trợ nhân viên tra cứu tự phục vụ 24/7 về số dư ngày phép, phiếu lương, lịch sử chấm công bằng câu hỏi tiếng Việt tự nhiên mà không làm lộ lọt dữ liệu nội bộ ra dịch vụ trí tuệ nhân tạo bên ngoài.
   - *Hoạt động nghiệp vụ:* Nhân viên gửi câu hỏi qua khung chat (ví dụ: *"Xem phiếu lương tháng này của tôi"*) → Hệ thống phân tích ý định câu hỏi để xác định nội dung cần tra cứu → Áp dụng cơ chế bảo mật khép kín (Phương án A): hệ thống tự động tra cứu dữ liệu thực tế từ cơ sở dữ liệu nội bộ theo tài khoản của chính nhân viên đó → Điền số liệu vào bảng thông tin rõ ràng gồm phần Lương thực nhận (Net) và giải trình chi tiết các khoản thuế, bảo hiểm → Hiển thị câu trả lời trực quan trên khung chat.

5. **Quy trình dự báo nguy cơ thôi việc và hỗ trợ giữ chân nhân tài:**
   - *Đối tượng tham gia:* Trưởng phòng Nhân sự (`HR_MANAGER`), Ban Giám đốc (`CEO`), Mô hình phân tích học máy.
   - *Mục đích thực hiện:* Nhận diện sớm các nhân sự có nguy cơ thôi việc cao để bộ phận nhân sự chủ động có biện pháp đối thoại, lắng nghe và điều chỉnh đãi ngộ kịp thời, giảm thiểu chi phí tuyển dụng và xáo trộn nhân sự.
   - *Hoạt động nghiệp vụ:* Hệ thống tự động trích xuất các chỉ số làm việc khách quan của nhân viên (giờ làm thêm, thu nhập, thâm niên gắn bó, khoảng cách đi làm) → Đưa vào mô hình học máy để tính toán xác suất nguy cơ thôi việc của từng cá nhân → Phân loại nhân sự theo 3 mức rủi ro (Thấp, Trung bình, Cao) → Chỉ ra Top 3 nguyên nhân chính tác động đến quyết định thôi việc và hiển thị trực quan trên Dashboard cho nhà quản lý kèm các gợi ý giải pháp can thiệp kịp thời.
"""

if old_sec_2_1_4:
    content = content[:old_sec_2_1_4.start()] + new_sec_2_1_4 + content[old_sec_2_1_4.end():]
    print("Updated Section 2.1.4 successfully")

# 4. Update Table 2.3 (Chức năng theo tác nhân)
old_table_2_3 = re.search(r'### Bảng 2\.3\. Một số chức năng chính theo tác nhân\s*\n\n\|.*?\n(?=---|\n### 2\.1\.6)', content, re.DOTALL)

new_table_2_3 = """### Bảng 2.3. Một số chức năng chính theo tác nhân

| STT | Tên tác nhân | Chức năng nghiệp vụ chính |
| :---: | :--- | :--- |
| **1** | **Ban Giám đốc (`CEO`)** | - Thiết lập và quản lý cấu hình toàn công ty: vị trí văn phòng, bán kính chấm công, chính sách tiền lương và lịch nghỉ lễ.<br>- Tra cứu hồ sơ nhân sự toàn diện, theo dõi báo cáo chi phí quỹ lương và tình hình biến động nhân sự.<br>- Xem Dashboard phân tích dự báo nguy cơ thôi việc để hoạch định chiến lược giữ chân nhân tài.<br>- Phê duyệt các điều chỉnh về cơ cấu phòng ban và bảng lương chốt kỳ. |
| **2** | **Trưởng phòng Nhân sự (`HR_MANAGER`)** | - Quản lý hồ sơ nhân viên, cấp phát mã nhân viên, theo dõi và gia hạn hợp đồng lao động.<br>- Giám sát quy trình đăng ký mẫu khuôn mặt điểm danh của nhân viên tại văn phòng.<br>- Phê duyệt Cấp 2 (chung cuộc) đối với tất cả các loại đơn từ (nghỉ phép, làm thêm giờ, WFH, giải trình chấm công).<br>- Khởi chạy chức năng tính lương hàng tháng, kiểm tra bảng lương và thực hiện khóa sổ kỳ lương chính thức.<br>- Khai thác báo cáo phân tích nguy cơ thôi việc và quản trị quy trình tuyển dụng ứng viên. |
| **3** | **Trưởng bộ phận (`MANAGER`)** | - Theo dõi bảng chấm công hàng ngày, tình hình đi muộn, về sớm của nhân viên trong phòng ban.<br>- Phê duyệt Cấp 1 (sơ bộ) đối với đơn xin nghỉ phép và đơn làm thêm giờ của nhân viên cấp dưới trực tiếp.<br>- Xem báo cáo thống kê tình hình chuyên cần và kế hoạch nghỉ phép của bộ phận mình phụ trách.<br>- *Giới hạn quyền hạn:* Không có quyền xem mức lương và thông tin thu nhập của nhân viên. |
| **4** | **Nhân viên (`EMPLOYEE`)** | - Điểm danh vào/ra ca làm việc bằng nhận diện khuôn mặt tại máy Kiosk hoặc qua điện thoại (định vị GPS / quét mã QR).<br>- Quản lý thông tin cá nhân, theo dõi hợp đồng lao động và số ngày phép năm còn lại.<br>- Nộp đơn trực tuyến: xin nghỉ phép năm, nghỉ ốm, làm thêm giờ, làm việc từ xa, giải trình quên chấm công.<br>- Tra cứu phiếu lương chi tiết từng kỳ đã được phát hành (khoản thực nhận, bảo hiểm và thuế).<br>- Trò chuyện với Trợ lý ảo HR AI để tra cứu nhanh ngày phép, ngày công và nội quy công ty. |
| **5** | **Thiết bị Kiosk (`Kiosk Device`)** | - Giao tiếp bảo mật với máy chủ trung tâm qua mã định danh thiết bị an toàn.<br>- Tiếp nhận chỉ dẫn thử thách cử động ngẫu nhiên (chớp mắt, quay đầu) và hiển thị hướng dẫn trực quan cho nhân viên.<br>- Phân tích luồng hình ảnh camera thời gian thực để xác nhận người thật và chống giả mạo tại chỗ.<br>- Gửi dữ liệu đặc trưng khuôn mặt đã được mã hóa về máy chủ để định danh nhân viên và ghi nhận điểm danh. |
| **6** | **Ứng viên / Khách vãng lai (`CANDIDATE`)** | - Truy cập cổng thông tin doanh nghiệp để tìm hiểu về văn hóa công ty, môi trường làm việc và chế độ đãi ngộ.<br>- Tra cứu danh sách các vị trí việc làm đang mở tuyển dụng công khai.<br>- Nộp hồ sơ xin việc trực tuyến, tải lên tệp CV (định dạng PDF/Word) để ứng tuyển vị trí phù hợp.<br>- Nhận kết quả phản hồi sơ bộ tự động từ hệ thống và nhận email thông báo lịch phỏng vấn. |
"""

if old_table_2_3:
    content = content[:old_table_2_3.start()] + new_table_2_3 + content[old_table_2_3.end():]
    print("Updated Table 2.3 successfully")

# 5. Update All 5 Use Case Detailed Specification Tables (Tables 2.4 to 2.8)
old_ucs = re.search(r'### 2\.2\.1 Đặc tả use case UC_01: Điểm danh khuôn mặt Kiosk FaceID\s*\n\n.*?(?=---|\n## 2\.3 Sequence diagram)', content, re.DOTALL)

new_ucs = """### 2.2.1 Đặc tả use case UC_01: Điểm danh khuôn mặt Kiosk FaceID

![Hình 2.2. Usecase Điểm danh khuôn mặt Kiosk FaceID](images/hinh2_2_usecase_faceid.png)

*Hình 2.2. Usecase Điểm danh khuôn mặt Kiosk FaceID Liveness 2 tầng*

### Bảng 2.4. Bảng đặc tả use case UC_01: Điểm danh khuôn mặt Kiosk FaceID

| Mã use case | **UC_01** |
| :--- | :--- |
| **Tên use case:** | **Điểm danh khuôn mặt Kiosk FaceID** |
| **Mô tả sơ lược:** | Cho phép nhân viên thực hiện điểm danh vào ca làm việc tại thiết bị Kiosk văn phòng bằng công nghệ nhận diện khuôn mặt kết hợp kiểm tra độ sống của người thật (chống gian lận bằng ảnh in hoặc video phát lại). |
| **Actor chính:** | Nhân viên (`EMPLOYEE`) |
| **Actor phụ:** | Thiết bị Kiosk, Máy chủ hệ thống |
| **Tiền điều kiện:** | Thiết bị Kiosk đang hoạt động bình thường; nhân viên đã hoàn tất đăng ký dữ liệu khuôn mặt tại văn phòng. |
| **Hậu điều kiện:** | Thời gian điểm danh được ghi nhận thành công vào sổ chấm công; thông báo điểm danh thành công hiển thị trên màn hình. |
| **Luồng sự kiện chính** | **Luồng sự kiện chính** |
| **Người dùng** | **Hệ thống** |
| 1. Nhân viên đứng trước camera Kiosk ở cự ly thích hợp (khoảng 0.5 – 1.2m). | 2. Tự động phát hiện khuôn mặt, hiển thị khung dẫn hướng và đưa ra chỉ dẫn hành động ngẫu nhiên (ví dụ: *"Vui lòng chớp mắt"*). |
| 3. Nhân viên thực hiện cử động theo chỉ dẫn (chớp mắt tự nhiên hoặc quay nhẹ khuôn mặt). | 4. Phân tích luồng hình ảnh thời gian thực để xác minh người thật (kiểm tra độ sống): xác nhận chỉ có một khuôn mặt duy nhất và có cử động sinh học tự nhiên, chống giả mạo bằng ảnh chụp hoặc video. |
| | 5. Trích xuất đặc trưng khuôn mặt và tự động đối chiếu với danh sách nhân sự đã đăng ký của công ty. |
| | 6. Xác nhận danh tính thành công, lưu lại nhật ký chấm công (kèm thời gian, ca làm việc), phát âm thanh thông báo và hiển thị lời chào nhân viên trên màn hình. |
| **Luồng thay thế** | **Luồng thay thế** |
| **Người dùng** | **Hệ thống** |
| 1.1 Cố tình giơ ảnh in sẵn hoặc video trên điện thoại trước camera. | 2.1 Hệ thống không phát hiện chuyển động mắt tự nhiên của người thật, từ chối chấm công và phát âm thanh cảnh báo. |
| 3.1 Có từ hai người trở lên cùng đứng trước vùng quét camera. | 3.2 Hệ thống phát hiện nhiều khuôn mặt trong khung hình, dừng phiên quét và phát thông báo: *"Vui lòng chỉ từng người một bước vào điểm danh"*. |
| 4.1 Người chưa đăng ký dữ liệu khuôn mặt hoặc hệ thống không nhận diện được. | 4.2 Hiển thị thông báo không khớp danh tính, hướng dẫn nhân viên điểm danh dự phòng bằng quét mã QR cá nhân trên ứng dụng di động. |

---

### 2.2.2 Đặc tả use case UC_02: Nộp và phê duyệt đơn nghỉ phép 2 cấp

![Hình 2.3. Usecase Nộp và phê duyệt đơn nghỉ phép 2 cấp](images/hinh2_3_usecase_leave.png)

*Hình 2.3. Usecase Nộp và phê duyệt đơn nghỉ phép 2 cấp*

### Bảng 2.5. Bảng đặc tả use case UC_02: Nộp và phê duyệt đơn nghỉ phép 2 cấp

| Mã use case | **UC_02** |
| :--- | :--- |
| **Tên use case:** | **Nộp và phê duyệt đơn nghỉ phép 2 cấp** |
| **Mô tả sơ lược:** | Cho phép nhân viên tạo đơn xin nghỉ phép trực tuyến có kiểm tra số ngày phép năm còn lại theo luật định, sau đó chuyển qua quy trình phê duyệt 2 cấp độc lập: Trưởng bộ phận duyệt kế hoạch và Trưởng phòng Nhân sự duyệt chung cuộc, tự động trừ ngày phép vào quỹ phép cá nhân. |
| **Actor chính:** | Nhân viên (`EMPLOYEE`), Trưởng bộ phận (`MANAGER`), Trưởng phòng Nhân sự (`HR_MANAGER`) |
| **Actor phụ:** | Máy chủ thông báo tức thời |
| **Tiền điều kiện:** | Nhân viên và cấp quản lý đã đăng nhập tài khoản hợp lệ trên hệ thống cổng thông tin doanh nghiệp. |
| **Hậu điều kiện:** | Đơn nghỉ phép chuyển sang trạng thái "Đã phê duyệt", số ngày nghỉ được tự động trừ chính xác vào quỹ phép năm của nhân viên. |
| **Luồng sự kiện chính** | **Luồng sự kiện chính** |
| **Người dùng** | **Hệ thống** |
| 1. Nhân viên chọn mục *"Quản lý Đơn từ"*, bấm nút *"Tạo đơn mới"*. | 2. Hiển thị biểu mẫu nộp đơn kèm số ngày phép năm còn lại khả dụng. |
| 3. Nhân viên chọn loại đơn *"Nghỉ phép năm"*, chọn khoảng ngày xin nghỉ và nhập lý do. | 4. Kiểm tra tính hợp lệ: ngày kết thúc sau ngày bắt đầu, số ngày xin nghỉ không vượt quá số ngày phép còn lại. |
| | 5. Tạo đơn mới ở trạng thái *"Chờ Quản lý duyệt"* và tự động gửi thông báo trực tiếp đến Trưởng bộ phận phụ trách. |
| 6. Trưởng bộ phận vào danh sách đơn chờ duyệt, kiểm tra kế hoạch công việc và chọn *"Phê duyệt Cấp 1"*. | 7. Cập nhật trạng thái đơn sang *"Chờ Nhân sự duyệt"* và tự động chuyển tiếp thông báo đến Trưởng phòng Nhân sự. |
| 8. Trưởng phòng Nhân sự rà soát quỹ phép chung và chọn *"Phê duyệt Cấp 2 (Chung cuộc)"*. | 9. Cập nhật trạng thái đơn thành *"Đã phê duyệt"*, tự động trừ số ngày nghỉ vào quỹ phép của nhân viên và gửi thông báo hoàn tất cho nhân viên. |
| **Luồng thay thế** | **Luồng thay thế** |
| **Người dùng** | **Hệ thống** |
| 1.1 Số ngày xin nghỉ vượt quá số ngày phép năm còn lại. | 2.1 Hệ thống từ chối tạo đơn và thông báo rõ: *"Số dư ngày phép năm không đủ để thực hiện yêu cầu này"*. |
| 6.1 Trưởng bộ phận hoặc Trưởng phòng Nhân sự từ chối đơn. | 6.2 Yêu cầu người duyệt nhập lý do từ chối, chuyển trạng thái đơn thành *"Từ chối"* và gửi thông báo giải thích cho nhân viên. |
| 6.3 Quản lý cố tình tự phê duyệt đơn do chính mình tạo ra. | 6.4 Hệ thống ngăn chặn do vi phạm quy định kiểm soát phê duyệt độc lập (không được tự phê duyệt đơn của bản thân). |
| 8.1 Nhân viên xin hủy đơn đã được phê duyệt trước ngày nghỉ. | 8.2 Sau khi Trưởng phòng Nhân sự đồng ý hủy, hệ thống tự động hoàn lại đủ số ngày phép vào quỹ phép của nhân viên. |

---

### 2.2.3 Đặc tả use case UC_03: Tính toán và khóa sổ kỳ lương 2026

![Hình 2.4. Usecase Tính toán và khóa sổ kỳ lương 2026](images/hinh2_4_usecase_payroll.png)

*Hình 2.4. Usecase Tính toán và khóa sổ kỳ lương 2026*

### Bảng 2.6. Bảng đặc tả use case UC_03: Tính toán và khóa sổ kỳ lương 2026

| Mã use case | **UC_03** |
| :--- | :--- |
| **Tên use case:** | **Tính toán và khóa sổ kỳ lương 2026** |
| **Mô tả sơ lược:** | Tự động tổng hợp dữ liệu chấm công, ngày phép, giờ làm thêm của toàn bộ nhân viên trong tháng, áp dụng quy trình tính lương 3 bước chuẩn năm 2026 (miễn thuế tiền làm thêm giờ theo luật, áp dụng Biểu thuế TNCN 5 bậc mới), xuất bảng lương cho Nhân sự kiểm tra và thực hiện khóa sổ kỳ lương để cố định số liệu tài chính lịch sử. |
| **Actor chính:** | Trưởng phòng Nhân sự (`HR_MANAGER`), Ban Giám đốc (`CEO`) |
| **Actor phụ:** | Động cơ tính lương tự động, Cơ sở dữ liệu hệ thống |
| **Tiền điều kiện:** | Kỳ công của tháng đã kết thúc; toàn bộ đơn từ và giải trình công đã được phê duyệt; cán bộ nhân sự có quyền quản trị tiền lương. |
| **Hậu điều kiện:** | Bảng lương toàn công ty được tạo lập hoàn chỉnh; trạng thái khóa sổ kỳ lương được xác lập, ngăn chặn mọi hành vi chỉnh sửa dữ liệu nguồn của kỳ công đó. |
| **Luồng sự kiện chính** | **Luồng sự kiện chính** |
| **Người dùng** | **Hệ thống** |
| 1. Trưởng phòng Nhân sự chọn kỳ lương cần tính (ví dụ: tháng 10/2026) và bấm nút *"Tính toán kỳ lương"*. | 2. Kiểm tra xác nhận kỳ lương chưa bị khóa sổ, tự động trích xuất bảng chấm công, giờ làm thêm, ngày nghỉ phép và mức lương hợp đồng của toàn bộ nhân viên. |
| | 3. Hệ thống áp dụng chính sách lương năm 2026: xác định mức trần đóng bảo hiểm, mức trần phụ cấp ăn ca và các khoản giảm trừ gia cảnh (bản thân 15.5 triệu đồng, người phụ thuộc 6.2 triệu đồng/người). |
| | 4. Động cơ tính lương thực hiện tuần tự 3 bước: Tính tổng thu nhập (Gross), miễn thuế thu nhập đối với tiền lương làm thêm giờ theo luật, trích các khoản bảo hiểm bắt buộc (10.5%) và tính thuế TNCN theo Biểu thuế lũy tiến 5 bậc mới. |
| | 5. Hiển thị bảng tổng hợp tiền lương chi tiết của toàn công ty trên giao diện để Nhân sự và Ban Giám đốc rà soát đối chiếu. |
| 6. Trưởng phòng Nhân sự sau khi kiểm tra số liệu bấm nút *"Khóa sổ kỳ lương"*. | 7. Hệ thống xác nhận khóa kỳ, lưu giữ nguyên vẹn toàn bộ số liệu và công thức đã áp dụng, ngăn chặn mọi hành vi chỉnh sửa dữ liệu công và lương của kỳ này trong tương lai. |
| | 8. Tự động gửi thông báo phát hành phiếu lương cá nhân chi tiết đến từng nhân viên. |
| **Luồng thay thế** | **Luồng thay thế** |
| **Người dùng** | **Hệ thống** |
| 1.1 Cán bộ nhân sự bấm tính lại kỳ lương đã bị khóa sổ từ trước. | 2.1 Hệ thống từ chối thao tác và thông báo: *"Kỳ lương này đã được khóa sổ chính thức, không thể thay đổi dữ liệu tài chính lịch sử"*. |
| 1.2 Phát hiện nhân viên chưa được thiết lập mức lương hoặc thiếu thông tin hợp đồng. | 2.2 Tạm dừng tính cho nhân sự đó và cảnh báo cụ thể trên màn hình để Nhân sự bổ sung thông tin trước khi tính toán. |

---

### 2.2.4 Đặc tả use case UC_04: Tra cứu thông tin qua Trợ lý ảo HR AI

![Hình 2.5. Usecase Tra cứu thông tin qua Trợ lý ảo HR AI](images/hinh2_5_usecase_chatbot.png)

*Hình 2.5. Usecase Tra cứu thông tin qua Trợ lý ảo HR AI Phương án A*

### Bảng 2.7. Bảng đặc tả use case UC_04: Tra cứu thông tin qua Trợ lý ảo HR AI

| Mã use case | **UC_04** |
| :--- | :--- |
| **Tên use case:** | **Tra cứu thông tin qua Trợ lý ảo HR AI** |
| **Mô tả sơ lược:** | Hỗ trợ nhân viên tra cứu nhanh chóng số dư ngày phép, phiếu lương chi tiết, lịch sử chấm công bằng câu hỏi tiếng Việt tự nhiên thông qua Trợ lý ảo. Hệ thống áp dụng cơ chế bảo mật khép kín (Phương án A): tự động truy vấn cơ sở dữ liệu nội bộ và trình bày kết quả thành bảng biểu trực quan, bảo vệ an toàn thông tin cá nhân và dữ liệu tiền lương. |
| **Actor chính:** | Nhân viên (`EMPLOYEE`), Trưởng bộ phận (`MANAGER`), Trưởng phòng Nhân sự (`HR_MANAGER`) |
| **Actor phụ:** | Mô hình trí tuệ nhân tạo nhận diện ý định, Cơ sở dữ liệu nội bộ |
| **Tiền điều kiện:** | Người dùng đã đăng nhập hệ thống bằng tài khoản hợp lệ. |
| **Hậu điều kiện:** | Thông tin tra cứu dưới dạng bảng biểu rõ ràng được hiển thị trên khung chat mà không làm rò rỉ bất kỳ dữ liệu nhạy cảm nào ra dịch vụ đám mây bên ngoài. |
| **Luồng sự kiện chính** | **Luồng sự kiện chính** |
| **Người dùng** | **Hệ thống** |
| 1. Nhân viên bấm biểu tượng Trợ lý ảo trên màn hình, nhập câu hỏi (ví dụ: *"Xem phiếu lương tháng này của tôi"*) hoặc bấm nút câu hỏi gợi ý nhanh. | 2. Hệ thống tiếp nhận câu hỏi, xác thực danh tính người hỏi và kiểm tra quyền hạn của tài khoản. |
| | 3. Hệ thống phân tích ngữ nghĩa câu hỏi để nhận diện chính xác nội dung người dùng muốn tra cứu (phiếu lương, ngày phép, ngày công). |
| | 4. Áp dụng cơ chế tra cứu nội bộ an toàn: hệ thống ngắt kết nối với dịch vụ trí tuệ nhân tạo bên ngoài, tự động truy vấn cơ sở dữ liệu nội bộ bằng mã nhân viên của chính người đang đăng nhập. |
| | 5. Hệ thống tổng hợp số liệu và trình bày kết quả thành bảng thông tin rõ ràng gồm 2 phần: Khoản thực nhận (Net) và Phần giải trình chi tiết các khoản bảo hiểm, thuế. |
| | 6. Lưu nhật ký tra cứu để kiểm soát an toàn thông tin và hiển thị câu trả lời ngay lập tức trên khung chat. |
| **Luồng thay thế** | **Luồng thay thế** |
| **Người dùng** | **Hệ thống** |
| 1.1 Người dùng hỏi các câu hỏi ngoài phạm vi nghiệp vụ nhân sự (thời tiết, giải trí). | 2.1 Trợ lý ảo lịch sự từ chối và hướng dẫn người dùng các chủ đề tra cứu được hỗ trợ (lương, ngày công, phép năm, chế độ công ty). |
| 1.2 Cố tình hỏi thông tin lương của người khác (ví dụ: *"Xem lương của Giám đốc"*). | 2.2 Hệ thống tự động giới hạn phạm vi tra cứu, chỉ trả về đúng dữ liệu của chính người đang hỏi, loại bỏ hoàn toàn nguy cơ lộ lọt thông tin người khác. |
| 1.3 Người dùng gửi câu lệnh bất thường hoặc cố tình vượt rào quy tắc. | 2.3 Hệ thống kích hoạt lớp bảo vệ an toàn, từ chối thực thi và giữ nguyên quy chuẩn bảo mật. |
| 1.4 Mạng chập chờn hoặc dịch vụ AI phản hồi chậm. | 2.4 Hệ thống tự động chuyển sang chế độ nhận diện từ khóa dự phòng nội bộ, phản hồi kết quả nhanh chóng cho người dùng. |

---

### 2.2.5 Đặc tả use case UC_05: Dự báo nguy cơ thôi việc Machine Learning

![Hình 2.6. Usecase Dự báo nguy cơ thôi việc Machine Learning](images/hinh2_6_usecase_attrition.png)

*Hình 2.6. Usecase Dự báo nguy cơ thôi việc Machine Learning*

### Bảng 2.8. Bảng đặc tả use case UC_05: Dự báo nguy cơ thôi việc Machine Learning

| Mã use case | **UC_05** |
| :--- | :--- |
| **Tên use case:** | **Dự báo nguy cơ thôi việc Machine Learning** |
| **Mô tả sơ lược:** | Phân tích tự động 6 chỉ số công việc khách quan của nhân sự toàn công ty, áp dụng mô hình học máy để dự báo xác suất nguy cơ thôi việc, chỉ ra các nguyên nhân chính và hiển thị trên Dashboard trực quan hỗ trợ bộ phận nhân sự chủ động có biện pháp giữ chân nhân tài. |
| **Actor chính:** | Trưởng phòng Nhân sự (`HR_MANAGER`), Ban Giám đốc (`CEO`) |
| **Actor phụ:** | Dịch vụ phân tích học máy, Cơ sở dữ liệu hệ thống |
| **Tiền điều kiện:** | Cán bộ quản lý có quyền hạn đăng nhập, hệ thống đã có dữ liệu chấm công và hợp đồng nhân sự. |
| **Hậu điều kiện:** | Báo cáo danh sách nhân sự kèm điểm rủi ro, phân loại 3 mức rủi ro (Thấp, Trung bình, Cao) và Top 3 nguyên nhân cốt lõi được kết xuất trên Dashboard. |
| **Luồng sự kiện chính** | **Luồng sự kiện chính** |
| **Người dùng** | **Hệ thống** |
| 1. Trưởng phòng Nhân sự truy cập trang *"Phân tích Nguy cơ Thôi việc"*. | 2. Kiểm tra quyền hạn (chỉ cho phép cấp Quản lý nhân sự và Ban Giám đốc truy cập), tự động tổng hợp dữ liệu làm việc của nhân sự toàn công ty. |
| | 3. Trích xuất 6 chỉ số làm việc khách quan: số giờ làm thêm trong tháng, số năm gắn bó với công ty, tổng số năm kinh nghiệm, mức thu nhập, số công ty từng làm việc và khoảng cách từ nhà đến nơi làm việc. |
| | 4. Đưa các chỉ số vào mô hình học máy đã được huấn luyện để tính toán xác suất nguy cơ thôi việc của từng nhân viên. |
| | 5. Phân loại nhân sự vào 3 nhóm nguy cơ rõ ràng: Nguy cơ thấp, Nguy cơ trung bình và Nguy cơ cao. |
| | 6. Hệ thống phân tích và chỉ ra Top 3 nguyên nhân chính tác động nhiều nhất đến nguy cơ của từng nhân viên (ví dụ: làm thêm giờ quá nhiều, khoảng cách đi lại xa). |
| | 7. Trình bày tổng quan trên Dashboard gồm: các biểu đồ thống kê trực quan, danh sách nhân viên cần quan tâm và gợi ý các hành động can thiệp (điều chỉnh ca kíp, cân đối khối lượng công việc, trao đổi chính sách đãi ngộ). |
| 8. Cán bộ nhân sự bấm xem chi tiết từng nhân viên để theo dõi giải trình. | 9. Hiển thị bảng giải trình chi tiết kèm khuyến nghị can thiệp cụ thể để bộ phận nhân sự chủ động đối thoại với nhân viên. |
| **Luồng thay thế** | **Luồng thay thế** |
| **Người dùng** | **Hệ thống** |
| 1.1 Nhân viên thường cố tình truy cập vào trang phân tích nguy cơ thôi việc. | 2.1 Hệ thống từ chối truy cập do không đủ thẩm quyền và ghi nhận cảnh báo an toàn thông tin. |
| 1.2 Nhân viên mới vào làm việc chưa có đủ dữ liệu lịch sử làm thêm giờ. | 2.2 Hệ thống tạm tính giờ làm thêm bằng 0 và dự báo sơ bộ dựa trên các thông tin kinh nghiệm, khoảng cách đi lại ban đầu. |
"""

if old_ucs:
    content = content[:old_ucs.start()] + new_ucs + content[old_ucs.end():]
    print("Updated 5 Use Case Detailed Specification Tables successfully")

# Write back to file
with open(ch2_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished updating ch2_khao_sat_va_phan_tich.md successfully!")

