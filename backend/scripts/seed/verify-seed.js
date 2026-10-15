import mongoose from 'mongoose';
import { User, Department, AttendanceLog, LeaveRequest, Company } from '../../src/models/index.js';
import { config } from '../../src/config/env.js';

async function verify() {
  await mongoose.connect(config.mongodb.uri);
  const company = await Company.findOne({ code: 'PEOPLE_AI' });
  const usersCount = await User.countDocuments({ companyId: company._id });
  const roles = await User.aggregate([
    { $match: { companyId: company._id } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const deptsCount = await Department.countDocuments({ companyId: company._id });
  const logsCount = await AttendanceLog.countDocuments({ companyId: company._id });
  const leavesCount = await LeaveRequest.countDocuments({ companyId: company._id });

  // Sample user security & embedding check
  const sampleUser = await User.findOne({ employeeCode: 'EMP001' });
  const sampleSenior = await User.findOne({ employeeCode: 'EMP004' });

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`Company: ${company.name} (${company.code})`);
  console.log(`Total Users: ${usersCount}`);
  console.log('Role Distribution:', JSON.stringify(roles));
  console.log(`Total Departments: ${deptsCount}`);
  console.log(`Total Attendance Logs: ${logsCount}`);
  console.log(`Total Leave Requests: ${leavesCount}`);
  console.log(`Sample CEO passwordHash selected by default? ${sampleUser.passwordHash !== undefined ? 'YES (UNSAFE!)' : 'NO (SAFE: select: false)'}`);
  console.log(`Sample Senior (EMP004) Seniority Bonus: ${sampleSenior.leaveBalance.seniorityBonusDays} days (Total: ${sampleSenior.leaveBalance.annualTotal})`);
  console.log(`Sample Contracts Count: ${sampleSenior.contracts.length} (Type: ${sampleSenior.contracts[0].contractType})`);
  console.log('============================');

  await mongoose.disconnect();
  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
