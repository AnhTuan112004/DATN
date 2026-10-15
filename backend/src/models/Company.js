import mongoose from 'mongoose';

const { Schema } = mongoose;

const ShiftSchema = new Schema({
  shiftCode: { type: String, required: true },
  startTime: { type: String, required: true }, // "08:30"
  endTime: { type: String, required: true },   // "17:30"
  gracePeriodMinutes: { type: Number, default: 15 },
}, { _id: false });

const LocationSchema = new Schema({
  locationId: { type: String, required: true },
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radiusMeters: { type: Number, default: 100 },
}, { _id: false });

const DeviceSchema = new Schema({
  deviceId: { type: String, required: true },
  kioskSecretTokenHash: { type: String, required: true }, // SHA-256 hash
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const MinWageByRegionSchema = new Schema({
  effectiveFrom: { type: String, required: true }, // YYYY-MM-DD
  effectiveTo: { type: String, default: null },
  wages: {
    I: { type: Number, default: 5310000 },
    II: { type: Number, default: 4730000 },
    III: { type: Number, default: 4140000 },
    IV: { type: Number, default: 3700000 },
  },
}, { _id: false });

const TaxBracketSchema = new Schema({
  bracket: { type: Number, required: true },
  maxIncome: { type: Number, required: true },
  rate: { type: Number, required: true },
}, { _id: false });

const TaxPolicySchema = new Schema({
  effectiveFrom: { type: String, required: true },
  effectiveTo: { type: String, default: null },
  personalDeduction: { type: Number, default: 15500000 },
  dependentDeduction: { type: Number, default: 6200000 },
  otExemption: { type: Boolean, default: true },
  nightShiftExemption: { type: Boolean, default: true },
  unusedLeaveExemption: { type: Boolean, default: true },
  mealAllowanceExemptCap: { type: Number, default: 730000 }, // 730k trước 1/7/2026, 1.2M từ 1/7/2026
  brackets: [TaxBracketSchema],
}, { _id: false });

const InsuranceRateSchema = new Schema({
  effectiveFrom: { type: String, required: true },
  effectiveTo: { type: String, default: null },
  employeeRate: { type: Number, default: 0.105 },
  employerRate: { type: Number, default: 0.215 },
  capBhxhBhyt: { type: Number, default: 46800000 }, // 46.8M trước 1/7, 50.6M từ 1/7/2026
  capBhtn: { type: String, default: 'LOOKUP_MIN_WAGE' },
}, { _id: false });

const CompanySchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  settings: {
    region: { type: String, enum: ['I', 'II', 'III', 'IV'], default: 'I' },
    shifts: [ShiftSchema],
    locations: [LocationSchema],
    devices: [DeviceSchema],
    minWageByRegion: [MinWageByRegionSchema],
    taxPolicies: [TaxPolicySchema],
    insuranceRates: [InsuranceRateSchema],
    otRates: {
      weekday: { type: Number, default: 1.5 },
      weekend: { type: Number, default: 2.0 },
      holiday: { type: Number, default: 3.0 },
    },
    otNightAdditionalRate: { type: Number, default: 0.2 },
    nightShiftRate: { type: Number, default: 0.3 },
    otMaxHoursPerYear: { type: Number, default: 200 },
    otDailyMaxHours: { type: Number, default: 4 },
    holidays: [{
      date: { type: String, required: true }, // YYYY-MM-DD
      name: { type: String, required: true },
    }],
  },
}, { timestamps: true });

export const Company = mongoose.model('Company', CompanySchema);
