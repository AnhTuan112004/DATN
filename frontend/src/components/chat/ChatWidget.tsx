import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Bot,
  User,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  Clock,
  Cpu,
  ChevronDown,
  Paperclip,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendChatMessage, analyzeDocumentApi, ChatMessage } from '../../api/ai';
import { MarkdownRenderer } from './MarkdownRenderer';

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State hỗ trợ Đọc & Phân Tích Hợp Đồng / File DOCX/XLSX
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [sampleDoc, setSampleDoc] = useState<{ fileName: string; content: string } | null>(null);
  const [activeDocumentContext, setActiveDocumentContext] = useState<{ fileName: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatStorageKey = user?._id ? `pi_chat_history_${user._id}` : null;

  const getWelcomeMessage = (userName?: string): ChatMessage => ({
    id: 'msg-welcome',
    sender: 'assistant',
    text: `Chào **${userName || 'bạn'}**! Tôi là **Trợ Lý Nhân Sự AI** được tích hợp mô hình Gemini 3.5 Flash.

* **Tra cứu thông tin nội bộ:** Hỏi số dư phép năm, phiếu lương, tóm tắt chấm công.
* **Đọc & Thẩm định tài liệu:** Bấm biểu tượng 📎 để tải file Word (\`.docx\`) hoặc Excel (\`.xlsx\`) vào cuộc trò chuyện — bạn có thể hỏi bất kỳ câu hỏi nào về file!`,
    timestamp: new Date(),
    tool: 'system_welcome',
    usedModel: 'system-agent',
  });

  // Khởi tạo danh sách tin nhắn theo tài khoản người dùng đang đăng nhập
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined' && user?._id) {
      try {
        const saved = localStorage.getItem(`pi_chat_history_${user._id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((m: any) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }));
          }
        }
      } catch (e) {
        console.warn('Lỗi đọc lịch sử chat từ localStorage:', e);
      }
    }
    return [getWelcomeMessage(user?.fullName)];
  });

  // Tự động chuyển đổi lịch sử tin nhắn khi tài khoản thay đổi (User A -> User B)
  useEffect(() => {
    if (!chatStorageKey) {
      setMessages([getWelcomeMessage(user?.fullName)]);
      return;
    }
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((m: any) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }))
          );
          return;
        }
      }
    } catch (e) {
      console.warn('Lỗi tải lịch sử chat theo tài khoản:', e);
    }
    setMessages([getWelcomeMessage(user?.fullName)]);
  }, [user?._id]);

  // Tự động lưu lịch sử tin nhắn theo tài khoản vào localStorage (tối đa 50 tin nhắn mới nhất)
  useEffect(() => {
    if (!chatStorageKey || messages.length === 0) return;
    try {
      const toSave = messages.slice(-50);
      localStorage.setItem(chatStorageKey, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Lỗi lưu lịch sử chat vào localStorage:', e);
    }
  }, [messages, chatStorageKey]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Gợi ý câu hỏi nhanh theo vai trò RBAC
  const isCeo = user?.role === 'CEO';
  const isManagerOrAbove = ['CEO', 'HR_MANAGER', 'MANAGER'].includes(user?.role || '');

  const quickPrompts = [
    { text: 'Tôi còn bao nhiêu ngày phép năm?', label: '📅 Số dư phép' },
    { text: 'Xem phiếu lương tháng này của tôi', label: '💰 Phiếu lương' },
    { text: 'Quy định làm thêm giờ OT của công ty thế nào?', label: '📖 Nội quy & OT' },
    { text: 'Tóm tắt chấm công tuần qua của tôi', label: '⏱️ Chấm công' },
    { text: 'Xem hợp đồng lao động của tôi', label: '📄 Hợp đồng' },
    { text: 'Xem hồ sơ thông tin cá nhân của tôi', label: '👤 Hồ sơ' },
    ...(isCeo
      ? [
          { text: 'Tổng hợp tình hình toàn bộ công ty cho tôi', label: '📊 Báo cáo toàn công ty' },
          { text: 'Cho tôi xem thông tin và chấm công của nhân viên EMP002', label: '🔍 Tra cứu nhân viên' },
        ]
      : isManagerOrAbove
      ? [{ text: 'Thống kê tình hình nghỉ phép phòng ban', label: '👥 Thống kê phòng ban' }]
      : []),
  ];

  // Gửi tin nhắn
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend || inputMessage).trim();
    if (!rawText && !selectedDocFile && !sampleDoc) return;
    if (isLoading) return;

    if (rawText.length > 500) {
      alert('Câu hỏi tối đa 500 ký tự để bảo đảm an toàn hệ thống.');
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const userText = rawText || 'Đọc, phân tích và tóm tắt toàn bộ tài liệu này';
    const attachmentInfo = selectedDocFile
      ? { name: selectedDocFile.name, size: selectedDocFile.size }
      : sampleDoc
      ? { name: sampleDoc.fileName, size: sampleDoc.content.length }
      : undefined;

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
      attachment: attachmentInfo,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage('');
    setIsLoading(true);

    const docFileToUpload = selectedDocFile;
    const sampleDocToUse = sampleDoc;
    setSelectedDocFile(null);
    setSampleDoc(null);

    try {
      let responseMarkdown = '';
      let toolName = 'system_chat';
      let modelName = 'gemini-3.5-flash';
      let latency = 0;

      if (docFileToUpload) {
        // Tải file trực tiếp lên AI
        const formData = new FormData();
        formData.append('file', docFileToUpload);
        if (rawText) formData.append('question', rawText);
        const startTime = Date.now();
        const resData = await analyzeDocumentApi(formData);
        latency = Date.now() - startTime;
        responseMarkdown = resData?.markdown || 'Không nhận được kết quả phân tích.';
        toolName = 'document_analyzer';
        modelName = resData?.usedModel || 'gemini-3.5-flash';
        if (resData?.extractedText) {
          setActiveDocumentContext({
            fileName: resData.fileName,
            content: resData.extractedText,
          });
        }
      } else if (sampleDocToUse) {
        // Sử dụng mẫu văn bản thực nghiệm
        const startTime = Date.now();
        const resData = await analyzeDocumentApi({
          content: sampleDocToUse.content,
          fileName: sampleDocToUse.fileName,
          question: rawText || undefined,
        });
        latency = Date.now() - startTime;
        responseMarkdown = resData?.markdown || 'Không nhận được kết quả phân tích.';
        toolName = 'document_analyzer';
        modelName = resData?.usedModel || 'gemini-3.5-flash';
        if (resData?.extractedText) {
          setActiveDocumentContext({
            fileName: resData.fileName,
            content: resData.extractedText,
          });
        }
      } else if (activeDocumentContext) {
        // Đang trong phiên hỏi đáp chuyên sâu về tài liệu đã nạp
        const startTime = Date.now();
        const resData = await analyzeDocumentApi({
          content: activeDocumentContext.content,
          fileName: activeDocumentContext.fileName,
          question: rawText,
        });
        latency = Date.now() - startTime;
        responseMarkdown = resData?.markdown || 'Không nhận được kết quả trả lời.';
        toolName = 'document_qa';
        modelName = resData?.usedModel || 'gemini-3.5-flash';
      } else {
        // Chatbot HR Phương Án A thông thường (P0) kèm lịch sử đa lượt
        const recentHistory = messages.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        }));
        const response = await sendChatMessage(rawText, recentHistory);
        responseMarkdown = response.markdown;
        toolName = response.tool;
        modelName = response.usedModel;
        latency = response.latencyMs;
      }

      const aiMsgId = `ai-${Date.now()}`;
      const newAiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'assistant',
        text: responseMarkdown,
        timestamp: new Date(),
        tool: toolName,
        usedModel: modelName,
        latencyMs: latency,
      };
      setMessages((prev) => [...prev, newAiMsg]);
    } catch (err: any) {
      console.error('Lỗi khi trò chuyện với AI:', err);
      const errorMsgId = `err-${Date.now()}`;
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Không thể kết nối đến máy chủ AI hoặc đã vượt quá hạn mức yêu cầu. Vui lòng thử lại sau giây lát.';

      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'assistant',
          text: `> ⚠️ **Thông Báo Hệ Thống:**\n\n${errorMessage}`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sao chép nội dung tin nhắn
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Xóa lịch sử trò chuyện (chỉ xóa của tài khoản đang đăng nhập)
  const handleClearHistory = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện của tài khoản này không?')) {
      setSelectedDocFile(null);
      setSampleDoc(null);
      setActiveDocumentContext(null);
      if (chatStorageKey) {
        localStorage.removeItem(chatStorageKey);
      }
      setMessages([getWelcomeMessage(user?.fullName)]);
    }
  };

  return (
    <>
      {/* Nút mở trợ lý thu nhỏ gọn, không che nội dung */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Đóng trợ lý nhân sự' : 'Mở trợ lý nhân sự'}
          className={`flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full border transition-all shadow-md ${
            isOpen
              ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
          }`}
        >
          {isOpen ? (
            <X className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <>
              <MessageCircle className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
              <span className="text-xs font-medium hidden sm:inline">Trợ lý HR</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Cửa Sổ Hộp Thoại Chat (Pop-up Window) */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[580px] max-h-[82vh] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg flex flex-col overflow-hidden animate-fadeIn">
          {/* Header Cửa Sổ */}
          <div className="px-4 py-3 bg-[var(--surface)] text-[var(--text)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent-soft)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Trợ lý nhân sự</h3>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[var(--accent)]" strokeWidth={1.5} /> Hỗ trợ tra cứu thông tin cá nhân
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearHistory}
                title="Xóa lịch sử trò chuyện"
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body: Danh Sách Tin Nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar bên trái của Bot */}
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-900/40">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Bong bóng tin nhắn */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <div>
                      {msg.attachment && (
                        <div className="mb-2 p-2 rounded-xl bg-blue-700/80 border border-blue-400/30 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            {(msg.attachment.name || '').match(/\.(xlsx|xls|csv)$/i) ? (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                            ) : (
                              <FileText className="w-4 h-4 text-sky-200" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">{msg.attachment.name}</div>
                            <div className="text-[10px] text-blue-200">
                              {msg.attachment.size && msg.attachment.size > 0
                                ? `${Math.round(msg.attachment.size / 1024)} KB • `
                                : ''}
                              Tệp đính kèm đã nạp vào AI
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  ) : (
                    <div>
                      <MarkdownRenderer content={msg.text} />

                      {/* Meta Footer cho tin nhắn Assistant */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {msg.tool && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                              {msg.tool}
                            </span>
                          )}
                          {msg.latencyMs !== undefined && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Clock className="w-2.5 h-2.5" /> {msg.latencyMs}ms
                            </span>
                          )}
                          {msg.usedModel && (
                            <span className="flex items-center gap-0.5 text-indigo-400 font-mono">
                              <Cpu className="w-2.5 h-2.5" /> {msg.usedModel}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Sao chép câu trả lời"
                          className="hover:text-slate-200 p-0.5"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar bên phải của User */}
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Trạng thái đang suy luận */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm text-xs flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Gemini đang phân tích ý định & truy vấn CSDL...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Gợi Ý Câu Hỏi Nhanh (Chips) */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => {
                  setActiveDocumentContext(null);
                  handleSendMessage(p.text);
                }}
                className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Footer: Input Nhập Liệu & Inline Document Attachment */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            {/* Input File ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedDocFile(file);
                  setSampleDoc(null);
                  e.target.value = '';
                }
              }}
            />

            {/* Banner: Đang hỏi đáp theo tài liệu đã nạp (Active Session Context) */}
            {activeDocumentContext && !selectedDocFile && !sampleDoc && (
              <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 animate-fadeIn">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span className="font-medium truncate">Đang mở: <b>{activeDocumentContext.fileName}</b></span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded-full shrink-0">Bộ nhớ file bật</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDocumentContext(null)}
                  title="Thoát tài liệu để quay lại trò chuyện tự do"
                  className="px-2 py-0.5 rounded-lg bg-indigo-200/60 dark:bg-indigo-900/80 hover:bg-rose-100 dark:hover:bg-rose-950 text-indigo-800 dark:text-indigo-200 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1 transition shrink-0 ml-2 shadow-2xs"
                >
                  <span>Thoát file</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Banner: Tệp đính kèm chờ gửi (Staged File Attachment) */}
            {(selectedDocFile || sampleDoc) && (
              <div className="mb-2 p-2 rounded-xl bg-indigo-50/80 dark:bg-slate-800/90 border border-indigo-500/40 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-500 flex items-center justify-center shrink-0">
                    {(selectedDocFile?.name || sampleDoc?.fileName || '').match(/\.(xlsx|xls|csv)$/i) ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {selectedDocFile?.name || sampleDoc?.fileName}
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      {selectedDocFile ? `${Math.round(selectedDocFile.size / 1024)} KB` : 'Tài liệu mẫu'} • Sẵn sàng để AI đọc &amp; phân tích
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocFile(null);
                    setSampleDoc(null);
                  }}
                  title="Gỡ tệp này"
                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Nút Đính kèm file Word / Excel */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm file Word (.docx) hoặc Excel (.xlsx) vào cuộc trò chuyện"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-500 border border-slate-200 dark:border-slate-700 transition shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={
                  selectedDocFile || sampleDoc
                    ? 'Nhập câu hỏi về file (hoặc bấm gửi để AI tóm tắt)...'
                    : activeDocumentContext
                    ? `Hỏi bất kỳ điều gì về ${activeDocumentContext.fileName}...`
                    : 'Hỏi về ngày phép, phiếu lương hoặc đính kèm file...'
                }
                value={inputMessage}
                maxLength={500}
                disabled={isLoading}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={(!inputMessage.trim() && !selectedDocFile && !sampleDoc) || isLoading}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 transition-colors shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Quick Template Attachment Chips */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="shrink-0 text-slate-400 font-medium">Thử mẫu:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocFile(null);
                    setSampleDoc({
                      fileName: 'Hop_Dong_Lao_Dong_Mau_2026.docx',
                      content: `HỢP ĐỒNG LAO ĐỘNG SỐ: HD-2026/088
Bên A (Người sử dụng lao động): Công ty Cổ phần Công nghệ PeopleInsight
Bên B (Người lao động): Nguyễn Văn Bình (Kỹ sư phát triển phần mềm)
1. Thời hạn hợp đồng: 12 tháng kể từ 01/01/2026 đến 31/12/2026.
2. Công việc & Địa điểm: Kỹ sư Fullstack, Tòa nhà Keangnam Landmark 72, Hà Nội.
3. Chế độ tiền lương: Lương cơ bản: 28.000.000 VNĐ/tháng. Phụ cấp ăn ca: 1.200.000 VNĐ/tháng.
4. Thời giờ làm việc: 08:30 - 17:30 (Thứ 2 - Thứ 6). Làm thêm giờ được hưởng theo Điều 98 BLLĐ và được miễn thuế TNCN năm 2026.
5. Bảo hiểm xã hội: Đóng BHXH, BHYT, BHTN theo mức lương cơ bản (áp trần BHXH 50.600.000 VNĐ).
6. Quyền lợi nghỉ phép: 12 ngày phép năm nguyên lương theo Điều 113-114 BLLĐ.`,
                    });
                  }}
                  className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
                >
                  📑 HĐ Mẫu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocFile(null);
                    setSampleDoc({
                      fileName: 'Bang_Luong_Va_OT_Thang_10_2026.xlsx',
                      content: `--- BẢNG TÍNH SHEET: ChiPhiLuong_T10 ---
Mã NV,Họ và tên,Chức vụ,Lương cơ bản,Ngày công TT,Giờ OT thường,Giờ OT đêm,Thuế TNCN,Lương Net
EMP001,Nguyễn Văn An,CEO,45000000,22,0,0,3250000,37025000
EMP002,Phạm Thu Hương,HR Manager,28000000,22,6,2,725000,24335000
EMP009,Lê Minh Trí,Software Engineer,22000000,22,12,4,0,19690000
EMP010,Đặng Thu Trang,Frontend Dev,18000000,22,8,0,0,16110000
Tổng cộng,,,,,,154000000,3975000,134260000`,
                    });
                  }}
                  className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition"
                >
                  📊 Excel Mẫu
                </button>
              </div>
              <span className="shrink-0">{inputMessage.length}/500</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
