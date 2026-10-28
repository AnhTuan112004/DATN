import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { getFaceStatus } from '../src/services/faceEnrollmentService.js';
import { tenantStore } from '../src/plugins/tenantPlugin.js';

async function main() {
  await connectDB();
  const user = await User.findOne({ employeeCode: 'EMP001' }, null, { skipTenant: true }).lean();
  console.log('Testing EMP001 user:', user?._id, 'companyId:', user?.companyId, 'isActive:', user?.isActive, 'status:', user?.status);

  if (!user) {
    console.log('No user EMP001 found');
    process.exit(0);
  }

  try {
    const res = await tenantStore.run({ companyId: user.companyId }, async () => {
      return getFaceStatus(user.companyId, user._id);
    });
    console.log('SUCCESS! Face status:', res);
  } catch (err) {
    console.error('ERROR in getFaceStatus:', err);
  }

  process.exit(0);
}

main().catch(console.error);
