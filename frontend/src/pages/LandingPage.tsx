import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  Users,
  ShieldCheck,
  Award,
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  LogIn,
  X,
  FileText,
  Search,
  Building2,
  ChevronRight,
  TrendingUp,
  Upload,
} from 'lucide-react';
import axios from 'axios';

interface JobItem {
  _id: string;
  title: string;
  departmentId?: { name: string; code: string };
  companyId?: { name: string };
  jobDescription: string;
  requirements?: {
    skills: string[];
    minYearsOfExp: number;
    passingScore: number;
  };
  salaryRange?: {
    min: number;
    max: number;
  };
  createdAt: string;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Form ứng tuyển
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [summary, setSummary] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Tải danh sách việc làm công khai
  useEffect(() => {
    fetchPublicJobs();
  }, []);

  const fetchPublicJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await axios.get('/api/recruitment/public/jobs');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setJobs(res.data.data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách việc làm công khai:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleOpenApplyModal = (job: JobItem) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
    setApplySuccessMessage(null);
  };

  const handleCloseApplyModal = () => {
    setIsApplyModalOpen(false);
    setSelectedJob(null);
    setApplySuccessMessage(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setSkills('');
    setExperience('');
    setSummary('');
    setCvUrl('');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!fullName.trim() || !email.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và email liên hệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('skills', skills.trim());
      formData.append('experience', experience.trim());
      formData.append('summary', summary.trim());
      formData.append('cvUrl', cvUrl.trim());
      if (cvFile) {
        formData.append('cvFile', cvFile);
      }

      const res = await axios.post(`/api/recruitment/public/jobs/${selectedJob._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const extraAiInfo = res.data.data?.aiScore
          ? ` Hệ thống AI ATS đã phân tích hồ sơ đạt ${res.data.data.aiScore}% điểm phù hợp!`
          : '';
        setApplySuccessMessage(
          `Cảm ơn ${fullName}! Hồ sơ của bạn đã được tiếp nhận thành công.${extraAiInfo} Nếu được duyệt, Ban Lãnh đạo sẽ gửi thư mời phỏng vấn đến email: ${email}.`
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi gửi hồ sơ ứng tuyển. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVND = (num?: number) => {
    if (!num) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(num);
  };

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    j.jobDescription.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (j.requirements?.skills || []).some((s) => s.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* 1. Header / Navbar Công Khai */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-[var(--text)] flex items-center gap-2">
                PeopleInsight AI
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Career Portal
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] hidden sm:block">
                Hệ Thống Quản Trị Nhân Sự & Tuyển Dụng Thông Minh
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
            <a href="#about" className="hover:text-teal-700 transition-colors">Về chúng tôi</a>
            <a href="#benefits" className="hover:text-teal-700 transition-colors">Văn hóa & Đãi ngộ</a>
            <a href="#jobs" className="hover:text-teal-700 transition-colors text-teal-700 font-semibold">Cơ hội việc làm ({jobs.length})</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập nhân viên</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Giới thiệu Công ty */}
      <section id="about" className="relative overflow-hidden py-16 lg:py-24 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                <Building2 className="w-4 h-4" />
                Môi trường làm việc chuẩn mực & Số hóa toàn diện
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
                Kiến tạo tương lai nhân sự cùng <span className="text-teal-700">PeopleInsight AI</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
                Chúng tôi xây dựng môi trường làm việc tiên tiến, minh bạch và lấy con người làm trọng tâm. Tại PeopleInsight AI, mọi đóng góp của bạn đều được ghi nhận công bằng qua hệ thống tính lương chuẩn mực 2026, cơ chế điểm danh sinh trắc học thông minh và lộ trình thăng tiến rõ ràng.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 shadow transition-all"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Xem các vị trí tuyển dụng</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Cổng quản trị nội bộ (CEO & HR)</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Award className="w-4 h-4 text-teal-700" />
                    <span>Cam kết văn hóa doanh nghiệp</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Chuẩn 2026
                  </span>
                </div>
                <div className="space-y-3 text-xs text-[var(--text-muted)]">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--text)] font-semibold block">Tính lương minh bạch & Đúng hạn:</strong>
                      Cập nhật Luật thuế TNCN mới, bảo hiểm xã hội và chính sách miễn thuế toàn phần tiền OT hợp lệ.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--text)] font-semibold block">Công nghệ FaceID & Chấm công di động:</strong>
                      Điểm danh linh hoạt bằng nhận diện khuôn mặt hai tầng và GPS định vị văn phòng.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--text)] font-semibold block">Trợ lý AI đồng hành:</strong>
                      Nhân viên tự tra cứu phiếu lương, số dư phép và nội quy công ty qua Chatbot thông minh 24/7.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Chế độ Phúc lợi & Văn hóa (Perks & Benefits) */}
      <section id="benefits" className="py-16 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Quyền lợi & Phúc lợi dành cho bạn</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Chúng tôi tin rằng sự phát triển bền vững của doanh nghiệp bắt nguồn từ việc chăm sóc chu đáo từng thành viên.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">Thu nhập cạnh tranh</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Mức lương hấp dẫn theo năng lực, thưởng hiệu quả công việc và xét tăng lương định kỳ minh bạch.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">Bảo hiểm & Chăm sóc</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Đóng bảo hiểm đầy đủ theo quy định, khám sức khỏe định kỳ và chế độ nghỉ ốm đau hỗ trợ tối đa.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">Thời gian linh hoạt</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Giờ làm việc tiêu chuẩn 8h30 - 17h30 từ Thứ Hai đến Thứ Sáu, nghỉ trưa đầy đủ và hỗ trợ WFH linh hoạt.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">Lộ trình thăng tiến</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Được đào tạo liên tục về kỹ năng và công nghệ AI, cơ hội tham gia các dự án chuyển đổi số quy mô lớn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Danh sách Cơ Hội Nghề Nghiệp & Tuyển Dụng (Open Positions) */}
      <section id="jobs" className="py-16 lg:py-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Gia nhập đội ngũ</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Các vị trí đang mở tuyển dụng</h2>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm vị trí, kỹ năng…"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {isLoadingJobs ? (
            <div className="text-center py-16 text-sm text-[var(--text-muted)]">
              Đang tải danh sách cơ hội việc làm…
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-8">
              <Briefcase className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
              <div className="text-sm font-semibold">Chưa tìm thấy vị trí phù hợp</div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Hãy thử tìm kiếm với từ khóa khác hoặc quay lại sau nhé.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {job.departmentId?.name || 'Phòng ban chuyên môn'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        Toàn thời gian
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-[var(--text)] group-hover:text-teal-700 transition-colors">
                        {job.title}
                      </h3>
                      <div className="text-xs text-emerald-700 font-semibold mt-1">
                        Mức lương: {formatVND(job.salaryRange?.min)} — {formatVND(job.salaryRange?.max)}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                      {job.jobDescription}
                    </p>

                    {job.requirements?.skills && job.requirements.skills.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-medium text-[var(--text-muted)]">Kỹ năng yêu cầu:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {job.requirements.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Kinh nghiệm: {job.requirements?.minYearsOfExp || 1}+ năm
                    </span>
                    <button
                      onClick={() => handleOpenApplyModal(job)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
                    >
                      <span>Ứng tuyển ngay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8 text-xs text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 PeopleInsight AI Corporation. Bảo lưu mọi quyền.
          </div>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-[var(--text)] transition-colors">Về chúng tôi</a>
            <a href="#jobs" className="hover:text-[var(--text)] transition-colors">Tuyển dụng</a>
            <button onClick={() => navigate('/login')} className="hover:text-teal-700 font-medium">
              Đăng nhập nội bộ
            </button>
          </div>
        </div>
      </footer>

      {/* 6. Modal Nộp Hồ Sơ Ứng Tuyển & Sàng Lọc AI */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Nộp hồ sơ ứng tuyển</h3>
                <div className="text-xs text-teal-700 font-medium">{selectedJob.title}</div>
              </div>
              <button
                onClick={handleCloseApplyModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {applySuccessMessage ? (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-3 text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
                  <div className="font-bold text-sm">Hồ sơ đã được gửi thành công!</div>
                  <p className="text-xs leading-relaxed text-teal-800">
                    {applySuccessMessage}
                  </p>
                  <button
                    onClick={handleCloseApplyModal}
                    className="mt-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-medium text-xs hover:bg-teal-800"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-100 text-teal-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
                    <div>
                      <strong>Hệ thống Sàng Lọc AI (ATS-lite):</strong> Sau khi bạn bấm nộp hồ sơ, hệ thống AI sẽ tự động phân tích từ khóa kỹ năng để chấm điểm độ phù hợp và chuyển cho Trưởng phòng HR & CEO duyệt lịch phỏng vấn.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Họ và tên ứng viên <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Email nhận kết quả <span className="text-rose-500">*</span></label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="an.nguyen@gmail.com"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Số điện thoại</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Các kỹ năng chuyên môn nổi bật (Phân tách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Ví dụ: React, Node.js, TypeScript, MongoDB, C&B, Thuế TNCN..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tóm tắt kinh nghiệm làm việc & Dự án đã làm</label>
                    <textarea
                      rows={3}
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Mô tả ngắn gọn số năm kinh nghiệm, các công ty hoặc dự án tiêu biểu bạn từng tham gia..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  {/* Tải lên file CV thực tế */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 flex items-center justify-between">
                      <span>Tải lên tệp CV thực tế (.PDF, .DOCX)</span>
                      <span className="text-[11px] font-medium text-teal-700">Tự động đọc nội dung bằng AI</span>
                    </label>
                    <div className="border-2 border-dashed border-teal-300 rounded-xl p-3 bg-teal-50/50 text-center hover:bg-teal-50 transition relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setCvFile(e.target.files[0]);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {cvFile ? (
                        <div className="flex items-center justify-center gap-2 text-teal-900 font-semibold py-1">
                          <FileText className="w-5 h-5 text-teal-600" />
                          <span>{cvFile.name} ({(cvFile.size / 1024).toFixed(0)} KB)</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCvFile(null);
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs ml-2 underline"
                          >
                            Hủy chọn
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1">
                          <Upload className="w-5 h-5 text-teal-600 mx-auto" />
                          <div className="text-xs text-slate-700 font-medium">Bấm để chọn file CV từ máy tính hoặc kéo thả vào đây</div>
                          <div className="text-[10px] text-slate-500">Hỗ trợ file: PDF, Word (.docx) tối đa 10MB</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Hoặc đường dẫn CV online (Google Drive, LinkedIn)</label>
                    <input
                      type="url"
                      value={cvUrl}
                      onChange={(e) => setCvUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/your-cv.pdf"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCloseApplyModal}
                      className="px-4 py-2 rounded-lg font-medium border border-[var(--border)] hover:bg-slate-100"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-white font-semibold bg-teal-700 hover:bg-teal-800 shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Đang xử lý & Sàng lọc AI…</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi hồ sơ ứng tuyển</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
