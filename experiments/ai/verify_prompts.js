import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'prompts_130.json');
const csvPath = path.join(__dirname, 'prompts_130.csv');

const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('=================================================================================');
console.log('🤖 KIỂM TRA ĐỘ BAO PHỦ VÀ TÍNH HỢP LỆ: BỘ 130 CÂU PROMPT CHATBOT HR AI');
console.log('=================================================================================\n');

let totalCount = 0;
const flatList = [];

for (const group of rawData) {
  const count = group.items.length;
  totalCount += count;
  console.log(`  📂 [${group.category}] ${group.groupName}: ${count} câu`);
  for (const item of group.items) {
    flatList.push({
      id: item.id,
      category: group.category,
      prompt: item.prompt,
      expectedTool: item.expectedTool,
      targetRole: item.targetRole,
      description: item.description,
    });
  }
}

console.log('\n---------------------------------------------------------------------------------');
console.log(`✅ TỔNG SỐ PROMPTS ĐÃ CHUẨN HÓA: ${totalCount} / 130 CÂU PROMPTS (${totalCount === 130 ? '100% ĐẠT CHUẨN' : 'CHƯA ĐỦ 130 CÂU'})`);
console.log('---------------------------------------------------------------------------------\n');

// Phân bố theo Expected Tool
const toolDistribution = {};
for (const item of flatList) {
  toolDistribution[item.expectedTool] = (toolDistribution[item.expectedTool] || 0) + 1;
}

console.log('📊 PHÂN BỐ THEO EXPECTED TOOL ĐƯỢC KÍCH HOẠT:');
for (const [tool, cnt] of Object.entries(toolDistribution)) {
  console.log(`  - Tool "${tool}": ${cnt} câu (${((cnt / totalCount) * 100).toFixed(1)}%)`);
}

// Xuất file CSV
const csvHeaders = ['STT', 'Mã Prompt', 'Nhóm Kiểm Thử', 'Vai Trò Người Dùng', 'Tool Kỳ Vọng', 'Câu Prompt', 'Mô Tả Mục Tiêu'];
const csvRows = flatList.map((item, idx) => [
  idx + 1,
  item.id,
  item.category,
  item.targetRole,
  item.expectedTool,
  `"${item.prompt.replace(/"/g, '""')}"`,
  `"${item.description.replace(/"/g, '""')}"`,
]);

const csvContent = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
fs.writeFileSync(csvPath, '\uFEFF' + csvContent, 'utf-8');

console.log(`\n💾 Đã xuất bộ dữ liệu dạng bảng CSV: ${csvPath}`);
console.log('🎉 [BỘ DỮ LIỆU ĐÃ SẴN SÀNG PHỤC VỤ NGHIỆM THU PHƯƠNG ÁN A TUẦN 6]');
console.log('=================================================================================\n');
