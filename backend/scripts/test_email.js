import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { EmailService } from '../src/services/emailService.js';

async function main() {
  console.log('--- KIỂM TRA KẾT NỐI SMTP GMAIL THỰC TẾ ---');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '****** (Đã nạp)' : 'CHƯA CÓ');

  const result = await EmailService.sendInterviewInvitationEmail({
    candidateEmail: 'nguyenanhtuant647@gmail.com',
    candidateName: 'Nguyễn Anh Tuấn',
    jobTitle: 'Kỹ Sư Phần Mềm Trí Tuệ Nhân Tạo Cao Cấp (Senior AI Engineer)',
    interviewDate: '29/10/2026',
    interviewTime: '09:30 AM',
    interviewLocation: 'Phòng Họp 502, Tòa nhà Trụ sở PeopleInsight AI',
    interviewType: 'Trực tiếp tại văn phòng',
    interviewerName: 'Hội đồng Tuyển dụng & Ban Giám Đốc',
    notes: 'Ứng viên vui lòng mang theo bản cứng CV, CMND/CCCD và các chứng chỉ chuyên môn liên quan.',
    companyName: 'Tập Đoàn Công Nghệ PeopleInsight Việt Nam',
  });

  console.log('\nKẾT QUẢ GỬI EMAIL:');
  console.log(result);
}

main().catch(console.error);
