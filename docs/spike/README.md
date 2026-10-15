# SPIKE KỸ THUẬT TUẦN 0 (13–15/10/2026)

Thư mục lưu trữ kết quả của 2 Spike quan trọng nhất trước khi bước vào code Tuần 1:
1. **Spike ① FaceID:**
   - Đánh giá mô hình Face Embedding chạy trên trình duyệt.
   - Thử nghiệm `face-api.js` và ứng viên thứ 2 (MobileFaceNet ONNX/TFJS).
   - Kiểm tra giấy phép LICENSE của code, weights và dataset huấn luyện.
   - Đo đạc khoảng cách Cosine/Euclidean trên ≥ 10 người, đo FPS và độ trễ.
2. **Spike ② Gemini Function Calling:**
   - Smoke test với SDK `@google/genai`.
   - Kiểm tra chuỗi model qua biến `GEMINI_MODEL`: `gemini-3.0-flash` -> fallback `gemini-3.1-flash-lite`.
   - Kiểm thử 4 tools P0 cơ bản (mock).
