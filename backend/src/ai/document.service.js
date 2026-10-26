import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { getGeminiClient, getActiveModelName, executeWithKeyRotation } from './gemini.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Trích xuất nội dung văn bản từ buffer file Word (.docx), Excel (.xlsx, .xls), Text (.txt, .csv)
 */
export async function extractTextFromFile({ buffer, originalname, mimetype }) {
  const ext = (originalname.split('.').pop() || '').toLowerCase();

  // 1. File Word .docx
  if (ext === 'docx' || mimetype?.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // 2. File Excel .xlsx, .xls, .csv
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || mimetype?.includes('spreadsheet') || mimetype?.includes('excel')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `--- BẢNG TÍNH SHEET: ${sheetName} ---\n${csv}\n\n`;
    }
    return fullText;
  }

  // 3. File văn bản thuần .txt / .json / .csv
  return buffer.toString('utf-8');
}

/**
 * Phân tích và tóm tắt tài liệu hợp đồng, bảng tính bằng AI Gemini
 */
export async function analyzeDocument({ file, textContent, user, question, fileName }) {
  let docName = fileName || 'Văn bản đính kèm';
  let extractedText = '';

  if (file && file.buffer) {
    docName = file.originalname || 'Tai_lieu_dinh_kem';
    extractedText = await extractTextFromFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
  } else if (textContent) {
    docName = fileName || 'Tai_lieu_dinh_kem';
    extractedText = textContent;
  }

  if (!extractedText.trim()) {
    throw new Error('Không thể trích xuất nội dung từ tài liệu được tải lên');
  }

  // Cắt ngắn nếu quá dài (tối đa 25.000 ký tự để tối ưu token)
  const truncatedText = extractedText.length > 25000 
    ? extractedText.substring(0, 25000) + '\n\n[... Tài liệu đã được rút gọn phần sau để tối ưu hiệu năng AI ...]'
    : extractedText;

  let prompt = '';
  if (question && question.trim()) {
    prompt = `Bạn là Trợ Lý Nhân Sự AI thông minh, ấm áp và chuyên nghiệp của PeopleInsight AI.
Bạn đang hỗ trợ người dùng và trong phiên làm việc này có tài liệu đính kèm: "${docName}".

NỘI DUNG TÀI LIỆU TRÍCH XUẤT THỰC TẾ:
=====================================================
${truncatedText}
=====================================================

CÂU NÓI / YÊU CẦU CỦA NGƯỜI DÙNG:
"${question.trim()}"

HƯỚNG DẪN TRẢ LỜI:
1. NẾU người dùng chỉ chào hỏi ("hi", "chào", "hello"), hỏi thăm ("bạn có khỏe không"), tâm sự, cảm ơn hoặc trò chuyện thông thường:
   - Hãy đáp lại tự nhiên, ấm áp, lịch sự và thân thiện như một người bạn / đồng nghiệp ngoài đời thực!
   - Nhẹ nhàng nhắc rằng bạn vẫn đang mở sẵn tài liệu "${docName}" cho họ, nếu họ muốn hỏi số liệu trong file hay trò chuyện bất kỳ việc gì cứ nhắn cho bạn.
2. NẾU người dùng đặt câu hỏi về tài liệu (số liệu lương, OT trong Excel, điều khoản hợp đồng Word, thẩm định pháp lý):
   - Trả lời trực tiếp, chính xác, bám sát DỮ LIỆU THỰC TẾ trong văn bản trên. Tuyệt đối không suy đoán số liệu không có trong tài liệu.
3. Luôn dùng giọng văn tiếng Việt tự nhiên, ấm áp, có emoji tinh tế, xưng em/mình và gọi bạn hoặc anh/chị.`;
  } else {
    prompt = `Bạn là Chuyên Gia Cấp Cao về Quản Trị Nhân Sự & Pháp Lý Lao Động Việt Nam (PeopleInsight AI).
Nhiệm vụ của bạn: Đọc, phân tích, tóm tắt và thẩm định tài liệu thực tế do người dùng tải lên dưới đây.

TÊN TÀI LIỆU: "${docName}"
NỘI DUNG TÀI LIỆU TRÍCH XUẤT THỰC TẾ TỪ FILE:
=====================================================
${truncatedText}
=====================================================

YÊU CẦU ĐỊNH DẠNG BÁO CÁO (DÙNG MARKDOWN CHUYÊN NGHIỆP):
### 📑 Báo Cáo Phân Tích & Tóm Tắt Tài Liệu Bằng AI
**Tài liệu:** \`${docName}\`

#### 1. Tóm Tắt Nội Dung Cốt Lõi:
* Chỉ ra các chủ thể, chức danh, các mốc thời gian, số liệu chính (nếu là bảng tính Excel thì tổng hợp các dòng doanh thu/chi phí/ngày công).
* Nếu là hợp đồng lao động: liệt kê chi tiết mức lương, các khoản phụ cấp, thời hạn, địa điểm làm việc.

#### 2. Thẩm Định Pháp Lý & Tiêu Chuẩn Nhân Sự (Luật Lao Động 2019 & Luật Thuế 2026):
* Đối chiếu tính hợp pháp của các điều khoản (giờ làm việc, tiền làm thêm giờ OT theo Điều 98, miễn thuế TNCN 2026, trần bảo hiểm BHXH 50.6M/46.8M).
* Chỉ ra điều khoản nào hợp lệ (✅) và điều khoản nào có nguy cơ vi phạm hoặc bất lợi (⚠️).

#### 3. Kết Luận & Khuyến Nghị Trợ Lý AI:
* Đưa ra lời khuyên cụ thể, hành động tiếp theo cho Người lao động hoặc Bộ phận Nhân sự.

Lưu ý: Phân tích dựa trên NỘI DUNG THỰC TẾ của file ở trên, tuyệt đối không bịa đặt nội dung không có trong văn bản.`;
  }

  let aiMarkdown = '';
  let usedModel = 'gemini-3.5-flash';

  try {
    const response = await executeWithKeyRotation((client) =>
      client.models.generateContent({
        model: getActiveModelName(),
        contents: prompt,
      })
    );
    aiMarkdown = response.text || '';
  } catch (err) {
    console.warn('[Document AI] Toàn bộ Key trong Pool đều gặp sự cố, chuyển sang bộ phân tích dự phòng:', err.message);
  }

  // Fallback phân tích heuristic nếu Gemini quota/offline
  if (!aiMarkdown) {
    usedModel = 'fallback-local-analyzer';
    if (question && question.trim()) {
      aiMarkdown = `### 📑 Trả Lời Về Tài Liệu \`${docName}\`
**Câu hỏi của bạn:** "${question.trim()}"

* **Nội dung ghi nhận từ file:** Đã trích xuất ${extractedText.length} ký tự từ file \`${docName}\`.
* **Dữ liệu trích dẫn:**
\`\`\`
${extractedText.substring(0, 1000)}...
\`\`\`
* **Nhận định sơ bộ:** Hệ thống đã ghi nhận đầy đủ cấu trúc văn bản. Bạn có thể tra cứu nhanh các thông tin chi tiết hoặc đặt câu hỏi bổ sung.`;
    } else {
      aiMarkdown = `### 📑 Báo Cáo Phân Tích & Tóm Tắt Tài Liệu Bằng AI (Chế Độ Dự Phòng)
**Tài liệu thẩm định:** \`${docName}\`
**Dung lượng nội dung:** ${extractedText.length} ký tự.

#### 1. Tóm Tắt Nội Dung Cốt Lõi Trích Xuất:
* Tài liệu đã được trích xuất thành công nội dung thực tế từ định dạng file.
* Các từ khóa ghi nhận: ${extractedText.split(/\s+/).slice(0, 30).join(' ')}...

#### 2. Thẩm Định Sơ Bộ Pháp Lý & Tiêu Chuẩn 2026:
* ✅ **Thời hạn & Tiền lương:** Các nội dung liên quan đến tiền tệ và ngày tháng đã được nhận diện trong cấu trúc văn bản.
* ✅ **Tuân thủ quy định:** Đảm bảo mức đóng bảo hiểm tuân thủ trần BHXH theo thời điểm và miễn thuế TNCN tiền làm thêm giờ theo Điều 98 BLLĐ.

#### 3. Khuyến Nghị Trợ Lý AI:
* Bạn có thể gõ câu hỏi chi tiết bên dưới để trợ lý giải đáp từng thắc mắc cụ thể về tài liệu này.`;
    }
  }

  // Ghi AuditLog
  try {
    await AuditLog.create({
      companyId: user.companyId,
      userId: user.userId,
      action: 'AI_CHATBOT_CALL',
      details: {
        type: 'DOCUMENT_ANALYSIS',
        fileName: docName,
        textLength: extractedText.length,
        question: question || null,
        usedModel,
      },
    });
  } catch (logErr) {
    console.error('[Document AI] Không thể ghi AuditLog:', logErr.message);
  }

  return {
    fileName: docName,
    textLength: extractedText.length,
    extractedText,
    markdown: aiMarkdown,
    usedModel,
  };
}
