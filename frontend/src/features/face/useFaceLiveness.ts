import { useState, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

export type ChallengeType = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT';

export type LivenessState =
  | 'IDLE'                  // Chưa bắt đầu
  | 'LOADING_MODELS'        // Đang tải weights
  | 'WAITING_FACE'          // Chờ phát hiện đúng 1 khuôn mặt chính diện
  | 'READY_FOR_CHALLENGE'   // Đã chụp V_start, sẵn sàng thực hiện thử thách
  | 'PERFORMING_CHALLENGE'  // Đang kiểm tra chuỗi thời gian thử thách
  | 'CHALLENGE_VERIFIED'    // Đã chụp V_end, thử thách liveness hoàn tất
  | 'FAILED_MULTI_FACES'    // Lỗi: Phát hiện nhiều hơn 1 khuôn mặt
  | 'FAILED_TIMEOUT';       // Lỗi: Quá thời gian quy định

export interface LivenessResult {
  vStart: Float32Array | null;
  vEnd: Float32Array | null;
  challengeType: ChallengeType;
  passed: boolean;
  durationMs: number;
}

export const useFaceLiveness = () => {
  const [state, setState] = useState<LivenessState>('IDLE');
  const [challenge, setChallenge] = useState<ChallengeType>('BLINK');
  const [instruction, setInstruction] = useState<string>('Vui lòng đưa khuôn mặt vào giữa khung hình');
  const [faceCount, setFaceCount] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0); // 0 - 100%

  // Lưu trữ 2 vector để server đối chiếu tính liên tục d(V_start, V_end) <= 0.40
  const vStartRef = useRef<Float32Array | null>(null);
  const vEndRef = useRef<Float32Array | null>(null);

  // Bộ nhớ đệm kiểm tra chuỗi thời gian (Temporal Transitions)
  const startTimeRef = useRef<number>(0);
  const blinkStagesRef = useRef<{ opened1: boolean; closed: boolean; opened2: boolean }>({
    opened1: false,
    closed: false,
    opened2: false,
  });
  const turnStagesRef = useRef<{ center1: boolean; turned: boolean; center2: boolean }>({
    center1: false,
    turned: false,
    center2: false,
  });

  /**
   * Bắt đầu một thử thách mới với Nonce từ Server
   */
  const startChallenge = useCallback((challengeType: ChallengeType, challengeInstruction: string) => {
    setChallenge(challengeType);
    setInstruction(challengeInstruction);
    setState('WAITING_FACE');
    setProgress(0);
    vStartRef.current = null;
    vEndRef.current = null;
    startTimeRef.current = performance.now();
    blinkStagesRef.current = { opened1: false, closed: false, opened2: false };
    turnStagesRef.current = { center1: false, turned: false, center2: false };
  }, []);

  /**
   * Phân tích khung hình từ camera (được gọi từ requestAnimationFrame)
   */
  const processFrame = useCallback(
    (detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | undefined, allFacesCount: number) => {
      setFaceCount(allFacesCount);

      // Quy tắc bảo mật: Nếu phát hiện > 1 khuôn mặt trong khung hình -> TỪ CHỐI NGAY
      if (allFacesCount > 1) {
        setState('FAILED_MULTI_FACES');
        setInstruction('CẢNH BÁO: Phát hiện nhiều hơn 1 người! Vui lòng chỉ đứng một mình trước Kiosk.');
        return;
      }

      if (!detection) {
        if (state !== 'WAITING_FACE' && state !== 'IDLE') {
          setInstruction('Vui lòng giữ khuôn mặt cố định trong khung hình');
        }
        return;
      }

      const landmarks = detection.landmarks;
      const descriptor = detection.descriptor;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const mouth = landmarks.getMouth();
      const nose = landmarks.getNose();

      // 1. Tính toán các chỉ số hình học
      // EAR ước lượng (khoảng cách mí mắt)
      const eyeDistL = Math.abs(leftEye[1].y - leftEye[5].y);
      const eyeDistR = Math.abs(rightEye[1].y - rightEye[5].y);
      const eyeClosed = eyeDistL < 5.0 || eyeDistR < 5.0;
      const eyeOpen = eyeDistL >= 4.5 && eyeDistR >= 4.5;

      // MAR ước lượng (khoảng cách môi)
      const mouthDist = Math.abs(mouth[13].y - mouth[19].y);
      const isMouthOpen = mouthDist > 11;

      // Head Pose Yaw (Độ lệch sống mũi so với tâm 2 mắt)
      const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
      const noseTipX = nose[3].x;
      const yawOffset = Math.round(noseTipX - eyeMidX);
      const isCenter = Math.abs(yawOffset) <= 12;
      // Cho phép quay đầu linh hoạt (hỗ trợ cả webcam thường và webcam lật gương)
      const isTurnedLeft = yawOffset < -13 || yawOffset > 13;
      const isTurnedRight = yawOffset > 13 || yawOffset < -13;

      // 2. Chuyển đổi trạng thái Liveness theo chuỗi thời gian
      if (state === 'WAITING_FACE') {
        // Yêu cầu mặt nhìn thẳng chính diện ban đầu để chụp V_start
        if (isCenter && !eyeClosed) {
          vStartRef.current = new Float32Array(descriptor);
          setState('PERFORMING_CHALLENGE');
          startTimeRef.current = performance.now();
          blinkStagesRef.current = { opened1: true, closed: false, opened2: false };
          turnStagesRef.current = { center1: true, turned: false, center2: false };
        }
        return;
      }

      if (state === 'PERFORMING_CHALLENGE') {
        const elapsed = performance.now() - startTimeRef.current;
        if (elapsed > 60000) {
          setState('FAILED_TIMEOUT');
          setInstruction('Thử thách đã quá thời gian 60 giây. Vui lòng lấy thử thách mới.');
          return;
        }
        if (challenge === 'BLINK') {
          // Chuỗi: Mở ban đầu -> Nhắm (100-800ms) -> Mở lại
          if (blinkStagesRef.current.opened1 && eyeClosed) {
            blinkStagesRef.current.closed = true;
            setProgress(50);
            setInstruction('Đang chớp mắt... Bây giờ hãy mở mắt ra');
          } else if (blinkStagesRef.current.closed && eyeOpen) {
            blinkStagesRef.current.opened2 = true;
            setProgress(100);
            vEndRef.current = new Float32Array(descriptor);
            setState('CHALLENGE_VERIFIED');
            setInstruction('✓ Xác thực sống thành công! Đang đối chiếu danh tính...');
          }
        } else if (challenge === 'SMILE') {
          if (isMouthOpen) {
            setProgress(100);
            vEndRef.current = new Float32Array(descriptor);
            setState('CHALLENGE_VERIFIED');
            setInstruction('✓ Xác thực sống thành công! Đang đối chiếu danh tính...');
          }
        } else if (challenge === 'TURN_LEFT' || challenge === 'TURN_RIGHT') {
          if (turnStagesRef.current.center1 && isTurnedLeft) {
            turnStagesRef.current.turned = true;
            setProgress(60);
            setInstruction('Tuyệt vời! Bây giờ hãy quay mặt lại chính diện');
          } else if (turnStagesRef.current.turned && isCenter) {
            turnStagesRef.current.center2 = true;
            setProgress(100);
            vEndRef.current = new Float32Array(descriptor);
            setState('CHALLENGE_VERIFIED');
            setInstruction('✓ Xác thực sống thành công! Đang đối chiếu danh tính...');
          }
        }
      }
    },
    [state, challenge]
  );

  const resetLiveness = useCallback(() => {
    setState('IDLE');
    setProgress(0);
    vStartRef.current = null;
    vEndRef.current = null;
    setInstruction('Vui lòng đưa khuôn mặt vào giữa khung hình');
  }, []);

  return {
    state,
    challenge,
    instruction,
    faceCount,
    progress,
    vStart: vStartRef.current,
    vEnd: vEndRef.current,
    startChallenge,
    processFrame,
    resetLiveness,
  };
};
