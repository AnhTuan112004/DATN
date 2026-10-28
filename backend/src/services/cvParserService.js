import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Service bóc tách nội dung văn bản từ các tệp CV thật (.pdf, .docx, .txt)
 */
export class CvParserService {
  /**
   * Trích xuất văn bản từ file buffer
   * @param {Buffer} buffer - Dữ liệu nhị phân của tệp
   * @param {string} originalname - Tên file gốc (để kiểm tra định dạng đuôi)
   * @returns {Promise<{ text: string, email?: string, phone?: string }>}
   */
  static async parseCvBuffer(buffer, originalname = '') {
    const ext = path.extname(originalname).toLowerCase();
    let extractedText = '';

    try {
      if (ext === '.pdf') {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      } else if (ext === '.docx' || ext === '.doc') {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } else {
        // Mặc định hoặc file text
        extractedText = buffer.toString('utf-8');
      }
    } catch (parseErr) {
      console.warn(`[CvParserService] Lỗi khi giải mã file ${originalname}:`, parseErr.message);
      extractedText = buffer.toString('utf-8');
    }

    // Làm sạch văn bản: chuẩn hóa khoảng trắng thừa
    const cleanText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim();

    // Regex trích xuất email & số điện thoại nếu có
    const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = cleanText.match(/(?:\+?84|0)(?:3|5|7|8|9)[0-9]{8}\b/);

    return {
      text: cleanText,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
    };
  }
}
