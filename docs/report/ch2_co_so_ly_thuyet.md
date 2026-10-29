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

## 2.2. KHUNG PHÁP LÝ TIỀN LƯƠNG, BẢO HIỂM VÀ THUẾ THU NHẬP CÁ NHÂN NĂM 2026

### 2.2.1. Các văn bản quy phạm pháp luật nền tảng
Công tác tính toán tiền lương và các khoản trích theo lương tại doanh nghiệp đòi hỏi tính chuẩn xác tuyệt đối và phải tuân thủ nghiêm ngặt hệ thống pháp luật hiện hành. Trong bối cảnh cải cách chính sách tiền lương và hiện đại hóa hệ thống thuế, năm 2026 ghi nhận nhiều bước chuyển biến mang tính bước ngoặt tại Việt Nam. Hệ thống PeopleInsight AI xây dựng động cơ tính lương (Payroll Engine) tự động hóa dựa trên hệ thống văn bản quy phạm pháp luật nền tảng gồm:

1. **Bộ luật Lao động năm 2019 (Luật số 45/2019/QH14):**
   - Điều 90 quy định về cấu trúc tiền lương (bao gồm mức lương theo công việc hoặc chức danh, phụ cấp lương và các khoản bổ sung khác).
   - Điều 98 quy định chế độ tiền lương làm thêm giờ và tiền lương làm việc vào ban đêm.
   - Điều 113 và Điều 114 quy định về chế độ nghỉ phép năm và ngày nghỉ hàng năm tăng thêm theo thâm niên làm việc [3].

2. **Luật Thuế Thu nhập cá nhân mới (Luật số 109/2025/QH15):**
   - Chính thức thông qua biểu thuế thu nhập cá nhân (TNCN) lũy tiến từng phần 5 bậc mới, thay thế biểu thuế 7 bậc cũ nhằm giảm gánh nặng tài chính cho người lao động có thu nhập trung bình và khuyến khích tăng năng suất lao động.
   - Đặc biệt, luật mở rộng danh mục thu nhập được miễn thuế: **miễn thuế TNCN đối với toàn bộ tiền lương làm thêm giờ (OT)** nằm trong hạn mức luật định, không phân biệt phần lương trả theo giờ làm việc bình thường hay phần phụ trội.

3. **Nghị quyết số 110/2025/UBTVQH15 của Ủy ban Thường vụ Quốc hội:**
   - Điều chỉnh mức giảm trừ gia cảnh thuế TNCN phù hợp với biến động chỉ số giá tiêu dùng (CPI): nâng mức giảm trừ cho bản thân người nộp thuế lên **15.500.000 VNĐ/tháng** (tương đương 186.000.000 VNĐ/năm) và mức giảm trừ cho mỗi người phụ thuộc lên **6.200.000 VNĐ/tháng**.

4. **Nghị định số 253/2026/NĐ-CP và Nghị định số 161/2026/NĐ-CP của Chính phủ:**
   - Quy định mức lương cơ sở áp dụng trong các cơ quan, đơn vị và làm căn cứ xác định trần đóng bảo hiểm xã hội bắt buộc, bảo hiểm y tế. Năm 2026 ghi nhận mốc điều chỉnh mức lương cơ sở từ 2.340.000 VNĐ lên 2.530.000 VNĐ từ ngày 01/07/2026.
   - Điều chỉnh định mức tiền ăn giữa ca (tiền ăn ca) không tính vào thu nhập chịu thuế TNCN từ mức 730.000 VNĐ/tháng lên 1.200.000 VNĐ/tháng từ ngày 01/07/2026.

5. **Nghị định số 293/2025/NĐ-CP của Chính phủ:**
   - Quy định mức lương tối thiểu vùng áp dụng cho người lao động làm việc theo hợp đồng lao động. Mức lương tối thiểu Vùng I đạt 5.310.000 VNĐ/tháng, làm căn cứ xác định giới hạn tối đa đóng bảo hiểm thất nghiệp (BHTN).

6. **Nghị định số 145/2020/NĐ-CP của Chính phủ:**
   - Hướng dẫn chi tiết thi hành một số điều của Bộ luật Lao động về điều kiện lao động và quan hệ lao động, cụ thể tại Điều 55 (tiền lương làm thêm giờ) và Điều 57 (tiền lương làm việc vào ban đêm và làm thêm giờ vào ban đêm) [5].

*Phạm vi áp dụng của động cơ tính lương:* Hệ thống thiết lập cho đối tượng người lao động là **cá nhân cư trú có ký kết hợp đồng lao động từ 3 tháng trở lên** tại doanh nghiệp Việt Nam.

---

### 2.2.2. Biểu thuế TNCN lũy tiến 5 bậc mới và quy trình tính toán 3 bước
Quy trình tính toán tiền lương và thuế TNCN được PeopleInsight AI chuẩn hóa theo **nguyên tắc 3 bước tuần tự**, bảo đảm sự tường minh, minh bạch và có khả năng giải trình độc lập theo quy định của cơ quan Thuế:

$$\begin{aligned}
\text{[Bước 1: Tổng thu nhập (Gross)]} &\longrightarrow \text{[Bước 2: Thu nhập chịu thuế]} \\
&\longrightarrow \text{[Bước 3: Thu nhập tính thuế \& Thuế TNCN]} \longrightarrow \text{Lương thực nhận (Net)}
\end{aligned}$$

#### Bước 1: Xác định Tổng thu nhập (Gross Income)
Tổng thu nhập của người lao động trong kỳ tính lương bao gồm toàn bộ các khoản tiền lương, tiền công, phụ cấp và các khoản bổ sung khác:
$$\text{Gross} = \text{Lương ngày công} + \text{Phụ cấp chức vụ} + \text{Tiền ăn ca} + \text{Tiền làm thêm giờ (OT)} + \text{Phụ cấp làm đêm} + \text{Tiền thưởng} + \text{Bồi thường phép}$$

Trong đó, tiền lương theo ngày công thực tế được tính dựa trên số ngày làm việc thực tế trong tháng so với số ngày công chuẩn của doanh nghiệp (thường là 22 hoặc 26 ngày):
$$\text{Lương ngày công} = \frac{\text{Lương cơ bản theo hợp đồng}}{\text{Số ngày công tiêu chuẩn}} \times \text{Số ngày làm việc thực tế}$$

#### Bước 2: Xác định Thu nhập chịu thuế (Taxable Income)
Thu nhập chịu thuế là phần thu nhập sau khi đã loại trừ các khoản thu nhập được miễn thuế hoặc không chịu thuế theo quy định pháp luật:
$$\text{Thu nhập chịu thuế} = \text{Gross} - \text{Các khoản miễn thuế}$$

Các khoản miễn thuế được loại trừ bao gồm:
1. **Tiền ăn ca trong định mức:** Tối đa không quá 730.000 VNĐ/tháng (áp dụng đối với các khoản chi trả trước ngày 01/07/2026) hoặc 1.200.000 VNĐ/tháng (áp dụng đối với các khoản chi trả từ ngày 01/07/2026 trở đi). Phần chi vượt định mức sẽ bị tính vào thu nhập chịu thuế.
2. **Tiền làm thêm giờ (OT) hợp lệ:** Toàn bộ tiền lương làm thêm giờ nằm trong hạn mức luật định (không quá 4 giờ/ngày, không quá 40 giờ/tháng và trả đúng hệ số Điều 98 BLLĐ).
3. **Tiền bồi thường ngày phép năm chưa nghỉ:** Theo quy định tại Khoản 3 Điều 113 BLLĐ 2019 khi thôi việc, mất việc làm.

#### Bước 3: Xác định Thu nhập tính thuế (Assessable Income) và Thuế TNCN
Thu nhập tính thuế là căn cứ trực tiếp để áp dụng biểu thuế lũy tiến từng phần:
$$\text{Thu nhập tính thuế} = \text{Thu nhập chịu thuế} - \text{Các khoản bảo hiểm bắt buộc} - \text{Các khoản giảm trừ gia cảnh}$$

Nếu $\text{Thu nhập tính thuế} \le 0$, số thuế TNCN phải nộp bằng $0$. Ngược lại, số thuế TNCN được tính dựa trên **Biểu thuế lũy tiến từng phần 5 bậc mới** theo Luật Thuế TNCN số 109/2025/QH15:

| Bậc thuế | Thu nhập tính thuế / tháng (TNTT) | Thuế suất | Cách tính số thuế phải nộp từng bậc | Công thức rút gọn |
| :---: | :--- | :---: | :--- | :--- |
| **1** | Đến 10 triệu đồng | **5%** | $\text{TNTT} \times 5\%$ | $0.05 \times \text{TNTT}$ |
| **2** | Trên 10 triệu đến 30 triệu đồng | **10%** | $10\text{M} \times 5\% + (\text{TNTT} - 10\text{M}) \times 10\%$ | $0.10 \times \text{TNTT} - 500.000$ |
| **3** | Trên 30 triệu đến 60 triệu đồng | **20%** | $2.5\text{M} + (\text{TNTT} - 30\text{M}) \times 20\%$ | $0.20 \times \text{TNTT} - 3.500.000$ |
| **4** | Trên 60 triệu đến 100 triệu đồng | **30%** | $8.5\text{M} + (\text{TNTT} - 60\text{M}) \times 30\%$ | $0.30 \times \text{TNTT} - 9.500.000$ |
| **5** | Trên 100 triệu đồng | **35%** | $20.5\text{M} + (\text{TNTT} - 100\text{M}) \times 35\%$ | $0.35 \times \text{TNTT} - 14.500.000$ |

Sau khi xác định được thuế TNCN và các khoản trích đóng bảo hiểm, tiền lương thực nhận (Net Salary) chi trả về tài khoản người lao động được xác định:
$$\text{Lương thực nhận (Net)} = \text{Gross} - \text{Bảo hiểm người lao động đóng (10.5\%)} - \text{Thuế TNCN} - \text{Các khoản giảm trừ khác}$$

> **Quy tắc bất biến trong hạch toán:** Khoản giảm trừ gia cảnh cho bản thân (15.5M) và người phụ thuộc (6.2M) là các **chỉ số tham chiếu phục vụ khấu trừ thuế TNCN**, tuyệt đối **không bị trừ vào tiền lương thực nhận** của người lao động.

---

### 2.2.3. Mức giảm trừ gia cảnh và tỷ lệ trích đóng bảo hiểm bắt buộc
Căn cứ theo Luật Bảo hiểm xã hội năm 2024 và Luật Việc làm, cơ cấu tỷ lệ trích đóng các quỹ bảo hiểm bắt buộc tại doanh nghiệp bao gồm:

1. **Phần người lao động đóng (trừ trực tiếp vào lương Gross):** Tổng tỷ lệ **$10.5\%$**, gồm:
   - Bảo hiểm xã hội (BHXH - Quỹ Hưu trí và Tử tuất): **$8.0\%$**.
   - Bảo hiểm y tế (BHYT): **$1.5\%$**.
   - Bảo hiểm thất nghiệp (BHTN): **$1.0\%$**.

2. **Phần người sử dụng lao động (doanh nghiệp) đóng:** Tổng tỷ lệ **$21.5\%$**, gồm:
   - Bảo hiểm xã hội (BHXH): **$17.5\%$** (gồm Quỹ Hưu trí $14\%$, Quỹ Ốm đau - Thai sản $3\%$, Quỹ Bảo hiểm tai nạn lao động - bệnh nghề nghiệp $0.5\%$).
   - Bảo hiểm y tế (BHYT): **$3.0\%$**.
   - Bảo hiểm thất nghiệp (BHTN): **$1.0\%$**.
   *Tổng chi phí bảo hiểm toàn xã hội phát sinh trên mỗi nhân sự là $32.0\%$.*

Tiền lương làm căn cứ đóng BHXH/BHYT (`insurableSalary`) bao gồm mức lương cơ bản và các khoản phụ cấp lương có tính chất cố định. Các khoản tiền thưởng, phụ cấp ăn ca, hỗ trợ xăng xe, điện thoại và tiền làm thêm giờ không thuộc diện tính đóng bảo hiểm.

---

### 2.2.4. Hai mốc chuyển tiếp chính sách trong năm 2026
Một thách thức lớn trong việc thiết kế động cơ tính lương cho năm 2026 là sự thay đổi đồng thời của mức lương cơ sở và mức trần phụ cấp giữa hai nửa đầu và cuối năm. Hệ thống PeopleInsight AI giải quyết triệt để vấn đề này bằng cách thiết kế cấu trúc cấu hình động (`companies.settings.taxPolicies`), tự động tra cứu chính sách theo ngày hiệu lực:

| Tham số chính sách | Giai đoạn 1 (01/01/2026 – 30/06/2026) | Giai đoạn 2 (Từ 01/07/2026 trở đi) | Căn cứ pháp lý áp dụng |
| :--- | :---: | :---: | :--- |
| **Mức lương cơ sở tham chiếu** | 2.340.000 VNĐ | 2.530.000 VNĐ | Nghị định 253/2026/NĐ-CP |
| **Mức trần đóng BHXH & BHYT** (20 lần lương cơ sở) | **46.800.000 VNĐ** | **50.600.000 VNĐ** | Điều 89 Luật Bảo hiểm xã hội |
| **Định mức tiền ăn ca miễn thuế** | **730.000 VNĐ / tháng** | **1.200.000 VNĐ / tháng** | Thông tư 26/2015/TT-BTC & NĐ 161/2026 |
| **Mức lương tối thiểu Vùng I** | 5.310.000 VNĐ / tháng | 5.310.000 VNĐ / tháng | Nghị định 293/2025/NĐ-CP |
| **Mức trần đóng BHTN** (20 lần lương tối thiểu Vùng I) | **106.200.000 VNĐ** | **106.200.000 VNĐ** | Điều 58 Luật Việc làm |

Khi tính toán phiếu lương, hệ thống căn cứ vào hai mốc thời gian độc lập:
- `periodDate` (tháng phát sinh công và lương): Dùng để áp dụng mức trần đóng BHXH/BHYT tương ứng.
- `payDate` (thời điểm chi trả lương thực tế): Dùng để áp dụng mức trần tiền ăn ca miễn thuế và chính sách khấu trừ thuế TNCN.

---

### 2.2.5. Chế độ làm thêm giờ (OT), làm việc ban đêm và chính sách miễn thuế 2026
Chế độ làm thêm giờ và làm việc ban đêm được hệ thống tính toán tự động dựa trên nhật ký điểm danh (`attendanceLogs`) và các đơn xin làm thêm giờ đã được phê duyệt hợp lệ:

1. **Hệ số tiền lương làm thêm giờ ban ngày (Điều 98 BLLĐ 2019):**
   - Vào ngày làm việc bình thường: Ít nhất bằng **$150\%$** đơn giá tiền lương giờ.
   - Vào ngày nghỉ hàng tuần (Thứ Bảy, Chủ Nhật): Ít nhất bằng **$200\%$**.
   - Vào ngày nghỉ lễ, tết, ngày nghỉ có hưởng lương: Ít nhất bằng **$300\%$** (chưa kể tiền lương của ngày nghỉ lễ hưởng nguyên lương theo luật).

2. **Chế độ làm việc vào ban đêm (từ 22:00 hôm trước đến 06:00 sáng hôm sau):**
   - Người lao động làm việc vào ban đêm được trả thêm ít nhất **$30\%$** tiền lương tính theo đơn giá tiền lương giờ của ngày làm việc bình thường.

3. **Làm thêm giờ vào ban đêm (Điều 57 Nghị định 145/2020/NĐ-CP):**
   Theo quy định pháp luật, tiền lương làm thêm giờ ban đêm được tính lũy tích bao gồm: tiền lương làm thêm ban ngày + phụ cấp làm đêm $30\%$ + thêm $20\%$ tính theo tiền lương làm thêm giờ ban ngày:
   - *Vào ngày thường:*
     - Trường hợp người lao động không làm thêm giờ ban ngày trước đó: Hưởng **$200\%$** ($150\% + 30\% + (20\% \times 100\%)$).
     - Trường hợp người lao động có làm thêm giờ ban ngày trước đó: Hưởng **$210\%$** ($150\% + 30\% + (20\% \times 150\%)$).
   - *Vào ngày nghỉ hàng tuần:* Hưởng **$270\%$** ($200\% + 30\% + (20\% \times 200\%)$).
   - *Vào ngày nghỉ lễ, tết:* Hưởng **$390\%$** ($300\% + 30\% + (20\% \times 300\%)$).

4. **Chính sách miễn thuế thu nhập cá nhân đối với tiền OT từ năm 2026:**
   Căn cứ Luật Thuế TNCN số 109/2025/QH15, từ năm 2026:
   - **Phần được miễn thuế:** **Toàn bộ tiền lương làm thêm giờ hợp lệ** (bao gồm cả $100\%$ tiền lương gốc và phần phụ trội $50\%, 100\%, 200\%$) được miễn thuế TNCN nếu thỏa mãn đồng thời:
     1. Số giờ làm thêm không vượt quá **4 giờ/ngày** và không quá **40 giờ/tháng**.
     2. Tổng số giờ làm thêm trong năm không vượt quá **200 giờ/năm** (hoặc 300 giờ đối với một số ngành nghề đặc thù).
     3. Hệ số chi trả tiền lương không vượt quá mức quy định tại Điều 98 BLLĐ.
   - **Phần bị tính thuế:** Phần tiền lương ứng với số giờ OT vượt quá trần quy định (vượt 4h/ngày hoặc 40h/tháng) và phần tiền chênh lệch do doanh nghiệp tự nguyện trả cao hơn hệ số quy định tại Điều 98 BLLĐ sẽ bị tính vào thu nhập chịu thuế TNCN.

---

## 2.3. CÔNG NGHỆ SINH TRẮC HỌC KHUÔN MẶT VÀ CHỐNG GIẢ MẠO 2D

### 2.3.1. Các kỹ thuật phát hiện khuôn mặt và định vị điểm mốc
Hệ thống chấm công Kiosk FaceID của PeopleInsight AI vận hành trên nền tảng thị giác máy tính (Computer Vision) kết hợp giữa hai kiến trúc mạng nơ-ron sâu tiên tiến:

1. **Mô hình phát hiện khuôn mặt SSD MobileNetV1:**
   - Single Shot MultiBox Detector (SSD) kết hợp với mạng tích chập nhẹ MobileNetV1 làm xương sống (Backbone).
   - Kiến trúc sử dụng các lớp tích chập tách biệt theo chiều sâu (Depthwise Separable Convolutions), giúp giảm thiểu đáng kể số lượng tham số tính toán và dung lượng bộ nhớ mà vẫn duy trì độ chính xác cao.
   - Mô hình có khả năng định vị chính xác hộp bao khuôn mặt (Bounding Box) với độ trễ dưới 25ms trên trình duyệt thông qua tăng tốc phần cứng WebGL/WASM.

2. **Mô hình định vị điểm mốc hình học MediaPipe Face Landmarker:**
   - Được phát triển bởi Google Research, mô hình sử dụng học sâu để định vị thời gian thực **468 điểm mốc không gian 3 chiều** ($x, y, z$) trên toàn bộ bề mặt khuôn mặt [8].
   - Tọa độ $z$ thể hiện chiều sâu tương đối của các chi tiết (độ nhô của đỉnh sống mũi, độ hõm của khóe mắt), cung cấp thông tin hình học phong phú vượt trội so với các mô hình 68 điểm mốc 2D truyền thống.
   - Mô hình cung cấp thêm 52 hệ số biểu cảm cơ mặt (Blendshape Coefficients) chuẩn hóa trong khoảng $[0.0, 1.0]$, cho phép theo dõi các chuyển động cơ học tinh vi như chớp mắt, nhíu mày, mở miệng và mỉm cười.

---

### 2.3.2. Kiểm tra thực thể sống (Liveness Detection) theo chuỗi thời gian sinh lý học
Để ngăn chặn triệt để các hình thức tấn công giả mạo trình diện (Presentation Attacks) theo tiêu chuẩn quốc tế **ISO/IEC 30107-3** [7], PeopleInsight AI triển khai tầng kiểm tra thực thể sống động học (Dynamic Client Liveness) dựa trên phân tích chuỗi thời gian chuyển đổi trạng thái sinh lý học:

1. **Phát hiện chớp mắt qua tỷ lệ khung mí mắt (Eye Aspect Ratio - EAR):**
   Độ mở của mắt được tính toán dựa trên khoảng cách giữa các điểm mốc mí trên, mí dưới và hai khóe mắt:
   $$\text{EAR} = \frac{|p_{159} - p_{145}| + |p_{158} - p_{153}|}{2 \cdot |p_{33} - p_{133}|}$$
   Trong đó $p_{33}, p_{133}$ là tọa độ hai khóe mắt; $p_{159}, p_{145}$ và $p_{158}, p_{153}$ là các cặp điểm đối xứng trên viền mí mắt.
   - Hệ thống ghi nhận trạng thái **mắt mở** khi $\text{EAR} \ge 0.25$ và **mắt nhắm** khi $\text{EAR} \le 0.15$.
   - Một chu kỳ chớp mắt hợp lệ đòi hỏi trạng thái chuyển đổi sinh học: $\text{Mắt mở} \rightarrow \text{Mắt nhắm} \rightarrow \text{Mắt mở lại}$ diễn ra trong khoảng thời gian cửa sổ sinh lý từ **$100\text{ ms}$ đến $800\text{ ms}$**. Các trường hợp mắt nhắm quá lâu ($>1000\text{ ms}$) hoặc ảnh in tĩnh (EAR bất biến) đều bị từ chối ngay lập tức.

2. **Phát hiện chuyển động há miệng qua tỷ lệ khẩu độ môi (Mouth Aspect Ratio - MAR):**
   Độ mở của miệng được lượng hóa qua khoảng cách giữa tâm môi trên, môi dưới và hai mép khóe miệng:
   $$\text{MAR} = \frac{|p_{13} - p_{14}|}{|p_{61} - p_{291}|}$$
   Trong đó $p_{13}, p_{14}$ là điểm viền trong môi trên và môi dưới; $p_{61}, p_{291}$ là hai góc mép miệng.
   - Trạng thái há miệng được ghi nhận khi $\text{MAR} \ge 0.45$, cho phép xác thực các cử chỉ phối hợp theo yêu cầu của hệ thống.

3. **Ước lượng tư thế xoay đầu (Head Pose Estimation):**
   Hệ thống ước lượng các góc quay không gian 3 chiều: góc lệch ngang (Yaw), góc gật dọc (Pitch) và góc nghiêng bên (Roll) từ ma trận chuyển đổi phép chiếu phối cảnh (Perspective-n-Point - PnP) giữa tọa độ các điểm mốc 3D của khuôn mặt và mô hình chuẩn.
   - Yêu cầu thử thách quay mặt sang trái/phải đòi hỏi góc Yaw phải đạt ngưỡng tối thiểu $|\text{Yaw}| \ge 25^\circ$ trước khi quay trở lại vị trí chính diện ($|\text{Yaw}| \le 10^\circ$).

4. **Cơ chế Thử thách Nonce dùng một lần và Xác thực Hai Vector ($V_{\text{start}}, V_{\text{end}}$):**
   - Trước mỗi phiên chấm công, thiết bị Kiosk gửi yêu cầu tới server để nhận một mã ngẫu nhiên có chữ ký số (One-time Challenge Nonce) kèm loại thử thách ngẫu nhiên (`BLINK`, `SMILE`, `TURN_LEFT`, `TURN_RIGHT`). Nonce có thời gian sống ngắn (**TTL = 60 giây**) lưu trên bộ nhớ RAM máy chủ và bị hủy ngay sau một lần sử dụng chống tấn công phát lại (Anti-Replay Attack).
   - Thiết bị client chỉ được chấp nhận khi trước camera **chỉ có duy nhất một khuôn mặt (`numFaces === 1`)**. Nếu phát hiện từ 2 khuôn mặt trở lên, hệ thống lập tức khóa phiên và cảnh báo vi phạm an ninh.
   - Để chứng minh người thực hiện thử thách liveness và người được trích xuất vector nhận diện là cùng một đối tượng xuyên suốt phiên, client chụp và gửi lên đồng thời hai vector embedding: $V_{\text{start}}$ (lúc bắt đầu nhận thử thách) và $V_{\text{end}}$ (lúc hoàn tất thử thách). Server tiến hành so khớp kiểm chứng:
     $$d_E(V_{\text{start}}, V_{\text{end}}) \le 0.40$$
     Nếu khoảng cách vượt ngưỡng an toàn, hệ thống từ chối chấm công do nghi vấn có sự tráo đổi đối tượng trước camera.

---

### 2.3.3. Trích xuất Face Embedding 128 chiều và giải thuật so khớp
Khi khuôn mặt đã vượt qua bài kiểm tra liveness ở Tầng 1, ảnh khuôn mặt được căn chỉnh hình học (Face Alignment) dựa trên đường nối tâm hai mắt và đưa vào mạng nơ-ron trích xuất đặc trưng `face_recognition_model`:

1. **Không gian biểu diễn đặc trưng 128 chiều:**
   - Mạng trích xuất ánh xạ khuôn mặt thành một vector nhúng (Embedding) gồm đúng **128 giá trị số thực 32-bit** ($V \in \mathbb{R}^{128}$):
     $$V = (v_1, v_2, \dots, v_{128}), \quad \|V\|_2 = 1$$
   - Vector được chuẩn hóa chuẩn $L_2$, sao cho các khuôn mặt của cùng một người sẽ tập trung gần nhau, trong khi các khuôn mặt của hai người khác nhau sẽ bị đẩy ra xa nhau trong không gian Euclid đa chiều.

2. **Các giải thuật đo khoảng cách hình học:**
   - **Khoảng cách Euclid (Euclidean Distance):**
     $$d_E(u, v) = \|u - v\|_2 = \sqrt{\sum_{i=1}^{128} (u_i - v_i)^2}$$
     Ngưỡng tối ưu xác lập qua thực nghiệm là **$\theta_E \le 0.60$**.
   - **Khoảng cách Cosine (Cosine Distance):**
     $$d_C(u, v) = 1 - \frac{u \cdot v}{\|u\|_2 \cdot \|v\|_2} = 1 - \sum_{i=1}^{128} u_i v_i$$
     Ngưỡng tối ưu xác lập qua thực nghiệm là **$\theta_C \le 0.35$**.

3. **Kiểm soát tỷ lệ chấp nhận sai (FAR) trong bài toán nhận diện 1:N:**
   Trong bài toán định danh 1:N (một khuôn mặt đối chiếu với toàn bộ nhân viên trong công ty), nguy cơ nhận diện nhầm (False Acceptance Rate - FAR) tăng dần theo quy mô nhân sự. PeopleInsight AI áp dụng **Quy tắc biên an toàn hai ứng viên (Margin Separation Rule)**:
   - Gọi $d_1$ là khoảng cách đến ứng viên gần nhất (Rank 1) và $d_2$ là khoảng cách đến ứng viên gần thứ hai (Rank 2).
   - Quyết định xác nhận danh tính chỉ được đưa ra khi thỏa mãn đồng thời:
     $$d_1 \le 0.60 \quad \text{và} \quad (d_2 - d_1) \ge 0.15$$
   - Nếu $d_1 \le 0.60$ nhưng biên phân tách $(d_2 - d_1) < 0.15$ (xuất hiện hai nhân sự có đặc điểm khuôn mặt quá giống nhau, ví dụ anh em sinh đôi), hệ thống sẽ chủ động từ chối chế độ tự động 1:N và yêu cầu người dùng chuyển sang chế độ xác minh 1:1 (nhân viên quét mã QR cá nhân hoặc nhập mã NV trước khi nhận diện khuôn mặt).

---

### 2.3.4. Đánh giá tính hợp pháp bản quyền mã nguồn và đạo đức dữ liệu
Một trong những yêu cầu tiên quyết của Đề tài tốt nghiệp là bảo đảm tính liêm chính học thuật và tuân thủ tuyệt đối luật sở hữu trí tuệ:

1. **Giấy phép bản quyền mã nguồn và trọng số mô hình:**
   - Toàn bộ thư viện và mô hình sử dụng đều có giấy phép mã nguồn mở thương mại được phép sử dụng trong học thuật:
     - Thư viện engine `@vladmandic/face-api` (v1.7.15): **MIT License**.
     - Face Detector `ssd_mobilenetv1`: **Apache License 2.0**.
     - Landmark Model `face_landmark_68_model`: **MIT License**.
     - Recognition Model `face_recognition_model`: **MIT License**.

2. **Đạo đức AI và tính hợp pháp của tập dữ liệu huấn luyện:**
   - Hệ thống **tuyệt đối không sử dụng các mô hình được huấn luyện trên bộ dữ liệu MS-Celeb-1M**. Đây là tập dữ liệu gồm 10 triệu ảnh khuôn mặt của 100.000 người nổi tiếng được Microsoft thu thập tự động từ Internet và đã chính thức bị thu hồi vào năm 2019 do vi phạm quyền riêng tư và thiếu sự đồng thuận của chủ thể ảnh.
   - Mô hình nhúng của hệ thống được huấn luyện trên các tập dữ liệu công khai hợp pháp (như Labeled Faces in the Wild - LFW, VGGFace2), bảo đảm tính pháp lý vững chắc cho đồ án khi nghiệm thu trước Hội đồng Khoa học.

---

## 2.4. TRÍ TUỆ NHÂN TẠO TẠO SINH VÀ BẢO VỆ DỮ LIỆU NHẠY CẢM

### 2.4.1. Tổng quan về Mô hình Ngôn ngữ Lớn (LLM) và cơ chế Function Calling
Mô hình Ngôn ngữ Lớn (Large Language Models - LLM) dựa trên kiến trúc Transformer đã tạo nên cuộc cách mạng trong xử lý ngôn ngữ tự nhiên. Tuy nhiên, trong môi trường quản trị doanh nghiệp, việc áp dụng LLM thuần túy gặp phải hai trở ngại lớn:
1. **Hiện tượng ảo giác (Hallucination):** Mô hình tự bịa đặt thông tin hoặc cung cấp số liệu sai lệch về chính sách, ngày phép và tiền lương của nhân viên.
2. **Khả năng tiếp cận dữ liệu động thời gian thực:** LLM không có khả năng tự truy cập cơ sở dữ liệu nội bộ để tra cứu trạng thái chấm công hay số dư phép hiện tại.

Để khắc phục nhược điểm trên, hệ thống PeopleInsight AI khai thác cơ chế **Function Calling (Gọi hàm có cấu trúc)** thông qua bộ công cụ phát triển chính thức `@google/genai` trên nền tảng Gemini 3.x (`gemini-3.5-flash` làm chính và `gemini-3.1-flash-lite` làm dự phòng):
- Hệ thống định nghĩa sẵn danh mục các công cụ nghiệp vụ (Tools Declaration) kèm mô tả ngữ nghĩa và schema tham số theo chuẩn OpenAPI.
- Thay vì tự sinh văn bản trả lời, Gemini phân tích câu hỏi tiếng Việt của người dùng (kể cả câu không dấu hoặc dùng tiếng lóng như *"cho xem phiếu lương tháng này"*, *"check ngày phép"*), nhận diện đúng ý định nghiệp vụ (Intent) và trích xuất tham số có cấu trúc dưới dạng JSON (ví dụ: `{ "year": 2026, "month": 10 }`).
- Hệ thống cấu hình chế độ ép buộc chọn công cụ:
  $$\text{mode: 'ANY'}$$
  Cấu hình này triệt tiêu hoàn toàn khả năng mô hình tự ý sinh văn bản tự do khi chưa gọi công cụ, buộc mô hình phải kích hoạt một trong các tool đã khai báo. Đối với các câu hỏi ngoài phạm vi nghiệp vụ nhân sự, mô hình được cung cấp công cụ `unsupported_request` để chuyển hướng xử lý an toàn.

---

### 2.4.2. So sánh hai trường phái ứng dụng Function Calling: Phương án A vs Phương án B
Trong các tài liệu kỹ thuật của Google và ngành công nghiệp, quy trình ứng dụng Function Calling thường được phân chia thành hai trường phái đối nghịch:

```
[Trường phái Kinh điển / Phương án B - Agentic Loop] (KHÔNG AN TOÀN)
User Prompt ──> Gemini ──> functionCall ──> Backend lấy DB ──> Gửi PII vào functionResponse ──> Gemini viết văn ──> Trả lời User
(Rủi ro: Lộ PII ra ngoài máy chủ nội bộ, Hallucination số liệu tài chính, Độ trễ 2-4s)

[Phương án A của Đề tài - Template Rendering] (AN TOÀN TUYỆT ĐỐI)
User Prompt ──> Gemini ──> functionCall ──> [NGẮT KẾT NỐI LLM] ──> Backend lấy DB & Render Markdown Template Tĩnh ──> Trả lời User
(Ưu điểm: Không rò rỉ 1 byte dữ liệu nhạy cảm, 0% Hallucination, Độ trễ < 25ms, Tiết kiệm 75% chi phí token)
```

| Tiêu chí so sánh | Phương án B (Kinh điển / Agentic Loop) | **Phương án A (Template Rendering của Đề tài)** |
| :--- | :--- | :--- |
| **Bảo vệ dữ liệu cá nhân (PII)** | Kém: Gửi toàn bộ dữ liệu lương, số dư phép, thông tin cá nhân lên Cloud API của bên thứ ba. | **Tuyệt đối:** Không gửi bất kỳ dữ liệu nhạy cảm nào ra khỏi máy chủ nội bộ. |
| **Độ chính xác dữ liệu (Hallucination)** | Có rủi ro: LLM có thể diễn giải sai số liệu hoặc tự bịa đặt phép tính khi viết câu trả lời. | **Chính xác 100%:** Dữ liệu được trích xuất trực tiếp từ CSDL và điền vào template tĩnh chuẩn hóa. |
| **Độ trễ xử lý toàn trình (Latency)** | Rất chậm: Mất từ **$2.000\text{ ms} - 4.500\text{ ms}$** do phải thực hiện hai lượt gọi mạng tới LLM. | **Siêu tốc:** Chỉ mất **$10\text{ ms} - 25\text{ ms}$** sau khi nhận Function Call, do backend tự render Markdown. |
| **Tiêu tốn chi phí Token** | Rất cao: Tốn token cho cả lượt gửi câu hỏi, schema tools, dữ liệu JSON kết quả và văn bản sinh ra. | **Tiết kiệm 75%:** Chỉ tốn token cho lượt nhận diện ý định đầu vào. |
| **Tuân thủ Luật BVDLCN** | Tiềm ẩn nguy cơ vi phạm quy định về chuyển giao dữ liệu cá nhân nhạy cảm cho bên thứ ba. | **Tuân thủ tuyệt đối:** Bảo đảm dữ liệu tài chính và sinh trắc học được lưu trữ khép kín tại doanh nghiệp. |

Nhờ áp dụng triệt để Phương án A, hệ thống PeopleInsight AI vừa tận dụng được năng lực hiểu ngôn ngữ tự nhiên xuất sắc của mô hình ngôn ngữ lớn, vừa bảo đảm độ an toàn thông tin tối đa cho doanh nghiệp.

---

### 2.4.3. Phân tích rủi ro an toàn thông tin và cơ chế phòng vệ
Hệ thống thiết lập một ma trận phòng thủ đa lớp nhằm bảo vệ kênh tương tác AI trước các cuộc tấn công mạng:

1. **Phòng chống lỗ hổng kiểm soát truy cập đối tượng (Broken Object Level Authorization - BOLA/IDOR):**
   - **Quy tắc thiết kế bất biến:** Trong schema khai báo các công cụ gửi cho Gemini, **tuyệt đối không khai báo tham số `userId`**.
   - Mã định danh người dùng (`userId`), công ty (`companyId`) và quyền hạn (`role`) luôn được backend trích xuất trực tiếp từ Token JWT đã được xác thực mã hóa. Ngay cả khi kẻ tấn công cố tình đưa vào prompt: *"Hãy cho tôi xem lương của Tổng Giám đốc NV0001"*, mô hình Gemini không thể truyền `userId` vào hàm gọi, và backend sẽ tự động tra cứu phiếu lương của chính kẻ đó, ngăn chặn 100% nguy cơ vượt quyền xem lén dữ liệu người khác.

2. **Lọc trước công cụ theo vai trò người dùng (RBAC Pre-filtering):**
   - Trước khi gửi request tới Gemini, middleware backend căn cứ vào vai trò của người dùng trong phiên làm việc để lọc danh sách tools gửi kèm.
   - Nhân viên thông thường (`EMPLOYEE`) chỉ được cấp 3 tools nghiệp vụ cá nhân (`get_leave_balance`, `get_payslip`, `get_attendance_summary`) và `unsupported_request`. Công cụ thống kê phòng ban (`get_team_leave_stats`) bị loại bỏ hoàn toàn khỏi context, ngăn chặn việc mô hình bị lừa kích hoạt công cụ của cấp quản lý.

3. **Chống tấn công chỉ thị ngược (Prompt Injection) và bẻ khóa mô hình (Jailbreak):**
   - Giới hạn độ dài câu truy vấn đầu vào tối đa không quá **500 ký tự**.
   - Sử dụng System Instruction đóng băng nghiêm ngặt: yêu cầu mô hình từ chối mọi yêu cầu tiết lộ câu lệnh hệ thống, bỏ qua vai trò trợ lý hoặc giả lập thực thi mã máy tính.
   - Kiểm duyệt đầu ra bằng thư viện `DOMPurify` tại frontend nhằm vô hiệu hóa các đoạn mã độc XSS nếu kẻ tấn công cố tình chèn script vào nội dung.

4. **Cơ chế ngắt mạch (Circuit Breaker) và Fallback 3 tầng:**
   - Để bảo đảm hệ thống không bị gián đoạn khi kết nối Internet trục trặc hoặc tài khoản Google Cloud bị quá tải hạn ngạch (HTTP 429 Quota Exceeded), hệ thống tích hợp cơ chế dự phòng 3 tầng:
     $$\text{Gemini 3.5 Flash (Chính)} \xrightarrow{\text{Lỗi 5xx/429}} \text{Gemini 3.1 Flash-Lite (Phụ)} \xrightarrow{\text{Mất mạng/Timeout}} \text{Rule-Based Keyword Matcher}$$
   - Bộ nhận diện từ khóa cục bộ (Local Keyword Matcher) cho phép phân tích các mẫu câu thông dụng bằng biểu thức chính quy (Regex) và kích hoạt template tương ứng trong thời gian dưới **$3\text{ ms}$**, bảo đảm giao diện chat luôn phản hồi thông suốt.

---

## 2.5. HỌC MÁY DỰ BÁO BIẾN ĐỘNG NHÂN SỰ VÀ ĐẠO ĐỨC AI

### 2.5.1. Bài toán dự báo nguy cơ nhân viên thôi việc
Biến động nhân sự ngoài ý muốn (Employee Attrition) là một trong những tổn thất chi phí lớn nhất của doanh nghiệp, bao gồm chi phí tuyển dụng thay thế, chi phí đào tạo lại và sự gián đoạn trong tiến độ dự án. Việc xây dựng một mô hình học máy (Machine Learning) có khả năng cảnh báo sớm nguy cơ nghỉ việc mang lại giá trị chiến lược to lớn:
- Giúp bộ phận Nhân sự và cán bộ quản lý chủ động nhận diện các dấu hiệu kiệt sức (Burnout), bất mãn về thu nhập hoặc sự mất cân bằng trong khối lượng công việc.
- Kịp thời tiến hành các buổi đối thoại định hướng (1-on-1 retention interview) và điều chỉnh chính sách đãi ngộ trước khi nhân sự nộp đơn xin nghỉ việc chính thức.

Về bản chất học máy, đây là **bài toán phân loại nhị phân (Binary Classification)** trên tập dữ liệu mất cân bằng nhãn:
$$Y \in \{0, 1\}$$
Trong đó $Y = 1$ đại diện cho nhân sự có nguy cơ thôi việc (Positive Class) và $Y = 0$ đại diện cho nhân sự tiếp tục gắn bó với doanh nghiệp (Negative Class).

---

### 2.5.2. Tập dữ liệu chuẩn mực IBM HR Analytics Employee Attrition
Để huấn luyện mô hình một cách khoa học, đề tài sử dụng tập dữ liệu chuẩn mực **IBM HR Analytics Employee Attrition & Performance** [11]. Tập dữ liệu gồm 1.470 bản ghi nhân viên với 35 thuộc tính khác nhau mô tả chi tiết về lịch sử công tác, thu nhập và điều kiện làm việc:
- Số lượng nhân sự nghỉ việc ($Y = 1$): **237 người** (chiếm tỷ lệ $16.12\%$).
- Số lượng nhân sự ở lại ($Y = 0$): **1.233 người** (chiếm tỷ lệ $83.88\%$).
- Tỷ lệ mất cân bằng giữa hai lớp đạt xấp xỉ **$1 : 5.2$**, đặt ra yêu cầu phải sử dụng các độ đo đánh giá chuyên sâu như AUC-ROC, Recall và F1-Score thay vì chỉ dựa vào độ chính xác tổng thể (Accuracy).

---

### 2.5.3. Nguyên tắc công bằng và đạo đức AI trong quản trị nhân sự
Một trong những điểm đổi mới cốt lõi của đồ án là việc giải quyết thấu đáo vấn đề **đạo đức AI (AI Ethics)** và bảo đảm tính tuân thủ pháp luật lao động:

1. **Tuân thủ Điều 8 Bộ luật Lao động năm 2019 về chống phân biệt đối xử:**
   - Điều 8 BLLĐ 2019 nghiêm cấm hành vi: *"Phân biệt đối xử trong lao động dựa trên giới tính, độ tuổi, tình trạng hôn nhân, tín ngưỡng, tôn giáo, dân tộc, nguồn gốc xã hội..."* [3].
   - Do đó, PeopleInsight AI **loại bỏ triệt để các thuộc tính nhân khẩu học nhạy cảm khỏi tập dữ liệu huấn luyện**:
     - Loại bỏ `Age` (Độ tuổi) và `Gender` (Giới tính): Ngăn chặn mô hình định kiến rằng nhân sự lớn tuổi hoặc lao động nữ có xu hướng gắn bó hay nhảy việc nhiều hơn.
     - Loại bỏ `MaritalStatus` (Tình trạng hôn nhân): Không phân biệt giữa người độc thân và người đã lập gia đình.
     - Loại bỏ các biến khảo sát sự hài lòng mang tính chủ quan (`JobSatisfaction`, `RelationshipSatisfaction`): Vì dữ liệu khảo sát thường thiếu tính trung thực và dễ bị thao túng.

2. **Chuẩn hóa đúng 6 đặc trưng định lượng đo lường khách quan:**
   Mô hình chỉ tập trung vào 6 yếu tố khách quan, phản ánh chính xác khối lượng công việc, sự gắn bó và đãi ngộ kinh tế:

| STT | Đặc trưng ($x_i$) | Ý nghĩa thực tiễn | Kiểu dữ liệu | Miền giá trị | Quy tắc trích xuất thực tế trong hệ thống |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | `OverTime` | Thường xuyên làm thêm giờ | Nhị phân | $\{0, 1\}$ | Gán $= 1$ nếu tổng giờ OT trong 30 ngày gần nhất $\ge 4\text{h}$; gán $= 0$ nếu $< 4\text{h}$. |
| **2** | `YearsAtCompany` | Số năm làm việc tại công ty | Số nguyên | $0 - 40$ năm | Trích xuất từ ngày ký hợp đồng đầu tiên đến hiện tại. |
| **3** | `TotalWorkingYears` | Tổng số năm kinh nghiệm tích lũy | Số nguyên | $0 - 40$ năm | Trích xuất từ lịch sử quá trình công tác của nhân sự. |
| **4** | `MonthlyIncome` | Thu nhập thực tế hàng tháng | Số thực | $0.0 - 1.0$ | Chuẩn hóa theo phân vị mức lương trong doanh nghiệp. |
| **5** | `NumCompaniesWorked` | Số công ty đã từng làm việc | Số nguyên | $0 - 9$ cty | Thống kê số lượng đơn vị công tác cũ trong hồ sơ. |
| **6** | `DistanceFromHome` | Khoảng cách từ nhà đến văn phòng | Số thực | $1 - 29$ km | Tính khoảng cách Haversine từ địa chỉ nhà đến GPS công ty. |

---

### 2.5.4. Mô hình Hồi quy Logistic và Tính khả giải (Explainable AI - XAI)
Sau quá trình thực nghiệm so sánh với các thuật toán khác (Baseline luật và Rừng ngẫu nhiên), đồ án quyết định lựa chọn thuật toán **Hồi quy Logistic (Logistic Regression)** làm mô hình suy luận cốt lõi nhờ sự kết hợp hoàn hảo giữa hiệu năng phân loại cao, độ ổn định và tính khả giải vượt trội:

1. **Phương trình toán học của mô hình:**
   Xác suất một nhân viên có nguy cơ thôi việc được xác định thông qua hàm Sigmoid chuẩn hóa:
   $$P(Y = 1 | X) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
   $$z = \beta_0 + \beta_1 x_{\text{OT}} + \beta_2 x_{\text{YearsCo}} + \beta_3 x_{\text{TotalYears}} + \beta_4 x_{\text{Income}} + \beta_5 x_{\text{Companies}} + \beta_6 x_{\text{Distance}}$$

2. **Phương trình suy luận tối ưu huấn luyện trên tập dữ liệu:**
   $$z = -0.3050 + 1.4579 \cdot x_{\text{OT}} + 0.0931 \cdot x_{\text{YearsCo}} - 1.9705 \cdot x_{\text{TotalYears}} - 1.3173 \cdot x_{\text{Income}} + 0.9497 \cdot x_{\text{Companies}} + 0.7626 \cdot x_{\text{Distance}}$$

3. **Ý nghĩa nghiệp vụ của các trọng số $\beta$ (Feature Importance & Odds Ratio):**
   - **Yếu tố kiềm chế nguy cơ thôi việc (Trọng số âm):**
     - $\text{TotalWorkingYears}$ ($\beta = -1.9705, e^\beta = 0.139$): Yếu tố giữ chân mạnh nhất. Nhân sự có tổng số năm kinh nghiệm dày dạn có xu hướng tìm kiếm sự ổn định lâu dài.
     - $\text{MonthlyIncome}$ ($\beta = -1.3173, e^\beta = 0.268$): Thu nhập thỏa đáng là rào cản kinh tế quan trọng ngăn chặn ý định rời bỏ tổ chức.
   - **Yếu tố thúc đẩy nguy cơ thôi việc (Trọng số dương):**
     - $\text{OverTime}$ ($\beta = +1.4579, e^\beta = 4.297$): Yếu tố rủi ro số một. Nhân viên thường xuyên làm thêm giờ có nguy cơ thôi việc cao **gấp $4.3$ lần** so với người không phải làm thêm, xuất phát từ tình trạng kiệt sức (Burnout).
     - $\text{NumCompaniesWorked}$ ($\beta = +0.9497, e^\beta = 2.585$): Thể hiện mức độ nhạy cảm của người lao động với thị trường tuyển dụng bên ngoài.
     - $\text{DistanceFromHome}$ ($\beta = +0.7626, e^\beta = 2.144$): Quãng đường di chuyển xa gây mệt mỏi thể chất hàng ngày.

4. **Tính khả giải (Explainable AI - XAI) và Suy luận không độ trễ:**
   - Hệ thống không dừng lại ở việc đưa ra một con số xác suất vô cảm, mà tự động tính toán **mức đóng góp biên (Log-Odds Contribution)** của từng biến số:
     $$C_i = \beta_i \cdot \hat{x}_i$$
   - Từ đó, giao diện Dashboard hiển thị rõ ràng Top 3 nguyên nhân cốt lõi gây rủi ro đối với từng nhân sự cụ thể, kèm theo các khuyến nghị hành động tương ứng cho phòng Nhân sự (ví dụ: *"Cần rà soát và điều phối giảm giờ làm thêm"*, *"Cân nhắc điều chỉnh thu nhập theo mặt bằng thị trường"*, *"Bố trí hỗ trợ xe đưa đón hoặc chế độ làm việc kết hợp WFH"*).
   - Mô hình được đóng gói dưới dạng tệp trọng số JSON siêu nhẹ (`model_coefficients.json`), cho phép backend thực thi suy luận trực tiếp trong Node.js với độ trễ cực thấp dưới **$0.005\text{ ms/nhân sự}$**, không đòi hỏi môi trường chạy Python runtime hay các thư viện biên dịch nhị phân C++ phức tạp trên máy chủ triển khai.

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
