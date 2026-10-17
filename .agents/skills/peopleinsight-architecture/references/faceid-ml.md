# THAM CHIẾU: FACEID KIOSK 2 TẦNG & MÔ HÌNH ML DỰ BÁO THÔI VIỆC

> **Mục tiêu:** Chuẩn hóa quy trình kỹ thuật sinh trắc học khuôn mặt chống giả mạo theo chuỗi thời gian, bảo mật vector ở tầng ứng dụng, kiểm soát FAR trong nhận diện 1:N, và xây dựng mô hình học máy có khả năng giải thích (XAI) tuân thủ đạo đức AI.

---

## 1. FACEID KIOSK 2 TẦNG (HYBRID BIOMETRICS)

### 1.1 Tầng 1: Client Liveness Detection theo Chuỗi Thời gian (Temporal Sequence)
- **Công nghệ:** `@mediapipe/tasks-vision` (Face Landmarker) chạy trực tiếp trên Client qua Wasm/WebGL (30–60 FPS).
- **Cấu hình MediaPipe bắt buộc:**
  ```javascript
  const faceLandmarkerOptions = {
    baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' },
    runningMode: 'VIDEO',
    numFaces: 1, // BẮT BUỘC = 1: Nếu phát hiện > 1 khuôn mặt trong khung hình -> TỪ CHỐI NGAY
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  };
  ```
- **Kiểm tra Liveness theo Chuỗi Thời gian (Temporal State Machine):**
  > [!CAUTION]
  > Điều kiện kiểm tra tĩnh tại 1 khung hình (như `eyeBlink > 0.5`) sẽ cho qua ảnh của người đang nhắm mắt hoặc ảnh chụp miệng há! Bắt buộc kiểm tra chuỗi chuyển đổi trạng thái sinh lý học:
  1. **Thử thách Chớp mắt (`BLINK_EYES`):**
     - Trạng thái 1: Mắt mở bình thường (`eyeBlinkLeft < 0.2` và `eyeBlinkRight < 0.2`).
     - Trạng thái 2: Chuyển sang nhắm mắt (`eyeBlinkLeft > 0.5` và `eyeBlinkRight > 0.5`).
     - Trạng thái 3: Mở mắt trở lại (`eyeBlink < 0.2`).
     - *Ràng buộc thời gian:* Toàn bộ chu kỳ phải diễn ra trong khoảng **100ms – 800ms** (chu kỳ chớp mắt sinh học tự nhiên).
  2. **Thử thách Há miệng (`OPEN_MOUTH`):**
     - Trạng thái: Miệng đóng (`jawOpen < 0.15`) $\rightarrow$ Há miệng (`jawOpen > 0.5`) $\rightarrow$ Khép miệng lại (`jawOpen < 0.2`).
  3. **Thử thách Quay đầu (`TURN_HEAD`):**
     - Dựa vào ma trận chuyển đổi (Transformation Matrix) để trích xuất góc quay `Yaw`:
     - Trạng thái: Nhìn chính diện ($|\text{Yaw}| < 10^\circ$) $\rightarrow$ Quay lệch góc theo yêu cầu ($|\text{Yaw}| \ge 25^\circ$) $\rightarrow$ Quay về chính diện ($|\text{Yaw}| < 10^\circ$).

### 1.2 Gắn kết Thử thách (Challenge) với Kết quả Điểm danh & Chống Tấn công Phát lại
1. **Cấp phát Thử thách (`POST /api/kiosk/challenge`):**
   - **Xác thực Kiosk:** Client gửi Kiosk Token thô qua TLS Header (`x-kiosk-token`). Server băm SHA-256 để so sánh với `companies.kioskDevices[].tokenHash`.
   - **Rate Limit:** Tối đa 20 requests/phút/kiosk.
   - **Single-use Nonce:** Server sinh `nonce` ngẫu nhiên có chữ ký HMAC, lưu tạm trong bộ nhớ RAM (In-memory Map có TTL 60 giây, tự động hủy). *Không tạo collection mới để bảo toàn đúng 11 Collections.*
2. **Nộp kết quả Điểm danh (`POST /api/attendance/kiosk-checkin`):**
   - Nộp kèm `nonce`. Server kiểm tra và **xóa ngay `nonce` khỏi bộ nhớ sau lần dùng đầu tiên** để chống Replay Attack.
   - **Cơ chế xác thực 2 Vector:** Client gửi kèm 2 vector embedding:
     * $V_{\text{start}}$: Vector trích xuất tại khung hình bắt đầu thử thách.
     * $V_{\text{end}}$: Vector trích xuất tại khung hình kết thúc thử thách.
     * Server kiểm tra: Khoảng cách giữa 2 vector $d(V_{\text{start}}, V_{\text{end}}) \le 0.40$ (chứng minh cùng 1 người xuyên suốt thử thách) kèm dữ liệu vết thời gian của blendshapes.
3. **Thừa nhận Giới hạn trong Threat Model:**
   * Vì bước Liveness diễn ra tại Client, cơ chế này chỉ đáng tin cậy khi thiết bị Kiosk là **thiết bị tin cậy (Trusted Hardware)** do doanh nghiệp quản trị, đặt tại khu vực có giám sát (phòng bảo vệ / quầy lễ tân).

### 1.3 Quy trình Đăng ký Khuôn mặt (Biometric Enrollment) & Phiên bản Template
- **Thẩm quyền thực hiện:** Bắt buộc thực hiện **trực tiếp với sự giám sát của Quản lý Nhân sự (HR Manager)** tại văn phòng. Tuyệt đối **KHÔNG** cho phép nhân viên tự upload ảnh từ xa (chống hành vi nạp ảnh người khác vào tài khoản của mình).
- **Quy trình lấy mẫu:**
  * Lấy từ **3 đến 5 mẫu khuôn mặt** ở các góc độ và điều kiện ánh sáng chuẩn hóa (chính diện, nghiêng nhẹ $\pm 10^\circ$, bình thường, cười nhẹ).
  * Kiểm tra chất lượng mẫu: Bắt buộc không đeo khẩu trang, không đeo kính đen, độ sắc nét và độ sáng đạt chuẩn.
- **Bằng chứng chấp thuận (Consent Evidence):**
  * Lưu vết pháp lý theo Luật BVDLCN: Lưu `consentGivenAt` (thời điểm ký xác nhận), `consentPolicyVersion` (phiên bản điều khoản đồng ý thu thập dữ liệu sinh trắc học).
- **Quản lý Phiên bản Template (`faceTemplates`):**
  * Lưu rõ metadata trong schema: `modelId: 'face-api-ssd-mobilenetv1'`, `modelVersion: '1.0'`, `dim: 128`.
  * Nếu hệ thống nâng cấp model nhận diện (ví dụ sang MobileFaceNet), toàn bộ vector cũ bị đánh dấu hết hạn (`isDeprecated: true`) và yêu cầu nhân viên lấy mẫu lại.
- **Hủy bỏ sinh trắc học vĩnh viễn:**
  * Xóa hoàn toàn bản ghi trong `faceTemplates` cả khi **nhân viên rút lại sự đồng ý** LẪN khi **nhân viên chấm dứt hợp đồng lao động / nghỉ việc**.

### 1.4 Bảo vệ Vector như một "Mật khẩu Sinh trắc học"
- **Thực tế khoa học:** Vector embedding là dữ liệu cực kỳ nhạy cảm. Các nghiên cứu gần đây (Feature Inversion Attacks) chứng minh vector có thể bị dùng để dựng lại ảnh thô đủ để đánh lừa một số hệ thống nhận diện. Do đó, coi vector có mức độ nhạy cảm ngang bằng mật khẩu.
- **Mã hóa tầng ứng dụng (Application-Level Encryption - ALE):**
  * Cơ chế mã hóa vật lý của Atlas (Encryption at Rest) chỉ bảo vệ khi ổ đĩa bị tháo trộm.
  * Trường `descriptors` trong collection `faceTemplates` bắt buộc được **mã hóa bằng thuật toán AES-256-GCM** tại backend trước khi lưu vào MongoDB, sử dụng khóa bí mật `FACE_TEMPLATE_AES_KEY` từ biến môi trường. Vector chỉ được giải mã tạm thời trong RAM khi thực hiện đối chiếu.
- **Bảo vệ Vết kiểm toán & Log:**
  * **CẤM TUYỆT ĐỐI** ghi vector embedding vào `auditLogs`, `attendanceLogs` hay log lỗi. Chỉ lưu điểm tương đồng (matching score) hoặc khoảng cách (distance).
- **Khóa tạm thời chống Brute-force:** Kiosk tự động khóa tạm thời 3 phút nếu có 5 lần nhận diện thất bại liên tiếp.

### 1.5 Kiểm soát Nhận diện 1:N và Đánh giá Chỉ số Thực nghiệm
- **Nguy cơ bùng nổ FAR trong bài toán 1:N:**
  * Trong bài toán 1:N (xác định danh tính từ $N$ nhân viên toàn công ty), xác suất nhận diện sai tăng xấp xỉ theo số lượng nhân viên:
    $$\text{FAR}_{\text{system}} \approx 1 - (1 - \text{FAR}_{1:1})^N \approx N \times \text{FAR}_{1:1}$$
  * Do đó, thử nghiệm trên 15–20 người không phản ánh rủi ro của công ty quy mô 200–300 người.
- **Quy tắc Biên chênh lệch 2 Ứng viên (Two-candidate Margin Rule):**
  * Khi quét tìm người khớp nhất: Ứng viên số 1 phải có khoảng cách $d_1 \le \text{Threshold}$ (ví dụ Euclid $\le 0.60$).
  * Đồng thời khoảng cách của ứng viên số 2 ($d_2$) phải thỏa mãn biên phân tách an toàn:
    $$d_2 - d_1 \ge \text{Margin} \quad (\text{với } \text{Margin} \ge 0.15)$$
  * Nếu $d_2 - d_1 < \text{Margin}$ (hai khuôn mặt quá giống nhau, nguy cơ nhầm lẫn cao), hệ thống từ chối xác thực 1:N và chuyển sang chế độ xác minh 1:1.
- **Chế độ Xác minh 1:1 Dự phòng:**
  * Cho phép nhân viên quét mã QR nhân viên hoặc nhập mã nhân viên trước, sau đó camera chỉ xác minh 1:1 (giúp FAR duy trì ở mức tối thiểu bất kể quy mô công ty).
- **Chuẩn báo cáo Thực nghiệm (ISO/IEC 30107-3):**
  * Nhận diện: Báo cáo đường cong ROC, FAR và FRR theo cả kịch bản 1:N và 1:1 (mô phỏng $N$ lớn bằng các cặp Impostor).
  * Liveness: Báo cáo chỉ số **APCER** (Attack Presentation Classification Error Rate) và **BPCER** (Bona Fide Presentation Classification Error Rate) theo 3 kịch bản tấn công: (1) Ảnh in màu 2D, (2) Ảnh trên màn hình điện thoại/iPad, (3) Video phát lại.
  * Ngưỡng thực tế chính thức sẽ được chốt qua đợt thực nghiệm mở rộng tại Tuần 3.

---

## 2. MÔ HÌNH HỌC MÁY DỰ BÁO THÔI VIỆC (TURNOVER PREDICTION)

### 2.1 Bộ 6 Đặc trưng Chuẩn mực & Ánh xạ Dữ liệu
Mô hình được huấn luyện trên tập dữ liệu chuẩn **IBM HR Analytics Employee Attrition**:

| Đặc trưng | Kiểu dữ liệu | Ý nghĩa | Cách ánh xạ thực tế trong PeopleInsight AI |
| :--- | :---: | :--- | :--- |
| **`OverTime`** | Nhị phân (0/1) | Làm thêm giờ | **Mục tiêu:** Tổng giờ OT tháng gần nhất $\ge 4\text{h}$ gán $= 1$, ngược lại $= 0$. (Tương đồng tỷ lệ trong dữ liệu IBM: ~28.3% nhân viên có làm OverTime; tỷ lệ nghỉ việc thực tế trong IBM là ~16.1%). |
| **`YearsAtCompany`** | Số thực | Số năm làm việc tại công ty | Tính từ ngày bắt đầu (`effectiveFrom`) của hợp đồng đầu tiên đến thời điểm hiện tại. |
| **`TotalWorkingYears`**| Số thực | Tổng số năm kinh nghiệm | Tính từ tổng kinh nghiệm làm việc ghi nhận trong hồ sơ nhân viên. |
| **`MonthlyIncome`** | Số thực (0 - 1) | Thu nhập hàng tháng | **Chỉ dùng chuẩn hóa Phân vị (Quantile/Percentile) trong nội bộ công ty.** Tuyệt đối không dùng Min-Max Scaling (vì lương Ban Giám đốc sẽ làm lệch toàn bộ thang đo của nhân viên). |
| **`NumCompaniesWorked`**| Số nguyên | Số công ty từng làm trước đó | Lấy từ lịch sử công tác khai báo trong hồ sơ nhân sự. |
| **`DistanceFromHome`** | Số thực | Khoảng cách từ nhà đến công ty | **Lấy theo số km nhân viên tự khai báo khi ký hợp đồng.** Tuyệt đối không thu thập tọa độ GPS nhà riêng để bảo vệ quyền riêng tư cá nhân. |

### 2.2 Đạo đức AI & Thừa nhận Trung thực về Thiên kiến
- **Loại bỏ biến nhạy cảm:** Loại bỏ hoàn toàn `Gender` (giới tính), `Age` (tuổi tác), `MaritalStatus` (tình trạng hôn nhân) và các khảo sát chủ quan (JobSatisfaction, EnvironmentSatisfaction) để tuân thủ Điều 8 Bộ luật Lao động 2019.
- **Thừa nhận hạn chế (Học thuật trung thực):**
  * Việc loại bỏ `Age` chưa thể triệt tiêu 100% thiên kiến tuổi tác, vì đặc trưng `TotalWorkingYears` và `YearsAtCompany` vẫn có tương quan thuận (correlation) nhất định với độ tuổi nhân viên.
  * Dữ liệu IBM là dữ liệu tổng hợp (synthetic) dựa trên văn hóa doanh nghiệp Mỹ; việc áp dụng vào doanh nghiệp Việt Nam cần giai đoạn thu thập dữ liệu nội địa để tinh chỉnh (fine-tuning).

### 2.3 Xử lý Dữ liệu Lệch lớp (Imbalanced Data) & Đánh giá Khoa học
- **Mất cân bằng lớp:** Dữ liệu IBM có tỷ lệ nghỉ việc chỉ ~16.1% (nhãn 1 thiểu số). Bắt buộc xử lý:
  * Thiết lập trọng số lớp: `class_weight='balanced'` trong Scikit-learn (hoặc SMOTE trong bước huấn luyện).
  * Áp dụng **Stratified 5-Fold Cross-Validation** để chống overfitting.
- **Chỉ số đánh giá:** Không chỉ báo cáo ROC-AUC (dễ lạc quan giả tạo khi lệch lớp), bắt buộc báo cáo thêm **PR-AUC (Precision-Recall AUC)**, F1-score và độ nhạy (Recall) đối với lớp nhân viên có nguy cơ nghỉ việc.
- **Hiệu chỉnh xác suất (Probability Calibration):** Dùng Isotonic Regression hoặc Platt Scaling để xác suất dự báo phản ánh đúng tần suất thực tế.
- **Ngưỡng cảnh báo rủi ro:** Không hard-code ngưỡng $0.7$. Ngưỡng cảnh báo được xác định theo **Top-k% nhân viên có nguy cơ cao nhất** hoặc điểm cắt tối ưu trên đường cong Precision-Recall.

### 2.4 Khả năng Giải thích Mô hình (Explainable AI - XAI)
- Không chỉ dựa vào Feature Importance toàn cục của Random Forest (vốn dễ thiên lệch về các đặc trưng có nhiều giá trị phân tách).
- Sử dụng **Permutation Importance** và **SHAP Values** để đánh giá tầm quan trọng thực tế.
- **Giải thích cục bộ theo từng nhân viên (Local Explanation):**
  * Với mô hình Logistic Regression, giải thích trực tiếp theo đóng góp của từng đặc trưng $w_i \cdot x_i$.
  * Dashboard hiển thị nguyên nhân cụ thể cho HR Manager: Ví dụ nhân viên có nguy cơ cao do *"Mức thu nhập nằm ở phân vị thấp (20%) kết hợp số giờ OT vượt mức trong tháng"*.

### 2.5 Kế hoạch Dự phòng Triển khai Node.js
- Mô hình chính: Logistic Regression (xuất trọng số JSON) và Random Forest (xuất ONNX).
- **Phương án dự phòng:** Nếu `onnxruntime-node` gặp lỗi không tương thích nhị phân trên môi trường Render Linux container:
  * Xuất toàn bộ cấu trúc cây quyết định của Random Forest ra file JSON và tự viết hàm duyệt cây suy luận bằng JavaScript thuần trong Node.js (không phụ thuộc C++ binary).
  * Hoặc ưu tiên dùng Logistic Regression nếu độ chênh lệch AUC so với Random Forest không đáng kể ($< 0.03$).
- **Thời gian suy luận (Latency):** Sẽ được đo đạc chính xác qua thực nghiệm k6 và micro-benchmark, không đưa ra con số lý thuyết phỏng đoán.
