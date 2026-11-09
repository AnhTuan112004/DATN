import { apiClient } from './client';

export interface CandidateInterviewDetails {
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewType?: string;
  notes?: string;
  scheduledAt?: string;
  scheduledBy?: string;
}

export interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  cvUrl?: string;
  aiScore: number;
  aiSummary: string;
  aiScreening?: {
    score: number;
    decision: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW' | 'PENDING';
    matchedSkills: string[];
    missingSkills: string[];
    strengths: string;
    weaknesses: string;
  };
  interviewDetails?: CandidateInterviewDetails;
  status: string;
  appliedAt: string;
}

export interface JobPosting {
  _id: string;
  title: string;
  departmentId?: { _id: string; name: string };
  jobDescription: string;
  requirements: {
    skills: string[];
    minYearsOfExp: number;
    passingScore: number;
  };
  salaryRange?: { min: number; max: number };
  status: string;
  candidates: Candidate[];
}

export const recruitmentApi = {
  getJobs: async () => {
    const res = await apiClient.get<{ success: boolean; data: JobPosting[] }>('/recruitment/jobs');
    return res.data;
  },

  updateCandidateStatus: async (
    jobId: string,
    candidateId: string,
    payload: {
      status: string;
      interviewDetails?: CandidateInterviewDetails;
    }
  ) => {
    const res = await apiClient.patch<{ success: boolean; message?: string; data?: any }>(
      `/recruitment/jobs/${jobId}/candidates/${candidateId}/status`,
      payload
    );
    return res.data;
  },

  applyCandidate: async (jobId: string, data: any) => {
    const res = await apiClient.post<{ success: boolean; message?: string; data?: any }>(
      `/recruitment/jobs/${jobId}/apply`,
      data
    );
    return res.data;
  },

  createJob: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: JobPosting }>('/recruitment/jobs', data);
    return res.data;
  },

  deleteCandidate: async (jobId: string, candidateId: string) => {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      `/recruitment/jobs/${jobId}/candidates/${candidateId}`
    );
    return res.data;
  },

  toggleJobStatus: async (jobId: string, status?: string) => {
    const res = await apiClient.patch<{ success: boolean; message?: string; data: JobPosting }>(
      `/recruitment/jobs/${jobId}/status`,
      { status }
    );
    return res.data;
  },

  deleteJob: async (jobId: string) => {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      `/recruitment/jobs/${jobId}`
    );
    return res.data;
  },
};
