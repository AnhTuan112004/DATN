import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import {
  Camera,
  CheckCircle2,
  Activity,
  Download,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TrialRecord {
  trialId: number;
  subjectId: string;
  samePerson: boolean;
  lightingCondition: 'NORMAL' | 'LOW_LIGHT';
  livenessPassed: boolean;
  challengeType: string;
  cosineDistance: number;
  euclideanDistance: number;
  latencyMs: number;
  fps: number;
  isSpoofAttempt: boolean;
  verdict: 'MATCH' | 'MISMATCH';
  timestamp: string;
}

export const SpikeFaceBench: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Real-time Metrics
  const [fps, setFps] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [detectedFaces, setDetectedFaces] = useState<number>(0);

  // Liveness States
  const [eyeBlink, setEyeBlink] = useState<boolean>(false);
  const [mouthOpen, setMouthOpen] = useState<boolean>(false);
  const [headYaw, setHeadYaw] = useState<number>(0);
  const [currentChallenge, setCurrentChallenge] = useState<string>('CHỚP MẮT');
  const [challengePassed, setChallengePassed] = useState<boolean>(false);

  // Verification & Descriptors
  const [registeredDescriptor, setRegisteredDescriptor] = useState<Float32Array | null>(null);
  const [currentDescriptor, setCurrentDescriptor] = useState<Float32Array | null>(null);
  const [euclideanDist, setEuclideanDist] = useState<number | null>(null);
  const [cosineDist, setCosineDist] = useState<number | null>(null);
  const [euclideanThreshold, setEuclideanThreshold] = useState<number>(0.6);

  // Trial Experiment Logging
  const [subjectId, setSubjectId] = useState<string>('NV_01');
  const [lighting, setLighting] = useState<'NORMAL' | 'LOW_LIGHT'>('NORMAL');
  const [isSpoof, setIsSpoof] = useState<boolean>(false);
  const [trials, setTrials] = useState<TrialRecord[]>([]);

  // 1. Tải Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        console.log('[FaceID Spike] Đang tải các models từ:', MODEL_URL);

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setModelsLoaded(true);
        console.log('[FaceID Spike] Đã tải xong SSD MobileNetV1, Landmarks 68 & Recognition Net!');
      } catch (err: any) {
        console.error('[FaceID Spike Error] Tải model thất bại:', err);
        setLoadingError(`Không thể tải model từ /models: ${err.message}. Đang thử tải từ CDN dự phòng...`);
        // Fallback to vladmandic CDN if local models not yet copied
        try {
          const CDN_URL = 'https://vladmandic.github.io/face-api/model';
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL),
          ]);
          setModelsLoaded(true);
          setLoadingError(null);
          console.log('[FaceID Spike] Đã tải thành công từ CDN dự phòng!');
        } catch (cdnErr: any) {
          setLoadingError(`Lỗi tải model CDN: ${cdnErr.message}`);
        }
      }
    };

    loadModels();
  }, []);

  // 2. Khởi động WebRTC Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      alert(`Không thể mở Camera: ${err.message}`);
    }
  };

  // 3. Tính toán khoảng cách Euclid & Cosine
  const calculateDistances = useCallback((v1: Float32Array, v2: Float32Array) => {
    let sumSq = 0;
    let dotProd = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < v1.length; i++) {
      const diff = v1[i] - v2[i];
      sumSq += diff * diff;
      dotProd += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }

    const euclid = Math.sqrt(sumSq);
    const cosineSim = dotProd / (Math.sqrt(normA) * Math.sqrt(normB));
    const cosine = 1 - cosineSim;

    return {
      euclidean: parseFloat(euclid.toFixed(4)),
      cosine: parseFloat(cosine.toFixed(4)),
    };
  }, []);

  // 4. Vòng lặp Detection & Liveness
  useEffect(() => {
    if (!modelsLoaded || !cameraActive) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const detectLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === 4) {
        const startTime = performance.now();

        const detections = await faceapi
          .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const processTime = Math.round(performance.now() - startTime);
        setLatency(processTime);

        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          setFps(Math.round((frameCount * 1000) / (now - lastTime)));
          frameCount = 0;
          lastTime = now;
        }

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections) {
          setDetectedFaces(1);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          setCurrentDescriptor(detections.descriptor);

          // Phân tích Landmarks: Mắt & Miệng
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const mouth = landmarks.getMouth();
          const nose = landmarks.getNose();

          // EAR (Eye Aspect Ratio) ước lượng
          const eyeDistL = Math.abs(leftEye[1].y - leftEye[5].y);
          const eyeDistR = Math.abs(rightEye[1].y - rightEye[5].y);
          const isBlinking = eyeDistL < 4 && eyeDistR < 4;
          setEyeBlink(isBlinking);

          // MAR (Mouth Aspect Ratio) ước lượng
          const mouthOpenDist = Math.abs(mouth[13].y - mouth[19].y);
          const isOpen = mouthOpenDist > 14;
          setMouthOpen(isOpen);

          // Ước lượng Head Pose Yaw (Độ lệch sống mũi so với tâm 2 mắt)
          const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
          const noseTipX = nose[3].x;
          const yawOffset = Math.round(noseTipX - eyeMidX);
          setHeadYaw(yawOffset);

          // Kiểm tra thử thách Liveness
          if (currentChallenge === 'CHỚP MẮT' && isBlinking) {
            setChallengePassed(true);
          } else if (currentChallenge === 'HÁ MIỆNG' && isOpen) {
            setChallengePassed(true);
          } else if (currentChallenge === 'QUAY MẶT SANG PHẢI' && yawOffset > 15) {
            setChallengePassed(true);
          } else if (currentChallenge === 'QUAY MẶT SANG TRÁI' && yawOffset < -15) {
            setChallengePassed(true);
          }

          // So khớp với mẫu đã đăng ký
          if (registeredDescriptor) {
            const { euclidean, cosine } = calculateDistances(detections.descriptor, registeredDescriptor);
            setEuclideanDist(euclidean);
            setCosineDist(cosine);
          }
        } else {
          setDetectedFaces(0);
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    detectLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [modelsLoaded, cameraActive, registeredDescriptor, currentChallenge, calculateDistances]);

  // 5. Đăng ký mẫu khuôn mặt
  const handleRegister = () => {
    if (currentDescriptor) {
      setRegisteredDescriptor(new Float32Array(currentDescriptor));
      alert(`✅ Đã đăng ký thành công vector embedding 128 chiều cho [${subjectId}]!`);
    } else {
      alert('⚠️ Chưa phát hiện khuôn mặt để đăng ký.');
    }
  };

  // 6. Ghi lượt thực nghiệm (Log Trial)
  const handleLogTrial = () => {
    if (euclideanDist === null || cosineDist === null) {
      alert('⚠️ Chưa có dữ liệu so khớp khoảng cách để ghi nhận.');
      return;
    }

    const isMatch = euclideanDist <= euclideanThreshold;
    const newTrial: TrialRecord = {
      trialId: trials.length + 1,
      subjectId,
      samePerson: !isSpoof,
      lightingCondition: lighting,
      livenessPassed: challengePassed,
      challengeType: currentChallenge,
      cosineDistance: cosineDist,
      euclideanDistance: euclideanDist,
      latencyMs: latency,
      fps,
      isSpoofAttempt: isSpoof,
      verdict: isMatch ? 'MATCH' : 'MISMATCH',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };

    setTrials((prev) => [...prev, newTrial]);
  };

  // 7. Xuất file CSV
  const handleExportCSV = () => {
    if (trials.length === 0) {
      alert('Chưa có lượt thử nghiệm nào để xuất.');
      return;
    }

    const headers = 'trial_id,subject_id,same_person,lighting_condition,liveness_passed,challenge_type,cosine_distance,euclidean_distance,latency_ms,fps,is_spoof_attempt,verdict,timestamp\n';
    const rows = trials
      .map(
        (t) =>
          `${t.trialId},${t.subjectId},${t.samePerson},${t.lightingCondition},${t.livenessPassed},${t.challengeType},${t.cosineDistance},${t.euclideanDistance},${t.latencyMs},${t.fps},${t.isSpoofAttempt},${t.verdict},${t.timestamp}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `faceid_trials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 8. Đổi thử thách ngẫu nhiên
  const nextChallenge = () => {
    const list = ['CHỚP MẮT', 'HÁ MIỆNG', 'QUAY MẶT SANG PHẢI', 'QUAY MẶT SANG TRÁI'];
    const next = list[(list.indexOf(currentChallenge) + 1) % list.length];
    setCurrentChallenge(next);
    setChallengePassed(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SPIKE ① BENCHMARK
            </span>
            <span className="text-xs text-slate-400">14–15/10/2026 • Tuần 0</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mt-1">
            FaceID Kiosk 2 Tầng: Đo Lường Thực Nghiệm Browser
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {modelsLoaded ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" /> Models Sẵn Sàng (SSD MobileNetV1 + 128D)
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded-lg animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải Models...
            </div>
          )}
        </div>
      </header>

      {loadingError && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300">
          ⚠️ {loadingError}
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Camera & Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />

            {!cameraActive && (
              <div className="z-10 text-center space-y-3 p-6">
                <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-400">Camera chưa được kích hoạt</p>
                <button
                  onClick={startCamera}
                  disabled={!modelsLoaded}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  Bật Camera Kiểm Thử
                </button>
              </div>
            )}

            {/* Live Badges on Top */}
            {cameraActive && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60 text-xs">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-cyan-400">{fps} FPS</span>
                  <span className="text-slate-400">|</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-400">{latency} ms</span>
                </div>

                <div
                  className={`px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border ${
                    challengePassed
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                      : 'bg-rose-950/80 text-rose-400 border-rose-700'
                  }`}
                >
                  {challengePassed ? '✓ LIVENESS ĐẠT' : `THỬ THÁCH: ${currentChallenge}`}
                </div>
              </div>
            )}
          </div>

          {/* Controls bên dưới video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Mã đối tượng (Subject):</label>
              <input
                type="text"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Ánh sáng:</label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="NORMAL">Bình thường (300–500 lux)</option>
                <option value="LOW_LIGHT">Thiếu sáng (&lt; 100 lux)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Kiểu test:</label>
              <select
                value={isSpoof ? 'SPOOF' : 'REAL'}
                onChange={(e) => setIsSpoof(e.target.value === 'SPOOF')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="REAL">Người thật (Genuine)</option>
                <option value="SPOOF">Giả mạo (Ảnh tĩnh/Video)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Ngưỡng Euclid:</label>
              <input
                type="number"
                step="0.05"
                min="0.2"
                max="1.0"
                value={euclideanThreshold}
                onChange={(e) => setEuclideanThreshold(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Cột 3: Bảng chỉ số Liveness & So khớp */}
        <div className="space-y-4">
          {/* Card Tầng 1: Liveness Check */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Tầng 1: Liveness Indicators
              </h2>
              <button
                onClick={nextChallenge}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Đổi thử thách
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block">Chớp mắt (EAR):</span>
                <span className={`font-bold ${eyeBlink ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {eyeBlink ? 'ĐANG CHỚP' : 'MỞ MẮT'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block">Há miệng (MAR):</span>
                <span className={`font-bold ${mouthOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {mouthOpen ? 'ĐANG HÁ' : 'KHÉP'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block">Góc quay đầu (Yaw):</span>
                <span className="font-bold text-indigo-400">{headYaw}°</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block">Khuôn mặt phát hiện:</span>
                <span className={`font-bold ${detectedFaces > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {detectedFaces} khuôn mặt
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-900/40 text-xs">
              <span className="text-indigo-400 font-semibold block mb-0.5">Yêu cầu thử thách:</span>
              <p className="text-slate-300">
                Thực hiện hành động: <strong className="text-amber-400">{currentChallenge}</strong>
              </p>
            </div>
          </div>

          {/* Card Tầng 2: So khớp Face Embedding */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Tầng 2: So Khớp Embedding (128-D)
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Mẫu đăng ký:</span>
                <span className="font-semibold text-slate-200">
                  {registeredDescriptor ? '✅ Đã lưu vector 128-d' : 'Chưa đăng ký'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Khoảng cách Euclid:</span>
                <span className={`font-bold ${euclideanDist !== null && euclideanDist <= euclideanThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {euclideanDist !== null ? euclideanDist : '---'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Khoảng cách Cosine:</span>
                <span className="font-bold text-cyan-400">
                  {cosineDist !== null ? cosineDist : '---'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Kết luận nhận diện:</span>
                {euclideanDist !== null ? (
                  euclideanDist <= euclideanThreshold ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      ✓ KHỚP DANH TÍNH
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                      ✗ KHÔNG KHỚP
                    </span>
                  )
                ) : (
                  <span className="text-slate-500">Chờ so khớp...</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleRegister}
                disabled={!currentDescriptor}
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Đăng Ký Mẫu
              </button>

              <button
                onClick={handleLogTrial}
                disabled={euclideanDist === null}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Ghi Lượt Thử
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Thực Nghiệm đã thu thập */}
      <div className="max-w-7xl mx-auto mt-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Nhật Ký Lượt Thử Nghiệm (trials.csv) — Tổng: {trials.length} lượt
            </h3>
            <p className="text-xs text-slate-400">Phục vụ vẽ đường cong ROC và tính chỉ số FAR / FRR</p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={trials.length === 0}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs shadow transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất File CSV
          </button>
        </div>

        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Đối tượng</th>
                <th className="py-2 px-3">Ánh sáng</th>
                <th className="py-2 px-3">Liveness</th>
                <th className="py-2 px-3">Thử thách</th>
                <th className="py-2 px-3">Euclid</th>
                <th className="py-2 px-3">Cosine</th>
                <th className="py-2 px-3">Độ trễ</th>
                <th className="py-2 px-3">FPS</th>
                <th className="py-2 px-3">Kết luận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {trials.map((t) => (
                <tr key={t.trialId} className="hover:bg-slate-800/40">
                  <td className="py-1.5 px-3">{t.trialId}</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-200">{t.subjectId}</td>
                  <td className="py-1.5 px-3">{t.lightingCondition}</td>
                  <td className="py-1.5 px-3">
                    {t.livenessPassed ? (
                      <span className="text-emerald-400 font-semibold">ĐẠT</span>
                    ) : (
                      <span className="text-rose-400 font-semibold">TỪ CHỐI</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3">{t.challengeType}</td>
                  <td className="py-1.5 px-3 font-mono">{t.euclideanDistance}</td>
                  <td className="py-1.5 px-3 font-mono">{t.cosineDistance}</td>
                  <td className="py-1.5 px-3">{t.latencyMs}ms</td>
                  <td className="py-1.5 px-3">{t.fps}</td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.verdict === 'MATCH'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {t.verdict}
                    </span>
                  </td>
                </tr>
              ))}
              {trials.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-4 text-center text-slate-500">
                    Chưa có lượt thử nghiệm nào được ghi. Hãy bật camera, đăng ký mẫu và bấm "Ghi Lượt Thử".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpikeFaceBench;
