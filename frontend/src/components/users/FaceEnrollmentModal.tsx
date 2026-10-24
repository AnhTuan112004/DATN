import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Reset when modal opens
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
  }, [isOpen]);

  // Dừng camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCurrentFaceDescriptor(null);
    setFacesCount(0);
  }, []);

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

  // Chuyển sang bước lấy mẫu sau khi đồng ý
  const handleProceedToCapture = async () => {
    if (!hasAgreedConsent) return;
    setStep('CAPTURE');
    await startCameraAndModels();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-indigo-500/10">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20 text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Đăng Ký Sinh Trắc Học Khuôn Mặt (FaceID)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                  Luật BVDLCN 91/2025
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhân sự: <span className="text-slate-200 font-medium">{user.fullName}</span> ({user.employeeCode}) • Giám sát trực tiếp bởi HR
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] ${
                step === 'CONSENT'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              1
            </span>
            <span className={step === 'CONSENT' ? 'font-semibold text-slate-200' : 'text-slate-400'}>
              Chấp thuận BVDLCN
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] ${
                step === 'CAPTURE'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50'
                  : step === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              2
            </span>
            <span className={step === 'CAPTURE' ? 'font-semibold text-slate-200' : 'text-slate-400'}>
              Thu thập 3 mẫu có HR
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] ${
                step === 'SUCCESS'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              3
            </span>
            <span className={step === 'SUCCESS' ? 'font-semibold text-slate-200' : 'text-slate-400'}>
              Mã hóa & Lưu trữ
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* ===================== STEP 1: CONSENT VIEW ===================== */}
          {step === 'CONSENT' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-200/90 leading-relaxed">
                  <span className="font-semibold text-indigo-300">Căn cứ pháp lý:</span> Khoản 1 Điều 11 & Điều 13 Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. Dữ liệu sinh trắc học khuôn mặt là dữ liệu cá nhân nhạy cảm, chỉ được thu thập khi có sự đồng ý minh thị tự nguyện của chủ thể dữ liệu và phải được bảo vệ nghiêm ngặt.
                </div>
              </div>

              {/* Thông tin xác lập */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Chủ thể dữ liệu (Người lao động):</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {user.fullName} ({user.employeeCode})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Cán bộ Nhân sự giám sát lấy mẫu:</span>
                  <p className="font-semibold text-indigo-400 mt-0.5">
                    {currentUser?.fullName} ({currentUser?.role})
                  </p>
                </div>
              </div>

              {/* 4 Điều khoản cam kết minh thị */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Điều khoản Xử lý Dữ liệu Sinh trắc học (Phiên bản v2026.1)
                </h4>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex gap-2.5">
                    <span className="font-bold text-indigo-400">1.</span>
                    <div>
                      <strong className="text-slate-100">Bản chất dữ liệu thu thập:</strong> Hệ thống chỉ trích xuất và lưu trữ vector toán học 128 chiều biểu diễn đặc trưng khuôn mặt (`descriptors[]`).{' '}
                      <span className="text-emerald-400 font-medium">
                        Tuyệt đối KHÔNG lưu trữ hình ảnh khuôn mặt thô (raw photos) trên máy chủ.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex gap-2.5">
                    <span className="font-bold text-indigo-400">2.</span>
                    <div>
                      <strong className="text-slate-100">Mục đích sử dụng duy nhất:</strong> Phục vụ điểm danh, xác thực danh tính chấm công hàng ngày tại thiết bị Kiosk nội bộ. Tuyệt đối không dùng cho mục đích thương mại, theo dõi ngoài giờ làm việc hoặc chia sẻ cho bên thứ ba.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex gap-2.5">
                    <span className="font-bold text-indigo-400">3.</span>
                    <div>
                      <strong className="text-slate-100">Mã hóa at-rest đa tầng:</strong> Vector sinh trắc học được mã hóa đối xứng chuẩn <strong>AES-256-GCM</strong> tại tầng ứng dụng trước khi lưu vào MongoDB, cách ly toàn vẹn theo từng doanh nghiệp (Multi-tenant Fail-Closed).
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex gap-2.5">
                    <span className="font-bold text-indigo-400">4.</span>
                    <div>
                      <strong className="text-slate-100">Quyền rút lại sự đồng ý:</strong> Theo Khoản 2 Điều 14 Luật BVDLCN, chủ thể dữ liệu có quyền rút lại đồng ý bất cứ lúc nào. Khi rút lại đồng ý, hệ thống sẽ{' '}
                      <span className="text-rose-400 font-medium">
                        xóa vĩnh viễn vector trong CSDL ngay lập tức
                      </span>{' '}
                      và chuyển hình thức chấm công sang QR Code hoặc GPS Geofencing.
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox Explicit Consent */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-700/80 bg-slate-850 cursor-pointer hover:border-indigo-500/50 transition">
                <input
                  type="checkbox"
                  checked={hasAgreedConsent}
                  onChange={(e) => setHasAgreedConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <span className="text-xs text-slate-200 leading-relaxed font-medium">
                  Chủ thể dữ liệu và Cán bộ Nhân sự xác nhận đã đọc, hiểu rõ và tự nguyện đồng ý cho phép thu thập vector khuôn mặt phục vụ chấm công theo đúng các điều khoản quy định tại Luật BVDLCN số 91/2025/QH15.
                </span>
              </label>

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={!hasAgreedConsent}
                  onClick={handleProceedToCapture}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
                    hasAgreedConsent
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>HR ĐANG GIÁM SÁT TRỰC TIẾP TẠI VĂN PHÒNG:</strong> Bắt buộc lấy mẫu từ camera máy tính tại trụ sở, cấm nhân viên tự gửi ảnh từ xa.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono font-bold">
                  {samples.length}/{targetSampleCount} Mẫu
                </span>
              </div>

              {/* Lỗi Camera */}
              {cameraError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{cameraError}</span>
                  <button
                    onClick={startCameraAndModels}
                    className="ml-auto underline font-medium hover:text-rose-200"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Lỗi Submit */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Khung Camera View & Detections */}
              <div className="relative aspect-video w-full max-h-[340px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {loadingModels ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span>Đang nạp mạng nơ-ron MobileNet & trích xuất khuôn mặt...</span>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />

                    {/* Vùng hướng dẫn định vị khuôn mặt (Oval Target) */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div
                        className={`w-48 h-64 rounded-[999px] border-2 border-dashed transition-all duration-300 ${
                          facesCount === 1
                            ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                            : facesCount > 1
                            ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                            : 'border-slate-500/50'
                        }`}
                      />
                    </div>

                    {/* Badge trạng thái khuôn mặt thời gian thực */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                      {facesCount === 1 ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[11px] font-semibold shadow">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Phát hiện 1 khuôn mặt hợp lệ
                        </span>
                      ) : facesCount > 1 ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-semibold shadow">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Cảnh báo: Có {facesCount} người trong khung hình (chỉ cho phép 1)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 backdrop-blur-md text-slate-300 text-[11px] font-medium shadow">
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                          Đang tìm khuôn mặt...
                        </span>
                      )}
                    </div>

                    {/* Gợi ý góc chụp theo mẫu hiện tại */}
                    <div className="absolute bottom-3 inset-x-0 mx-auto w-fit pointer-events-none">
                      <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-200 text-xs font-medium shadow-lg">
                        {samples.length === 0 && '👉 Mẫu 1: Nhìn thẳng chính diện vào camera'}
                        {samples.length === 1 && '👉 Mẫu 2: Hơi nghiêng nhẹ góc mặt sang trái hoặc cười nhẹ'}
                        {samples.length === 2 && '👉 Mẫu 3: Hơi nghiêng nhẹ góc mặt sang phải'}
                        {samples.length >= 3 && '✅ Đã đủ 3 mẫu! Bấm Lưu trữ để hoàn tất'}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Danh sách 3 mẫu đã chụp & nút Chụp */}
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => {
                  const sample = samples[idx];
                  return (
                    <div
                      key={idx}
                      className={`relative p-2.5 rounded-xl border transition-all ${
                        sample
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : idx === samples.length
                          ? 'border-indigo-500/60 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                          : 'border-slate-800 bg-slate-950/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-300">
                          Mẫu #{idx + 1}
                        </span>
                        {sample ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> 128D
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Chờ chụp</span>
                        )}
                      </div>

                      {sample?.previewDataUrl ? (
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-700 mb-1">
                          <img
                            src={sample.previewDataUrl}
                            alt={`Mẫu ${idx + 1}`}
                            className="w-full h-full object-cover -scale-x-100"
                          />
                          <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-slate-900/80 text-[9px] font-mono text-slate-300">
                            {sample.capturedAt}
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-700/80 bg-slate-900/40 flex items-center justify-center text-slate-600 text-[10px]">
                          {idx === samples.length ? 'Đang chờ chụp' : 'Trống'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSamples}
                    disabled={samples.length === 0 || submitting}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-40"
                  >
                    Chụp lại từ đầu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setStep('CONSENT');
                    }}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
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
                      className={`px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
                        facesCount === 1 && currentFaceDescriptor
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
                      className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition active:scale-95"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang mã hóa AES-256-GCM & Lưu trữ...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
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
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Đăng Ký Sinh Trắc Học Thành Công!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Đã thu thập 3 mẫu vector 128 chiều cho nhân sự{' '}
                  <span className="text-slate-200 font-semibold">{user.fullName}</span>, hoàn tất mã hóa tầng ứng dụng AES-256-GCM và ghi log kiểm toán theo Luật BVDLCN số 91/2025/QH15.
                </p>
              </div>

              {/* Thông số kỹ thuật xác thực */}
              <div className="w-full max-w-md p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Số lượng mẫu embedding:</span>
                  <span className="font-semibold text-emerald-400">3 mẫu (128 chiều)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cơ chế bảo mật at-rest:</span>
                  <span className="font-semibold text-indigo-400">AES-256-GCM (Auth Tag 16B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cán bộ HR giám sát lấy mẫu:</span>
                  <span className="font-semibold text-slate-200">{currentUser?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phiên bản điều khoản BVDLCN:</span>
                  <span className="font-mono text-slate-300">v2026.1 (Hiệu lực 01/01/2026)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khả năng chấm công FaceID:</span>
                  <span className="font-semibold text-emerald-400">Sẵn sàng tại Kiosk văn phòng</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="px-6 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/25 transition"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
