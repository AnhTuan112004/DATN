import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const ContractSchema = new Schema({
  contractNumber: { type: String, required: true },
  contractType: { type: String, enum: ['PROBATION', 'DEFINITE', 'INDEFINITE'], default: 'DEFINITE' },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, default: null },
  baseSalary: { type: Number, required: true },
  allowance: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'], default: 'ACTIVE' },
  signedDate: { type: Date, default: Date.now },
}, { _id: true });

const LeaveBalanceSchema = new Schema({
  annualTotal: { type: Number, default: 12 },
  annualUsed: { type: Number, default: 0 },
  annualRemaining: { type: Number, default: 12 },
  seniorityBonusDays: { type: Number, default: 0 }, // +1 ngày mỗi 5 năm (Điều 114 BLLĐ)
  sickUsed: { type: Number, default: 0 },
  sickRemaining: { type: Number, default: 30 },
}, { _id: false });

const SalaryConfigSchema = new Schema({
  baseSalary: { type: Number, required: true, default: 0 },
  positionAllowance: { type: Number, default: 0 },
  mealAllowance: { type: Number, default: 0 },
  dependentsCount: { type: Number, default: 0 },
  isResident: { type: Boolean, default: true }, // Cá nhân cư trú
  contractDurationMonths: { type: Number, default: 12 }, // HĐ >= 3 tháng
}, { _id: false });

const RefreshTokenSchema = new Schema({
  token: { type: String, required: true },
  family: { type: String, required: true }, // Family ID để phát hiện Token Reuse
  deviceId: { type: String, default: 'web' },
  userAgent: { type: String, default: null },
  ip: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  rotatedAt: { type: Date, default: null }, // Grace window 20s
}, { _id: true });

const UserSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true, immutable: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

  employeeCode: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.EMPLOYEE, index: true },

  avatarUrl: { type: String, default: null },
  phone: { type: String, default: null },
  hireDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },

  // Embedded Subdocuments - Projection bảo vệ dữ liệu nhạy cảm
  contracts: [ContractSchema],
  leaveBalance: { type: LeaveBalanceSchema, default: () => ({}) },
  salaryConfig: { type: SalaryConfigSchema, default: () => ({}), select: false },
  refreshTokens: { type: [RefreshTokenSchema], default: [], select: false },

  // ML Retention Feature Support
  totalWorkingYears: { type: Number, default: 1 },
  numCompaniesWorked: { type: Number, default: 1 },
}, { timestamps: true });

// Composite index
UserSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });

// Quy tắc bất biến: CẤM gọi .save() để update User, bắt buộc dùng toán tử nguyên tử ($set, $push, $pull, $inc)
UserSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('FORBIDDEN_OPERATION: Cấm gọi .save() để cập nhật User. Hãy dùng toán tử nguyên tử ($set, $push, $pull, $inc) theo quy tắc v6.1.'));
  }
  next();
});

// Áp dụng plugin Multi-tenant Fail-Closed
UserSchema.plugin(tenantPlugin);

export const User = mongoose.model('User', UserSchema);
