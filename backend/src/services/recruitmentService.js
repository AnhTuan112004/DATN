import fs from 'fs';
import { JobPosting } from '../models/JobPosting.js';
import { Department } from '../models/Department.js';
import { Company } from '../models/Company.js';
import { tenantStore } from '../plugins/tenantPlugin.js';
import { EmailService } from './emailService.js';
import { CvParserService } from './cvParserService.js';

export class RecruitmentService {
  /**
   * Lấy danh sách tin tuyển dụng công khai cho ứng viên xem bên ngoài (Public Career Portal)
   */
  static async getPublicJobPostings() {
    const company = await Company.findOne().lean();
    if (!company) return [];

    return tenantStore.run({ companyId: company._id }, async () => {
      let jobs = await JobPosting.find({ status: 'OPEN' })
        .populate('departmentId', 'name code')
        .populate('companyId', 'name code')
        .select('title jobDescription requirements salaryRange status createdAt departmentId companyId candidates')
        .sort({ createdAt: -1 })
        .lean();

      if (!jobs || jobs.length === 0) {
        const dept = await Department.findOne({ companyId: company._id }).lean();

        if (dept) {
          const sampleJobs = [
            {
              companyId: company._id,
              departmentId: dept._id,
              title: 'Kỹ Sư Phần Mềm Fullstack AI (React & Node.js)',
              jobDescription: 'Phát triển các phân hệ Web SaaS, tích hợp mô hình AI trí tuệ nhân tạo, tối ưu hóa giao diện người dùng và cơ sở dữ liệu MongoDB hiệu năng cao.',
              requirements: {
                skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AI', 'TailwindCSS'],
                minYearsOfExp: 2,
                passingScore: 70,
              },
              salaryRange: { min: 18000000, max: 35000000 },
              status: 'OPEN',
              candidates: [],
            },
            {
              companyId: company._id,
              departmentId: dept._id,
              title: 'Chuyên Viên Quản Trị Tiền Lương & Phúc Lợi (C&B 2026)',
              jobDescription: 'Chịu trách nhiệm vận hành công cụ tính lương Payroll Engine, cập nhật chính sách thuế TNCN biểu 5 bậc mới, đối chiếu ngày công và bảo hiểm xã hội.',
              requirements: {
                skills: ['C&B', 'Thuế TNCN', 'BHXH', 'Excel', 'Luật Lao động', 'Tính lương'],
                minYearsOfExp: 1,
                passingScore: 65,
              },
              salaryRange: { min: 12000000, max: 22000000 },
              status: 'OPEN',
              candidates: [],
            },
            {
              companyId: company._id,
              departmentId: dept._id,
              title: 'Chuyên Viên Phân Tích Dữ Liệu Nhân Sự (HR Data Analyst)',
              jobDescription: 'Khai thác số liệu chấm công, phân tích mô hình Machine Learning dự báo nguy cơ nghỉ việc (Attrition) và đề xuất chiến lược giữ chân nhân tài cho CEO.',
              requirements: {
                skills: ['Data Analysis', 'Python', 'Machine Learning', 'Excel', 'Dashboard', 'HR Metrics'],
                minYearsOfExp: 1,
                passingScore: 70,
              },
              salaryRange: { min: 15000000, max: 28000000 },
              status: 'OPEN',
              candidates: [],
            },
          ];

          await JobPosting.insertMany(sampleJobs);
          jobs = await JobPosting.find({ status: 'OPEN' })
            .populate('departmentId', 'name code')
            .populate('companyId', 'name code')
            .sort({ createdAt: -1 })
            .lean();
        }
      }

      return jobs;
    });
  }

  /**
   * Ứng tuyển công khai từ bên ngoài (Không yêu cầu đăng nhập)
   */
  static async applyJobPublic(jobId, candidateData) {
    const rawJob = await JobPosting.findById(jobId, null, { skipTenant: true }).populate('companyId', 'name');
    if (!rawJob) {
      throw new Error('Vị trí tuyển dụng không tồn tại hoặc đã đóng');
    }

    const companyId = rawJob.companyId?._id || rawJob.companyId;

    return tenantStore.run({ companyId }, async () => {
      const job = await JobPosting.findById(jobId).populate('companyId', 'name');

      // Tự động bóc tách nội dung file CV (.pdf, .docx) nếu có tải lên tệp thật
      let parsedCvText = '';
      let uploadedCvUrl = candidateData.cvUrl || '';

      if (candidateData.file) {
        try {
          const buffer = fs.readFileSync(candidateData.file.path);
          const parsed = await CvParserService.parseCvBuffer(buffer, candidateData.file.originalname);
          parsedCvText = parsed.text || '';
          uploadedCvUrl = `/uploads/cvs/${candidateData.file.filename}`;
          if (!candidateData.email && parsed.email) candidateData.email = parsed.email;
          if (!candidateData.phone && parsed.phone) candidateData.phone = parsed.phone;
          console.log(`[CvParserService] Đã trích xuất ${parsedCvText.length} ký tự từ file CV thực tế: ${candidateData.file.originalname}`);
        } catch (fileErr) {
          console.warn('[CvParserService] Không thể phân tích file buffer:', fileErr.message);
        }
      }

      // AI ATS-lite: Tự động phân tích & chấm điểm sơ bộ hồ sơ
      const requiredSkills = job.requirements?.skills || [];
      const candidateText = `${candidateData.fullName} ${candidateData.summary || ''} ${candidateData.experience || ''} ${candidateData.skills || ''} ${parsedCvText}`.toLowerCase();

      const matchedSkills = requiredSkills.filter((skill) => candidateText.includes(skill.toLowerCase()));
      const missingSkills = requiredSkills.filter((skill) => !candidateText.includes(skill.toLowerCase()));

      const skillScore = requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 85;

      const passingScore = job.requirements?.passingScore || 70;
      const isAccepted = skillScore >= passingScore;

      const candidate = {
        fullName: candidateData.fullName,
        email: candidateData.email,
        phone: candidateData.phone || '',
        cvUrl: uploadedCvUrl || 'https://example.com/candidate-cv.pdf',
        aiScore: skillScore,
        aiSummary: `AI Sàng Lọc: Khớp ${matchedSkills.length}/${requiredSkills.length} kỹ năng (${matchedSkills.join(', ') || 'Chưa rõ'}). Điểm phù hợp: ${skillScore}%.${parsedCvText ? ' (Đã bóc tách tự động từ tệp CV)' : ''}`,
        aiScreening: {
          score: skillScore,
          decision: isAccepted ? 'ACCEPTED' : 'NEEDS_REVIEW',
          matchedSkills,
          missingSkills,
          strengths: matchedSkills.length > 0 ? `Thành thạo các kỹ năng: ${matchedSkills.join(', ')}` : 'Cần đánh giá thêm trong buổi phỏng vấn',
          weaknesses: missingSkills.length > 0 ? `Chưa thấy đề cập về: ${missingSkills.join(', ')}` : 'Hồ sơ đầy đủ kỹ năng yêu cầu',
          evaluatedAt: new Date(),
        },
        status: isAccepted ? 'SCREENED' : 'APPLIED',
        appliedAt: new Date(),
      };

      job.candidates.push(candidate);
      await job.save();

      return {
        success: true,
        candidateId: candidate._id,
        fullName: candidate.fullName,
        aiScore: skillScore,
        decision: candidate.aiScreening.decision,
        status: candidate.status,
        cvUrl: candidate.cvUrl,
      };
    });
  }


  /**
   * Lấy danh sách tin tuyển dụng nội bộ của công ty (CEO & HR Manager)
   */
  static async getJobPostings(filter = {}) {
    const tenant = tenantStore.getStore();
    const query = tenant?.companyId ? { companyId: tenant.companyId, ...filter } : filter;
    return JobPosting.find(query)
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });
  }

  /**
   * Tạo tin tuyển dụng mới
   */
  static async createJobPosting(data) {
    const tenant = tenantStore.getStore();
    const job = new JobPosting({
      ...data,
      companyId: tenant?.companyId,
    });
    return job.save();
  }

  /**
   * Ứng tuyển vào tin tuyển dụng (Nội bộ)
   */
  static async applyJob(jobId, candidateData) {
    return this.applyJobPublic(jobId, candidateData);
  }

  /**
   * Cập nhật trạng thái ứng viên & Tự động gửi Email mời phỏng vấn nếu duyệt
   */
  static async updateCandidateStatus(jobId, candidateId, status, interviewDetails = null, currentUser = null) {
    const tenant = tenantStore.getStore();
    const filter = tenant?.companyId ? { _id: jobId, companyId: tenant.companyId } : { _id: jobId };
    const job = await JobPosting.findOne(filter).populate('companyId', 'name');
    if (!job) throw new Error('Tin tuyển dụng không tồn tại');

    const candidate = job.candidates.id(candidateId);
    if (!candidate) throw new Error('Ứng viên không tồn tại trong danh sách');

    candidate.status = status;

    // Nếu duyệt chuyển sang trạng thái INTERVIEW, lưu lịch và kích hoạt gửi Email
    if (status === 'INTERVIEW' && interviewDetails) {
      candidate.interviewDetails = {
        interviewDate: interviewDetails.interviewDate || '',
        interviewTime: interviewDetails.interviewTime || '09:00 AM',
        interviewLocation: interviewDetails.interviewLocation || 'Văn phòng Công ty',
        notes: interviewDetails.notes || '',
        scheduledAt: new Date(),
        scheduledBy: currentUser?.fullName || 'Hội đồng Tuyển dụng',
      };

      // Gửi email thông báo trúng tuyển phỏng vấn
      try {
        await EmailService.sendInterviewInvitationEmail({
          candidateEmail: candidate.email,
          candidateName: candidate.fullName,
          jobTitle: job.title,
          interviewDate: interviewDetails.interviewDate,
          interviewTime: interviewDetails.interviewTime,
          interviewLocation: interviewDetails.interviewLocation,
          interviewType: interviewDetails.interviewType || 'Trực tiếp tại văn phòng',
          interviewerName: currentUser?.fullName || 'Trưởng Ban Tuyển Dụng',
          notes: interviewDetails.notes,
          companyName: job.companyId?.name || 'PeopleInsight AI Corporation',
        });
      } catch (emailErr) {
        console.warn('[Email Warning] Không thể gửi email thực tế:', emailErr.message);
      }
    }

    await job.save();
    return candidate;
  }
}
