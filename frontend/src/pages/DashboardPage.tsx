import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  Check,
  X,
  ChevronRight,
  CheckCircle2,
  Activity,
  Send,
  AlertTriangle,
  Briefcase,
  ArrowUpRight,
  Zap,
  Lock,
  Unlock,
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
import { payrollApi } from '../api/payroll';

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
    avatarColor: 'bg-lime text-ink border border-ink',
  },
  {
    id: 'req_2',
    name: 'Lê Hoàng Long',
    role: 'Kỹ sư phần mềm',
    department: 'Công nghệ',
    type: 'Giải trình quên công',
    detail: 'Quên chấm công ca chiều ngày 26/10 do họp trực tuyến với đối tác',
    timeAgo: '4 giờ trước',
    avatarColor: 'bg-sky text-ink border border-ink',
  },
  {
    id: 'req_3',
    name: 'Nguyễn Thu Hà',
    role: 'Chuyên viên tuyển dụng',
    department: 'Nhân sự',
    type: 'Làm thêm giờ (OT)',
    detail: 'Làm thêm 3.5 giờ hoàn thiện hồ sơ ứng viên quý 4',
    timeAgo: 'Hôm qua',
    avatarColor: 'bg-lilac text-ink border border-ink',
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
    borderColor: 'border-l-amber-500',
    textColor: 'text-amber-700 font-bold',
    createdAt: 'Hôm qua lúc 15:30',
  },
  {
    id: 'my_req_2',
    type: 'Làm thêm giờ (OT)',
    duration: '3.0 giờ (Dự án Sprint 4)',
    status: 'APPROVED',
    statusLabel: 'Đã phê duyệt',
    borderColor: 'border-l-emerald-600',
    textColor: 'text-emerald-700 font-bold',
    createdAt: '22/10/2026',
  },
];

const companyWeeklyAttendance = [
  { day: 'T2', onTime: 47, late: 2, leave: 1 },
  { day: 'T3', onTime: 46, late: 3, leave: 1 },
  { day: 'T4', onTime: 48, late: 1, leave: 1 },
  { day: 'T5', onTime: 45, late: 3, leave: 2 },
  { day: 'T6', onTime: 47, late: 1, leave: 2 },
  { day: 'T7', onTime: 20, late: 1, leave: 0 },
  { day: 'CN', onTime: 0, late: 0, leave: 0 },
];

const personalWeeklyAttendance = [
  { day: 'T2', hours: 8.5 },
  { day: 'T3', hours: 8.0 },
  { day: 'T4', hours: 9.0 },
  { day: 'T5', hours: 8.0 },
  { day: 'T6', hours: 8.5 },
  { day: 'T7', hours: 0 },
  { day: 'CN', hours: 0 },
];

const companyActivities = [
  {
    id: 'act_1',
    user: 'Đỗ Quang Huy',
    action: 'Chấm công vào ca thành công',
    method: 'Kiosk FaceID • Keangnam 72',
    time: '08:24',
    dot: 'bg-emerald-500',
  },
  {
    id: 'act_2',
    user: 'Trần Mai Anh',
    action: 'Gửi đơn xin nghỉ phép năm (2 ngày)',
    method: 'Cần Quản lý trực tiếp phê duyệt',
    time: '08:15',
    dot: 'bg-amber-500',
  },
  {
    id: 'act_3',
    user: 'Vũ Thị Lan',
    action: 'Chấm công vào ca (Đi muộn 12 phút)',
    method: 'GPS Mobile • Geofencing 50m',
    time: '08:42',
    dot: 'bg-rose-500',
  },
  {
    id: 'act_4',
    user: 'Nguyễn Văn An (CEO)',
    action: 'Đã khóa bảng lương Kỳ Tháng 11/2026',
    method: 'Nguyên tử · Kiểm toán hệ thống',
    time: '06/11',
    dot: 'bg-cobalt',
  },
];

const personalActivities = [
  {
    id: 'pact_1',
    action: 'Điểm danh vào ca hôm nay lúc 08:24',
    detail: 'Thiết bị: Kiosk FaceID số 01 • Đúng giờ',
    time: '08:24',
    dot: 'bg-emerald-500',
  },
  {
    id: 'pact_2',
    action: 'Đơn làm thêm giờ (3.0h) đã được duyệt',
    detail: 'Người phê duyệt: Nguyễn Văn An (CEO)',
    time: '23/10',
    dot: 'bg-cobalt',
  },
  {
    id: 'pact_3',
    action: 'Chấm công tan ca thành công',
    detail: 'GPS Mobile App • 8.5 giờ làm việc',
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
  const [isPeriodLocked, setIsPeriodLocked] = useState<boolean>(true);
  const [lockedDate, setLockedDate] = useState<string>('06/11/2026');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Đồng bộ trạng thái khóa kỳ lương với CSDL
    payrollApi
      .getPeriodPayrolls('2026-11')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const locked = res.data.find((p) => p.periodLockedAt);
          if (locked && locked.periodLockedAt) {
            setIsPeriodLocked(true);
            setLockedDate(new Date(locked.periodLockedAt).toLocaleDateString('vi-VN'));
          } else {
            setIsPeriodLocked(false);
          }
        }
      })
      .catch(() => {});
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
    if (hour < 12) return 'sáng';
    if (hour < 18) return 'chiều';
    return 'tối';
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
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12 font-sans select-none">

      {/* Toast thông báo phong cách Giấy & Mực */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-lime border-2 border-ink shadow-hard text-xs font-bold text-ink animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-ink shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER — Neo-brutalist "Giấy & Mực", Text Dominant
          ═══════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b-2 border-ink">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-white border border-ink font-mono text-[11px] font-bold uppercase tracking-wider text-ink shadow-hard-sm">
              HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP
            </span>
            <span className="text-xs font-mono font-medium text-ink/70">
              · {formatDate()}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-ink leading-tight tracking-tight">
            Chào buổi {getGreeting()},{' '}
            <span className="underline decoration-lime decoration-8 underline-offset-4">
              {user?.fullName?.split(' ').slice(-1)[0] || 'bạn'}
            </span>!
          </h1>

          <p className="text-sm sm:text-base text-ink/75 font-medium max-w-2xl">
            {isManager
              ? tasks.length > 0
                ? `Hôm nay có ${tasks.length} đơn đang chờ bạn phê duyệt. Toàn doanh nghiệp có 48/50 nhân sự đã có mặt đúng giờ.`
                : 'Toàn bộ đơn từ đã được xử lý xong. Chúc bạn một ngày điều hành hiệu quả!'
              : 'Theo dõi tiến độ chấm công, số dư phép năm và phiếu lương chính thức theo chuẩn pháp lý 2026.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/leave-requests')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-ink bg-white hover:bg-paper border-2 border-ink shadow-hard transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-hard-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-ink" />
            Tạo đơn từ
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cobalt hover:bg-cobalt-hover border-2 border-ink shadow-hard transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-hard-sm cursor-pointer"
          >
            <Clock className="w-4 h-4 text-white" />
            Chấm công ngay
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          BENTO KHOẢNH KHẮC CHÍNH: Ô LIME LỚN (DONUT 48/50) + Ô SKY + Ô PEACH
          ═══════════════════════════════════════════════════════════════ */}
      {isManager ? (
        <section className="grid grid-cols-12 gap-5">

          {/* ── 1. Ô LIME LỚN: DONUT CHẤM CÔNG 48/50 Ở GIỮA VÒNG (TIÊU ĐIỂM) ── */}
          <div className="col-span-12 lg:col-span-6 bg-lime border-2 border-ink rounded-2xl p-6 sm:p-7 shadow-hard flex flex-col justify-between">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink" />
                Chấm công hôm nay · Ca sáng
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white border-2 border-ink text-xs font-mono font-bold text-ink shadow-hard-sm">
                48/50 CÓ MẶT (96%)
              </span>
            </div>

            {/* Vòng Donut SVG chuẩn mực có số 48/50 ở trung tâm */}
            <div className="my-5 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Nền vòng xám nhạt */}
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="18"
                  />
                  {/* Cung Đúng Giờ: 45/50 (90%) -> C = 2*pi*62 ~ 389.55 -> 90% = 350.6 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="#14131A"
                    strokeWidth="18"
                    strokeDasharray="350.6 389.55"
                    strokeDashoffset="0"
                  />
                  {/* Cung Đi Muộn: 2/50 (4%) -> 15.58 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="#2D4BFF"
                    strokeWidth="18"
                    strokeDasharray="15.58 389.55"
                    strokeDashoffset="-350.6"
                  />
                  {/* Cung Nghỉ Phép: 3/50 (6%) -> 23.37 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="#FFB48A"
                    strokeWidth="18"
                    strokeDasharray="23.37 389.55"
                    strokeDashoffset="-366.18"
                  />
                  {/* Viền mực ink mỏng bao bọc donut */}
                  <circle cx="80" cy="80" r="71" fill="none" stroke="#14131A" strokeWidth="1.5" />
                  <circle cx="80" cy="80" r="53" fill="none" stroke="#14131A" strokeWidth="1.5" />
                </svg>

                {/* Số 48/50 đặt giữa vòng cỡ 6xl */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="flex items-baseline">
                    <span className="text-5xl sm:text-6xl font-display font-extrabold text-ink leading-none">
                      48
                    </span>
                    <span className="text-2xl sm:text-3xl font-display font-bold text-ink/60">
                      /50
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink/80 mt-1">
                    CÓ MẶT
                  </span>
                </div>
              </div>

              {/* Chú giải phân bổ */}
              <div className="space-y-2.5 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-white border-2 border-ink px-3.5 py-2 rounded-xl shadow-hard-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-ink border border-ink" />
                    <span className="text-xs font-bold text-ink">Đúng giờ</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-ink">45 người (90%)</span>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3 bg-white border-2 border-ink px-3.5 py-2 rounded-xl shadow-hard-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cobalt border border-ink" />
                    <span className="text-xs font-bold text-ink">Đi muộn</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-cobalt">2 người (4%)</span>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3 bg-white border-2 border-ink px-3.5 py-2 rounded-xl shadow-hard-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-peach border border-ink" />
                    <span className="text-xs font-bold text-ink">Nghỉ phép</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-ink">3 người (6%)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-ink/20 flex items-center justify-between text-xs font-medium text-ink/80">
              <span>Ca hành chính: 08:30 – 17:30 · Ân hạn: 08:45</span>
              <button
                onClick={() => navigate('/attendance')}
                className="font-bold underline hover:text-ink transition cursor-pointer"
              >
                Nhật ký chi tiết →
              </button>
            </div>
          </div>

          {/* ── 2. Ô SKY NHỎ: ĐƠN CHỜ PHÊ DUYỆT ── */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-sky border-2 border-ink rounded-2xl p-6 shadow-hard flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-ink" />
                  Chờ phê duyệt
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-ink animate-pulse" />
              </div>

              <div className="mt-4">
                <p className="text-6xl sm:text-7xl font-display font-extrabold text-ink font-mono tracking-tight">
                  {tasks.length}
                </p>
                <p className="text-xs font-bold text-ink/80 mt-1 uppercase tracking-wide">
                  {tasks.length > 0 ? `${tasks.length} đơn cần xử lý hôm nay` : 'Đã duyệt toàn bộ đơn'}
                </p>
                <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                  Bao gồm nghỉ phép năm, giải trình chấm công và làm thêm giờ (OT) từ các phòng ban.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-ink/20 mt-4">
              <button
                onClick={() => navigate('/leave-requests')}
                className="w-full py-2.5 bg-white hover:bg-paper text-ink font-bold text-xs rounded-xl border-2 border-ink shadow-hard-sm flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <span>Xem hàng đợi duyệt</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 3. Ô PEACH NHỎ: KỲ BẢNG LƯƠNG 2026 ── */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-peach border-2 border-ink rounded-2xl p-6 shadow-hard flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-ink" />
                  Bảng lương 2026
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border-2 border-ink shadow-hard-sm flex items-center gap-1 ${
                  isPeriodLocked ? 'bg-white text-ink' : 'bg-lime text-ink'
                }`}>
                  {isPeriodLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isPeriodLocked ? 'ĐÃ KHÓA KỲ' : 'ĐANG MỞ'}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-2xl sm:text-3xl font-display font-extrabold text-ink leading-tight">
                  Kỳ Tháng 11/2026
                </p>
                <p className="text-xs font-semibold text-ink/80 mt-1">
                  Khóa kỳ: {lockedDate}
                </p>
                <div className="mt-3 p-3 bg-white/70 border-2 border-ink rounded-xl text-xs space-y-1">
                  <p className="font-bold text-ink">Luật Thuế 2026:</p>
                  <p className="text-ink/80 text-[11px] leading-snug">
                    Biểu thuế 5 bậc · Giảm trừ 15.5M/6.2M · Toàn bộ OT Điều 98 miễn thuế TNCN.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-ink/20 mt-4">
              <button
                onClick={() => navigate('/payroll')}
                className="w-full py-2.5 bg-white hover:bg-paper text-ink font-bold text-xs rounded-xl border-2 border-ink shadow-hard-sm flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <span>Chi tiết bảng lương</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* ── Employee view: Ô LIME (Checkin), Ô SKY (Phép năm), Ô PEACH (Phiếu lương) ── */
        <section className="grid grid-cols-12 gap-5">
          {/* Ô Lime: Chấm công hôm nay */}
          <div className="col-span-12 sm:col-span-5 bg-lime border-2 border-ink rounded-2xl p-6 shadow-hard flex flex-col justify-between">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Vào ca hôm nay
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white border-2 border-ink text-[11px] font-mono font-bold text-ink shadow-hard-sm">
                ĐÚNG GIỜ
              </span>
            </div>
            <div className="my-3">
              <p className="text-6xl font-display font-extrabold text-ink font-mono tracking-tight">08:24</p>
              <p className="text-xs font-semibold text-ink/80 mt-1">Ca hành chính: 08:30 – 17:30 · Ân hạn đến 08:45</p>
            </div>
            <div className="pt-3 border-t-2 border-ink/20 text-xs font-medium text-ink/70">
              Ghi nhận qua: Kiosk FaceID • Keangnam 72
            </div>
          </div>

          {/* Ô Sky: Số dư phép năm */}
          <div className="col-span-6 sm:col-span-3 bg-sky border-2 border-ink rounded-2xl p-6 shadow-hard flex flex-col justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink block border-b-2 border-ink/20 pb-2.5">
              Phép năm còn lại
            </span>
            <div className="my-2">
              <p className="text-5xl font-display font-extrabold text-ink font-mono">
                {user?.leaveBalance?.annualRemaining ?? 10}
                <span className="text-2xl font-bold text-ink/60 ml-1">ngày</span>
              </p>
              <p className="text-xs font-semibold text-ink/80 mt-1">
                Đã dùng {user?.leaveBalance?.annualUsed ?? 2} / {user?.leaveBalance?.annualTotal ?? 12} ngày
              </p>
            </div>
            <div className="pt-3 border-t-2 border-ink/20">
              <button
                onClick={() => navigate('/leave-requests')}
                className="text-xs font-bold underline hover:text-ink transition cursor-pointer"
              >
                Gửi đơn xin nghỉ phép →
              </button>
            </div>
          </div>

          {/* Ô Peach: Phiếu lương tháng này */}
          <div className="col-span-6 sm:col-span-4 bg-peach border-2 border-ink rounded-2xl p-6 shadow-hard flex flex-col justify-between">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-ink" /> Phiếu lương T11
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border-2 border-ink text-[10px] font-mono font-bold text-ink shadow-hard-sm">
                {isPeriodLocked ? 'ĐÃ KHÓA' : 'ĐANG MỞ'}
              </span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-display font-extrabold text-ink">Bảng Lương 2026</p>
              <p className="text-xs text-ink/80 mt-0.5">Biểu 5 bậc mới · Miễn thuế OT Điều 98</p>
            </div>
            <div className="pt-3 border-t-2 border-ink/20">
              <button
                onClick={() => navigate('/payroll')}
                className="w-full py-2 bg-white hover:bg-paper text-ink font-bold text-xs rounded-xl border-2 border-ink shadow-hard-sm flex items-center justify-center gap-1 transition cursor-pointer"
              >
                Xem chi tiết phiếu lương <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          KHỐI 2: 2 CỘT — DANH SÁCH VIỆC CẦN DUYỆT + BIỂU ĐỒ BARCHART
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* CỘT TRÁI (7 CỘT): DANH SÁCH PHÊ DUYỆT / ĐƠN TỪ + DÒNG THỜI GIAN */}
        <div className="lg:col-span-7 space-y-6">
          {isManager ? (
            <section className="bg-white border-2 border-ink rounded-2xl shadow-hard overflow-hidden">
              <div className="px-6 py-4 border-b-2 border-ink bg-paper/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-display font-bold text-ink flex items-center gap-2">
                    Việc cần phê duyệt
                    {tasks.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-mono font-extrabold bg-sky border border-ink rounded shadow-hard-sm">
                        {tasks.length}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-ink/70 mt-0.5 font-medium">Nghỉ phép năm, OT, và giải trình chấm công của cấp dưới</p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs font-bold text-cobalt hover:underline inline-flex items-center gap-1 transition cursor-pointer"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y-2 divide-ink/15">
                {tasks.length === 0 ? (
                  <div className="py-12 text-center space-y-2 bg-white">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                    <p className="text-sm font-bold text-ink">Không còn đơn chờ duyệt</p>
                    <p className="text-xs text-ink/70">Đã hoàn tất xử lý mọi đơn từ trong ca làm việc hôm nay.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-paper/40 transition">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${task.avatarColor} shadow-hard-sm flex items-center justify-center font-display font-extrabold text-sm shrink-0 mt-0.5`}>
                          {task.name.charAt(0)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-ink">{task.name}</span>
                            <span className="text-ink/40">·</span>
                            <span className="text-xs font-medium text-ink/70">{task.department}</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-paper text-ink border border-ink">
                              {task.type}
                            </span>
                          </div>
                          <p className="text-xs text-ink/80 leading-relaxed font-medium">{task.detail}</p>
                          <p className="text-[11px] font-mono text-ink/60">Gửi {task.timeAgo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleReject(task.id, task.name)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border-2 border-ink shadow-hard-sm transition flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                        <button
                          onClick={() => handleApprove(task.id, task.name)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-ink bg-lime hover:bg-lime-hover border-2 border-ink shadow-hard-sm transition flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Phê duyệt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <section className="bg-white border-2 border-ink rounded-2xl shadow-hard overflow-hidden">
              <div className="px-6 py-4 border-b-2 border-ink bg-paper/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-display font-bold text-ink">Đơn từ gần đây của tôi</h2>
                  <p className="text-xs text-ink/70 mt-0.5 font-medium">Tiến độ phê duyệt nghỉ phép & làm thêm giờ OT</p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs font-bold text-cobalt hover:underline inline-flex items-center gap-1 transition cursor-pointer"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y-2 divide-ink/15">
                {myDemoRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between gap-4 pl-5 pr-6 py-4 border-l-4 ${req.borderColor} hover:bg-paper/40 transition`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{req.type}</span>
                        <span className="text-ink/40">·</span>
                        <span className="text-xs font-medium text-ink/80">{req.duration}</span>
                      </div>
                      <p className="text-[11px] text-ink/60 font-mono">{req.createdAt}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-md bg-paper border border-ink ${req.textColor}`}>
                      {req.statusLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3.5 border-t-2 border-ink bg-paper/40 flex items-center justify-between">
                <span className="text-xs text-ink/70 font-medium">Cần nộp đơn nghỉ phép hoặc giải trình chấm công?</span>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-paper text-ink text-xs font-bold border-2 border-ink shadow-hard-sm transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-cobalt" /> Gửi đơn mới
                </button>
              </div>
            </section>
          )}

          {/* Dòng thời gian hoạt động Neo-brutalist */}
          <section className="bg-white border-2 border-ink rounded-2xl p-6 shadow-hard">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-ink">
              <h2 className="text-base font-display font-bold text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-cobalt" />
                {isManager ? 'Hoạt động toàn doanh nghiệp' : 'Lịch sử hoạt động của tôi'}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-lime border border-ink text-ink font-mono font-bold text-[10px] shadow-hard-sm">
                TRỰC TIẾP
              </span>
            </div>

            <div className="space-y-0 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-ink/20" />
              {(isManager ? companyActivities : personalActivities).map((act: any) => (
                <div key={act.id} className="flex items-start gap-4 py-3 relative">
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-ink shrink-0 mt-0.5 z-10 ${act.dot}`} />
                  <div className="flex items-start justify-between gap-3 w-full min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink leading-snug">
                        {isManager ? <><span className="text-cobalt font-extrabold">{act.user}</span> — {act.action}</> : act.action}
                      </p>
                      <p className="text-[11px] text-ink/70 mt-0.5 font-medium">
                        {isManager ? act.method : act.detail}
                      </p>
                    </div>
                    <span className="text-[11px] text-ink/60 shrink-0 font-mono font-bold pt-0.5">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI (5 CỘT): BIỂU ĐỒ BARCHART */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border-2 border-ink rounded-2xl p-6 shadow-hard">
            <div className="mb-4 pb-3 border-b-2 border-ink">
              <h2 className="text-base font-display font-bold text-ink">
                {isManager ? 'Chấm công 7 ngày qua' : 'Giờ công tuần này'}
              </h2>
              <p className="text-xs text-ink/70 mt-0.5 font-medium">
                {isManager ? 'Đúng giờ, đi muộn và nghỉ phép toàn doanh nghiệp' : 'Giờ làm việc thực tế ghi nhận qua Kiosk FaceID & GPS'}
              </p>
            </div>

            {isManager && (
              <div className="flex items-center gap-4 mb-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-ink">
                  <span className="w-3 h-3 rounded bg-cobalt border border-ink" /> Đúng giờ
                </div>
                <div className="flex items-center gap-1.5 text-ink">
                  <span className="w-3 h-3 rounded bg-peach border border-ink" /> Đi muộn
                </div>
                <div className="flex items-center gap-1.5 text-ink">
                  <span className="w-3 h-3 rounded bg-lilac border border-ink" /> Nghỉ phép
                </div>
              </div>
            )}

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {isManager ? (
                  <BarChart data={companyWeeklyAttendance} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#14131A', fontWeight: 600 }} axisLine={{ stroke: '#14131A', strokeWidth: 1.5 }} tickLine={false} />
                    <YAxis allowDecimals={false} domain={[0, 55]} tick={{ fontSize: 11, fill: '#14131A', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(212, 243, 74, 0.25)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 rounded-xl bg-white border-2 border-ink shadow-hard text-xs space-y-1">
                              <p className="font-display font-extrabold text-ink mb-1">{label}</p>
                              <p className="text-cobalt font-bold flex justify-between gap-4"><span>Đúng giờ:</span><strong>{payload[0]?.value}</strong></p>
                              <p className="text-amber-700 font-bold flex justify-between gap-4"><span>Đi muộn:</span><strong>{payload[1]?.value}</strong></p>
                              <p className="text-rose-700 font-bold flex justify-between gap-4"><span>Nghỉ phép:</span><strong>{payload[2]?.value}</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="onTime" fill="#2D4BFF" radius={[4, 4, 0, 0]} maxBarSize={22} stroke="#14131A" strokeWidth={1} />
                    <Bar dataKey="late" fill="#FFB48A" radius={[4, 4, 0, 0]} maxBarSize={22} stroke="#14131A" strokeWidth={1} />
                    <Bar dataKey="leave" fill="#CBB8FF" radius={[4, 4, 0, 0]} maxBarSize={22} stroke="#14131A" strokeWidth={1} />
                  </BarChart>
                ) : (
                  <BarChart data={personalWeeklyAttendance} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#14131A', fontWeight: 600 }} axisLine={{ stroke: '#14131A', strokeWidth: 1.5 }} tickLine={false} />
                    <YAxis allowDecimals={false} domain={[0, 10]} tick={{ fontSize: 11, fill: '#14131A', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(212, 243, 74, 0.25)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const h = Number(payload[0]?.value);
                          return (
                            <div className="p-3 rounded-xl bg-white border-2 border-ink shadow-hard text-xs font-sans">
                              <p className="font-display font-extrabold text-ink mb-1">{label}</p>
                              <p className="text-cobalt font-bold">
                                {h > 0 ? `${h} giờ làm việc` : 'Nghỉ ca'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="hours" fill="#2D4BFF" radius={[4, 4, 0, 0]} maxBarSize={28} stroke="#14131A" strokeWidth={1} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </section>

          {/* Quick info card phong cách Giấy & Mực */}
          <div className="p-5 rounded-2xl bg-lilac border-2 border-ink shadow-hard space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink px-2 py-0.5 rounded bg-white border border-ink shadow-hard-sm inline-block">
              ĐIỂM NHẤN PHÁP LÝ 2026
            </span>
            <p className="text-sm font-display font-bold text-ink">
              Áp dụng Biểu thuế lũy tiến 5 bậc &amp; Điều 98 BLLĐ
            </p>
            <p className="text-xs text-ink/80 leading-relaxed font-medium">
              Toàn bộ tiền lương làm thêm giờ (OT) hợp lệ được miễn thuế TNCN. Các khoản giảm trừ bản thân (15.5M) và người phụ thuộc (6.2M) tự động tính toán chính xác trên từng kỳ lương.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
