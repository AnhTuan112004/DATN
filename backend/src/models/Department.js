import mongoose from 'mongoose';

const { Schema } = mongoose;

const DepartmentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  parentDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, default: '' },
}, { timestamps: true });

DepartmentSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Department = mongoose.model('Department', DepartmentSchema);
