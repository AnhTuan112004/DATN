# THAM CHIẾU: PAYROLL ENGINE CHUẨN PHÁP LÝ VIỆT NAM 2026

> **Ngày cập nhật:** Tháng 10/2026  
> **Căn cứ pháp lý:** 
> - Luật Thuế Thu nhập cá nhân sửa đổi (Luật số 109/2025/QH15)
> - Nghị quyết số 110/2025/UBTVQH15 về điều chỉnh mức giảm trừ gia cảnh thuế TNCN
> - Nghị định 253/2026/NĐ-CP (Điều 8, Điều 26, Điều 69) hướng dẫn thi hành Luật Thuế TNCN
> - Luật Bảo hiểm xã hội 2024 (số 41/2024/QH15, hiệu lực từ 01/07/2025)
> - Nghị định 161/2026/NĐ-CP về điều chỉnh mức lương cơ sở (2.34M lên 2.53M từ 01/07/2026)
> - Nghị định 293/2025/NĐ-CP về mức lương tối thiểu vùng năm 2026
> - Bộ luật Lao động 2019 (Điều 98) và Nghị định 145/2020/NĐ-CP (Điều 55, Điều 57 về làm đêm và làm thêm giờ ban đêm)  
> **Phạm vi áp dụng:** Cá nhân cư trú có hợp đồng lao động ≥ 3 tháng.

---

## 1. NGUYÊN TẮC: KHÔNG HARD-CODE SỐ LIỆU VÀ QUY TẮC THỜI ĐIỂM TÍNH

1. **Không Hard-code:** Logic tính toán bắt buộc tra cứu tham số động từ `companies.settings` (`taxPolicies`, `insuranceRates`, `minWageByRegion`, `otRates`, `holidays`). Các con số cụ thể chỉ nằm trong dữ liệu seed và bộ test cases.
2. **Quy tắc Thời điểm Hiệu lực (Period Date vs. Pay Date):**
   - **Bảo hiểm xã hội / Y tế / Thất nghiệp:** Tính theo **tháng phát sinh tiền lương (`periodDate` / kỳ công tháng `YYYY-MM`)**.
   - **Thuế Thu nhập Cá nhân (TNCN) & Trần Ăn ca:** Theo nguyên tắc khấu trừ tại nguồn của Luật Thuế TNCN, thuế được xác định theo **thời điểm thực tế chi trả thu nhập (`payDate`)**.
   - *Ví dụ:* Kỳ lương tháng 06/2026 được thanh toán vào ngày 05/07/2026:
     * Trần BHXH/BHYT áp dụng mức kỳ 1: $46.800.000$đ (tháng 6).
     * Trần ăn ca miễn thuế và chính sách thuế áp dụng mức kỳ 2: $1.200.000$đ (do chi trả trong tháng 7).
   - Trong schema và code: Bắt buộc truyền rõ `period` (ví dụ `"2026-06"`) và `payDate` (chuỗi `"YYYY-MM-DD"` UTC chuẩn hóa, không dùng `new Date()` tự do gây lệch múi giờ).

---

## 2. BẢNG THAM SỐ CHÍNH SÁCH 2 KỲ NĂM 2026

| Tham số cấu hình | Kỳ 1: Trước 01/07/2026 | Kỳ 2: Từ 01/07/2026 | Căn cứ pháp lý gốc |
| :--- | :--- | :--- | :--- |
| **Trần lương đóng BHXH & BHYT** | 46.800.000 VNĐ ($20 \times 2.34\text{M}$) | 50.600.000 VNĐ ($20 \times 2.53\text{M}$) | Luật BHXH 2024 & NĐ 161/2026/NĐ-CP |
| **Trần tiền ăn ca miễn thuế** | 730.000 VNĐ / tháng | 1.200.000 VNĐ / tháng | Điều 8 & 69 Nghị định 253/2026/NĐ-CP |
| **Giảm trừ gia cảnh bản thân** | 15.500.000 VNĐ / tháng | 15.500.000 VNĐ / tháng | Nghị quyết 110/2025/UBTVQH15 |
| **Giảm trừ người phụ thuộc** | 6.200.000 VNĐ / người / tháng | 6.200.000 VNĐ / người / tháng | Nghị quyết 110/2025/UBTVQH15 |
| **Tỷ lệ trích BH người lao động** | BHXH: 8.0%, BHYT: 1.5%, BHTN: 1.0% (Tổng: 10.5%) | | Luật BHXH, Luật BHYT, Luật Việc làm |
| **Tỷ lệ trích BH người sử dụng LĐ**| BHXH: 17.5%, BHYT: 3.0%, BHTN: 1.0% (Tổng: 21.5%) | | Luật BHXH, Luật BHYT, Luật Việc làm |
| **Trần BHTN ($20 \times \text{LTT Vùng}$)** | Vùng I: 106.2M, Vùng II: 94.6M, Vùng III: 82.8M, Vùng IV: 74.0M | NĐ 293/2025/NĐ-CP |

### Biểu thuế lũy tiến từng phần 5 bậc mới (Kỳ tính thuế 2026):
| Bậc thuế | Phần thu nhập tính thuế / tháng | Thuế suất | Cách tính lũy tiến nhanh |
| :---: | :--- | :---: | :--- |
| 1 | Đến 10 triệu đồng | 5% | $0.05 \times \text{TNTT}$ |
| 2 | Trên 10 đến 30 triệu đồng | 10% | $0.10 \times \text{TNTT} - 500.000$ |
| 3 | Trên 30 đến 60 triệu đồng | 20% | $0.20 \times \text{TNTT} - 3.500.000$ |
| 4 | Trên 60 đến 100 triệu đồng | 30% | $0.30 \times \text{TNTT} - 9.500.000$ |
| 5 | Trên 100 triệu đồng | 35% | $0.35 \times \text{TNTT} - 14.500.000$ |

---

## 3. CÔNG THỨC 3 BƯỚC TÍNH TOÁN CHI TIẾT

### Bước 1: Tổng thu nhập (Gross Income)
$$\text{Gross} = \text{Lương ngày công} + \text{Phụ cấp} + \text{Thưởng} + \text{Tiền OT} + \text{Tiền làm đêm} + \text{Bồi thường phép chưa nghỉ}$$

1. **Lương thực tế theo ngày công:**  
   $$\text{Lương ngày công} = \frac{\text{Lương hợp đồng}}{\text{Số ngày công chuẩn của tháng}} \times \text{Số ngày công làm việc thực tế}$$
   - *Số ngày công chuẩn:* Mặc định lấy theo cấu hình công ty (22 ngày đối với làm từ Thứ 2 đến Thứ 6; hoặc 26 ngày nếu làm Thứ 7; hoặc số ngày làm việc thực tế của tháng). Giờ chuẩn: 8 giờ/ngày.
   - *Số ngày công thực tế:* Bắt buộc tính gồm ngày làm việc thực tế + **các ngày nghỉ phép năm hưởng nguyên lương** + **các ngày nghỉ lễ, tết hưởng nguyên lương** + ngày nghỉ việc riêng có lương (kết hôn, tang chế theo Điều 115 BLLĐ).
2. **Tiền làm thêm giờ (OT ban ngày - Điều 98 BLLĐ):**
   - Ngày thường: hệ số $\ge 150\%$
   - Ngày nghỉ hàng tuần: hệ số $\ge 200\%$
   - Ngày nghỉ lễ, tết, ngày nghỉ có hưởng lương: hệ số $\ge 300\%$
3. **Tiền làm ban đêm (22h00 - 06h00 hôm sau):**
   - Phụ cấp làm đêm tối thiểu: cộng thêm ít nhất $30\%$ tiền lương tính theo đơn giá giờ ngày làm việc bình thường.
4. **Tiền làm thêm giờ ban đêm (OT đêm - Điều 98 BLLĐ & Điều 57 NĐ 145/2020):**
   - **Trường hợp 1 (Không làm thêm ban ngày trước đó):**
     $$\text{Đơn giá OT đêm ngày thường} = 150\% + 30\% + 20\% = 200\%$$
   - **Trường hợp 2 (Có làm thêm ban ngày trước đó):**
     $$\text{Đơn giá OT đêm ngày thường} = 150\% + 30\% + (20\% \times 150\%) = 210\%$$
   - Ngày nghỉ hàng tuần: $200\% + 30\% + (20\% \times 200\%) = 270\%$
   - Ngày lễ, tết: $300\% + 30\% + (20\% \times 300\%) = 390\%$
5. **Tiền bồi thường ngày phép năm chưa nghỉ:**
   $$\text{Tiền phép chưa nghỉ} = \frac{\text{Lương hợp đồng}}{\text{Số ngày công chuẩn}} \times \text{Số ngày phép còn dư chưa nghỉ}$$

---

### Bước 2: Thu nhập chịu thuế (Taxable Income) & CƠ CHẾ MIỄN THUẾ OT NĂM 2026
$$\text{Thu nhập chịu thuế} = \text{Gross} - \text{Các khoản miễn thuế hợp lệ}$$

> [!IMPORTANT]
> **ĐIỂM ĐỔI MỚI QUAN TRỌNG CỦA LUẬT THUẾ TNCN 2025/2026:**
> - Trước 2026: Chỉ phần chênh lệch trả cao hơn (50%/100%/200%) được miễn thuế; phần 100% giờ tiêu chuẩn vẫn tính vào thu nhập chịu thuế.
> - **Từ kỳ tính thuế 2026:** **TOÀN BỘ tiền lương làm thêm giờ (150%, 200%, 300%) được MIỄN THUẾ TNCN** cho cá nhân cư trú, với điều kiện tuân thủ giới hạn luật định:
>   1. **Giới hạn về giờ làm thêm:** $\le 4\text{h}/\text{ngày}$, $\le 40\text{h}/\text{tháng}$, $\le 200\text{h}/\text{năm}$ (hoặc tối đa $300\text{h}/\text{năm}$ ở một số ngành nghề đặc thù).
>   2. **Giới hạn về mức chi trả:** Hệ số chi trả không vượt quá quy định tại Điều 98 BLLĐ (150%, 200%, 300%).
> - **Phần tiền OT bị tính vào thu nhập chịu thuế:**
>   * Tiền OT tương ứng với **số giờ làm thêm vượt giới hạn** (vượt 4h/ngày, 40h/tháng, 200h/năm).
>   * Tiền OT tương ứng với **phần hệ số vượt quá quy định Điều 98** do quy chế công ty tự chi trả cao hơn (ví dụ công ty trả 180% cho ngày thường thì 30% chênh lệch bị tính vào thu nhập chịu thuế).

**Công thức bóc tách OT:**
$$\text{Tiền OT Miễn thuế} = \sum (\text{Số giờ OT hợp lệ trong hạn mức} \times \text{Đơn giá giờ} \times \min(\text{Hệ số thực trả}, \text{Hệ số Điều 98}))$$
$$\text{Tiền OT Chịu thuế} = \text{Tổng tiền OT thực nhận} - \text{Tiền OT Miễn thuế}$$

**Các khoản miễn thuế khác:**
1. **Tiền làm ban đêm:** `[Cần xác minh]` — Theo Điều 4 Luật Thuế TNCN 2025, tiền lương làm việc ban đêm thuộc diện miễn thuế. Hiện hệ thống tách phụ cấp đêm 30% vào diện miễn thuế theo hướng dẫn tạm thời của NĐ 253.
2. **Tiền ăn ca miễn thuế:** Miễn tối đa theo trần tại thời điểm chi trả `payDate` ($\le 730.000$đ trước 01/07/2026; $\le 1.200.000$đ từ 01/07/2026). Phần chi vượt trần phải chịu thuế TNCN.
3. **Tiền bồi thường phép chưa nghỉ:** Được miễn thuế theo quy định.

---

### Bước 3: Thu nhập tính thuế & Thuế TNCN (Assessable Income & PIT)
$$\text{Thu nhập tính thuế (TNTT)} = \max(0, \text{Thu nhập chịu thuế} - \text{Các khoản giảm trừ})$$

1. **Bảo hiểm bắt buộc người lao động đóng (10.5%):**
   - Lương đóng bảo hiểm (`insurableSalary`): Lương hợp đồng + phụ cấp lương xác định theo quy chế. `[Cần xác minh danh mục các khoản loại trừ cụ thể theo Luật BHXH 2024 hiệu lực từ 01/07/2025]`.
   - BHXH (8.0%) và BHYT (1.5%): Tính trên $\min(\text{insurableSalary}, \text{Trần BHXH theo kỳ lương})$.
   - BHTN (1.0%): Tính trên $\min(\text{insurableSalary}, 20 \times \text{Lương tối thiểu vùng})$.
2. **Giảm trừ gia cảnh (Nghị quyết 110/2025/UBTVQH15):**
   - Bản thân: 15.500.000 VNĐ / tháng.
   - Người phụ thuộc: $6.200.000 \text{ VNĐ} \times \text{Số người phụ thuộc hợp lệ}$.
3. **Thuế TNCN:** Tính theo Biểu lũy tiến 5 bậc trên TNTT.
4. **Lương thực nhận (Net):**
   $$\text{Net} = \text{Gross} - \text{Bảo hiểm NLĐ (10.5\%)} - \text{Thuế TNCN} - \text{Các khoản khấu trừ khác}$$

---

## 4. QUY TẮC SỐ HỌC TIỀN TỆ & LÀM TRÒN
- Mọi kết quả tiền tệ lưu trữ dưới dạng **Số nguyên VNĐ** (`Math.round`, quy tắc half-up: $\ge 0.5$ làm tròn lên).
- Tránh làm tròn sớm ở các bước trung gian (đơn giá giờ, hệ số), chỉ làm tròn số nguyên ở kết quả cuối của từng dòng mục (tiền OT, tiền ăn ca, từng loại bảo hiểm, tiền thuế, lương net).

---

## 5. BỘ 22 TEST CASES ĐỐI CHIẾU KHỚP EXCEL CHUẨN XÁC

| Test Case | Kịch bản kiểm thử chi tiết | Kết quả mong đợi & Số liệu cụ thể |
| :---: | :--- | :--- |
| **Case 1** | Lương dưới ngưỡng chịu thuế (Gross = 15.0M, 0 phụ thuộc, lương đóng 10M) | BH: 1.050.000đ; TNTT = 0; Thuế TNCN = 0; Net = 13.950.000đ |
| **Case 2** | Lương bậc 1 (Gross = 25.0M, 1 phụ thuộc, lương đóng 20M) | Giảm trừ: 15.5M + 6.2M; BH: 2.100.000đ; TNTT = 1.200.000đ; Thuế 5% = 60.000đ; Net = 22.840.000đ |
| **Case 3** | Làm thêm giờ ngày thường (10h OT x 150%, trong hạn mức 40h) | **Toàn bộ 150% tiền OT được miễn thuế TNCN** (không vào thu nhập chịu thuế) |
| **Case 4** | Làm thêm giờ ngày nghỉ hàng tuần (16h OT x 200%, trong hạn mức 40h) | **Toàn bộ 200% tiền OT được miễn thuế TNCN** |
| **Case 5** | Làm thêm giờ ngày lễ, tết (8h OT x 300%, trong hạn mức) | **Toàn bộ 300% tiền OT được miễn thuế TNCN** |
| **Case 6** | OT vượt trần tháng >40h/tháng (Làm 46h OT ngày thường, đơn giá giờ 100K) | 40h x 150K = 6.0M miễn thuế; 6h vượt trần x 150K = 900.000đ tính vào Thu nhập chịu thuế |
| **Case 7** | OT vượt trần ngày >4h/ngày (Làm 10h OT ngày thường, có 2h vượt trần ngày) | 8h x 150K = 1.2M miễn thuế; 2h vượt trần x 150K = 300.000đ tính vào Thu nhập chịu thuế |
| **Case 8** | OT vượt trần năm >200h/năm (Làm 15h OT ngày thường, có 10h vượt trần năm) | 5h x 150K = 750.000đ miễn thuế; 10h vượt trần x 150K = 1.500.000đ tính vào Thu nhập chịu thuế |
| **Case 9** | Công ty trả hệ số OT cao hơn Điều 98 (Trả 180% ngày thường, 10h OT, đơn giá 100K) | 10h x 150K = 1.5M miễn thuế; 10h x 30K (phần vượt 30%) = 300.000đ tính vào Thu nhập chịu thuế |
| **Case 10** | Làm việc ban đêm (22h - 06h, 30h đêm) | Phụ cấp đêm 30% = 900.000đ được miễn thuế [Cần xác minh theo Điều 26 NĐ 253] |
| **Case 11** | OT đêm ngày thường (Điều 57 NĐ 145/2020: 200% không làm thêm ngày vs 210% có làm thêm ngày) | Nhánh không làm ngày: 200% (2.0M); Nhánh có làm ngày: 210% (2.1M). Cả hai đều được miễn toàn bộ khi trong hạn mức |
| **Case 12** | Thanh toán tiền phép năm chưa nghỉ (dư 3 ngày phép: 3.0M) | Tiền thanh toán phép chưa nghỉ được miễn thuế TNCN |
| **Case 13** | Đi làm giữa tháng (14/22 ngày công thực tế) | Lương tính theo tỷ lệ (14M), đóng BH cả tháng (2.31M) vì ngày công $\ge 14$ ngày |
| **Case 14** | Nghỉ ốm hưởng BHXH $\ge 14$ ngày làm việc trong tháng (Đi làm 6 ngày, nghỉ ốm 16 ngày) | Miễn trích đóng 100% BHXH, BHYT, BHTN tháng đó cho cả NLĐ và NSDLĐ; Thuế = 0, Net = 6.000.000đ |
| **Case 15** | Test tham số hóa 5 bậc thuế lũy tiến mới 2026 (5%, 10%, 20%, 30%, 35%) | Kiểm tra đúng công thức tính nhanh và trừ số khấu trừ từng bậc |
| **Case 16** | Test các giá trị đúng 4 ngưỡng biên thuế: TNTT = 10M, 30M, 60M, 100M | Biên 10M $\rightarrow$ 500.000đ; Biên 30M $\rightarrow$ 2.500.000đ; Biên 60M $\rightarrow$ 8.500.000đ; Biên 100M $\rightarrow$ 20.500.000đ |
| **Case 17** | Kiểm tra chạm trần BHXH/BHYT Kỳ 1 (< 01/07: 46.8M) và Kỳ 2 ($\ge$ 01/07/2026: 50.6M) | Lương đóng 60M: Kỳ 1 trích trên 46.8M (NLĐ: 4.446.000đ); Kỳ 2 trích trên 50.6M (NLĐ: 4.807.000đ) |
| **Case 18** | Kiểm tra trần BHTN Vùng I ($20 \times 5.310.000 = 106.200.000$đ) | Lương đóng 120M $\rightarrow$ BHTN 1% trích trên 106.2M = 1.062.000đ cho cả NLĐ và NSDLĐ |
| **Case 19** | Trần tiền ăn ca miễn thuế Kỳ 1 (730k) vs Kỳ 2 (1.2M theo Điều 8 & 69 NĐ 253/2026) | Ăn ca 1.0M: Kỳ 1 miễn 730k, chịu thuế 270k; Ăn ca 1.5M: Kỳ 2 miễn 1.2M, chịu thuế 300k |
| **Case 20** | Thời điểm chi trả khác tháng công: Công T6/2026 trả ngày 05/07/2026 | Trần BHXH áp dụng 46.8M (tháng 6), trần ăn ca áp dụng 1.2M (thời điểm trả tháng 7) |
| **Case 21** | Chi phí Doanh nghiệp đóng bảo hiểm (21.5%) và quy tắc làm tròn số nguyên VNĐ (half-up) | BHXH DN (17.5%), BHYT DN (3%), BHTN DN (1%) = 4.300.000đ trên 20M; kiểm tra số lẻ làm tròn nguyên VNĐ |
| **Case 22** | Ca tổng hợp toàn diện (Lương cao, OT đêm, ăn ca, 2 phụ thuộc) | Khớp 100% từng đồng với bảng tính Excel chuẩn: Gross 61.15M, Miễn 10.85M, Chịu thuế 50.3M, BH 5.25M, Thuế 1.215M, Net 54.685.000đ |
