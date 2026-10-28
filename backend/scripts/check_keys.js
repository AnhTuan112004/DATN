import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config/env.js';

const rawKeys = [
  ...config.gemini.apiKeys,
  config.gemini.primaryKey,
  config.gemini.fallbackKey,
].filter(Boolean);

const uniqueKeys = Array.from(new Set(rawKeys));

console.log(`\n🔍 Đang kiểm tra sức khỏe ${uniqueKeys.length} API Keys trong hệ thống...\n`);

const testKeys = async () => {
  for (let i = 0; i < uniqueKeys.length; i++) {
    const key = uniqueKeys[i];
    const maskedKey = `${key.slice(0, 8)}...${key.slice(-4)}`;
    const ai = new GoogleGenAI({ apiKey: key });

    // Thử nghiệm với gemini-3.5-flash
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
      console.log(`✅ Key #${i + 1} (${maskedKey}): SỐNG TỐT (gemini-3.5-flash phản hồi bình thường)`);
    } catch (err35) {
      const is503 = err35.message?.includes('503') || err35.message?.includes('high demand') || err35.message?.includes('UNAVAILABLE');
      const is429 = err35.message?.includes('429') || err35.message?.includes('RESOURCE_EXHAUSTED') || err35.message?.includes('quota');

      // Thử fallback model gemini-3.1-flash-lite
      try {
        await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        });
        if (is503) {
          console.log(`⚠️ Key #${i + 1} (${maskedKey}): KHÔNG HẾT QUOTA (Chỉ là gemini-3.5-flash đang nghẽn 503 từ Google, nhưng gemini-3.1-flash-lite HOẠT ĐỘNG 100%)`);
        } else if (is429) {
          console.log(`⚠️ Key #${i + 1} (${maskedKey}): gemini-3.5-flash hết quota lượt/phút, nhưng gemini-3.1-flash-lite VẪN CHẠY TỐT`);
        } else {
          console.log(`⚠️ Key #${i + 1} (${maskedKey}): gemini-3.5-flash lỗi (${err35.message?.slice(0, 50)}), fallback gemini-3.1-flash-lite VẪN CHẠY`);
        }
      } catch (err31) {
        const is429Lite = err31.message?.includes('429') || err31.message?.includes('RESOURCE_EXHAUSTED') || err31.message?.includes('quota');
        if (is429Lite) {
          console.log(`❌ Key #${i + 1} (${maskedKey}): ĐÃ HẾT QUOTA (Cả 3.5 và 3.1 đều báo 429)`);
        } else {
          console.log(`❌ Key #${i + 1} (${maskedKey}): LỖI KHÁC (${err31.message?.slice(0, 80)})`);
        }
      }
    }
  }
  console.log(`\nHoàn tất kiểm tra!\n`);
  process.exit(0);
};

testKeys();
