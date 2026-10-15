import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

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
  seniorityBonusDays: { type: Number, default: 0 }, // +1 ngày mỗi 5 năm (Điều 114 BLLĐ)
  sickUsed: { type: Number, default: 0 },
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
  deviceId: { type: String, default: 'web' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { _id: true });

const UserSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
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

  // Embedded Subdocuments
  contracts: [ContractSchema],
  leaveBalance: { type: LeaveBalanceSchema, default: () => ({}) },
  salaryConfig: { type: SalaryConfigSchema, default: () => ({}) },
  refreshTokens: [RefreshTokenSchema],

  // ML Retention Feature Support
  totalWorkingYears: { type: Number, default: 1 },
  numCompaniesWorked: { type: Number, default: 1 },
}, { timestamps: true });

// Composite index
UserSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });

export const User = mongoose.model('User', UserSchema);
