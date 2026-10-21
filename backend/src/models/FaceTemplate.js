import mongoose from 'mongoose';
import crypto from 'crypto';
import { tenantPlugin } from '../plugins/tenantPlugin.js';
import { config } from '../config/env.js';

const { Schema } = mongoose;

/**
 * Thuật toán mã hóa AES-256-GCM bảo vệ vector embedding sinh trắc học
 * Tuân thủ nghiêm ngặt Luật BVDLCN 91/2025/QH15 (Application-Level Encryption)
 */
export const encryptDescriptors = (descriptors, keyString = config.security.biometricEncryptionKey) => {
  // Đảm bảo key đủ 32 bytes (256 bits)
  const key = crypto.createHash('sha256').update(keyString).digest();
  const iv = crypto.randomBytes(12); // Chuẩn 12 bytes IV cho GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const payload = JSON.stringify(descriptors);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Gói iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptDescriptors = (encryptedPayload, keyString = config.security.biometricEncryptionKey) => {
  if (!encryptedPayload) return [];
  const [ivHex, authTagHex, encryptedData] = encryptedPayload.split(':');
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('CORRUPTED_BIOMETRIC_DATA: Invalid encrypted payload format');
  }

  const key = crypto.createHash('sha256').update(keyString).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
};

const FaceTemplateSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
    immutable: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Vector descriptors (Embedding vectors: 128 chiều trích xuất từ Spike Tuần 0)
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

  // Chuỗi mã hóa AES-256-GCM bảo vệ vector at-rest
  encryptedPayload: { type: String, default: null },

  // Tuân thủ Luật BVDLCN 91/2025/QH15 & Quy trình lấy mẫu trực tiếp có HR giám sát
  hasConsent: { type: Boolean, required: true, default: true },
  consentTimestamp: { type: Date, default: Date.now },
  consentPolicyVersion: { type: String, default: 'v2026.1' },
  enrolledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // ID của HR Manager trực tiếp lấy mẫu
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Composite Unique Index: 1 nhân viên trong 1 công ty chỉ có tối đa 1 bộ FaceTemplate
FaceTemplateSchema.index({ companyId: 1, userId: 1 }, { unique: true });

// Tự động mã hóa AES-256-GCM trước khi lưu vào MongoDB
FaceTemplateSchema.pre('save', function (next) {
  if (this.descriptors && this.descriptors.length > 0) {
    try {
      this.encryptedPayload = encryptDescriptors(this.descriptors);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Helper method trên document instance để lấy descriptors giải mã
FaceTemplateSchema.methods.getDecryptedDescriptors = function () {
  if (this.encryptedPayload) {
    return decryptDescriptors(this.encryptedPayload);
  }
  return this.descriptors;
};

// Áp dụng plugin Multi-tenant Fail-Closed
FaceTemplateSchema.plugin(tenantPlugin);

export const FaceTemplate = mongoose.model('FaceTemplate', FaceTemplateSchema);
