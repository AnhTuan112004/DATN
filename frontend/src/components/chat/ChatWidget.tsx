import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  Clock,
  Cpu,
  FileText,
  FileSpreadsheet,
  Plus,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Sparkles,
  History,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendChatMessage, analyzeDocumentApi, ChatMessage } from '../../api/ai';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  activeDocumentContext?: { fileName: string; content: string } | null;
}

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();

  // 1. Quản lý trạng thái mở/đóng và toàn màn hình (SessionStorage)
  const [isOpen, setIsOpenState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pi_chat_widget_open') === 'true';
    }
    return false;
  });

  const setIsOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsOpenState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pi_chat_widget_open', next ? 'true' : 'false');
      }
      return next;
    });
  };

  const [isFullscreen, setIsFullscreenState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pi_chat_fullscreen') === 'true';
    }
    return false;
  });

  const setIsFullscreen = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsFullscreenState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pi_chat_fullscreen', next ? 'true' : 'false');
      }
      return next;
    });
  };

  // Drawer danh sách phiên ở chế độ Widget nổi
  const [isSidebarOpenInWidget, setIsSidebarOpenInWidget] = useState(false);

  // 2. Bộ chọn mô hình AI
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pi_chat_selected_model');
      if (saved === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
    }
    return 'gemini-3.5-flash';
  });

  const handleModelChange = (model: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite') => {
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pi_chat_selected_model', model);
    }
  };

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 3. Nhận diện giọng nói tiếng Việt (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn vui lòng sử dụng Google Chrome hoặc Microsoft Edge để nói qua micro.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Lỗi khi kích hoạt micro:', err);
      setIsListening(false);
    }
  };

  // State hỗ trợ Đọc & Phân Tích Hợp Đồng / File DOCX/XLSX
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [sampleDoc, setSampleDoc] = useState<{ fileName: string; content: string } | null>(null);

  const [activeDocumentContext, setActiveDocumentContextState] = useState<{ fileName: string; content: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDoc = sessionStorage.getItem('pi_chat_active_doc');
        if (savedDoc) return JSON.parse(savedDoc);
      } catch (e) {
        console.warn('Lỗi đọc tài liệu active:', e);
      }
    }
    return null;
  });

  const setActiveDocumentContext = (doc: { fileName: string; content: string } | null) => {
    setActiveDocumentContextState(doc);
    if (typeof window !== 'undefined') {
      if (doc) {
        try {
          sessionStorage.setItem('pi_chat_active_doc', JSON.stringify(doc));
        } catch {}
      } else {
        sessionStorage.removeItem('pi_chat_active_doc');
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Định danh người dùng
  const currentUserId = (user as any)?._id || (user as any)?.id || (user as any)?.employeeCode || (user as any)?.email;
  const sessionsStorageKey = currentUserId ? `pi_chat_sessions_${currentUserId}` : 'pi_chat_sessions_guest';

  const getWelcomeMessage = (userName?: string): ChatMessage => ({
    id: 'msg-welcome',
    sender: 'assistant',
    text: `Chào **${userName || 'bạn'}**! Tôi là **Trợ Lý Nhân Sự AI** được tích hợp mô hình ${selectedModel === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash-Lite' : 'Gemini 3.5 Flash'}.

* **Tra cứu thông tin nội bộ:** Hỏi số dư phép năm, phiếu lương, tóm tắt chấm công.
* **Đọc & Thẩm định tài liệu:** Bấm biểu tượng 📎 hoặc dấu **+** để nạp file Word (\`.docx\`) hoặc Excel (\`.xlsx\`) — bạn có thể hỏi bất kỳ câu hỏi nào về file!`,
    timestamp: new Date(),
    tool: 'system_welcome',
    usedModel: selectedModel,
  });

  // 4. Quản lý danh sách các phiên trò chuyện (Multi-thread sessions)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(sessionsStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((s: any) => ({
              ...s,
              messages: (s.messages || []).map((m: any) => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              })),
            }));
          }
        }
        // Di trú lịch sử cũ nếu có
        const legacyKey = currentUserId ? `pi_chat_history_${currentUserId}` : null;
        if (legacyKey) {
          const legacySaved = localStorage.getItem(legacyKey);
          if (legacySaved) {
            const legacyParsed = JSON.parse(legacySaved);
            if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
              return [
                {
                  id: `session-migrated-${Date.now()}`,
                  title: 'Hội thoại gần đây',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  messages: legacyParsed.map((m: any) => ({
                    ...m,
                    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                  })),
                },
              ];
            }
          }
        }
      } catch (e) {
        console.warn('Lỗi đọc sessions từ localStorage:', e);
      }
    }
    return [
      {
        id: `session-${Date.now()}`,
        title: 'Cuộc trò chuyện mới',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [getWelcomeMessage(user?.fullName)],
      },
    ];
  });

  // Phiên đang chọn
  const [currentSessionId, setCurrentSessionIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('pi_chat_active_session_id');
      if (savedId) return savedId;
    }
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  const setCurrentSessionId = (id: string) => {
    setCurrentSessionIdState(id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pi_chat_active_session_id', id);
    }
  };

  // Tự động lưu sessions vào localStorage khi có thay đổi
  useEffect(() => {
    if (!sessionsStorageKey || sessions.length === 0) return;
    try {
      localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Lỗi lưu sessions vào localStorage:', e);
    }
  }, [sessions, sessionsStorageKey]);

  // Session hiện tại
  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0] || {
    id: `session-${Date.now()}`,
    title: 'Cuộc trò chuyện mới',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [getWelcomeMessage(user?.fullName)],
  };

  const messages = activeSession.messages || [];

  // Tạo cuộc trò chuyện mới
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [getWelcomeMessage(user?.fullName)],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedDocFile(null);
    setSampleDoc(null);
    setActiveDocumentContext(null);
    setInputMessage('');
    setIsSidebarOpenInWidget(false);
  };

  // Xóa một phiên trò chuyện
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      if (window.confirm('Khởi động lại cuộc trò chuyện mới?')) {
        handleNewChat();
      }
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này không?')) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Cập nhật tin nhắn trong phiên hiện tại
  const updateActiveSessionMessages = (
    updater: (prevMsgs: ChatMessage[]) => ChatMessage[],
    userPrompt?: string
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === activeSession.id) {
          const updatedMsgs = updater(session.messages || []);
          let newTitle = session.title;
          if (
            userPrompt &&
            (!session.title || session.title === 'Cuộc trò chuyện mới' || session.title === 'Hội thoại gần đây')
          ) {
            newTitle = userPrompt.slice(0, 32).trim() + (userPrompt.length > 32 ? '...' : '');
          }
          return {
            ...session,
            title: newTitle,
            updatedAt: Date.now(),
            messages: updatedMsgs.slice(-50),
          };
        }
        return session;
      })
    );
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages.length, currentSessionId]);

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

    updateActiveSessionMessages((prev) => [...prev, newUserMsg], rawText);
    setInputMessage('');
    setIsLoading(true);

    const docFileToUpload = selectedDocFile;
    const sampleDocToUse = sampleDoc;
    setSelectedDocFile(null);
    setSampleDoc(null);

    try {
      let responseMarkdown = '';
      let toolName = 'system_chat';
      let modelName: string = selectedModel;
      let latency = 0;

      if (docFileToUpload) {
        const formData = new FormData();
        formData.append('file', docFileToUpload);
        if (rawText) formData.append('question', rawText);
        const startTime = Date.now();
        const resData = await analyzeDocumentApi(formData);
        latency = Date.now() - startTime;
        responseMarkdown = resData?.markdown || 'Không nhận được kết quả phân tích.';
        toolName = 'document_analyzer';
        modelName = resData?.usedModel || selectedModel;
        if (resData?.extractedText) {
          setActiveDocumentContext({
            fileName: resData.fileName,
            content: resData.extractedText,
          });
        }
      } else if (sampleDocToUse) {
        const startTime = Date.now();
        const resData = await analyzeDocumentApi({
          content: sampleDocToUse.content,
          fileName: sampleDocToUse.fileName,
          question: rawText || undefined,
        });
        latency = Date.now() - startTime;
        responseMarkdown = resData?.markdown || 'Không nhận được kết quả phân tích.';
        toolName = 'document_analyzer';
        modelName = resData?.usedModel || selectedModel;
        if (resData?.extractedText) {
          setActiveDocumentContext({
            fileName: resData.fileName,
            content: resData.extractedText,
          });
        }
      } else if (activeDocumentContext) {
        const startTime = Date.now();
        const resData = await analyzeDocumentApi({
          content: activeDocumentContext.content,
          fileName: activeDocumentContext.fileName,
          question: rawText,
        });
        latency = Date.now() - startTime;
        responseMarkdown = resData?.markdown || 'Không nhận được kết quả trả lời.';
        toolName = 'document_qa';
        modelName = resData?.usedModel || selectedModel;
      } else {
        const recentHistory = messages.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        }));
        const response = await sendChatMessage(rawText, recentHistory, selectedModel);
        responseMarkdown = response.markdown;
        toolName = response.tool;
        modelName = response.usedModel || selectedModel;
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

      updateActiveSessionMessages((prev) => [...prev, newAiMsg]);
    } catch (err: any) {
      console.error('Lỗi khi trò chuyện với AI:', err);
      const errorMsgId = `err-${Date.now()}`;
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Không thể kết nối đến máy chủ AI hoặc đã vượt quá hạn mức yêu cầu. Vui lòng thử lại sau giây lát.';

      updateActiveSessionMessages((prev) => [
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render Sidebar các phiên hội thoại (Dùng chung cho cả Fullscreen và Widget Drawer)
  const renderSessionsSidebar = (isFull: boolean) => (
    <div className={`flex flex-col h-full ${isFull ? 'w-72 bg-[#0d1322] border-r border-slate-800' : 'w-full bg-[var(--surface)]'}`}>
      {/* Nút Tạo Phiên Mới */}
      <div className="p-3.5 border-b border-slate-800/80">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* Danh Sách Các Phiên Đã Lưu */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-3 h-3 text-indigo-400" />
          <span>Lịch sử trò chuyện ({sessions.length})</span>
        </div>

        {sessions.map((s) => {
          const isActive = s.id === currentSessionId;
          return (
            <div
              key={s.id}
              onClick={() => {
                setCurrentSessionId(s.id);
                setIsSidebarOpenInWidget(false);
              }}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{s.title || 'Cuộc trò chuyện mới'}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleDeleteSession(s.id, e)}
                title="Xóa phiên này"
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Profile ở đáy sidebar (theo phong cách Gemini trong ảnh) */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            {(user?.fullName || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Nguyễn Anh Tuấn'}</div>
            <div className="text-[10px] text-indigo-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{user?.role === 'CEO' ? 'Ban Giám Đốc' : user?.role === 'HR_MANAGER' ? 'Trưởng phòng HR' : 'Nhân sự Pro'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Nút mở trợ lý thu nhỏ góc phải màn hình */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Mở trợ lý nhân sự AI"
            className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all group border border-white/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs font-semibold">Trợ lý HR AI</span>
          </button>
        </div>
      )}

      {/* Cửa Sổ Hộp Thoại Chat: Hỗ Trợ 2 Chế Độ (Toàn Màn Hình Gemini & Widget Nổi) */}
      {isOpen && (
        <div
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 bg-[#090d16] text-slate-100 flex overflow-hidden animate-fadeIn'
              : 'fixed bottom-16 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] h-[640px] max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn'
          }
        >
          {/* TOÀN MÀN HÌNH: CỘT SIDEBAR BÊN TRÁI Y HỆT GOOGLE GEMINI */}
          {isFullscreen && renderSessionsSidebar(true)}

          {/* KHUNG CHAT CHÍNH (CENTER / MAIN CHAT VIEW) */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#0d1322]">
            {/* Thanh tiêu đề Header */}
            <div className="px-4 py-3 bg-[#0d1322]/90 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Nút bật/tắt Drawer lịch sử ở chế độ Widget nhỏ */}
                {!isFullscreen && (
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpenInWidget(!isSidebarOpenInWidget)}
                    title="Danh sách cuộc trò chuyện"
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                      isSidebarOpenInWidget
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Lịch sử</span>
                  </button>
                )}

                {/* Bộ Chọn Mô Hình AI (Model Selector phong cách Gemini) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleModelChange('gemini-3.5-flash')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition ${
                      selectedModel === 'gemini-3.5-flash'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Gemini 3.5 Flash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModelChange('gemini-3.1-flash-lite')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition ${
                      selectedModel === 'gemini-3.1-flash-lite'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-3 h-3 text-sky-300" />
                    <span>Flash-Lite</span>
                  </button>
                </div>
              </div>

              {/* Các nút hành động Header */}
              <div className="flex items-center gap-1.5 text-slate-400">
                {/* Nút Tạo Chat Mới */}
                <button
                  type="button"
                  onClick={handleNewChat}
                  title="Cuộc trò chuyện mới"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Nút Phóng to / Thu nhỏ Toàn Màn Hình */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Thu nhỏ về góc màn hình' : 'Phóng to toàn màn hình Gemini'}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition text-indigo-400"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Nút Đóng */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Đóng khung chat"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition text-slate-400 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chế độ Widget nhỏ: Drawer danh sách phiên đè lên khi bật */}
            {!isFullscreen && isSidebarOpenInWidget && (
              <div className="absolute inset-0 top-[53px] z-30 bg-[#0d1322] animate-fadeIn">
                {renderSessionsSidebar(false)}
              </div>
            )}

            {/* Thân cửa sổ: Danh sách tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#090d16]">
              {/* Hero Mở Đầu: Hiển thị khi phiên mới bắt đầu (theo phong cách Gemini "Chúng ta nên bắt đầu từ đâu?") */}
              {messages.length <= 1 && (
                <div className="max-w-2xl mx-auto my-auto py-8 text-center space-y-4 animate-fadeIn">
                  <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 mb-2 shadow-inner">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-xl sm:text-3xl font-semibold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                    Chúng ta nên bắt đầu từ đâu?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                    Hỏi bất kỳ điều gì về phiếu lương, ngày phép, quy định làm thêm giờ OT hoặc đính kèm hợp đồng để AI phân tích.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 text-left max-w-xl mx-auto">
                    {quickPrompts.slice(0, 4).map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.text)}
                        className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs flex items-center justify-between group transition-all shadow-sm"
                      >
                        <span className="font-medium truncate">{p.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Các tin nhắn đã trao đổi */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-4xl mx-auto ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[#131b2e] border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <div>
                        {msg.attachment && (
                          <div className="mb-2.5 p-2 rounded-xl bg-blue-700/80 border border-blue-400/30 flex items-center gap-2">
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
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ) : (
                      <div>
                        <MarkdownRenderer content={msg.text} />

                        {/* Meta thông số phản hồi */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 gap-2">
                          <div className="flex items-center gap-2 flex-wrap font-mono">
                            {msg.tool && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
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
                            title="Sao chép nội dung"
                            className="hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start items-center max-w-4xl mx-auto">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#131b2e] border border-slate-800 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs flex items-center gap-2.5 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>{selectedModel === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash-Lite' : 'Gemini 3.5 Flash'} đang xử lý...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER: HỘP NHẬP LIỆU PHONG CÁCH GOOGLE GEMINI (PILL CONTAINER) */}
            <div className="p-3 sm:p-5 bg-[#0d1322] border-t border-slate-800 shrink-0">
              <div className="max-w-4xl mx-auto">
                {/* Ẩn file input */}
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

                {/* Banner: Đang hỏi đáp theo ngữ cảnh file */}
                {activeDocumentContext && !selectedDocFile && !sampleDoc && (
                  <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-between text-xs text-indigo-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">Ngữ cảnh tài liệu: <b>{activeDocumentContext.fileName}</b></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDocumentContext(null)}
                      className="px-2 py-0.5 rounded-lg bg-indigo-900/80 hover:bg-rose-950 text-indigo-200 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition shrink-0 ml-2"
                    >
                      <span>Thoát file</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Banner: Tệp đính kèm chờ gửi */}
                {(selectedDocFile || sampleDoc) && (
                  <div className="mb-2.5 p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
                        {(selectedDocFile?.name || sampleDoc?.fileName || '').match(/\.(xlsx|xls|csv)$/i) ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {selectedDocFile?.name || sampleDoc?.fileName}
                        </div>
                        <div className="text-[10px] text-indigo-400">
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
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Thanh Input phong cách Gemini */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="rounded-2xl bg-[#131b2e] border border-slate-700/80 focus-within:border-indigo-500 shadow-2xl p-2 sm:p-2.5 flex items-center gap-2 transition-all"
                >
                  {/* Nút + Đính kèm */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Đính kèm file Word (.docx) hoặc Excel (.xlsx)"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Nút Micro Nhận Diện Giọng Nói */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? 'Đang lắng nghe... bấm để dừng' : 'Nói tiếng Việt qua Micro'}
                    className={`p-2 rounded-xl transition shrink-0 ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Ô nhập văn bản */}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={
                      isListening
                        ? 'Đang lắng nghe bạn nói tiếng Việt...'
                        : selectedDocFile || sampleDoc
                        ? 'Hỏi về tài liệu (hoặc bấm gửi để AI tóm tắt)...'
                        : activeDocumentContext
                        ? `Hỏi bất kỳ điều gì về ${activeDocumentContext.fileName}...`
                        : 'Hỏi Gemini về nhân sự, tiền lương, chính sách...'
                    }
                    value={inputMessage}
                    maxLength={500}
                    disabled={isLoading}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 text-xs sm:text-sm bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50 px-1"
                  />

                  {/* Nút Gửi */}
                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && !selectedDocFile && !sampleDoc) || isLoading}
                    className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>

                {/* Thanh chip gợi ý tài liệu mẫu & độ dài */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-2">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-slate-400 font-medium">Mẫu nhanh:</span>
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
                      className="px-2.5 py-0.5 rounded-full bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/80 transition"
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
                      className="px-2.5 py-0.5 rounded-full bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 transition"
                    >
                      📊 Excel Mẫu
                    </button>
                  </div>
                  <span className="font-mono">{inputMessage.length}/500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
