import mongoose from 'mongoose';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const PayrollSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true, immutable: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  period: { type: String, required: true, index: true }, // "YYYY-MM", e.g. "2026-06"
  periodLockedAt: { type: Date, default: null }, // Khi khóa kỳ lương, không được tính lại
  lockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

  // Snapshot chính sách áp dụng tại thời điểm tính
  policySnapshot: {
    personalDeduction: Number,
    dependentDeduction: Number,
    capBhxhBhyt: Number,
    capBhtn: Number,
    mealAllowanceCap: Number,
    brackets: Array,
  },

  // Dữ liệu công & chấm công tổng hợp
  standardWorkingDays: { type: Number, default: 22 },
  actualWorkingDays: { type: Number, default: 22 },
  otHoursWeekday: { type: Number, default: 0 },
  otHoursWeekend: { type: Number, default: 0 },
  otHoursHoliday: { type: Number, default: 0 },
  otHoursNight: { type: Number, default: 0 },
  nightWorkHours: { type: Number, default: 0 },
  paidLeaveDays: { type: Number, default: 0 },

  // Bước 1: Tổng thu nhập (Gross)
  grossIncome: { type: Number, required: true },
  baseSalaryProrated: { type: Number, required: true },
  otPayTotal: { type: Number, default: 0 },
  nightPayTotal: { type: Number, default: 0 },
  allowanceTotal: { type: Number, default: 0 },
  bonusTotal: { type: Number, default: 0 },
  mealAllowanceTotal: { type: Number, default: 0 },

  // Bước 2: Thu nhập chịu thuế (Taxable Income)
  taxExemptOt: { type: Number, default: 0 },
  taxExemptNight: { type: Number, default: 0 },
  taxExemptMeal: { type: Number, default: 0 },
  taxExemptLeave: { type: Number, default: 0 },
  taxableIncome: { type: Number, required: true },

  // Bước 3: Thu nhập tính thuế (Assessable Income) & Khấu trừ
  insurableSalary: { type: Number, required: true },
  bhxhEmployee: { type: Number, default: 0 }, // 8%
  bhytEmployee: { type: Number, default: 0 }, // 1.5%
  bhtnEmployee: { type: Number, default: 0 }, // 1%
  totalInsuranceEmployee: { type: Number, default: 0 }, // 10.5%
  totalInsuranceEmployer: { type: Number, default: 0 }, // 21.5%

  personalDeductionAmount: { type: Number, default: 15500000 },
  dependentDeductionAmount: { type: Number, default: 0 },
  assessableIncome: { type: Number, required: true }, // Thu nhập tính thuế

  personalIncomeTax: { type: Number, default: 0 }, // Thuế TNCN
  netSalary: { type: Number, required: true }, // Lương thực nhận (Net = Gross - BHXH - Thuế)
}, { timestamps: true });

PayrollSchema.index({ companyId: 1, userId: 1, period: 1 }, { unique: true });

// Chặn đứng mọi hành vi cập nhật nếu kỳ lương đã khóa
PayrollSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
  this.where({ periodLockedAt: null });
});

PayrollSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified() && this.periodLockedAt) {
    const error = new Error('PAYROLL_LOCKED: Kỳ lương đã khóa, không thể sửa đổi bảng lương');
    error.statusCode = 409;
    return next(error);
  }
  next();
});

PayrollSchema.plugin(tenantPlugin);

export const Payroll = mongoose.model('Payroll', PayrollSchema);
