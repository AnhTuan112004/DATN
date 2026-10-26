/**
 * RUNNER SCRIPT CHẠY KIỂM THỬ TẢI K6 (PEOPLEINSIGHT AI)
 * Tự động tìm kiếm k6 binary, kiểm tra health server và kích hoạt 100 VUs
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

async function checkServerHealth(url) {
  try {
    const res = await fetch(`${url}/health`);
    if (res.status === 200) {
      const data = await res.json();
      return data.status === 'OK';
    }
    return false;
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log('================================================================');
  console.log('🚀 KHỞI ĐỘNG KIỂM THỬ CHỊU TẢI K6 (100 CONCURRENT VIRTUAL USERS)');
  console.log('================================================================');

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  console.log(`[1/3] Đang kiểm tra trạng thái máy chủ Backend tại ${baseUrl}...`);

  const isHealthy = await checkServerHealth(baseUrl);
  if (!isHealthy) {
    console.error(`❌ Máy chủ ${baseUrl} chưa khởi động hoặc endpoint /health không phản hồi!`);
    console.error('👉 Vui lòng khởi động backend bằng lệnh: cd backend && npm run dev');
    process.exit(1);
  }
  console.log('✅ Máy chủ Backend phản hồi tốt (Status: OK).');

  // Xác định đường dẫn k6 binary
  const localK6Path = path.join(projectRoot, 'experiments/load/bin/k6.exe');
  let k6Command = 'k6';

  if (fs.existsSync(localK6Path)) {
    k6Command = localK6Path;
    console.log(`[2/3] Sử dụng k6 binary cục bộ: ${localK6Path}`);
  } else {
    console.log('[2/3] Sử dụng k6 từ hệ thống PATH...');
  }

  const scriptPath = path.join(__dirname, 'k6_stress_test.js');
  console.log(`[3/3] Đang thực thi kịch bản: ${scriptPath}`);
  console.log('⏳ Kịch bản đang chạy (dự kiến ~70 giây): 0 -> 25 -> 100 VUs...');
  console.log('----------------------------------------------------------------\n');

  const child = spawn(k6Command, ['run', scriptPath], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, BASE_URL: baseUrl },
  });

  child.on('close', (code) => {
    console.log('\n----------------------------------------------------------------');
    if (code === 0) {
      console.log('🎉 KIỂM THỬ TẢI K6 HOÀN TẤT THÀNH CÔNG! (TẤT CẢ THRESHOLDS ĐẠT CHUẨN)');
      console.log('📄 Báo cáo chi tiết đã lưu tại: experiments/load/k6_summary.txt');
      console.log('📊 Dữ liệu JSON thô đã lưu tại: experiments/load/k6_results.json');
    } else {
      console.warn(`⚠️ K6 kết thúc với mã thoát: ${code}. Một số ngưỡng có thể chưa đạt hoặc bị gián đoạn.`);
    }
    console.log('================================================================');
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
