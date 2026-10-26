# LOAD TEST (k6) — PEOPLEINSIGHT AI

Toàn bộ kịch bản kiểm thử chịu tải k6 chính thức (100 Virtual Users đồng thời trên 6 phân hệ cốt lõi) được đặt tại:
👉 `experiments/load/k6_stress_test.js`

### Cách chạy:
Từ thư mục gốc dự án:
```bash
npm run test:load
```

### Báo cáo và Kết quả Đo đạc:
- Báo cáo khoa học: [docs/report/k6-load-test-evaluation.md](../docs/report/k6-load-test-evaluation.md)
- File kết quả chi tiết: `experiments/load/k6_results.json`
- File tóm tắt: `experiments/load/k6_summary.txt`

