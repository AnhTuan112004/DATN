import mongoose from 'mongoose';

const { Schema } = mongoose;

const FaceTemplateSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

  // Vector descriptors (Embedding vectors: 128, 192, or 512 dimensions based on Spike Tuần 0)
  descriptors: {
    type: [[Number]],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'At least one face embedding descriptor is required',
    },
  },

  modelName: { type: String, default: 'face-api-ssd-mobilenetv1' },
  modelVersion: { type: String, default: '1.0' },
  vectorDimension: { type: Number, required: true, default: 128 },
  
  // Lưu trữ mã hóa tầng ứng dụng AES-256-GCM (nếu kích hoạt mã hóa)
  encryptedPayload: { type: String, default: null },

  // Pháp lý BVDLCN & Quản lý lấy mẫu trực tiếp
  hasConsent: { type: Boolean, required: true, default: true },
  consentTimestamp: { type: Date, default: Date.now },
  consentPolicyVersion: { type: String, default: 'v1.0' },
  enrolledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // ID của HR Manager trực tiếp lấy mẫu
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const FaceTemplate = mongoose.model('FaceTemplate', FaceTemplateSchema);
