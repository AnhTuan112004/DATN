import mongoose from 'mongoose';

const { Schema } = mongoose;

const CandidateSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  cvUrl: { type: String, required: true },
  aiScore: { type: Number, default: 0 },
  aiSummary: { type: String, default: '' },
  aiScreening: {
    score: { type: Number, default: 0 },
    decision: { type: String, enum: ['ACCEPTED', 'REJECTED', 'NEEDS_REVIEW', 'PENDING'], default: 'PENDING' },
    matchedSkills: [String],
    missingSkills: [String],
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    evaluatedAt: { type: Date },
  },
  status: { type: String, enum: ['APPLIED', 'SCREENED', 'INTERVIEW', 'OFFER', 'REJECTED'], default: 'APPLIED' },
  interviewDetails: {
    interviewDate: { type: String, default: '' },
    interviewTime: { type: String, default: '' },
    interviewLocation: { type: String, default: '' },
    notes: { type: String, default: '' },
    scheduledAt: { type: Date },
    scheduledBy: { type: String, default: '' },
  },
  appliedAt: { type: Date, default: Date.now },
}, { _id: true });


const JobPostingSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  jobDescription: { type: String, required: true },
  requirements: {
    skills: [String],
    minYearsOfExp: { type: Number, default: 0 },
    passingScore: { type: Number, default: 70 },
  },
  salaryRange: {
    min: Number,
    max: Number,
  },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  candidates: [CandidateSchema],
}, { timestamps: true });

export const JobPosting = mongoose.model('JobPosting', JobPostingSchema);
