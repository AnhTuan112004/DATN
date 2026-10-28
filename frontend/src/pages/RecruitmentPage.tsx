import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronRight,
  FileText,
  Plus,
  UserRound,
  X,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building2,
  Navigation,
  Settings,
} from 'lucide-react';
import { recruitmentApi, Candidate, JobPosting } from '../api/recruitment';
import { companyApi } from '../api/company';

const statusLabel = (status: string) =>
  ({
    OPEN: 'Đang tuyển',
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
    ? 'text-[var(--success-text)] font-bold'
    : score >= 50
    ? 'text-amber-600 font-semibold'
    : 'text-[var(--danger-text)] font-semibold';

const statusTone = (status: string) => {
  if (status === 'REJECTED') {
    return 'bg-rose-50 text-rose-700 border border-rose-200';
  }
  if (status === 'INTERVIEW') {
    return 'bg-teal-50 text-teal-800 border border-teal-200 font-semibold';
  }
  if (status === 'OFFER') {
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold';
  }
  if (status === 'SCREENED') {
    return 'bg-sky-50 text-sky-800 border border-sky-200';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

export const RecruitmentPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Chi tiết & Đánh giá ứng viên
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

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

  // Modal Cấu hình Doanh nghiệp & Tọa độ GPS thật
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('PeopleInsight AI Corporation');
  const [locName, setLocName] = useState('Trụ sở Văn phòng Chính');
  const [gpsLat, setGpsLat] = useState<number>(20.9701);
  const [gpsLng, setGpsLng] = useState<number>(105.7865);
  const [gpsRadius, setGpsRadius] = useState<number>(100);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Modal Tạo Tin Tuyển Dụng Thật
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
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
      const res = await recruitmentApi.getJobs();
      if (res?.success && res.data?.length) {
        setJobs(res.data);
        if (!selectedJob) {
          setSelectedJob(res.data[0]);
        } else {
          const updatedSelected = res.data.find((j: JobPosting) => j._id === selectedJob._id);
          if (updatedSelected) setSelectedJob(updatedSelected);
        }
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

  // Đổi trạng thái nhanh (REJECTED / OFFER)
  const handleQuickStatusChange = async (candidateId: string, status: string) => {
    if (!selectedJob) return;
    try {
      await recruitmentApi.updateCandidateStatus(selectedJob._id, candidateId, { status });
      await fetchJobs();
      if (activeCandidate?._id === candidateId) {
        setActiveCandidate(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật trạng thái.');
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ Geolocation.');
      return;
    }
    setIsGettingGps(true);
    setGpsSuccessMsg(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(Number(position.coords.latitude.toFixed(6)));
        setGpsLng(Number(position.coords.longitude.toFixed(6)));
        setGpsSuccessMsg(`Đã lấy vị trí GPS thực tế: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setIsGettingGps(false);
      },
      (error) => {
        setIsGettingGps(false);
        alert(`Không thể lấy vị trí GPS: ${error.message}. Hãy cấp quyền định vị cho trình duyệt.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveCompanyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      await companyApi.updateProfile({ name: companyName });
      await companyApi.addLocation({
        name: locName,
        latitude: gpsLat,
        longitude: gpsLng,
        radiusMeters: gpsRadius,
      });
      setGpsSuccessMsg('Đã lưu cấu hình Tên công ty và Tọa độ GPS thực tế thành công!');
      setTimeout(() => {
        setIsCompanyModalOpen(false);
        setGpsSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi lưu cấu hình công ty.');
    } finally {
      setIsSavingCompany(false);
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
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
            Quản trị tuyển dụng & Sàng lọc CV AI
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
              Dành riêng CEO & HR
            </span>
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-muted)]">
            Theo dõi các vị trí đang tuyển, kết quả AI sàng lọc tự động và phê duyệt gửi thư mời phỏng vấn.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Cấu hình Công ty & GPS</span>
          </button>
          <button
            onClick={() => setIsCreateJobOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            <span>Tạo tin tuyển dụng</span>
          </button>
          <button onClick={() => openApply()} className="app-button shrink-0 text-xs">
            <Plus className="w-4 h-4" />
            <span>Thêm ứng viên</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5">
        {/* Cột trái: Danh sách vị trí tuyển dụng */}
        <aside className="app-surface p-3 h-fit space-y-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Vị trí tuyển dụng ({jobs.length})
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            jobs.map((job) => {
              const active = selectedJob?._id === job._id;
              const candCount = job.candidates?.length || 0;
              const interviewCount = (job.candidates || []).filter((c) => c.status === 'INTERVIEW').length;

              return (
                <button
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    active
                      ? 'bg-teal-50/80 border-teal-200 text-teal-900 font-semibold shadow-sm'
                      : 'border-transparent hover:bg-slate-50 text-[var(--text)]'
                  }`}
                >
                  <div className="text-xs font-bold leading-5 line-clamp-1">{job.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>{job.departmentId?.name || 'Phòng ban'}</span>
                    <span className="font-medium text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {candCount} hồ sơ {interviewCount > 0 && `(${interviewCount} PV)`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* Cột phải: Chi tiết vị trí & Danh sách ứng viên đã lọc */}
        <section className="app-surface min-w-0 rounded-2xl border border-[var(--border)] overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : selectedJob ? (
            <>
              {/* Banner Vị trí */}
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">{selectedJob.title}</h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                      {selectedJob.jobDescription}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    {statusLabel(selectedJob.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Kỹ năng yêu cầu:</span>
                  {selectedJob.requirements.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-medium bg-white text-slate-700 shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                  <span className="ml-auto text-teal-700 font-medium">
                    Điểm sàn AI: {selectedJob.requirements.passingScore}%
                  </span>
                </div>
              </div>

              {/* Bảng Danh Sách Ứng Viên */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Danh sách ứng viên ({selectedJob.candidates?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowScoring(true)}
                    className="text-xs text-teal-700 hover:underline font-medium"
                  >
                    Quy tắc AI sàng lọc như thế nào?
                  </button>
                </div>

                {selectedJob.candidates?.length ? (
                  <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
                    <table className="w-full min-w-[700px] text-xs">
                      <thead className="bg-slate-50 border-b border-[var(--border)] text-left font-semibold text-slate-700">
                        <tr>
                          <th className="py-3 px-4">Ứng viên</th>
                          <th className="py-3 px-4">Đánh giá AI (Match %)</th>
                          <th className="py-3 px-4">Trạng thái</th>
                          <th className="py-3 px-4">Lịch phỏng vấn</th>
                          <th className="py-3 px-4 text-right">Thao tác duyệt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] bg-white">
                        {selectedJob.candidates.map((cand) => (
                          <tr
                            key={cand._id}
                            onClick={() => setActiveCandidate(cand)}
                            className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                            title="Bấm vào để xem chi tiết hồ sơ và kết quả AI chấm điểm"
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors text-sm flex items-center gap-1.5">
                                <span>{cand.fullName}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                              </div>
                              <div className="text-[11px] text-slate-500">{cand.email} • {cand.phone || 'Chưa có SĐT'}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Nộp: {relativeDate(cand.appliedAt)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`text-sm ${scoreTone(cand.aiScore)}`}>{cand.aiScore}%</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 max-w-xs" title={cand.aiSummary}>
                                {cand.aiSummary || 'Đã phân tích kỹ năng'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] ${statusTone(cand.status)}`}>
                                {statusLabel(cand.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {cand.interviewDetails?.interviewDate ? (
                                <div className="space-y-0.5">
                                  <div className="font-medium text-teal-800 text-[11px] flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-teal-600" />
                                    {cand.interviewDetails.interviewTime} — {cand.interviewDetails.interviewDate}
                                  </div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">
                                    {cand.interviewDetails.interviewLocation}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Chưa lên lịch</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {cand.status !== 'INTERVIEW' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInterviewModal(cand);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 shadow-2xs cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Mời phỏng vấn</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCandidate(cand);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-teal-700 shadow-2xs cursor-pointer"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <UserRound className="mx-auto w-8 h-8 text-slate-400 mb-2 opacity-50" />
                    <div className="text-sm font-semibold text-slate-700">Chưa có ứng viên nộp hồ sơ</div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ứng viên có thể nộp CV trực tiếp tại Cổng thông tin tuyển dụng công khai hoặc thêm thủ công.
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
      {interviewCandidate && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-xs">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-teal-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-teal-900">Lên lịch & Gửi email mời phỏng vấn</h3>
                <div className="text-xs text-teal-700 font-medium">
                  Ứng viên: {interviewCandidate.fullName} ({interviewCandidate.email})
                </div>
              </div>
              <button
                onClick={() => setInterviewCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInterview} className="p-6 space-y-4">
              {actionSuccessMessage ? (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-center space-y-2 py-6">
                  <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
                  <div className="font-bold text-sm">Đã gửi thư mời phỏng vấn thành công!</div>
                  <p className="text-xs leading-relaxed text-teal-800">{actionSuccessMessage}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                    💡 Hệ thống sẽ tự động chuyển trạng thái của ứng viên sang <strong>"ĐÃ MỜI PHỎNG VẤN"</strong> và phát đi thư mời trang trọng có đầy đủ ngày, giờ, địa điểm và hướng dẫn chuẩn bị tới email: <strong>{interviewCandidate.email}</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Ngày phỏng vấn <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Giờ phỏng vấn <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        placeholder="Ví dụ: 09:30 AM"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Hình thức phỏng vấn</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600"
                    >
                      <option value="Trực tiếp tại văn phòng">Trực tiếp tại văn phòng công ty</option>
                      <option value="Trực tuyến qua Google Meet">Trực tuyến qua Google Meet / Zoom</option>
                      <option value="Phỏng vấn chuyên sâu vòng 2">Phỏng vấn chuyên sâu vòng 2 cùng Ban Giám Đốc</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Địa điểm / Link phỏng vấn</label>
                    <input
                      type="text"
                      required
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Ghi chú dặn dò ứng viên</label>
                    <textarea
                      rows={2}
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:border-teal-600 resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setInterviewCandidate(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-sm disabled:opacity-50"
                    >
                      {isSendingEmail ? (
                        <span>Đang gửi thư mời…</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Duyệt & Gửi Email thư mời</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Chi Tiết Đánh Giá Hồ Sơ Ứng Viên (AI Screening Result) */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-xs max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeCandidate.fullName}</h3>
                <div className="text-xs text-slate-500">{activeCandidate.email} • {activeCandidate.phone || 'Chưa có SĐT'}</div>
              </div>
              <button onClick={() => setActiveCandidate(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-teal-800">Điểm phù hợp sàng lọc AI</div>
                  <div className="text-2xl font-black text-teal-700">{activeCandidate.aiScore}%</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone(activeCandidate.status)}`}>
                  {statusLabel(activeCandidate.status)}
                </span>
              </div>

              {activeCandidate.interviewDetails?.interviewDate && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    Lịch phỏng vấn đã xếp:
                  </div>
                  <div>Thời gian: <strong>{activeCandidate.interviewDetails.interviewTime} — Ngày {activeCandidate.interviewDetails.interviewDate}</strong></div>
                  <div>Địa điểm: <strong>{activeCandidate.interviewDetails.interviewLocation}</strong></div>
                  {activeCandidate.interviewDetails.notes && <div>Ghi chú: {activeCandidate.interviewDetails.notes}</div>}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="font-bold text-slate-700">Tóm tắt đánh giá AI:</div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                  {activeCandidate.aiSummary || 'Hồ sơ đã được phân tích từ khóa và kinh nghiệm so với bản mô tả công việc.'}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-700">Kỹ năng phân tích:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCandidate.aiScreening?.matchedSkills || []).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      ✓ {s}
                    </span>
                  ))}
                  {(activeCandidate.aiScreening?.missingSkills || []).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                      ✗ Thiếu: {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-700">Đường dẫn CV:</div>
                <a
                  href={activeCandidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 hover:underline font-medium"
                >
                  <span>Xem file CV đính kèm</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[var(--border)] bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleQuickStatusChange(activeCandidate._id, 'REJECTED')}
                className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold"
              >
                Từ chối hồ sơ
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const c = activeCandidate;
                    setActiveCandidate(null);
                    handleOpenInterviewModal(c);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-2xs"
                >
                  Mời phỏng vấn
                </button>
                <button
                  onClick={() => handleQuickStatusChange(activeCandidate._id, 'OFFER')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs"
                >
                  Tuyển dụng (Offer)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Thêm ứng viên nội bộ */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg app-surface p-6 rounded-2xl shadow-xl border border-[var(--border)] text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-base font-bold text-[var(--text)]">Thêm hồ sơ ứng viên nội bộ</h2>
              <button onClick={closeApply} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApplyCandidate} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Vị trí ứng tuyển</label>
                <select
                  value={applyTargetJobId || selectedJob?._id || ''}
                  onChange={(e) => setApplyTargetJobId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
                >
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Họ và tên <span className="text-rose-500">*</span></label>
                  <input
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
                    placeholder="nguyenvana@gmail.com"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Số điện thoại</label>
                <input
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
                  placeholder="0912 345 678"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Kỹ năng & Tóm tắt kinh nghiệm</label>
                <textarea
                  rows={3}
                  value={applicantCVText}
                  onChange={(e) => setApplicantCVText(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] resize-none"
                  placeholder="Liệt kê kỹ năng và số năm kinh nghiệm để AI phân tích..."
                />
              </div>

              {applyMessage && (
                <div className="p-3 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                  {applyMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button type="button" onClick={closeApply} className="px-4 py-2 rounded-lg border border-slate-300">
                  Hủy
                </button>
                <button disabled={submitting} className="px-5 py-2 rounded-lg bg-teal-700 text-white font-semibold">
                  {submitting ? 'Đang phân tích AI…' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Giải thích quy tắc AI Sàng Lọc */}
      {showScoring && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-sm bg-[var(--surface)] p-6 shadow-xl border-l border-[var(--border)] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-bold text-[var(--text)]">Cơ chế AI sàng lọc hồ sơ (ATS-lite)</h2>
              <button onClick={() => setShowScoring(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-slate-600 leading-relaxed">
              <p>
                <strong>1. Phân tích đối chiếu từ khóa:</strong> Hệ thống tự động trích xuất các kỹ năng chuyên môn từ hồ sơ ứng viên và so khớp với danh mục kỹ năng yêu cầu trong bản mô tả công việc (Job Description).
              </p>
              <p>
                <strong>2. Chấm điểm độ phù hợp (Match Score %):</strong> Ứng viên đạt từ điểm sàn ({selectedJob?.requirements.passingScore || 70}%) trở lên sẽ được phân loại vào nhóm <span className="text-emerald-700 font-semibold">ĐÃ SÀNG LỌC (ACCEPTED)</span> để ưu tiên phỏng vấn.
              </p>
              <p>
                <strong>3. Quyền quyết định cuối cùng:</strong> Điểm số AI chỉ mang tính chất tham mưu, hỗ trợ lọc hàng trăm hồ sơ trong vài giây. Quyết định duyệt mời phỏng vấn hoặc tuyển dụng thuộc thẩm quyền của <strong>HR Manager và CEO</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Modal 5: Cấu hình Doanh Nghiệp & Tọa độ GPS Thực Tế */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-xs max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  Cấu hình Doanh nghiệp & Tọa độ GPS Thật
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật tên doanh nghiệp và tọa độ văn phòng thực tế để chấm công GPS.
                </p>
              </div>
              <button onClick={() => setIsCompanyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyConfig} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tên doanh nghiệp chính thức</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                  placeholder="Ví dụ: Công ty Cổ phần Công nghệ PeopleInsight"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    Vị trí Geofencing Chấm công GPS
                  </span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingGps}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isGettingGps ? 'Đang định vị…' : '📍 Lấy GPS hiện tại'}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-teal-800 text-[11px]">Tên địa điểm / Chi nhánh</label>
                  <input
                    type="text"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white text-xs"
                    placeholder="Trụ sở chính"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-medium text-teal-800 text-[11px]">Vĩ độ (Latitude)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={gpsLat}
                      onChange={(e) => setGpsLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-teal-800 text-[11px]">Kinh độ (Longitude)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={gpsLng}
                      onChange={(e) => setGpsLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-teal-800 text-[11px]">Bán kính chấm công hợp lệ (mét)</label>
                  <input
                    type="number"
                    value={gpsRadius}
                    onChange={(e) => setGpsRadius(parseInt(e.target.value) || 100)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white text-xs"
                    placeholder="100"
                  />
                  <div className="text-[10px] text-teal-700">Nhân viên đứng trong phạm vi này mới có thể bấm chấm công GPS.</div>
                </div>
              </div>

              {gpsSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{gpsSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingCompany}
                  className="px-5 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 shadow-sm disabled:opacity-50"
                >
                  {isSavingCompany ? 'Đang lưu…' : 'Lưu cấu hình thực tế'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Tạo Tin Tuyển Dụng Thật */}
      {isCreateJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-xs max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600" />
                  Tạo Tin Tuyển Dụng Mới Thực Tế
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vị trí sẽ tự động hiển thị ra Cổng nghề nghiệp công khai để ứng viên nộp hồ sơ.
                </p>
              </div>
              <button onClick={() => setIsCreateJobOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewJob} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tiêu đề vị trí tuyển dụng <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-semibold"
                  placeholder="Ví dụ: Kỹ Sư Trí Tuệ Nhân Tạo (AI Engineer)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mô tả công việc (Job Description)</label>
                <textarea
                  rows={3}
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] resize-none"
                  placeholder="Mô tả trách nhiệm công việc, yêu cầu dự án..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kỹ năng chuyên môn yêu cầu (Phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
                  placeholder="React, TypeScript, Python, PyTorch, MongoDB..."
                />
                <div className="text-[10px] text-slate-400">AI ATS sẽ dùng danh sách kỹ năng này để chấm điểm khớp % với CV của ứng viên.</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kinh nghiệm tối thiểu (năm)</label>
                  <input
                    type="number"
                    min="0"
                    value={newJobExp}
                    onChange={(e) => setNewJobExp(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Điểm đậu AI tối thiểu (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newJobScore}
                    onChange={(e) => setNewJobScore(parseInt(e.target.value) || 70)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-semibold text-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lương tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={newJobMinSalary}
                    onChange={(e) => setNewJobMinSalary(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lương tối đa (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={newJobMaxSalary}
                    onChange={(e) => setNewJobMaxSalary(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateJobOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingJob}
                  className="px-5 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 shadow-sm disabled:opacity-50"
                >
                  {isCreatingJob ? 'Đang tạo…' : 'Tạo vị trí tuyển dụng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

