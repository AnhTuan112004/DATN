import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Clock,
  Building2,
  CheckCircle2,
  Lock,
  Eye,
  Smile,
  ArrowLeft,
  ArrowRight,
  Settings,
  Camera,
  X,
  Sliders,
  Check,
} from 'lucide-react';
import { useFaceLiveness, ChallengeType } from '../features/face/useFaceLiveness';
import { useAuth } from '../context/AuthContext';

export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Kiosk Device Configuration
  const [kioskToken, setKioskToken] = useState<string>(
    localStorage.getItem('kiosk_token') || 'kiosk_defense_gate_token'
  );
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Camera & Model States
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [currentNonce, setCurrentNonce] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [statusMessage, setStatusMessage] = useState<string>('Đang khởi tạo hệ thống...');

  // Camera Customization Settings (Dành riêng cho CEO & HR Manager)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [resolution, setResolution] = useState<{ width: number; height: number; label: string }>({
    width: 640,
    height: 480,
    label: 'VGA (640x480) — Tối ưu độ mượt',
  });
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [tokenInput, setTokenInput] = useState<string>(kioskToken);

  // Liveness Hook (Tầng 1)
  const {
    state,
    challenge,
    instruction,
    faceCount,
    progress,
    vStart,
    vEnd,
    startChallenge,
    processFrame,
    resetLiveness,
  } = useFaceLiveness();

  // Trạng thái Điểm danh Tầng 2 (Server-side 1:N Matching & AttendanceLog)
  const [attendanceResult, setAttendanceResult] = useState<{
    actionType: 'CHECK_IN' | 'CHECK_OUT';
    employee: {
      employeeCode: string;
      fullName: string;
      departmentName?: string;
      avatarUrl?: string;
    };
    attendance: {
      date: string;
      checkInTime?: string;
      checkOutTime?: string;
      isLate?: boolean;
      lateMinutes?: number;
      workDurationMinutes?: number;
      method: string;
    };
  } | null>(null);

  const [checkInError, setCheckInError] = useState<{
    message: string;
    fallbackTo1To1?: boolean;
  } | null>(null);

  const [isVerifyingT2, setIsVerifyingT2] = useState<boolean>(false);

  // 1. Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Liệt kê danh sách thiết bị Camera
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(cameras);
      if (cameras.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(cameras[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Không thể liệt kê danh sách camera:', err.message);
    }
  }, [selectedDeviceId]);

  // 3. Tải model nhận diện khuôn mặt cục bộ từ /models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusMessage('Đang nạp mô hình Thị giác máy tính...');
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setStatusMessage('Mô hình đã sẵn sàng. Đang kết nối Kiosk...');
      } catch (err: any) {
        console.error('Lỗi nạp model:', err);
        setStatusMessage(`Lỗi nạp model: ${err.message}`);
      }
    };
    loadModels();
  }, []);

  // 4. Khởi động WebRTC Camera với cấu hình tùy chỉnh
  const startCamera = useCallback(
    async (deviceId?: string, width = resolution.width, height = resolution.height) => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const currentStream = videoRef.current.srcObject as MediaStream;
          currentStream.getTracks().forEach((track) => track.stop());
        }

        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: deviceId ? undefined : 'user',
          deviceId: deviceId ? { exact: deviceId } : undefined,
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
          await enumerateCameras();
        }
      } catch (err: any) {
        console.error('Lỗi mở camera:', err);
        alert(`Không thể truy cập Camera: ${err.message}`);
      }
    },
    [resolution, enumerateCameras]
  );

  // 5. Lấy Nonce thử thách mới từ Server
  const fetchNewChallenge = useCallback(async () => {
    try {
      setStatusMessage('Đang lấy thử thách sinh trắc học từ máy chủ...');
      const res = await axios.get('/api/kiosk/challenge', {
        headers: { 'x-kiosk-token': kioskToken },
      });
      if (res.data.success) {
        const data = res.data.data;
        setCurrentNonce(data.nonce);
        setCountdown(data.expiresIn);
        startChallenge(data.challengeType as ChallengeType, data.instruction);
        setIsConnected(true);
      }
    } catch (err: any) {
      console.warn('Chưa kết nối được Kiosk token, chạy chế độ mô phỏng thử thách:', err.message);
      const sampleChallenges: ChallengeType[] = ['BLINK', 'SMILE', 'TURN_LEFT', 'TURN_RIGHT'];
      const randomChallenge = sampleChallenges[Math.floor(Math.random() * sampleChallenges.length)];
      setCurrentNonce('simulated_nonce_' + Math.random().toString(36).substring(7));
      setCountdown(60);
      startChallenge(randomChallenge, `Vui lòng thực hiện thử thách: ${randomChallenge}`);
      setIsConnected(false);
    }
  }, [kioskToken, startChallenge]);

  // 6. Đếm ngược TTL 60 giây
  useEffect(() => {
    if (countdown <= 0) {
      setStatusMessage('Thử thách đã hết hạn. Đang làm mới...');
      fetchNewChallenge();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchNewChallenge]);

  // 7. Vòng lặp Detection Frame với minConfidence tùy chỉnh
  useEffect(() => {
    if (!modelsLoaded || !cameraActive) return;

    let animId: number;
    const loop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === 4) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        const count = detections.length;
        const targetDetection = count === 1 ? detections[0] : undefined;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (targetDetection) {
          const resized = faceapi.resizeResults(targetDetection, displaySize);
          faceapi.draw.drawDetections(canvas, resized);
          faceapi.draw.drawFaceLandmarks(canvas, resized);
        }

        processFrame(targetDetection, count);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [modelsLoaded, cameraActive, minConfidence, processFrame]);

  // 8. Tự động gọi API Điểm danh Kiosk FaceID Tầng 2 khi Liveness hoàn tất
  useEffect(() => {
    if (
      state !== 'CHALLENGE_VERIFIED' ||
      !vStart ||
      !vEnd ||
      isVerifyingT2 ||
      attendanceResult ||
      checkInError
    ) {
      return;
    }

    const performServerCheckIn = async () => {
      try {
        setIsVerifyingT2(true);
        setStatusMessage('Đang so khớp 1:N khuôn mặt trên Server & ghi nhận công...');

        const res = await axios.post(
          '/api/kiosk/check-in',
          {
            nonce: currentNonce,
            vStart: Array.from(vStart),
            vEnd: Array.from(vEnd),
          },
          {
            headers: {
              'x-kiosk-token': kioskToken,
            },
          }
        );

        if (res.data.success) {
          const result = res.data.data;
          setAttendanceResult(result);
          setStatusMessage(
            `Điểm danh thành công: ${result.employee.fullName} (${result.actionType})`
          );

          // Tự động làm mới sau 4.5 giây để đón người tiếp theo
          setTimeout(() => {
            setAttendanceResult(null);
            setIsVerifyingT2(false);
            fetchNewChallenge();
          }, 4500);
        }
      } catch (err: any) {
        console.error('Lỗi điểm danh Kiosk FaceID Tầng 2:', err);
        const errorData = err.response?.data;
        const fallback = errorData?.fallbackTo1To1 || false;
        const msg =
          errorData?.error ||
          errorData?.message ||
          err.message ||
          'Không thể xác thực danh tính sinh trắc học';

        setCheckInError({
          message: msg,
          fallbackTo1To1: fallback,
        });
        setStatusMessage(`Xác thực thất bại: ${msg}`);

        // Tự động làm mới sau 4.5 giây để thử lại
        setTimeout(() => {
          setCheckInError(null);
          setIsVerifyingT2(false);
          fetchNewChallenge();
        }, 4500);
      }
    };

    performServerCheckIn();
  }, [
    state,
    vStart,
    vEnd,
    isVerifyingT2,
    attendanceResult,
    checkInError,
    currentNonce,
    kioskToken,
    fetchNewChallenge,
  ]);

  // Khởi động camera và challenge
  useEffect(() => {
    if (modelsLoaded && !cameraActive) {
      startCamera();
      fetchNewChallenge();
    }
  }, [modelsLoaded, cameraActive, startCamera, fetchNewChallenge]);

  // Lưu cấu hình Camera
  const handleSaveCameraConfig = () => {
    localStorage.setItem('kiosk_token', tokenInput.trim());
    setKioskToken(tokenInput.trim());
    startCamera(selectedDeviceId, resolution.width, resolution.height);
    setIsSettingsOpen(false);
    fetchNewChallenge();
  };

  const renderChallengeIcon = () => {
    switch (challenge) {
      case 'BLINK':
        return <Eye className="w-8 h-8 text-sky-400 animate-pulse" />;
      case 'SMILE':
        return <Smile className="w-8 h-8 text-amber-400 animate-bounce" />;
      case 'TURN_LEFT':
        return <ArrowLeft className="w-8 h-8 text-indigo-400 animate-pulse" />;
      case 'TURN_RIGHT':
        return <ArrowRight className="w-8 h-8 text-indigo-400 animate-pulse" />;
      default:
        return <Sparkles className="w-8 h-8 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Kiosk Top Bar */}
      <header className="h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                PeopleInsight AI — Kiosk FaceID
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Tầng 2 So khớp 1:N
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Cổng bảo vệ chính • Thiết bị tin cậy ĐATN K23
            </p>
          </div>
        </div>

        {/* Đồng hồ lớn & Nút điều khiển dành cho CEO / HR Manager */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}
            />
            <span className="text-slate-300 font-medium">
              {isConnected ? 'ONLINE (Đã kết nối Server)' : 'Mô phỏng Thử nghiệm'}
            </span>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xl font-mono font-bold tracking-wider text-emerald-400">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-[10px] text-slate-400">Giờ Việt Nam (GMT+7)</div>
          </div>

          {/* Nút Chỉnh Sửa Camera — CHỈ CEO & HR MANAGER MỚI CÓ */}
          {hasRole(['CEO', 'HR_MANAGER']) && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 text-xs text-white font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Chỉnh Sửa Cam
            </button>
          )}

          <button
            onClick={() => navigate('/attendance')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về Hệ Thống
          </button>
        </div>
      </header>

      {/* Main Kiosk Body */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 max-w-7xl mx-auto w-full">
        {/* Khung quét Camera */}
        <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-indigo-500/10 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''}`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isMirrored ? '-scale-x-100' : ''}`}
          />

          {/* Radar Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl opacity-80" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl opacity-80" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl opacity-80" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl opacity-80" />
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-75 animate-pulse" />
          </div>

          {/* Overlay Đang Xử Lý So Khớp Tầng 2 */}
          {isVerifyingT2 && !attendanceResult && !checkInError && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Đang so khớp danh tính 1:N...</h3>
              <p className="text-xs text-indigo-300">Giải mã an toàn AES-256 trong RAM & thẩm định biên an toàn</p>
            </div>
          )}

          {/* Overlay ĐIỂM DANH THÀNH CÔNG */}
          {attendanceResult && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in border-4 border-emerald-500/50 rounded-3xl">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                attendanceResult.actionType === 'CHECK_IN'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {attendanceResult.actionType === 'CHECK_IN' ? 'Ghi nhận Vào ca (Check-in)' : 'Ghi nhận Hết ca (Check-out)'}
              </span>

              <h2 className="text-2xl font-black text-white mb-1">
                {attendanceResult.employee.fullName}
              </h2>
              <p className="text-xs text-slate-400 mb-4 font-mono">
                Mã NV: {attendanceResult.employee.employeeCode}
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Thời gian:</div>
                  <div className="font-mono text-emerald-400 font-bold">
                    {attendanceResult.attendance.checkOutTime || attendanceResult.attendance.checkInTime || currentTime}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Trạng thái:</div>
                  <div className="font-semibold">
                    {attendanceResult.actionType === 'CHECK_IN' ? (
                      attendanceResult.attendance.isLate ? (
                        <span className="text-amber-400">Muộn {attendanceResult.attendance.lateMinutes}p</span>
                      ) : (
                        <span className="text-emerald-400">Đúng giờ ✓</span>
                      )
                    ) : (
                      <span className="text-sky-400">
                        {Math.floor((attendanceResult.attendance.workDurationMinutes || 0) / 60)}h
                        {(attendanceResult.attendance.workDurationMinutes || 0) % 60}m
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 animate-pulse">
                Hệ thống sẽ tự động chuyển lượt điểm danh tiếp theo...
              </p>
            </div>
          )}

          {/* Overlay ĐIỂM DANH THẤT BẠI / CẢNH BÁO */}
          {checkInError && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in border-4 border-rose-500/50 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-3 shadow-xl shadow-rose-500/30">
                <AlertTriangle className="w-9 h-9 text-rose-400 animate-pulse" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">
                {checkInError.fallbackTo1To1 ? 'CẦN XÁC MINH 1:1' : 'ĐIỂM DANH THẤT BẠI'}
              </h3>

              <p className="text-xs text-rose-200 max-w-sm mb-4 leading-relaxed">
                {checkInError.message}
              </p>

              {checkInError.fallbackTo1To1 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs text-left max-w-xs">
                  💡 <strong>Hướng dẫn:</strong> Vui lòng quét mã QR trên thẻ nhân viên hoặc nhập mã số trực tiếp tại quầy lễ tân để đối chiếu 1:1 an toàn.
                </div>
              )}
            </div>
          )}

          {/* Cảnh báo nhiều khuôn mặt */}
          {faceCount > 1 && !attendanceResult && !checkInError && (
            <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
              <AlertTriangle className="w-16 h-16 text-rose-400 mb-3 animate-bounce" />
              <h3 className="text-xl font-bold text-white mb-1">CẢNH BÁO VI PHẠM AN NINH</h3>
              <p className="text-rose-200 text-sm max-w-md">
                Phát hiện {faceCount} người cùng lúc trước máy chấm công! Để đảm bảo tính minh bạch, Kiosk chỉ cho phép 1 người điểm danh tại một thời điểm.
              </p>
            </div>
          )}

          {/* Badge đếm ngược TTL Nonce */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Nonce TTL: <span className="text-emerald-400 font-bold">{countdown}s</span>
          </div>
        </div>

        {/* Panel Hướng dẫn Thử thách & Trạng thái Liveness */}
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Card Thử thách Hiện tại */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Thử thách Sinh lý học Tầng 1
              </span>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                <Lock className="w-3.5 h-3.5" />
                Anti-Spoofing 2D
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
                {renderChallengeIcon()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">
                  Thử thách: {challenge}
                </h2>
                <p className="text-sm text-slate-300 leading-snug">
                  {instruction}
                </p>
              </div>
            </div>

            {/* Thanh tiến độ thử thách */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>Tiến độ thực thể sống:</span>
                <span className="text-sky-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/50"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Trạng thái xác thực thành công */}
            {state === 'CHALLENGE_VERIFIED' && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-sm font-semibold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                Đã thu thập 2 vector (V_start & V_end)! Đạt chuẩn Liveness.
              </div>
            )}
          </div>

          {/* Bảng thông số Kỹ thuật Kiosk */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Mô hình Nhận diện:</span>
              <span className="font-mono text-slate-200">SSD MobileNetV1 + ResNet-34</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Độ phân giải Cam:</span>
              <span className="font-mono text-indigo-300">{resolution.width}x{resolution.height} px</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Đặc trưng Vector:</span>
              <span className="font-mono text-slate-200">128 Chiều (128-D Embedding)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Mã hóa Lưu trữ:</span>
              <span className="font-mono text-emerald-400">AES-256-GCM (Luật BVDLCN)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Nonce Thử thách:</span>
              <span className="font-mono text-sky-400 truncate max-w-[180px]" title={currentNonce}>
                {currentNonce || '---'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Trạng thái:</span>
              <span className="font-mono text-slate-300 truncate max-w-[180px]" title={statusMessage}>
                {statusMessage}
              </span>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex gap-3">
            <button
              onClick={fetchNewChallenge}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Đổi Thử thách Mới
            </button>
            <button
              onClick={resetLiveness}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </main>

      {/* MODAL CẤU HÌNH & HIỆU CHỈNH CAMERA (DÀNH RIÊNG CHO CEO / HR MANAGER) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-fade-in text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cấu Hình & Hiệu Chỉnh Camera Kiosk</h3>
                  <p className="text-xs text-slate-400">
                    Đặc quyền Quản trị viên: <span className="text-indigo-400 font-semibold">{user?.fullName} ({user?.role})</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* 1. Chọn Camera đầu vào */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  Chọn Thiết Bị Camera:
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {videoDevices.length === 0 && <option value="">Đang dò tìm camera...</option>}
                  {videoDevices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Chọn Độ phân giải */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Độ Phân Giải Thu Hình:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { width: 640, height: 480, label: '640x480 (VGA)' },
                    { width: 1280, height: 720, label: '1280x720 (HD)' },
                    { width: 1920, height: 1080, label: '1920x1080 (FHD)' },
                  ].map((res) => (
                    <button
                      key={res.label}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        resolution.width === res.width
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Lật gương hình ảnh */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">Lật Gương Hình Ảnh (Mirror Camera)</div>
                  <div className="text-[11px] text-slate-400">Giúp nhân viên soi gương tự nhiên khi đứng trước Kiosk</div>
                </div>
                <input
                  type="checkbox"
                  checked={isMirrored}
                  onChange={(e) => setIsMirrored(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
              </div>

              {/* 4. Điều chỉnh độ nhạy nhận diện (minConfidence) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-300">Độ Nhạy Nhận Diện (minConfidence):</span>
                  <span className="font-mono text-indigo-400 font-bold">{minConfidence}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.8"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>0.3 (Nhạy hơn)</span>
                  <span>0.5 (Chuẩn khuyến nghị)</span>
                  <span>0.8 (Khắt khe)</span>
                </div>
              </div>

              {/* 5. Cập nhật Kiosk Secret Token */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Mã Bí Mật Kiosk Device (Token):
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Nhập mã token thiết bị kiosk..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Mã này dùng để gửi trong Header <code className="text-indigo-400">x-kiosk-token</code> khi gọi API máy chủ.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCameraConfig}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Check className="w-4 h-4" />
                Áp Dụng Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskPage;
