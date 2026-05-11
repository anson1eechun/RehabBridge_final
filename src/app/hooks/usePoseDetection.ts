// ============================================================
// PoseDetection Hook — Data Layer / ML Kit Equivalent
// Uses TensorFlow.js + BlazePose (accuracy-first) with fallback
// Provides real-time keypoints at ~30fps via requestAnimationFrame
// ============================================================

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Keypoint } from '../utils/angleCalculator';

export type PoseStatus = 'idle' | 'loading' | 'ready' | 'detecting' | 'error' | 'no-camera';

export interface PoseDetectionState {
  keypoints: Keypoint[];
  status: PoseStatus;
  errorMessage: string;
  fps: number;
}

let tfReadyPromise: Promise<void> | null = null;
let poseDetectionModulePromise: Promise<any> | null = null;
let sharedDetectorPromise: Promise<any> | null = null;
let sharedDetector: any = null;

const ensureTfReady = async () => {
  if (!tfReadyPromise) {
    tfReadyPromise = (async () => {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
    })();
  }
  await tfReadyPromise;
};

const getPoseDetectionModule = async () => {
  if (!poseDetectionModulePromise) {
    poseDetectionModulePromise = import('@tensorflow-models/pose-detection');
  }
  return poseDetectionModulePromise;
};

const createDetectorWithFallback = async () => {
  await ensureTfReady();
  const poseDetection = await getPoseDetectionModule();

  // Accuracy first: BlazePose gives denser lower-body keypoints for rehab joints.
  try {
    return await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
        modelType: 'full',
        enableSmoothing: true,
      }
    );
  } catch (e) {
    console.warn('BlazePose mediapipe failed, fallback to BlazePose tfjs.', e);
  }

  try {
    return await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      {
        runtime: 'tfjs',
        modelType: 'full',
        enableSmoothing: true,
      }
    );
  } catch (e) {
    console.warn('BlazePose tfjs failed, fallback to MoveNet.', e);
  }

  return await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    }
  );
};

const getSharedDetector = async () => {
  if (sharedDetector) return sharedDetector;
  if (!sharedDetectorPromise) {
    sharedDetectorPromise = createDetectorWithFallback()
      .then((detector) => {
        sharedDetector = detector;
        return detector;
      })
      .catch((err) => {
        sharedDetectorPromise = null;
        throw err;
      });
  }
  return sharedDetectorPromise;
};

const resetSharedDetector = () => {
  try {
    sharedDetector?.dispose?.();
  } catch {
    // no-op
  }
  sharedDetector = null;
  sharedDetectorPromise = null;
};

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean
) {
  const [state, setState] = useState<PoseDetectionState>({
    keypoints: [],
    status: 'idle',
    errorMessage: '',
    fps: 0,
  });

  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const frameErrorCount = useRef<number>(0);

  const stopDetection = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', errorMessage: '' }));

    try {
      const detectorPromise = getSharedDetector();

      // Request camera stream (front camera for iPad)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      const videoReadyPromise = new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      await Promise.all([videoReadyPromise, detectorPromise]);
      const detector = await detectorPromise;

      detectorRef.current = detector;
      setState(prev => ({ ...prev, status: 'detecting' }));

      // Start detection loop
      const detect = async () => {
        if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        if (video.readyState < 2) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        try {
          const poses = await detectorRef.current.estimatePoses(video);

          // FPS calculation
          const now = performance.now();
          frameCount.current++;
          if (now - lastFrameTime.current >= 1000) {
            fpsRef.current = frameCount.current;
            frameCount.current = 0;
            lastFrameTime.current = now;
          }

          if (poses.length > 0) {
            const keypoints: Keypoint[] = poses[0].keypoints.map((kp: any, index: number) => ({
              name: kp.name,
              x: kp.x,
              y: kp.y,
              score: kp.score,
              index,
            }));

            setState(prev => ({
              ...prev,
              keypoints,
              status: 'detecting',
              fps: fpsRef.current,
            }));
            frameErrorCount.current = 0;
          } else {
            setState(prev => ({
              ...prev,
              keypoints: [],
              status: 'detecting',
              fps: fpsRef.current,
            }));
          }
        } catch (err) {
          frameErrorCount.current += 1;
          if (frameErrorCount.current % 30 === 0) {
            console.warn('Pose frame estimation repeatedly failed:', err);
          }
          if (frameErrorCount.current > 120) {
            resetSharedDetector();
            setState(prev => ({
              ...prev,
              status: 'error',
              errorMessage: '姿態偵測暫時失敗，請按重試或重新整理頁面',
            }));
            stopDetection();
            return;
          }
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    } catch (err: any) {
      const isPermission =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setState(prev => ({
        ...prev,
        status: isPermission ? 'no-camera' : 'error',
        errorMessage: isPermission
          ? '請允許相機存取權限以使用復健追蹤功能'
          : '無法啟動相機，請確認裝置支援',
      }));
    }
  }, [videoRef, canvasRef]);

  const stopCamera = useCallback(() => {
    stopDetection();
    // Keep shared detector for next start to reduce warm-up latency.
    detectorRef.current = sharedDetector;

    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }

    setState({
      keypoints: [],
      status: 'idle',
      errorMessage: '',
      fps: 0,
    });
  }, [videoRef, stopDetection]);

  useEffect(() => {
    // Warm up model in idle time so first "start" feels instant.
    const warmup = () => {
      void getSharedDetector().catch(() => {
        // ignore; start flow still has fallback + error UI
      });
    };

    const idleId = (window as any).requestIdleCallback?.(warmup, { timeout: 1200 });
    if (!(window as any).requestIdleCallback) {
      const timer = window.setTimeout(warmup, 200);
      return () => window.clearTimeout(timer);
    }

    return () => {
      (window as any).cancelIdleCallback?.(idleId);
    };
  }, []);

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      // Cleanup hold timers and camera on unmount
      stopDetection();
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, startCamera, stopCamera };
}