/**
 * BỘ KIỂM THỬ PHÂN HỆ ML DỰ BÁO NGUY CƠ THÔI VIỆC (ATTRITION PREDICTOR TESTS)
 * Tuân thủ Hiến pháp v6.1 FINAL FREEZE (Tuần 7)
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES } from '../../src/config/constants.js';
import { Company, User, Department, AttendanceLog, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import {
  calculateAttritionRisk,
  sigmoid,
  normalizeFeature,
  MODEL_COEFFICIENTS,
} from '../../src/services/attritionPredictorService.js';

describe('Phân Hệ ML Dự Báo Nguy Cơ Thôi Việc & Endpoint /api/analytics/attrition-risk', () => {
  let app;
  let company;
  let deptIT, deptSales;
  let ceoUser, hrManagerUser, managerUser, employeeUser, otherCompanyUser;
  let ceoToken, hrManagerToken, managerToken, employeeToken, otherCompanyToken;

  const TS = Date.now();

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId.toString(),
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
      config.jwt.accessSecret,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }

    app = createApp();

    // 1. Khởi tạo công ty thử nghiệm
    company = await Company.create({
      name: `Công Ty ML Test ${TS}`,
      code: `COMP_ML_${TS}`,
      settings: {
        region: 'I',
        taxPolicies: [{ effectiveFrom: '2026-01-01', personalDeduction: 15500000, dependentDeduction: 6200000, mealAllowanceExemptCap: 730000 }],
      },
    });

    const cId = company._id;

    // 2. Khởi tạo phòng ban
    await tenantStore.run({ companyId: cId }, async () => {
      deptIT = await Department.create({
        companyId: cId,
        name: `Phòng Kỹ Thuật IT ${TS}`,
        code: `DEP_IT_${TS}`,
      });

      deptSales = await Department.create({
        companyId: cId,
        name: `Phòng Kinh Doanh ${TS}`,
        code: `DEP_SALES_${TS}`,
      });

      // 3. Khởi tạo 4 vai trò nhân sự
      ceoUser = await User.create({
        companyId: cId,
        employeeCode: `CEO_${TS}`,
        fullName: 'Nguyễn Tổng Giám Đốc',
        email: `ceo_ml_${TS}@peopleinsight.vn`,
        passwordHash: '$2a$10$hashedpassworddummy',
        role: ROLES.CEO,
        salaryConfig: { baseSalary: 60000000 },
        totalWorkingYears: 18,
        numCompaniesWorked: 3,
      });

      hrManagerUser = await User.create({
        companyId: cId,
        departmentId: deptIT._id,
        employeeCode: `HRM_${TS}`,
        fullName: 'Trần Trưởng Phòng HR',
        email: `hr_ml_${TS}@peopleinsight.vn`,
        passwordHash: '$2a$10$hashedpassworddummy',
        role: ROLES.HR_MANAGER,
        salaryConfig: { baseSalary: 35000000 },
        totalWorkingYears: 12,
        numCompaniesWorked: 2,
      });

      managerUser = await User.create({
        companyId: cId,
        departmentId: deptIT._id,
        employeeCode: `MGR_${TS}`,
        fullName: 'Lê Quản Lý Phòng IT',
        email: `mgr_ml_${TS}@peopleinsight.vn`,
        passwordHash: '$2a$10$hashedpassworddummy',
        role: ROLES.MANAGER,
        salaryConfig: { baseSalary: 28000000 },
        totalWorkingYears: 8,
        numCompaniesWorked: 2,
      });

      employeeUser = await User.create({
        companyId: cId,
        departmentId: deptSales._id,
        employeeCode: `EMP_${TS}`,
        fullName: 'Phạm Nhân Viên Sales',
        email: `emp_ml_${TS}@peopleinsight.vn`,
        passwordHash: '$2a$10$hashedpassworddummy',
        role: ROLES.EMPLOYEE,
        salaryConfig: { baseSalary: 10000000 },
        totalWorkingYears: 1,
        numCompaniesWorked: 4,
        hireDate: new Date('2026-01-10'),
      });

      // Tạo một số AttendanceLog cho employeeUser có OT cao
      const today = new Date().toISOString().split('T')[0];
      await AttendanceLog.create({
        companyId: cId,
        userId: employeeUser._id,
        date: today,
        overtimeMinutes: 300, // 5 giờ OT
        status: 'VALID',
        method: 'FACE',
      });
    });

    // 4. Khởi tạo công ty khác để kiểm tra cách ly Multi-tenant
    const otherCompany = await Company.create({
      name: `Công Ty Đối Thủ ${TS}`,
      code: `COMP_OTHER_${TS}`,
    });

    await tenantStore.run({ companyId: otherCompany._id }, async () => {
      otherCompanyUser = await User.create({
        companyId: otherCompany._id,
        employeeCode: `OTHER_CEO_${TS}`,
        fullName: 'Giám Đốc Công Ty Khác',
        email: `other_ml_${TS}@other.vn`,
        passwordHash: '$2a$10$hashedpassworddummy',
        role: ROLES.CEO,
      });
    });

    // 5. Sinh JWT Tokens
    ceoToken = generateToken(ceoUser);
    hrManagerToken = generateToken(hrManagerUser);
    managerToken = generateToken(managerUser);
    employeeToken = generateToken(employeeUser);
    otherCompanyToken = generateToken(otherCompanyUser);
  });

  afterAll(async () => {
    if (company) {
      await User.deleteMany({ companyId: company._id });
      await Department.deleteMany({ companyId: company._id });
      await AttendanceLog.deleteMany({ companyId: company._id });
      await AuditLog.deleteMany({ companyId: company._id });
      await Company.deleteOne({ _id: company._id });
    }
  });

  // ==========================================
  // PHẦN 1: KIỂM THỬ THUẬT TOÁN PURE FUNCTION
  // ==========================================
  describe('1. Kiểm thử Thuật toán Tính toán & Suy luận (Pure Function)', () => {
    test('1.1. Hàm Sigmoid hoạt động chính xác và chống tràn số', () => {
      expect(sigmoid(0)).toBe(0.5);
      expect(sigmoid(100)).toBe(1);
      expect(sigmoid(-100)).toBe(0);
      expect(sigmoid(2)).toBeCloseTo(0.8808, 3);
    });

    test('1.2. Hàm normalizeFeature co giãn đúng miền [0, 1]', () => {
      expect(normalizeFeature(5, 0, 10)).toBe(0.5);
      expect(normalizeFeature(-5, 0, 10)).toBe(0);
      expect(normalizeFeature(15, 0, 10)).toBe(1);
      expect(normalizeFeature(1000, 1000, 20000)).toBe(0);
      expect(normalizeFeature(20000, 1000, 20000)).toBe(1);
    });

    test('1.3. Nhân sự có nguy cơ cao (OverTime=1, Lương thấp, Thâm niên ngắn, Nhảy việc nhiều) có xác suất >= 0.50 (HIGH RISK)', () => {
      const highRiskInput = {
        overTime: 1,
        yearsAtCompany: 0.5,
        totalWorkingYears: 1,
        monthlyIncome: 2000, // Thấp
        numCompaniesWorked: 5, // Nhảy việc nhiều
        distanceFromHome: 25, // Xa nhà
      };

      const result = calculateAttritionRisk(highRiskInput);
      expect(result.probability).toBeGreaterThanOrEqual(MODEL_COEFFICIENTS.thresholdHigh);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskBadgeColor).toBe('RED');
      expect(result.primaryRiskFactors.length).toBeGreaterThan(0);
      expect(result.primaryRiskFactors.some((f) => f.feature === 'overTime')).toBe(true);
      expect(result.recommendation).toContain('khối lượng công việc');
    });

    test('1.4. Nhân sự thâm niên cao, thu nhập cao, không OT có xác suất < 0.30 (LOW RISK)', () => {
      const lowRiskInput = {
        overTime: 0,
        yearsAtCompany: 10,
        totalWorkingYears: 20,
        monthlyIncome: 18000, // Cao
        numCompaniesWorked: 1,
        distanceFromHome: 3, // Gần nhà
      };

      const result = calculateAttritionRisk(lowRiskInput);
      expect(result.probability).toBeLessThan(MODEL_COEFFICIENTS.thresholdMedium);
      expect(result.riskLevel).toBe('LOW');
      expect(result.riskBadgeColor).toBe('GREEN');
      expect(result.recommendation).toContain('Duy trì chính sách');
    });
  });

  // ==========================================
  // PHẦN 2: BẢO MẬT PHÂN QUYỀN RBAC TRUY CẬP
  // ==========================================
  describe('2. Kiểm thử Phân quyền RBAC & IDOR trên Endpoint /api/analytics/attrition-risk', () => {
    test('2.1. Từ chối 401 khi không có JWT token', async () => {
      const res = await request(app).get('/api/analytics/attrition-risk');
      expect(res.status).toBe(401);
    });

    test('2.2. Chặn 403 Forbidden khi Nhân viên thường (EMPLOYEE) cố tình truy cập', async () => {
      const res = await request(app)
        .get('/api/analytics/attrition-risk')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    test('2.3. Chặn 403 Forbidden khi Quản lý phòng ban (MANAGER) cố tình truy cập', async () => {
      const res = await request(app)
        .get('/api/analytics/attrition-risk')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    test('2.4. Cho phép 200 OK khi Trưởng phòng nhân sự (HR_MANAGER) truy cập', async () => {
      const res = await request(app)
        .get('/api/analytics/attrition-risk')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
    });

    test('2.5. Cho phép 200 OK khi Tổng Giám Đốc (CEO) truy cập', async () => {
      const res = await request(app)
        .get('/api/analytics/attrition-risk')
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalEmployees).toBeGreaterThanOrEqual(4);
    });
  });

  // ==========================================
  // PHẦN 3: KIỂM THỬ CẤU TRÚC DỮ LIỆU & DASHBOARD
  // ==========================================
  describe('3. Kiểm thử Cấu trúc Dữ liệu Phân tích & Ghi nhận AuditLog', () => {
    test('3.1. Dữ liệu tổng quan trả về đầy đủ các chỉ số KPI, phòng ban và Feature Importance', async () => {
      const res = await request(app)
        .get('/api/analytics/attrition-risk')
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Kiểm tra Summary KPI
      expect(data.summary).toHaveProperty('totalEmployees');
      expect(data.summary).toHaveProperty('highRiskCount');
      expect(data.summary).toHaveProperty('highRiskPercentage');
      expect(data.summary).toHaveProperty('mediumRiskCount');
      expect(data.summary).toHaveProperty('lowRiskCount');
      expect(data.summary).toHaveProperty('averageRiskScore');

      // Kiểm tra Top Risk Employees
      expect(Array.isArray(data.topRiskEmployees)).toBe(true);
      if (data.topRiskEmployees.length > 0) {
        const top1 = data.topRiskEmployees[0];
        expect(top1).toHaveProperty('fullName');
        expect(top1).toHaveProperty('prediction');
        expect(top1.prediction).toHaveProperty('riskLevel');
        expect(top1.prediction).toHaveProperty('probability');
        expect(top1.prediction).toHaveProperty('primaryRiskFactors');
      }

      // Kiểm tra Feature Importance phục vụ vẽ biểu đồ Recharts
      expect(Array.isArray(data.featureImportance)).toBe(true);
      expect(data.featureImportance.length).toBe(6);
      expect(data.featureImportance[0]).toHaveProperty('feature');
      expect(data.featureImportance[0]).toHaveProperty('weight');

      // Kiểm tra Disclaimer pháp lý
      expect(data.disclaimer).toContain('Điều 8 BLLĐ');
    });

    test('3.2. Endpoint chi tiết 1 nhân sự GET /api/analytics/attrition-risk/:targetUserId hoạt động chính xác', async () => {
      const res = await request(app)
        .get(`/api/analytics/attrition-risk/${employeeUser._id}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Phạm Nhân Viên Sales');
      expect(res.body.data.prediction).toBeDefined();
      expect(res.body.data.prediction.riskLevel).toBeDefined();
      expect(res.body.data.features.overTime).toBe(1); // Do có 5h OT
    });

    test('3.3. Trả về 404 khi cố tình tra cứu nhân sự của công ty khác (Cách ly Multi-tenant Fail-Closed)', async () => {
      const res = await request(app)
        .get(`/api/analytics/attrition-risk/${otherCompanyUser._id}`)
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('3.4. Hệ thống tự động ghi nhận AuditLog khi HR/CEO xem phân tích nguy cơ thôi việc', async () => {
      const log = await tenantStore.run({ companyId: company._id.toString() }, async () => {
        return await AuditLog.findOne({
          companyId: company._id,
          action: 'VIEW_ATTRITION_ANALYTICS',
          userId: ceoUser._id,
        }).sort({ timestamp: -1 });
      });

      expect(log).not.toBeNull();
      expect(log.userId.toString()).toBe(ceoUser._id.toString());
      expect(log.details.role).toBe(ROLES.CEO);

      // Đồng thời kiểm tra AuditLog chi tiết cho từng nhân viên (VIEW_EMPLOYEE_ATTRITION_RISK)
      const empLog = await tenantStore.run({ companyId: company._id.toString() }, async () => {
        return await AuditLog.findOne({
          companyId: company._id,
          action: 'VIEW_EMPLOYEE_ATTRITION_RISK',
          targetUserId: employeeUser._id,
        }).sort({ timestamp: -1 });
      });

      expect(empLog).not.toBeNull();
      expect(empLog.userId.toString()).toBe(hrManagerUser._id.toString());
    });
  });
});
