import { handleChatMessage } from '../ai/chat.service.js';
import { analyzeDocument as analyzeDocService } from '../ai/document.service.js';

/**
 * POST /api/ai/chat
 * Trò chuyện với Trợ lý HR AI (Phương án A - Template Rendering)
 */
export const sendChatMessage = async (req, res, next) => {
  try {
    const user = {
      userId: req.user._id || req.user.id || req.user.userId,
      companyId: req.user.companyId,
      role: req.user.role,
      fullName: req.user.fullName,
      email: req.user.email,
    };

    const result = await handleChatMessage({
      user,
      message: req.body.message,
      history: req.body.history || [],
      model: req.body.model,
      req,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AI Chat Controller Error]:', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Nội dung tin nhắn không hợp lệ. Vui lòng thử lại.',
      });
    }
    // Trả về câu trả lời tự nhiên thân thiện, không rò rỉ mã lỗi kỹ thuật ra ngoài màn hình chat
    return res.status(200).json({
      success: true,
      data: {
        success: true,
        type: 'template',
        tool: 'conversational_chat',
        usedModel: 'fallback-assistant',
        latencyMs: 80,
        markdown: 'Dạ em gặp chút gián đoạn khi truy vấn dữ liệu nhân sự cho bạn. Bạn có thể kiểm tra lại tên nhân viên hoặc hỏi em về số dư phép, phiếu lương cá nhân nhé! ✨',
      },
    });
  }
};

/**
 * POST /api/ai/analyze-document
 * Tải file Word (.docx), Excel (.xlsx) hoặc nội dung văn bản để AI phân tích và tóm tắt thực tế
 */
export const analyzeDocument = async (req, res, next) => {
  try {
    const user = {
      userId: req.user._id || req.user.id || req.user.userId,
      companyId: req.user.companyId,
      role: req.user.role,
      fullName: req.user.fullName,
    };

    const result = await analyzeDocService({
      file: req.file,
      textContent: req.body?.content,
      fileName: req.body?.fileName,
      question: req.body?.question,
      user,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[Document Analysis Controller Error]:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Không thể phân tích tài liệu được tải lên',
    });
  }
};
