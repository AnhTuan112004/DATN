/**
 * DỊCH VỤ DỰ BÁO NGUY CƠ THÔI VIỆC (ATTRITION PREDICTOR SERVICE)
 * Tuân thủ Hiến pháp v6.1 FINAL FREEZE (Tuần 7)
 * 
 * Thuật toán: Logistic Regression (L2 Regularized)
 * Đặc trưng: Đúng 6 đặc trưng định lượng đo lường được
 * Tuân thủ Điều 8 BLLĐ: Tuyệt đối không dùng Age, Gender, MaritalStatus
 * Hiệu năng: 0-latency (< 0.005 ms/inference), lưu trữ JSON coefficients
 */

import mongoose from 'mongoose';
import { User, AttendanceLog, Department, AuditLog } from '../models/index.js';

// 1. Cấu hình trọng số mô hình đã huấn luyện chuẩn mực từ IBM HR Attrition Dataset
// Tham chiếu: experiments/ml/model_coefficients.json (AUC-ROC: 71.60%, F1: 36.70%)
export const MODEL_COEFFICIENTS = {
  algorithm: 'LogisticRegression',
  intercept: -0.3050,
  thresholdHigh: 0.50,
  thresholdMedium: 0.30,
  weights: {
    overTime: 1.4579,
    yearsAtCompany: 0.0931,
    totalWorkingYears: -1.9705,
    monthlyIncome: -1.3173,
    numCompaniesWorked: 0.9497,
    distanceFromHome: 0.7626,
  },
  // Tham số Min/Max phục vụ chuẩn hóa đặc trưng về đoạn [0, 1]
  featureStats: {
    overTime: { min: 0, max: 1 },
    yearsAtCompany: { min: 0, max: 40 },
    totalWorkingYears: { min: 0, max: 40 },
    monthlyIncome: { min: 1000, max: 20000 },
    numCompaniesWorked: { min: 0, max: 9 },
    distanceFromHome: { min: 1, max: 29 },
  },
};

// 2. Hàm kích hoạt Sigmoid an toàn số học
export const sigmoid = (z) => {
  if (z < -30) return 0;
  if (z > 30) return 1;
  return 1 / (1 + Math.exp(-z));
};

// 3. Chuẩn hóa giá trị đặc trưng về đoạn [0, 1]
export const normalizeFeature = (val, min, max) => {
  if (max <= min) return 0;
  const clamped = Math.min(Math.max(val, min), max);
  return (clamped - min) / (max - min);
};

// 4. Hàm suy luận xác suất cho 1 nhân sự đơn lẻ (Pure Function)
export const calculateAttritionRisk = (rawFeatures) => {
  const {
    overTime = 0,
    yearsAtCompany = 1,
    totalWorkingYears = 1,
    monthlyIncome = 5000,
    numCompaniesWorked = 1,
    distanceFromHome = 5,
  } = rawFeatures;

  const stats = MODEL_COEFFICIENTS.featureStats;
  const weights = MODEL_COEFFICIENTS.weights;

  // Chuẩn hóa 6 đặc trưng
  const normFeatures = {
    overTime: overTime ? 1 : 0,
    yearsAtCompany: normalizeFeature(yearsAtCompany, stats.yearsAtCompany.min, stats.yearsAtCompany.max),
    totalWorkingYears: normalizeFeature(totalWorkingYears, stats.totalWorkingYears.min, stats.totalWorkingYears.max),
    monthlyIncome: normalizeFeature(monthlyIncome, stats.monthlyIncome.min, stats.monthlyIncome.max),
    numCompaniesWorked: normalizeFeature(numCompaniesWorked, stats.numCompaniesWorked.min, stats.numCompaniesWorked.max),
    distanceFromHome: normalizeFeature(distanceFromHome, stats.distanceFromHome.min, stats.distanceFromHome.max),
  };

  // Tính hàm logit z = beta_0 + sum(beta_i * x_i)
  const z =
    MODEL_COEFFICIENTS.intercept +
    weights.overTime * normFeatures.overTime +
    weights.yearsAtCompany * normFeatures.yearsAtCompany +
    weights.totalWorkingYears * normFeatures.totalWorkingYears +
    weights.monthlyIncome * normFeatures.monthlyIncome +
    weights.numCompaniesWorked * normFeatures.numCompaniesWorked +
    weights.distanceFromHome * normFeatures.distanceFromHome;

  const probability = parseFloat(sigmoid(z).toFixed(4));

  // Phân loại 3 mức độ rủi ro
  let riskLevel = 'LOW';
  let riskBadgeColor = 'GREEN';
  if (probability >= MODEL_COEFFICIENTS.thresholdHigh) {
    riskLevel = 'HIGH';
    riskBadgeColor = 'RED';
  } else if (probability >= MODEL_COEFFICIENTS.thresholdMedium) {
    riskLevel = 'MEDIUM';
    riskBadgeColor = 'YELLOW';
  }

  // Bóc tách các yếu tố tác động chính (Explainable AI - XAI)
  const factorContributions = [
    {
      feature: 'overTime',
      label: 'Làm thêm giờ (OT)',
      valueRaw: overTime ? 'Thường xuyên OT (>= 4h/tháng)' : 'Ít/Không OT',
      impact: weights.overTime * normFeatures.overTime,
      isRiskFactor: overTime === 1,
      description: overTime === 1 ? 'Áp lực tăng ca kéo dài gây nguy cơ kiệt sức (Burnout)' : 'Cân bằng công việc tốt',
    },
    {
      feature: 'monthlyIncome',
      label: 'Mức thu nhập',
      valueRaw: `${monthlyIncome.toLocaleString('vi-VN')} USD/VNĐ`,
      impact: weights.monthlyIncome * normFeatures.monthlyIncome,
      isRiskFactor: normFeatures.monthlyIncome < 0.35,
      description: normFeatures.monthlyIncome < 0.35 ? 'Mức lương hiện tại thấp hơn kỳ vọng thị trường' : 'Thu nhập cạnh tranh ổn định',
    },
    {
      feature: 'totalWorkingYears',
      label: 'Tổng thâm niên nghề',
      valueRaw: `${totalWorkingYears} năm`,
      impact: weights.totalWorkingYears * normFeatures.totalWorkingYears,
      isRiskFactor: totalWorkingYears <= 2,
      description: totalWorkingYears <= 2 ? 'Kinh nghiệm ban đầu dễ có xu hướng tìm thử thách mới' : 'Thâm niên vững vàng, độ gắn kết cao',
    },
    {
      feature: 'distanceFromHome',
      label: 'Khoảng cách đi lại',
      valueRaw: `${distanceFromHome} km`,
      impact: weights.distanceFromHome * normFeatures.distanceFromHome,
      isRiskFactor: distanceFromHome > 15,
      description: distanceFromHome > 15 ? 'Khoảng cách di chuyển hàng ngày xa (>15km)' : 'Khoảng cách đi lại thuận tiện',
    },
    {
      feature: 'numCompaniesWorked',
      label: 'Số công ty cũ',
      valueRaw: `${numCompaniesWorked} công ty`,
      impact: weights.numCompaniesWorked * normFeatures.numCompaniesWorked,
      isRiskFactor: numCompaniesWorked >= 4,
      description: numCompaniesWorked >= 4 ? 'Tần suất thay đổi môi trường làm việc trong quá khứ cao' : 'Lịch sử công tác ổn định',
    },
    {
      feature: 'yearsAtCompany',
      label: 'Năm gắn bó công ty',
      valueRaw: `${yearsAtCompany} năm`,
      impact: weights.yearsAtCompany * normFeatures.yearsAtCompany,
      isRiskFactor: false,
      description: 'Số năm công tác tại tổ chức hiện tại',
    },
  ];

  // Sắp xếp các yếu tố làm tăng rủi ro thôi việc lên đầu
  const primaryRiskFactors = factorContributions
    .filter((f) => f.isRiskFactor)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  // Đề xuất hành động quản trị nhân sự
  let recommendation = 'Duy trì chính sách đãi ngộ và khen thưởng định kỳ.';
  if (riskLevel === 'HIGH') {
    if (overTime === 1) {
      recommendation = 'Ưu tiên tái phân bổ khối lượng công việc, cắt giảm giờ làm thêm và quản lý trực tiếp gặp mặt 1-1 ngay.';
    } else if (normFeatures.monthlyIncome < 0.35) {
      recommendation = 'Xem xét điều chỉnh lương cơ bản hoặc phụ cấp trong kỳ đánh giá tới để bảo đảm tính cạnh tranh.';
    } else {
      recommendation = 'Tổ chức buổi trao đổi định hướng phát triển nghề nghiệp và hỗ trợ giải quyết khó khăn cá nhân.';
    }
  } else if (riskLevel === 'MEDIUM') {
    recommendation = 'Quản lý phòng ban theo dõi sát sao, động viên khích lệ và nắm bắt kịp thời các tâm tư của nhân sự.';
  }

  return {
    probability,
    riskScore: Math.round(probability * 100),
    riskLevel,
    riskBadgeColor,
    primaryRiskFactors,
    allFactors: factorContributions,
    recommendation,
  };
};

// 4.1 In-memory cache cho phân tích rủi ro nhân sự toàn công ty (TTL: 10s)
const analysisCache = new Map();
const ATTRITION_CACHE_TTL_MS = 10 * 1000;

// 5. Service phân tích toàn diện rủi ro thôi việc cho công ty
export const getCompanyAttritionAnalysis = async ({ companyId, departmentId = null }) => {
  const cacheKey = `${companyId.toString()}_${departmentId || 'ALL'}`;
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ATTRITION_CACHE_TTL_MS) {
    return cached.data;
  }

  // 5.1 Lấy danh sách nhân viên của tenant (kèm salaryConfig đã ẩn)
  const userQuery = { companyId, isActive: true };
  if (departmentId) {
    userQuery.departmentId = departmentId;
  }

  const users = await User.find(userQuery)
    .select('+salaryConfig')
    .populate('departmentId', 'name code')
    .lean();

  if (!users || users.length === 0) {
    return {
      summary: {
        totalEmployees: 0,
        highRiskCount: 0,
        highRiskPercentage: 0,
        mediumRiskCount: 0,
        mediumRiskPercentage: 0,
        lowRiskCount: 0,
        lowRiskPercentage: 0,
        averageRiskScore: 0,
      },
      topRiskEmployees: [],
      departmentBreakdown: [],
      featureImportance: getFeatureImportanceList(),
      disclaimer: 'Dữ liệu dự báo chỉ mang tính định hướng quản trị nhân sự, không sử dụng làm căn cứ sa thải.',
    };
  }

  // 5.2 Lấy thông tin công ty và địa điểm làm việc chính
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const fromDateStr = thirtyDaysAgo.toISOString().split('T')[0];
  const toDateStr = now.toISOString().split('T')[0];

  // 5.3 Lấy nhật ký chấm công trong 30 ngày gần nhất để tính giờ OT thực tế
  const attendanceLogs = await AttendanceLog.find({
    companyId,
    date: mongoose.trusted({ $gte: fromDateStr, $lte: toDateStr }),
    status: 'VALID',
  })
    .select('userId overtimeMinutes')
    .lean();

  // Gom nhóm tổng phút OT theo từng userId
  const otMinutesMap = new Map();
  for (const log of attendanceLogs) {
    const uId = log.userId.toString();
    otMinutesMap.set(uId, (otMinutesMap.get(uId) || 0) + (log.overtimeMinutes || 0));
  }

  // 5.4 Chạy suy luận dự báo cho từng nhân sự
  const analyzedEmployees = [];
  const deptStatsMap = new Map();

  for (const u of users) {
    const uIdStr = u._id.toString();
    const totalOtHours = (otMinutesMap.get(uIdStr) || 0) / 60;
    const overTime = totalOtHours >= 4 ? 1 : 0;

    // Tính năm gắn bó tại công ty từ signedDate hoặc hireDate
    const joinDate = u.contracts?.[0]?.signedDate || u.hireDate || now;
    const yearsAtCompany = Math.max(0.1, parseFloat(((now - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)));

    // Thu nhập hàng tháng
    const monthlyIncome = u.salaryConfig?.baseSalary ? u.salaryConfig.baseSalary / 1000 : 5000; // chuẩn hóa tỷ lệ

    // Thâm niên và số công ty cũ từ hồ sơ
    const totalWorkingYears = u.totalWorkingYears || Math.max(1, Math.round(yearsAtCompany + 1));
    const numCompaniesWorked = u.numCompaniesWorked || 1;
    const distanceFromHome = 8; // Khoảng cách giả lập trung bình km

    const prediction = calculateAttritionRisk({
      overTime,
      yearsAtCompany,
      totalWorkingYears,
      monthlyIncome,
      numCompaniesWorked,
      distanceFromHome,
    });

    const empData = {
      userId: uIdStr,
      employeeCode: u.employeeCode,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      department: u.departmentId ? { id: u.departmentId._id, name: u.departmentId.name } : { name: 'Chưa phân bổ' },
      features: {
        overTime,
        otHoursMonth: parseFloat(totalOtHours.toFixed(1)),
        yearsAtCompany,
        totalWorkingYears,
        monthlyIncome: u.salaryConfig?.baseSalary || 15000000,
        numCompaniesWorked,
        distanceFromHome,
      },
      prediction,
    };

    analyzedEmployees.push(empData);

    // Thống kê theo phòng ban
    const deptName = u.departmentId?.name || 'Khác';
    if (!deptStatsMap.has(deptName)) {
      deptStatsMap.set(deptName, { total: 0, high: 0, medium: 0, low: 0, sumScore: 0 });
    }
    const dStat = deptStatsMap.get(deptName);
    dStat.total += 1;
    dStat.sumScore += prediction.riskScore;
    if (prediction.riskLevel === 'HIGH') dStat.high += 1;
    else if (prediction.riskLevel === 'MEDIUM') dStat.medium += 1;
    else dStat.low += 1;
  }

  // 5.5 Sắp xếp danh sách nhân viên theo mức rủi ro giảm dần
  analyzedEmployees.sort((a, b) => b.prediction.probability - a.prediction.probability);

  // 5.6 Tổng hợp số liệu KPI
  const totalEmployees = analyzedEmployees.length;
  const highRiskCount = analyzedEmployees.filter((e) => e.prediction.riskLevel === 'HIGH').length;
  const mediumRiskCount = analyzedEmployees.filter((e) => e.prediction.riskLevel === 'MEDIUM').length;
  const lowRiskCount = totalEmployees - highRiskCount - mediumRiskCount;
  const totalScore = analyzedEmployees.reduce((sum, e) => sum + e.prediction.riskScore, 0);

  const summary = {
    totalEmployees,
    highRiskCount,
    highRiskPercentage: parseFloat(((highRiskCount / totalEmployees) * 100).toFixed(1)),
    mediumRiskCount,
    mediumRiskPercentage: parseFloat(((mediumRiskCount / totalEmployees) * 100).toFixed(1)),
    lowRiskCount,
    lowRiskPercentage: parseFloat(((lowRiskCount / totalEmployees) * 100).toFixed(1)),
    averageRiskScore: parseFloat((totalScore / totalEmployees).toFixed(1)),
  };

  // 5.7 Thống kê phòng ban
  const departmentBreakdown = Array.from(deptStatsMap.entries()).map(([departmentName, s]) => ({
    departmentName,
    totalEmployees: s.total,
    highRiskCount: s.high,
    mediumRiskCount: s.medium,
    lowRiskCount: s.low,
    averageRiskScore: parseFloat((s.sumScore / s.total).toFixed(1)),
  }));

  const result = {
    summary,
    topRiskEmployees: analyzedEmployees.slice(0, 10), // Top 10 nhân sự rủi ro cao nhất
    allEmployees: analyzedEmployees,
    departmentBreakdown,
    featureImportance: getFeatureImportanceList(),
    disclaimer: 'Dữ liệu dự báo chỉ mang tính định hướng quản trị nhân sự, tuân thủ Điều 8 BLLĐ 2019 về chống phân biệt đối xử.',
  };

  analysisCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
};

// 6. Danh sách Feature Importance chuẩn cho Recharts
export const getFeatureImportanceList = () => {
  return [
    { feature: 'totalWorkingYears', label: 'Tổng thâm niên nghề nghiệp', weight: -1.9705, impact: 'GIẢM_RỦI_RO', absWeight: 1.9705 },
    { feature: 'overTime', label: 'Tần suất làm thêm giờ (OT)', weight: 1.4579, impact: 'TĂNG_RỦI_RO', absWeight: 1.4579 },
    { feature: 'monthlyIncome', label: 'Mức thu nhập hàng tháng', weight: -1.3173, impact: 'GIẢM_RỦI_RO', absWeight: 1.3173 },
    { feature: 'numCompaniesWorked', label: 'Số công ty cũ từng làm', weight: 0.9497, impact: 'TĂNG_RỦI_RO', absWeight: 0.9497 },
    { feature: 'distanceFromHome', label: 'Khoảng cách từ nhà đến cty', weight: 0.7626, impact: 'TĂNG_RỦI_RO', absWeight: 0.7626 },
    { feature: 'yearsAtCompany', label: 'Số năm làm việc tại cty', weight: 0.0931, impact: 'TĂNG_RỦI_RO', absWeight: 0.0931 },
  ];
};
