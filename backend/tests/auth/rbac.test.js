import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { canAccess, authorize, RESOURCES, ACTIONS } from '../../src/middleware/rbac.js';
import { ROLES, AUDIT_ACTIONS } from '../../src/config/constants.js';
import { AuditLog, Company } from '../../src/models/index.js';
import { config } from '../../src/config/env.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('RBAC 4 Cấp & Bảo vệ IDOR Lương (v6.1 FINAL FREEZE)', () => {
  let testCompanyId;
  let otherCompanyId;

  const mockCeo = {
    id: new mongoose.Types.ObjectId().toString(),
    userId: new mongoose.Types.ObjectId().toString(),
    companyId: null,
    role: ROLES.CEO,
  };

  const mockHr = {
    id: new mongoose.Types.ObjectId().toString(),
    userId: new mongoose.Types.ObjectId().toString(),
    companyId: null,
    role: ROLES.HR_MANAGER,
  };

  const mockManager = {
    id: new mongoose.Types.ObjectId().toString(),
    userId: new mongoose.Types.ObjectId().toString(),
    companyId: null,
    role: ROLES.MANAGER,
  };

  const mockEmployee1 = {
    id: new mongoose.Types.ObjectId().toString(),
    userId: new mongoose.Types.ObjectId().toString(),
    companyId: null,
    role: ROLES.EMPLOYEE,
  };

  const mockEmployee2 = {
    id: new mongoose.Types.ObjectId().toString(),
    userId: new mongoose.Types.ObjectId().toString(),
    companyId: null,
    role: ROLES.EMPLOYEE,
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    testCompanyId = new mongoose.Types.ObjectId().toString();
    otherCompanyId = new mongoose.Types.ObjectId().toString();

    mockCeo.companyId = testCompanyId;
    mockHr.companyId = testCompanyId;
    mockManager.companyId = testCompanyId;
    mockEmployee1.companyId = testCompanyId;
    mockEmployee2.companyId = testCompanyId;
  });

  afterAll(async () => {
    if (testCompanyId) {
      await AuditLog.deleteMany({ companyId: testCompanyId }).setOptions({ skipTenant: true });
    }
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. UNIT TEST HÀM PHÂN QUYỀN TẬP TRUNG canAccess()
  // =========================================================================
  describe('1. Kiểm thử Logic canAccess()', () => {
    it('Employee chỉ được xem lương của chính mình, bị từ chối khi xem lương người khác', () => {
      // Xem chính mình
      const canViewSelf = canAccess(mockEmployee1, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockEmployee1.userId,
        companyId: testCompanyId,
      });
      expect(canViewSelf).toBe(true);

      // Xem nhân viên khác -> BỊ TỪ CHỐI
      const canViewOther = canAccess(mockEmployee1, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockEmployee2.userId,
        companyId: testCompanyId,
      });
      expect(canViewOther).toBe(false);
    });

    it('RÀNG BUỘC KIẾN TRÚC: Quản lý (MANAGER) TUYỆT ĐỐI KHÔNG ĐƯỢC XEM LƯƠNG NHÂN VIÊN (kể cả cấp dưới)', () => {
      // Manager xem lương của chính mình -> OK
      const canViewSelf = canAccess(mockManager, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockManager.userId,
        companyId: testCompanyId,
      });
      expect(canViewSelf).toBe(true);

      // Manager xem lương cấp dưới trực tiếp -> CẤM TUYỆT ĐỐI
      const canViewDirectReportSalary = canAccess(mockManager, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockEmployee1.userId,
        isDirectReport: true,
        companyId: testCompanyId,
      });
      expect(canViewDirectReportSalary).toBe(false);
    });

    it('HR Manager và CEO được xem lương nhân viên trong cùng công ty', () => {
      const hrCanView = canAccess(mockHr, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockEmployee1.userId,
        companyId: testCompanyId,
      });
      expect(hrCanView).toBe(true);

      const ceoCanView = canAccess(mockCeo, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockEmployee1.userId,
        companyId: testCompanyId,
      });
      expect(ceoCanView).toBe(true);
    });

    it('Tenant Isolation Fail-Closed: HR Manager không được xem lương công ty khác', () => {
      const crossTenantView = canAccess(mockHr, RESOURCES.SALARY, ACTIONS.READ, {
        targetUserId: mockEmployee1.userId,
        companyId: otherCompanyId, // Tenant khác!
      });
      expect(crossTenantView).toBe(false);
    });

    it('Chặn tự duyệt đơn nghỉ phép: Quản lý không được tự duyệt đơn của chính mình', () => {
      // Tự duyệt đơn chính mình -> BỊ CHẶN
      const selfApprove = canAccess(mockManager, RESOURCES.LEAVE_REQUEST, ACTIONS.APPROVE_STAGE_1, {
        applicantId: mockManager.userId,
        companyId: testCompanyId,
      });
      expect(selfApprove).toBe(false);

      // Duyệt đơn cấp dưới trực tiếp -> ĐƯỢC PHÉP
      const approveDirectReport = canAccess(mockManager, RESOURCES.LEAVE_REQUEST, ACTIONS.APPROVE_STAGE_1, {
        applicantId: mockEmployee1.userId,
        isDirectReport: true,
        companyId: testCompanyId,
      });
      expect(approveDirectReport).toBe(true);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TEST: MIDDLEWARE AUTHORIZE & GHI AUDITLOG
  // =========================================================================
  describe('2. Middleware authorize() & Tự động ghi AuditLog khi xem lương', () => {
    let testApp;

    beforeAll(() => {
      testApp = express();
      testApp.use(express.json());

      // Mock user middleware
      testApp.use((req, res, next) => {
        const role = req.headers['x-test-role'] || ROLES.EMPLOYEE;
        const currentUserId = req.headers['x-test-userid'] || mockEmployee1.userId;

        req.user = {
          id: currentUserId,
          userId: currentUserId,
          role,
          companyId: testCompanyId,
        };

        tenantStore.run({ companyId: testCompanyId }, () => next());
      });

      // Endpoint kiểm tra xem lương
      testApp.get(
        '/api/test/salary/:userId',
        authorize(RESOURCES.SALARY, ACTIONS.READ, (req) => ({
          targetUserId: req.params.userId,
          companyId: req.user.companyId,
        })),
        (req, res) => {
          res.json({ success: true, message: 'Xem bảng lương thành công' });
        }
      );
    });

    it('Chặn IDOR: Employee xem lương người khác trả về 403 Forbidden', async () => {
      const res = await request(testApp)
        .get(`/api/test/salary/${mockEmployee2.userId}`)
        .set('x-test-role', ROLES.EMPLOYEE)
        .set('x-test-userid', mockEmployee1.userId);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Chặn IDOR: Manager cố tình xem lương nhân viên trả về 403 Forbidden', async () => {
      const res = await request(testApp)
        .get(`/api/test/salary/${mockEmployee1.userId}`)
        .set('x-test-role', ROLES.MANAGER)
        .set('x-test-userid', mockManager.userId);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Employee xem lương của chính mình trả về 200 OK', async () => {
      const res = await request(testApp)
        .get(`/api/test/salary/${mockEmployee1.userId}`)
        .set('x-test-role', ROLES.EMPLOYEE)
        .set('x-test-userid', mockEmployee1.userId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('HR xem lương người khác trả về 200 OK VÀ tự động ghi AuditLog (VIEW_SALARY_OTHER)', async () => {
      const res = await request(testApp)
        .get(`/api/test/salary/${mockEmployee1.userId}`)
        .set('x-test-role', ROLES.HR_MANAGER)
        .set('x-test-userid', mockHr.userId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Xác minh bản ghi AuditLog đã được tạo
      const audit = await AuditLog.findOne({
        companyId: testCompanyId,
        userId: mockHr.userId,
        action: AUDIT_ACTIONS.VIEW_SALARY_OTHER,
      }).setOptions({ skipTenant: true });

      expect(audit).toBeDefined();
      expect(audit.details.targetUserId).toBe(mockEmployee1.userId);
    });
  });
});
