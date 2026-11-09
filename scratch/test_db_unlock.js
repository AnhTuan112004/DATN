import mongoose from 'mongoose';
import { config } from '../backend/src/config/env.js';
import { Company } from '../backend/src/models/Company.js';
import { User } from '../backend/src/models/User.js';
import { Payroll } from '../backend/src/models/Payroll.js';
import { unlockCompanyPayroll } from '../backend/src/services/payroll/payrollService.js';

async function test() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    const company = await Company.findOne().lean();
    if (!company) {
      console.log('No company found');
      return;
    }
    const user = await User.findOne({ companyId: company._id, role: 'CEO' }).lean();
    console.log('Company:', company._id.toString(), 'User:', user?._id.toString());

    // Check payrolls for 2026-11
    const payrolls = await Payroll.find({ companyId: company._id, period: '2026-11' }).select('periodLockedAt').lean();
    console.log('Payrolls count:', payrolls.length, 'Locked count:', payrolls.filter(p => p.periodLockedAt != null).length);

    console.log('Calling unlockCompanyPayroll...');
    const result = await unlockCompanyPayroll({
      companyId: company._id.toString(),
      period: '2026-11',
      approverId: user._id.toString(),
      reason: 'Test unlock'
    });
    console.log('Result:', result);
  } catch (err) {
    console.error('ERROR NAME:', err.name);
    console.error('ERROR MESSAGE:', err.message);
    console.error('ERROR STACK:', err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();

