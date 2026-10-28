import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

// Tập hợp toàn bộ danh sách API Keys (Hỗ trợ không giới hạn số lượng key)
const rawKeys = [
  ...config.gemini.apiKeys,
  config.gemini.primaryKey,
  config.gemini.fallbackKey,
].filter(Boolean);

// Loại bỏ trùng lặp
const uniqueKeys = Array.from(new Set(rawKeys));

const keyPool = uniqueKeys.map((k) => ({
  key: k,
  client: new GoogleGenAI({ apiKey: k }),
  cooldownUntil: 0,
}));

console.log(`[Gemini Pool] Đã nạp thành công ${keyPool.length} keys vào bể chứa luân phiên.`);

let currentIndex = 0;

/**
 * Lấy client tiếp theo khả dụng theo cơ chế Round-Robin Pool
 */
export const getGeminiClient = (useFallback = false) => {
  if (keyPool.length === 0) return null;

  const now = Date.now();
  // Tìm key đang sẵn sàng (không bị cooldown)
  for (let i = 0; i < keyPool.length; i++) {
    const idx = (currentIndex + i) % keyPool.length;
    if (keyPool[idx].cooldownUntil <= now) {
      currentIndex = (idx + 1) % keyPool.length;
      return keyPool[idx].client;
    }
  }

  // Nếu tất cả đều đang cooldown, trả về key có thời gian chờ ngắn nhất
  const sorted = [...keyPool].sort((a, b) => a.cooldownUntil - b.cooldownUntil);
  return sorted[0].client;
};

/**
 * Đánh dấu một key bị rate-limit tạm thời nghỉ trong X giây
 */
export const markKeyCooldown = (client, seconds = 60) => {
  const item = keyPool.find((k) => k.client === client);
  if (item) {
    item.cooldownUntil = Date.now() + seconds * 1000;
    console.warn(`[Gemini Pool] Tạm ngưng key ${item.key.slice(0, 8)}... trong ${seconds}s do quá tải/hết quota.`);
  }
};

/**
 * Thực thi gọi AI tự động xoay tua lần lượt qua các key trong Pool nếu gặp lỗi Quota (429/ResourceExhausted)
 */
export const executeWithKeyRotation = async (fn) => {
  if (keyPool.length === 0) {
    throw new Error('Chưa cấu hình bất kỳ Gemini API Key nào trong hệ thống');
  }

  const attempts = keyPool.length;
  let lastError = null;

  for (let i = 0; i < attempts; i++) {
    const client = getGeminiClient();
    try {
      return await fn(client);
    } catch (err) {
      lastError = err;
      const isQuotaOrSpikeErr =
        err.message?.includes('429') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('quota') ||
        err.message?.includes('rate') ||
        err.message?.includes('503') ||
        err.message?.includes('UNAVAILABLE') ||
        err.message?.includes('high demand');

      if (isQuotaOrSpikeErr) {
        markKeyCooldown(client, 30);
        console.warn(`[Gemini Rotation] Key/Model gặp lỗi tạm thời (Quota/503). Chuyển ngay sang key tiếp theo trong Pool (${i + 1}/${attempts})...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
};

/**
 * Lấy trạng thái hiện tại của Key Pool (Dùng cho giám sát)
 */
export const getKeyPoolStatus = () => {
  const now = Date.now();
  return {
    totalKeys: keyPool.length,
    activeKeys: keyPool.filter((k) => k.cooldownUntil <= now).length,
    coolingKeys: keyPool.filter((k) => k.cooldownUntil > now).length,
  };
};

export const getActiveModelName = (useFallbackModel = false) => {
  if (useFallbackModel) {
    return config.gemini?.fallbackModel || 'gemini-3.1-flash-lite';
  }
  return config.gemini?.model || 'gemini-3.5-flash';
};
