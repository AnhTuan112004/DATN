import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  Users,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Activity,
  UserCheck,
  Send,
  AlertCircle,
  FileSpreadsheet,
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

// Danh sách việc cần duyệt dành riêng cho Cấp Quản lý (CEO / HR Manager / Dept Manager)
const initialManagementTasks: PendingTask[] = [
  {
    id: 'req_1',
    name: 'Trần Mai Anh',
    role: 'Nhân viên kinh doanh',
    department: 'Kinh doanh',
    type: 'Nghỉ phép năm',
    detail: 'Xin nghỉ phép 2 ngày (28/10 - 29/10) giải quyết việc gia đình',
    timeAgo: '2 giờ trước',
    avatarColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  },
  {
    id: 'req_2',
    name: 'Lê Hoàng Long',
    role: 'Kỹ sư phần mềm',
    department: 'Công nghệ',
    type: 'Giải trình quên công',
    detail: 'Quên chấm công ca chiều ngày 26/10 do họp trực tuyến với đối tác',
    timeAgo: '4 giờ trước',
    avatarColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  },
  {
    id: 'req_3',
    name: 'Nguyễn Thu Hà',
    role: 'Chuyên viên tuyển dụng',
    department: 'Nhân sự',
    type: 'Làm thêm giờ (OT)',
    detail: 'Làm thêm 3.5 giờ hoàn thiện hồ sơ ứng viên quý 4',
    timeAgo: 'Hôm qua',
    avatarColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
];

// Danh sách đơn của chính nhân viên khi đăng nhập vai trò EMPLOYEE
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
    statusClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    createdAt: 'Hôm qua lúc 15:30',
  },
  {
    id: 'my_req_2',
    type: 'Làm thêm giờ (OT)',
    duration: '3.0 giờ (Dự án Sprint 4)',
    status: 'APPROVED',
    statusLabel: 'Đã phê duyệt',
    statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    createdAt: '22/10/2026',
  },
];

// Dữ liệu chấm công toàn công ty (Dành cho Quản lý)
const companyWeeklyAttendance = [
  { day: 'T2', onTime: 47, late: 2, leave: 1 },
  { day: 'T3', onTime: 48, late: 1, leave: 1 },
  { day: 'T4', onTime: 46, late: 3, leave: 1 },
  { day: 'T5', onTime: 49, late: 0, leave: 1 },
  { day: 'T6', onTime: 45, late: 3, leave: 2 },
  { day: 'T7', onTime: 20, late: 1, leave: 0 },
  { day: 'CN', onTime: 12, late: 0, leave: 0 },
];

// Dữ liệu chấm công cá nhân của nhân viên
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
    method: 'Kiosk khuôn mặt',
    time: '15 phút trước',
  },
  {
    id: 'act_2',
    user: 'Trần Mai Anh',
    action: 'Nộp đơn xin nghỉ phép năm 2 ngày',
    method: 'Đơn từ',
    time: '2 giờ trước',
  },
  {
    id: 'act_3',
    user: 'Đỗ Hoàng Long',
    action: 'Chấm công GPS tại Keangnam (08:12)',
    method: 'GPS Geofencing',
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

  // Phân quyền chặt chẽ: Chỉ CEO, HR_MANAGER và MANAGER mới có quyền duyệt đơn của người khác
  const isManager = user?.role === 'CEO' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER';

  const [tasks, setTasks] = useState<PendingTask[]>(initialManagementTasks);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApprove = (id: string, name: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Đã phê duyệt đơn của ${name}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReject = (id: string, name: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Đã từ chối đơn của ${name}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 p-3 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] shadow-lg text-xs font-medium text-[var(--text)] animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[var(--success-text)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header chào mừng & hành động */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
            Chào {user?.fullName || 'bạn'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-muted)]">
            {isManager
              ? 'Tổng quan điều hành công việc và tình hình nhân sự toàn công ty.'
              : 'Không gian làm việc cá nhân, thông tin chấm công và đơn từ của bạn.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/leave-requests')}
            className="app-button-secondary text-xs h-9 min-h-0 py-1.5 px-3"
          >
            <FileText className="w-4 h-4" strokeWidth={1.5} />
            <span>Tạo đơn từ</span>
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="app-button text-xs h-9 min-h-0 py-1.5 px-3.5"
          >
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            <span>Chấm công hôm nay</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          KHỐI 1: 4 THẺ CHỈ SỐ NHANH (PHÂN BIỆT THEO VAI TRÒ)
          ========================================================================= */}
      {isManager ? (
        // A. Thẻ dành cho Quản lý & HR (Management Workspace)
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Nhân sự làm việc</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--success-bg)] text-[var(--success-text)] font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +2 so với T9
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)] tabular-nums">50</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">100% hợp đồng chính thức</p>
          </div>

          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Chấm công hôm nay</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-muted)] font-medium">
                96% vào ca
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)] tabular-nums">
              48 <span className="text-sm font-normal text-[var(--text-muted)]">/ 50</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">2 nhân sự đang nghỉ phép</p>
          </div>

          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Đơn từ chờ duyệt</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                {tasks.length} đơn
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)] tabular-nums">{tasks.length}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {tasks.length > 0 ? 'Cần phê duyệt trong ca' : 'Đã duyệt hết'}
            </p>
          </div>

          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Kỳ lương tháng 10</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                Đang mở
              </span>
            </div>
            <p className="mt-2 text-base font-semibold text-[var(--text)]">Chưa khóa kỳ</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Dự kiến chốt ngày 31/10/2026</p>
          </div>
        </section>
      ) : (
        // B. Thẻ dành cho Nhân viên thường (Employee Personal Portal)
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Chấm công hôm nay</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--success-bg)] text-[var(--success-text)] font-medium">
                Đã vào ca
              </span>
            </div>
            <p className="mt-2 text-xl font-semibold text-[var(--text)] tabular-nums">08:24</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Ca hành chính (08:30 - 17:30)</p>
          </div>

          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Số dư phép năm</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-muted)] font-medium">
                Còn lại
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--accent)] tabular-nums">
              {user?.leaveBalance?.annualRemaining ?? 10}{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">ngày</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Đã sử dụng: {user?.leaveBalance?.annualUsed ?? 2} / {user?.leaveBalance?.annualTotal ?? 12} ngày
            </p>
          </div>

          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Đơn từ của tôi</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                {myDemoRequests.filter((r) => r.status.startsWith('PENDING')).length} đang chờ
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)] tabular-nums">
              {myDemoRequests.length}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Đơn nghỉ phép & OT tháng này</p>
          </div>

          <div className="app-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Bảng lương kỳ T10</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-muted)] font-medium">
                Dự kiến 31/10
              </span>
            </div>
            <p className="mt-2 text-base font-semibold text-[var(--text)]">Đang tổng hợp</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Xem chi tiết sau khi khóa kỳ</p>
          </div>
        </section>
      )}

      {/* =========================================================================
          KHỐI 2: NỘI DUNG CHÍNH (2 CỘT SONG SONG)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Cột trái (7 cột) */}
        <div className="lg:col-span-7 space-y-5">
          {isManager ? (
            // A1. Việc cần xử lý (DÀNH CHO QUẢN LÝ / HR)
            <section className="app-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text)]">
                    Việc cần xử lý ({tasks.length})
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Đơn từ của nhân sự cấp dưới đang chờ bạn phê duyệt.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-[var(--success-text)] mb-1.5" strokeWidth={1.5} />
                    <p className="font-medium text-[var(--text)]">Không còn đơn chờ duyệt</p>
                    <p className="mt-0.5">Bạn đã xử lý hết các yêu cầu trong ca hôm nay.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-muted)]/50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${task.avatarColor} flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5`}>
                          {task.name.charAt(0)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-xs text-[var(--text)] truncate">
                              {task.name}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">·</span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {task.department}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)] font-medium">
                              {task.type}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text)] leading-4">
                            {task.detail}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Gửi {task.timeAgo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 sm:self-center self-end">
                        <button
                          onClick={() => handleReject(task.id, task.name)}
                          className="app-button-secondary text-xs h-7 min-h-0 py-0.5 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                        <button
                          onClick={() => handleApprove(task.id, task.name)}
                          className="app-button text-xs h-7 min-h-0 py-0.5 px-2.5"
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
            // A2. Đơn từ của tôi (DÀNH CHO NHÂN VIÊN THƯỜNG)
            <section className="app-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text)]">
                    Đơn từ của tôi gần đây
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Tiến độ phê duyệt các đơn xin nghỉ phép và làm thêm giờ.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="text-xs text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {myDemoRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--surface-muted)]/50 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-[var(--text)]">
                          {req.type}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">·</span>
                        <span className="text-xs text-[var(--text)] font-normal">
                          {req.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Gửi lúc: {req.createdAt}
                      </p>
                    </div>

                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${req.statusClass}`}>
                      {req.statusLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-muted)]/30 flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Cần nghỉ phép hoặc giải trình chấm công?</span>
                <button
                  onClick={() => navigate('/leave-requests')}
                  className="app-button-secondary text-xs h-7 min-h-0 py-0.5 px-2.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Gửi đơn mới</span>
                </button>
              </div>
            </section>
          )}

          {/* Dòng hoạt động gần đây */}
          <section className="app-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                {isManager ? 'Hoạt động nhân sự gần đây' : 'Lịch sử hoạt động của tôi'}
              </h2>
              <span className="text-[11px] text-[var(--text-muted)]">Hôm nay</span>
            </div>

            <div className="space-y-2.5">
              {(isManager ? companyActivities : personalActivities).map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 text-xs p-2 rounded-[var(--radius)] hover:bg-[var(--surface-muted)]/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium text-[var(--text)] truncate">
                      {isManager ? `${act.user} — ${act.action}` : act.action}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {isManager ? act.method : act.detail}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải (5 cột): Biểu đồ chấm công & Lịch làm việc */}
        <div className="lg:col-span-5 space-y-5">
          <section className="app-surface p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text)]">
                  {isManager ? 'Chấm công 7 ngày gần nhất' : 'Chấm công tuần này của tôi'}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isManager
                    ? 'Tỷ lệ đúng giờ và đi muộn toàn công ty.'
                    : 'Số giờ công thực tế ghi nhận qua Kiosk/GPS.'}
                </p>
              </div>
              {isManager && (
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span className="text-[var(--text-muted)]">Đúng giờ</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[var(--text-muted)]">Đi muộn</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-[var(--text-muted)]">Phép</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {isManager ? (
                  <BarChart data={companyWeeklyAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} domain={[0, 55]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="app-surface p-2.5 shadow-lg text-xs space-y-1">
                              <p className="font-semibold text-xs mb-1 text-[var(--text)]">Thứ {label}</p>
                              <p className="text-[var(--accent)] flex justify-between gap-3 text-[11px]">
                                <span>Đúng giờ:</span>
                                <strong>{payload[0]?.value} người</strong>
                              </p>
                              <p className="text-amber-500 flex justify-between gap-3 text-[11px]">
                                <span>Đi muộn:</span>
                                <strong>{payload[1]?.value} người</strong>
                              </p>
                              <p className="text-rose-400 flex justify-between gap-3 text-[11px]">
                                <span>Nghỉ phép:</span>
                                <strong>{payload[2]?.value} người</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="onTime" name="Đúng giờ" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="late" name="Đi muộn" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="leave" name="Nghỉ phép" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <BarChart data={personalWeeklyAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="app-surface p-2.5 shadow-lg text-xs space-y-1">
                              <p className="font-semibold text-xs mb-1 text-[var(--text)]">Thứ {label}</p>
                              <p className="text-[var(--accent)] flex justify-between gap-3 text-[11px]">
                                <span>Số giờ làm:</span>
                                <strong>{payload[0]?.value} giờ</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="hours" name="Số giờ làm" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </section>

          {/* Quick Info Card */}
          <div className="p-3.5 rounded-[var(--radius)] bg-[var(--surface-muted)]/50 border border-[var(--border)] text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-medium text-[var(--text)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.5} />
              Lịch làm việc hôm nay: 08:30 – 17:30
            </p>
            <p className="text-[11px] leading-4">
              Văn phòng chính Keangnam Landmark 72 · Thời gian tính đi muộn sau 08:45.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
