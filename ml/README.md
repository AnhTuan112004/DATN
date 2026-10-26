# ML — RETENTION PREDICTION (DỰ BÁO THÔI VIỆC)

- **Dữ liệu chuẩn:** IBM HR Analytics Employee Attrition (1,470 bản ghi).
- **Đúng 6 đặc trưng định lượng:** `OverTime`, `YearsAtCompany`, `TotalWorkingYears`, `MonthlyIncome` (phân vị 0–1), `NumCompaniesWorked`, `DistanceFromHome`.
- **Đạo đức AI & Tuân thủ Luật:** Tuyệt đối loại bỏ `Gender`, `Age`, `MaritalStatus` theo Điều 8 Bộ luật Lao động 2019.
- **Pipeline huấn luyện & Đánh giá 3 mô hình:** [experiments/ml/train_and_evaluate.js](../experiments/ml/train_and_evaluate.js)
- **Hệ số mô hình chuẩn phục vụ suy luận thời gian thực (0-latency):** [experiments/ml/model_coefficients.json](../experiments/ml/model_coefficients.json)

### Cách chạy huấn luyện & so sánh mô hình:
```bash
npm run train:ml
```

### Báo cáo và Kết quả:
- Báo cáo khoa học: [docs/report/ml-attrition-evaluation.md](../docs/report/ml-attrition-evaluation.md)
- Bảng đối đầu 3 mô hình: `experiments/ml/attrition_comparison.csv`
- Bảng trọng số & Odds Ratio: `experiments/ml/feature_importance.json`

