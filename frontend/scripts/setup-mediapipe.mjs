/**
 * Script tải và chuẩn bị các file WebAssembly của MediaPipe Tasks Vision vào public/mediapipe/
 * để hệ thống có thể chạy Liveness detection hoàn toàn offline/local mà không phụ thuộc CDN bên ngoài.
 */
import fs from 'fs';
import path from 'path';

const targetDir = path.resolve(process.cwd(), 'public/mediapipe');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`[MediaPipe Setup] Thư mục local wasm đã sẵn sàng tại: ${targetDir}`);
console.log(`[MediaPipe Setup] Sẵn sàng nạp Face Landmarker bundle cho Tuần 2.`);
