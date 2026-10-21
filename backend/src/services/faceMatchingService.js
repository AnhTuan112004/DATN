/**
 * Thuật toán so khớp vector sinh trắc học 1:N & Kiểm soát FAR tại Server
 * Tuân thủ nghiêm ngặt Hiến pháp v6.1 FINAL FREEZE và kết quả Spike Tuần 0
 */

// Các ngưỡng chuẩn từ thực nghiệm Spike Tuần 0 (trials.csv)
export const MATCHING_THRESHOLDS = {
  EUCLIDEAN_MAX: 0.60,             // Ngưỡng tối đa chấp nhận nhận diện đúng người
  COSINE_MAX: 0.35,                // Ngưỡng Cosine đối chiếu song song
  LIVENESS_CONTINUITY_MAX: 0.40,   // Ngưỡng tối đa giữa V_start và V_end xuyên suốt thử thách
  SEPARATION_MARGIN_MIN: 0.15,     // Biên an toàn phân tách giữa ứng viên tốt nhất (d1) và thứ nhì (d2)
};

/**
 * Tính khoảng cách Euclid (Euclidean Distance) giữa 2 vector cùng số chiều
 * d(u, v) = sqrt(sum((u_i - v_i)^2))
 */
export const calculateEuclideanDistance = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('VECTOR_DIMENSION_MISMATCH: Hai vector phải cùng số chiều để tính khoảng cách');
  }

  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return parseFloat(Math.sqrt(sum).toFixed(4));
};

/**
 * Tính khoảng cách Cosine (Cosine Distance) giữa 2 vector
 * d_C(u, v) = 1 - (u . v) / (||u|| * ||v||)
 */
export const calculateCosineDistance = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('VECTOR_DIMENSION_MISMATCH: Hai vector phải cùng số chiều để tính khoảng cách');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }

  if (normA === 0 || normB === 0) return 1.0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  const distance = Math.max(0, 1 - similarity);
  return parseFloat(distance.toFixed(4));
};

/**
 * Thẩm định tính liên tục sinh lý học xuyên suốt thử thách Liveness
 * Chứng minh cùng 1 người thực hiện từ lúc bắt đầu (V_start) đến kết thúc (V_end)
 * @param {number[]} vStart Vector chụp lúc nhận thử thách
 * @param {number[]} vEnd Vector chụp lúc hoàn thành thử thách
 */
export const verifyLivenessContinuity = (vStart, vEnd) => {
  const distance = calculateEuclideanDistance(vStart, vEnd);
  const isValid = distance <= MATCHING_THRESHOLDS.LIVENESS_CONTINUITY_MAX;

  return {
    isValid,
    distance,
    threshold: MATCHING_THRESHOLDS.LIVENESS_CONTINUITY_MAX,
    message: isValid
      ? 'Xác nhận tính liên tục thực thể sống đạt chuẩn'
      : `Phát hiện tráo đổi người/phương tiện giả mạo trong quá trình thử thách (d=${distance} > ${MATCHING_THRESHOLDS.LIVENESS_CONTINUITY_MAX})`,
  };
};

/**
 * So khớp 1:N giữa vector truy vấn và toàn bộ mẫu khuôn mặt của công ty
 * Áp dụng quy tắc biên an toàn phân tách (Separation Margin) để kiểm soát FAR = 0
 * @param {number[]} queryVector Vector 128D cần nhận diện (V_end)
 * @param {Array} faceTemplates Danh sách document FaceTemplate đã lấy từ DB
 */
export const matchFace1ToN = (queryVector, faceTemplates) => {
  if (!Array.isArray(faceTemplates) || faceTemplates.length === 0) {
    return {
      success: false,
      reason: 'NO_TEMPLATES_REGISTERED',
      message: 'Công ty chưa có mẫu khuôn mặt nào được đăng ký trong hệ thống',
    };
  }

  const candidateScores = [];

  // 1. Duyệt qua từng template và giải mã descriptors trong RAM
  for (const template of faceTemplates) {
    const descriptors = template.getDecryptedDescriptors();
    if (!Array.isArray(descriptors) || descriptors.length === 0) continue;

    let bestEuclid = Infinity;
    let bestCosine = Infinity;

    for (const desc of descriptors) {
      const euclid = calculateEuclideanDistance(queryVector, desc);
      const cosine = calculateCosineDistance(queryVector, desc);

      if (euclid < bestEuclid) {
        bestEuclid = euclid;
        bestCosine = cosine;
      }
    }

    candidateScores.push({
      template,
      userId: template.userId,
      euclideanDistance: bestEuclid,
      cosineDistance: bestCosine,
    });
  }

  if (candidateScores.length === 0) {
    return {
      success: false,
      reason: 'NO_VALID_DESCRIPTORS',
      message: 'Không tìm thấy vector mẫu hợp lệ để đối chiếu',
    };
  }

  // 2. Sắp xếp tăng dần theo khoảng cách Euclid (khoảng cách càng nhỏ càng giống)
  candidateScores.sort((a, b) => a.euclideanDistance - b.euclideanDistance);

  const top1 = candidateScores[0];
  const d1 = top1.euclideanDistance;
  const c1 = top1.cosineDistance;

  // 3. Kiểm tra ngưỡng nhận diện cơ bản (d1 <= 0.60 và c1 <= 0.35)
  if (d1 > MATCHING_THRESHOLDS.EUCLIDEAN_MAX || c1 > MATCHING_THRESHOLDS.COSINE_MAX) {
    return {
      success: false,
      reason: 'NO_MATCH_FOUND',
      message: `Khuôn mặt không khớp với bất kỳ nhân sự nào trong hệ thống (d=${d1} > ${MATCHING_THRESHOLDS.EUCLIDEAN_MAX})`,
      bestDistance: d1,
    };
  }

  // 4. Kiểm soát FAR bài toán 1:N qua quy tắc biên phân tách (Separation Margin)
  if (candidateScores.length >= 2) {
    const top2 = candidateScores[1];
    const d2 = top2.euclideanDistance;
    const margin = parseFloat((d2 - d1).toFixed(4));

    // Nếu khoảng cách giữa ứng viên 1 và ứng viên 2 quá gần (< 0.15) -> Rơi vào vùng rủi ro nhận nhầm
    if (margin < MATCHING_THRESHOLDS.SEPARATION_MARGIN_MIN) {
      return {
        success: false,
        reason: 'AMBIGUOUS_MATCH',
        fallbackTo1To1: true,
        message: `Độ chênh lệch giữa hai ứng viên (${margin}) nhỏ hơn biên an toàn ${MATCHING_THRESHOLDS.SEPARATION_MARGIN_MIN}. Vui lòng quét mã QR hoặc nhập mã nhân viên để xác minh 1:1.`,
        margin,
        topCandidates: [
          { userId: top1.userId, distance: d1 },
          { userId: top2.userId, distance: d2 },
        ],
      };
    }
  }

  // 5. Thỏa mãn cả ngưỡng nhận diện lẫn biên an toàn -> Nhận diện thành công 100%
  const confidence = parseFloat((1 - d1 / MATCHING_THRESHOLDS.EUCLIDEAN_MAX).toFixed(4));

  return {
    success: true,
    matchedTemplate: top1.template,
    userId: top1.userId,
    euclideanDistance: d1,
    cosineDistance: c1,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
};
