// ============================================================
// RehabSession — 復健訓練頁面
// Live camera + TF.js MoveNet skeleton + real-time angle
// Voice coaching via Web Speech API
// Doctor-prescribed target angle comparison
// ============================================================

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Volume2, VolumeX, Play, Pause,
  CheckCircle, AlertCircle, RotateCcw, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useVoiceCoach } from '../hooks/useVoiceCoach';
import { SkeletonCanvas } from '../components/SkeletonCanvas';
import { AngleGauge } from '../components/AngleGauge';
import {
  extractAngleFromKeypoints,
  getAngleResult,
  mirrorJointTriplet,
  getJointTripletConfidence,
  type JointRef,
} from '../utils/angleCalculator';
import { mockExercises, mockPrescriptions } from '../data/mockData';
import { appendSessionRecord } from '../data/sessionStore';

const PATIENT_ID = 'P001';
/** 患者端：inline style 字級統一放大（約 +22%） */
const patientPx = (px: number) => Math.round(px * 1.22);
export default function RehabSession() {
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [holdCountdown, setHoldCountdown] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [repArmed, setRepArmed] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'warning'>('info');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFeedbackRef = useRef<string>('');
  const lastFeedbackTimeRef = useRef<number>(0);
  const sessionStartRef = useRef<number | null>(null);
  const angleStatsRef = useRef({ sum: 0, count: 0, max: 0 });
  const sessionSavedRef = useRef(false);
  const voiceFeedbackCountRef = useRef(0);
  const goalBriefAnnouncedRef = useRef(false);

  // Resolve exercise + prescription
  const exercise = mockExercises.find(e => e.id === exerciseId);
  const prescription = mockPrescriptions.find(
    p => p.patientId === PATIENT_ID && p.exerciseId === exerciseId
  );
  const targetAngle = prescription?.targetAngle ?? exercise?.targetAngle ?? 90;
  const tolerance = exercise?.tolerance ?? 10;
  const totalSets = prescription?.sets ?? exercise?.sets ?? 3;
  const totalReps = prescription?.reps ?? exercise?.reps ?? 10;
  const holdSeconds = prescription?.holdSeconds ?? exercise?.holdSeconds ?? 3;

  // Senior-friendly mode: lower threshold so movements are easier to complete.
  const effectiveTolerance = Math.max(tolerance, 15);
  const effectiveHoldSeconds = Math.max(1, Math.min(holdSeconds, 2));
  const repRearmMargin = 6;

  // Pose detection hook
  const { keypoints, status, errorMessage, fps } = usePoseDetection(
    videoRef,
    canvasRef,
    isActive
  );

  // Voice coach hook
  const { speak, setEnabled: setVoiceSetting } = useVoiceCoach({
    throttleMs: 3000,
    lang: 'zh-TW',
    rate: 0.9,
    pitch: 1.0,
  });

  const goalBriefItems = [
    `今天做「${exercise?.name ?? '本次動作'}」`,
    `目標角度 ${targetAngle}°`,
    `每組 ${totalReps} 次，共 ${totalSets} 組`,
    `每次保持 ${effectiveHoldSeconds} 秒`,
  ];

  const buildGoalBriefText = useCallback(() => {
    return `先聽今天的目標。${goalBriefItems.join('。')}。準備好後按開始偵測。`;
  }, [goalBriefItems]);

  const speakGoalBrief = useCallback(() => {
    speak(buildGoalBriefText(), true, 'zh-TW');
  }, [buildGoalBriefText, speak]);

  const getVoiceText = useCallback((key: string, n?: number) => {
    switch (key) {
      case 'start':
        return exercise?.voicePrompts.start ?? '請開始動作';
      case 'achieved':
        return exercise?.voicePrompts.achieved ?? '很棒！已達到目標角度，請保持';
      case 'complete':
        return exercise?.voicePrompts.complete ?? '恭喜！全部訓練完成！';
      case 'setComplete':
        return `第 ${n ?? 1} 組完成，請休息一下`;
      case 'repComplete':
        return `第 ${n ?? 1} 次`;
      case 'tooLow':
        return exercise?.voicePrompts.tooLow ?? '請繼續加大動作幅度';
      case 'tooHigh':
        return (exercise?.voicePrompts as any)?.tooHigh ?? '請稍微放鬆一些';
      case 'paused':
        return '訓練已暫停';
      case 'resume':
        return '繼續訓練';
      default:
        return '';
    }
  }, [exercise]);

  const speakLocalized = useCallback(
    (key: string, force = false, n?: number) => {
      voiceFeedbackCountRef.current += 1;
      const zhText = getVoiceText(key, n);
      speak(zhText, force, 'zh-TW');
    },
    [getVoiceText, speak]
  );

  // Toggle voice
  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    setVoiceSetting(next);
  };

  // Calculate current angle from keypoints with left/right auto fallback.
  const primaryJoints = (exercise?.joints ?? [0, 0, 0]) as [JointRef, JointRef, JointRef];
  const mirroredJoints = mirrorJointTriplet(primaryJoints);
  const primaryAngle = exercise?.joints
    ? extractAngleFromKeypoints(keypoints, primaryJoints)
    : null;
  const mirroredAngle = exercise?.joints
    ? extractAngleFromKeypoints(keypoints, mirroredJoints)
    : null;

  const primaryConfidence = exercise?.joints
    ? getJointTripletConfidence(keypoints, primaryJoints)
    : 0;
  const mirroredConfidence = exercise?.joints
    ? getJointTripletConfidence(keypoints, mirroredJoints)
    : 0;

  const sideLockRef = useRef<'primary' | 'mirrored'>('primary');
  const scorePrimary =
    (primaryAngle !== null ? 1 : 0) * 1000 +
    primaryConfidence * 100 +
    (primaryAngle !== null ? Math.max(0, 180 - Math.abs(targetAngle - primaryAngle)) : 0);
  const scoreMirrored =
    (mirroredAngle !== null ? 1 : 0) * 1000 +
    mirroredConfidence * 100 +
    (mirroredAngle !== null ? Math.max(0, 180 - Math.abs(targetAngle - mirroredAngle)) : 0);

  let chosenSide: 'primary' | 'mirrored' = sideLockRef.current;
  if (primaryAngle === null && mirroredAngle !== null) {
    chosenSide = 'mirrored';
  } else if (mirroredAngle === null && primaryAngle !== null) {
    chosenSide = 'primary';
  } else if (primaryAngle !== null && mirroredAngle !== null) {
    // Hysteresis to prevent frame-to-frame side flicker when both sides are visible.
    const switchThreshold = 12;
    if (scoreMirrored > scorePrimary + switchThreshold) {
      chosenSide = 'mirrored';
    } else if (scorePrimary > scoreMirrored + switchThreshold) {
      chosenSide = 'primary';
    }
  }
  sideLockRef.current = chosenSide;

  const useMirrored = chosenSide === 'mirrored';

  const activeJoints = useMirrored ? mirroredJoints : primaryJoints;
  const detectedAngle = useMirrored ? mirroredAngle : primaryAngle;
  const currentAngle = detectedAngle ?? 0;
  const hasValidAngle = detectedAngle !== null;

  useEffect(() => {
    sideLockRef.current = 'primary';
  }, [exerciseId]);

  useEffect(() => {
    goalBriefAnnouncedRef.current = false;
  }, [exerciseId]);

  const [displayAngle, setDisplayAngle] = useState(0);
  const displayAngleRef = useRef(0);
  const displayRafRef = useRef<number | null>(null);

  // Keep camera overlay angle and gauge angle in sync by sharing one smoothed value.
  useEffect(() => {
    if (!hasValidAngle) {
      displayAngleRef.current = 0;
      setDisplayAngle(0);
      if (displayRafRef.current) {
        cancelAnimationFrame(displayRafRef.current);
        displayRafRef.current = null;
      }
      return;
    }

    const target = currentAngle;
    if (displayRafRef.current) {
      cancelAnimationFrame(displayRafRef.current);
    }

    const animate = () => {
      const current = displayAngleRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.15) {
        displayAngleRef.current = target;
        setDisplayAngle(target);
        displayRafRef.current = null;
        return;
      }

      // Fast smoothing to remain responsive but stable for chart path rendering.
      const step = Math.sign(diff) * Math.min(Math.abs(diff) * 0.45 + 0.8, 10);
      const next = current + step;
      displayAngleRef.current = next;
      setDisplayAngle(next);
      displayRafRef.current = requestAnimationFrame(animate);
    };

    displayRafRef.current = requestAnimationFrame(animate);

    return () => {
      if (displayRafRef.current) {
        cancelAnimationFrame(displayRafRef.current);
      }
    };
  }, [currentAngle, hasValidAngle]);

  const uiAngle = Math.round(displayAngle);
  const uiAngleResult = getAngleResult(uiAngle, targetAngle, effectiveTolerance);
  const angleResult = getAngleResult(currentAngle, targetAngle, effectiveTolerance);

  useEffect(() => {
    if (!sessionStarted || !isActive || !hasValidAngle || sessionComplete) return;
    angleStatsRef.current.sum += currentAngle;
    angleStatsRef.current.count += 1;
    angleStatsRef.current.max = Math.max(angleStatsRef.current.max, currentAngle);
  }, [currentAngle, hasValidAngle, isActive, sessionStarted, sessionComplete]);

  // Lock viewport scrolling on this full-screen rehab page (iPad/PWA friendly).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyTouchAction = body.style.touchAction;

    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.touchAction = 'manipulation';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, []);

  // Video resize observer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      if (video.videoWidth > 0) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
    };
    video.addEventListener('loadedmetadata', update);
    video.addEventListener('resize', update);
    return () => {
      video.removeEventListener('loadedmetadata', update);
      video.removeEventListener('resize', update);
    };
  }, []);

  // Voice & hold logic when angle changes
  useEffect(() => {
    if (!sessionStarted || !isActive || !hasValidAngle || sessionComplete) return;

    const now = Date.now();
    const isThrottled = now - lastFeedbackTimeRef.current < 3000;

    if (angleResult.status === 'achieved' && repArmed) {
      if (!isHolding) {
        setIsHolding(true);
        setHoldCountdown(effectiveHoldSeconds);
        if (!isThrottled || lastFeedbackRef.current !== 'achieved') {
          speakLocalized('achieved', false);
          setFeedbackMessage(`✅ 達到目標！保持 ${effectiveHoldSeconds} 秒`);
          setFeedbackType('success');
          lastFeedbackRef.current = 'achieved';
          lastFeedbackTimeRef.current = now;
        }
        // Hold countdown
        let count = effectiveHoldSeconds;
        holdTimerRef.current = setInterval(() => {
          count--;
          setHoldCountdown(count);
          if (count <= 0) {
            clearInterval(holdTimerRef.current!);
            setIsHolding(false);
            setRepArmed(false);
            // Count rep
            setCurrentRep(prev => {
              const next = prev + 1;
              if (next >= totalReps) {
                // Set complete
                setCurrentSet(prevSet => {
                  const nextSet = prevSet + 1;
                  if (nextSet > totalSets) {
                    setSessionComplete(true);
                    setIsActive(false);
                    speakLocalized('complete', false);
                    setFeedbackMessage('🎉 訓練完成！');
                    setFeedbackType('success');
                  } else {
                    speakLocalized('setComplete', false, prevSet);
                    setFeedbackMessage(`第 ${prevSet} 組完成，準備下一組`);
                    setFeedbackType('info');
                  }
                  return nextSet > totalSets ? prevSet : nextSet;
                });
                return 0;
              }
              speakLocalized('repComplete', false, next);
              setFeedbackMessage(`第 ${next} 次完成`);
              setFeedbackType('info');
              return next;
            });
          }
        }, 1000);
      }
    } else {
      setIsHolding(false);
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // Re-arm counting only after leaving target zone, preventing duplicate counts
      // while user is still holding around target angle.
      const absDeviation = Math.abs(currentAngle - targetAngle);
      if (!repArmed && absDeviation > effectiveTolerance + repRearmMargin) {
        setRepArmed(true);
      }

      if (!isThrottled) {
        if (angleResult.status === 'below') {
          speakLocalized('tooLow', false);
          setFeedbackMessage('📈 請繼續加大動作幅度');
          setFeedbackType('warning');
        } else if (angleResult.status === 'above') {
          speakLocalized('tooHigh', false);
          setFeedbackMessage('📉 請稍微放鬆一些');
          setFeedbackType('warning');
        }
        lastFeedbackTimeRef.current = now;
        lastFeedbackRef.current = angleResult.status;
      }
    }
  }, [
    angleResult.status,
    currentAngle,
    hasValidAngle,
    sessionStarted,
    isActive,
    sessionComplete,
    repArmed,
    effectiveTolerance,
    effectiveHoldSeconds,
    totalReps,
    totalSets,
    targetAngle,
    exercise,
    speakLocalized,
  ]);

  useEffect(() => {
    if (!sessionComplete || !exerciseId || sessionSavedRef.current) return;
    const startedAt = sessionStartRef.current ?? Date.now();
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const stats = angleStatsRef.current;
    const avgAngle = stats.count > 0 ? Math.round(stats.sum / stats.count) : 0;
    const maxAngle = Math.round(stats.max || 0);

    const angleAccuracy = Math.max(0, 100 - Math.abs(targetAngle - avgAngle) * 2);
    const score = Math.max(0, Math.min(100, Math.round(angleAccuracy * 0.8 + 20)));

    appendSessionRecord({
      patientId: PATIENT_ID,
      exerciseId,
      date: new Date().toISOString().split('T')[0],
      duration: elapsedMinutes,
      completedSets: totalSets,
      completedReps: totalReps,
      avgAngle,
      maxAngle,
      targetAngle,
      score,
      voiceFeedbackCount: voiceFeedbackCountRef.current,
    });
    sessionSavedRef.current = true;
  }, [exerciseId, sessionComplete, targetAngle, totalReps, totalSets]);

  useEffect(() => {
    if (!exercise || sessionStarted || status === 'loading' || goalBriefAnnouncedRef.current) return;
    goalBriefAnnouncedRef.current = true;
    setFeedbackMessage('請先看本次目標，準備好再開始偵測');
    setFeedbackType('info');
    speakGoalBrief();
  }, [exercise, sessionStarted, speakGoalBrief, status]);

  // Start session
  const handleStart = () => {
    setIsActive(true);
    setSessionStarted(true);
    setRepArmed(true);
    sessionStartRef.current = Date.now();
    angleStatsRef.current = { sum: 0, count: 0, max: 0 };
    voiceFeedbackCountRef.current = 0;
    sessionSavedRef.current = false;
    setFeedbackMessage(exercise?.voicePrompts.start ?? '請開始動作');
    setFeedbackType('info');
    speakLocalized('start', true);
  };

  const handlePause = () => {
    setIsActive(false);
    speakLocalized('paused', true);
    setFeedbackMessage('訓練已暫停');
    setFeedbackType('info');
  };

  const handleResume = () => {
    setIsActive(true);
    speakLocalized('resume', true);
    setFeedbackMessage('繼續訓練');
    setFeedbackType('info');
  };

  const handleRestart = () => {
    setCurrentSet(1);
    setCurrentRep(0);
    setSessionComplete(false);
    setIsHolding(false);
    setHoldCountdown(0);
    setRepArmed(true);
    setIsActive(true);
    setSessionStarted(true);
    sessionStartRef.current = Date.now();
    angleStatsRef.current = { sum: 0, count: 0, max: 0 };
    voiceFeedbackCountRef.current = 0;
    sessionSavedRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EEF2F7' }}>
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p style={{ fontSize: patientPx(18), color: '#546E7A' }}>找不到此訓練項目</p>
          <button onClick={() => navigate('/patient')} className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white">
            返回
          </button>
        </div>
      </div>
    );
  }

  const angleColor =
    uiAngleResult.status === 'achieved' ? '#66BB6A' :
    uiAngleResult.status === 'below' ? '#EF5350' :
    '#FFA726';

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col" style={{ background: '#111D2D' }}>
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-5 py-4" style={{ background: '#1A2840', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => { setIsActive(false); navigate('/patient'); }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl hover:bg-white/10 transition-colors"
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: patientPx(16),
            minHeight: 48,
            minWidth: 96,
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <div className="text-center px-2">
          <div
            style={{
              color: 'white',
              fontWeight: 800,
              fontSize: !sessionStarted ? patientPx(22) : patientPx(17),
              lineHeight: 1.2,
            }}
          >
            {exercise.name}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: !sessionStarted ? patientPx(16) : patientPx(12),
              fontWeight: !sessionStarted ? 600 : 400,
              marginTop: 4,
            }}
          >
            目標 {targetAngle}° · 陳志明醫師
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* FPS indicator */}
          {status === 'detecting' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(102,187,106,0.2)' }}>
              <Wifi size={12} style={{ color: '#66BB6A' }} />
              <span style={{ fontSize: patientPx(11), color: '#66BB6A' }}>{fps}fps</span>
              <span style={{ fontSize: patientPx(11), color: 'rgba(255,255,255,0.65)' }}>· {keypoints.length}pts</span>
              <span style={{ fontSize: patientPx(11), color: hasValidAngle ? '#69F0AE' : '#FFA726' }}>
                · angle {hasValidAngle ? 'ok' : '--'}
              </span>
            </div>
          )}
          <button
            onClick={toggleVoice}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            style={{ color: voiceEnabled ? '#69F0AE' : 'rgba(255,255,255,0.4)' }}
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      {/* Main Layout: Camera + Sidebar */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {/* Camera Feed Column */}
        <div className="flex-1 relative bg-black overflow-hidden" ref={videoContainerRef}>
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', display: status === 'idle' ? 'none' : 'block' }}
            playsInline
            muted
          />

          {/* Skeleton Canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', pointerEvents: 'none' }}
          />
          <SkeletonCanvas
            canvasRef={canvasRef}
            keypoints={keypoints}
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            highlightJoints={activeJoints}
          />

          {/* Loading / Error Overlay */}
          <AnimatePresence>
            {(status === 'idle' || status === 'loading') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: '#0D1B2A' }}
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-24 h-24 border-[5px] border-blue-400 border-t-transparent rounded-full animate-spin mb-8" />
                    <p style={{ color: 'white', fontSize: patientPx(28), fontWeight: 700 }}>正在載入姿態偵測模型...</p>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: patientPx(22), marginTop: 12, fontWeight: 600 }}>
                      首次載入需數秒，請稍候
                    </p>
                  </>
                ) : (
                  <div className="text-center px-6 sm:px-10 w-full max-w-xl mx-auto">
                    <div
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-6 sm:mb-8 mx-auto"
                      style={{ background: 'rgba(102,187,106,0.15)' }}
                    >
                      <CheckCircle size={64} style={{ color: '#66BB6A' }} />
                    </div>
                    <h2
                      style={{
                        color: 'white',
                        fontSize: 'clamp(2.1rem, 5.5vw, 2.85rem)',
                        fontWeight: 800,
                        marginBottom: 24,
                        lineHeight: 1.25,
                      }}
                    >
                      {exercise.name}
                    </h2>
                    <div
                      className="rounded-3xl px-6 py-5 sm:px-8 sm:py-6 mb-6 sm:mb-8 text-left border border-white/10"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      {goalBriefItems.map((item, i) => (
                        <p
                          key={item}
                          style={{
                            color: 'rgba(255,255,255,0.95)',
                            fontSize: 'clamp(1.45rem, 4.2vw, 1.88rem)',
                            lineHeight: 1.65,
                            fontWeight: 600,
                            marginBottom: i === goalBriefItems.length - 1 ? 0 : 14,
                          }}
                        >
                          • {item}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={handleStart}
                      className="w-full py-6 sm:py-7 rounded-2xl text-white flex items-center justify-center gap-3 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #42A5F5, #1976D2)',
                        fontSize: 'clamp(1.45rem, 4vw, 1.9rem)',
                        fontWeight: 800,
                      }}
                    >
                      <Play size={36} className="shrink-0" />
                      我知道了，開始偵測
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Camera */}
          {(status === 'no-camera' || status === 'error') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
              <WifiOff size={48} style={{ color: '#EF5350', marginBottom: 16 }} />
              <p style={{ color: 'white', fontSize: patientPx(18), fontWeight: 600 }}>{errorMessage}</p>
              <button
                onClick={() => { setIsActive(false); setTimeout(() => setIsActive(true), 100); }}
                className="mt-6 px-6 py-3 rounded-xl flex items-center gap-2 text-white"
                style={{ background: '#1565C0', fontSize: patientPx(15) }}
              >
                <RotateCcw size={16} /> 重試
              </button>
            </div>
          )}

          {/* In-session real-time angle overlay (bottom of camera) */}
          {sessionStarted && status === 'detecting' && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              {/* Current angle badge */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="px-5 py-3 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              >
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: patientPx(12) }}>即時角度</div>
                <div style={{ color: angleColor, fontSize: patientPx(36), fontWeight: 800, lineHeight: 1.1 }}>
                  {hasValidAngle ? `${uiAngle}°` : '--'}
                </div>
              </motion.div>

              {/* Hold countdown */}
              {isHolding && holdCountdown > 0 && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-5 py-3 rounded-2xl text-center"
                  style={{ background: 'rgba(102,187,106,0.85)', backdropFilter: 'blur(8px)' }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: patientPx(12) }}>保持</div>
                  <div style={{ color: 'white', fontSize: patientPx(36), fontWeight: 800, lineHeight: 1.1 }}>
                    {holdCountdown}
                  </div>
                </motion.div>
              )}

              {/* Deviation indicator */}
              <div className="px-4 py-3 rounded-2xl text-right"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: patientPx(12) }}>目標差距</div>
                <div style={{
                  color: uiAngleResult.status === 'achieved' ? '#66BB6A' : '#FFA726',
                  fontSize: patientPx(22), fontWeight: 700, lineHeight: 1.2
                }}>
                  {!hasValidAngle
                    ? '追蹤中...'
                    : uiAngleResult.status === 'achieved'
                      ? '✓ 達標'
                      : `${Math.abs(uiAngleResult.deviation)}°`}
                </div>
              </div>
            </div>
          )}

          {/* Session Complete Overlay */}
          {sessionComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle size={80} style={{ color: '#66BB6A', margin: '0 auto 16px' }} />
              </motion.div>
              <h2 style={{ color: 'white', fontSize: patientPx(28), fontWeight: 800, marginBottom: 8 }}>
                訓練完成！
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: patientPx(16), marginBottom: 32 }}>
                {totalSets} 組 × {totalReps} 次 · 最高角度 {currentAngle}°
              </p>
              <div className="flex gap-3">
                <button onClick={handleRestart}
                  className="px-6 py-3 rounded-2xl flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: patientPx(16) }}>
                  <RotateCcw size={18} /> 再做一次
                </button>
                <button onClick={() => navigate('/patient')}
                  className="px-6 py-3 rounded-2xl flex items-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)', fontSize: patientPx(16), fontWeight: 700 }}>
                  <CheckCircle size={18} /> 完成返回
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar — Stats & Controls */}
        <div
          className="flex flex-col gap-0 overflow-y-auto"
          style={{
            width: !sessionStarted ? 348 : 292,
            minWidth: !sessionStarted ? 320 : undefined,
            background: '#1A2840',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >

          {/* Angle Gauge */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <AngleGauge
              currentAngle={sessionStarted ? uiAngle : 0}
              targetAngle={targetAngle}
              tolerance={effectiveTolerance}
              size={260}
            />
          </div>

          {/* Set/Rep Counter */}
          {sessionStarted && (
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(21,101,192,0.2)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: patientPx(12), marginBottom: 2 }}>組次</div>
                  <div style={{ color: 'white', fontSize: patientPx(24), fontWeight: 700 }}>
                    {Math.min(currentSet, totalSets)}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: patientPx(14) }}>/{totalSets}</span>
                  </div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(102,187,106,0.15)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: patientPx(12), marginBottom: 2 }}>次數</div>
                  <div style={{ color: '#69F0AE', fontSize: patientPx(24), fontWeight: 700 }}>
                    {currentRep}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: patientPx(14) }}>/{totalReps}</span>
                  </div>
                </div>
              </div>

              {/* Rep progress dots */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Array.from({ length: totalReps }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all"
                    style={{
                      width: 10, height: 10,
                      background: i < currentRep ? '#66BB6A' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feedback Message */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: !sessionStarted ? patientPx(15) : patientPx(11),
                fontWeight: !sessionStarted ? 700 : 400,
                marginBottom: 8,
              }}
            >
              語音提示
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={feedbackMessage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-3"
                style={{
                  background:
                    feedbackType === 'success' ? 'rgba(102,187,106,0.15)' :
                    feedbackType === 'warning' ? 'rgba(255,167,38,0.15)' :
                    'rgba(255,255,255,0.06)',
                  padding: !sessionStarted ? '16px 14px' : undefined,
                }}
              >
                <p style={{
                  color:
                    feedbackType === 'success' ? '#69F0AE' :
                    feedbackType === 'warning' ? '#FFA726' :
                    'rgba(255,255,255,0.82)',
                  fontSize: !sessionStarted ? patientPx(20) : patientPx(14),
                  lineHeight: !sessionStarted ? 1.55 : 1.5,
                  fontWeight: !sessionStarted ? 600 : 400,
                }}>
                  {feedbackMessage || '等待開始訓練...'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Exercise Info */}
          <div className="p-4 border-b flex-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: !sessionStarted ? patientPx(15) : patientPx(11),
                fontWeight: !sessionStarted ? 700 : 400,
                marginBottom: 10,
              }}
            >
              訓練資訊
            </div>
            {[
              { label: '目標角度', value: `${targetAngle}°`, color: '#FFD600' },
              { label: '容許誤差', value: `±${effectiveTolerance}°`, color: 'rgba(255,255,255,0.6)' },
              { label: '保持時間', value: `${effectiveHoldSeconds} 秒`, color: 'rgba(255,255,255,0.6)' },
              { label: '頻率', value: prescription?.frequency ?? '每天兩次', color: 'rgba(255,255,255,0.6)' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center gap-2 mb-2.5">
                <span
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: !sessionStarted ? patientPx(18) : patientPx(13),
                    fontWeight: !sessionStarted ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    color: item.color,
                    fontSize: !sessionStarted ? patientPx(18) : patientPx(13),
                    fontWeight: 700,
                    textAlign: 'right',
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}

            {prescription?.notes && (
              <div
                className="mt-3 rounded-xl"
                style={{
                  background: 'rgba(255,214,0,0.08)',
                  padding: !sessionStarted ? '14px 12px' : '12px',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: !sessionStarted ? patientPx(14) : patientPx(11),
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  醫師備注
                </div>
                <p
                  style={{
                    color: '#FFD600',
                    fontSize: !sessionStarted ? patientPx(17) : patientPx(12),
                    lineHeight: 1.55,
                    fontWeight: !sessionStarted ? 600 : 400,
                  }}
                >
                  {prescription.notes}
                </p>
              </div>
            )}
          </div>

          {/* 訓練中才顯示控制鈕；開始請用畫面中央「我知道了，開始偵測」 */}
          {sessionStarted && (
            <div className="p-4">
              <div className="flex gap-2">
                {isActive ? (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: patientPx(15), fontWeight: 600 }}
                  >
                    <Pause size={18} /> 暫停
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 text-white"
                    style={{ background: 'linear-gradient(135deg, #42A5F5, #1976D2)', fontSize: patientPx(15), fontWeight: 600 }}
                  >
                    <Play size={18} /> 繼續
                  </button>
                )}
                <button
                  onClick={() => navigate('/patient')}
                  className="px-4 py-4 rounded-2xl"
                  style={{ background: 'rgba(239,83,80,0.15)', color: '#EF5350', fontSize: patientPx(15), fontWeight: 600 }}
                >
                  結束
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}