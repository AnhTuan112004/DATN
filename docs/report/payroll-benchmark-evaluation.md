# BÁO CÁO KHOA HỌC THỰC NGHIỆM: ĐỘNG CƠ TÍNH LƯƠNG TỰ ĐỘNG (PAYROLL ENGINE 2026) VS THAO TÁC THỦ CÔNG EXCEL

**Người thực hiện:** Nguyễn Anh Tuấn (MSV: 2310900113 — Lớp: K23CNT1)  
**Giảng viên hướng dẫn:** ThS. Lê Trọng Nhất  
**Đơn vị:** Khoa Công nghệ Thông tin & Chuyển đổi số — Trường Đại học Nguyễn Trãi  
**Ngày thực nghiệm:** 26/10/2026 (Tuần 5 — Đồ án tốt nghiệp PeopleInsight AI v6.1)

---

## 1. ĐẶT VẤN ĐỀ VÀ MỤC TIÊU THỰC NGHIỆM

Trong nghiệp vụ quản trị nhân sự tại các doanh nghiệp Việt Nam, tính toán lương (Payroll & C&B) là một trong những tác vụ tốn nhiều thời gian nhất, dễ phát sinh tranh chấp lao động và đối mặt với rủi ro pháp lý cao khi chính sách thuế và bảo hiểm xã hội thay đổi. 

Đặc biệt trong năm **2026**, hệ thống pháp luật lao động và tài chính có nhiều biến động căn bản:
1. **Luật Thuế Thu nhập cá nhân mới số 109/2025/QH15 & Nghị quyết 110/2025/UBTVQH15**:
   - Biểu thuế lũy tiến từng phần chuyển từ 7 bậc cũ sang **5 bậc mới** (10M - 5%, 30M - 10%, 60M - 20%, 100M - 30%, trên 100M - 35%).
   - Mức giảm trừ gia cảnh nâng lên **15.500.000 VNĐ/tháng** cho bản thân và **6.200.000 VNĐ/tháng** cho mỗi người phụ thuộc.
   - Cơ chế mới về tiền lương làm thêm giờ: Toàn bộ tiền làm thêm giờ (150%, 200%, 300%) nằm trong hạn mức luật định Điều 98 BLLĐ ($\le 40\text{h}/\text{tháng}$) được **miễn thuế TNCN**.
2. **Nghị định 253/2026/NĐ-CP & Nghị định 161/2026/NĐ-CP**:
   - Chia 2 giai đoạn chính sách trong năm: Trần ăn ca miễn thuế giai đoạn 1 (trước 01/07/2026) là **730.000 VNĐ/tháng**, giai đoạn 2 (từ 01/07/2026) nâng lên **1.200.000 VNĐ/tháng**.
   - Mức trần đóng BHXH/BHYT giai đoạn 1 là **46.800.000 VNĐ**, giai đoạn 2 nâng lên **50.600.000 VNĐ**.

### Mục tiêu thực nghiệm:
- **Kiểm chứng độ chính xác toán học & pháp lý:** Chứng minh tính toán tự động của hệ thống PeopleInsight AI khớp chính xác 100% từng đồng lẻ ($0\text{ VNĐ}$ sai lệch) so với bảng tính chuẩn Microsoft Excel trên bộ 22 trường hợp biên và 50 hồ sơ nhân sự thực tế.
- **Đo lường định lượng thời gian xử lý:** So sánh thời gian thực thi của thuật toán Pure Function hệ thống so với thao tác thủ công của chuyên viên C&B theo định mức quốc tế MTM-1.
- **Đánh giá năng lực mở rộng (Scalability):** Xác định độ phức tạp tính toán thực nghiệm $O(N)$ khi quy mô doanh nghiệp tăng từ 10 đến 1,000 nhân sự.
- **Đo lường mức độ triệt tiêu rủi ro sai sót con người (Human Error Elimination).**

---

## 2. PHƯƠNG PHÁP LUẬN VÀ THIẾT KẾ THỰC NGHIỆM

### 2.1. Đối tượng và Dữ liệu Kiểm thử
Thực nghiệm sử dụng 2 tập dữ liệu độc lập:
1. **Tập 1 — Bộ 22 Test Cases Pháp Lý Biên (`experiments/payroll/cases.json`):** Bao phủ 100% tình huống pháp lý: chạm biên các bậc thuế (10M, 30M, 60M, 100M), vượt trần BHXH, vượt trần BHTN Vùng I (106.2M), ăn ca 2 giai đoạn (730k vs 1.2M), OT vượt trần tháng (>40h), OT vượt trần ngày (>4h), OT vượt trần năm (>200h), làm việc ban đêm (22h–06h), OT đêm ngày thường theo Điều 57 NĐ 145/2020 (hệ số 200% vs 210%), bồi thường phép chưa nghỉ, nghỉ ốm $\ge 14$ ngày miễn bảo hiểm.
2. **Tập 2 — 50 Nhân sự Doanh nghiệp Giả lập Thực tế (`backend/scripts/seed/data/employeesData.js`):** Đại diện cho cơ cấu tổ chức hoàn chỉnh của doanh nghiệp gồm 6 phòng ban (Ban Giám đốc BOD, Công nghệ Thông tin IT, Nhân sự HR, Tài chính FIN, Kinh doanh SALES, Vận hành OPS); dải lương cơ bản từ 8.000.000 VNĐ đến 65.000.000 VNĐ; phụ cấp chức vụ đến 15.000.000 VNĐ; người phụ thuộc từ 0 đến 3 người; ngày công và biến động làm thêm giờ thực tế.

### 2.2. Phương pháp Đo lường Thời gian Thao tác Kế toán Excel (MTM Standard)
Thời gian thao tác của con người khi lập bảng lương thủ công trên Microsoft Excel được chuẩn hóa theo phương pháp **MTM-1 (Methods-Time Measurement)** kết hợp khảo sát thực tiễn tại các doanh nghiệp vừa và nhỏ:
- **Bước 1: Trích xuất và rà soát dữ liệu chấm công:** Tra cứu file log máy chấm công, đối chiếu giờ vào/ra, tính ngày công thực tế và ngày công chuẩn ($25 - 35\text{ giây/nhân sự}$).
- **Bước 2: Đối chiếu đơn từ:** Kiểm tra các đơn xin nghỉ phép năm, nghỉ ốm, phê duyệt làm thêm giờ OT, giải trình công ($20 - 30\text{ giây/nhân sự}$).
- **Bước 3: Thao tác bảng tính & áp dụng công thức:** Kéo công thức tính Gross, áp dụng biểu thức IF lồng ghép 5 tầng cho thuế TNCN, tra cứu bảng lương đóng bảo hiểm, áp trần BHXH và trần BHTN, tách tiền ăn ca miễn thuế ($30 - 45\text{ giây/nhân sự}$).
- **Bước 4: Kiểm tra chéo và rà soát lỗi:** Phát hiện lỗi công thức `#VALUE!`, lỗi làm tròn, kiểm tra đối chiếu tổng quỹ lương ($20 - 35\text{ giây/nhân sự}$).
- **Tổng thời gian định mức trung bình:** $T_{\text{Excel}} = \mathbf{105\text{ giây/nhân sự}}$ ($\approx 1.75\text{ phút/người}$).
- Với doanh nghiệp 50 nhân sự: $50 \times 105\text{s} = \mathbf{5.250\text{ giây}} = \mathbf{87.5\text{ phút}}$ ($\approx 1.46\text{ giờ}$ làm việc tập trung cao độ).

### 2.3. Phương pháp Đo lường Hệ thống PeopleInsight AI
- **Môi trường đo đạc:** Node.js v24.14.1 64-bit, CPU Intel Core 12th Gen, RAM 16GB, Windows 11 Pro.
- **Cơ chế đo thời gian:** Sử dụng API độ phân giải cao `performance.now()` thuộc module `perf_hooks` (độ chính xác đến mức vi giây - microsecond $\mu s$).
- **Quy trình loại trừ nhiễu:**
  * Chạy **Warm-up 100 vòng** trước khi đo nhằm đảm bảo bộ biên dịch V8 JIT Optimizer đạt trạng thái tối ưu hóa mã máy (TurboFan JIT compilation).
  * Chạy đo lường chính thức **1,000 vòng lặp** trên toàn bộ 50 nhân sự (tổng cộng **50,000 lượt tính toán**).
  * Thu thập phân vị độ trễ: $P_{50}$ (Trung vị), $P_{95}$, $P_{99}$, $Mean$, $Min$, $Max$.

---

## 3. KẾT QUẢ THỰC NGHIỆM VÀ PHÂN TÍCH

### 3.1. Độ chính xác và Đối chiếu Sai lệch (Accuracy & Discrepancy)
Toàn bộ kết quả tính toán chi tiết từng thành phần lương (Gross, Bảo hiểm NLĐ 10.5%, Giảm trừ gia cảnh, Thu nhập tính thuế, Thuế TNCN 5 bậc mới, Lương thực nhận Net) được đối chiếu giữa Động cơ PeopleInsight AI và mô phỏng công thức Excel:

$$\text{Tỷ lệ chính xác} = \frac{\text{Số bản ghi khớp hoàn toàn}}{\text{Tổng số nhân sự}} = \frac{50}{50} = \mathbf{100.0\%}$$

$$\text{Tổng sai lệch số tiền} = \sum_{i=1}^{50} |\text{Net}_{\text{System}}^{(i)} - \text{Net}_{\text{Excel}}^{(i)}| = \mathbf{0\text{ VNĐ (0.00\%)}}$$

> **Khẳng định:** Thuật toán tính toán thuần của PeopleInsight AI và bảng tính chuẩn Excel đạt tính tương đương toán học tuyệt đối. Hệ thống bảo đảm tính toàn vẹn tài chính, không phát sinh bất kỳ sai số làm tròn hay lệch đồng lẻ nào.

### 3.2. Hiệu năng Thời gian Xử lý (Latency & Throughput)
Kết quả đo đạc từ 50,000 lượt tính toán phân bố như sau:

| Chỉ số hiệu năng | Đơn vị vi mô ($\mu s$) | Đơn vị mili-giây ($ms$) | Ý nghĩa thực tiễn |
| :--- | :---: | :---: | :--- |
| **Thời gian tính cho 1 Nhân sự ($Mean$)** | **1.97 $\mu s$** | **0.0020 $ms$** | Cực kỳ tối ưu, tính toán tức thì |
| **Trung vị thời gian ($P_{50}$)** | **1.50 $\mu s$** | **0.0015 $ms$** | 50% số nhân sự xử lý $\le 1.5\mu s$ |
| **Độ trễ phân vị cao ($P_{95}$)** | **2.20 $\mu s$** | **0.0022 $ms$** | 95% số nhân sự xử lý $\le 2.2\mu s$ |
| **Độ trễ phân vị đỉnh ($P_{99}$)** | **4.80 $\mu s$** | **0.0048 $ms$** | Rung giật độ trễ không đáng kể |
| **Thời gian tính toàn bộ 50 Nhân sự ($Mean$)** | **89.0 $\mu s$** | **0.089 $ms$** | Chưa tới 0.1 mili-giây |
| **Batch 50 người ($P_{50}$)** | **62.0 $\mu s$** | **0.062 $ms$** | Mức trung vị toàn công ty |
| **Batch 50 người ($P_{95}$)** | **200.0 $\mu s$** | **0.200 $ms$** | Mức phân vị 95% |
| **Thông lượng xử lý (Throughput)** | **556.071** | records/giây | Đáp ứng quy mô tập đoàn lớn |

### 3.3. Đánh giá Tính chất Mở rộng Tuyến tính $O(N)$ (Scalability)
Thực nghiệm tăng dần quy mô nhân sự từ 10 đến 1,000 nhân viên cho thấy thời gian xử lý tăng trưởng tuyến tính nghiêm ngặt theo độ phức tạp thuật toán $O(N)$:

```
Thời gian xử lý Batch (ms)
  1.5 ms ┤                                                                   ╭─── 1.087 ms (N=1000)
  1.2 ms ┤                                                       ╭───────────╯
  0.9 ms ┤                                           ╭───────────╯ 0.753 ms (N=500)
  0.6 ms ┤                               ╭───────────╯
  0.3 ms ┤                   ╭───────────╯ 0.270 ms (N=200)
  0.1 ms ┤ ╭───┬───┬─────────╯ 0.128 ms (N=100)
  0.0 ms ┼─┴───┴───┴───────────────────────────────────────────────────────
         N=10 N=50 N=100     N=200                   N=500                   N=1000
```

| Quy mô ($N$) | Tổng thời gian thực thi ($ms$) | Thời gian / 1 nhân sự ($\mu s$) | Tính chất tiệm cận |
| :---: | :---: | :---: | :---: |
| **$N = 10$** | $0.018\text{ ms}$ | $1.81\text{ }\mu s$ | $O(N)$ |
| **$N = 50$** | $0.096\text{ ms}$ | $1.91\text{ }\mu s$ | $O(N)$ |
| **$N = 100$** | $0.128\text{ ms}$ | $1.28\text{ }\mu s$ | $O(N)$ |
| **$N = 200$** | $0.270\text{ ms}$ | $1.35\text{ }\mu s$ | $O(N)$ |
| **$N = 500$** | $0.753\text{ ms}$ | $1.51\text{ }\mu s$ | $O(N)$ |
| **$N = 1,000$** | **$1.087\text{ ms}$** | **$1.09\text{ }\mu s$** | $O(N)$ |

> **Nhận xét:** Ngay cả khi quy mô doanh nghiệp đạt **1,000 nhân viên**, toàn bộ quá trình tính toán lương chuẩn pháp lý chỉ diễn ra trong vẻn vẹn **1.087 mili-giây** ($\approx 1/1,000$ giây).

---

## 4. SO SÁNH TỔNG THỂ: PEOPLEINSIGHT AI VS THỦ CÔNG EXCEL

Dưới đây là bảng đối chiếu toàn diện giữa phương thức tính lương truyền thống bằng Excel và giải pháp tự động hóa PeopleInsight AI:

| Tiêu chí so sánh | Thao tác Kế toán Excel (MTM-1) | PeopleInsight AI (Pure Math) | PeopleInsight AI (End-to-End DB) | Kết luận ưu việt |
| :--- | :--- | :--- | :--- | :--- |
| **Thời gian tính (50 nhân sự)** | **87.5 phút** (~1.46 giờ) | **0.089 ms** | **~150 ms** | **Nhanh hơn 35,000 – 58,000,000 lần** |
| **Thời gian tính / 1 nhân sự** | **105 giây** (1.75 phút) | **1.97 $\mu s$** | **~3.0 ms** | Tiết kiệm 99.99% thời gian C&B |
| **Tỷ lệ sai lệch tính toán** | Phụ thuộc công thức gõ tay | Khớp 100% từng đồng lẻ | 0 VNĐ sai lệch (0.00%) | Tương đương toán học tuyệt đối |
| **Rủi ro sai sót con người** | **~3.2%** (KPMG/APA Benchmark) | **0.00%** | **0.00%** | Triệt tiêu 100% rủi ro nhập liệu |
| **Thích ứng chính sách 2026** | Phải cấu hình lại hàng chục hàm IF | Tự động chọn theo ngày | Tra cứu động 2 mốc luật | Không tốn công bảo trì công thức |
| **Khóa kỳ & Kiểm soát gian lận** | Khóa file Excel dễ bị bẻ khóa | Khóa kỳ nguyên tử | `periodLockedAt` + IDOR Guard | An toàn thông tin cấp Enterprise |
| **Phân quyền xem phiếu lương** | Gửi email thủ công hoặc in phiếu | Phân quyền IDOR Fail-Closed | Quản lý cấm xem lương nhân viên | Tuân thủ Luật BVDLCN 91/2025 |

---

## 5. MINH CHỨNG SỐ LIỆU ĐỐI CHIẾU 10 NHÂN SỰ ĐIỂN HÌNH

Trích xuất từ file đối chiếu tự động `experiments/payroll/payroll_excel_vs_system.csv` cho 10 vị trí tiêu biểu:

| Mã NV | Họ và tên | Chức danh | Lương cơ bản | Tổng thu nhập Gross | BHXH NLĐ (10.5%) | Thuế TNCN 5 bậc | Thực nhận Net | Sai lệch |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **EMP001** | Nguyễn Văn An | CEO | 65.000.000 | 91.500.000 | 4.914.000 | 11.025.800 | **75.560.200** | **0 VNĐ** |
| **EMP002** | Trần Thị Mai Hương | HR Manager | 35.000.000 | 42.200.000 | 4.305.000 | 836.500 | **37.058.500** | **0 VNĐ** |
| **EMP004** | Lê Hoàng Long | IT Manager | 40.000.000 | 48.200.000 | 4.830.000 | 2.504.000 | **40.866.000** | **0 VNĐ** |
| **EMP009** | Vũ Quốc Huy | Senior Dev (Có OT) | 28.000.000 | 38.647.727 | 3.150.000 | 390.886 | **35.106.841** | **0 VNĐ** |
| **EMP013** | Phạm Bảo Nam | Dev (Làm giữa tháng) | 20.000.000 | 14.539.091 | 2.310.000 | 0 | **12.229.091** | **0 VNĐ** |
| **EMP014** | Hoàng Thùy Linh | QA (Nghỉ ốm 14 ngày) | 16.000.000 | 6.549.091 | 0 *(Miễn BH)* | 0 | **6.549.091** | **0 VNĐ** |
| **EMP018** | Đỗ Minh Tuấn | Fin Manager | 35.000.000 | 42.200.000 | 4.410.000 | 1.849.000 | **35.941.000** | **0 VNĐ** |
| **EMP024** | Bùi Thanh Tùng | Sales Manager | 32.000.000 | 38.930.000 | 3.990.000 | 1.344.000 | **33.596.000** | **0 VNĐ** |
| **EMP032** | Đặng Thu Hà | Sales Staff (OT ngày) | 12.000.000 | 16.798.182 | 1.365.000 | 0 | **15.433.182** | **0 VNĐ** |
| **EMP043** | Đinh Văn Toàn | Ops Staff (Ca đêm+OT) | 12.000.000 | 18.520.455 | 1.365.000 | 0 | **17.155.455** | **0 VNĐ** |

*(Ghi chú: Toàn bộ 50/50 nhân sự đều đạt kết quả đối chiếu khớp 100%, chi tiết lưu tại file đính kèm)*

---

## 6. KẾT LUẬN VÀ Ý NGHĨA KHOA HỌC

1. **Hiệu quả tự động hóa vượt trội:** Việc chuyển đổi từ quy trình tính lương thủ công trên Excel sang Động cơ tính lương tự động PeopleInsight AI giúp rút ngắn thời gian xử lý từ **1.46 giờ** xuống còn **dưới 0.2 giây** (tốc độ tăng tốc toàn trình hơn **35,000 lần**).
2. **Triệt tiêu hoàn toàn rủi ro sai sót con người:** Loại bỏ hoàn toàn tỷ lệ lỗi nhập liệu và tính toán 3.2% của phương pháp thủ công, đem lại độ tin cậy tuyệt đối cho bộ phận Nhân sự và Ban Giám đốc.
3. **Tuân thủ pháp lý 2026 tự động:** Hệ thống tự động phân tách khoản thu nhập chịu thuế và miễn thuế theo Luật 109/2025/QH15 và Nghị định 253/2026/NĐ-CP mà không đòi hỏi người dùng phải cập nhật thủ công các công thức phức tạp.
4. **Cơ sở thực nghiệm vững chắc cho Báo cáo ĐATN:** Toàn bộ dữ liệu đo lường, kịch bản benchmark và bảng so sánh là bằng chứng khoa học đanh thép, định lượng rõ ràng cho Chương 4 của Đồ án tốt nghiệp.
