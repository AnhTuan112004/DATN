import mongoose from 'mongoose';
import { Payroll } from '../backend/src/models/Payroll.js';
import { AuditLog } from '../backend/src/models/AuditLog.js';
import { unlockCompanyPayroll } from '../backend/src/services/payroll/payrollService.js';

async function run() {
  console.log('Testing unlock logic...');
  try {
    const q = Payroll.updateMany(
      { companyId: new mongoose.Types.ObjectId(), period: '2026-11' },
      { $set: { periodLockedAt: null, lockedBy: null } },
      { allowUnlock: true }
    );
    console.log('Built query:', q.getQuery(), q.getUpdate());
  } catch (err) {
    console.error('Error in test:', err);
  }
}
run();
