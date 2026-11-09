import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Plus,
  UserRound,
  X,
  Mail,
  Calendar,
  Send,
  ExternalLink,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileText,
  Printer,
  Check,
  Briefcase,
  GraduationCap,
  Globe,
  Lock,
  Unlock,
  Building2,
} from 'lucide-react';
import { recruitmentApi, Candidate, JobPosting } from '../api/recruitment';
import { departmentsApi } from '../api/departments';
import { DepartmentItem } from '../types/user';

const statusLabel = (status: string) =>
  ({
    OPEN: 'Đang tuyển',
    CLOSED: 'Đã đóng tuyển (Đủ người)',
    SCREENED: 'Đã sàng lọc AI',
    INTERVIEW: 'Đã mời phỏng vấn',
    OFFER: 'Đề nghị tuyển dụng',
    REJECTED: 'Từ chối',
    APPLIED: 'Chờ xử lý',
  }[status] || status);

const relativeDate = (date: string) => {
  const days = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? 'Hôm nay' : `${days} ngày trước`;
};

const scoreTone = (score: number) =>
  score >= 75
    ? 'text-emerald-700 dark:text-emerald-400 font-black'
    : score >= 50
    ? 'text-amber-700 dark:text-amber-400 font-bold'
    : 'text-rose-700 dark:text-rose-400 font-bold';

const statusTone = (status: string) => {
  if (status === 'REJECTED') {
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-2 border-line font-bold';
  }
  if (status === 'INTERVIEW') {
    return 'bg-lime text-ink border-2 border-line font-black';
  }
  if (status === 'OFFER') {
    return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-line font-black';
  }
  if (status === 'SCREENED') {
    return 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-2 border-line font-bold';
  }
  return 'bg-surface-2 text-fg border-2 border-line font-medium';
};

export const RecruitmentPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  // Modal Chi tiết & Đánh giá ứng viên
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  // Modal Xem Bản Số Hóa CV Ứng Viên
  const [previewCvCandidate, setPreviewCvCandidate] = useState<Candidate | null>(null);

  // Modal Lên lịch phỏng vấn & Gửi Email
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('09:30 AM');
  const [interviewLocation, setInterviewLocation] = useState('Phòng Họp 502, Tầng 5 - Trụ sở Doanh nghiệp PeopleInsight');
  const [interviewType, setInterviewType] = useState('Trực tiếp tại văn phòng');
  const [interviewNotes, setInterviewNotes] = useState('Ứng viên vui lòng mang theo bản cứng CV và CMND/CCCD.');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal Thêm ứng viên nội bộ
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [applyTargetJobId, setApplyTargetJobId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantCVText, setApplicantCVText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  // Modal Tạo Tin Tuyển Dụng Thật
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDeptId, setNewJobDeptId] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobExp, setNewJobExp] = useState(1);
  const [newJobMinSalary, setNewJobMinSalary] = useState(15000000);
  const [newJobMaxSalary, setNewJobMaxSalary] = useState(25000000);
  const [newJobScore, setNewJobScore] = useState(70);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const [resJobs, resDepts] = await Promise.all([
        recruitmentApi.getJobs(),
        departmentsApi.getAllDepartments().catch(() => ({ success: false, data: [] })),
      ]);
      if (resDepts?.success && resDepts.data?.length) {
        setDepartments(resDepts.data);
        if (!newJobDeptId) {
          setNewJobDeptId(resDepts.data[0]._id);
        }
      }
      if (resJobs?.success && resJobs.data?.length) {
        setJobs(resJobs.data);
        if (!selectedJob) {
          setSelectedJob(resJobs.data[0]);
        } else {
          const updatedSelected = resJobs.data.find((j: JobPosting) => j._id === selectedJob._id);
          if (updatedSelected) setSelectedJob(updatedSelected);
          else setSelectedJob(resJobs.data[0]);
        }
      } else {
        setJobs([]);
        setSelectedJob(null);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách tuyển dụng nội bộ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Bật/tắt trạng thái tin tuyển dụng (Đóng tuyển khi đủ người / Mở lại)
  const handleToggleJobStatus = async (job: JobPosting) => {
    const isCurrentlyOpen = job.status === 'OPEN';
    const targetStatus = isCurrentlyOpen ? 'CLOSED' : 'OPEN';
    const confirmText = isCurrentlyOpen
      ? `Bạn có chắc muốn ĐÓNG tuyển dụng cho vị trí "${job.title}"?\n\n(Hệ thống sẽ ghi nhận đã đủ chỉ tiêu nhân sự và chuyển trạng thái tin sang Đã đóng tuyển)`
      : `Bạn có muốn MỞ LẠI tuyển dụng cho vị trí "${job.title}"?`;
    if (!window.confirm(confirmText)) return;

    try {
      await recruitmentApi.toggleJobStatus(job._id, targetStatus);
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật trạng thái tin tuyển dụng.');
    }
  };

  // Gỡ tin tuyển dụng vĩnh viễn (CEO / HR Manager)
  const handleDeleteJob = async (job: JobPosting) => {
    if (
      !window.confirm(
        `⚠️ CẢNH BÁO QUAN TRỌNG:\n\nBạn có chắc chắn muốn GỠ / XÓA VĨNH VIỄN tin tuyển dụng "${job.title}"?\nToàn bộ danh sách ứng viên liên quan sẽ bị xóa khỏi hệ thống.`
      )
    ) {
      return;
    }
    try {
      await recruitmentApi.deleteJob(job._id);
      setSelectedJob(null);
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi gỡ tin tuyển dụng.');
    }
  };

  // Mở modal lên lịch phỏng vấn
  const handleOpenInterviewModal = (cand: Candidate) => {
    setInterviewCandidate(cand);
    // Gợi ý ngày phỏng vấn là ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setInterviewDate(tomorrow.toISOString().split('T')[0]);
    setActionSuccessMessage(null);
  };

  // Xác nhận mời phỏng vấn & Gửi Email
  const handleConfirmInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !interviewCandidate) return;

    setIsSendingEmail(true);
    try {
      const res = await recruitmentApi.updateCandidateStatus(
        selectedJob._id,
        interviewCandidate._id,
        {
          status: 'INTERVIEW',
          interviewDetails: {
            interviewDate,
            interviewTime,
            interviewLocation,
            interviewType,
            notes: interviewNotes,
          },
        }
      );

      if (res?.success) {
        setActionSuccessMessage(
          `Đã duyệt và gửi email thư mời phỏng vấn thành công đến ứng viên: ${interviewCandidate.fullName} (${interviewCandidate.email}).`
        );
        await fetchJobs();
        setTimeout(() => {
          setInterviewCandidate(null);
          setActionSuccessMessage(null);
        }, 2500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi gửi thư mời phỏng vấn.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Đổi trạng thái nhanh (REJECTED / OFFER / APPLIED / SCREENED)
  const handleQuickStatusChange = async (candidateId: string, status: string, candScore?: number) => {
    if (!selectedJob) return;
    const passingScore = selectedJob.requirements?.passingScore || 70;
    if (status === 'OFFER' && (candScore ?? 0) < passingScore) {
      const confirmSpecial = window.confirm(
        `⚠️ Cảnh báo tuyển dụng đặc cách:\n\nỨng viên này chỉ đạt ${candScore ?? 0}% điểm AI (dưới điểm sàn ${passingScore}%).\n\nBạn có chắc chắn vẫn muốn phê duyệt Đề nghị tuyển dụng (OFFER) không?`
      );
      if (!confirmSpecial) return;
    }

    try {
      await recruitmentApi.updateCandidateStatus(selectedJob._id, candidateId, { status });
      await fetchJobs();
      if (activeCandidate?._id === candidateId) {
        setActiveCandidate((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật trạng thái.');
    }
  };

  // Xóa hồ sơ ứng viên
  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!selectedJob) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ ứng viên "${candidateName}" không?`)) {
      return;
    }
    try {
      await recruitmentApi.deleteCandidate(selectedJob._id, candidateId);
      if (activeCandidate?._id === candidateId) {
        setActiveCandidate(null);
      }
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi xóa ứng viên.');
    }
  };

  // Thêm ứng viên mới nội bộ
  const openApply = (jobId = selectedJob?._id || '') => {
    setApplyTargetJobId(jobId);
    setIsApplyOpen(true);
  };
  const closeApply = () => {
    setIsApplyOpen(false);
    setApplyMessage(null);
  };

  const handleApplyCandidate = async (event: React.FormEvent) => {
    event.preventDefault();
    const jobId = applyTargetJobId || selectedJob?._id;
    if (!jobId || !applicantName || !applicantEmail) return;

    try {
      setSubmitting(true);
      setApplyMessage(null);
      const res = await recruitmentApi.applyCandidate(jobId, {
        fullName: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        summary: applicantCVText,
        experience: applicantCVText,
      });

      if (res?.success) {
        setApplyMessage('Đã tiếp nhận hồ sơ. AI đã hoàn tất sàng lọc sơ bộ!');
        await fetchJobs();
        setApplicantName('');
        setApplicantEmail('');
        setApplicantPhone('');
        setApplicantCVText('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi thêm ứng viên.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;
    setIsCreatingJob(true);
    try {
      const skillsArr = newJobSkills.split(',').map((s) => s.trim()).filter(Boolean);
      await recruitmentApi.createJob({
        title: newJobTitle.trim(),
        departmentId: newJobDeptId || (departments.length ? departments[0]._id : undefined),
        jobDescription: newJobDesc.trim() || 'Tuyển dụng nhân sự cho dự án mới.',
        requirements: {
          skills: skillsArr.length ? skillsArr : ['Chuyên môn'],
          minYearsOfExp: Number(newJobExp),
          passingScore: Number(newJobScore),
        },
        salaryRange: {
          min: Number(newJobMinSalary),
          max: Number(newJobMaxSalary),
        },
        status: 'OPEN',
      });
      await fetchJobs();
      setIsCreateJobOpen(false);
      setNewJobTitle('');
      setNewJobDesc('');
      setNewJobSkills('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo tin tuyển dụng.');
    } finally {
      setIsCreatingJob(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-fg">
      {/* Header - Asymmetric Text Dominant */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface-2 border border-line px-2 py-0.5 rounded shadow-xs">
              AI Recruitment · Chuẩn Sàng Lọc CV
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-2 text-fg border border-line font-mono font-bold">
              CEO &amp; HR
            </span>
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight flex items-center gap-2 font-display">
            <span>Quản trị tuyển dụng &amp; Sàng lọc CV AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed font-medium">
            Theo dõi các vị trí đang tuyển, kết quả AI sàng lọc tự động theo từ khóa &amp; kinh nghiệm, đóng/mở đợt tuyển khi đủ người và gửi thư mời phỏng vấn.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/landing#jobs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-surface hover:bg-surface-2 text-fg border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
            title="Mở Cổng thông tin nghề nghiệp công khai để ứng viên nộp hồ sơ"
          >
            <Globe className="w-4 h-4 text-accent" />
            <span>Cổng tuyển dụng ngoài</span>
            <ExternalLink className="w-3 h-3 text-muted" />
          </a>
          <button
            onClick={() => setIsCreateJobOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-surface hover:bg-surface-2 text-fg border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
            <span>Tạo tin tuyển dụng</span>
          </button>
          <button
            onClick={() => openApply()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-lime text-ink border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-ink" strokeWidth={2.5} />
            <span>Thêm ứng viên</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5">
        {/* Cột trái: Danh sách vị trí tuyển dụng */}
        <aside className="bg-surface rounded-2xl border-2 border-line shadow-hard p-3.5 h-fit space-y-2">
          <div className="px-2 py-1.5 text-xs font-black text-fg uppercase tracking-wider flex items-center justify-between font-display">
            <span>Vị trí tuyển dụng ({jobs.length})</span>
            {jobs.some((j) => j.status === 'CLOSED') && (
              <span className="text-[10px] text-muted font-normal font-sans">Có tin đã đóng</span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-2 animate-pulse border-2 border-line" />
              ))}
            </div>
          ) : (
            jobs.map((job) => {
              const active = selectedJob?._id === job._id;
              const candCount = job.candidates?.length || 0;
              const interviewCount = (job.candidates || []).filter((c) => c.status === 'INTERVIEW').length;
              const isClosed = job.status === 'CLOSED';

              return (
                <button
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'bg-lime/20 border-2 border-line text-fg font-black shadow-hard translate-x-1'
                      : 'bg-surface border-2 border-line hover:bg-surface-2 text-fg shadow-hard'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-xs font-bold leading-5 line-clamp-1">{job.title}</div>
                    {isClosed ? (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-surface-2 border border-line text-muted">
                        ĐÃ ĐÓNG
                      </span>
                    ) : (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-lime text-ink border border-line">
                        MỞ
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted font-medium">
                    <span className="line-clamp-1">{job.departmentId?.name || 'Phòng ban'}</span>
                    <span
                      className={`font-mono px-2 py-0.5 rounded-lg border-2 border-line text-[10px] font-black ${
                        candCount > 0 ? 'bg-surface-2 text-fg shadow-xs' : 'bg-surface text-muted'
                      }`}
                    >
                      {candCount} hồ sơ {interviewCount > 0 && `(${interviewCount} PV)`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* Cột phải: Chi tiết vị trí & Danh sách ứng viên đã lọc */}
        <section className="bg-surface min-w-0 rounded-2xl border-2 border-line shadow-hard overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse border-2 border-line" />
              ))}
            </div>
          ) : selectedJob ? (
            <>
              {/* Banner Vị trí Tuyển Dụng */}
              <div className="p-6 border-b-2 border-line bg-surface space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-surface-2 text-fg border border-line">
                        <Building2 className="w-3.5 h-3.5 text-accent" />
                        {selectedJob.departmentId?.name || 'Phòng ban'}
                      </span>
                      {selectedJob.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-lime text-ink text-xs font-black border-2 border-line shadow-hard">
                          <Check className="w-3.5 h-3.5 text-ink" />
                          Đang tuyển dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-2 text-muted text-xs font-black border-2 border-line shadow-hard">
                          <Lock className="w-3.5 h-3.5 text-muted" />
                          Đã đóng tuyển (Đủ người)
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-fg font-display">{selectedJob.title}</h2>
                    <p className="text-xs text-muted leading-relaxed font-medium">
                      {selectedJob.jobDescription}
                    </p>
                  </div>

                  {/* Các nút quản trị tuyển dụng của CEO & HR Manager */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <a
                      href="/landing#jobs"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 border-line bg-surface hover:bg-surface-2 text-fg shadow-hard transition cursor-pointer"
                      title="Xem tin này hiển thị trên Cổng tuyển dụng công khai"
                    >
                      <Globe className="w-3.5 h-3.5 text-accent" />
                      <span>Cổng ứng viên</span>
                      <ExternalLink className="w-3 h-3 text-muted" />
                    </a>

                    {selectedJob.status === 'OPEN' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleJobStatus(selectedJob)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border-2 border-line bg-amber-400 text-ink hover:bg-amber-500 shadow-hard transition cursor-pointer"
                        title="Đóng nhận hồ sơ vị trí này khi đã tuyển đủ người"
                      >
                        <Lock className="w-3.5 h-3.5 text-ink" />
                        <span>Đóng tuyển (Đủ người)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleJobStatus(selectedJob)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border-2 border-line bg-lime text-ink hover:bg-lime/90 shadow-hard transition cursor-pointer"
                        title="Mở lại đợt tuyển dụng cho vị trí này"
                      >
                        <Unlock className="w-3.5 h-3.5 text-ink" />
                        <span>Mở lại tuyển</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteJob(selectedJob)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 border-line bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 shadow-hard transition cursor-pointer"
                      title="Gỡ vĩnh viễn tin tuyển dụng này khỏi hệ thống"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Gỡ tin</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-line flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-fg">Kỹ năng yêu cầu:</span>
                    {selectedJob.requirements.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 rounded-lg border-2 border-line text-[11px] font-bold bg-surface-2 text-fg shadow-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedJob.salaryRange && (
                      <span className="font-bold font-mono text-fg bg-surface-2 px-2.5 py-1 rounded-xl border-2 border-line shadow-xs">
                        💰 {selectedJob.salaryRange.min.toLocaleString('vi-VN')} - {selectedJob.salaryRange.max.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-xl bg-lime text-ink font-mono font-black text-xs border-2 border-line shadow-hard">
                      Điểm sàn AI: {selectedJob.requirements.passingScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bảng Danh Sách Ứng Viên */}
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-fg uppercase tracking-wider font-display">
                    Danh sách ứng viên ({selectedJob.candidates?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowScoring(true)}
                    className="text-xs text-accent hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Quy tắc AI sàng lọc như thế nào?</span>
                  </button>
                </div>

                {selectedJob.candidates?.length ? (
                  <>
                    {/* Mobile View: Stacked Cards (Visible on sm:hidden) */}
                    <div className="space-y-3 sm:hidden">
                      {selectedJob.candidates.map((cand) => {
                        const passingScore = selectedJob.requirements?.passingScore || 70;
                        const isRecommended = cand.aiScore >= passingScore;

                        return (
                          <div
                            key={cand._id}
                            onClick={() => setActiveCandidate(cand)}
                            className="p-4 rounded-2xl bg-surface border-2 border-line space-y-3 border-l-4 cursor-pointer hover:bg-surface-2 transition shadow-hard"
                            style={{
                              borderLeftColor: isRecommended ? '#10b981' : '#f43f5e',
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-black text-sm text-fg font-display">{cand.fullName}</h4>
                                <p className="text-xs text-muted font-mono">{cand.email}</p>
                                {cand.phone && <p className="text-[11px] text-muted font-mono">{cand.phone}</p>}
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-base font-black font-mono ${scoreTone(cand.aiScore)}`}>{cand.aiScore}%</span>
                                <span className="block text-[10px] text-muted font-bold">Khớp AI</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 border-t-2 border-line">
                              <div>
                                {isRecommended ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-lime text-ink border-2 border-line shadow-xs">
                                    <Check className="w-3 h-3 text-ink" /> Nên tuyển
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/10 text-rose-700 border-2 border-line shadow-xs">
                                    <X className="w-3 h-3 text-rose-600" /> Không nên
                                  </span>
                                )}
                              </div>
                              <div>
                                {cand.status === 'INTERVIEW' ? (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-lime text-ink border-2 border-line shadow-xs">
                                    Đã mời PV
                                  </span>
                                ) : cand.status === 'REJECTED' ? (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-2 text-muted border-2 border-line">
                                    Đã từ chối
                                  </span>
                                ) : cand.status === 'OFFER' ? (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-line shadow-xs">
                                    Đã chốt tuyển
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-fg bg-surface-2 border-2 border-line">
                                    Chờ HR xem xét
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-line">
                              {cand.status !== 'INTERVIEW' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInterviewModal(cand);
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-lime text-ink border-2 border-line shadow-hard cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 transition"
                                >
                                  Mời PV
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCandidate(cand);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-line hover:bg-surface-2 text-fg shadow-hard cursor-pointer transition"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop View: Full Data Table (Hidden on Mobile) */}
                    <div className="hidden sm:block overflow-x-auto border-2 border-line rounded-2xl bg-surface shadow-hard">
                      <table className="w-full text-xs">
                        <thead className="bg-surface-2 border-b-2 border-line text-left font-black text-fg uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-3.5 whitespace-nowrap">Ứng viên</th>
                            <th className="py-3 px-2.5 whitespace-nowrap">Đánh giá AI</th>
                            <th className="py-3 px-2 whitespace-nowrap">Đề xuất AI</th>
                            <th className="py-3 px-2 whitespace-nowrap">Trạng thái</th>
                            <th className="py-3 px-3.5 text-right whitespace-nowrap">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-line bg-surface">
                          {selectedJob.candidates.map((cand) => {
                            const passingScore = selectedJob.requirements?.passingScore || 70;
                            const isRecommended = cand.aiScore >= passingScore;

                            return (
                              <tr
                                key={cand._id}
                                onClick={() => setActiveCandidate(cand)}
                                className="hover:bg-surface-2/60 transition-colors cursor-pointer group"
                                title="Bấm vào để xem chi tiết hồ sơ và kết quả AI chấm điểm"
                              >
                                <td className={`py-3 px-3.5 border-l-4 ${isRecommended ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                                  <div className="font-black text-fg group-hover:text-accent transition-colors text-xs sm:text-sm flex items-center gap-1 font-display">
                                    <span className="truncate max-w-[170px]">{cand.fullName}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-transform group-hover:translate-x-0.5 shrink-0" />
                                  </div>
                                  <div className="text-[11px] text-muted font-mono truncate max-w-[190px]">{cand.email}</div>
                                  <div className="text-[10px] text-muted font-mono mt-0.5">
                                    {cand.phone ? `${cand.phone} • ` : ''}Nộp: {relativeDate(cand.appliedAt)}
                                  </div>
                                </td>

                                <td className="py-3 px-2.5">
                                  <div className={`text-sm font-mono font-black ${scoreTone(cand.aiScore)}`}>{cand.aiScore}%</div>
                                  <div className="text-[10px] text-muted line-clamp-1 max-w-[110px] font-medium" title={cand.aiSummary}>
                                    {cand.aiSummary || 'AI Sàng lọc...'}
                                  </div>
                                </td>

                                {/* Đề xuất tự động từ AI: Do thuật toán quyết định, HR không tự sửa */}
                                <td className="py-3 px-2 whitespace-nowrap">
                                  {isRecommended ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-lime text-ink border-2 border-line shadow-xs">
                                      <Check className="w-3 h-3 text-ink" />
                                      <span>Nên tuyển</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-500/10 text-rose-700 border-2 border-line shadow-xs">
                                      <X className="w-3 h-3 text-rose-600" />
                                      <span>Không nên</span>
                                    </span>
                                  )}
                                </td>

                                {/* Trạng thái xử lý thực tế của HR */}
                                <td className="py-3 px-2 whitespace-nowrap">
                                  {cand.status === 'INTERVIEW' ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-lime text-ink border-2 border-line shadow-xs">
                                        <Calendar className="w-3 h-3 text-ink" />
                                        Đã mời PV
                                      </span>
                                      {cand.interviewDetails?.interviewDate && (
                                        <div className="text-[10px] text-muted font-mono font-medium">
                                          {cand.interviewDetails.interviewTime}
                                        </div>
                                      )}
                                    </div>
                                  ) : cand.status === 'REJECTED' ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-2 text-muted border-2 border-line">
                                      Đã từ chối
                                    </span>
                                  ) : cand.status === 'OFFER' ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-line shadow-xs">
                                      Đã chốt tuyển
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold text-fg bg-surface-2 border-2 border-line">
                                      Chờ HR xem xét
                                    </span>
                                  )}
                                </td>

                                {/* Thao tác của HR: Mời, Từ chối, Xem chi tiết, Xóa */}
                                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                                    {cand.status !== 'INTERVIEW' && cand.status !== 'REJECTED' && cand.status !== 'OFFER' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenInterviewModal(cand);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black bg-lime text-ink border-2 border-line shadow-xs hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                                        title="Gửi thư mời phỏng vấn"
                                      >
                                        <Mail className="w-3 h-3 text-ink" />
                                        <span>Mời PV</span>
                                      </button>
                                    )}

                                    {cand.status !== 'REJECTED' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickStatusChange(cand._id, 'REJECTED');
                                        }}
                                        className="px-2 py-1 rounded-lg text-[11px] font-bold border-2 border-line text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 shadow-xs transition cursor-pointer"
                                        title="Từ chối hồ sơ này"
                                      >
                                        Từ chối
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCandidate(cand);
                                      }}
                                      className="px-2 py-1 rounded-lg text-[11px] font-bold border-2 border-line hover:bg-surface-2 text-fg shadow-xs transition cursor-pointer"
                                      title="Xem chi tiết hồ sơ & AI chấm điểm"
                                    >
                                      Chi tiết
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCandidate(cand._id, cand.fullName);
                                      }}
                                      className="p-1 rounded-lg border-2 border-line hover:bg-rose-500/20 text-muted hover:text-rose-600 shadow-xs transition cursor-pointer"
                                      title="Xóa vĩnh viễn hồ sơ này"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="py-14 text-center bg-surface-2 rounded-2xl border-2 border-line shadow-hard space-y-2">
                    <UserRound className="mx-auto w-10 h-10 text-muted opacity-60 mb-2" />
                    <div className="text-base font-black text-fg font-display">Chưa có ứng viên nộp hồ sơ</div>
                    <p className="text-xs text-muted max-w-md mx-auto font-medium leading-relaxed">
                      Ứng viên có thể nộp CV trực tiếp tại Cổng thông tin tuyển dụng công khai hoặc HR thêm thủ công bằng nút "Thêm ứng viên".
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-sm text-[var(--text-muted)]">
              Vui lòng chọn một vị trí tuyển dụng ở cột bên trái.
            </div>
          )}
        </section>
      </div>

      {/* Modal 1: Lên Lịch Phỏng Vấn & Tự Động Gửi Email */}
      {interviewCandidate && selectedJob && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-surface border-2 border-line rounded-3xl max-w-lg w-full shadow-hard-lg overflow-hidden flex flex-col text-xs text-fg">
            <div className="px-6 py-4 border-b-2 border-line bg-surface flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-fg font-display">Lên lịch & Gửi email mời phỏng vấn</h3>
                <div className="text-xs text-muted font-bold mt-0.5">
                  Ứng viên: <span className="text-fg">{interviewCandidate.fullName}</span> ({interviewCandidate.email})
                </div>
              </div>
              <button
                onClick={() => setInterviewCandidate(null)}
                className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition cursor-pointer shadow-hard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInterview} className="p-6 space-y-4">
              {actionSuccessMessage ? (
                <div className="p-4 rounded-2xl bg-lime/20 border-2 border-line text-fg text-center space-y-2 py-6 shadow-hard">
                  <CheckCircle2 className="w-10 h-10 text-ink mx-auto" />
                  <div className="font-black text-base text-fg font-display">Đã gửi thư mời phỏng vấn thành công!</div>
                  <p className="text-xs leading-relaxed text-fg font-medium">{actionSuccessMessage}</p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border-2 border-line text-fg leading-relaxed font-medium shadow-hard">
                    💡 Hệ thống sẽ tự động chuyển trạng thái của ứng viên sang <strong>"ĐÃ MỜI PHỎNG VẤN"</strong> và phát đi thư mời trang trọng có đầy đủ ngày, giờ, địa điểm và hướng dẫn chuẩn bị tới email: <strong>{interviewCandidate.email}</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-fg">Ngày phỏng vấn <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-bold shadow-hard cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-fg">Giờ phỏng vấn <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        placeholder="Ví dụ: 09:30 AM"
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-bold shadow-hard"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-fg">Hình thức phỏng vấn</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                    >
                      <option value="Trực tiếp tại văn phòng">Trực tiếp tại văn phòng công ty</option>
                      <option value="Trực tuyến qua Google Meet">Trực tuyến qua Google Meet / Zoom</option>
                      <option value="Phỏng vấn chuyên sâu vòng 2">Phỏng vấn chuyên sâu vòng 2 cùng Ban Giám Đốc</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-fg">Địa điểm / Link phỏng vấn</label>
                    <input
                      type="text"
                      required
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-medium shadow-hard"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-fg">Ghi chú dặn dò ứng viên</label>
                    <textarea
                      rows={2}
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-medium shadow-hard resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t-2 border-line flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setInterviewCandidate(null)}
                      className="px-4 py-2.5 rounded-xl border-2 border-line hover:bg-surface-2 text-fg font-bold transition cursor-pointer shadow-hard"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-lime text-ink font-black border-2 border-line shadow-hard uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:opacity-50 transition cursor-pointer"
                    >
                      {isSendingEmail ? (
                        <span>Đang gửi thư mời…</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-ink" />
                          <span>Duyệt & Gửi Email thư mời</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Chi Tiết Đánh Giá Hồ Sơ Ứng Viên (AI Screening Result) */}
      {activeCandidate && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-surface border-2 border-line rounded-3xl max-w-lg w-full shadow-hard-lg overflow-hidden flex flex-col text-xs max-h-[85vh] text-fg">
            <div className="px-6 py-4 border-b-2 border-line bg-surface flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-fg font-display">{activeCandidate.fullName}</h3>
                <div className="text-xs text-muted font-medium mt-0.5">{activeCandidate.email} • {activeCandidate.phone || 'Chưa có SĐT'}</div>
              </div>
              <button onClick={() => setActiveCandidate(null)} className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition cursor-pointer shadow-hard">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-2xl bg-surface-2 border-2 border-line flex items-center justify-between shadow-hard">
                <div>
                  <div className="text-xs font-bold text-muted">Điểm phù hợp sàng lọc AI</div>
                  <div className="text-3xl font-black text-fg font-display">{activeCandidate.aiScore}%</div>
                  <div className="text-[11px] text-muted mt-0.5 font-bold">Điểm sàn vị trí: {selectedJob?.requirements?.passingScore || 70}%</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-muted">Đề xuất của AI:</div>
                  {activeCandidate.aiScore >= (selectedJob?.requirements?.passingScore || 70) ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-lime text-ink border-2 border-line shadow-hard">
                      <Check className="w-3.5 h-3.5 text-ink" />
                      Nên tuyển dụng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-rose-500 text-white border-2 border-line shadow-hard">
                      <X className="w-3.5 h-3.5 text-white" />
                      Không nên tuyển
                    </span>
                  )}
                </div>
              </div>

              {/* Cảnh báo nếu không đạt điểm sàn AI */}
              {activeCandidate.aiScore < (selectedJob?.requirements?.passingScore || 70) && (
                <div className="p-3.5 rounded-2xl bg-amber-400/20 border-2 border-line text-fg flex items-start gap-2.5 shadow-hard font-medium">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-black text-fg font-display">Cảnh báo: Hồ sơ không đạt điểm sàn AI</div>
                    <div className="text-[11px] leading-relaxed text-fg">
                      Ứng viên đạt <strong>{activeCandidate.aiScore}%</strong> (Điểm sàn yêu cầu: <strong>{selectedJob?.requirements?.passingScore || 70}%</strong>).
                      Hệ thống khuyến nghị chuyển sang trạng thái <strong>Từ chối</strong> hoặc tổ chức phỏng vấn trước khi đề nghị tuyển dụng.
                    </div>
                  </div>
                </div>
              )}

              {activeCandidate.interviewDetails?.interviewDate && (
                <div className="p-3.5 rounded-2xl bg-lime/20 border-2 border-line text-fg space-y-1 shadow-hard font-medium">
                  <div className="font-black flex items-center gap-1.5 text-xs text-fg font-display">
                    <Calendar className="w-4 h-4 text-ink" />
                    Lịch phỏng vấn đã xếp:
                  </div>
                  <div>Thời gian: <strong>{activeCandidate.interviewDetails.interviewTime} — Ngày {activeCandidate.interviewDetails.interviewDate}</strong></div>
                  <div>Địa điểm: <strong>{activeCandidate.interviewDetails.interviewLocation}</strong></div>
                  {activeCandidate.interviewDetails.notes && <div>Ghi chú: {activeCandidate.interviewDetails.notes}</div>}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="font-black text-fg font-display">Tóm tắt đánh giá AI:</div>
                <div className="p-3.5 rounded-2xl bg-surface-2 border-2 border-line text-fg leading-relaxed font-medium shadow-hard">
                  {activeCandidate.aiSummary || 'Hồ sơ đã được phân tích từ khóa và kinh nghiệm so với bản mô tả công việc.'}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-black text-fg font-display">Kỹ năng phân tích:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCandidate.aiScreening?.matchedSkills || []).map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-xl bg-lime text-ink border-2 border-line font-black text-xs shadow-hard">
                      ✓ {s}
                    </span>
                  ))}
                  {(activeCandidate.aiScreening?.missingSkills || []).map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-700 border-2 border-line font-bold text-xs shadow-hard">
                      ✗ Thiếu: {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t-2 border-line">
                <div className="font-black text-fg flex items-center justify-between font-display">
                  <span>Hồ sơ & File CV đính kèm:</span>
                  {activeCandidate.cvUrl && !activeCandidate.cvUrl.includes('example.com') && (
                    <span className="text-[10px] text-ink bg-lime px-2.5 py-0.5 rounded-md border border-line font-black">
                      Tệp tải lên
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewCvCandidate(activeCandidate)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-lime text-ink border-2 border-line hover:translate-x-0.5 hover:translate-y-0.5 transition shadow-hard cursor-pointer uppercase tracking-wider"
                  >
                    <FileText className="w-4 h-4 text-ink" />
                    <span>Xem Bản Số Hóa CV & Bóc Tách AI</span>
                  </button>

                  {activeCandidate.cvUrl && !activeCandidate.cvUrl.includes('example.com') ? (
                    <a
                      href={activeCandidate.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 border-2 border-line text-fg hover:bg-surface transition shadow-hard cursor-pointer"
                    >
                      <span>Mở tệp gốc (.pdf)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted italic font-medium">
                      (Ứng viên nộp bản tóm tắt hồ sơ trực tuyến)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t-2 border-line bg-surface-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {activeCandidate.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange(activeCandidate._id, 'REJECTED')}
                    className="px-4 py-2 rounded-xl border-2 border-line text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 font-bold shadow-hard cursor-pointer"
                  >
                    Từ chối hồ sơ
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteCandidate(activeCandidate._id, activeCandidate.fullName)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-line text-fg hover:bg-rose-500/10 hover:text-rose-700 shadow-hard cursor-pointer font-bold transition"
                  title="Xóa vĩnh viễn hồ sơ ứng viên"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Xóa hồ sơ</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeCandidate.status !== 'INTERVIEW' && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = activeCandidate;
                      setActiveCandidate(null);
                      handleOpenInterviewModal(c);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black rounded-xl bg-lime text-ink border-2 border-line shadow-hard uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-ink" />
                    <span>Lên lịch & Mời phỏng vấn</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Thêm ứng viên nội bộ */}
      {isApplyOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-surface border-2 border-line rounded-3xl shadow-hard-lg p-6 text-xs text-fg">
            <div className="flex items-center justify-between border-b-2 border-line pb-4">
              <h2 className="text-base font-black text-fg font-display">Thêm hồ sơ ứng viên nội bộ</h2>
              <button onClick={closeApply} className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition cursor-pointer shadow-hard">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApplyCandidate} className="mt-4 space-y-3.5">
              <div>
                <label className="font-bold text-fg">Vị trí ứng tuyển</label>
                <select
                  value={applyTargetJobId || selectedJob?._id || ''}
                  onChange={(e) => setApplyTargetJobId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-medium shadow-hard cursor-pointer"
                >
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-fg">Họ và tên <span className="text-rose-500">*</span></label>
                  <input
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium shadow-hard"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="font-bold text-fg">Email <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent font-mono font-medium shadow-hard"
                    placeholder="nguyenvana@gmail.com"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-fg">Số điện thoại</label>
                <input
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent font-mono font-medium shadow-hard"
                  placeholder="0912 345 678"
                />
              </div>
              <div>
                <label className="font-bold text-fg">Kỹ năng & Tóm tắt kinh nghiệm</label>
                <textarea
                  rows={3}
                  value={applicantCVText}
                  onChange={(e) => setApplicantCVText(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent font-medium resize-none shadow-hard"
                  placeholder="Liệt kê kỹ năng và số năm kinh nghiệm để AI phân tích..."
                />
              </div>

              {applyMessage && (
                <div className="p-3.5 rounded-xl bg-lime/20 text-fg border-2 border-line font-bold shadow-hard">
                  {applyMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t-2 border-line">
                <button type="button" onClick={closeApply} className="px-4 py-2.5 rounded-xl border-2 border-line hover:bg-surface-2 text-fg font-bold transition cursor-pointer shadow-hard">
                  Hủy
                </button>
                <button disabled={submitting} className="px-6 py-2.5 rounded-xl bg-lime text-ink font-black border-2 border-line shadow-hard uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer disabled:opacity-50">
                  {submitting ? 'Đang phân tích AI…' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 4: Giải thích quy tắc AI Sàng Lọc */}
      {showScoring && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-sm bg-surface p-6 shadow-hard-lg border-l-2 border-line space-y-4 text-xs text-fg">
            <div className="flex items-center justify-between border-b-2 border-line pb-3">
              <h2 className="text-sm font-black text-fg font-display">Cơ chế AI sàng lọc hồ sơ (ATS-lite)</h2>
              <button onClick={() => setShowScoring(false)} className="p-1.5 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition cursor-pointer shadow-hard">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-fg leading-relaxed font-medium">
              <p className="p-3 bg-surface-2 border-2 border-line rounded-xl shadow-hard">
                <strong className="text-accent font-bold">1. Phân tích đối chiếu từ khóa:</strong> Hệ thống tự động trích xuất các kỹ năng chuyên môn từ hồ sơ ứng viên và so khớp với danh mục kỹ năng yêu cầu trong bản mô tả công việc (Job Description).
              </p>
              <p className="p-3 bg-surface-2 border-2 border-line rounded-xl shadow-hard">
                <strong className="text-accent font-bold">2. Chấm điểm độ phù hợp (Match Score %):</strong> Ứng viên đạt từ điểm sàn ({selectedJob?.requirements.passingScore || 70}%) trở lên sẽ được phân loại vào nhóm <span className="font-black text-emerald-700 bg-lime px-2 py-0.5 rounded border border-line">ĐÃ SÀNG LỌC (ACCEPTED)</span> để ưu tiên phỏng vấn.
              </p>
              <p className="p-3 bg-surface-2 border-2 border-line rounded-xl shadow-hard">
                <strong className="text-accent font-bold">3. Quyền quyết định cuối cùng:</strong> Điểm số AI chỉ mang tính chất tham mưu, hỗ trợ lọc hàng trăm hồ sơ trong vài giây. Quyết định duyệt mời phỏng vấn hoặc tuyển dụng thuộc thẩm quyền của <strong>HR Manager và CEO</strong>.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 5: Tạo Tin Tuyển Dụng Thật */}
      {isCreateJobOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-surface border-2 border-line rounded-3xl max-w-lg w-full shadow-hard-lg overflow-hidden flex flex-col text-xs max-h-[90vh] text-fg">
            <div className="px-6 py-4 border-b-2 border-line bg-surface-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-fg flex items-center gap-2 font-display">
                  <Plus className="w-5 h-5 text-accent" />
                  Tạo Tin Tuyển Dụng Mới Thực Tế
                </h3>
                <p className="text-xs text-muted mt-0.5 font-medium">
                  Vị trí sẽ tự động hiển thị ra Cổng nghề nghiệp công khai để ứng viên nộp hồ sơ.
                </p>
              </div>
              <button onClick={() => setIsCreateJobOpen(false)} className="p-1.5 text-fg hover:bg-surface border-2 border-line rounded-xl transition cursor-pointer shadow-hard">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewJob} className="p-6 overflow-y-auto space-y-4 font-medium">
              <div className="space-y-1">
                <label className="font-bold text-fg">Tiêu đề vị trí tuyển dụng <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent font-bold shadow-hard"
                  placeholder="Ví dụ: Kỹ Sư Trí Tuệ Nhân Tạo (AI Engineer)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-fg">Phòng ban trực thuộc <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={newJobDeptId}
                  onChange={(e) => setNewJobDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-surface-2 text-fg focus:outline-none focus:border-accent font-bold shadow-hard cursor-pointer"
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))
                  ) : (
                    <option value="">Đang tải danh sách phòng ban...</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-fg">Mô tả công việc (Job Description)</label>
                <textarea
                  rows={3}
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent resize-none shadow-hard"
                  placeholder="Mô tả trách nhiệm công việc, yêu cầu dự án..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-fg">Kỹ năng chuyên môn yêu cầu (Phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg placeholder:text-muted focus:outline-none focus:border-accent font-mono shadow-hard"
                  placeholder="React, TypeScript, Python, PyTorch, MongoDB..."
                />
                <div className="text-[11px] text-muted font-medium">AI ATS sẽ dùng danh sách kỹ năng này để chấm điểm khớp % với CV của ứng viên.</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-fg">Kinh nghiệm tối thiểu (năm)</label>
                  <input
                    type="number"
                    min="0"
                    value={newJobExp}
                    onChange={(e) => setNewJobExp(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg font-mono focus:outline-none focus:border-accent shadow-hard"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-fg">Điểm đậu AI tối thiểu (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newJobScore}
                    onChange={(e) => setNewJobScore(parseInt(e.target.value) || 70)}
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg font-mono font-bold focus:outline-none focus:border-accent shadow-hard"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-fg">Lương tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={newJobMinSalary}
                    onChange={(e) => setNewJobMinSalary(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg font-mono focus:outline-none focus:border-accent shadow-hard"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-fg">Lương tối đa (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={newJobMaxSalary}
                    onChange={(e) => setNewJobMaxSalary(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg font-mono focus:outline-none focus:border-accent shadow-hard"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t-2 border-line">
                <button
                  type="button"
                  onClick={() => setIsCreateJobOpen(false)}
                  className="px-4 py-2.5 rounded-xl border-2 border-line hover:bg-surface-2 text-fg font-bold transition cursor-pointer shadow-hard"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingJob}
                  className="px-6 py-2.5 rounded-xl bg-lime text-ink font-black border-2 border-line shadow-hard uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:opacity-50 transition cursor-pointer"
                >
                  {isCreatingJob ? 'Đang tạo…' : 'Tạo vị trí tuyển dụng'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 6: Xem Bản Số Hóa CV Ứng Viên */}
      {previewCvCandidate && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-surface border-2 border-line rounded-3xl max-w-2xl w-full shadow-hard-lg overflow-hidden flex flex-col text-fg max-h-[90vh]">
            {/* Header thanh công cụ */}
            <div className="px-6 py-4 border-b-2 border-line bg-surface-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime border-2 border-line text-ink flex items-center justify-center shadow-hard shrink-0">
                  <FileText className="w-5 h-5 text-ink" />
                </div>
                <div>
                  <h3 className="text-base font-black text-fg font-display">Bản Số Hóa CV — {previewCvCandidate.fullName}</h3>
                  <div className="text-xs text-muted font-medium">Hệ thống bóc tách &amp; phân tích năng lực tự động PeopleInsight AI</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-line bg-surface hover:bg-surface-2 text-fg shadow-hard transition cursor-pointer"
                  title="In hoặc lưu file PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">In / Xuất PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCvCandidate(null)}
                  className="p-1.5 rounded-xl border-2 border-line hover:bg-surface-2 text-fg cursor-pointer transition shadow-hard"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Nội dung CV chi tiết */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed font-medium">
              {/* Thẻ ứng viên */}
              <div className="p-5 rounded-2xl bg-surface-2 border-2 border-line shadow-hard flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-fg font-display">{previewCvCandidate.fullName}</h2>
                  <div className="text-xs text-muted mt-1 space-y-0.5">
                    <div>📧 Email: <span className="font-bold text-fg font-mono">{previewCvCandidate.email}</span></div>
                    <div>📱 Điện thoại: <span className="font-bold text-fg font-mono">{previewCvCandidate.phone || 'Chưa cung cấp'}</span></div>
                    <div>💼 Ứng tuyển: <span className="font-bold text-accent">{selectedJob?.title || 'Vị trí công việc'}</span></div>
                  </div>
                </div>
                <div className="text-right sm:border-l-2 sm:border-line sm:pl-6">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider">Điểm phù hợp AI</div>
                  <div className="text-3xl font-black text-fg font-display">{previewCvCandidate.aiScore}%</div>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-xl text-xs font-black border-2 border-line shadow-hard ${statusTone(previewCvCandidate.status)}`}>
                    {statusLabel(previewCvCandidate.status)}
                  </span>
                </div>
              </div>

              {/* Tóm tắt kinh nghiệm */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-fg uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Briefcase className="w-4 h-4 text-accent" />
                  Tóm Tắt Năng Lực &amp; Kinh Nghiệm Làm Việc
                </h4>
                <div className="p-4 rounded-xl bg-surface-2 border-2 border-line text-fg leading-relaxed text-xs shadow-hard font-medium">
                  {previewCvCandidate.aiSummary || 'Ứng viên có kinh nghiệm chuyên môn phù hợp với vị trí công việc, đã hoàn thành sàng lọc năng lực tự động qua hệ thống PeopleInsight AI.'}
                </div>
              </div>

              {/* Kỹ năng phân tích */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-fg uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <GraduationCap className="w-4 h-4 text-accent" />
                  Kỹ Năng Đối Chiếu Với Yêu Cầu Công Việc
                </h4>
                <div className="p-4 rounded-xl bg-surface-2 border-2 border-line space-y-3 shadow-hard">
                  <div>
                    <div className="text-xs font-bold text-fg mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Kỹ năng đáp ứng ({previewCvCandidate.aiScreening?.matchedSkills?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(previewCvCandidate.aiScreening?.matchedSkills || []).length > 0 ? (
                        previewCvCandidate.aiScreening?.matchedSkills.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl bg-lime text-ink font-bold text-xs border-2 border-line shadow-hard">
                            ✓ {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted italic text-xs">Chưa có kỹ năng khớp theo từ khóa</span>
                      )}
                    </div>
                  </div>

                  {(previewCvCandidate.aiScreening?.missingSkills || []).length > 0 && (
                    <div className="pt-3 border-t-2 border-line">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
                        Kỹ năng còn thiếu ({previewCvCandidate.aiScreening?.missingSkills?.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewCvCandidate.aiScreening?.missingSkills.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold text-xs border-2 border-line shadow-hard">
                            ✗ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nhận xét AI ATS */}
              <div className="p-4 rounded-xl bg-lime/20 border-2 border-line space-y-1.5 text-xs text-fg shadow-hard font-medium">
                <div className="font-black text-fg font-display">Kết luận sàng lọc hồ sơ tự động:</div>
                <div className="text-fg space-y-1">
                  {previewCvCandidate.aiScreening?.strengths && (
                    <div>• <strong className="font-bold">Điểm mạnh:</strong> {previewCvCandidate.aiScreening.strengths}</div>
                  )}
                  {previewCvCandidate.aiScreening?.weaknesses && (
                    <div>• <strong className="font-bold">Cần xác minh:</strong> {previewCvCandidate.aiScreening.weaknesses}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t-2 border-line bg-surface-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewCvCandidate(null)}
                className="px-6 py-2.5 rounded-xl bg-lime text-ink font-black border-2 border-line shadow-hard uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

