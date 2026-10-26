import { RecruitmentService } from '../services/recruitmentService.js';

export const getJobPostings = async (req, res, next) => {
  try {
    const jobs = await RecruitmentService.getJobPostings();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

export const createJobPosting = async (req, res, next) => {
  try {
    const job = await RecruitmentService.createJobPosting(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

export const applyJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidate = await RecruitmentService.applyJob(id, req.body);
    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
};

export const updateCandidateStatus = async (req, res, next) => {
  try {
    const { id, candidateId } = req.params;
    const { status } = req.body;
    const candidate = await RecruitmentService.updateCandidateStatus(id, candidateId, status);
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
};
