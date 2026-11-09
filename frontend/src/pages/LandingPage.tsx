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
import { formatVND } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface JobPosting {
  _id: string;
  title: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  jobDescription: string;
  requirements?: {
    experienceYears?: number;
    skills?: string[];
    education?: string;
  };
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: string;
  createdAt?: string;
}

interface CompanyLocation {
  locationId: string;
  name: string;
  address?: string;
  isPrimary?: boolean;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Interactive Culture Tabs
  const [activeCultureTab, setActiveCultureTab] = useState<
    'learning' | 'pantry' | 'radio' | 'travel' | 'sports'
  >('learning');
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);

  // Modal Ứng tuyển
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [summary, setSummary] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Văn hóa & Đời sống thực tế
  const cultureData = {
    learning: {
      tag: 'Phát triển chuyên môn',
      title: 'Đào tạo liên tục & Tài trợ 100% chứng chỉ quốc tế',
      desc: 'Tại PeopleInsight, mỗi thành viên đều có ngân sách học tập $1,500/năm. Chúng tôi khuyến khích bạn thử thách bản thân với các chứng chỉ AWS, Google Cloud, PMP hoặc các khóa học Deep Learning chuyên sâu. Định kỳ hàng tuần đều có buổi Tech Sharing do chính các kỹ sư chia sẻ về các giải pháp xử lý dữ liệu lớn, thị giác máy tính và AI Agents.',
      stats: ['Ngân sách $1,500/năm', 'Buổi Tech Sharing thứ Năm', 'Tài trợ 100% thi chứng chỉ'],
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      caption: 'Buổi Tech Sharing và thảo luận giải pháp AI Agent tại phòng hội thảo',
    },
    pantry: {
      tag: 'Không gian thư giãn',
      title: 'Khu Pantry Barista với cà phê hạt pha máy & hoa quả tươi',
      desc: 'Một ngày làm việc hiệu quả bắt đầu từ một tách cà phê thơm ngon. Khu Pantry mở của chúng tôi được trang bị máy pha cà phê chuyên nghiệp Breville, đầy đủ các loại hạt Arabica Cầu Đất hảo hạng, trà thảo mộc, tủ lạnh ngập tràn sữa chua, hoa quả theo mùa và đồ ăn nhẹ miễn phí 24/7 để tiếp thêm năng lượng sáng tạo.',
      stats: ['Cà phê pha máy Espresso', 'Hoa quả tươi & snack 24/7', 'Khu nghỉ ngơi & đọc sách'],
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      caption: 'Góc Pantry ngập tràn ánh sáng tự nhiên và cây xanh',
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
      console.warn('Lỗi tải danh sách việc làm:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const locationDisplayText = useMemo(() => {
    if (companyLocations.length > 0) {
      const primaryLoc = companyLocations.find((l) => l.isPrimary) || companyLocations[0];
      return primaryLoc.name;
    }
    return 'Trụ sở chính — Hà Nội';
  }, [companyLocations]);

  const handleOpenApplyModal = (job: JobPosting) => {
    setSelectedJob(job);
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setPhone('');
    setExperience('');
    setSkills('');
    setSummary('');
    setCvUrl('');
    setCvFile(null);
    setApplySuccessMessage(null);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!cvFile && !cvUrl) {
      alert('Vui lòng chọn tải tệp CV lên hoặc cung cấp đường dẫn liên kết hồ sơ của bạn!');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('candidateName', fullName);
      formData.append('candidateEmail', email);
      if (phone) {
        formData.append('phone', phone);
        formData.append('candidatePhone', phone);
      }
      if (experience) formData.append('experience', experience);
      if (skills) formData.append('skills', skills);
      if (summary) formData.append('summary', summary);
      if (cvUrl) formData.append('cvUrl', cvUrl);
      if (cvFile) formData.append('cvFile', cvFile);

      const endpoint = `/api/recruitment/public/jobs/${selectedJob._id}/apply`;
      const res = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setApplySuccessMessage(
          `Cảm ơn bạn ${fullName}! Hồ sơ của bạn đã được chuyển đến hệ thống sàng lọc tự động ATS của PeopleInsight AI. Đội ngũ tuyển dụng sẽ phản hồi trong vòng 24–48h tới email ${email}.`
        );
      } else {
        alert(res.data?.message || 'Có lỗi xảy ra khi nộp hồ sơ.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi gửi hồ sơ ứng tuyển. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(kw);
      const matchDept = j.departmentId?.name?.toLowerCase().includes(kw);
      const matchDesc = j.jobDescription.toLowerCase().includes(kw);
      const matchSkill = j.requirements?.skills?.some((s) => s.toLowerCase().includes(kw));
      if (!matchTitle && !matchDept && !matchDesc && !matchSkill) return false;
    }

    if (selectedCategory !== 'ALL') {
      const titleLower = j.title.toLowerCase();
      if (selectedCategory === 'TECH') {
        return (
          titleLower.includes('developer') ||
          titleLower.includes('engineer') ||
          titleLower.includes('ai') ||
          titleLower.includes('kỹ sư') ||
          titleLower.includes('lập trình') ||
          titleLower.includes('frontend') ||
          titleLower.includes('backend')
        );
      }
      if (selectedCategory === 'HR') {
        return (
          titleLower.includes('hr') ||
          titleLower.includes('nhân sự') ||
          titleLower.includes('tuyển dụng') ||
          titleLower.includes('c&b') ||
          titleLower.includes('hành chính')
        );
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans selection:bg-lime selection:text-ink transition-colors">
      {/* 1. TOP LIVE TICKER — NĂNG ĐỘNG VÀ BẮT MẮT */}
      <div className="bg-primary text-on-primary border-b-2 border-line text-xs py-2 px-4 font-mono font-semibold">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-lime shrink-0">TUYỂN DỤNG 2026:</span>
            <span className="truncate">
              Chào đón {jobs.length > 0 ? `${jobs.length} vị trí việc làm` : 'các tài năng công nghệ'} tại {locationDisplayText} • Đãi ngộ cạnh tranh, OT miễn thuế 100%
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 text-xs">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-lime shrink-0" />
              <span>{locationDisplayText}</span>
            </span>
            <span>•</span>
            <span className="text-lime font-bold">tuyendung@peopleinsight.vn</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER NAVBAR NEOBRUTALISM ĐẬM CHẤT NGHỆ THUẬT */}
      <header className="sticky top-0 z-40 bg-surface border-b-2 border-line transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Cuộn lên đầu trang"
          >
            <div className="w-11 h-11 rounded-2xl bg-lime text-ink border-2 border-line flex items-center justify-center shadow-hard-sm">
              <Sparkles className="w-6 h-6 text-ink" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-fg font-display flex items-center gap-2">
                PeopleInsight <span className="text-primary">AI</span>
              </div>
              <div className="text-[11px] text-muted hidden sm:block font-medium">
                Môi trường công nghệ nhân sự chuẩn mực pháp lý 2026
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-fg uppercase tracking-wider font-mono">
            <a href="#about" className="hover:text-primary transition-colors">Về chúng tôi</a>
            <a href="#culture" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <span>Đời sống &amp; Văn hóa</span>
              <span className="w-2 h-2 rounded-full bg-lime border border-line"></span>
            </a>
            <a href="#perks" className="hover:text-primary transition-colors">Đãi ngộ 2026</a>
            <a href="#jobs" className="hover:text-primary transition-colors text-primary flex items-center gap-1">
              <span>Việc làm</span>
              <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary text-[10px] font-bold">
                {jobs.length}
              </span>
            </a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Người thật việc thật</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-ink bg-lime border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-ink" strokeWidth={2.2} />
                <span>Vào Bảng điều khiển</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-ink bg-lime border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-ink" strokeWidth={2.2} />
                <span>Đăng nhập nhân viên</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION: BÙNG NỔ NĂNG LƯỢNG — SÔI ĐỘNG & NỔI BẬT */}
      <section id="about" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b-2 border-line bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-peach text-ink border-2 border-line text-xs font-bold shadow-hard-sm uppercase tracking-wider">
                <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>Nơi công nghệ AI chạm vào cảm xúc &amp; con người</span>
              </div>

              {/* Huge Bold Title */}
              <h1 className="text-4xl sm:text-6xl lg:text-[4rem] font-black text-fg font-display tracking-tight leading-[1.08]">
                Kiến tạo tương lai nhân sự cùng đội ngũ{' '}
                <span className="bg-lime text-ink border-2 border-line px-3 py-1 rounded-2xl shadow-hard inline-block rotate-[-1.5deg] mt-1">
                  PeopleInsight AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted font-medium leading-relaxed max-w-2xl">
                Không chỉ là một công việc. Đây là hành trình phát triển cùng đội ngũ kỹ sư phần mềm, chuyên gia thị giác máy tính và AI Agents tại <strong className="text-fg font-bold">{locationDisplayText}</strong>. Trải nghiệm văn hóa minh bạch, tôn trọng tự do sáng tạo và chính sách đãi ngộ chuẩn mực pháp lý 2026.
              </p>

              {/* Call to action buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#jobs"
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl text-sm font-bold text-on-primary bg-primary border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" strokeWidth={2.5} />
                  <span>Khám phá các vị trí tuyển dụng</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </a>

                <a
                  href="#culture"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold border-2 border-line bg-surface hover:bg-surface-2 text-fg shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Trải nghiệm văn hóa nội bộ</span>
                </a>
              </div>

              {/* 4 Thống kê ấn tượng dạng Bento box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
                <div className="p-3.5 rounded-2xl bg-lime text-ink border-2 border-line shadow-hard">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">98.4%</div>
                  <div className="text-[11px] font-bold mt-0.5 opacity-90 leading-tight">Nhân sự gắn bó &gt; 2 năm</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky text-ink border-2 border-line shadow-hard">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">22 ngày</div>
                  <div className="text-[11px] font-bold mt-0.5 opacity-90 leading-tight">Phép năm &amp; WFH linh hoạt</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-peach text-ink border-2 border-line shadow-hard">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">100%</div>
                  <div className="text-[11px] font-bold mt-0.5 opacity-90 leading-tight">OT miễn thuế TNCN 2026</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-lilac text-ink border-2 border-line shadow-hard">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">Top 10</div>
                  <div className="text-[11px] font-bold mt-0.5 opacity-90 leading-tight">Môi trường HR Tech VN</div>
                </div>
              </div>
            </div>

            {/* Visual Bento Mosaic bên phải */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-line shadow-hard-lg bg-surface p-2.5">
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"
                    alt="Đội ngũ PeopleInsight AI làm việc tại văn phòng"
                    className="w-full h-[360px] sm:h-[400px] object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-surface border-2 border-line shadow-hard text-fg">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b-2 border-line">
                      <span className="font-extrabold flex items-center gap-1.5 text-fg">
                        <Sparkles className="w-3.5 h-3.5 text-ink dark:text-lime fill-ink dark:fill-lime" />
                        Không gian làm việc {locationDisplayText}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime text-ink font-mono font-bold border border-line">
                        LIVE • HÀ NỘI
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-muted mt-2 leading-relaxed font-semibold">
                      Nơi mỗi buổi sáng bắt đầu bằng ly cà phê thơm lừng, trao đổi thân thiện không rào cản và sự tự do tuyệt đối trong giải pháp công nghệ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Badge chân thực Neobrutalism Giấy & Mực */}
              <div className="absolute -top-3 -left-3 p-3 rounded-2xl bg-surface text-fg border-2 border-line shadow-hard hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime text-ink border-2 border-line flex items-center justify-center font-black font-mono shadow-hard-xs">
                  AI
                </div>
                <div>
                  <div className="text-xs font-black text-fg">Chấm điểm CV bằng ATS</div>
                  <div className="text-[10px] text-muted font-mono font-semibold">Phản hồi ứng viên trong 24h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KHỐI ĐỜI SỐNG & VĂN HÓA DOANH NGHIỆP: TƯƠNG TÁC SỐNG ĐỘNG */}
      <section id="culture" className="py-20 lg:py-28 border-b-2 border-line bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky text-ink border-2 border-line text-xs font-bold uppercase tracking-wider shadow-hard-sm">
              Văn hóa &amp; Con người
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight font-display">
              Đời sống tại PeopleInsight: Năng động, Thấu hiểu &amp; Đầy cảm hứng
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed font-medium">
              Chúng tôi không đo lường giá trị bằng số giờ bạn ngồi tại văn phòng, mà bằng sự hứng khởi mỗi sáng thức dậy và những bước tiến vượt bậc của bạn trong sự nghiệp.
            </p>
          </div>

          {/* Bố cục 2 cột tương tác sinh động */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột trái: Danh sách các tab */}
            <div className="lg:col-span-5 space-y-3">
              <button
                type="button"
                onClick={() => setActiveCultureTab('learning')}
                className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group cursor-pointer ${
                  activeCultureTab === 'learning'
                    ? 'bg-surface border-line text-fg shadow-hard scale-[1.02]'
                    : 'bg-surface-2 border-line/40 text-muted hover:border-line hover:text-fg'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border border-line flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'learning' ? 'bg-primary text-on-primary' : 'bg-surface text-fg'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-fg">Hoạt động đào tạo &amp; Phát triển</div>
                    <div className="text-[11px] text-muted">Tài trợ 100% thi chứng chỉ quốc tế</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'learning' ? 'translate-x-1 text-primary' : 'text-muted'}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveCultureTab('pantry')}
                className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group cursor-pointer ${
                  activeCultureTab === 'pantry'
                    ? 'bg-surface border-line text-fg shadow-hard scale-[1.02]'
                    : 'bg-surface-2 border-line/40 text-muted hover:border-line hover:text-fg'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border border-line flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'pantry' ? 'bg-primary text-on-primary' : 'bg-surface text-fg'
                  }`}>
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-fg">Khu Relax &amp; Pantry Barista</div>
                    <div className="text-[11px] text-muted">Cà phê hạt pha máy, hoa quả &amp; snack 24/7</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'pantry' ? 'translate-x-1 text-primary' : 'text-muted'}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveCultureTab('radio')}
                className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group cursor-pointer ${
                  activeCultureTab === 'radio'
                    ? 'bg-surface border-line text-fg shadow-hard scale-[1.02]'
                    : 'bg-surface-2 border-line/40 text-muted hover:border-line hover:text-fg'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border border-line flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'radio' ? 'bg-primary text-on-primary' : 'bg-surface text-fg'
                  }`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-fg">Radio nội bộ "Insight Station"</div>
                    <div className="text-[11px] text-muted">Thanh âm kết nối chiều thứ Sáu hàng tuần</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'radio' ? 'translate-x-1 text-primary' : 'text-muted'}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveCultureTab('travel')}
                className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group cursor-pointer ${
                  activeCultureTab === 'travel'
                    ? 'bg-surface border-line text-fg shadow-hard scale-[1.02]'
                    : 'bg-surface-2 border-line/40 text-muted hover:border-line hover:text-fg'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border border-line flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'travel' ? 'bg-primary text-on-primary' : 'bg-surface text-fg'
                  }`}>
                    <Tent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-fg">Company Trip 5 sao &amp; Dã ngoại quý</div>
                    <div className="text-[11px] text-muted">Khám phá Đà Nẵng, Phú Quốc &amp; cắm trại</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'travel' ? 'translate-x-1 text-primary' : 'text-muted'}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveCultureTab('sports')}
                className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group cursor-pointer ${
                  activeCultureTab === 'sports'
                    ? 'bg-surface border-line text-fg shadow-hard scale-[1.02]'
                    : 'bg-surface-2 border-line/40 text-muted hover:border-line hover:text-fg'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border border-line flex items-center justify-center shrink-0 ${
                    activeCultureTab === 'sports' ? 'bg-primary text-on-primary' : 'bg-surface text-fg'
                  }`}>
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-fg">CLB Thể thao &amp; Acoustic Band</div>
                    <div className="text-[11px] text-muted">Bóng đá, Cầu lông &amp; ban nhạc giao lưu</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeCultureTab === 'sports' ? 'translate-x-1 text-primary' : 'text-muted'}`} />
              </button>
            </div>

            {/* Cột phải: Khung hiển thị ĐỘNG hình ảnh thực tế */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border-2 border-line bg-surface p-6 sm:p-8 space-y-6 shadow-hard-lg">
                <div className="relative rounded-2xl overflow-hidden h-[280px] sm:h-[340px] border-2 border-line">
                  <img
                    src={cultureData[activeCultureTab].image}
                    alt={cultureData[activeCultureTab].title}
                    className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-xl bg-lime text-ink text-xs font-bold border-2 border-line shadow-hard-sm">
                      {cultureData[activeCultureTab].tag}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-xs text-white font-medium italic">
                    📷 {cultureData[activeCultureTab].caption}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-fg tracking-tight font-display">
                    {cultureData[activeCultureTab].title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed font-medium">
                    {cultureData[activeCultureTab].desc}
                  </p>

                  {/* Điểm nổi bật Pills */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {cultureData[activeCultureTab].stats.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-surface-2 border border-line text-fg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>

                  {/* Widget Radio Retro */}
                  {activeCultureTab === 'radio' && (
                    <div className="p-4 rounded-2xl bg-peach text-ink border-2 border-line shadow-hard flex items-center justify-between text-xs mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsRadioPlaying(!isRadioPlaying)}
                          className="w-10 h-10 rounded-xl bg-ink text-lime flex items-center justify-center border border-line shadow-xs transition hover:scale-105 cursor-pointer"
                        >
                          {isRadioPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <div>
                          <div className="font-bold text-sm text-ink font-display">Insight Station #42: Chuyện người làm AI &amp; Mùa deadline</div>
                          <div className="text-[11px] font-mono font-semibold">{isRadioPlaying ? '🔴 Đang phát sóng trực tuyến...' : '▶ Bấm để nghe thử bản tin'}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold hidden sm:inline bg-surface px-2 py-1 rounded border border-line">14:28 min</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ĐẶC QUYỀN ĐÃI NGỘ & CHÍNH SÁCH CHUẨN 2026 */}
      <section id="perks" className="py-20 lg:py-24 border-b-2 border-line bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime text-ink border-2 border-line text-xs font-bold uppercase tracking-wider shadow-hard-sm">
              Đãi ngộ thực chất
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight font-display">
              Chính sách phúc lợi chuẩn mực pháp lý 2026
            </h2>
            <p className="text-sm text-muted font-medium">
              Mọi quyền lợi của bạn được minh bạch hóa và tự động hóa qua hệ thống tính lương PeopleInsight Engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl border-2 border-line bg-surface hover:-translate-y-1 transition-all shadow-hard space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky text-ink border-2 border-line flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-fg font-display">Thu nhập cạnh tranh &amp; Thưởng quý</h3>
              <p className="text-xs text-muted leading-relaxed font-medium">
                Lương cạnh tranh theo chuẩn thị trường công nghệ, xét tăng lương 2 lần/năm và thưởng hiệu quả kinh doanh (Bonus tháng 13, 14).
              </p>
            </div>

            <div className="p-6 rounded-3xl border-2 border-line bg-surface hover:-translate-y-1 transition-all shadow-hard space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-ink border-2 border-line flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-fg font-display">Bảo hiểm sức khỏe Care Premium</h3>
              <p className="text-xs text-muted leading-relaxed font-medium">
                Đóng đầy đủ BHXH/BHYT/BHTN theo 100% lương cơ bản, kèm gói bảo hiểm sức khỏe ngoại trú và nội trú tại các bệnh viện quốc tế hàng đầu.
              </p>
            </div>

            <div className="p-6 rounded-3xl border-2 border-line bg-surface hover:-translate-y-1 transition-all shadow-hard space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-lilac text-ink border-2 border-line flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-fg font-display">Thời gian linh hoạt &amp; Hybrid Work</h3>
              <p className="text-xs text-muted leading-relaxed font-medium">
                Thời gian làm việc từ Thứ 2 đến Thứ 6. Hỗ trợ làm việc từ xa (WFH) 2 ngày/tháng, không chấm công gò bó nhờ Kiosk FaceID và GPS di động.
              </p>
            </div>

            <div className="p-6 rounded-3xl border-2 border-line bg-surface hover:-translate-y-1 transition-all shadow-hard space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-peach text-ink border-2 border-line flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-fg font-display">Chế độ OT miễn thuế 100%</h3>
              <p className="text-xs text-muted leading-relaxed font-medium">
                Tuân thủ nghiêm ngặt Điều 98 BLLĐ: Tiền làm thêm giờ được miễn thuế TNCN toàn bộ theo quy định 2026, phụ cấp ăn ca và làm đêm đầy đủ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NGƯỜI THẬT VIỆC THẬT (TESTIMONIALS) */}
      <section id="testimonials" className="py-20 lg:py-24 border-b-2 border-line bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lilac text-ink border-2 border-line text-xs font-bold uppercase tracking-wider shadow-hard-sm">
              Chia sẻ từ nội bộ
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight font-display">
              Những người đang cùng tạo nên PeopleInsight
            </h2>
            <p className="text-sm text-muted font-medium">
              Lắng nghe cảm nhận chân thực nhất từ các kỹ sư và chuyên viên đang cống hiến mỗi ngày tại công ty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface border-2 border-line shadow-hard flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-fg leading-relaxed italic font-medium">
                "Ở PeopleInsight, bạn không bị bó buộc trong các quy trình cứng nhắc. Mọi ý tưởng về Generative AI hay thị giác máy tính đều được đưa vào thử nghiệm trên sản phẩm thật chỉ sau vài tuần chạy sprint."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-line/40">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Trần Minh Đức"
                  className="w-10 h-10 rounded-full object-cover border-2 border-line"
                />
                <div>
                  <div className="text-xs font-bold text-fg">Trần Minh Đức</div>
                  <div className="text-[10px] text-primary font-mono font-semibold">Senior AI Engineer (Gắn bó 3 năm)</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface border-2 border-line shadow-hard flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-fg leading-relaxed italic font-medium">
                "Chính sách lương minh bạch và chuẩn mực 2026 giúp phòng HR chúng mình tự tin đối thoại công bằng với từng ứng viên. Không bao giờ có chuyện mập mờ lương gross-net hay làm thêm giờ không được tính đúng."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-line/40">
                <img
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
                  alt="Lê Thu Thảo"
                  className="w-10 h-10 rounded-full object-cover border-2 border-line"
                />
                <div>
                  <div className="text-xs font-bold text-fg">Lê Thu Thảo</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">HR Specialist &amp; Talent Acquisition</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface border-2 border-line shadow-hard flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-fg leading-relaxed italic font-medium">
                "Văn hóa làm việc linh hoạt, đồng nghiệp trẻ trung, sếp luôn lắng nghe và sẵn sàng mời pizza mỗi khi hoàn thành sprint lớn. Đặc biệt khu Pantry pha cà phê hạt cực đỉnh giúp mình luôn tỉnh táo sáng tạo."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-line/40">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="Đặng Hoàng Nam"
                  className="w-10 h-10 rounded-full object-cover border-2 border-line"
                />
                <div>
                  <div className="text-xs font-bold text-fg">Đặng Hoàng Nam</div>
                  <div className="text-[10px] text-primary font-mono font-semibold">Frontend Lead &amp; UI Specialist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DANH SÁCH VIỆC LÀM & NỘP CV TRỰC TUYẾN (JOB BOARD) */}
      <section id="jobs" className="py-20 lg:py-28 flex-1 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-primary uppercase tracking-wider">Cơ hội gia nhập</div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight font-display">Các vị trí đang mở tuyển dụng</h2>
            </div>

            {/* Ô tìm kiếm từ khóa */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm vị trí, kỹ năng (AI, React, Python)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-line bg-surface text-xs text-fg placeholder:text-muted focus:outline-none focus:border-primary shadow-hard-sm font-medium"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-2 border-line ${
                selectedCategory === 'ALL'
                  ? 'bg-primary text-on-primary shadow-hard'
                  : 'bg-surface text-fg hover:bg-surface-2 shadow-hard-sm'
              }`}
            >
              Tất cả các vị trí ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('TECH')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-2 border-line ${
                selectedCategory === 'TECH'
                  ? 'bg-primary text-on-primary shadow-hard'
                  : 'bg-surface text-fg hover:bg-surface-2 shadow-hard-sm'
              }`}
            >
              Công nghệ &amp; AI (Software &amp; MLOps)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('HR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-2 border-line ${
                selectedCategory === 'HR'
                  ? 'bg-primary text-on-primary shadow-hard'
                  : 'bg-surface text-fg hover:bg-surface-2 shadow-hard-sm'
              }`}
            >
              Quản trị Nhân sự &amp; Vận hành
            </button>
          </div>

          {/* Danh sách thẻ công việc */}
          {isLoadingJobs ? (
            <div className="p-16 text-center text-muted space-y-3 bg-surface rounded-3xl border-2 border-line shadow-hard">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold">Đang tải danh sách cơ hội nghề nghiệp mới nhất...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-16 text-center text-muted bg-surface rounded-3xl border-2 border-line shadow-hard space-y-3">
              <FileText className="w-10 h-10 text-muted mx-auto opacity-50" />
              <p className="text-sm font-bold text-fg">Không tìm thấy vị trí tuyển dụng phù hợp với từ khóa "{searchKeyword}"</p>
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="p-6 rounded-3xl border-2 border-line bg-surface hover:-translate-y-1 transition-all flex flex-col justify-between space-y-5 shadow-hard group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-surface-2 text-fg border border-line">
                          {job.departmentId?.name || 'Khối Công Nghệ'}
                        </span>
                        <h3 className="text-base sm:text-xl font-bold text-fg group-hover:text-primary transition-colors mt-2 font-display">
                          {job.title}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold bg-lime text-ink px-3 py-1 rounded-xl border-2 border-line shadow-hard-sm whitespace-nowrap">
                        {job.salaryRange ? `${formatVND(job.salaryRange.min)} - ${formatVND(job.salaryRange.max)}` : 'Thỏa thuận'}
                      </span>
                    </div>

                    <p className="text-xs text-muted line-clamp-3 leading-relaxed font-medium">
                      {job.jobDescription}
                    </p>

                    {/* Kỹ năng yêu cầu */}
                    {job.requirements?.skills && job.requirements.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.requirements.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2.5 py-0.5 rounded-lg bg-surface-2 text-fg border border-line font-mono font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t-2 border-line/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{companyLocations.length > 0 ? companyLocations[0].name : 'Văn phòng chính'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenApplyModal(job)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-ink bg-lime border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer"
                    >
                      <span>Ứng tuyển ngay</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-surface border-2 border-line rounded-3xl shadow-hard-lg p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto text-fg">
            <div className="flex items-center justify-between pb-4 border-b-2 border-line">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">Nộp hồ sơ ứng tuyển</span>
                <h3 className="text-xl font-bold text-fg mt-0.5 font-display">{selectedJob.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 rounded-xl border border-line text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccessMessage ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="leading-relaxed font-semibold">{applySuccessMessage}</p>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-lime text-ink border-2 border-line font-bold text-xs shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-fg font-bold">Họ và tên <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-fg font-bold">Email liên hệ <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="an.nguyen@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-fg font-bold">Số điện thoại <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-fg font-bold">Số năm kinh nghiệm</label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Ví dụ: 2 năm làm việc với React/NodeJS"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-fg font-bold">Kỹ năng chuyên môn chính</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Python, ReactJS, MongoDB, MediaPipe, Docker..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-fg font-bold">Giới thiệu ngắn về bản thân</label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tóm tắt kinh nghiệm nổi bật hoặc điều bạn mong muốn đóng góp..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                {/* Tải CV File hoặc URL */}
                <div className="space-y-2 pt-1">
                  <label className="text-fg font-bold">Tệp CV đính kèm (PDF / Word) <span className="text-rose-500">*</span></label>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-line bg-surface-2 text-center hover:border-primary transition">
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
                      <Upload className="w-7 h-7 text-primary mx-auto" />
                      <div className="text-xs text-fg font-semibold">
                        {cvFile ? <b className="text-emerald-600 dark:text-emerald-400 font-mono">{cvFile.name}</b> : 'Bấm để chọn tệp CV từ thiết bị của bạn'}
                      </div>
                      <div className="text-[10px] text-muted font-mono">Định dạng hỗ trợ: PDF, DOCX (Tối đa 10MB)</div>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted font-medium">Hoặc liên kết CV trực tuyến (Google Drive, LinkedIn)</label>
                  <input
                    type="url"
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted text-xs focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t-2 border-line">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-line text-muted hover:text-fg hover:bg-surface-2 transition font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-lime text-ink border-2 border-line font-bold shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Đang phân tích CV qua AI ATS...' : 'Gửi hồ sơ ứng tuyển'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. CHÂN TRANG THÔNG TIN DOANH NGHIỆP */}
      <footer className="bg-surface-2 border-t-2 border-line text-xs text-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lime text-ink border-2 border-line flex items-center justify-center shadow-hard-sm">
                  <Sparkles className="w-5 h-5 text-ink" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-base text-fg font-display">PeopleInsight AI</span>
              </div>
              <p className="text-muted text-xs leading-relaxed font-medium">
                Nền tảng quản trị nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo, tối ưu hóa điểm danh FaceID Kiosk, tính lương chuẩn mực 2026 và dự báo thôi việc ML.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-fg text-sm uppercase tracking-wider font-mono">Văn phòng làm việc</h4>
              <ul className="space-y-2 text-muted leading-relaxed font-medium">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold shrink-0">📍</span>
                  <span><strong className="text-fg">Trụ sở chính:</strong> {locationDisplayText}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-fg text-sm uppercase tracking-wider font-mono">Liên hệ tuyển dụng</h4>
              <ul className="space-y-2 text-muted leading-relaxed font-medium">
                <li>Hotline: <span className="text-fg font-bold font-mono">(+84) 24-7303-9996</span></li>
                <li>Email HR: <span className="text-primary font-bold font-mono">tuyendung@peopleinsight.vn</span></li>
                <li>Thời gian làm việc: Thứ Hai - Thứ Sáu (08:30 - 17:30)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-fg text-sm uppercase tracking-wider font-mono">Đồ án Tốt nghiệp CNTT</h4>
              <p className="text-muted leading-relaxed font-medium">
                Trường Đại học Nguyễn Trãi — Khoa CNTT &amp; Chuyển đổi số.
                <br />Sinh viên: <strong className="text-fg">Nguyễn Anh Tuấn</strong> (MSV: 2310900113).
                <br />GVHD: <strong className="text-fg">ThS. Lê Trọng Nhất</strong>.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-line/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted font-medium">
            <div>© 2026 PeopleInsight AI. Mọi quyền được bảo lưu theo Luật Bảo vệ dữ liệu cá nhân.</div>
            <div className="flex items-center gap-6 font-mono font-bold">
              <a href="#about" className="hover:text-primary transition">Về chúng tôi</a>
              <a href="#culture" className="hover:text-primary transition">Văn hóa doanh nghiệp</a>
              <a href="#perks" className="hover:text-primary transition">Chính sách 2026</a>
              <a href="#jobs" className="hover:text-primary transition">Cơ hội việc làm</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
