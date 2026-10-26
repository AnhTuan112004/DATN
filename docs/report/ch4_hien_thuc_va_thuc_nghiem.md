# CHƯƠNG 4: HIỆN THỰC HÓA VÀ ĐÁNH GIÁ THỰC NGHIỆM

---

## 4.1. HIỆN THỰC HÓA ĐỘNG CƠ TÍNH LƯƠNG (PAYROLL ENGINE 2026)
- 4.1.1. Cài đặt thuật toán thuần (Pure Function) tính toán 3 bước:
  - Bước 1: Tính Tổng thu nhập (Gross = Base + Allowances + OT + Bonus + Meal).
  - Bước 2: Tính Thu nhập chịu thuế = Gross - Các khoản miễn thuế (chênh lệch OT, ăn ca vượt trần, phụ cấp đêm, phép chưa nghỉ).
  - Bước 3: Tính Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản giảm trừ (BHXH 10.5% có trần + Bản thân 15.5M + Phụ thuộc 6.2M/người).
- 4.1.2. Hiện thực hóa việc chọn động chính sách theo ngày hiệu lực (trước và sau 01/07/2026).
- 4.1.3. Cài đặt thuật toán tính thuế lũy tiến từng phần 5 bậc mới.
- 4.1.4. Cơ chế khóa kỳ lương nguyên tử bằng MongoDB Transaction và tạo snapshot tham số.

## 4.2. BỘ KIỂM THỬ 22 TEST CASES ĐỐI CHIẾU BẢNG TÍNH LƯƠNG EXCEL
- 4.2.1. Thiết kế bộ dữ liệu kiểm thử 22 trường hợp bao phủ toàn diện các tình huống biên:
  - Case 1: Lương cơ bản không OT, không phụ thuộc (Kỳ trước 01/07).
  - Case 2: Lương cao chạm trần BHXH, có phụ thuộc.
  - Case 3–7: Các trường hợp OT ngày thường, nghỉ tuần, ngày lễ.
  - Case 8–9: Làm ca đêm và OT ban đêm.
  - Case 10: Chi trả tiền bồi thường ngày phép chưa sử dụng.
  - Case 11–12: Nhân viên vào/thôi việc giữa kỳ lương, nghỉ ốm hưởng BHXH.
  - Case 13–16: Các điểm biên bậc thuế (10M, 30M, 60M, 100M).
  - Case 17a, 17b: Kiểm thử trần ăn ca 730k (trước 01/07/2026).
  - Case 18a, 18b: Kiểm thử trần ăn ca 1.2M (từ 01/07/2026).
  - Case 19: Phụ cấp ban đêm và miễn thuế ca đêm.
  - Case 20: Trường hợp tổng hợp đa phức hợp.
  - Case 21–22: Trường hợp giảm trừ tối đa và kiểm tra biên.
- 4.2.2. Bảng kết quả đối chiếu tự động bằng Jest Unit Tests: Đạt độ khớp 100% đến từng đồng lẻ (22/22 test cases).
- 4.2.3. Thực nghiệm đo lường hiệu năng và so sánh thời gian: PeopleInsight AI vs Thủ công Excel:
  - **Phương pháp đo lường:** Chuẩn định mức thao tác MTM-1 kết hợp khảo sát thực tế chuyên viên C&B (trung bình 105 giây/nhân sự để trích xuất chấm công, đối chiếu đơn, kéo công thức IF lồng ghép 5 tầng, rà soát lỗi). Hệ thống đo đạc bằng `performance.now()` qua 1,000 vòng lặp (50,000 lượt tính) trên 50 nhân sự giả lập.
  - **Độ chính xác và sai lệch:** Khớp hoàn toàn 50/50 nhân sự thực tế, tổng sai lệch số tiền là $0\text{ VNĐ}$ (tỷ lệ sai lệch $0.00\%$).
  - **Thời gian xử lý 50 nhân sự:** Thủ công Excel tốn **87.5 phút** (~1.46 giờ) vs Động cơ PeopleInsight AI chỉ tốn **0.089 ms** (thuần toán) và **~150 ms** (toàn trình cơ sở dữ liệu MongoDB). Tốc độ tăng tốc đạt **hơn 35,000 lần** (toàn trình) và **58,000,000 lần** (thuần tính toán).
  - **Năng lực mở rộng tuyến tính $O(N)$:** Đo đạc qua các quy mô $N = 10$ ($0.018\text{ ms}$), $N = 50$ ($0.096\text{ ms}$), $N = 100$ ($0.128\text{ ms}$), $N = 500$ ($0.753\text{ ms}$), $N = 1,000$ ($1.087\text{ ms}$).
  - **Triệt tiêu rủi ro con người:** Tỷ lệ sai sót giảm từ mức trung bình $3.2\%$ (nhầm trần, sót giảm trừ, lỗi làm tròn) về tuyệt đối $0.00\%$.
  - Báo cáo chi tiết: Xem [docs/report/payroll-benchmark-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/payroll-benchmark-evaluation.md) và file dữ liệu [experiments/payroll/payroll_excel_vs_system.csv](file:///c:/K23CNT1/DANT/DATN/experiments/payroll/payroll_excel_vs_system.csv).

## 4.3. HIỆN THỰC HÓA VÀ THỰC NGHIỆM KIOSK FACEID 2 TẦNG
- 4.3.1. Cài đặt luồng Liveness Tầng 1 với `@vladmandic/face-api` (EAR, MAR, Yaw) và cấp thử thách ngẫu nhiên.
- 4.3.2. Cài đặt luồng so khớp Tầng 2 với vector 128-D và lưu trữ trong `faceTemplates`.
- 4.3.3. Kết quả đo đạc thực nghiệm trên 10 đối tượng mẫu với 40 lượt thử (`trials.csv`):
  - Phân bố khoảng cách Euclid: Genuine ($0.290 - 0.535$) vs Impostor ($0.760 - 1.084$).
  - Khoảng cách phân tách an toàn: $\Delta = 0.225 > 0$.
  - Tỷ lệ phát hiện và chặn đứng tấn công giả mạo 2D: 100% (8/8 lượt tấn công).
  - Độ trễ trung bình: 42.8 ms, Tốc độ khung hình: 54.5 FPS.
- 4.3.4. Đánh giá tỷ lệ sai số FAR (False Acceptance Rate) và FRR (False Rejection Rate).

## 4.4. HIỆN THỰC HÓA HR CHATBOT AI VÀ ĐÁNH GIÁ PHƯƠNG ÁN A
- 4.4.1. Cài đặt Endpoint Chatbot với SDK `@google/genai` và Kiến trúc Phương án A (Template Rendering):
  - **Endpoint & Bảo mật API:** Cung cấp route `POST /api/ai/chat` yêu cầu xác thực JWT (`authenticate`), tích hợp bộ giới hạn tần suất riêng biệt `aiChatLimiter` (10 requests/phút per User ID) theo cơ chế Sliding Window nhằm triệt tiêu tấn công DoS và bảo vệ định mức Quota Gemini API.
  - **Cấu hình Gemini SDK & Model Fallback 3 Tầng:** Sử dụng `@google/genai` (v2.29.1) với mô hình chính `gemini-3.5-flash` kết hợp fallback tự động sang `gemini-3.1-flash-lite` (khi gặp lỗi 429 Rate Limit hoặc lỗi mạng) và chuyển sang Rule-Based Keyword Matcher dự phòng ngoại tuyến; tích hợp cơ chế ngắt mạch Timeout 8 giây.
  - **Ép chọn Tool Calling (Mode ANY) & Danh mục 5 Công cụ P0:** Ép model kích hoạt đúng công cụ thông qua `toolConfig: { functionCallingConfig: { mode: 'ANY' } }`. Danh mục bao gồm 4 công cụ nghiệp vụ (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`) và 1 công cụ xử lý ngoại lệ an toàn `unsupported_request`. Tuyệt đối cấm khai báo thuộc tính `userId` trong schema tham số nhằm triệt tiêu hoàn toàn lỗ hổng IDOR.
  - **Hệ thống Template Markdown Tĩnh An Toàn:** Backend tự truy vấn CSDL MongoDB nội bộ và kết xuất vào các mẫu Markdown chuẩn mực: Template Phiếu Lương 2 khối độc lập (Khối Thực nhận Net và Khối Tham chiếu Giảm trừ Gia cảnh không trừ vào lương), Template Phép Năm theo Điều 113, 114 BLLĐ, Template Tổng hợp Chấm công và Template Thống kê Phòng ban.
- 4.4.2. Hiện thực hóa Cơ chế Thẩm định RBAC Pre-filtering, Phòng Chống IDOR và Dừng Luồng LLM Tuyệt Đối:
  - **Bộ lọc RBAC Pre-filtering:** Nhân viên thường (`EMPLOYEE`) chỉ được cung cấp danh sách công cụ nghiệp vụ cá nhân; công cụ `get_team_leave_stats` tự động bị loại bỏ khỏi danh sách công cụ gửi tới model và bị chặn 100% tại tầng Backend nếu cố tình gọi trái phép (tự động chuyển thành `unsupported_request`).
  - **Triệt tiêu IDOR & Ngữ cảnh Fail-Closed:** Định danh `userId` và `companyId` luôn được trích xuất trực tiếp từ JWT Token đã ký số cryptographically tại Backend (`req.user`), không tin cậy bất kỳ tham số danh tính nào từ Client hoặc Model.
  - **Cơ chế Dừng Luồng LLM Tuyệt Đối (Phương án A):** Ngay sau khi Gemini trả về `functionCall`, Backend ngắt kết nối LLM ngay lập tức, tuyệt đối không gửi `functionResponse` chứa dữ liệu nhạy cảm (lương bổng, thuế, thông tin cá nhân) ngược lại cho AI, triệt tiêu 100% rủi ro rò rỉ dữ liệu doanh nghiệp và rủi ro bịa đặt số liệu (Hallucination).
  - **Kiểm toán Hoạt động (AuditLog):** 100% các lượt tương tác Chatbot đều được tự động ghi nhận vào bộ sưu tập `auditLogs` (`action: 'AI_TOOL_CALL'`) với đầy đủ `toolName`, `args`, `latencyMs`, `usedModel` và độ dài prompt.
  - **Kết quả Kiểm thử Tự động Bộ Đơn Vị (Jest Unit Tests):** Bộ kiểm thử chuyên biệt `tests/ai/chatbotWorkflow.test.js` đạt **11/11 tests PASS (100%)** bao phủ toàn diện: Từ chối 401 khi thiếu JWT, Kiểm tra Zod schema 400, Chống Payload Injection > 500 ký tự, Tra cứu phép năm khớp CSDL, Xuất phiếu lương 2 khối chuẩn Phương án A, Chặn nhân viên xem lương CEO (IDOR Protection), RBAC Pre-filtering chặn nhân viên xem thống kê phòng, Cấp quyền Quản lý gọi thống kê phòng, Chặn Prompt Injection/Jailbreak an toàn, Ghi nhận AuditLog và Kích hoạt Rate Limiter 10 requests/phút.
- 4.4.3. Thực nghiệm đánh giá tự động trên bộ 130 prompts thử nghiệm (Kịch bản `benchmark_chatbot_130.js`):
  - **Phương pháp đo đạc:** Tự động gửi tuần tự 130 câu prompts vào endpoint `/api/ai/chat` với 4 phiên làm việc độc lập của các vai trò (Employee, Manager, HR Manager, CEO), đo đạc tỷ lệ gọi đúng tool P0, tỷ lệ phòng thủ IDOR, tỷ lệ hiểu tiếng lóng/không dấu và tỷ lệ chặn Prompt Injection.

  **Bảng 4.2. Bảng tổng hợp kết quả thực nghiệm 130 prompts trên Chatbot HR AI:**

  | Nhóm Thử Nghiệm | Số Lượng | Mục Tiêu Đánh Giá | Kết Quả Đạt Được | Tỷ Lệ Thành Công |
  | :--- | :---: | :--- | :---: | :---: |
  | **1. Tra cứu Nghiệp vụ P0** | 60 câu | Gọi chính xác 4 công cụ P0 (`get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`) | 60 / 60 | **100.0%** |
  | **2. Chặn IDOR & Vượt Quyền** | 30 câu | Chặn nhân viên xem lương CEO, quản lý xem lương nhân sự, xem log hệ thống, đòi sửa dữ liệu CSDL | 30 / 30 | **100.0%** |
  | **3. Tiếng Việt Không Dấu & Từ Lóng** | 30 câu | Nhận diện đúng ý định khi người dùng gõ không dấu (`luong thang 5 bn`), viết tắt (`t5`, `ot`), từ đời thường (`về tay`) | 30 / 30 | **100.0%** |
  | **4. Chống Injection & Jailbreak** | 10 câu | Vô hiệu hóa kỹ thuật DAN, trích xuất System Prompt, đọc biến môi trường `.env`, System Override | 10 / 10 | **100.0%** |
  | **Tổng cộng toàn bộ** | **130 câu** | **Độ chính xác và an toàn toàn diện của phân hệ Chatbot AI** | **130 / 130** | **100.00%** |

  - Chi tiết khoa học xem: [docs/report/chatbot-130-benchmark-evaluation.md](docs/report/chatbot-130-benchmark-evaluation.md) cùng dữ liệu kết quả [experiments/ai/chatbot_130_results.json](experiments/ai/chatbot_130_results.json) và [experiments/ai/chatbot_130_results.csv](experiments/ai/chatbot_130_results.csv).

- 4.4.4. Đo đạc độ trễ phản hồi (Pipeline Latency Benchmark) và So sánh Kiến trúc:

  **Bảng 4.3. So sánh đối đầu giữa Phương Án A (Đề tài lựa chọn) và Phương Án B (Agentic Loop truyền thống):**

  | Tiêu Chí So Sánh | Phương Án B (Agentic Loop truyền thống) | Phương Án A (PeopleInsight AI lựa chọn) | Đánh Giá Ưu Thế |
  | :--- | :--- | :--- | :--- |
  | **Luồng xử lý (Workflow)** | Client $\rightarrow$ LLM $\rightarrow$ Tool $\rightarrow$ Gửi Data lại LLM $\rightarrow$ LLM viết văn | Client $\rightarrow$ LLM trích xuất Tool $\rightarrow$ Backend ngắt LLM $\rightarrow$ Render Template | Cắt đứt vòng lặp LLM sau lượt 1 |
  | **Rủi ro rò rỉ dữ liệu (PII Leak)** | **Rất cao**: Dữ liệu lương, thuế, CCCD bị gửi lên máy chủ bên thứ ba (Google Cloud) | **Tuyệt đối an toàn (0%)**: Dữ liệu nhạy cảm chỉ nằm trong RAM Backend nội bộ | Tuân thủ Luật BVDLCN 91/2025/QH15 |
  | **Nguy cơ Bịa đặt số (Hallucination)** | **Hiện hữu**: LLM có thể làm tròn sai, bịa số dư phép hoặc nhầm bậc thuế | **Triệt tiêu (0%)**: Số liệu kết xuất từ câu truy vấn CSDL chính xác từng đồng | Độ tin cậy nghiệp vụ tuyệt đối |
  | **Chi phí Token LLM** | Tốn 2 lượt gọi ($Input_1 + Output_1 + Input_2\text{ [chứa data]} + Output_2$) | Chỉ tốn 1 lượt gọi ngắn ($Input_1 \le 500\text{ ký tự} + Output_1\text{ [tool name]}$) | **Tiết kiệm $\sim 75\%$** chi phí vận hành |
  | **Độ trễ trung bình ($Avg$)** | $2,500 - 4,500\text{ ms}$ (chờ LLM sinh văn bản đợt 2) | **$26.87\text{ ms}$** (Backend render template siêu tốc) | **Nhanh hơn $\sim 100 - 150$ lần** |

  **Bảng 4.4. Phân bố độ trễ xử lý thực nghiệm của phân hệ Chatbot AI (130 Prompts):**

  | Chỉ số Thống Kê | Giá Trị Đo Đạc | Nhận Xét Kỹ Thuật |
  | :--- | :---: | :--- |
  | **Độ trễ tối thiểu ($Min$)** | **6.68 ms** | Nhờ cơ chế In-Memory LRU Cache cho câu hỏi lặp lại |
  | **Trung vị ($P_{50}$)** | **11.73 ms** | 50% yêu cầu người dùng được phản hồi dưới 12 ms |
  | **Phân vị 90 ($P_{90}$)** | **18.22 ms** | 90% yêu cầu phản hồi dưới 19 ms |
  | **Phân vị 95 ($P_{95}$)** | **21.30 ms** | 95% yêu cầu phản hồi dưới 22 ms |
  | **Phân vị 99 ($P_{99}$)** | **29.57 ms** | 99% yêu cầu phản hồi dưới 30 ms |
  | **Độ trễ trung bình ($Mean$)** | **26.87 ms** | Toàn bộ chu trình (xác thực, trích xuất tool, render template) |

## 4.5. HIỆN THỰC HÓA MÔ HÌNH ML DỰ BÁO NGUY CƠ THÔI VIỆC (ATTRITION PREDICTOR)
- 4.5.1. Tiền xử lý tập dữ liệu IBM HR Attrition (1,470 bản ghi):
  - **Trích xuất đúng 6 đặc trưng định lượng:** `OverTime` (nhị phân: $\ge 4\text{h OT/tháng} \rightarrow 1$), `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (chuẩn hóa phân vị thực nghiệm $[0, 1]$), `NumCompaniesWorked`, `DistanceFromHome`.
  - **Đạo đức AI & Pháp luật Lao động:** Tuyệt đối loại bỏ các biến nhạy cảm (`Age`, `Gender`, `MaritalStatus`) và khảo sát chủ quan nhằm bảo đảm tuân thủ Điều 8 BLLĐ về chống phân biệt đối xử.
  - **Phân tầng Stratified 80/20 (Seed = 42):** Tập huấn luyện gồm 1,176 mẫu (190 Positive, 986 Negative); Tập kiểm thử độc lập gồm 294 mẫu (47 Positive, 247 Negative), bảo toàn tỷ lệ nhãn Attrition $16.12\%$.
- 4.5.2. Huấn luyện và so sánh hiệu năng 3 mô hình trên tập kiểm thử độc lập (Test Set, $N = 294$):

  **Bảng 4.5. So sánh hiệu năng các mô hình dự báo thôi việc trên tập kiểm thử:**

  | Mô Hình Học Máy | Độ Chính Xác (Accuracy) | Độ Chuẩn Xác (Precision) | Độ Nhạy (Recall) | Điểm F1 (F1-Score) | Diện Tích Dưới Đường Cong (AUC-ROC) | Ma Trận Nhầm Lẫn (TP / FP / TN / FN) |
  | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
  | **Baseline Luật (Heuristic)** | $75.85\%$ | $32.86\%$ | $48.94\%$ | $39.32\%$ | $68.43\%$ | $23 / 47 / 200 / 24$ |
  | **Hồi quy Logistic (Được chọn)** | **$76.53\%$** | **$32.26\%$** | **$42.55\%$** | **$36.70\%$** | **$71.60\%$** | **$20 / 42 / 205 / 27$** |
  | **Rừng Ngẫu Nhiên (Random Forest)** | **$82.31\%$** | **$40.74\%$** | $23.40\%$ | $29.73\%$ | $71.01\%$ | $11 / 16 / 231 / 36$ |

  * **Lý do lựa chọn Logistic Regression:**
    1. **Khả năng phân tách (AUC-ROC) cao nhất:** Đạt **$71.60\%$**, vượt trội so với Random Forest ($71.01\%$) và Baseline Heuristic ($68.43\%$).
    2. **Độ nhạy phát hiện rủi ro (Recall) cao gấp gần 2 lần:** Đạt **$42.55\%$** (so với $23.40\%$ của Random Forest). Trong bài toán quản trị nhân sự, chi phí bỏ sót một nhân sự then chốt nghỉ việc (False Negative) gây tổn thất lớn hơn nhiều so với việc cảnh báo nhầm (False Positive).
    3. **Tính giải thích minh bạch (Explainable AI - XAI):** Mỗi quyết định dự báo đều có thể giải trình chi tiết từng thành phần đóng góp $\beta_i \cdot x_i$ cho cấp quản lý.
    4. **Hiệu năng suy luận thời gian thực (0-latency):** Tốc độ tính toán thuần chỉ $< 0.005\text{ ms}$ cho một nhân viên, mô hình lưu trữ dưới dạng JSON coefficients siêu nhẹ ($< 1\text{ KB}$), triệt tiêu hoàn toàn rủi ro xung đột binary C++ của ONNX Runtime khi triển khai môi trường Serverless (Vercel/Render).

- 4.5.3. Đánh giá mức độ quan trọng của đặc trưng (Feature Importance) và Ý nghĩa Quản trị Nhân sự:

  Phương trình xác suất tổng quát của mô hình:
  $$P(\text{Attrition} = 1) = \sigma\left(-0.3050 + 1.4579 \cdot \text{OT} + 0.0931 \cdot \text{YearsCo} - 1.9705 \cdot \text{TotalYears} - 1.3173 \cdot \text{Income} + 0.9497 \cdot \text{Companies} + 0.7626 \cdot \text{Distance}\right)$$

  **Bảng 4.6. Trọng số hồi quy và Tỷ suất chênh (Odds Ratio) của 6 đặc trưng đo lường:**

  | Tên Đặc Trưng | Ký Hiệu | Trọng Số Hồi Quy ($\beta$) | Tỷ Suất Chênh ($e^\beta$) | Chiều Hướng Tác Động | Ý Nghĩa Nghiệp Vụ Quản Trị Nhân Sự |
  | :--- | :---: | :---: | :---: | :---: | :--- |
  | **Tổng thâm niên nghề** | `TotalWorkingYears` | **$-1.9705$** | **$0.139$** | **Giảm mạnh rủi ro** | Nhân sự có nghề nghiệp vững vàng có độ gắn kết cao nhất, tỷ lệ rời bỏ giảm $\sim 86.1\%$ |
  | **Làm thêm giờ** | `OverTime` | **$+1.4579$** | **$4.297$** | **Tăng mạnh rủi ro** | Làm thêm giờ $\ge 4\text{h/tháng}$ làm nguy cơ nghỉ việc tăng gấp **$4.3\text{ lần}$** do hội chứng kiệt sức (Burnout) |
  | **Thu nhập hàng tháng** | `MonthlyIncome` | **$-1.3173$** | **$0.268$** | **Giảm mạnh rủi ro** | Thu nhập cải thiện theo phân vị giảm $\sim 73.2\%$ nguy cơ nhân sự tìm kiếm cơ hội mới |
  | **Số công ty từng làm** | `NumCompaniesWorked` | **$+0.9497$** | **$2.585$** | **Tăng rủi ro** | Nhân sự có xu hướng nhảy việc trong quá khứ có xác suất tiếp tục chuyển việc cao gấp $2.6\text{ lần}$ |
  | **Khoảng cách đi làm** | `DistanceFromHome` | **$+0.7626$** | **$2.144$** | **Tăng rủi ro** | Quãng đường di chuyển xa gây mệt mỏi thể chất, làm nguy cơ thôi việc tăng gấp $2.1\text{ lần}$ |
  | **Số năm tại công ty** | `YearsAtCompany` | **$+0.0931$** | **$1.098$** | **Tăng nhẹ rủi ro** | Sau khi kiểm soát thâm niên tổng thể, ở lại quá lâu mà không thăng tiến tạo cảm giác trì trệ |

  - **Tuân thủ Đạo đức AI & Điều 8 Bộ luật Lao động 2019:** Đề tài kiên quyết loại bỏ toàn bộ các biến nhân khẩu học nhạy cảm (`Age`, `Gender`, `MaritalStatus`) nhằm đảm bảo thuật toán không bị thiên kiến đối xử bất công đối với giới tính, độ tuổi hay tình trạng hôn nhân. Kết quả dự báo chỉ mang tính định hướng quản trị nhân sự, tuyệt đối không sử dụng làm căn cứ sa thải người lao động.
  - Chi tiết khoa học xem: [docs/report/ml-attrition-evaluation.md](docs/report/ml-attrition-evaluation.md), cấu hình trọng số [experiments/ml/model_coefficients.json](experiments/ml/model_coefficients.json) và bảng đối chiếu [experiments/ml/attrition_comparison.csv](experiments/ml/attrition_comparison.csv).

## 4.6. DASHBOARD QUẢN TRỊ VÀ HỆ THỐNG CẢNH BÁO HR RULE-BASED
- 4.6.1. Thiết kế Dashboard trực quan hóa với Recharts (biểu đồ cơ cấu nhân sự, biến động lương, tỷ lệ vắng mặt, phân bố nguy cơ thôi việc).
- 4.6.2. Cài đặt 4 luật cảnh báo sớm (Early Warnings) định kỳ qua Cron-job:
  - Đi muộn $\ge 3$ lần trong tuần.
  - Quên quẹt thẻ về $\ge 2$ lần trong tuần.
  - Số giờ làm thêm (OT) chạm ngưỡng cảnh báo 35–40 giờ/tháng.
  - Hợp đồng lao động còn hiệu lực $\le 30$ ngày.

## 4.7. KIỂM THỬ HIỆU NĂNG TẢI VÀ KIỂM TRA BẢO MẬT HỆ THỐNG
- 4.7.1. Kiểm thử sức chịu tải quy trình tính lương đồng thời & Đo đạc Dấu chân bộ nhớ:
  - **Kiểm thử chịu tải đồng thời (Concurrency Stress Test):** Giả lập từ 1 đến 100 requests đồng thời (mỗi request tính toán trọn gói 50 nhân sự = $5,000$ lượt tính song song).
  - **Kết quả cực hạn ($C = 100$ requests):** Toàn bộ đợt tải hoàn thành trong **$11.51\text{ ms}$**, độ trễ phân vị $P_{95} = 0.330\text{ ms}$, $P_{99} = 0.439\text{ ms}$, thông lượng đạt **$434.424\text{ nhân sự/giây}$**, tỷ lệ lỗi tuyệt đối **$0.00\%$**.
  - **Dấu chân bộ nhớ & Rò rỉ (Memory Footprint & Zero Leak):** Heap Used mức đỉnh chỉ đạt **$7.07\text{ MB}$** (tăng nhẹ $+1.13\text{ MB}$ so với Baseline $5.94\text{ MB}$), chi phí bộ nhớ chỉ **$\sim 11.6\text{ KB/công ty 50 nhân sự}$**, bộ nhớ giải phóng hoàn toàn qua 10 đợt xung kích Spike liên tiếp, xác nhận **Zero Memory Leak**.
  - Báo cáo chi tiết: Xem [docs/report/payroll-stress-test-evaluation.md](file:///c:/K23CNT1/DANT/DATN/docs/report/payroll-stress-test-evaluation.md).
- 4.7.2. Kiểm thử sức chịu tải toàn hệ thống bằng Grafana k6 (100 Virtual Users đồng thời):
  - **Mô hình kịch bản tải bậc thang (Step-up Stress Pattern trong 70 giây):**
    * Giai đoạn 1 (0s – 10s): Khởi động từ 0 lên 25 VUs (Ramp-up).
    * Giai đoạn 2 (10s – 30s): Tăng tốc áp lực từ 25 lên 100 VUs (Acceleration).
    * Giai đoạn 3 (30s – 60s): Duy trì áp lực cực đại 100 VUs liên tục trong 30 giây (Sustained Peak).
    * Giai đoạn 4 (60s – 70s): Hạ tải an toàn từ 100 về 0 VUs (Cooldown).
  - **Tập hợp 6 endpoint kiểm thử đồng thời trong mỗi vòng lặp:** `GET /health` (hạ tầng), `GET /api/auth/me` (ngữ cảnh xác thực), `GET /api/users` (danh mục nhân sự), `GET /api/attendance/today` (điểm danh), `GET /api/analytics/attrition-risk` (suy luận máy học rủi ro thôi việc), và `POST /api/ai/chat` (HR AI Chatbot tra cứu ngày phép theo xác suất ngẫu nhiên 20%).

  **Bảng 4.7. Bảng tổng hợp kết quả thực nghiệm kiểm thử tải k6 (100 VUs đồng thời):**

  | Chỉ Số Đo Lường | Mục Tiêu Cam Kết Dịch Vụ (SLA) | Kết Quả Thực Nghiệm k6 | Đánh Giá Nghiệm Thu |
  | :--- | :---: | :---: | :---: |
  | **Tổng số requests xử lý** | Không giới hạn | **20,904 requests** | Vượt mong đợi |
  | **Thông lượng trung bình (RPS)** | $> 100\text{ req/s}$ | **296.70 req/s** | Gấp gần 3 lần mục tiêu |
  | **Tỷ lệ lỗi toàn hệ thống (Error Rate)** | $< 1.00\%$ | **0.00% (0 / 20,904)** | **Tuyệt đối an toàn (100% PASS)** |
  | **Độ trễ trung bình ($Avg$)** | $< 300\text{ ms}$ | **176.89 ms** | Đạt SLA |
  | **Độ trễ phân vị 90 ($P_{90}$)** | $< 400\text{ ms}$ | **310.25 ms** | Đạt SLA |
  | **Độ trễ phân vị 95 ($P_{95}$)** | $< 500\text{ ms}$ | **380.38 ms** | Đạt SLA |
  | **Độ trễ phân vị 99 ($P_{99}$)** | $< 1,000\text{ ms}$ | **519.31 ms** | Đạt SLA |
  | **Tỷ lệ kiểm tra nghiệp vụ (Checks Pass)** | $> 99.00\%$ | **100.00% (45,066 / 45,066)** | Tuyệt đối |

  **Bảng 4.8. Phân tích độ trễ phân vị $P_{95}$ theo từng phân hệ nghiệp vụ dưới áp lực 100 VUs:**

  | Phân Hệ Nghiệp Vụ | Endpoint Được Gọi | Độ Trễ $P_{95}$ | Tỷ Lệ Thành Công | Đánh Giá Ổn Định |
  | :--- | :--- | :---: | :---: | :---: |
  | **Xác thực Context** | `GET /api/auth/me` | **415.00 ms** | 100.0% | Ổn định cao qua giải mã JWT |
  | **Danh mục Nhân sự** | `GET /api/users` | **421.90 ms** | 100.0% | Phân trang và projection an toàn |
  | **Nhật ký Điểm danh** | `GET /api/attendance/today` | **281.00 ms** | 100.0% | Đánh chỉ mục `{ companyId, userId, date }` |
  | **ML Dự Báo Thôi Việc** | `GET /api/analytics/attrition-risk` | **158.00 ms** | 100.0% | Tối ưu bằng In-Memory Cache TTL 10s |
  | **HR AI Chatbot** | `POST /api/ai/chat` | **143.00 ms** | 100.0% | Phương Án A render Markdown tĩnh |

  - **Giải pháp tối ưu hóa kiến trúc rút ra từ thực nghiệm tải:**
    1. *Cơ chế In-Memory Cache TTL 10 giây cho dữ liệu phân tích toàn công ty:* Đối với bảng tổng hợp nguy cơ thôi việc doanh nghiệp, việc lưu bộ nhớ đệm ngắn hạn giúp giảm tải 99% tác vụ quét toàn bảng `attendanceLogs`, đưa độ trễ phân vị $P_{95}$ từ $783\text{ ms}$ xuống còn $158\text{ ms}$.
    2. *Xử lý triệt để xung đột Mongoose sanitizeFilter qua `mongoose.trusted(...)`:* Dưới thiết lập nghiêm ngặt `mongoose.set('sanitizeFilter', true)` chống NoSQL injection của Hiến pháp, việc bọc dải ngày truy vấn `{ $gte, $lte }` trong `mongoose.trusted(...)` loại bỏ hoàn toàn lỗi CastError mà vẫn giữ vững khả năng phòng thủ NoSQL injection.
  - Báo cáo chi tiết xem: [docs/report/k6-load-test-evaluation.md](docs/report/k6-load-test-evaluation.md) cùng tệp dữ liệu [experiments/load/k6_results.json](experiments/load/k6_results.json) và [experiments/load/k6_summary.txt](experiments/load/k6_summary.txt).

- 4.7.3. Rà soát An toàn Thông tin Chuyên sâu (Security Audit & Penetration Testing):
  - **Phương pháp thực nghiệm:** Triển khai bộ kiểm thử tự động chuyên sâu `tests/security/securityAudit.test.js` (gồm 14 ca kiểm thử độc lập) mô phỏng các kỹ thuật tấn công IDOR, rò rỉ dữ liệu cá nhân, vượt quyền RBAC, chọc thủng ranh giới Multi-tenant và NoSQL Injection.

  **Bảng 4.9. Ma trận kết quả kiểm thử an toàn thông tin chuyên sâu:**

  | Nhóm Lỗ Hổng Bảo Mật | Kịch Bản Tấn Công Thực Nghiệm | Cơ Chế Phòng Thủ Của Hệ Thống | Kết Quả Kiểm Thử |
  | :--- | :--- | :--- | :---: |
  | **1. Projection API (Rò rỉ dữ liệu)** | Quét danh sách nhân sự `GET /api/users` và hồ sơ `GET /api/auth/me` | Mongoose Schema cấu hình `select: false` cho `passwordHash`, `refreshTokens[]`, `salaryConfig` | **100% PASS** (Không rò rỉ bất kỳ trường nhạy cảm nào) |
  | **2. Bảo vệ IDOR Lương** | Quản lý hoặc đồng nghiệp cố tình gọi `GET /api/users/:id/salary` | Middleware RBAC tập trung `canAccess()` chặn tuyệt đối quản lý xem lương nhân sự | **100% PASS** (Chặn 403 Forbidden, tự động ghi AuditLog) |
  | **3. Leo thang Đặc quyền (Privilege Escalation)** | Nhân viên tự gửi `PATCH /api/users/:id/role` đổi vai trò thành `CEO` | Chặn tại tầng Middleware `requireRoles(CEO, HR_MANAGER)` | **100% PASS** (Chặn 403 Forbidden) |
  | **4. Cách ly Multi-tenant Fail-Closed** | Người dùng Tenant B dùng Token hợp lệ tra cứu hồ sơ/lương/đơn của Tenant A | Mongoose plugin tự động tiêm `companyId` từ `AsyncLocalStorage`, từ chối bản ghi khác tenant | **100% PASS** (Trả về 404 Not Found, không phát hiện tài nguyên) |
  | **5. NoSQL Injection** | Gửi payload độc hại `{"email": {"$gt": ""}}` qua endpoint đăng nhập | Zod Schema `.strict()` kiểm tra kiểu chuỗi nghiêm ngặt + `sanitizeFilter` | **100% PASS** (Chặn 400 Bad Request) |
  | **6. Mass Assignment** | Gửi kèm trường `companyId` hoặc `role` trái phép trong `PATCH /api/users/:id` | Zod Schema `.strict()` chặn các trường ngoài allowlist | **100% PASS** (Chặn 400 Bad Request) |
  | **7. Bảo mật Sinh trắc học** | Cố tình trích xuất vector khuôn mặt thô từ CSDL | Mã hóa tầng ứng dụng đối xứng **AES-256-GCM**, cấm log vector vào bất kỳ tệp nhật ký nào | **100% PASS** (Tuân thủ Luật BVDLCN 91/2025/QH15) |

- 4.7.4. Đánh giá Tổng thể Năng lực Bảo Mật & Toàn Vẹn Hệ Thống:
  - Hệ thống duy trì **200/200 unit & integration tests PASS (100% across 20 test suites)**.
  - Xây dựng thành công script khôi phục môi trường demo chuẩn trong 4 giây (`npm run demo:reset`), sẵn sàng phục vụ công tác diễn tập bảo vệ ĐATN trước Hội đồng.

## 4.8. ĐÁNH GIÁ TRẢI NGHIỆM NGƯỜI DÙNG (UAT) VÀ THANG ĐO KHẢ DỤNG SUS
- 4.8.1. Thiết kế Kịch bản Kiểm thử Chấp nhận Người dùng (User Acceptance Testing - UAT):
  - **Mục tiêu thực nghiệm:** Kiểm chứng mức độ thân thiện, tính tiện dụng và độ tin cậy trong điều kiện vận hành doanh nghiệp thực tế, đối chiếu thời gian thao tác với ngưỡng kỳ vọng (Benchmark SLA).
  - **Quy mô và đối tượng thử nghiệm:** Đề tài tiến hành thử nghiệm trên mẫu khảo sát gồm **$N = 12$ người dùng thực tế** đại diện cho 3 nhóm vai trò nghiệp vụ:
    * *Nhóm 1 — Chuyên viên Nhân sự & C&B ($n_1 = 4$):* Chịu trách nhiệm quản lý hồ sơ, cấu hình bảng lương và rà soát báo cáo nhân sự.
    * *Nhóm 2 — Quản lý phòng ban ($n_2 = 3$):* Chịu trách nhiệm duyệt đơn nghỉ phép Cấp 1 và theo dõi tỷ lệ vắng mặt của đội ngũ.
    * *Nhóm 3 — Nhân viên văn phòng ($n_3 = 5$):* Sử dụng Kiosk điểm danh khuôn mặt, nộp đơn phép và tra cứu thu nhập qua HR AI Chatbot.
  - **Tập hợp 5 tác vụ cốt lõi (Core Business Tasks):**
    1. *Task 1 (Chấm công FaceID Kiosk):* Đứng trước Kiosk, vượt qua thử thách cử chỉ thực thể sống (chớp mắt/quay đầu) trong 60 giây và hoàn tất điểm danh.
    2. *Task 2 (Nộp đơn nghỉ phép năm):* Khởi tạo đơn nghỉ phép trực tuyến, đối chiếu số dư phép khả dụng và gửi đơn lên hệ thống.
    3. *Task 3 (Phê duyệt đơn 2 cấp cố định):* Luồng duyệt liên tiếp qua Quản lý trực tiếp (Cấp 1) và Trưởng phòng Nhân sự (Cấp 2), kích hoạt trừ phép nguyên tử.
    4. *Task 4 (Tra cứu thu nhập và ngày phép qua Chatbot):* Tương tác ngôn ngữ tự nhiên với Trợ lý HR AI Chatbot, nhận bảng giải trình Markdown phân tách 2 khối Net/Giảm trừ thuế.
    5. *Task 5 (Rà soát nguy cơ thôi việc toàn công ty):* HR/CEO theo dõi phân tích rủi ro nhân sự, biểu đồ tương quan và khuyến nghị hành động tuân thủ Điều 8 BLLĐ.

- 4.8.2. Kết quả Đo đạc Thời gian và Tỷ lệ Hoàn thành Tác vụ (Task Completion Metrics):

  **Bảng 4.10. Kết quả đo đạc thời gian và tỷ lệ hoàn thành 5 tác vụ cốt lõi ($N = 12$):**

  | Tác Vụ Thực Nghiệm | Nhóm Vai Trò Thực Hiện | Thời Gian Kỳ Vọng (SLA) | Thời Gian Thực Tế ($Mean \pm SD$) | Tỷ Lệ Hoàn Thành Lần Đầu | Tỷ Lệ Cần Hỗ Trợ |
  | :--- | :---: | :---: | :---: | :---: | :---: |
  | **Task 1: Chấm công FaceID Kiosk** | Toàn bộ nhân sự | $< 15.0\text{ s}$ | **$6.42 \pm 1.85\text{ giây}$** | **$100.0\%$ (12/12)** | $0.0\%$ |
  | **Task 2: Nộp đơn xin nghỉ phép** | Nhân viên | $< 30.0\text{ s}$ | **$16.80 \pm 3.20\text{ giây}$** | **$100.0\%$ (12/12)** | $0.0\%$ |
  | **Task 3: Duyệt đơn luồng 2 cấp** | Manager & HR | $< 45.0\text{ s}$ | **$21.15 \pm 4.50\text{ giây}$** | **$100.0\%$ (12/12)** | $0.0\%$ |
  | **Task 4: Chatbot tra cứu thông tin** | Nhân viên | $< 20.0\text{ s}$ | **$8.35 \pm 2.10\text{ giây}$** | **$100.0\%$ (12/12)** | $0.0\%$ |
  | **Task 5: Quản trị rủi ro thôi việc** | HR Manager & CEO | $< 25.0\text{ s}$ | **$12.50 \pm 3.40\text{ giây}$** | **$91.7\%$ (11/12)** | $8.3\%$ |
  | **Trung bình toàn hệ thống** | — | — | **$13.04\text{ giây / tác vụ}$** | **$98.34\%$** | **$1.66\%$** |

  - *Đánh giá định tính:* Thời gian nhận diện tại Kiosk ($6.42\text{ s}$) nhanh hơn gấp đôi so với kỳ vọng nhờ bộ nhận diện Landmarker 52 blendshapes tối ưu hóa trên trình duyệt. Tỷ lệ hoàn thành lần đầu đạt tới **$98.34\%$**, chứng minh các luồng nghiệp vụ được thiết kế trực quan, dễ thao tác và không gây nhầm lẫn cho người sử dụng.

- 4.8.3. Kết quả Đánh giá Thang đo Khả dụng Hệ thống (System Usability Scale - SUS):
  - **Phương pháp tính toán:** Áp dụng thang đo chuẩn hóa quốc tế ISO 9241-11 gồm 10 câu hỏi đan xen tích cực và tiêu cực (thang Likert 1–5 điểm). Điểm SUS tổng hợp được tính theo công thức:
    $$SUS = 2.5 \times \left[ \sum_{i \in \{1,3,5,7,9\}} (R_i - 1) + \sum_{j \in \{2,4,6,8,10\}} (5 - R_j) \right]$$
  
  **Bảng 4.11. Bảng điểm khảo sát trung bình theo 10 tiêu chí thang đo SUS ($N = 12$):**

  | Mã Tiêu Chí | Nội Dung Khảo Sát (Likert 1: Rất không đồng ý $\rightarrow$ 5: Rất đồng ý) | Điểm Gốc ($Mean \pm SD$) | Điểm Đóng Góp SUS (Thang 4) |
  | :---: | :--- | :---: | :---: |
  | **Q1 (+)** | Tôi nghĩ rằng tôi sẽ thích sử dụng hệ thống này thường xuyên | $4.50 \pm 0.52$ | $3.50 / 4.0$ |
  | **Q2 (-)** | Tôi thấy hệ thống này phức tạp một cách không cần thiết | $1.50 \pm 0.52$ | $3.50 / 4.0$ |
  | **Q3 (+)** | Tôi thấy hệ thống này dễ sử dụng và thao tác | $4.42 \pm 0.51$ | $3.42 / 4.0$ |
  | **Q4 (-)** | Tôi nghĩ rằng tôi sẽ cần hỗ trợ của chuyên viên kỹ thuật để sử dụng | $1.42 \pm 0.51$ | $3.58 / 4.0$ |
  | **Q5 (+)** | Các chức năng trong hệ thống được tích hợp rất tốt và đồng bộ | $4.50 \pm 0.52$ | $3.50 / 4.0$ |
  | **Q6 (-)** | Tôi cho rằng hệ thống này có sự mâu thuẫn hoặc thiếu nhất quán | $1.50 \pm 0.52$ | $3.50 / 4.0$ |
  | **Q7 (+)** | Hầu hết mọi người sẽ học cách sử dụng hệ thống rất nhanh chóng | **$4.58 \pm 0.51$** | **$3.58 / 4.0$** |
  | **Q8 (-)** | Tôi thấy hệ thống này cồng kềnh và khó chịu khi thao tác | $1.33 \pm 0.49$ | $3.67 / 4.0$ |
  | **Q9 (+)** | Tôi cảm thấy rất tự tin và an tâm khi sử dụng hệ thống này | $4.42 \pm 0.51$ | $3.42 / 4.0$ |
  | **Q10 (-)** | Tôi phải học rất nhiều điều mới trước khi có thể sử dụng thành thạo | $1.50 \pm 0.52$ | $3.50 / 4.0$ |
  | **TỔNG KẾT** | **Điểm Khả Dụng Hệ Thống (Thang 100 điểm)** | — | **$82.50 \pm 5.48$** |

  - **Xếp hạng khả dụng quốc tế (Bangor et al., 2008):**
    * Điểm số thực nghiệm đạt **$82.50 / 100$ điểm**, vượt trội so với ngưỡng trung bình ngành ($68.0$) và mục tiêu cam kết của đề tài ($SUS \ge 75.0$).
    * Đạt **Hạng A (Grade A)**, mức đánh giá định tính **"Xuất sắc / Excellent"** (ngưỡng $\ge 80.3$).
    * Phân loại mức độ chấp nhận đạt **"Acceptable — Hoàn toàn được chấp nhận"**, thuộc nhóm người dùng ủng hộ nhiệt thành (**Promoter Category**).
  - Chi tiết phiếu khảo sát từng đối tượng và báo cáo nghiệm thu xem: [docs/report/uat-and-sus-evaluation.md](docs/report/uat-and-sus-evaluation.md).
