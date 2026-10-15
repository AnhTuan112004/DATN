# KẾ HOẠCH TRIỂN KHAI CHI TIẾT PEOPLEINSIGHT AI (v6.1 FINAL FREEZE)

> **Quy ước lịch:** 
> - **Tuần 0:** 13/10 – 15/10/2026 (3 ngày: Spike & Khởi động).
> - **Từ Tuần 1 đến Tuần 8:** Mỗi tuần chạy từ **Thứ 6 đến Thứ 5** (đúng 7 ngày liền nhau). Chủ nhật là ngày làm bình thường hoặc làm bù.
> - **Tuần 9:** 11/12 – 15/12/2026 (5 ngày: Hoàn thiện, đóng gói và nộp).
> - **Giai đoạn đệm:** 15/12/2026 – 08/01/2027 (chỉ sửa lỗi theo yêu cầu GVHD/GVPB).
> - **Hôm nay:** Thứ Tư, 14/10/2026. Công việc ngày 13/10 chưa hoàn thành được gộp làm bù trong hôm nay.

---

## NGUYÊN TẮC CẮT GIẢM (FALLBACK POLICY)
Nếu cuối Tuần 4 tiến độ Payroll Engine bị chậm, cắt giảm theo thứ tự:
1. **Cảnh báo HR:** Dùng 100% template tĩnh, không dùng LLM viết văn.
2. **Chấm công QR:** Hoãn QR động, chỉ giữ GPS Geofencing + FaceID.
3. **Giải trình công:** Hoãn tính năng nộp đơn giải trình công, HR sửa trực tiếp trên Admin UI.
> **BẤT BIẾN:** Luôn giữ 4 trụ cột cốt lõi:
> 1. FaceID Kiosk Liveness 2 tầng
> 2. Payroll Engine chuẩn Pháp lý 2026
> 3. Chatbot HR Function Calling (Phương án A)
> 4. ML Dự báo thôi việc (Retention Predictor)

---

# PHẦN A. LỊCH THEO TUẦN VÀ NGÀY

### Tuần 0 (13–15/10/2026): Spike và khởi động
| Ngày | Việc cần làm |
| :--- | :--- |
| **T3 13/10** | Tạo monorepo (`backend/`, `frontend/`, `ml/`, `docs/`), ESLint, Prettier, TypeScript, CI lint + build. Tạo cluster MongoDB Atlas M0. Lấy 2 Gemini API key (một dự phòng). Tạo `.env.example`. |
| **T4 14/10** *(Hôm nay)* | **Spike ② Gemini:** Gọi thử Function Calling với 4 tool (mock data, chưa cần DB), thử chuỗi model `gemini-3.0-flash` rồi `gemini-3.1-flash-lite` qua biến `GEMINI_MODEL`, ghi lại model chạy tốt. <br>**Spike ① FaceID bắt đầu:** Dựng trang thử trên trình duyệt với `face-api.js` làm mốc so sánh, thêm ứng viên thứ hai nếu kịp (MobileFaceNet ONNX hoặc TFJS). Kiểm tra LICENSE của code, weights và dataset huấn luyện. |
| **T5 15/10** | **Spike ① kết thúc:** Đo ≥ 10 người (cùng người và khác người: khoảng cách cosine/Euclid, độ trễ, FPS), chọn model và ghi số chiều embedding vào `docs/PROGRESS.md`. Nếu chuyển sang ONNX/TFJS tốn quá 1 ngày thì chốt dùng `face-api.js` cho Tuần 2. Mua domain. Họp GVHD chốt đề cương. Viết script seed 50 nhân viên (có OT, đi muộn, phép). Dựng khung báo cáo 5 chương, nháp Chương 1.1–1.2. |
| **Xong khi** | Gemini 3.x gọi được tool; đã chọn model nhận diện kèm số liệu và giấy phép; có domain; repo chạy được. |

---

### Tuần 1 (16–22/10/2026): Auth, RBAC, hồ sơ, deploy khung
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 16/10** | Khung Express 5: cấu trúc thư mục, Mongoose, Helmet, CORS, error handler. Model `companies`, `users`, `departments`, `auditLogs` (tất cả có `companyId`). |
| **T7 17/10** | Đăng nhập: JWT access 15 phút + refresh 7 ngày (cookie HttpOnly, SameSite=Lax). Refresh rotation, phát hiện dùng lại token thì thu hồi toàn bộ, tối đa 5 phiên. Dùng toán tử nguyên tử (`$push`/`$pull`) cho `refreshTokens[]`, CẤM dùng `.save()`. |
| **CN 18/10** | Middleware RBAC 4 cấp (`CEO`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`). Ghi `auditLogs`. Rate limit. `passwordHash` đặt `select: false`. Viết test IDOR đầu tiên và test không lộ trường nhạy cảm qua `$lookup`. |
| **T2 19/10** | CRUD nhân viên (trong `users`), mảng `contracts[]` (effectiveFrom/To/status), cây phòng ban 2 cấp. Upload ảnh Cloudinary. |
| **T3 20/10** | Frontend: Vite + React 19 + Tailwind, trang đăng nhập, Protected Routes, layout, Axios interceptor tự refresh (single-flight lock). |
| **T4 21/10** | Frontend: danh sách nhân viên, sơ đồ phòng ban. Admin UI cấu hình địa điểm GPS (`companies.settings.locations`), seed địa điểm «Phòng Bảo vệ ĐATN». Deploy Vercel + Render trên cùng apex domain (`app.domain.vn`, `api.domain.vn`), thử cookie trên Safari/iOS, thêm ping `/health` bằng cron-job.org. |
| **T5 22/10** | Cron nhắc hợp đồng 30/60 ngày (idempotent). Sửa lỗi tồn đọng, buffer. Viết Chương 2.1 và 2.6 (nghiệp vụ HR, Luật BVDLCN). |
| **Xong khi** | Đăng nhập được trên bản deploy (cả điện thoại), cookie ổn, test IDOR đầu tiên pass. |

---

### Tuần 2 (23–29/10/2026): Chấm công FaceID Kiosk, GPS, QR
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 23/10** | Model `faceTemplates`. Màn hình đồng ý xử lý dữ liệu sinh trắc học. Kiosk token (lưu hash SHA-256 trong `companies.settings.devices`). Frontend: nạp MediaPipe Face Landmarker (wasm đặt local), trang camera chạy trên HTTPS. |
| **T7 24/10** | Liveness: blendshape (chớp mắt, há miệng) và góc đầu yaw/pitch từ transformation matrix. Server cấp thử thách ngẫu nhiên có chữ ký, hết hạn 60 giây. |
| **CN 25/10** | Tầng 2: căn chỉnh khuôn mặt theo tọa độ hai mắt từ landmark, trích embedding bằng model đã chọn ở spike. Luồng đăng ký khuôn mặt (`descriptors[]`, không lưu ảnh gốc, mã hóa at-rest). |
| **T2 26/10** | Dịch vụ so khớp ở server (cosine/Euclid), API chấm công kiosk, model `attendanceLogs` (method, deviceId, location), ngưỡng đọc từ cấu hình. Giao diện kiosk. |
| **T3 27/10** | GPS Geofencing: Haversine, accuracy < 50m, bán kính 100m, kèm deviceId, giao diện mobile-first. Cron chốt ABSENT idempotent có catch-up, endpoint `/api/jobs/run` cho cron-job.org. |
| **T4 28/10** | QR động: HMAC-SHA256(userId + timestamp + nonce), chu kỳ 30 giây, nonce dùng 1 lần, gắn phiên. Chức năng rút đồng ý: xóa `faceTemplates` ngay. |
| **T5 29/10** | Đo ngưỡng sơ bộ với 5–10 người, chốt ngưỡng tạm. Viết Chương 3.1–3.3 (yêu cầu, Threat Model, kiến trúc chấm công 2 tầng). Buffer. |
| **Xong khi** | Giơ ảnh tĩnh trước camera thì bị từ chối; chấm công bằng mặt, GPS và QR chạy được; QR dùng lần 2 bị từ chối. |

---

### Tuần 3 (30/10–5/11/2026): Đơn từ, duyệt 2 cấp, thực nghiệm FaceID đợt 1
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 30/10** | Model `leaveRequests`. Loại đơn: ANNUAL, SICK, OT, WFH, FORGOT_CHECKIN. `leaveBalance` nằm trong `users`, cập nhật bằng `$inc`. Logic phép năm theo Điều 113–114 BLLĐ (12/14/16 ngày, cộng 1 ngày mỗi 5 năm thâm niên). |
| **T7 31/10** | Luồng duyệt Manager → HR Manager. Manager chỉ duyệt cấp dưới trực tiếp, chặn tự duyệt đơn của mình, chuyển trạng thái nguyên tử. |
| **CN 1/11** | OT: kiểm ≤ 4h/ngày, ≤ 40h/tháng, theo dõi ≤ 200h/năm (ghi cờ cảnh báo, HR quyết định). WFH. Giải trình công / FORGOT_CHECKIN: HR điều chỉnh bắt buộc có lý do + audit log. |
| **T2 2/11** | Socket.io + model `notifications`: thông báo real-time khi đơn đổi trạng thái. |
| **T3 3/11** | Frontend: form tạo đơn, hộp thư chờ duyệt, theo dõi trạng thái, chuông thông báo. |
| **T4 4/11** | Thực nghiệm FaceID đợt 1: 15–20 người, hai điều kiện ánh sáng (300–500 lux và < 100 lux), đo FPS và độ trễ. Thử ảnh tĩnh 50 lần, video 30 lần. Ghi từng lượt vào `experiments/faceid/trials.csv`. |
| **T5 5/11** | Vẽ ROC sơ bộ, hiệu chỉnh ngưỡng. Viết Chương 3.4 (11 collection, ERD). Buffer. |
| **Xong khi** | Đơn đi hết luồng 2 cấp, có thông báo real-time, có bảng FAR/FRR đợt 1. |

---

### Tuần 4 (6–12/11/2026): Payroll phần 1 (tham số, BHXH, thuế)
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 6/11** | Đọc văn bản gốc: Luật 109/2025/QH15, NĐ 253/2026 (Điều 8, 26, 69), NĐ 161/2026, NĐ 293/2025, Điều 98 BLLĐ và Điều 55 NĐ 145/2020. Lập bảng tham số kèm số hiệu điều khoản, ghi vào `docs/legal/`. Xác nhận phạm vi: cá nhân cư trú, hợp đồng ≥ 3 tháng. |
| **T7 7/11** | Nhập vào `companies.settings`: `taxPolicies` (2 bản ghi: đến 30/6 và từ 1/7/2026), `insuranceRates`, `minWageByRegion`, `otRates`, `holidays`. Viết hàm chọn chính sách theo kỳ lương (`effectiveFrom <= kỳ && (effectiveTo rỗng || >= kỳ)`). |
| **CN 8/11** | Hàm thuần: tính `insurableSalary` (loại OT, tiền đêm, tiền ăn ca, thưởng, hỗ trợ xăng xe/điện thoại/nhà ở), BHXH/BHYT áp trần theo kỳ, trần BHTN = 20 × lương tối thiểu vùng, tỷ lệ NLĐ 10,5%. |
| **T2 9/11** | Thuế lũy tiến 5 bậc, kiểm tra các điểm biên (10M, 30M, 60M, 100M), giảm trừ bản thân (15.5M) và người phụ thuộc (6.2M/người), công thức 3 bước (Tổng thu nhập → Thu nhập chịu thuế → Thu nhập tính thuế). Unit test case 1, 2, 13–16. |
| **T3 10/11** | Tổng hợp công từ `attendanceLogs` và đơn đã duyệt. Vào/thôi việc giữa tháng, nghỉ ốm/thai sản hưởng BHXH, phép có lương. Unit test case 11, 12. |
| **T4 11/11** | Model `payrolls`: snapshot tham số tại thời điểm tính, khóa kỳ lương (`periodLockedAt`) bằng transaction, không cho tính lại kỳ đã khóa. API chạy và khóa kỳ. Test IDOR phiếu lương. |
| **T5 12/11** | **Điểm kiểm tra tiến độ cuối Tuần 4:** Nếu chậm, áp dụng ngay thứ tự cắt giảm ở đầu tài liệu. Đối chiếu 8–10 case đầu với Excel. Viết Chương 3.5 (API, Swagger). |
| **Xong khi** | Các case 1, 2, 11–16 khớp Excel; đã quyết định có cắt giảm hay không. |

---

### Tuần 5 (13–19/11/2026): Payroll phần 2 (OT, đêm, miễn thuế)
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 13/11** | OT: hệ số 150% / 200% / 300% theo ngày thường, nghỉ tuần, lễ. Phần chênh lệch nếu công ty trả cao hơn thì chịu thuế. Điều kiện miễn thuế OT (≤ 4h/ngày, ≤ 40h/tháng, ≤ 200h/năm), phần vượt chịu thuế. Case 3–7. |
| **T7 14/11** | Làm đêm 22h–06h: phụ cấp 30%. OT đêm: 210% / 270% / 390% (xác nhận lại công thức với Điều 98 và Điều 55 NĐ 145/2020). Rà Điều 26 NĐ 253 để chốt phạm vi miễn thuế tiền đêm. Case 8, 9, 19. |
| **CN 15/11** | Phép chưa nghỉ miễn thuế. Tiền ăn ca theo kỳ: trần 730K đến hết tháng 6/2026, 1,2M từ tháng 7/2026. Case 10, 17a, 17b, 18a, 18b. |
| **T2 16/11** | Case 20 (tổng hợp). Hoàn thiện file Excel đối chiếu đủ 22 dòng (mọi dòng của bảng 4.5.5). Sửa các sai lệch. |
| **T3 17/11** | Frontend: nhân viên xem phiếu lương, HR xem bảng lương và chốt kỳ, xuất Excel (SheetJS). Chạy lại test IDOR. |
| **T4 18/11** | Thực nghiệm Excel và hệ thống: 50 nhân viên giả lập (có OT vượt hệ số, OT đêm, phép, tiền ăn ca). Bấm giờ, đếm lỗi, tính tỷ lệ sai lệch. |
| **T5 19/11** | Viết Chương 4.1–4.3 (có công thức 3 bước và bảng test). Buffer. **Payroll đóng băng.** |
| **Xong khi** | 22/22 case khớp Excel; có số liệu thời gian Excel và hệ thống. |

---

### Tuần 6 (20–26/11/2026): Chatbot Phương án A và cảnh báo rule-based
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 20/11** | Endpoint `/api/ai/chat`, SDK `@google/genai`, chuỗi model dự phòng, rate limit riêng, ghi log tool vào `auditLogs`. |
| **T7 21/11** | 4 tool: `get_leave_balance`, `get_payslip`, `get_attendance_summary`, `get_team_leave_stats`. CẤM tham số `userId` (lấy từ JWT). Mỗi tool tự kiểm RBAC và kiểm tra tính hợp lệ của tham số do LLM sinh ra (tránh IDOR). |
| **CN 22/11** | **Phương án A:** Sau khi Gemini trả function call, backend dừng, tự render số liệu bằng template Markdown, KHÔNG gửi functionResponse ngược lại cho model. Viết 4 template. Test: số liệu lương không xuất hiện trong request gửi Gemini. |
| **T2 23/11** | Dự phòng: 2 API key luân phiên, cache 30 câu mẫu, tra cứu từ khóa khi Gemini lỗi hoặc hết quota. Chống prompt injection (chặn đầu vào, không nhúng nội dung người dùng vào system prompt). |
| **T3 24/11** | Cảnh báo rule-based bằng template: đi muộn ≥ 3 ngày, quên check-out ≥ 2 lần/tuần, OT chạm 35–40h, hợp đồng còn ≤ 30 ngày. Gửi qua `notifications`. |
| **T4 25/11** | Frontend: giao diện chat, hiển thị cảnh báo. Soạn bộ 130 câu (60 hợp lệ, 30 vượt quyền, 30 viết tắt/không dấu, 10 prompt injection). Chạy lần 1. |
| **T5 26/11** | Chạy lại, ghi tỷ lệ gọi đúng tool, vượt quyền bị từ chối, p50/p95. Nháp Chương 4.4. Buffer. |
| **Xong khi** | Hỏi lương người khác bị từ chối; số liệu hiển thị đúng từ template; có bảng kết quả 130 câu. |

---

### Tuần 7 (27/11–3/12/2026): ML dự báo, Dashboard, FEATURE FREEZE
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 27/11** | Notebook: tải IBM Attrition, giữ 6 đặc trưng (`OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` chuyển thành phân vị 0–1, `NumCompaniesWorked`, `DistanceFromHome`). Loại `Gender`, `Age`, `MaritalStatus` và biến khảo sát chủ quan. Chia train/test 80/20 phân tầng. |
| **T7 28/11** | Huấn luyện baseline luật, Logistic Regression, Random Forest. Đo AUC-ROC, Precision, Recall, F1. Vẽ ROC. Feature importance. |
| **CN 29/11** | Đưa mô hình vào hệ thống (xuất hệ số/ONNX, suy luận ở Node). Dựng bộ đặc trưng từ `attendanceLogs` và `contracts[]` theo bảng ánh xạ. Ghi rõ: 50 nhân viên seed chỉ để minh họa. |
| **T2 30/11** | Dashboard HR (Recharts): danh sách rủi ro, feature importance, kèm disclaimer. Cảnh báo nghỉ việc chỉ HR Manager xem được. |
| **T3 1/12** | Chỉ làm P1 nếu P0 đã ổn, chọn đúng 1 mục (ưu tiên: Docker Compose, rồi WebAuthn). Nếu không thì dùng ngày này sửa lỗi P0 và tăng độ phủ test. |
| **T4 2/12** | Thực nghiệm FaceID đợt 2 để chốt số liệu và ngưỡng. Chạy lại 130 câu chatbot. Chạy lại toàn bộ test Payroll (hồi quy). |
| **T5 3/12** | **FEATURE FREEZE.** Từ giờ chỉ sửa lỗi. Viết Chương 4.5–4.6. |
| **Xong khi** | Có bảng AUC của 3 mô hình, ROC, feature importance; Dashboard chạy; đã freeze. |

---

### Tuần 8 (4–10/12/2026): Kiểm thử và UAT
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 4/12** | Load test k6: 100 người dùng đồng thời trên Atlas M0, ghi p95, RPS, tỷ lệ lỗi. |
| **T7 5/12** | Tối ưu: index, phân trang, projection. Chạy lại k6. |
| **CN 6/12** | OWASP ZAP. Kiểm tra IDOR thủ công mọi endpoint, kiểm tra projection API (không lộ passwordHash, faceTemplates, lương người khác). Kiểm tra múi giờ và ca đêm qua nửa đêm. |
| **T2 7/12** | Chuẩn bị UAT: kịch bản tác vụ, form SUS, tài khoản sandbox, script reset dữ liệu. |
| **T3 8/12** | UAT với 10–15 người (HR, Manager, nhân viên), bấm giờ từng tác vụ, thu SUS. |
| **T4 9/12** | Tổng hợp SUS (mục tiêu ≥ 75), sửa lỗi nghiêm trọng. Bật HTTPS cho demo (deploy thật hoặc mkcert). |
| **T5 10/12** | Viết Chương 4.7–4.8 (kết quả thực nghiệm) và Chương 5 (hạn chế: liveness client, dataset IBM, 50 nhân viên giả lập). |

---

### Tuần 9 (11–15/12/2026): Hoàn thiện và nộp
| Ngày | Việc cần làm |
| :--- | :--- |
| **T6 11/12** | Rà soát báo cáo: số liệu khớp thực nghiệm, ERD, sequence diagram, nguồn pháp lý, nguồn và giấy phép model nhận diện, phụ lục. |
| **T7 12/12** | Làm slide. Chuẩn bị câu trả lời về hạn chế và về lựa chọn Phương án A. |
| **CN 13/12** | Diễn tập demo lần 1. Quay video dự phòng HD. Đặt tọa độ demo tại phòng bảo vệ. |
| **T2 14/12** | Diễn tập lần 2, chạy checklist mục 14. Nâng Render lên Starter, kiểm tra model Gemini còn hoạt động, nạp cache chatbot, reset sandbox, in QR link deploy. |
| **T3 15/12** | In ấn, nộp báo cáo và mã nguồn cho GVHD. Đóng băng code. |

---

### Giai đoạn đệm (15/12/2026 – 08/01/2027)
- Chỉ sửa lỗi nếu GVHD hoặc GVPB yêu cầu.
- Mỗi tuần chạy 1 lần smoke test (đăng nhập, chấm công, tính lương, chatbot, kiểm tra model Gemini còn sống).
- Mọi thay đổi ghi rõ vào `docs/CHANGELOG.md`, tuyệt đối không mở rộng phạm vi.
