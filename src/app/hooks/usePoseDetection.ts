// ============================================================
// PoseDetection Hook — Data Layer / ML Kit Equivalent
// Uses TensorFlow.js + MoveNet SINGLEPOSE_LIGHTNING
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

  const stopDetection = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', errorMessage: '' }));

    try {
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
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Dynamically import TensorFlow.js to avoid blocking initial render
      setState(prev => ({ ...prev, status: 'loading' }));

      const tf = await import('@tensorflow/tfjs');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        }
      );

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
            const keypoints: Keypoint[] = poses[0].keypoints.map((kp: any) => ({
              name: kp.name,
              x: kp.x,
              y: kp.y,
              score: kp.score,
            }));

            setState(prev => ({
              ...prev,
              keypoints,
              status: 'detecting',
              fps: fpsRef.current,
            }));
          }
        } catch {
          // Silent: single frame error, keep loop going
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
    detectorRef.current = null;

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