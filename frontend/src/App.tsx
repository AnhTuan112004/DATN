import React, { useState } from 'react';
import { SpikeFaceBench } from './features/face/SpikeFaceBench';
import { ShieldCheck, Cpu, Calculator, Bot, UserCheck, Video } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bench' | 'overview'>('bench');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            P
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-200">PeopleInsight AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">v6.1 FINAL FREEZE</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab('bench')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'bench'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Spike ① FaceID Bench
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Tổng Quan Kiến Trúc
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'bench' ? (
          <SpikeFaceBench />
        ) : (
          <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-3xl w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-6">
                <ShieldCheck className="w-4 h-4" /> v6.1 FINAL FREEZE
              </div>

              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent mb-4">
                Kiến Trúc Tổng Thể 4 Trụ Cột
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                Hệ thống Quản lý Nhân sự Doanh nghiệp Thông minh tích hợp Trí tuệ Nhân tạo
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3 text-emerald-400 font-semibold mb-1 text-sm">
                    <UserCheck className="w-5 h-5" /> FaceID Kiosk 2 Tầng
                  </div>
                  <p className="text-xs text-slate-400">MediaPipe Liveness Blendshapes + Face Embedding so khớp an toàn phía Server.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3 text-amber-400 font-semibold mb-1 text-sm">
                    <Calculator className="w-5 h-5" /> Payroll Engine 2026
                  </div>
                  <p className="text-xs text-slate-400">Thuế 5 bậc mới, 2 mốc chính sách 2026, đối chiếu khớp 22 test case Excel.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3 text-cyan-400 font-semibold mb-1 text-sm">
                    <Bot className="w-5 h-5" /> Chatbot HR (Phương án A)
                  </div>
                  <p className="text-xs text-slate-400">Gemini 3.x Function Calling + Render template tĩnh, bảo mật tuyệt đối dữ liệu lương.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3 text-purple-400 font-semibold mb-1 text-sm">
                    <Cpu className="w-5 h-5" /> ML Dự Báo Nghỉ Việc
                  </div>
                  <p className="text-xs text-slate-400">Huấn luyện 6 đặc trưng định lượng từ IBM Attrition, minh bạch Feature Importance.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500">
                11 Collections chuẩn • Bảo mật RBAC 4 cấp • Tuân thủ Luật BVDLCN 91/2025/QH15
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
