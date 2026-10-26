import { JobPosting } from '../models/JobPosting.js';
import { Department } from '../models/Department.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

export class RecruitmentService {
  /**
   * Lấy danh sách tin tuyển dụng của công ty
   */
  static async getJobPostings(filter = {}) {
    const tenant = tenantStore.getStore();
    const query = { companyId: tenant?.companyId, ...filter };
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
   * Ứng tuyển vào tin tuyển dụng
   */
  static async applyJob(jobId, candidateData) {
    const tenant = tenantStore.getStore();
    const job = await JobPosting.findOne({ _id: jobId, companyId: tenant?.companyId });
    if (!job) {
      throw new Error('Tin tuyển dụng không tồn tại');
    }

    // Tự động phân tích & chấm điểm sơ bộ (ATS Rule-based / Keyword Matching)
    const requiredSkills = job.requirements?.skills || [];
    const candidateText = `${candidateData.fullName} ${candidateData.summary || ''} ${candidateData.experience || ''}`.toLowerCase();
    
    const matchedSkills = requiredSkills.filter(skill => candidateText.includes(skill.toLowerCase()));
    const missingSkills = requiredSkills.filter(skill => !candidateText.includes(skill.toLowerCase()));
    
    const skillScore = requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
      : 80;

    const candidate = {
      fullName: candidateData.fullName,
      email: candidateData.email,
      phone: candidateData.phone || '',
      cvUrl: candidateData.cvUrl || 'https://example.com/cv.pdf',
      aiScore: skillScore,
      aiSummary: `Khớp ${matchedSkills.length}/${requiredSkills.length} kỹ năng yêu cầu (${matchedSkills.join(', ') || 'Chưa rõ'}).`,
      aiScreening: {
        score: skillScore,
        decision: skillScore >= (job.requirements?.passingScore || 70) ? 'ACCEPTED' : 'NEEDS_REVIEW',
        matchedSkills,
        missingSkills,
        strengths: matchedSkills.length > 0 ? `Nắm vững: ${matchedSkills.join(', ')}` : 'Cần phỏng vấn thêm',
        weaknesses: missingSkills.length > 0 ? `Thiếu kinh nghiệm thực tế về: ${missingSkills.join(', ')}` : 'Không phát hiện điểm yếu lớn',
        evaluatedAt: new Date(),
      },
      status: skillScore >= (job.requirements?.passingScore || 70) ? 'SCREENED' : 'APPLIED',
      appliedAt: new Date(),
    };

    job.candidates.push(candidate);
    await job.save();
    return candidate;
  }

  /**
   * Cập nhật trạng thái ứng viên (INTERVIEW, OFFER, REJECTED)
   */
  static async updateCandidateStatus(jobId, candidateId, status) {
    const tenant = tenantStore.getStore();
    const job = await JobPosting.findOne({ _id: jobId, companyId: tenant?.companyId });
    if (!job) throw new Error('Tin tuyển dụng không tồn tại');

    const candidate = job.candidates.id(candidateId);
    if (!candidate) throw new Error('Ứng viên không tồn tại');

    candidate.status = status;
    await job.save();
    return candidate;
  }
}
