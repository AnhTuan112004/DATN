import React, { useState, useEffect } from 'react';
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
  MapPin,
  Users,
  AlertTriangle,
  Briefcase,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
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
  borderColor: string;
  textColor: string;
  createdAt: string;
}

const myDemoRequests: MyLeaveRequest[] = [
  {
    id: 'my_req_1',
    type: 'Nghỉ phép năm',
    duration: '1 ngày (30/10/2026)',
    status: 'PENDING_MANAGER',
    statusLabel: 'Chờ Quản lý duyệt',
    borderColor: 'border-l-amber-400',
    textColor: 'text-amber-400',
    createdAt: 'Hôm qua lúc 15:30',
  },
  {
    id: 'my_req_2',
    type: 'Làm thêm giờ (OT)',
    duration: '3.0 giờ (Dự án Sprint 4)',
    status: 'APPROVED',
    statusLabel: 'Đã phê duyệt',
    borderColor: 'border-l-emerald-400',
    textColor: 'text-emerald-400',
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
  { day: 'T2', hours: 8.0, status: 'ok' },
  { day: 'T3', hours: 8.5, status: 'ot' },
  { day: 'T4', hours: 8.0, status: 'ok' },
  { day: 'T5', hours: 8.2, status: 'ok' },
  { day: 'T6', hours: 8.0, status: 'ok' },
  { day: 'T7', hours: 0, status: 'off' },
  { day: 'CN', hours: 0, status: 'off' },
];

// Màu bar theo giá trị giờ công
const getBarColor = (status: string) => {
  if (status === 'ot') return '#10b981'; // emerald - vượt giờ
  if (status === 'ok') return '#6366f1'; // indigo - đủ giờ
  return '#1e293b'; // slate - nghỉ
};

const companyActivities = [
  {
    id: 'act_1',
    user: 'Nguyễn Văn An',
    action: 'Chấm công đúng giờ (08:24)',
    method: 'Kiosk FaceID • Keangnam 72',
    time: '15 phút trước',
    dot: 'bg-emerald-400',
  },
  {
    id: 'act_2',
    user: 'Trần Mai Anh',
    action: 'Nộp đơn xin nghỉ phép năm 2 ngày',
    method: 'Đơn từ trực tuyến',
    time: '2 giờ trước',
    dot: 'bg-amber-400',
  },
  {
    id: 'act_3',
    user: 'Đỗ Hoàng Long',
    action: 'Chấm công GPS hợp lệ (08:12)',
    method: 'GPS Geofencing Mobile',
    time: '3 giờ trước',
    dot: 'bg-emerald-400',
  },
];

const personalActivities = [
  {
    id: 'pact_1',
    action: 'Chấm công vào ca hôm nay (08:24)',
    detail: 'Đúng giờ · Thiết bị Kiosk FaceID',
    time: 'Sáng nay',
    dot: 'bg-emerald-400',
  },
  {
    id: 'pact_2',
    action: 'Đã gửi đơn xin nghỉ phép 1 ngày (30/10)',
    detail: 'Đang chờ Quản lý trực tiếp xem xét',
    time: 'Hôm qua',
    dot: 'bg-amber-400',
  },
  {
    id: 'pact_3',
    action: 'Chấm công tan ca ngày 26/10 (17:35)',
    detail: 'Đúng giờ · 8.0 giờ công tiêu chuẩn',
    time: '26/10',
    dot: 'bg-slate-500',
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'CEO' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER';

  const [tasks, setTasks] = useState<PendingTask[]>(initialManagementTasks);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Sáng';
    if (hour < 18) return 'Chiều';
    return 'Tối';
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fadeIn">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-2xl text-xs font-medium text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER — Asymmetric, không box gradient, text-dominant
          ═══════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-1 border-b border-slate-800">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
            {formatDate()}
          </p>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-white leading-tight">
            Chào buổi {getGreeting()},{' '}
            <span className="text-teal-400">{user?.fullName?.split(' ').slice(-1)[0] || 'bạn'}</span>
          </h1>
          <p className="text-sm text-slate-400">
            {isManager
              ? 'Tổng quan hoạt động nhân sự & phê duyệt hôm nay'
              : 'Chấm công, phép năm & phiếu lương của bạn'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/leave-requests')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Tạo đơn từ
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 transition-all active:scale-[0.98]"
          >
            <Clock className="w-3.5 h-3.5" />
            Chấm công
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          BENTO KPI — layout không đều, kích thước phân tầng
          ═══════════════════════════════════════════════════════════════ */}
      {isManager ? (
        /* ── Manager view: 3 cột bất đối xứng ── */
        <section className="grid grid-cols-12 gap-4">
          {/* KPI lớn: Tổng nhân sự */}
          <div className="col-span-12 sm:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[130px] hover:border-teal-800/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Nhân sự đang hoạt động</span>
              <div className="w-7 h-7 rounded-lg bg-teal-900/50 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-bold text-white tracking-tight mt-3">50</p>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">+2 người so với tháng trước</span>
              </div>
            </div>
          </div>

          {/* Chấm công hôm nay */}
          <div className="col-span-12 sm:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-800/60 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Chấm công hôm nay</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">96% có mặt</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white tracking-tight">48</p>
              <span className="text-sm text-slate-400 pb-0.5">/ 50 người</span>
            </div>
            {/* Progress bar minimal */}
            <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[96%] bg-indigo-500 rounded-full" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
              <span>· 47 đúng giờ</span>
              <span>· 1 đi muộn</span>
              <span>· 2 nghỉ phép</span>
            </div>
          </div>

          {/* Đơn chờ duyệt */}
          <div className={`col-span-6 sm:col-span-3 rounded-2xl p-5 flex flex-col justify-between border transition-colors ${
            tasks.length > 0
              ? 'bg-amber-950/30 border-amber-800/40 hover:border-amber-600/50'
              : 'bg-slate-900 border-slate-800 hover:border-emerald-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Chờ phê duyệt</span>
              {tasks.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <p className={`text-4xl font-bold tracking-tight mt-3 ${tasks.length > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                {tasks.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tasks.length > 0 ? 'đơn cần xử lý' : 'Đã duyệt hết'}
              </p>
            </div>
          </div>

          {/* Lương kỳ này */}
          <div className="col-span-6 sm:col-span-12 lg:col-span-12 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-900/50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Bảng lương Tháng 11/2026</p>
                <p className="text-xs text-slate-400">Biểu thuế 5 bậc 2026 · OT miễn thuế theo Điều 98 BLLĐ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                Đang mở kỳ
              </span>
              <button
                onClick={() => navigate('/payroll')}
                className="text-slate-400 hover:text-white transition"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* ── Employee view: 2 hàng — hàng trên 3 ô, hàng dưới 2 ô ── */
        <section className="grid grid-cols-12 gap-4">
          {/* Checkin time — phần tử DOMINANT */}
          <div className="col-span-12 sm:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-800/60 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Vào ca hôm nay
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Đúng giờ</span>
            </div>
            <p className="text-5xl font-bold text-white tracking-tight font-mono mt-1">08:24</p>
            <p className="text-xs text-slate-500 mt-2">Ca hành chính: 08:30 – 17:30 · Ân hạn đến 08:45</p>
          </div>

          {/* Phép năm */}
          <div className="col-span-6 sm:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-800/60 transition-colors">
            <span className="text-xs font-medium text-slate-400 block mb-3">Phép năm còn lại</span>
            <p className="text-4xl font-bold text-indigo-300 tracking-tight">
              {user?.leaveBalance?.annualRemaining ?? 10}
            </p>
            <p className="text-xs text-slate-500 mt-1">ngày</p>
            <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${((user?.leaveBalance?.annualRemaining ?? 10) / (user?.leaveBalance?.annualTotal ?? 12)) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Đã dùng {user?.leaveBalance?.annualUsed ?? 2} / {user?.leaveBalance?.annualTotal ?? 12} ngày
            </p>
          </div>

          {/* Đơn từ */}
          <div className="col-span-6 sm:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-800/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Đơn từ của tôi</span>
              <span className="text-[10px] font-bold text-amber-400">
                {myDemoRequests.filter((r) => r.status.startsWith('PENDING')).length} đang chờ
              </span>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{myDemoRequests.length}</p>
            <p className="text-xs text-slate-500 mt-1">đơn đã gửi</p>
            <button
              onClick={() => navigate('/leave-requests')}
              className="mt-3 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              Xem chi tiết <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Lương */}
          <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Phiếu lương Tháng 11/2026 — Đang khóa kỳ</p>
                <p className="text-xs text-slate-400">Xem chi tiết thuế TNCN & BHXH theo chuẩn pháp lý 2026</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/payroll')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              Xem phiếu <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          KHỐI 2: 2 CỘT — Danh sách đơn từ + Biểu đồ
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* CỘT TRÁI (7) */}
        <div className="lg:col-span-7 space-y-5">
          {isManager ? (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Việc cần phê duyệt
                    {tasks.length > 0 && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">{tasks.length}</span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nghỉ phép, OT, giải trình chấm công cấp dưới</p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 transition"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {tasks.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
                    <p className="text-xs font-semibold text-white">Không còn đơn chờ duyệt</p>
                    <p className="text-[11px] text-slate-500">Đã hoàn tất xử lý mọi đơn từ trong ca hôm nay.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${task.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 mt-0.5`}>
                          {task.name.charAt(0)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-white">{task.name}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[11px] text-slate-400">{task.department}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                              {task.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{task.detail}</p>
                          <p className="text-[10px] text-slate-500">Gửi {task.timeAgo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleReject(task.id, task.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                        <button
                          onClick={() => handleApprove(task.id, task.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Duyệt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Đơn từ gần đây</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tiến độ phê duyệt nghỉ phép & OT</p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 transition"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {myDemoRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between gap-4 pl-4 pr-5 py-3.5 border-l-2 ${req.borderColor} hover:bg-slate-800/30 transition`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{req.type}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-300">{req.duration}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{req.createdAt}</p>
                    </div>
                    <span className={`text-[11px] font-semibold shrink-0 ${req.textColor}`}>
                      {req.statusLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Cần nghỉ phép hoặc giải trình công?</span>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition"
                >
                  <Send className="w-3 h-3" /> Gửi đơn mới
                </button>
              </div>
            </section>
          )}

          {/* Activity Timeline — left-dot timeline */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                {isManager ? 'Hoạt động toàn doanh nghiệp' : 'Lịch sử hoạt động của tôi'}
              </h2>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="space-y-0 relative">
              {/* vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />
              {(isManager ? companyActivities : personalActivities).map((act: any) => (
                <div key={act.id} className="flex items-start gap-4 py-2.5 relative">
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 shrink-0 mt-0.5 z-10 ${act.dot}`} />
                  <div className="flex items-start justify-between gap-2 w-full min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-snug">
                        {isManager ? <><span className="text-white font-semibold">{act.user}</span> — {act.action}</> : act.action}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isManager ? act.method : act.detail}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0 font-mono whitespace-nowrap pt-0.5">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI (5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Chart */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-white">
                {isManager ? 'Chấm công 7 ngày qua' : 'Giờ công tuần này'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isManager ? 'Đúng giờ, đi muộn và nghỉ phép toàn công ty' : 'Giờ làm thực tế ghi nhận qua Kiosk & GPS'}
              </p>
            </div>

            {isManager && (
              <div className="flex items-center gap-4 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-sm bg-indigo-500" /> Đúng giờ
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-sm bg-amber-400" /> Đi muộn
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-sm bg-rose-400" /> Nghỉ phép
                </div>
              </div>
            )}

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {isManager ? (
                  <BarChart data={companyWeeklyAttendance} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} domain={[0, 55]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white mb-1">{label}</p>
                              <p className="text-indigo-400 flex justify-between gap-4"><span>Đúng giờ:</span><strong>{payload[0]?.value}</strong></p>
                              <p className="text-amber-400 flex justify-between gap-4"><span>Đi muộn:</span><strong>{payload[1]?.value}</strong></p>
                              <p className="text-rose-400 flex justify-between gap-4"><span>Nghỉ phép:</span><strong>{payload[2]?.value}</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="onTime" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="late" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="leave" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={22} />
                  </BarChart>
                ) : (
                  <BarChart data={personalWeeklyAttendance} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={8} stroke="#334155" strokeDasharray="4 4" label={{ value: '8h', position: 'right', fontSize: 9, fill: '#475569' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const h = Number(payload[0]?.value);
                          return (
                            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-xl text-xs">
                              <p className="font-bold text-white mb-1">{label}</p>
                              <p className={h > 8 ? 'text-emerald-400' : h > 0 ? 'text-indigo-400' : 'text-slate-500'}>
                                {h > 0 ? `${h} giờ làm việc` : 'Nghỉ'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="hours" radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {personalWeeklyAttendance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </section>

          {/* Thông tin ca làm việc */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-white">Ca làm việc hành chính</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/60 rounded-xl px-3 py-2.5">
                <p className="text-slate-500 text-[10px] mb-1">Giờ vào ca</p>
                <p className="font-mono font-bold text-white text-base">08:30</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl px-3 py-2.5">
                <p className="text-slate-500 text-[10px] mb-1">Giờ tan ca</p>
                <p className="font-mono font-bold text-white text-base">17:30</p>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              <MapPin className="w-3 h-3 inline mr-1 text-slate-600" />
              Keangnam Landmark 72, Hà Nội · Ân hạn trễ đến <span className="text-slate-300 font-medium">08:45</span> · WFH tối đa 2 ngày/tháng
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
