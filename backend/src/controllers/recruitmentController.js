import { RecruitmentService } from '../services/recruitmentService.js';

/**
 * Lấy danh sách việc làm công khai (Public)
 */
export const getPublicJobPostings = async (req, res, next) => {
  try {
    const jobs = await RecruitmentService.getPublicJobPostings();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * Ứng tuyển công khai từ bên ngoài (Public Apply)
 */
export const applyJobPublic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidatePayload = { ...req.body };
    if (req.file) {
      candidatePayload.file = req.file;
    }
    const result = await RecruitmentService.applyJobPublic(id, candidatePayload);
    res.status(201).json({
      success: true,
      message: 'Nộp hồ sơ ứng tuyển thành công! Hồ sơ của bạn đã được chuyển đến hệ thống sàng lọc AI.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách tin tuyển dụng nội bộ (Dành cho HR/CEO)
 */
export const getJobPostings = async (req, res, next) => {
  try {
    const jobs = await RecruitmentService.getJobPostings();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo tin tuyển dụng mới (CEO, HR_MANAGER)
 */
export const createJobPosting = async (req, res, next) => {
  try {
    const job = await RecruitmentService.createJobPosting(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

/**
 * Ứng tuyển nội bộ
 */
export const applyJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidate = await RecruitmentService.applyJob(id, req.body);
    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật trạng thái ứng viên & Lên lịch gửi email phỏng vấn (CEO, HR_MANAGER)
 */
export const updateCandidateStatus = async (req, res, next) => {
  try {
    const { id, candidateId } = req.params;
    const { status, interviewDetails } = req.body;
    const candidate = await RecruitmentService.updateCandidateStatus(
      id,
      candidateId,
      status,
      interviewDetails,
      req.user
    );
    res.status(200).json({
      success: true,
      message: status === 'INTERVIEW'
        ? 'Đã duyệt ứng viên và gửi thư mời phỏng vấn thành công qua email!'
        : 'Cập nhật trạng thái ứng viên thành công.',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};
