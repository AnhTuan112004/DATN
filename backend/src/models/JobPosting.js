import mongoose from 'mongoose';

const { Schema } = mongoose;

const CandidateSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  cvUrl: { type: String, required: true },
  aiScore: { type: Number, default: 0 },
  aiSummary: { type: String, default: '' },
  status: { type: String, enum: ['APPLIED', 'SCREENED', 'INTERVIEW', 'OFFER', 'REJECTED'], default: 'APPLIED' },
  appliedAt: { type: Date, default: Date.now },
}, { _id: true });

const JobPostingSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  jobDescription: { type: String, required: true },
  requirements: [String],
  salaryRange: {
    min: Number,
    max: Number,
  },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  candidates: [CandidateSchema],
}, { timestamps: true });

export const JobPosting = mongoose.model('JobPosting', JobPostingSchema);
