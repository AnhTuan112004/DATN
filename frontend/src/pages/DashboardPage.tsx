import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Activity,
  Send,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

interface PendingTask {
  id: string;
  name: string;
  role: string;
  department: string;
  type: string;
  detail: string;
  timeAgo: string;
  avatarColor: string;
}

const initialManagementTasks: PendingTask[] = [
  {
    id: 'req_1',
    name: 'Trần Mai Anh',
    role: 'Nhân viên kinh doanh',
    department: 'Kinh doanh',
    type: 'Nghỉ phép năm',
    detail: 'Xin nghỉ phép 2 ngày (28/10 - 29/10) giải quyết việc gia đình',
    timeAgo: '2 giờ trước',
    avatarColor: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  },
  {
    id: 'req_2',
    name: 'Lê Hoàng Long',
    role: 'Kỹ sư phần mềm',
    department: 'Công nghệ',
    type: 'Giải trình quên công',
    detail: 'Quên chấm công ca chiều ngày 26/10 do họp trực tuyến với đối tác',
    timeAgo: '4 giờ trước',
    avatarColor: 'bg-sky-600/20 text-sky-400 border border-sky-500/30',
  },
  {
    id: 'req_3',
    name: 'Nguyễn Thu Hà',
    role: 'Chuyên viên tuyển dụng',
    department: 'Nhân sự',
    type: 'Làm thêm giờ (OT)',
    detail: 'Làm thêm 3.5 giờ hoàn thiện hồ sơ ứng viên quý 4',
    timeAgo: 'Hôm qua',
    avatarColor: 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30',
  },
];

interface MyLeaveRequest {
  id: string;
  type: string;
  duration: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED';
  statusLabel: string;
  statusClass: string;
  createdAt: string;
}

const myDemoRequests: MyLeaveRequest[] = [
  {
    id: 'my_req_1',
    type: 'Nghỉ phép năm',
    duration: '1 ngày (30/10/2026)',
    status: 'PENDING_MANAGER',
    statusLabel: 'Chờ Quản lý duyệt',
    statusClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    createdAt: 'Hôm qua lúc 15:30',
  },
  {
    id: 'my_req_2',
    type: 'Làm thêm giờ (OT)',
    duration: '3.0 giờ (Dự án Sprint 4)',
    status: 'APPROVED',
    statusLabel: 'Đã phê duyệt',
    statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    createdAt: '22/10/2026',
  },
];

const companyWeeklyAttendance = [
  { day: 'T2', onTime: 47, late: 2, leave: 1 },
  { day: 'T3', onTime: 48, late: 1, leave: 1 },
  { day: 'T4', onTime: 46, late: 3, leave: 1 },
  { day: 'T5', onTime: 49, late: 0, leave: 1 },
  { day: 'T6', onTime: 45, late: 3, leave: 2 },
  { day: 'T7', onTime: 20, late: 1, leave: 0 },
  { day: 'CN', onTime: 12, late: 0, leave: 0 },
];

const personalWeeklyAttendance = [
  { day: 'T2', hours: 8.0, status: 'Đúng giờ' },
  { day: 'T3', hours: 8.5, status: 'Đúng giờ' },
  { day: 'T4', hours: 8.0, status: 'Đúng giờ' },
  { day: 'T5', hours: 8.2, status: 'Đúng giờ' },
  { day: 'T6', hours: 8.0, status: 'Đúng giờ' },
  { day: 'T7', hours: 0, status: 'Nghỉ cuối tuần' },
  { day: 'CN', hours: 0, status: 'Nghỉ cuối tuần' },
];

const companyActivities = [
  {
    id: 'act_1',
    user: 'Nguyễn Văn An',
    action: 'Chấm công đúng giờ (08:24)',
    method: 'Kiosk FaceID • Keangnam 72',
    time: '15 phút trước',
  },
  {
    id: 'act_2',
    user: 'Trần Mai Anh',
    action: 'Nộp đơn xin nghỉ phép năm 2 ngày',
    method: 'Đơn từ trực tuyến',
    time: '2 giờ trước',
  },
  {
    id: 'act_3',
    user: 'Đỗ Hoàng Long',
    action: 'Chấm công GPS hợp lệ (08:12)',
    method: 'GPS Geofencing Mobile',
    time: '3 giờ trước',
  },
];

const personalActivities = [
  {
    id: 'pact_1',
    action: 'Chấm công vào ca hôm nay (08:24)',
    detail: 'Đúng giờ · Thiết bị Kiosk FaceID',
    time: 'Sáng nay',
  },
  {
    id: 'pact_2',
    action: 'Đã gửi đơn xin nghỉ phép 1 ngày (30/10)',
    detail: 'Đang chờ Quản lý trực tiếp xem xét',
    time: 'Hôm qua',
  },
  {
    id: 'pact_3',
    action: 'Chấm công tan ca ngày 26/10 (17:35)',
    detail: 'Đúng giờ · 8.0 giờ công tiêu chuẩn',
    time: '26/10',
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === 'CEO' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER';

  const [tasks, setTasks] = useState<PendingTask[]>(initialManagementTasks);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApprove = (id: string, name: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Đã phê duyệt thành công yêu cầu của ${name}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReject = (id: string, name: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Đã từ chối yêu cầu của ${name}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lời chào cá nhân hóa theo thời gian thực
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl text-xs font-medium text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER: LỜI CHÀO SỐNG ĐỘNG & HÀNH ĐỘNG NHANH */}
      <header className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-950 via-[#0e162b] to-indigo-950 border border-indigo-900/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="space-y-2 relative">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isManager ? 'Trung tâm điều hành doanh nghiệp' : 'Không gian làm việc cá nhân'}</span>
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Keangnam Landmark 72</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{user?.fullName || 'bạn'}</span>!
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {isManager
              ? 'Hệ thống đã tổng hợp toàn bộ dữ liệu chấm công, bảng lương và yêu cầu phê duyệt mới nhất của công ty.'
              : 'Theo dõi tiến độ chấm công, số dư phép năm và phiếu lương chính thức theo chuẩn pháp lý 2026.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative">
          <button
            onClick={() => navigate('/leave-requests')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all active:scale-[0.98]"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Tạo đơn từ</span>
          </button>

          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Clock className="w-4 h-4" />
            <span>Chấm công hôm nay</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          KHỐI 1: 4 THẺ BENTO KPI HIỆN ĐẠI (PHÂN BIỆT THEO VAI TRÒ)
          ========================================================================= */}
      {isManager ? (
        // A. Thẻ Quản lý & HR
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Tổng số nhân sự</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2 tháng này
              </span>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">50</p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>100% hợp đồng chính thức</span>
              <span className="text-indigo-400 font-medium">3 phòng ban</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Chấm công hôm nay</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold">
                96% có mặt
              </span>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              48 <span className="text-sm font-normal text-slate-400">/ 50 người</span>
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[96%] rounded-full"></div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Đơn từ chờ phê duyệt</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                tasks.length > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {tasks.length} đơn cần xử lý
              </span>
            </div>
            <p className="text-3xl font-extrabold text-amber-400 tracking-tight">{tasks.length}</p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              {tasks.length > 0 ? 'Cần duyệt trong ca làm việc' : 'Đã duyệt hết toàn bộ đơn'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Bảng lương Tháng 11/2026</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-semibold">
                Chuẩn 2026
              </span>
            </div>
            <p className="text-xl font-bold text-white tracking-tight mt-1">Đang mở kỳ</p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
              <span>Biểu lũy tiến 5 bậc</span>
              <span className="text-emerald-400 font-medium">OT miễn thuế</span>
            </div>
          </div>
        </section>
      ) : (
        // B. Thẻ Nhân viên cá nhân
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Chấm công hôm nay</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                Đã vào ca
              </span>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">08:24</p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              Ca hành chính: 08:30 – 17:30
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Số dư phép năm</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-semibold">
                Còn lại
              </span>
            </div>
            <p className="text-3xl font-extrabold text-indigo-400 tracking-tight">
              {user?.leaveBalance?.annualRemaining ?? 10} <span className="text-sm font-normal text-slate-400">ngày</span>
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              Đã dùng: {user?.leaveBalance?.annualUsed ?? 2} / {user?.leaveBalance?.annualTotal ?? 12} ngày
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Đơn từ của tôi</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">
                {myDemoRequests.filter((r) => r.status.startsWith('PENDING')).length} đang chờ
              </span>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{myDemoRequests.length}</p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              Đơn nghỉ phép &amp; làm thêm giờ OT
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Phiếu lương Tháng 11</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                Đã cập nhật
              </span>
            </div>
            <p className="text-xl font-bold text-white tracking-tight mt-1">Đang khóa kỳ</p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              Xem chi tiết thuế TNCN &amp; BHXH
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          KHỐI 2: 2 CỘT NỘI DUNG CHÍNH (BENTO SPLIT)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 CỘT): VIỆC CẦN LÀM & TIMELINE */}
        <div className="lg:col-span-7 space-y-6">
          {isManager ? (
            // Việc cần duyệt dành cho Quản lý
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Việc cần phê duyệt</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {tasks.length} đơn
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Đơn nghỉ phép, làm thêm giờ và giải trình chấm công của nhân sự cấp dưới.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80">
                {tasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="font-semibold text-white">Không còn đơn chờ duyệt</p>
                    <p className="text-[11px] text-slate-500">Bạn đã hoàn tất xử lý mọi đơn từ trong ca hôm nay.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${task.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 mt-0.5`}>
                          {task.name.charAt(0)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-white truncate">{task.name}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] text-slate-400">{task.department}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                              {task.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{task.detail}</p>
                          <p className="text-[10px] text-slate-500">Gửi {task.timeAgo}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 sm:self-center self-end">
                        <button
                          onClick={() => handleReject(task.id, task.name)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                        <button
                          onClick={() => handleApprove(task.id, task.name)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt nhanh</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            // Đơn từ cá nhân của Nhân viên
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Đơn từ gần đây của tôi</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tiến độ phê duyệt nghỉ phép năm, nghỉ ốm và làm thêm giờ OT.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80">
                {myDemoRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{req.type}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-300">{req.duration}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Gửi lúc: {req.createdAt}</p>
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${req.statusClass}`}>
                      {req.statusLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-400">Cần nghỉ phép hoặc giải trình chấm công?</span>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold border border-slate-700 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi đơn mới</span>
                </button>
              </div>
            </section>
          )}

          {/* Dòng Hoạt Động Thời Gian Thực (Activity Timeline) */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>{isManager ? 'Nhật ký hoạt động toàn doanh nghiệp' : 'Lịch sử hoạt động của tôi'}</span>
              </h2>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                LIVE
              </span>
            </div>

            <div className="space-y-3">
              {(isManager ? companyActivities : personalActivities).map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-slate-200 truncate">
                      {isManager ? `${act.user} — ${act.action}` : act.action}
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      {isManager ? act.method : act.detail}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI (5 CỘT): BIỂU ĐỒ CHẤM CÔNG & LỊCH LÀM VIỆC */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {isManager ? 'Thống kê chấm công 7 ngày' : 'Số giờ công tuần này'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isManager ? 'Tỷ lệ đúng giờ và đi muộn toàn công ty' : 'Số giờ làm việc thực tế ghi nhận qua Kiosk/GPS'}
                </p>
              </div>

              {isManager && (
                <div className="flex items-center gap-2.5 text-[10px]">
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Đúng giờ</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Đi muộn</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Phép</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {isManager ? (
                  <BarChart data={companyWeeklyAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis allowDecimals={false} domain={[0, 55]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white mb-1">Thứ {label}</p>
                              <p className="text-indigo-400 flex justify-between gap-4">
                                <span>Đúng giờ:</span>
                                <strong>{payload[0]?.value} người</strong>
                              </p>
                              <p className="text-amber-400 flex justify-between gap-4">
                                <span>Đi muộn:</span>
                                <strong>{payload[1]?.value} người</strong>
                              </p>
                              <p className="text-rose-400 flex justify-between gap-4">
                                <span>Nghỉ phép:</span>
                                <strong>{payload[2]?.value} người</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="onTime" name="Đúng giờ" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="late" name="Đi muộn" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="leave" name="Nghỉ phép" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <BarChart data={personalWeeklyAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis allowDecimals={false} domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white mb-1">Thứ {label}</p>
                              <p className="text-indigo-400 flex justify-between gap-4">
                                <span>Giờ làm việc:</span>
                                <strong>{payload[0]?.value} giờ</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="hours" name="Số giờ làm" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </section>

          {/* Quick Info & Địa điểm làm việc */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Calendar className="w-4 h-4" />
              <span>Lịch làm việc chuẩn: 08:30 – 17:30</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Trụ sở chính Keangnam Landmark 72 Hà Nội. Thời gian ân hạn tính đi muộn sau <b>08:45</b>. Hỗ trợ đăng ký làm việc từ xa (WFH) 2 ngày/tháng có phê duyệt của Trưởng bộ phận.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
