# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CĂN CỨ PHÁP LÝ

---

## 2.1. NGHIỆP VỤ QUẢN TRỊ NHÂN LỰC VÀ TIỀN LƯƠNG TRONG DOANH NGHIỆP

### 2.1.1. Chu trình quản lý vòng đời nhân viên và cơ cấu tổ chức hai cấp
Vòng đời nhân viên (Employee Lifecycle) là một chuỗi các giai đoạn kế tiếp nhau mà một cá nhân trải qua trong quá trình gắn bó với một tổ chức, bắt đầu từ thời điểm tiếp cận tuyển dụng cho đến khi chấm dứt quan hệ lao động [1]. Trong công tác quản trị nhân sự hiện đại, việc số hóa toàn diện vòng đời này đóng vai trò quyết định trong việc bảo đảm tính liên tục của dữ liệu, giảm thiểu sai sót thủ công và tối ưu hóa hiệu suất vận hành của doanh nghiệp. Chu trình chuẩn bao gồm bảy giai đoạn cốt lõi:

1. **Tuyển dụng và Tiếp nhận (Recruitment & Onboarding):** Tiếp nhận hồ sơ ứng viên, sàng lọc, phỏng vấn và khởi tạo hồ sơ nhân sự mới trên hệ thống với mã định danh duy nhất (Employee Code).
2. **Ký kết và Quản lý Hợp đồng (Contract Management):** Thiết lập hợp đồng thử việc hoặc hợp đồng lao động chính thức, ghi nhận mức lương cơ bản, các khoản phụ cấp và thời hạn hiệu lực.
3. **Phân bổ Cơ cấu Tổ chức (Organizational Structuring):** Gán nhân sự vào vị trí chuyên môn thuộc một phòng ban cụ thể trong sơ đồ tổ chức của doanh nghiệp.
4. **Quản lý Thời gian và Ngày công (Time & Attendance):** Điểm danh hàng ngày qua các phương thức nhận diện sinh trắc học và định vị địa lý, theo dõi số giờ làm việc thực tế, thời gian đi muộn, về sớm và làm thêm giờ (OT).
5. **Nghỉ phép và Điều chuyển (Leave & Mobility):** Quản lý quỹ phép năm, xử lý các đơn xin nghỉ phép, nghỉ ốm, công tác hoặc làm việc từ xa (WFH) thông qua luồng phê duyệt trực tuyến.
6. **Đãi ngộ và Chi trả Lương (Compensation & Benefits):** Tổng hợp dữ liệu chấm công định kỳ, tính toán bảo hiểm xã hội bắt buộc, thuế thu nhập cá nhân và chi trả lương thực nhận (Net).
7. **Đánh giá và Chấm dứt Hợp đồng (Retention & Offboarding):** Đánh giá nguy cơ biến động nhân sự bằng học máy, tiến hành thủ tục thanh lý hợp đồng lao động, chốt sổ bảo hiểm và thu hồi quyền truy cập hệ thống.

Về mặt tổ chức, các doanh nghiệp vừa và nhỏ (SMEs) thường gặp khó khăn khi áp dụng các mô hình phân cấp quản lý nhiều tầng nấc (N-tier hierarchy) phức tạp, dẫn đến hiện tượng phân mảnh dữ liệu và làm chậm tiến độ phê duyệt hành chính. Nhằm giải quyết triệt để vấn đề này, đề tài chuẩn hóa mô hình tổ chức doanh nghiệp theo cấu trúc **cây hai cấp (Two-Level Organizational Tree)**:
- **Cấp 1 (Khối chức năng / Division):** Đại diện cho các khối quản trị chiến lược cấp cao (ví dụ: Khối Kinh doanh, Khối Công nghệ & Kỹ thuật, Khối Vận hành & Nhân sự).
- **Cấp 2 (Phòng ban chuyên môn / Department):** Đại diện cho các đơn vị tác nghiệp trực tiếp (ví dụ: Phòng Phát triển Phần mềm, Phòng Kiểm thử Chất lượng, Phòng Kế toán). Mỗi phòng ban thuộc cấp 2 bắt buộc phải tham chiếu trực tiếp đến một Khối chức năng cha (`parentDepartmentId`), đồng thời có một Trưởng bộ phận (`managerId`) phụ trách quản lý nhân sự trực thuộc.

Mô hình hai cấp này vừa bảo đảm tính tinh gọn, minh bạch trong luồng báo cáo công việc, vừa hạn chế tình trạng truy vấn đệ quy sâu (deep recursive queries) gây nghẽn hiệu năng trên cơ sở dữ liệu tài liệu MongoDB.

---

### 2.1.2. Quản lý vòng đời hợp đồng lao động và cơ chế cảnh báo hạn tự động
Hợp đồng lao động là văn bản pháp lý ràng buộc quyền lợi và nghĩa vụ giữa người sử dụng lao động và người lao động. Căn cứ theo quy định tại Điều 20 Bộ luật Lao động năm 2019 (Luật số 45/2019/QH14), hợp đồng lao động tại Việt Nam được phân thành hai nhóm cơ bản [3]:
- **Hợp đồng lao động xác định thời hạn (Definite Contract):** Hợp đồng mà trong đó hai bên xác định thời hạn, thời điểm chấm dứt hiệu lực của hợp đồng trong khoảng thời gian không quá 36 tháng kể từ ngày có hiệu lực.
- **Hợp đồng lao động không xác định thời hạn (Indefinite Contract):** Hợp đồng mà trong đó hai bên không xác định thời hạn, thời điểm chấm dứt hiệu lực của hợp đồng.
- Bên cạnh đó, doanh nghiệp còn ký kết **Hợp đồng thử việc (Probation Contract)** với thời gian thử việc tối đa không quá 180 ngày đối với công việc quản lý doanh nghiệp, không quá 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn từ cao đẳng trở lên, và không quá 30 ngày đối với các công việc khác theo quy định tại Điều 25 Bộ luật Lao động 2019.

Một trong những rủi ro pháp lý phổ biến nhất tại các doanh nghiệp là việc **bỏ quên thời hạn tái ký hợp đồng lao động**. Theo quy định tại Khoản 2 Điều 20 Bộ luật Lao động 2019, trong thời hạn 30 ngày kể từ ngày hợp đồng lao động xác định thời hạn hết hạn, hai bên phải tiến hành ký kết hợp đồng lao động mới. Nếu hết thời hạn này mà hai bên không ký hợp đồng mới thì hợp đồng xác định thời hạn đã giao kết sẽ tự động chuyển hóa thành hợp đồng lao động không xác định thời hạn. Điều này có thể làm phát sinh các tranh chấp lao động ngoài ý muốn hoặc gây khó khăn cho doanh nghiệp trong việc tái cấu trúc bộ máy.

Nhằm giải quyết triệt để rủi ro trên, hệ thống PeopleInsight AI triển khai dịch vụ tự động hóa quét và cảnh báo hạn hợp đồng lao động định kỳ ([contractReminderService.js](file:///c:/K23CNT1/DANT/DATN/backend/src/services/contractReminderService.js)) dựa trên hai mốc thời gian pháp lý chuẩn:
- **Mốc 60 ngày trước khi hết hạn (60-Day Milestone):** Cảnh báo sớm để cán bộ phụ trách nhân sự (HR) lập danh sách đánh giá hiệu quả công việc, trao đổi sơ bộ với Trưởng bộ phận về kế hoạch gia hạn hoặc chấm dứt hợp đồng.
- **Mốc 30 ngày trước khi hết hạn (30-Day Milestone):** Cảnh báo khẩn cấp theo đúng khung thời gian luật định, gửi thông báo trực tiếp đến người lao động và ban lãnh đạo (`CEO`, `HR_MANAGER`) để yêu cầu hoàn tất văn bản thỏa thuận tái ký.

Cơ chế này được vận hành tự động thông qua tiến trình định kỳ (Cron Job) chạy ngầm hàng ngày lúc 08:00 sáng. Đặc biệt, để ngăn chặn tình trạng hệ thống gửi trùng lặp hàng loạt thông báo khi tiến trình chạy lại hoặc khởi động lại (restart), dịch vụ được thiết kế tuân thủ nghiêm ngặt **nguyên lý Idempotency (Bất biến lũy thừa)** bằng cách tạo khóa tổng hợp duy nhất:
$$\text{idempotencyKey} = \text{"CONTRACT\_EXPIRY\_" } + \text{userId} + \text{"\_" } + \text{contractNumber} + \text{"\_" } + \text{milestone}$$
Hệ thống sử dụng chỉ mục phức hợp `{ companyId: 1, 'data.idempotencyKey': 1 }` trên collection `notifications` để tra cứu và hủy bỏ ngay các thao tác sinh thông báo trùng cho cùng một đợt nhắc.

---

### 2.1.3. Cơ chế phân quyền RBAC và luồng phê duyệt đơn từ hai cấp
Trong các hệ thống phần mềm doanh nghiệp, việc phân quyền truy cập đóng vai trò quyết định trong việc bảo vệ dữ liệu nội bộ và ngăn chặn lỗ hổng truy cập trái phép (Broken Object Level Authorization - BOLA/IDOR). Hệ thống PeopleInsight AI thiết lập mô hình kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) với bốn cấp bậc phân quyền rõ ràng:

1. **Tổng Giám đốc / Giám đốc điều hành (`CEO`):**
   - Nắm toàn quyền quản trị cao nhất trên phạm vi toàn công ty (Tenant).
   - Được quyền xem toàn bộ báo cáo phân tích, phê duyệt các ngoại lệ về bảng lương, cơ cấu phòng ban và cấu hình các chính sách vận hành chung (vị trí GPS, thời gian ca làm việc, tỷ lệ bảo hiểm).
2. **Trưởng phòng Nhân sự (`HR_MANAGER`):**
   - Quản trị toàn bộ vòng đời nhân viên, tạo mới tài khoản nhân sự, phân bổ chức danh, ký kết và cập nhật lịch sử hợp đồng lao động.
   - Quản trị cấu hình lương cơ bản, tính toán và khóa kỳ lương hàng tháng.
   - Giám sát trực tiếp quy trình lấy mẫu khuôn mặt (FaceID Enrollment) tại văn phòng.
   - Là cấp phê duyệt cuối cùng đối với tất cả các loại đơn từ (nghỉ phép, làm thêm giờ, đi công tác, giải trình quên chấm công).
3. **Trưởng bộ phận (`MANAGER`):**
   - Quản lý nhân sự thuộc các phòng ban trực thuộc quyền quản lý của mình.
   - Xem bảng chấm công tổng hợp và lịch sử đi muộn/về sớm của thành viên trong phòng ban.
   - Tiếp nhận và phê duyệt sơ bộ (Cấp 1) các đơn xin nghỉ phép, đơn làm thêm giờ của nhân viên trực thuộc trước khi chuyển lên phòng Nhân sự.
   - **Quy tắc bảo mật bất biến:** Trưởng bộ phận **tuyệt đối không được quyền xem thông tin tiền lương và cấu hình đãi ngộ (`salaryConfig`)** của nhân viên cấp dưới nhằm bảo đảm bí mật thu nhập và tránh mâu thuẫn nội bộ. Mọi hành vi cố tình truy vấn trái phép trường lương sẽ bị chặn đứng tại tầng middleware phân quyền `canAccess()` và tự động ghi log cảnh báo an ninh vào `auditLogs`.
4. **Nhân viên thông thường (`EMPLOYEE`):**
   - Chỉ có quyền tự xem và quản lý thông tin của chính mình (Basic Profile, lịch sử hợp đồng cá nhân, số dư phép năm còn lại, phiếu lương chi tiết từng kỳ).
   - Thực hiện chấm công qua thiết bị Kiosk FaceID hoặc ứng dụng di động GPS Geofencing.
   - Tạo đơn xin nghỉ phép, xin làm thêm giờ, giải trình quên chấm công và theo dõi tiến trình phê duyệt.
   - Tra cứu quyền lợi và chính sách qua trợ lý ảo HR Chatbot.

Đối với các quy trình hành chính (đơn xin nghỉ phép năm, nghỉ ốm, làm việc tại nhà, làm thêm giờ, giải trình công), hệ thống áp dụng **luồng phê duyệt hai cấp cố định (Two-Stage Sequential Approval)**:
$$\text{Nhân viên nộp đơn} \xrightarrow{\text{PENDING\_MGR}} \text{Trưởng bộ phận duyệt} \xrightarrow{\text{PENDING\_HR}} \text{Phòng Nhân sự duyệt} \xrightarrow{\text{APPROVED}} \text{Hoàn tất & Khấu trừ số dư}$$

Quy trình này vừa bảo đảm tính sâu sát trong công việc (Trưởng bộ phận nắm được kế hoạch vắng mặt để sắp xếp nhân sự thay thế), vừa bảo đảm tính pháp lý và tuân thủ quỹ phép của doanh nghiệp (Phòng Nhân sự kiểm tra điều kiện hưởng bảo hiểm xã hội hoặc khấu trừ phép năm).

---

### 2.1.4. Chế độ nghỉ phép năm theo Điều 113–114 Bộ luật Lao động 2019
Nghỉ phép năm là quyền lợi cơ bản của người lao động được pháp luật bảo hộ. Hệ thống PeopleInsight AI xây dựng thuật toán quản lý số dư ngày nghỉ phép (`leaveBalance`) bám sát các điều khoản của Bộ luật Lao động năm 2019 [3]:

1. **Số ngày phép năm tiêu chuẩn (Điều 113 BLLĐ 2019):**
   - Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động thì được nghỉ hằng năm, hưởng nguyên lương theo hợp đồng lao động:
     - **12 ngày làm việc:** Áp dụng đối với người làm công việc trong điều kiện bình thường.
     - **14 ngày làm việc:** Áp dụng đối với lao động chưa thành niên, lao động là người khuyết tật, người làm nghề, công việc nặng nhọc, độc hại, nguy hiểm.
     - **16 ngày làm việc:** Áp dụng đối với người làm nghề, công việc đặc biệt nặng nhọc, độc hại, nguy hiểm.
   - Trường hợp người lao động làm việc chưa đủ 12 tháng thì số ngày nghỉ hằng năm theo tỷ lệ tương ứng với số tháng làm việc thực tế:
     $$\text{Số ngày phép} = \text{round}\left( \frac{\text{Số ngày tiêu chuẩn}}{12} \times \text{Số tháng làm việc thực tế} \right)$$

2. **Ngày nghỉ hằng năm tăng thêm theo thâm niên (Điều 114 BLLĐ 2019):**
   - Cứ đủ **05 năm làm việc** cho một người sử dụng lao động thì số ngày nghỉ hằng năm của người lao động được **tăng thêm tương ứng 01 ngày**.
   - Công thức tính ngày phép thâm niên bổ sung (`seniorityBonusDays`) được tự động hóa dựa trên ngày bắt đầu làm việc (`hireDate`):
     $$\text{seniorityBonusDays} = \left\lfloor \frac{\text{Số năm làm việc liên tục}}{5} \right\rfloor$$
     $$\text{Tổng số phép năm được hưởng} = \text{annualTotal} + \text{seniorityBonusDays}$$

3. **Cơ chế trừ phép nguyên tử và hoàn phép khi hủy đơn:**
   - Để bảo đảm tính toàn vẹn dữ liệu trong môi trường nhiều người dùng truy cập đồng thời, thao tác chuyển trạng thái đơn sang `APPROVED` và thao tác trừ số dư phép còn lại (`annualRemaining`) được bọc trong một **MongoDB Transaction nguyên tử (Atomic ACID Transaction)**.
   - Hệ thống kiểm tra điều kiện tiền quyết `annualRemaining >= requestedDays`. Nếu số dư không đủ, hệ thống lập tức ném mã lỗi HTTP 422 (Unprocessable Entity) và từ chối cập nhật.
   - Khi đơn xin nghỉ đã được phê duyệt nhưng người lao động xin hủy bỏ do thay đổi kế hoạch và được cấp có thẩm quyền chấp thuận, hệ thống sẽ kích hoạt luồng hoàn phép (Refund Leave Days) bằng toán tử nguyên tử `$inc: { annualRemaining: requestedDays, annualUsed: -requestedDays }`, bảo đảm quyền lợi hợp pháp của người lao động.

---

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

---

## 2.3. CÔNG NGHỆ SINH TRẮC HỌC KHUÔN MẶT VÀ CHỐNG GIẢ MẠO 2D
- 2.3.1. Các kỹ thuật phát hiện khuôn mặt: SSD MobileNetV1, MediaPipe Face Landmarker.
- 2.3.2. Kiểm tra thực thể sống (Liveness Detection): 52 Blendshapes, EAR (Eye Aspect Ratio), MAR (Mouth Aspect Ratio), Head Pose Estimation (Yaw/Pitch) qua ma trận biến đổi.
- 2.3.3. Trích xuất Face Embedding 128 chiều (`face_recognition_model`) và giải thuật đo khoảng cách Euclid / Cosine.
- 2.3.4. Đánh giá tính hợp pháp bản quyền mã nguồn và weights: Giấy phép MIT / Apache 2.0; tuyệt đối không sử dụng tập dữ liệu vi phạm đạo đức MS-Celeb-1M.

---

## 2.4. TRÍ TUỆ NHÂN TẠO TẠO SINH VÀ BẢO VỆ DỮ LIỆU NHẠY CẢM
- 2.4.1. Tổng quan về Mô hình Ngôn ngữ Lớn (LLM) và cơ chế Function Calling trên dòng Gemini 3.x (`gemini-3-flash-preview`).
- 2.4.2. So sánh hai trường phái ứng dụng Function Calling:
  - Trường phái kinh điển (gửi `functionResponse` ngược lại cho LLM viết văn).
  - **Phương án A (Template Rendering):** Dừng luồng LLM sau `functionCall`, Backend tự truy vấn CSDL và render Markdown template tĩnh.
- 2.4.3. Phân tích rủi ro an toàn thông tin: Lỗ hổng rò rỉ dữ liệu tài chính (Data Leakage) và phòng chống tấn công Prompt Injection.

---

## 2.5. HỌC MÁY DỰ BÁO BIẾN ĐỘNG NHÂN SỰ VÀ ĐẠO ĐỨC AI
- 2.5.1. Bài toán dự báo nguy cơ nhân viên thôi việc (Employee Attrition Prediction).
- 2.5.2. Tập dữ liệu chuẩn mực IBM HR Attrition.
- 2.5.3. Nguyên tắc công bằng và đạo đức AI: Loại bỏ biến nhạy cảm (Gender, Age, MaritalStatus); chỉ sử dụng 6 đặc trưng định lượng khách quan (`OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` phân vị, `NumCompaniesWorked`, `DistanceFromHome`).

---

## 2.6. TUÂN THỦ LUẬT BẢO VỆ DỮ LIỆU CÁ NHÂN (LUẬT BVDLCN 91/2025/QH15)

### 2.6.1. Phân loại dữ liệu cá nhân nhạy cảm trong hệ thống HRM
Ngày 25/06/2025, Quốc hội khóa XV đã chính thức thông qua **Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15** (gọi tắt là Luật BVDLCN), có hiệu lực thi hành từ ngày 01/01/2026, kế thừa và nâng tầm các quy định tại Nghị định số 13/2023/NĐ-CP của Chính phủ [4]. Đây là văn bản pháp lý cao nhất tại Việt Nam quy định về trách nhiệm của các tổ chức, doanh nghiệp trong quá trình thu thập, xử lý, lưu trữ và chuyển giao dữ liệu cá nhân.

Căn cứ theo Điều 3 và Điều 11 Luật BVDLCN số 91/2025/QH15, dữ liệu trong hệ thống PeopleInsight AI được phân định thành hai nhóm với cấp độ bảo vệ khác nhau:
1. **Dữ liệu cá nhân cơ bản (Basic Personal Data):**
   - Bao gồm: Họ và tên khai sinh, ngày tháng năm sinh, giới tính, số điện thoại, địa chỉ thư điện tử cá nhân, mã số thuế cá nhân, vị trí phòng ban và chức danh chuyên môn.
   - Nhóm dữ liệu này được sử dụng phục vụ các hoạt động giao tiếp công việc và quản lý danh bạ nội bộ thông thường.
2. **Dữ liệu cá nhân nhạy cảm (Sensitive Personal Data):**
   - Luật BVDLCN quy định rõ: *Dữ liệu cá nhân nhạy cảm là dữ liệu gắn liền với quyền riêng tư của cá nhân mà khi bị xâm phạm sẽ gây ảnh hưởng trực tiếp đến quyền và lợi ích hợp pháp của người đó*. Trong hệ thống quản trị nhân sự PeopleInsight AI, có ba loại dữ liệu bắt buộc phải áp dụng quy chế dữ liệu nhạy cảm đặc biệt:
     - **Dữ liệu sinh trắc học (Biometric Data):** Các đặc điểm hình học khuôn mặt được trích xuất phục vụ điểm danh FaceID.
     - **Dữ liệu tài chính và thu nhập (Financial & Remuneration Data):** Mức lương cơ bản, hệ số phụ cấp, các khoản thưởng, lịch sử đóng bảo hiểm xã hội, biểu tính thuế TNCN và phiếu lương chi tiết từng kỳ.
     - **Dữ liệu vị trí địa lý (Location Data):** Tọa độ kinh độ, vĩ độ (`latitude`, `longitude`) được ghi nhận khi nhân viên thực hiện chấm công di động qua GPS Geofencing.

Việc vi phạm các quy định về bảo vệ dữ liệu cá nhân nhạy cảm có thể khiến doanh nghiệp phải đối mặt với mức phạt hành chính lên tới **5% tổng doanh thu** của năm tài chính liền kề trước đó, đồng thời chịu trách nhiệm bồi thường thiệt hại dân sự hoặc đình chỉ hoạt động xử lý dữ liệu [4].

---

### 2.6.2. Cơ chế thu thập sự đồng ý tường minh và quản lý phiên bản chính sách
Điều 13 Luật BVDLCN số 91/2025/QH15 khẳng định: *Sự đồng ý của chủ thể dữ liệu chỉ có hiệu lực khi chủ thể dữ liệu tự nguyện và biết rõ các nội dung: loại dữ liệu cá nhân được xử lý, mục đích xử lý, các bên xử lý dữ liệu, quyền và nghĩa vụ của chủ thể dữ liệu*.

Nhằm đáp ứng yêu cầu pháp lý nghiêm ngặt này, PeopleInsight AI triển khai quy trình **Thu thập sự đồng ý tường minh (Explicit Consent Workflow)**:
1. **Quy trình lấy mẫu khuôn mặt (Enrollment) có giám sát trực tiếp:**
   - Hệ thống **tuyệt đối cấm** nhân viên tự chụp ảnh và tải lên từ xa qua mạng Internet (vì tiềm ẩn nguy cơ nộp ảnh giả mạo hoặc ảnh của người khác).
   - Quy trình lấy mẫu bắt buộc phải diễn ra tại văn phòng doanh nghiệp, dưới sự hướng dẫn và giám sát trực tiếp của cán bộ Nhân sự (`HR_MANAGER`).
   - Thiết bị thu thập chụp từ 3 đến 5 khung hình ở các góc độ khuôn mặt khác nhau để trích xuất vector đặc trưng trung bình có độ tin cậy cao.
2. **Ký biên bản đồng ý điện tử (Informed Digital Consent):**
   - Trước khi chụp mẫu khuôn mặt, nhân viên được cung cấp bản thỏa thuận quyền riêng tư (Privacy Notice) giải thích rõ: khuôn mặt chỉ được dùng duy nhất cho mục đích ghi nhận ngày công, không chia sẻ cho bên thứ ba, và không lưu trữ ảnh chụp thô.
   - Nhân viên xác nhận đồng ý thông qua chữ ký số hoặc mã OTP gửi về email cá nhân.
3. **Quản lý phiên bản chính sách (Consent Policy Versioning):**
   - Trong collection `faceTemplates`, mỗi bản ghi liên kết chặt chẽ với các trường kiểm toán pháp lý:
     - `consentPolicyVersion`: Mã phiên bản của chính sách bảo mật mà nhân viên đã ký (ví dụ: `v2026.1`).
     - `consentGivenAt`: Dấu thời gian chính xác khi người dùng xác nhận đồng ý.
     - `enrolledBy`: Mã định danh của cán bộ HR chịu trách nhiệm giám sát phiên lấy mẫu.
   - Khi doanh nghiệp cập nhật điều khoản thu thập dữ liệu (ví dụ nâng cấp lên `v2026.2`), hệ thống sẽ đánh dấu các mẫu sinh trắc học cũ cần tái ký chấp thuận trước khi tiếp tục sử dụng.

---

### 2.6.3. Quyền rút lại sự đồng ý và quy trình hủy vĩnh viễn dữ liệu sinh trắc học
Khoản 2 Điều 14 Luật BVDLCN quy định rõ quyền của chủ thể dữ liệu: *Chủ thể dữ liệu có quyền rút lại sự đồng ý của mình vào bất kỳ thời điểm nào. Khi chủ thể dữ liệu rút lại sự đồng ý, Bên Kiểm soát và Xử lý dữ liệu phải ngừng xử lý và xóa vĩnh viễn dữ liệu cá nhân nhạy cảm của người đó, trừ trường hợp luật có quy định khác*.

Để hiện thực hóa quyền này, hệ thống PeopleInsight AI thiết kế quy trình **Hủy vĩnh viễn vector sinh trắc học (Immediate Permanent Deletion)**:
- Người lao động có thể gửi yêu cầu rút lại sự đồng ý sử dụng FaceID thông qua giao diện quản lý hồ sơ cá nhân hoặc trực tiếp gửi văn bản cho phòng Nhân sự.
- Ngay khi yêu cầu được xác nhận, hệ thống sẽ thực thi lệnh xóa vật lý triệt để:
  ```javascript
  // Xóa vĩnh viễn vector sinh trắc học trong collection faceTemplates
  await FaceTemplate.deleteMany({ companyId, userId });
  ```
- **Chuyển đổi phương thức chấm công dự phòng:** Sau khi rút chấp thuận FaceID, người lao động sẽ không bị tước bỏ quyền điểm danh mà được hệ thống chuyển đổi linh hoạt sang các phương thức chấm công không sinh trắc học: quét mã QR động tại cổng văn phòng hoặc sử dụng định vị GPS Geofencing trên điện thoại cá nhân.
- **Xóa tự động khi nghỉ việc (Offboarding):** Khi nhân sự chuyển sang trạng thái thôi việc (`status: 'TERMINATED'`), hệ thống tự động kích hoạt trigger xóa sạch vector khuôn mặt khỏi `faceTemplates`, bảo đảm không lưu giữ bất kỳ dữ liệu sinh trắc học thừa thãi nào sau khi quan hệ lao động chấm dứt.

---

### 2.6.4. Kiến trúc lưu trữ tách biệt và mã hóa at-rest chuẩn AES-256-GCM
Để phòng chống nguy cơ tấn công xâm nhập máy chủ hoặc rò rỉ cơ sở dữ liệu làm lộ lọt thông tin nhạy cảm của người lao động, PeopleInsight AI áp dụng chiến lược phòng thủ chiều sâu (Defense-in-Depth) với ba rào cản kỹ thuật kiên cố:

1. **Kiến trúc tách rời độc lập (Physical/Logical Separation):**
   - Hệ thống **tuyệt đối không lưu vector khuôn mặt bên trong collection `users`**.
   - Dữ liệu sinh trắc học được tách biệt hoàn toàn sang một collection chuyên biệt là `faceTemplates`. Bằng cách này, các truy vấn quản lý thông tin nhân sự hàng ngày (`GET /api/users`) sẽ không bao giờ chạm tới hoặc vô tình làm lộ vector sinh trắc học ra mạng Internet.

2. **Mã hóa dữ liệu tại tầng ứng dụng (Application-Level Encryption):**
   - Mọi vector đặc trưng (Descriptor 128 chiều) trước khi ghi vào MongoDB bắt buộc phải được mã hóa tại tầng ứng dụng bằng thuật toán mã hóa đối xứng **AES-256-GCM (Advanced Encryption Standard 256-bit trong chế độ Galois/Counter Mode)**.
   - Chế độ GCM cung cấp đồng thời cả tính bí mật (Confidentiality) lẫn tính xác thực toàn vẹn (Integrity/Authentication Tag). Nếu một kẻ tấn công xâm nhập vào cơ sở dữ liệu và cố tình sửa đổi các byte trong vector đã mã hóa, thuật toán giải mã tại backend sẽ phát hiện sai lệch Auth Tag và từ chối xử lý ngay lập tức.
   - Khóa giải mã 256-bit được quản lý độc lập thông qua biến môi trường hệ thống (`BIOMETRIC_ENCRYPTION_KEY`), tuyệt đối không lưu trong mã nguồn hoặc cơ sở dữ liệu. Dữ liệu vector chỉ được giải mã tạm thời trên bộ nhớ RAM của máy chủ trong vài mili-giây tại thời điểm so khớp khuôn mặt rồi lập tức bị giải phóng.

3. **Nguyên tắc "Không lưu ảnh thô & Không ghi log vector":**
   - Hệ thống **tuyệt đối cấm lưu trữ ảnh khuôn mặt chụp thô (Raw Face Image)** của nhân viên dưới bất kỳ hình thức nào (kể cả tệp nhị phân trên đĩa hay chuỗi Base64 trong database). Sau khi mô hình thị giác máy tính trích xuất thành công 128 tọa độ số học, ảnh chụp từ camera bị hủy hoàn toàn trên bộ nhớ đệm.
   - Các bản ghi nhật ký kiểm toán ([auditLogs](file:///c:/K23CNT1/DANT/DATN/backend/src/models/AuditLog.js)), nhật ký chấm công ([attendanceLogs](file:///c:/K23CNT1/DANT/DATN/backend/src/models/AttendanceLog.js)) và log lỗi hệ thống **tuyệt đối không bao giờ được ghi giá trị vector sinh trắc học**, ngăn chặn mọi nguy cơ rò rỉ dữ liệu qua các kênh ghi vết thứ cấp.
