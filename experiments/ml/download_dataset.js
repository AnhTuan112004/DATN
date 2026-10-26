/**
 * Script tải tập dữ liệu chuẩn IBM HR Analytics Employee Attrition & Performance
 * Nguồn: Nelson Wu / IBM Watson Analytics mirror
 * Kích thước: 1,470 bản ghi nhân sự, 35 thuộc tính
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_URL = 'https://raw.githubusercontent.com/nelson-wu/employee-attrition-ml/master/WA_Fn-UseC_-HR-Employee-Attrition.csv';
const TARGET_DIR = path.join(__dirname, 'dataset');
const TARGET_FILE = path.join(TARGET_DIR, 'WA_Fn-UseC_-HR-Employee-Attrition.csv');

async function downloadDataset() {
  console.log('================================================================================');
  console.log('📥 BẮT ĐẦU TẢI TẬP DỮ LIỆU IBM HR ATTRITION DATASET');
  console.log('================================================================================');
  console.log(`- Nguồn tải: ${DATASET_URL}`);
  console.log(`- Đích lưu:  ${TARGET_FILE}\n`);

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`📁 Đã tạo thư mục: ${TARGET_DIR}`);
  }

  // Nếu file đã tồn tại và đủ dữ liệu, không cần tải lại
  if (fs.existsSync(TARGET_FILE)) {
    const stats = fs.statSync(TARGET_FILE);
    if (stats.size > 50000) {
      console.log(`✅ File dataset đã tồn tại sẵn (${stats.size} bytes). Bỏ qua bước tải.`);
      return TARGET_FILE;
    }
  }

  try {
    console.log('⏳ Đang kết nối và tải file...');
    const response = await fetch(DATASET_URL);
    if (!response.ok) {
      throw new Error(`Tải file thất bại! HTTP Status: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    fs.writeFileSync(TARGET_FILE, csvText, 'utf-8');

    const lines = csvText.trim().split('\n');
    console.log(`✅ Tải file thành công!`);
    console.log(`   - Kích thước: ${(csvText.length / 1024).toFixed(2)} KB`);
    console.log(`   - Tổng số dòng: ${lines.length} dòng (1 header + ${lines.length - 1} records)`);
    console.log(`   - Header: ${lines[0].slice(0, 100)}...`);
    console.log('================================================================================\n');
    return TARGET_FILE;
  } catch (err) {
    console.error(`❌ Lỗi tải dataset: ${err.message}`);
    throw err;
  }
}

downloadDataset().catch((err) => {
  console.error(err);
  process.exit(1);
});
