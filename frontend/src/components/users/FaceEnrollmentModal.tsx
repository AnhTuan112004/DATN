import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as faceapi from '@vladmandic/face-api';
import {
  X,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileText,
  UserCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { faceApi } from '../../api/face';
import { UserItem } from '../../types/user';

interface FaceEnrollmentModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentSuccess: () => void;
}

type EnrollmentStep = 'CONSENT' | 'CAPTURE' | 'SUCCESS';

interface SampleItem {
  index: number;
  label: string;
  descriptor: number[];
  capturedAt: string;
  previewDataUrl?: string;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  user,
  isOpen,
  onClose,
  onEnrollmentSuccess,
}) => {
  const { user: currentUser } = useAuth();

  // Stepper state
  const [step, setStep] = useState<EnrollmentStep>('CONSENT');

  // Consent checkbox
  const [hasAgreedConsent, setHasAgreedConsent] = useState(false);

  // Model loading & Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Realtime Detection metrics
  const [facesCount, setFacesCount] = useState<number>(0);
  const [currentFaceDescriptor, setCurrentFaceDescriptor] = useState<Float32Array | null>(null);

  // Samples collection (Target: 3 samples)
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const targetSampleCount = 3;

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dừng camera và giải phóng toàn bộ MediaStream tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Lỗi stop stream track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {
          console.warn('Lỗi stop video track:', e);
        }
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCurrentFaceDescriptor(null);
    setFacesCount(0);
  }, []);

  // Tự động tắt Camera khi component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Reset when modal opens / closes
  useEffect(() => {
    if (isOpen) {
      setStep('CONSENT');
      setHasAgreedConsent(false);
      setSamples([]);
      setSubmitError(null);
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Khởi động Camera & Nạp Models FaceAPI
  const startCameraAndModels = useCallback(async () => {
    setLoadingModels(true);
    setCameraError(null);

    try {
      // 1. Nạp models nếu chưa tải
      if (!modelsLoaded) {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      }

      // 2. Yêu cầu quyền truy cập Camera với độ phân giải HD
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.error('Lỗi khởi động camera hoặc nạp model FaceAPI:', err);
      const errMsg = err instanceof Error ? err.message : 'Không thể kết nối camera';
      setCameraError(
        errMsg.includes('Permission')
          ? 'Quyền truy cập Camera bị từ chối trên trình duyệt. Vui lòng cấp quyền trong cài đặt trình duyệt để HR tiếp tục lấy mẫu.'
          : 'Lỗi khởi động camera thiết bị: ' + errMsg
      );
    } finally {
      setLoadingModels(false);
    }
  }, [modelsLoaded]);

  // Vòng lặp phát hiện khuôn mặt thời gian thực khi Camera active
  useEffect(() => {
    let animationFrameId: number;
    let isDetecting = false;

    const detectLoop = async () => {
      if (
        cameraActive &&
        videoRef.current &&
        !videoRef.current.paused &&
        !videoRef.current.ended &&
        step === 'CAPTURE'
      ) {
        if (!isDetecting) {
          isDetecting = true;
          try {
            const detections = await faceapi
              .detectAllFaces(
                videoRef.current,
                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
              )
              .withFaceLandmarks()
              .withFaceDescriptors();

            setFacesCount(detections.length);

            if (detections.length === 1) {
              const single = detections[0];
              setCurrentFaceDescriptor(single.descriptor);
            } else {
              setCurrentFaceDescriptor(null);
            }
          } catch (e) {
            console.error('Lỗi vòng lặp phát hiện khuôn mặt:', e);
          } finally {
            isDetecting = false;
          }
        }
      }
      animationFrameId = requestAnimationFrame(detectLoop);
    };

    if (cameraActive && step === 'CAPTURE') {
      detectLoop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, step]);

  // Dọn dẹp stream khi unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Đồng bộ luồng camera vào thẻ video bất cứ khi nào video element sẵn sàng
  useEffect(() => {
    if (step === 'CAPTURE' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current
          .play()
          .then(() => setCameraActive(true))
          .catch((e) => console.warn('Lỗi video play khi sync:', e));
      }
    }
  }, [step, loadingModels]);

  // Chuyển sang bước lấy mẫu sau khi đồng ý
  const handleProceedToCapture = async () => {
    if (!hasAgreedConsent) return;
    setStep('CAPTURE');
    // Chờ 1 tick để DOM mount thẻ video trước khi nạp model và stream
    setTimeout(() => {
      startCameraAndModels();
    }, 100);
  };

  // Chụp mẫu khuôn mặt hiện tại
  const handleCaptureSample = () => {
    if (!currentFaceDescriptor || facesCount !== 1) return;
    if (samples.length >= targetSampleCount) return;

    // Chụp snapshot frame từ video để hiển thị thumbnail tạm
    let previewUrl: string | undefined;
    if (videoRef.current) {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 160;
      snapCanvas.height = 120;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
        previewUrl = snapCanvas.toDataURL('image/jpeg', 0.6);
      }
    }

    const sampleLabels = [
      'Mẫu 1: Nhìn thẳng chính diện',
      'Mẫu 2: Nghiêng nhẹ góc trái / Mỉm cười',
      'Mẫu 3: Nghiêng nhẹ góc phải',
    ];

    const newSample: SampleItem = {
      index: samples.length + 1,
      label: sampleLabels[samples.length] || `Mẫu số ${samples.length + 1}`,
      descriptor: Array.from(currentFaceDescriptor),
      capturedAt: new Date().toLocaleTimeString('vi-VN'),
      previewDataUrl: previewUrl,
    };

    setSamples((prev) => [...prev, newSample]);
  };

  // Xóa làm lại toàn bộ mẫu
  const handleResetSamples = () => {
    setSamples([]);
    setSubmitError(null);
  };

  // Hoàn tất lưu trữ và gửi API
  const handleSubmitEnrollment = async () => {
    if (!user || samples.length < targetSampleCount) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payloadDescriptors = samples.map((s) => s.descriptor);
      await faceApi.enrollFace(user._id, {
        descriptors: payloadDescriptors,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
        modelName: 'face-api-ssd-mobilenetv1',
        modelVersion: '1.0',
      });

      stopCamera();
      setStep('SUCCESS');
      onEnrollmentSuccess();
    } catch (err: unknown) {
      console.error('Lỗi gửi API lấy mẫu FaceID:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Không thể lưu trữ mẫu sinh trắc học vào hệ thống';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-line bg-surface shadow-hard-lg text-fg flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b-2 border-line px-6 py-4 bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-lime/20 border-2 border-line text-ink shadow-hard">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-fg flex items-center gap-2 font-display">
                Đăng Ký Sinh Trắc Học Khuôn Mặt (FaceID)
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-lime text-ink border border-line font-bold uppercase tracking-wider">
                  Luật BVDLCN 91/2025
                </span>
              </h2>
              <p className="text-xs text-muted font-medium mt-0.5">
                Nhân sự: <span className="text-fg font-bold">{user.fullName}</span> ({user.employeeCode}) • Giám sát trực tiếp bởi HR
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-fg hover:bg-surface-2 border-2 border-line rounded-xl transition cursor-pointer shadow-hard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-surface-2 border-b-2 border-line flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg font-black text-xs border-2 border-line ${
                step === 'CONSENT'
                  ? 'bg-lime text-ink shadow-hard'
                  : 'bg-surface text-fg'
              }`}
            >
              1
            </span>
            <span className={step === 'CONSENT' ? 'font-black text-fg' : 'text-muted'}>
              Chấp thuận BVDLCN
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted" />
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg font-black text-xs border-2 border-line ${
                step === 'CAPTURE'
                  ? 'bg-lime text-ink shadow-hard'
                  : step === 'SUCCESS'
                  ? 'bg-surface text-fg'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              2
            </span>
            <span className={step === 'CAPTURE' ? 'font-black text-fg' : 'text-muted'}>
              Thu thập 3 mẫu có HR
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted" />
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg font-black text-xs border-2 border-line ${
                step === 'SUCCESS'
                  ? 'bg-lime text-ink shadow-hard'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              3
            </span>
            <span className={step === 'SUCCESS' ? 'font-black text-fg' : 'text-muted'}>
              Mã hóa & Lưu trữ
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* ===================== STEP 1: CONSENT VIEW ===================== */}
          {step === 'CONSENT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-line bg-amber-500/10 flex items-start gap-3">
                <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-fg leading-relaxed">
                  <span className="font-bold text-amber-700">Căn cứ pháp lý:</span> Khoản 1 Điều 11 & Điều 13 Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. Dữ liệu sinh trắc học khuôn mặt là dữ liệu cá nhân nhạy cảm, chỉ được thu thập khi có sự đồng ý minh thị tự nguyện của chủ thể dữ liệu và phải được bảo vệ nghiêm ngặt.
                </div>
              </div>

              {/* Thông tin xác lập */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-surface-2 p-3.5 rounded-2xl border-2 border-line">
                <div>
                  <span className="text-muted font-bold">Chủ thể dữ liệu (Người lao động):</span>
                  <p className="font-black text-fg mt-0.5 text-sm">
                    {user.fullName} ({user.employeeCode})
                  </p>
                </div>
                <div>
                  <span className="text-muted font-bold">Cán bộ Nhân sự giám sát lấy mẫu:</span>
                  <p className="font-black text-accent mt-0.5 text-sm">
                    {currentUser?.fullName} ({currentUser?.role})
                  </p>
                </div>
              </div>

              {/* 4 Điều khoản cam kết minh thị */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-fg font-display">
                  Điều khoản Xử lý Dữ liệu Sinh trắc học (Phiên bản v2026.1)
                </h4>

                <div className="space-y-2 text-xs text-fg">
                  <div className="p-3 rounded-xl bg-surface border-2 border-line flex gap-2.5 shadow-hard">
                    <span className="font-black text-accent">1.</span>
                    <div>
                      <strong className="text-fg font-bold">Bản chất dữ liệu thu thập:</strong> Hệ thống chỉ trích xuất và lưu trữ vector toán học 128 chiều biểu diễn đặc trưng khuôn mặt (`descriptors[]`).{' '}
                      <span className="text-emerald-600 font-bold">
                        Tuyệt đối KHÔNG lưu trữ hình ảnh khuôn mặt thô (raw photos) trên máy chủ.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border-2 border-line flex gap-2.5 shadow-hard">
                    <span className="font-black text-accent">2.</span>
                    <div>
                      <strong className="text-fg font-bold">Mục đích sử dụng duy nhất:</strong> Phục vụ điểm danh, xác thực danh tính chấm công hàng ngày tại thiết bị Kiosk nội bộ. Tuyệt đối không dùng cho mục đích thương mại, theo dõi ngoài giờ làm việc hoặc chia sẻ cho bên thứ ba.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border-2 border-line flex gap-2.5 shadow-hard">
                    <span className="font-black text-accent">3.</span>
                    <div>
                      <strong className="text-fg font-bold">Mã hóa at-rest đa tầng:</strong> Vector sinh trắc học được mã hóa đối xứng chuẩn <strong>AES-256-GCM</strong> tại tầng ứng dụng trước khi lưu vào MongoDB, cách ly toàn vẹn theo từng doanh nghiệp (Multi-tenant Fail-Closed).
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border-2 border-line flex gap-2.5 shadow-hard">
                    <span className="font-black text-accent">4.</span>
                    <div>
                      <strong className="text-fg font-bold">Quyền rút lại sự đồng ý:</strong> Theo Khoản 2 Điều 14 Luật BVDLCN, chủ thể dữ liệu có quyền rút lại đồng ý bất cứ lúc nào. Khi rút lại đồng ý, hệ thống sẽ{' '}
                      <span className="text-rose-600 font-bold">
                        xóa vĩnh viễn vector trong CSDL ngay lập tức
                      </span>{' '}
                      và chuyển hình thức chấm công sang QR Code hoặc GPS Geofencing.
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox Explicit Consent */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-line bg-surface-2 cursor-pointer shadow-hard hover:bg-surface transition">
                <input
                  type="checkbox"
                  checked={hasAgreedConsent}
                  onChange={(e) => setHasAgreedConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-2 border-line text-ink focus:ring-lime cursor-pointer accent-lime"
                />
                <span className="text-xs text-fg leading-relaxed font-bold">
                  Chủ thể dữ liệu và Cán bộ Nhân sự xác nhận đã đọc, hiểu rõ và tự nguyện đồng ý cho phép thu thập vector khuôn mặt phục vụ chấm công theo đúng các điều khoản quy định tại Luật BVDLCN số 91/2025/QH15.
                </span>
              </label>

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-fg border-2 border-line rounded-xl hover:bg-surface-2 transition cursor-pointer shadow-hard"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={!hasAgreedConsent}
                  onClick={handleProceedToCapture}
                  className={`px-5 py-2.5 text-xs font-black rounded-xl border-2 border-line flex items-center gap-2 transition cursor-pointer uppercase tracking-wider ${
                    hasAgreedConsent
                      ? 'bg-lime text-ink shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1'
                      : 'bg-surface-2 text-muted border-line/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  Xác nhận & Bắt đầu Lấy mẫu trực tiếp
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 2: CAMERA CAPTURE ===================== */}
          {step === 'CAPTURE' && (
            <div className="space-y-4">
              {/* Cảnh báo an ninh HR giám sát */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/20 border-2 border-line text-xs text-fg font-bold shadow-hard">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>
                    <strong>HR ĐANG GIÁM SÁT TRỰC TIẾP TẠI VĂN PHÒNG:</strong> Bắt buộc lấy mẫu từ camera máy tính tại trụ sở, cấm nhân viên tự gửi ảnh từ xa.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-surface border-2 border-line text-fg font-mono font-black text-xs shadow-hard">
                  {samples.length}/{targetSampleCount} Mẫu
                </span>
              </div>

              {/* Lỗi Camera */}
              {cameraError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border-2 border-line text-rose-700 text-xs flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{cameraError}</span>
                  <button
                    onClick={startCameraAndModels}
                    className="ml-auto underline font-bold hover:text-rose-900 cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Lỗi Submit */}
              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border-2 border-line text-rose-700 text-xs flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Khung Camera View & Detections */}
              <div className="relative aspect-video w-full max-h-[340px] rounded-2xl overflow-hidden bg-black border-2 border-line flex items-center justify-center shadow-hard">
                {/* Thẻ Video luôn luôn hiện diện trong DOM để sẵn sàng nhận luồng camera */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />

                {/* Overlay khi đang nạp mô hình AI */}
                {loadingModels && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold">
                    <Loader2 className="w-8 h-8 animate-spin text-lime" />
                    <span>Đang nạp mạng nơ-ron MobileNet & khởi động camera...</span>
                  </div>
                )}

                {/* Vùng hướng dẫn định vị khuôn mặt (Oval Target) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-48 h-64 rounded-[999px] border-4 border-dashed transition-all duration-300 ${
                      facesCount === 1
                        ? 'border-lime shadow-[0_0_25px_rgba(204,255,0,0.6)]'
                        : facesCount > 1
                        ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]'
                        : 'border-white/50'
                    }`}
                  />
                </div>

                {/* Badge trạng thái khuôn mặt thời gian thực */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  {facesCount === 1 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime text-ink border-2 border-line text-xs font-black shadow-hard">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Phát hiện 1 khuôn mặt hợp lệ
                    </span>
                  ) : facesCount > 1 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white border-2 border-line text-xs font-black shadow-hard">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Cảnh báo: Có {facesCount} người (chỉ cho phép 1)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border-2 border-line text-fg text-xs font-bold shadow-hard">
                      <RefreshCw className="w-3 h-3 animate-spin text-accent" />
                      {cameraActive ? 'Đang tìm khuôn mặt...' : 'Đang bật camera...'}
                    </span>
                  )}
                </div>

                {/* Gợi ý góc chụp theo mẫu hiện tại */}
                <div className="absolute bottom-3 inset-x-0 mx-auto w-fit pointer-events-none">
                  <div className="px-4 py-1.5 rounded-full bg-surface border-2 border-line text-fg text-xs font-black shadow-hard">
                    {samples.length === 0 && '👉 Mẫu 1: Nhìn thẳng chính diện vào camera'}
                    {samples.length === 1 && '👉 Mẫu 2: Hơi nghiêng nhẹ góc mặt sang trái hoặc cười nhẹ'}
                    {samples.length === 2 && '👉 Mẫu 3: Hơi nghiêng nhẹ góc mặt sang phải'}
                    {samples.length >= 3 && '✅ Đã đủ 3 mẫu! Bấm Lưu trữ để hoàn tất'}
                  </div>
                </div>
              </div>

              {/* Danh sách 3 mẫu đã chụp & nút Chụp */}
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => {
                  const sample = samples[idx];
                  return (
                    <div
                      key={idx}
                      className={`relative p-3 rounded-2xl border-2 border-line transition-all shadow-hard ${
                        sample
                          ? 'bg-lime/10'
                          : idx === samples.length
                          ? 'bg-accent/10 ring-2 ring-accent'
                          : 'bg-surface-2 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-fg font-display">
                          Mẫu #{idx + 1}
                        </span>
                        {sample ? (
                          <span className="text-[10px] text-fg font-bold flex items-center gap-1 bg-lime px-2 py-0.5 rounded-md border border-line">
                            <CheckCircle2 className="w-3 h-3 text-ink" /> 128D
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted font-bold">Chờ chụp</span>
                        )}
                      </div>

                      {sample?.previewDataUrl ? (
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-line mb-1">
                          <img
                            src={sample.previewDataUrl}
                            alt={`Mẫu ${idx + 1}`}
                            className="w-full h-full object-cover -scale-x-100"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-bold text-white">
                            {sample.capturedAt}
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-line bg-surface flex items-center justify-center text-muted text-xs font-bold">
                          {idx === samples.length ? 'Đang chờ chụp' : 'Trống'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t-2 border-line">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSamples}
                    disabled={samples.length === 0 || submitting}
                    className="px-3.5 py-2 text-xs font-bold text-fg border-2 border-line rounded-xl hover:bg-surface-2 transition cursor-pointer shadow-hard disabled:opacity-40"
                  >
                    Chụp lại từ đầu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setStep('CONSENT');
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-fg border-2 border-line rounded-xl hover:bg-surface-2 transition cursor-pointer shadow-hard"
                  >
                    Xem lại điều khoản
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {samples.length < targetSampleCount ? (
                    <button
                      type="button"
                      disabled={facesCount !== 1 || !currentFaceDescriptor}
                      onClick={handleCaptureSample}
                      className={`px-5 py-2.5 text-xs font-black rounded-xl border-2 border-line flex items-center gap-2 transition cursor-pointer uppercase tracking-wider ${
                        facesCount === 1 && currentFaceDescriptor
                          ? 'bg-lime text-ink shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1'
                          : 'bg-surface-2 text-muted border-line/50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      Chụp Mẫu #{samples.length + 1}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitEnrollment}
                      className="px-6 py-2.5 text-xs font-black text-ink bg-lime border-2 border-line rounded-xl shadow-hard flex items-center gap-2 transition cursor-pointer uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-ink" />
                          Đang mã hóa AES-256-GCM & Lưu trữ...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-ink" />
                          Hoàn tất Đăng ký & Mã hóa Dữ liệu
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================== STEP 3: SUCCESS VIEW ===================== */}
          {step === 'SUCCESS' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-lime border-2 border-line flex items-center justify-center text-ink shadow-hard">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-fg font-display">
                  Đăng Ký Sinh Trắc Học Thành Công!
                </h3>
                <p className="text-xs text-muted mt-1 max-w-md mx-auto font-medium">
                  Đã thu thập 3 mẫu vector 128 chiều cho nhân sự{' '}
                  <span className="text-fg font-bold">{user.fullName}</span>, hoàn tất mã hóa tầng ứng dụng AES-256-GCM và ghi log kiểm toán theo Luật BVDLCN số 91/2025/QH15.
                </p>
              </div>

              {/* Thông số kỹ thuật xác thực */}
              <div className="w-full max-w-md p-4 rounded-2xl border-2 border-line bg-surface-2 text-xs space-y-2 text-left shadow-hard">
                <div className="flex justify-between">
                  <span className="text-muted font-bold">Số lượng mẫu embedding:</span>
                  <span className="font-black text-emerald-600">3 mẫu (128 chiều)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-bold">Cơ chế bảo mật at-rest:</span>
                  <span className="font-black text-accent">AES-256-GCM (Auth Tag 16B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-bold">Cán bộ HR giám sát lấy mẫu:</span>
                  <span className="font-black text-fg">{currentUser?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-bold">Phiên bản điều khoản BVDLCN:</span>
                  <span className="font-mono font-bold text-fg">v2026.1 (Hiệu lực 01/01/2026)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-bold">Khả năng chấm công FaceID:</span>
                  <span className="font-black text-emerald-600">Sẵn sàng tại Kiosk văn phòng</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="px-6 py-2.5 text-xs font-black bg-lime text-ink border-2 border-line rounded-xl shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition cursor-pointer uppercase tracking-wider"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
