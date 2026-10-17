import mongoose from 'mongoose';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const DepartmentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true, immutable: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  parentDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, default: '' },
}, { timestamps: true });

DepartmentSchema.index({ companyId: 1, code: 1 }, { unique: true });

// Áp dụng plugin Multi-tenant Fail-Closed
DepartmentSchema.plugin(tenantPlugin);

export const Department = mongoose.model('Department', DepartmentSchema);
