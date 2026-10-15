import mongoose from 'mongoose';

const { Schema } = mongoose;

const PolicyChunkSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'INTERNAL_POLICY' }, // NỘI QUY LAO ĐỘNG, CHẾ ĐỘ PHÉP, AN TOÀN
  embedding: {
    type: [Number], // Vector 768 dimensions for Gemini Text Embedding
    default: [],
  },
  sourceDocument: { type: String, default: '' },
}, { timestamps: true });

export const PolicyChunk = mongoose.model('PolicyChunk', PolicyChunkSchema);
