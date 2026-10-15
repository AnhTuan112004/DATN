# ML — RETENTION PREDICTION (DỰ BÁO NGHỈ VIỆC)

- Dữ liệu: IBM HR Analytics Employee Attrition.
- Đúng 6 đặc trưng định lượng: `OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
- Loại bỏ các biến định kiến: `Gender`, `Age`, `MaritalStatus`.
- Huấn luyện: Baseline Rules, Logistic Regression, Random Forest.
- Xuất mô hình sang Node.js (JSON weights hoặc ONNX).
