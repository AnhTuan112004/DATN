import crypto from 'crypto';

/**
 * Service quản lý Nonce thử thách FaceID Kiosk (One-time Nonce, TTL 60s)
 * Lưu trữ trong bộ nhớ RAM (không tạo collection mới) theo quy chuẩn v6.1 FINAL FREEZE
 */

// Danh sách các thử thách Liveness Tầng 1
export const LIVENESS_CHALLENGES = {
  BLINK: {
    type: 'BLINK',
    instruction: 'Vui lòng chớp mắt 1 lần trước ống kính',
    description: 'Chuyển đổi trạng thái mắt mở -> nhắm -> mở lại trong 100-800ms',
  },
  SMILE: {
    type: 'SMILE',
    instruction: 'Vui lòng mỉm cười hoặc mở rộng khẩu hình',
    description: 'Tỷ lệ miệng MAR tăng vượt ngưỡng phát hiện cử động cơ mặt tự nhiên',
  },
  TURN_LEFT: {
    type: 'TURN_LEFT',
    instruction: 'Vui lòng quay mặt nhẹ sang bên trái',
    description: 'Góc quay Yaw lệch sang trái >= 15 độ so với trục chính diện',
  },
  TURN_RIGHT: {
    type: 'TURN_RIGHT',
    instruction: 'Vui lòng quay mặt nhẹ sang bên phải',
    description: 'Góc quay Yaw lệch sang phải >= 15 độ so với trục chính diện',
  },
};

const challengeTypes = Object.keys(LIVENESS_CHALLENGES);

// Bộ nhớ RAM lưu trữ nonces đang có hiệu lực: Map<nonce, ChallengeData>
const activeNonceMap = new Map();

// Tự động dọn dẹp các nonce hết hạn mỗi 30 giây
setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of activeNonceMap.entries()) {
    if (data.expiresAt <= now) {
      activeNonceMap.delete(nonce);
    }
  }
}, 30000).unref(); // unref để không chặn tiến trình Jest hoặc Node thoát

/**
 * Sinh Nonce thử thách ngẫu nhiên cho thiết bị Kiosk
 * @param {string} companyId ID công ty sở hữu Kiosk
 * @param {string} deviceId ID thiết bị Kiosk
 * @param {string} preferredChallenge (Tùy chọn) Loại thử thách mong muốn
 * @returns {object} { nonce, challengeType, instruction, expiresIn }
 */
export const createKioskChallenge = (companyId, deviceId, preferredChallenge = null) => {
  const nonce = crypto.randomBytes(24).toString('hex');
  const challengeType = preferredChallenge && challengeTypes.includes(preferredChallenge)
    ? preferredChallenge
    : challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  const now = Date.now();
  const ttlMs = 60 * 1000; // 60 giây
  const expiresAt = now + ttlMs;

  const challengeInfo = LIVENESS_CHALLENGES[challengeType];

  activeNonceMap.set(nonce, {
    companyId: companyId.toString(),
    deviceId: deviceId.toString(),
    challengeType,
    createdAt: now,
    expiresAt,
  });

  return {
    nonce,
    challengeType,
    instruction: challengeInfo.instruction,
    expiresIn: 60,
    expiresAt: new Date(expiresAt).toISOString(),
  };
};

/**
 * Thẩm định và TIÊU HỦY NGAY LẬP TỨC Nonce (Bảo đảm One-Time Usage)
 * Ngăn chặn tuyệt đối Replay Attack
 * @param {string} nonce Chuỗi nonce từ client
 * @param {string} companyId ID công ty gửi request
 * @param {string} deviceId ID thiết bị Kiosk
 * @returns {object} Thông tin thử thách đã lưu
 */
export const verifyAndConsumeNonce = (nonce, companyId, deviceId) => {
  if (!nonce || typeof nonce !== 'string') {
    throw new Error('INVALID_NONCE: Nonce thử thách không hợp lệ hoặc bị để trống');
  }

  const stored = activeNonceMap.get(nonce);
  if (!stored) {
    throw new Error('EXPIRED_OR_REUSED_NONCE: Thử thách đã hết hạn hoặc đã được sử dụng trước đó (Chống Replay Attack)');
  }

  // Tiêu hủy Nonce ngay lập tức khỏi bộ nhớ
  activeNonceMap.delete(nonce);

  // Kiểm tra thời hạn hiệu lực
  if (Date.now() > stored.expiresAt) {
    throw new Error('CHALLENGE_TIMEOUT: Thử thách đã quá thời gian 60 giây, vui lòng lấy thử thách mới');
  }

  // Kiểm tra tenant và device khớp
  if (stored.companyId !== companyId.toString() || stored.deviceId !== deviceId.toString()) {
    throw new Error('DEVICE_MISMATCH: Thử thách này không thuộc về thiết bị hoặc công ty hiện tại');
  }

  return stored;
};

/**
 * Xóa toàn bộ nonces trong RAM (phục vụ Unit Test)
 */
export const _clearAllNoncesForTest = () => {
  activeNonceMap.clear();
};
