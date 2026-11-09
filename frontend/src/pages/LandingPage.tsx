import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  LogIn,
  LayoutDashboard,
  X,
  FileText,
  Search,
  ChevronRight,
  Upload,
  Coffee,
  GraduationCap,
  Music,
  Radio,
  Tent,
  Heart,
  Flame,
  Check,
  Play,
  Volume2,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  const { isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [companyLocations, setCompanyLocations] = useState<{ locationId: string; name: string }[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Interactive Culture Tab State
  const [activeCultureTab, setActiveCultureTab] = useState<'learning' | 'pantry' | 'radio' | 'travel' | 'sports'>('learning');

  // Mini Radio Playing State
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);

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

  // Dữ liệu văn hóa doanh nghiệp thực tế, sống động
  const cultureData = {
    learning: {
      tag: 'Nâng tầm năng lực',
      title: 'Học tập không giới hạn & Tài trợ chứng chỉ 100%',
      desc: 'Tại PeopleInsight, mỗi kỹ sư và chuyên viên đều có quỹ học tập cá nhân 20.000.000 VNĐ/năm. Chúng tôi tài trợ toàn bộ chi phí thi các chứng chỉ quốc tế uy tín (AWS Solutions Architect, Google Cloud AI, PMP, ISTQB). Các buổi Tech Talk và AI Reading Group diễn ra định kỳ chiều thứ Năm hàng tuần, nơi mọi ý tưởng đột phá đều được lắng nghe và nuôi dưỡng.',
      stats: ['100% Tài trợ chứng chỉ', '20M Quỹ học tập/năm', 'Weekly Tech Talk'],
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      caption: 'Buổi chia sẻ chuyên sâu về Generative AI & MLOps tại văn phòng công ty',
    },
    pantry: {
      tag: 'Không gian sống',
      title: 'Pantry Barista, Cà phê pha máy & Snack bar miễn phí',
      desc: 'Khu vực Pantry rộng rãi với máy pha cà phê hạt cao cấp nhập khẩu từ Ý, tủ lạnh luôn đầy ắp sữa hạt, hoa quả tươi theo mùa, bánh ngọt và trà thảo mộc. Thiết kế không gian mở ngập tràn ánh sáng tự nhiên, là nơi lý tưởng để tái tạo năng lượng hoặc trò chuyện cùng đồng nghiệp sau những giờ tập trung cao độ.',
      stats: ['Cà phê Specialty miễn phí', 'Hoa quả tươi mỗi ngày', 'Khu Nap Pod nghỉ trưa'],
      image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      caption: 'Khu Pantry & Relax tại văn phòng công ty',
    },
    radio: {
      tag: 'Thanh âm kết nối',
      title: 'Radio nội bộ "Insight Station" phát sóng chiều thứ Sáu',
      desc: 'Chương trình phát thanh do chính các thành viên PeopleInsight biên tập và dẫn dắt. Nơi gửi gắm những lời cảm ơn đồng đội đã hỗ trợ vượt qua deadline sprint, chúc mừng sinh nhật, chia sẻ những câu chuyện dở khóc dở cười của nghề lập trình và tuyển dụng, cùng playlist âm nhạc acoustic thư giãn trước khi bước vào kỳ nghỉ cuối tuần.',
      stats: ['Phát sóng 16:30 thứ 6', 'Hòm thư gửi lời nhắn ẩn danh', 'Playlist nhạc acoustic'],
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
      caption: 'Studio thu âm Podcast Insight Station tại văn phòng',
    },
    travel: {
      tag: 'Gắn kết bền chặt',
      title: 'Company Trip 5 sao hàng năm & Dã ngoại quý',
      desc: 'Mỗi năm một lần, toàn thể đại gia đình PeopleInsight cùng nhau khám phá những bãi biển đẹp nhất Việt Nam (Đà Nẵng, Phú Quốc, Nha Trang) với kỳ nghỉ dưỡng tại resort 5 sao trọn gói. Ngoài ra, mỗi quý từng bộ phận đều có ngân sách riêng để tổ chức cắm trại dã ngoại, chèo SUP, trekking hoặc tiệc nướng BBQ ấm cúng.',
      stats: ['Kỳ nghỉ 5 sao toàn công ty', 'Quỹ Teambuilding hàng quý', 'Party sinh nhật hàng tháng'],
      image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
      caption: 'Kỷ niệm Summer Trip rực rỡ tại bãi biển Phú Quốc',
    },
    sports: {
      tag: 'Sức khỏe & Đam mê',
      title: 'Các câu lạc bộ thể thao & Âm nhạc sôi động',
      desc: 'Cân bằng giữa công việc và sức khỏe là tôn chỉ hàng đầu. Công ty tài trợ sân bóng đá hàng tuần cho FC PeopleInsight, sân cầu lông thứ Tư, CLB chạy bộ Road Runners và nhóm nhạc Acoustic Band với đầy đủ nhạc cụ (Guitar, Cajon, Piano điện). Giải thể thao nội bộ "Insight Cup" tranh tài nảy lửa hàng năm với phần thưởng cực kỳ hấp dẫn.',
      stats: ['Tài trợ 100% tiền sân tập', 'CLB Bóng đá & Cầu lông', 'Band nhạc Acoustic'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      caption: 'Giải bóng đá nội bộ Insight League tranh cúp vàng hàng năm',
    },
  };

  // Tải danh sách việc làm & địa điểm công khai
  useEffect(() => {
    fetchPublicJobs();
    fetchPublicLocations();
  }, []);

  const fetchPublicLocations = async () => {
    try {
      const res = await axios.get('/api/recruitment/public/locations');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setCompanyLocations(res.data.data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách địa điểm công khai:', err);
    }
  };

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

  const locationDisplayText = useMemo(() => {
    if (companyLocations.length > 0 && companyLocations[0].name) {
      return companyLocations[0].name;
    }
    return 'Văn phòng công ty';
  }, [companyLocations]);

  const handleOpenApplyModal = (job: JobItem) => {
    setSelectedJob(job);
    setApplySuccessMessage(null);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại liên hệ.');
      return;
    }

    if (!cvUrl.trim() && !cvFile) {
      alert('Vui lòng tải lên tệp CV (PDF/Word) hoặc cung cấp liên kết hồ sơ LinkedIn/Drive.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('candidateName', fullName.trim());
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
          ? ` Hệ thống AI ATS đã phân tích hồ sơ của bạn đạt ${res.data.data.aiScore}% điểm phù hợp!`
          : '';
        setApplySuccessMessage(
          `Cảm ơn bạn ${fullName}! Hồ sơ ứng tuyển của bạn đã được tiếp nhận thành công.${extraAiInfo} Đội ngũ tuyển dụng sẽ liên hệ phỏng vấn qua email: ${email} trong vòng 24 giờ làm việc.`
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

  const filteredJobs = jobs.filter((j) => {
    const matchesKeyword =
      j.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      j.jobDescription.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (j.requirements?.skills || []).some((s) => s.toLowerCase().includes(searchKeyword.toLowerCase()));

    if (!matchesKeyword) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'TECH') {
      return /engineer|developer|frontend|backend|ai|python|react/i.test(j.title);
    }
    if (selectedCategory === 'HR') {
      return /hr|tuyển dụng|nhân sự|chính sách/i.test(j.title);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP LIVE TICKER & HOTLINE */}
      <div className="bg-gradient-to-r from-blue-950 via-[#0e162b] to-indigo-950 border-b border-indigo-900/40 text-[11px] sm:text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-slate-300">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400 shrink-0">TUYỂN DỤNG:</span>
            <span className="truncate">
              Chào đón {jobs.length > 0 ? `${jobs.length} vị trí việc làm` : 'các vị trí việc làm'} tại {locationDisplayText} • Đãi ngộ cạnh tranh, OT miễn thuế 100%
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-medium text-slate-300">{locationDisplayText}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-medium">tuyendung@peopleinsight.vn</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER NAVBAR ĐẲNG CẤP GLASSMORPHISM */}
      <header className="sticky top-0 z-40 bg-[#070b14]/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                PeopleInsight <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">AI</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  CAREERS &amp; CULTURE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Môi trường công nghệ nhân sự chuẩn mực 2026
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-indigo-400 transition-colors">Về chúng tôi</a>
            <a href="#culture" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <span>Đời sống &amp; Văn hóa</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            </a>
            <a href="#perks" className="hover:text-indigo-400 transition-colors">Đãi ngộ 2026</a>
            <a href="#jobs" className="hover:text-indigo-400 transition-colors text-white font-semibold">
              Cơ hội việc làm ({jobs.length})
            </a>
            <a href="#testimonials" className="hover:text-indigo-400 transition-colors">Người thật việc thật</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Vào Bảng điều khiển</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập nhân viên</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION: KHÔNG GIAN SÔI ĐỘNG, TRUYỀN CẢM HỨNG */}
      <section id="about" className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Nơi công nghệ AI chạm vào cảm xúc &amp; con người</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Kiến tạo tương lai nhân sự cùng đội ngũ{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  PeopleInsight AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Không chỉ là một công việc. Đây là hành trình phát triển cùng đội ngũ kỹ sư phần mềm, chuyên gia thị giác máy tính và HR Tech tại {locationDisplayText}. Trải nghiệm văn hóa minh bạch, tôn trọng tự do sáng tạo và chế độ đãi ngộ chuẩn mực pháp lý 2026.
              </p>

              {/* Call to action buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#jobs"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Khám phá các vị trí tuyển dụng</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#culture"
                  className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-medium border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Trải nghiệm văn hóa nội bộ</span>
                </a>
              </div>

              {/* Thống kê ấn tượng thực tế */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">98.4%</div>
                  <div className="text-xs text-slate-400 mt-0.5">Nhân sự gắn bó &gt; 2 năm</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">22 ngày</div>
                  <div className="text-xs text-slate-400 mt-0.5">Nghỉ phép có lương/năm</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
                  <div className="text-xs text-slate-400 mt-0.5">OT miễn thuế TNCN 2026</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">Top 10</div>
                  <div className="text-xs text-slate-400 mt-0.5">Môi trường HR Tech 2026</div>
                </div>
              </div>
            </div>

            {/* Visual Mosaic sôi động bên phải */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"
                  alt="Đội ngũ PeopleInsight AI làm việc tại văn phòng"
                  className="w-full h-[380px] sm:h-[420px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent"></div>

                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#0d1322]/90 backdrop-blur-md border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Không gian làm việc {locationDisplayText}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      LIVE • HÀ NỘI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Nơi mỗi buổi sáng bắt đầu bằng ly cà phê thơm lừng, trao đổi thân thiện không rào cản và sự tự do tuyệt đối trong giải pháp công nghệ.
                  </p>
                </div>
              </div>

              {/* Floating Badge chân thực */}
              <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 backdrop-blur-md shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  AI
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Chấm điểm CV bằng ATS</div>
                  <div className="text-[10px] text-indigo-300">Phản hồi ứng viên trong 24h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KHỐI ĐỜI SỐNG & VĂN HÓA DOANH NGHIỆP: TƯƠNG TÁC SỐNG ĐỘNG (INTERACTIVE HUB) */}
      <section id="culture" className="py-20 lg:py-28 border-b border-slate-800 bg-[#090e1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              Văn hóa &amp; Con người
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Đời sống tại PeopleInsight: Năng động, Thấu hiểu &amp; Tràn đầy cảm hứng
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Chúng tôi không đo lường giá trị bằng số giờ bạn ngồi tại văn phòng, mà bằng sự hứng khởi mỗi sáng thức dậy và những bước tiến vượt bậc của bạn trong sự nghiệp.
            </p>
          </div>

          {/* Bố cục 2 cột tương tác chuẩn phong cách hiện đại */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột trái: Danh sách các tab chọn lựa có Icon sinh động */}
            <div className="lg:col-span-5 space-y-3">
              <button
                onClick={() => setActiveCultureTab('learning')}
                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                  activeCultureTab === 'learning'
                    ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'learning' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Hoạt động đào tạo &amp; Phát triển</div>
                    <div className="text-[11px] opacity-75">Tài trợ 100% thi chứng chỉ quốc tế</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'learning' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
              </button>

              <button
                onClick={() => setActiveCultureTab('pantry')}
                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                  activeCultureTab === 'pantry'
                    ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'pantry' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Khu Relax &amp; Pantry Barista</div>
                    <div className="text-[11px] opacity-75">Cà phê hạt pha máy, hoa quả &amp; snack</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'pantry' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
              </button>

              <button
                onClick={() => setActiveCultureTab('radio')}
                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                  activeCultureTab === 'radio'
                    ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'radio' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Radio nội bộ "Insight Station"</div>
                    <div className="text-[11px] opacity-75">Thanh âm kết nối chiều thứ Sáu hàng tuần</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'radio' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
              </button>

              <button
                onClick={() => setActiveCultureTab('travel')}
                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                  activeCultureTab === 'travel'
                    ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'travel' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Tent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Company Trip 5 sao &amp; Dã ngoại quý</div>
                    <div className="text-[11px] opacity-75">Khám phá Đà Nẵng, Phú Quốc &amp; cắm trại</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'travel' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
              </button>

              <button
                onClick={() => setActiveCultureTab('sports')}
                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                  activeCultureTab === 'sports'
                    ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'sports' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">CLB Thể thao &amp; Acoustic Band</div>
                    <div className="text-[11px] opacity-75">Bóng đá, Cầu lông &amp; ban nhạc giao lưu</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'sports' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
              </button>
            </div>

            {/* Cột phải: Khung hiển thị ĐỘNG hình ảnh thực tế và thuyết minh hấp dẫn */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="relative rounded-2xl overflow-hidden h-[280px] sm:h-[340px] border border-slate-800">
                  <img
                    src={cultureData[activeCultureTab].image}
                    alt={cultureData[activeCultureTab].title}
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-md">
                      {cultureData[activeCultureTab].tag}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-xs text-slate-300 font-medium italic">
                    📷 {cultureData[activeCultureTab].caption}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {cultureData[activeCultureTab].title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {cultureData[activeCultureTab].desc}
                  </p>

                  {/* Điểm nổi bật Pills */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {cultureData[activeCultureTab].stats.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>

                  {/* Widget thử nghe Radio trực tiếp nếu đang chọn tab radio */}
                  {activeCultureTab === 'radio' && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsRadioPlaying(!isRadioPlaying)}
                          className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition"
                        >
                          {isRadioPlaying ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div>
                          <div className="font-semibold text-white">Insight Station #42: Chuyện người làm AI &amp; Mùa deadline</div>
                          <div className="text-[10px] text-indigo-400">{isRadioPlaying ? 'Đang phát trực tuyến...' : 'Bấm để nghe thử bản tin'}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">14:28 min</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ĐẶC QUYỀN ĐÃI NGỘ & CHÍNH SÁCH CHUẨN 2026 */}
      <section id="perks" className="py-20 lg:py-24 border-b border-slate-800 bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Đãi ngộ thực chất
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Chính sách phúc lợi chuẩn mực pháp lý 2026
            </h2>
            <p className="text-sm text-slate-400">
              Mọi quyền lợi của bạn được minh bạch hóa và tự động hóa qua hệ thống tính lương PeopleInsight Engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Thu nhập cạnh tranh &amp; Thưởng quý</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lương cạnh tranh theo chuẩn thị trường công nghệ, xét tăng lương 2 lần/năm và thưởng hiệu quả kinh doanh (Bonus tháng 13, 14).
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Bảo hiểm sức khỏe Care Premium</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đóng đầy đủ BHXH/BHYT/BHTN theo 100% lương cơ bản, kèm gói bảo hiểm sức khỏe ngoại trú và nội trú tại các bệnh viện quốc tế hàng đầu.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-purple-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Thời gian linh hoạt &amp; Hybrid Work</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thời gian làm việc từ Thứ 2 đến Thứ 6. Hỗ trợ làm việc từ xa (WFH) 2 ngày/tháng, không chấm công gò bó nhờ Kiosk FaceID và GPS di động.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Chế độ OT miễn thuế 100%</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tuân thủ nghiêm ngặt Điều 98 BLLĐ: Tiền làm thêm giờ được miễn thuế TNCN toàn bộ theo quy định 2026, phụ cấp ăn ca và làm đêm đầy đủ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NGƯỜI THẬT VIỆC THẬT (AUTHENTIC TESTIMONIALS) */}
      <section id="testimonials" className="py-20 lg:py-24 border-b border-slate-800 bg-[#090e1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              Chia sẻ từ nội bộ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Những người đang cùng tạo nên PeopleInsight
            </h2>
            <p className="text-sm text-slate-400">
              Lắng nghe cảm nhận chân thực nhất từ các kỹ sư và chuyên viên đang cống hiến mỗi ngày tại công ty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "Ở PeopleInsight, bạn không bị bó buộc trong các quy trình cứng nhắc. Mọi ý tưởng về Generative AI hay thị giác máy tính đều được đưa vào thử nghiệm trên sản phẩm thật chỉ sau vài tuần chạy sprint."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Trần Minh Đức"
                  className="w-10 h-10 rounded-full object-cover border border-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Trần Minh Đức</div>
                  <div className="text-[10px] text-indigo-400">Senior AI Engineer (Gắn bó 3 năm)</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "Chính sách lương minh bạch và chuẩn mực 2026 giúp phòng HR chúng mình tự tin đối thoại công bằng với từng ứng viên. Không bao giờ có chuyện mập mờ lương gross-net hay làm thêm giờ không được tính đúng."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
                  alt="Lê Thu Thảo"
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Lê Thu Thảo</div>
                  <div className="text-[10px] text-emerald-400">HR Specialist &amp; Talent Acquisition</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "Văn hóa làm việc linh hoạt, đồng nghiệp trẻ trung, sếp luôn lắng nghe và sẵn sàng mời pizza mỗi khi hoàn thành sprint lớn. Đặc biệt khu Pantry pha cà phê hạt cực đỉnh giúp mình luôn tỉnh táo sáng tạo."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="Đặng Hoàng Nam"
                  className="w-10 h-10 rounded-full object-cover border border-purple-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Đặng Hoàng Nam</div>
                  <div className="text-[10px] text-purple-400">Frontend Lead &amp; UI Specialist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DANH SÁCH VIỆC LÀM & NỘP CV TRỰC TUYẾN (JOB BOARD) */}
      <section id="jobs" className="py-20 lg:py-28 flex-1 bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Cơ hội gia nhập</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Các vị trí đang mở tuyển dụng</h2>
            </div>

            {/* Ô tìm kiếm từ khóa */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm vị trí, kỹ năng (AI, React, Python)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả các vị trí ({jobs.length})
            </button>
            <button
              onClick={() => setSelectedCategory('TECH')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'TECH'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Công nghệ &amp; AI (Software &amp; MLOps)
            </button>
            <button
              onClick={() => setSelectedCategory('HR')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'HR'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Quản trị Nhân sự &amp; Vận hành
            </button>
          </div>

          {/* Danh sách thẻ công việc */}
          {isLoadingJobs ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin mx-auto" />
              <p className="text-xs">Đang tải danh sách cơ hội nghề nghiệp mới nhất...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
              <p className="text-sm font-medium">Không tìm thấy vị trí tuyển dụng phù hợp với từ khóa "{searchKeyword}"</p>
              <button
                onClick={() => setSearchKeyword('')}
                className="text-xs text-indigo-400 hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          {job.departmentId?.name || 'Khối Công Nghệ'}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mt-2">
                          {job.title}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                        {job.salaryRange ? `${formatVND(job.salaryRange.min)} - ${formatVND(job.salaryRange.max)}` : 'Thỏa thuận'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {job.jobDescription}
                    </p>

                    {/* Kỹ năng yêu cầu */}
                    {job.requirements?.skills && job.requirements.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.requirements.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{companyLocations.length > 0 ? companyLocations[0].name : 'Văn phòng chính'}</span>
                    </div>

                    <button
                      onClick={() => handleOpenApplyModal(job)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      <span>Ứng tuyển ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. MODAL ỨNG TUYỂN TRỰC TUYẾN KÈM AI ATS */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Nộp hồ sơ ứng tuyển</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedJob.title}</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccessMessage ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="leading-relaxed">{applySuccessMessage}</p>
                <button
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                >
                  Đóng cửa sổ
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Họ và tên <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Email liên hệ <span className="text-rose-400">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="an.nguyen@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Số điện thoại <span className="text-rose-400">*</span></label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Số năm kinh nghiệm</label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Ví dụ: 2 năm làm việc với React/NodeJS"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Kỹ năng chuyên môn chính</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Python, ReactJS, MongoDB, MediaPipe, Docker..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Giới thiệu ngắn về bản thân</label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tóm tắt kinh nghiệm nổi bật hoặc điều bạn mong muốn đóng góp..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Tải CV File hoặc URL */}
                <div className="space-y-2 pt-1">
                  <label className="text-slate-300 font-medium">Tệp CV đính kèm (PDF / Word) <span className="text-rose-400">*</span></label>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 text-center hover:border-indigo-500 transition">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      id="cvFileInput"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCvFile(file);
                      }}
                    />
                    <label htmlFor="cvFileInput" className="cursor-pointer space-y-2 block">
                      <Upload className="w-7 h-7 text-indigo-400 mx-auto" />
                      <div className="text-xs text-slate-300">
                        {cvFile ? <b className="text-emerald-400">{cvFile.name}</b> : 'Bấm để chọn tệp CV từ thiết bị của bạn'}
                      </div>
                      <div className="text-[10px] text-slate-400">Định dạng hỗ trợ: PDF, DOCX (Tối đa 10MB)</div>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400">Hoặc liên kết CV trực tuyến (Google Drive, LinkedIn)</label>
                  <input
                    type="url"
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang phân tích CV qua AI ATS...' : 'Gửi hồ sơ ứng tuyển'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. CHÂN TRANG ĐẲNG CẤP & ĐẦY ĐỦ THÔNG TIN DOANH NGHIỆP */}
      <footer className="bg-[#05080f] border-t border-slate-800/80 text-xs text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <span className="font-bold text-base text-white">PeopleInsight AI</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Nền tảng quản trị nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo, tối ưu hóa điểm danh FaceID Kiosk, tính lương chuẩn mực 2026 và dự báo thôi việc ML.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Văn phòng làm việc</h4>
              <ul className="space-y-2 text-slate-400 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold shrink-0">📍</span>
                  <span><strong className="text-slate-300">Trụ sở chính:</strong> {locationDisplayText}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Liên hệ tuyển dụng</h4>
              <ul className="space-y-2 text-slate-400 leading-relaxed">
                <li>Hotline: <span className="text-indigo-400 font-semibold">(+84) 24-7303-9996</span></li>
                <li>Email HR: <span className="text-indigo-400 font-semibold">tuyendung@peopleinsight.vn</span></li>
                <li>Thời gian làm việc: Thứ Hai - Thứ Sáu (08:30 - 17:30)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Đồ án Tốt nghiệp CNTT</h4>
              <p className="text-slate-400 leading-relaxed">
                Trường Đại học Nguyễn Trãi — Khoa CNTT &amp; Chuyển đổi số.
                <br />Sinh viên: <strong>Nguyễn Anh Tuấn</strong> (MSV: 2310900113).
                <br />GVHD: <strong>ThS. Lê Trọng Nhất</strong>.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>© 2026 PeopleInsight AI. Mọi quyền được bảo lưu theo Luật Bảo vệ dữ liệu cá nhân.</div>
            <div className="flex items-center gap-6">
              <a href="#about" className="hover:text-indigo-400 transition">Về chúng tôi</a>
              <a href="#culture" className="hover:text-indigo-400 transition">Văn hóa doanh nghiệp</a>
              <a href="#perks" className="hover:text-indigo-400 transition">Chính sách 2026</a>
              <a href="#jobs" className="hover:text-indigo-400 transition">Cơ hội việc làm</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
