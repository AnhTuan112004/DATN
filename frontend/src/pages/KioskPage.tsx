import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Building2,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Settings,
  Camera,
  CameraOff,
  X,
  Sliders,
  Check,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Kiosk Device Configuration
  const [kioskToken, setKioskToken] = useState<string>(
    localStorage.getItem('kiosk_token') || 'kiosk_defense_gate_token'
  );
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Camera & Model States
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Đang khởi tạo máy chấm công...');

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
  const [attendanceMode, setAttendanceMode] = useState<'AUTO' | 'CHECK_IN' | 'CHECK_OUT'>('AUTO');

  // Direct Face Recognition & Scanning States
  const stableFramesRef = useRef<number>(0);
  const [faceCount, setFaceCount] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Trạng thái Điểm danh (Server-side 1:N Matching & AttendanceLog)
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
      time: string;
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

  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Lịch sử lượt chấm công gần nhất vừa ghi nhận tại Kiosk
  const [recentAttendances, setRecentAttendances] = useState<
    Array<{
      id: string;
      fullName: string;
      employeeCode: string;
      departmentName?: string;
      actionType: 'CHECK_IN' | 'CHECK_OUT';
      time: string;
      date: string;
      isLate?: boolean;
      lateMinutes?: number;
      workDurationMinutes?: number;
    }>
  >([]);

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
      setCurrentDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
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
        setStatusMessage('Đang nạp mô hình nhận diện khuôn mặt...');
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setStatusMessage('Hệ thống camera sẵn sàng nhận diện!');
      } catch (err: any) {
        console.error('Lỗi nạp model:', err);
        setStatusMessage(`Lỗi nạp model: ${err.message}`);
      }
    };
    loadModels();
  }, []);

  // 3.5. Dừng Camera và giải phóng toàn bộ MediaStream tracks triệt để
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Lỗi dừng camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Lỗi dừng video track:', e);
        }
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Tự động tắt Camera khi rời khỏi trang Kiosk
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 4. Khởi động WebRTC Camera với cấu hình tùy chỉnh
  const startCamera = useCallback(
    async (deviceId?: string, width = resolution.width, height = resolution.height) => {
      try {
        stopCamera();

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

        streamRef.current = stream;
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
    [resolution, enumerateCameras, stopCamera]
  );

  // 4.5. Bật / Tắt Camera thủ công theo ý muốn người dùng
  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      stopCamera();
      setStatusMessage('Camera đang tạm tắt');
    } else {
      startCamera(selectedDeviceId, resolution.width, resolution.height);
      setStatusMessage('Hệ thống camera sẵn sàng nhận diện!');
    }
  }, [cameraActive, stopCamera, startCamera, selectedDeviceId, resolution]);

  // 5. Hàm Chấm công Trực tiếp theo Khuôn mặt (Tự động nhận diện khi người đứng trước cam)
  const performDirectCheckIn = useCallback(
    async (descriptor: Float32Array) => {
      if (isVerifying || attendanceResult || checkInError) return;

      try {
        setIsVerifying(true);
        setStatusMessage('Đang so khớp danh tính và ghi nhận giờ ra vào...');

        const nonceToSend = `direct_${Date.now()}`;
        const vecArray = Array.from(descriptor);

        const res = await axios.post(
          '/api/kiosk/check-in',
          {
            nonce: nonceToSend,
            vStart: vecArray,
            vEnd: vecArray,
            mode: attendanceMode,
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
          setIsConnected(true);
          setStatusMessage(
            `Nhận diện thành công: ${result.employee.fullName} (${
              result.actionType === 'CHECK_IN' ? 'VÀO CA' : 'TAN CA'
            })`
          );

          // Ghi nhận vào lịch sử gần đây của Kiosk
          setRecentAttendances((prev) => [
            {
              id: Date.now().toString(),
              fullName: result.employee.fullName,
              employeeCode: result.employee.employeeCode,
              departmentName: result.employee.departmentName,
              actionType: result.actionType,
              time: result.attendance.time || new Date().toLocaleTimeString('vi-VN'),
              date: result.attendance.date || new Date().toLocaleDateString('vi-VN'),
              isLate: result.attendance.isLate,
              lateMinutes: result.attendance.lateMinutes,
              workDurationMinutes: result.attendance.workDurationMinutes,
            },
            ...prev.slice(0, 4), // Lưu tối đa 5 lượt gần nhất
          ]);

          // Tự động đóng thông báo nhỏ sau 3.5 giây để đón người tiếp theo
          setTimeout(() => {
            setAttendanceResult(null);
            setIsVerifying(false);
            stableFramesRef.current = 0;
            setScanProgress(0);
          }, 3500);
        }
      } catch (err: any) {
        console.error('Lỗi điểm danh Kiosk FaceID:', err);
        const errorData = err.response?.data;
        const fallback = errorData?.fallbackTo1To1 || false;
        const msg =
          errorData?.error ||
          errorData?.message ||
          err.message ||
          'Không tìm thấy khuôn mặt phù hợp trong hệ thống';

        setCheckInError({
          message: msg,
          fallbackTo1To1: fallback,
        });
        setStatusMessage(`Nhận diện thất bại: ${msg}`);

        // Tự động đóng thông báo lỗi sau 3 giây để thử lại
        setTimeout(() => {
          setCheckInError(null);
          setIsVerifying(false);
          stableFramesRef.current = 0;
          setScanProgress(0);
        }, 3000);
      }
    },
    [isVerifying, attendanceResult, checkInError, kioskToken, attendanceMode]
  );

  // 6. Vòng lặp Detection Frame liên tục trên Camera
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
        setFaceCount(count);

        const targetDetection = count === 1 ? detections[0] : undefined;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (targetDetection) {
          const resized = faceapi.resizeResults(targetDetection, displaySize);
          faceapi.draw.drawDetections(canvas, resized);
          faceapi.draw.drawFaceLandmarks(canvas, resized);

          // Tự động nhận diện sau khi mặt ổn định ~6 frames (~0.25 giây)
          if (!isVerifying && !attendanceResult && !checkInError) {
            stableFramesRef.current += 1;
            const pct = Math.min(100, Math.round((stableFramesRef.current / 6) * 100));
            setScanProgress(pct);

            if (stableFramesRef.current === 6) {
              performDirectCheckIn(targetDetection.descriptor);
            }
          }
        } else {
          stableFramesRef.current = 0;
          setScanProgress(0);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [modelsLoaded, cameraActive, minConfidence, isVerifying, attendanceResult, checkInError, performDirectCheckIn]);

  // 7. Khởi động camera khi nạp xong model
  useEffect(() => {
    if (modelsLoaded && !cameraActive) {
      startCamera();
    }
  }, [modelsLoaded, cameraActive, startCamera]);

  // Lưu cấu hình Camera
  const handleSaveCameraConfig = () => {
    localStorage.setItem('kiosk_token', tokenInput.trim());
    setKioskToken(tokenInput.trim());
    startCamera(selectedDeviceId, resolution.width, resolution.height);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Kiosk Top Bar */}
      <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white">
                Kiosk Chấm Công Khuôn Mặt
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Trực Tiếp 1 Chạm
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Cổng ra vào chính • Tự động nhận diện danh tính & ghi nhận giờ
            </p>
          </div>
        </div>

        {/* Đồng hồ lớn & Nút điều khiển dành cho CEO / HR Manager */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xl font-mono font-bold tracking-wider text-emerald-400">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-[10px] text-slate-400 capitalize">{currentDate || 'Giờ Việt Nam (GMT+7)'}</div>
          </div>

          {/* Nút Bật / Tắt Camera Trên Header */}
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-md cursor-pointer ${
              cameraActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
            }`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Tắt Cam</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>Bật Cam</span>
              </>
            )}
          </button>

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

      {/* Main Kiosk Body - Giao diện Camera Toàn Màn Hình Trung Tâm */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full gap-4">
        {/* Thanh Điều Khiển Chế Độ Ghi Nhận Ra/Vào & Bật/Tắt Cam */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl px-2 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-300">Chế độ điểm danh:</span>
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-sm">
              <button
                type="button"
                onClick={() => setAttendanceMode('AUTO')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  attendanceMode === 'AUTO'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡ Tự Động</span>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('CHECK_IN')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  attendanceMode === 'CHECK_IN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Vào Ca</span>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('CHECK_OUT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  attendanceMode === 'CHECK_OUT'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-sky-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Tan Ca</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 hidden md:block">
              {attendanceMode === 'AUTO' && '💡 Tự động nhận diện Vào ca (sáng) hoặc Tan ca (chiều)'}
              {attendanceMode === 'CHECK_IN' && '🟢 Đang cố định: Chấm công vào ca'}
              {attendanceMode === 'CHECK_OUT' && '🔵 Đang cố định: Chấm công tan ca'}
            </div>

            {/* Nút Bật / Tắt Cam nhanh */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer border ${
                cameraActive
                  ? 'bg-slate-900 border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/30 animate-pulse'
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tắt Cam</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>Bật Cam</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Khung quét Camera Lớn chiếm trọn trung tâm */}
        <div
          className={`relative w-full max-w-4xl aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-slate-900 border-2 transition-all duration-300 shadow-2xl flex items-center justify-center ${
            faceCount > 1
              ? 'border-rose-500 shadow-rose-500/40 ring-4 ring-rose-500/20'
              : 'border-indigo-500/30 shadow-indigo-500/20'
          }`}
        >
          {/* Màn Hình Khi Camera Đang Tắt */}
          {!cameraActive && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center mb-4 text-slate-500 shadow-2xl">
                <CameraOff className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Camera đang tạm tắt</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                Máy chấm công đã tạm dừng truyền hình ảnh camera. Bấm nút bên dưới để mở lại camera và bắt đầu điểm danh.
              </p>
              <button
                type="button"
                onClick={toggleCamera}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Bật Camera Ngay
              </button>
            </div>
          )}

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

          {/* Viền góc định vị khuôn mặt (Corner Guides) */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 rounded-tl-2xl opacity-90 shadow-lg transition-colors duration-300 ${
                faceCount > 1
                  ? 'border-rose-500 shadow-rose-500/60'
                  : 'border-indigo-500 shadow-indigo-500/50'
              }`}
            />
            <div
              className={`absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 rounded-tr-2xl opacity-90 shadow-lg transition-colors duration-300 ${
                faceCount > 1
                  ? 'border-rose-500 shadow-rose-500/60'
                  : 'border-indigo-500 shadow-indigo-500/50'
              }`}
            />
            <div
              className={`absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 rounded-bl-2xl opacity-90 shadow-lg transition-colors duration-300 ${
                faceCount > 1
                  ? 'border-rose-500 shadow-rose-500/60'
                  : 'border-indigo-500 shadow-indigo-500/50'
              }`}
            />
            <div
              className={`absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 rounded-br-2xl opacity-90 shadow-lg transition-colors duration-300 ${
                faceCount > 1
                  ? 'border-rose-500 shadow-rose-500/60'
                  : 'border-indigo-500 shadow-indigo-500/50'
              }`}
            />
            <div
              className={`w-full h-1 bg-gradient-to-r opacity-75 animate-pulse ${
                faceCount > 1
                  ? 'from-transparent via-rose-500 to-transparent'
                  : 'from-transparent via-cyan-400 to-transparent'
              }`}
            />
          </div>

          {/* Hướng dẫn nhẹ nhàng phía trên */}
          {!attendanceResult && !checkInError && !isVerifying && faceCount <= 1 && (
            <div className="absolute top-6 inset-x-0 mx-auto w-fit z-20 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-slate-200 text-xs font-medium shadow-xl">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Vui lòng nhìn thẳng vào ống kính để ghi nhận công</span>
              </div>
            </div>
          )}

          {/* Thanh Tiến Độ Nhận Diện Tức Thì Khi Có Mặt */}
          {scanProgress > 0 && !attendanceResult && !checkInError && faceCount === 1 && (
            <div className="absolute top-18 inset-x-0 mx-auto w-fit z-20 pointer-events-none animate-fade-in">
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-xl">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Đang nhận diện... {scanProgress}%</span>
              </div>
            </div>
          )}

          {/* Overlay Đang Xử Lý So Khớp Danh Tính (chỉ hiện spinner nhỏ gọn, không che kín camera) */}
          {isVerifying && !attendanceResult && !checkInError && (
            <div className="absolute top-6 inset-x-0 mx-auto w-fit z-20 pointer-events-none animate-fade-in">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-950/90 backdrop-blur-md border border-indigo-500/60 text-indigo-200 text-xs font-semibold shadow-2xl">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Đang so khớp danh tính và ghi nhận giờ ra vào...</span>
              </div>
            </div>
          )}

          {/* THÔNG BÁO KẾT QUẢ ĐIỂM DANH: CHỮ NHỎ GỌN Ở DƯỚI, TỰ ĐỘNG ĐÓNG SAU 3.5 GIÂY */}
          {attendanceResult && (
            <div className="absolute bottom-4 inset-x-4 max-w-xl mx-auto bg-slate-950/95 backdrop-blur-xl border border-emerald-500/60 rounded-2xl p-3.5 sm:p-4 shadow-2xl z-30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                        attendanceResult.actionType === 'CHECK_IN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      {attendanceResult.actionType === 'CHECK_IN'
                        ? 'VÀO CA (CHECK-IN)'
                        : 'TAN CA (CHECK-OUT)'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {attendanceResult.attendance.time || currentTime}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold text-white truncate">
                      {attendanceResult.employee.fullName}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({attendanceResult.employee.employeeCode})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                    {attendanceResult.employee.departmentName && (
                      <span className="text-slate-400">{attendanceResult.employee.departmentName} •</span>
                    )}
                    {attendanceResult.actionType === 'CHECK_IN' ? (
                      attendanceResult.attendance.isLate ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Đi muộn {attendanceResult.attendance.lateMinutes || 0} phút
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Đúng giờ quy định ✓</span>
                      )
                    ) : (
                      <span className="text-sky-400 font-mono">
                        Thời gian làm: {Math.floor((attendanceResult.attendance.workDurationMinutes || 0) / 60)}h{' '}
                        {(attendanceResult.attendance.workDurationMinutes || 0) % 60}m
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Đã ghi nhận công vào hệ thống
                </span>
                <span className="text-slate-500">Tự động đóng sau vài giây</span>
              </div>
            </div>
          )}

          {/* THÔNG BÁO THẤT BẠI: CHỮ NHỎ GỌN Ở DƯỚI, TỰ ĐỘNG ĐÓNG SAU 3 GIÂY */}
          {checkInError && (
            <div className="absolute bottom-4 inset-x-4 max-w-xl mx-auto bg-slate-950/95 backdrop-blur-xl border border-rose-500/60 rounded-2xl p-3.5 shadow-2xl z-30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">
                    {checkInError.fallbackTo1To1 ? 'Cần xác minh danh tính 1:1' : 'Điểm danh chưa thành công'}
                  </div>
                  <p className="text-xs text-slate-200 font-medium truncate">{checkInError.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Vui lòng nhìn thẳng ống kính, tháo khẩu trang/kính râm hoặc liên hệ HR.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CẢNH BÁO NHIỀU KHUÔN MẶT: CHỮ NHỎ GỌN Ở DƯỚI, KHÔNG CHE KHUẤT CAMERA */}
          {faceCount > 1 && !attendanceResult && !checkInError && (
            <div className="absolute bottom-4 inset-x-4 max-w-xl mx-auto bg-rose-950/95 backdrop-blur-xl border-2 border-rose-500/80 rounded-2xl p-3.5 shadow-2xl z-30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Cảnh báo an ninh ({faceCount} người trong khung hình)</span>
                  </div>
                  <p className="text-xs text-white font-medium mt-0.5">
                    Hệ thống tạm dừng quét để tránh nhận diện nhầm lẫn.
                  </p>
                  <p className="text-[10px] text-rose-300/80 mt-0.5">
                    Vui lòng chỉ 1 người đứng trước camera để ghi nhận công.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Băng Chuyền Hiển Thị Lịch Sử Lượt Chấm Công Vừa Xong (Live Recent Check-ins) */}
        <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Lượt Chấm Công Vừa Ghi Nhận Tại Kiosk
            </span>
            <span className="text-[11px] text-slate-500">
              {recentAttendances.length > 0 ? `${recentAttendances.length} lượt gần nhất` : 'Đang chờ lượt điểm danh...'}
            </span>
          </div>

          {recentAttendances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {recentAttendances.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-100 truncate max-w-[120px]" title={item.fullName}>
                      {item.fullName}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.actionType === 'CHECK_IN'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {item.actionType === 'CHECK_IN' ? 'VÀO' : 'RA'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                    <span>{item.time}</span>
                    {item.actionType === 'CHECK_IN' ? (
                      item.isLate ? (
                        <span className="text-amber-400">Muộn {item.lateMinutes}p</span>
                      ) : (
                        <span className="text-emerald-400">Đúng giờ</span>
                      )
                    ) : (
                      <span className="text-sky-400">
                        {Math.floor((item.workDurationMinutes || 0) / 60)}h{(item.workDurationMinutes || 0) % 60}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-slate-500 text-xs">
              Chưa có lượt điểm danh nào trong phiên này. Hãy bước vào trước camera để hệ thống tự động ghi nhận!
            </div>
          )}
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
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
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
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCameraConfig}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
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
