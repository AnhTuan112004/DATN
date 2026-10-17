# MẪU BÁO CÁO ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC (CHUẨN KHOA CNTT & CĐS — ĐH NGUYỄN TRÃI)

---

## TRANG BÌA CHÍNH (Bìa cứng màu xanh, in chữ nhũ vàng, có khung)

```text
                 TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI
        KHOA CÔNG NGHỆ THÔNG TIN & CHUYỂN ĐỔI SỐ
                        -----------------

                  ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC

                           ĐỀ TÀI:
   PHÁT TRIỂN HỆ THỐNG QUẢN LÝ NHÂN SỰ DOANH NGHIỆP TÍCH HỢP 
          TRÍ TUỆ NHÂN TẠO PEOPLEINSIGHT AI

               Ngành: Công nghệ thông tin

               Giảng viên hướng dẫn: ThS. Lê Trọng Nhất
               Sinh viên thực hiện:  Nguyễn Anh Tuấn
               Lớp:                  K23CNT1
               Mã sinh viên:         2310900113

                         Hà Nội, 12/2026
```

---

## TRANG BÌA PHỤ (Không có khung, có chữ ký GVHD)

```text
                 TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI
        KHOA CÔNG NGHỆ THÔNG TIN & CHUYỂN ĐỔI SỐ
                        -----------------

                  ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC

                           ĐỀ TÀI:
   PHÁT TRIỂN HỆ THỐNG QUẢN LÝ NHÂN SỰ DOANH NGHIỆP TÍCH HỢP 
          TRÍ TUỆ NHÂN TẠO PEOPLEINSIGHT AI

               Ngành: Công nghệ thông tin

               Giảng viên hướng dẫn: ThS. Lê Trọng Nhất
               Chữ ký GVHD:          ..................

               Sinh viên thực hiện:  Nguyễn Anh Tuấn
               Lớp:                  K23CNT1
               Mã sinh viên:         2310900113

                         Hà Nội, 12/2026
```

---

## LỜI CẢM ƠN
*(Quy định: Ngắn gọn, tránh sáo rỗng, giới hạn 200 – 250 từ)*

Để hoàn thành chương trình đào tạo đại học ngành Công nghệ thông tin tại Trường Đại học Nguyễn Trãi và hoàn thành bản đồ án tốt nghiệp này, em xin gửi lời cảm ơn chân thành và sâu sắc nhất tới các thầy cô giáo Khoa Công nghệ Thông tin & Chuyển đổi số, những người đã tận tâm truyền đạt kiến thức nền tảng và chuyên môn quý báu trong suốt những năm học qua.

Đặc biệt, em xin bày tỏ lòng biết ơn sâu sắc nhất tới **ThS. Lê Trọng Nhất**, giảng viên trực tiếp hướng dẫn đồ án tốt nghiệp. Thầy đã dành nhiều thời gian, sự kiên nhẫn và những định hướng khoa học chuẩn xác từ khâu phân tích bài toán, hoàn thiện đề cương cho tới việc hiện thực hóa và tối ưu hóa hệ thống. Những lời chỉ dẫn và góp ý thẳng thắn của thầy là nguồn động lực to lớn giúp em khắc phục các khó khăn kỹ thuật và hoàn thành đề tài đúng tiến độ.

Em cũng xin gửi lời tri ân vô bờ tới gia đình – điểm tựa tinh thần vững chắc luôn động viên, chia sẻ và tạo mọi điều kiện tốt nhất cho em trong suốt quá trình học tập. Xin cảm ơn những người bạn cùng lớp K23CNT1 đã luôn đồng hành, trao đổi và giúp đỡ em trong học tập và nghiên cứu. Sau cùng, em tự cảm ơn bản thân vì đã luôn giữ vững sự kiên trì, nỗ lực hết mình để vượt qua các thách thức và đạt được kết quả hôm nay.

*Hà Nội, ngày … tháng 12 năm 2026*  
**Sinh viên thực hiện**  
**Nguyễn Anh Tuấn**

---

## TÓM TẮT NỘI DUNG ĐỒ ÁN
*(Quy định: 200 – 300 từ, viết thành đoạn văn liền mạch, văn phong khoa học khách quan, không dùng "Tôi/Chúng tôi")*

Quản trị nguồn nhân lực và tiền lương trong bối cảnh doanh nghiệp chuyển đổi số đang đối mặt với nhiều thách thức lớn về tính chính xác, nguy cơ gian lận trong chấm công và nguy cơ lộ lọt dữ liệu nhạy cảm khi ứng dụng trí tuệ nhân tạo (AI). Các giải pháp truyền thống dựa trên máy chấm công thẻ từ hoặc vân tay thường phát sinh chi phí bảo trì và dễ bị điểm danh hộ, trong khi các phần mềm tính lương hiện tại thường cứng nhắc, chưa kịp thời thích ứng với các thay đổi pháp lý mới về biểu thuế thu nhập cá nhân 2026 và Luật Bảo vệ dữ liệu cá nhân.

Để giải quyết vấn đề này, đề tài nghiên cứu và phát triển hệ thống **PeopleInsight AI** theo hướng tiếp cận kết hợp giữa kiến trúc ứng dụng web đa tầng hiện đại và các mô hình trí tuệ nhân tạo tiên tiến có kiểm soát. Giải pháp công nghệ bao gồm: (1) Điểm danh Kiosk nhận diện khuôn mặt hai tầng kết hợp phát hiện độ sống (Liveness Detection) qua MediaPipe Blendshapes và vector embedding chuẩn; (2) Công cụ tính lương tự động cập nhật động theo Luật Thuế Thu nhập cá nhân 2026 với biểu 5 bậc và các mốc chính sách mới; (3) Trợ lý ảo Chatbot HR ứng dụng mô hình ngôn ngữ lớn Google Gemini theo cơ chế Function Calling Phương án A (dừng sinh dữ liệu nhạy cảm, chỉ dùng template cục bộ); và (4) Mô hình học máy dự báo nguy cơ thôi việc dựa trên 6 đặc trưng khách quan từ tập dữ liệu IBM HR Attrition cùng phân hệ sàng lọc hồ sơ CV thông minh.

Kết quả thực nghiệm cho thấy hệ thống hoạt động ổn định trên cơ sở dữ liệu MongoDB 11 collections tinh gọn, ngăn chặn 100% các hành vi gian lận chấm công bằng hình ảnh tĩnh với độ trễ trung bình 42.8ms, kiểm thử tính lương chính xác tuyệt đối qua 22 ca thử nghiệm đối chiếu bảng tính Excel, đồng thời đảm bảo bảo mật dữ liệu tuyệt đối trước các nguy cơ tấn công IDOR và rò rỉ thông tin cá nhân. Đồ án đóng góp một giải pháp phần mềm quản trị nhân sự toàn diện, có tính thực tiễn cao và sẵn sàng triển khai cho các doanh nghiệp vừa và nhỏ.

---

## MỤC LỤC CHI TIẾT THEO CHUẨN KHOA CNTT & CĐS

- **LỜI CẢM ƠN** ............................................................................................ i
- **TÓM TẮT NỘI DUNG ĐỒ ÁN** .................................................................... ii
- **DANH MỤC CÁC TỪ VIẾT TẮT** .............................................................. v
- **DANH MỤC BẢNG BIỂU** ........................................................................ vi
- **DANH MỤC HÌNH ẢNH** .......................................................................... vii
- **MỞ ĐẦU (3 – 5 trang)** ............................................................................. 1
  1. Đặt vấn đề ............................................................................................. 1
  2. Mục tiêu đề tài ....................................................................................... 2
  3. Phạm vi đề tài ........................................................................................ 2
  4. Giải pháp công nghệ ............................................................................. 3
  5. Bố cục của đề tài ................................................................................... 4
- **CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI VÀ NỀN TẢNG CÔNG NGHỆ (10 – 15 trang)** ........ 5
  - 1.1 Tổng quan về đề tài .......................................................................... 5
    - 1.1.1 Khái quát về lĩnh vực quản trị nhân sự doanh nghiệp (HRM) .... 5
    - 1.1.2 Mô hình hoạt động truyền thống trong quản lý nhân sự ............ 7
    - 1.1.3 Xu hướng ứng dụng công nghệ và trí tuệ nhân tạo trong HRM .... 9
  - 1.2 Nền tảng công nghệ .......................................................................... 12
    - 1.2.1 Nền tảng phát triển giao diện ReactJS & TypeScript ................. 12
    - 1.2.2 Kiến trúc REST API và nền tảng Node.js / Express 5 ................. 14
    - 1.2.3 Hệ quản trị cơ sở dữ liệu NoSQL MongoDB ............................... 16
    - 1.2.4 Nền tảng Trí tuệ nhân tạo (MediaPipe, Google Gemini, Scikit-learn) ... 18
- **CHƯƠNG 2. KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG** .................................... 20
  - 2.1 Chức năng của hệ thống ................................................................... 20
    - 2.1.1 Một số chức năng chính (Bảng 2.1) ............................................ 20
    - 2.1.2 Yêu cầu phi chức năng (Bảng 2.2) ............................................. 22
    - 2.1.3 Các tác nhân tham gia hệ thống (Bảng 2.3) ............................... 23
    - 2.1.4 Quy trình nghiệp vụ trong hệ thống ............................................ 24
    - 2.1.5 Biểu đồ Use Case tổng quát (Hình 2.1) ....................................... 26
  - 2.2 Biểu đồ Use Case phân rã chức năng (Đặc tả 5 Use Case cốt lõi) ...... 28
    - 2.2.1 Đặc tả Use Case UC01: Điểm danh khuôn mặt Kiosk FaceID ..... 28
    - 2.2.2 Đặc tả Use Case UC02: Tạo và duyệt đơn nghỉ phép 2 cấp ....... 30
    - 2.2.3 Đặc tả Use Case UC03: Tính toán và khóa sổ kỳ lương 2026 ..... 32
    - 2.2.4 Đặc tả Use Case UC04: Tra cứu thông tin qua Chatbot AI HR ... 34
    - 2.2.5 Đặc tả Use Case UC05: Sàng lọc hồ sơ ứng viên tự động ......... 36
  - 2.3 Biểu đồ tuần tự (Sequence Diagram) ................................................ 38
    - 2.3.1 Biểu đồ tuần tự: Điểm danh Kiosk FaceID Liveness 2 tầng ......... 38
    - 2.3.2 Biểu đồ tuần tự: Tính lương và chốt sổ kỳ lương nguyên tử ...... 40
    - 2.3.3 Biểu đồ tuần tự: Xử lý hỏi đáp Chatbot AI Phương án A ............ 42
  - 2.4 Biểu đồ hành động (Activity Diagram) ............................................... 44
    - 2.4.1 Biểu đồ hành động: Quy trình phê duyệt đơn từ 2 cấp ............. 44
    - 2.4.2 Biểu đồ hành động: Quy trình tiếp nhận và chấm điểm CV AI ... 46
- **CHƯƠNG 3. THIẾT KẾ HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU (10 – 15 trang)** ........ 48
  - 3.1 Thiết kế kiến trúc ............................................................................. 48
    - 3.1.1 Thiết kế tổng quan (Biểu đồ gói Package Diagram) ................... 48
    - 3.1.2 Thiết kế chi tiết các gói ............................................................ 50
  - 3.2 Thiết kế giao diện (UI/UX) ................................................................. 52
    - 3.2.1 Chuẩn hóa thiết kế, phối màu và điều khiển .............................. 52
    - 3.2.2 Thiết kế giao diện Kiosk FaceID, Web Admin & Mobile PWA ..... 53
  - 3.3 Thiết kế lớp (Class Diagram) ............................................................ 55
    - 3.3.1 Thiết kế thuộc tính và phương thức các lớp chủ đạo ................. 55
    - 3.3.2 Sơ đồ lớp tổng thể .................................................................... 57
  - 3.4 Thiết kế cơ sở dữ liệu ...................................................................... 59
    - 3.4.1 Danh sách 11 Collections chuẩn hóa ......................................... 59
    - 3.4.2 Biểu đồ thực thể liên kết (E-R Diagram) .................................... 63
- **CHƯƠNG 4. XÂY DỰNG ỨNG DỤNG** ........................................................ 65
  - 4.1 Các công cụ, ngôn ngữ và môi trường phát triển ............................. 65
  - 4.2 Kết quả đạt được (Giao diện và hoạt động các phân hệ chính) .......... 67
  - 4.3 Kiểm thử ứng dụng ........................................................................... 71
    - 4.3.1 Kiểm thử chức năng Kiosk FaceID Liveness ............................... 71
    - 4.3.2 Kiểm thử tính lương với 22 ca thử nghiệm đối chiếu Excel ....... 73
    - 4.3.3 Kiểm thử Chatbot AI an toàn dữ liệu và chống IDOR ................. 75
- **KẾT LUẬN (Tối đa 2 trang)** .................................................................... 77
  - Kết luận về các kết quả đạt được ........................................................... 77
  - Hướng phát triển và mở rộng trong tương lai ........................................ 78
- **TÀI LIỆU THAM KHẢO VÀ TRÍCH DẪN** ................................................... 79
- **PHỤ LỤC** .............................................................................................. 81

---

## DANH MỤC CÁC TỪ VIẾT TẮT

| Từ viết tắt | Thuật ngữ đầy đủ | Diễn giải / Ý nghĩa |
| :--- | :--- | :--- |
| **AI** | Artificial Intelligence | Trí tuệ nhân tạo |
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| **ATS** | Applicant Tracking System | Hệ thống theo dõi và quản lý hồ sơ ứng viên |
| **BLLĐ** | Bộ luật Lao động | Bộ luật Lao động Việt Nam số 45/2019/QH14 |
| **BVDLCN** | Bảo vệ Dữ liệu Cá nhân | Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & NĐ 13/2023/NĐ-CP |
| **BHXH / BHYT / BHTN** | Bảo hiểm Xã hội / Y tế / Thất nghiệp | Các khoản bảo hiểm bắt buộc theo pháp luật lao động |
| **CV** | Curriculum Vitae | Bản tóm tắt lý lịch và kinh nghiệm nghề nghiệp |
| **ERD** | Entity-Relationship Diagram | Biểu đồ thực thể liên kết trong thiết kế cơ sở dữ liệu |
| **FAR / FRR** | False Acceptance Rate / False Rejection Rate | Tỷ lệ nhận diện sai / Tỷ lệ từ chối sai trong sinh trắc học |
| **HR / HRM** | Human Resources / Human Resource Management | Quản trị nguồn nhân lực |
| **IDOR** | Insecure Direct Object References | Lỗ hổng bảo mật tham chiếu đối tượng trực tiếp không an toàn |
| **JD** | Job Description | Bản mô tả công việc và yêu cầu tuyển dụng |
| **JWT** | JSON Web Token | Tiêu chuẩn mở truyền tải thông tin định danh an toàn |
| **LLM** | Large Language Model | Mô hình ngôn ngữ lớn |
| **ML** | Machine Learning | Học máy |
| **OT** | Overtime | Làm thêm ngoài giờ làm việc quy định |
| **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò |
| **REST** | Representational State Transfer | Phong cách kiến trúc mạng cho các dịch vụ web |
| **ROC / AUC** | Receiver Operating Characteristic / Area Under Curve | Đường cong đặc tính hoạt động máy thu / Diện tích dưới đường cong |
| **SUS** | System Usability Scale | Thang đo lường khả năng sử dụng và trải nghiệm hệ thống |
| **UAT** | User Acceptance Testing | Kiểm thử chấp nhận từ người dùng thực tế |
| **UML** | Unified Modeling Language | Ngôn ngữ mô hình hóa thống nhất |
| **WFH** | Work From Home | Chế độ làm việc từ xa tại nhà |

---

## TÀI LIỆU THAM KHẢO VÀ TRÍCH DẪN (CHUẨN KHOA CNTT & CĐS)

1. ThS. Lê Trọng Nhất (2026). *Bài giảng Học phần Phân tích và Đặc tả Yêu cầu Phần mềm*. Khoa CNTT & Chuyển đổi số, Trường Đại học Nguyễn Trãi.
2. ThS. Lê Trọng Nhất (2026). *Bài giảng Học phần Công nghệ Phần mềm Chuyên sâu*. Khoa CNTT & Chuyển đổi số, Trường Đại học Nguyễn Trãi.
3. Quốc hội Việt Nam (2019). *Bộ luật Lao động số 45/2019/QH14*, ban hành ngày 20/11/2019.
4. Quốc hội Việt Nam (2025). *Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15* và *Nghị định số 13/2023/NĐ-CP* về bảo vệ dữ liệu cá nhân.
5. Chính phủ Việt Nam (2020). *Nghị định 145/2020/NĐ-CP* quy định chi tiết và hướng dẫn thi hành một số điều của Bộ luật Lao động về điều kiện lao động và quan hệ lao động.
6. Martin Fowler (2003). *UML Distilled: A Brief Guide to the Standard Object Modeling Language (3rd Edition)*. Addison-Wesley Professional.
7. Dennis, A., Wixom, B. H., & Tegarden, D. (2020). *Systems Analysis and Design: An Object-Oriented Approach with UML*, 6th ed., Wiley.
8. Lugaresi, C. et al. (2019). *MediaPipe: A Framework for Building Perception Pipelines*. arXiv preprint arXiv:1906.08172.
9. Google DeepMind (2024). *Gemini: A Family of Highly Capable Multimodal Models*. Technical Report.
10. Pedregosa, F. et al. (2011). *Scikit-learn: Machine Learning in Python*. Journal of Machine Learning Research, 12, pp. 2825–2830.
11. MongoDB, Inc., *MongoDB Documentation: Scalable NoSQL Database Architecture*. [Online]. Available: https://www.mongodb.com/docs/. [Accessed: Oct. 16, 2026].
12. Node.js Foundation, *Node.js Documentation*. [Online]. Available: https://nodejs.org/en/docs/. [Accessed: Oct. 16, 2026].
13. Meta Open Source, *React Documentation: The Library for Web and Native User Interfaces*. [Online]. Available: https://react.dev/. [Accessed: Oct. 16, 2026].
