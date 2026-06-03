// ============================================================
// RehabSession — 復健訓練頁面
// Live camera + TF.js MoveNet skeleton + real-time angle
// Voice coaching via Web Speech API
// Doctor-prescribed target angle comparison
// ============================================================

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Volume2, VolumeX, Play, Pause,
  CheckCircle, AlertCircle, RotateCcw, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useVoiceCoach } from '../hooks/useVoiceCoach';
import { isOpenAiConfigured, wantsOpenAiFromEnv } from '../services/openaiTts';
import {
  isYatingConfigured,
  wantsYatingFromEnv,
  resolveYatingVoiceModelForExercise,
  resolveYatingMandarinVoiceModel,
  resolveYatingTaiwaneseVoiceModel,
} from '../services/yatingTts';
import { SkeletonCanvas } from '../components/SkeletonCanvas';
import { AngleGauge } from '../components/AngleGauge';
import { RehabGamePanel } from '../components/RehabGamePanel';
import {
  extractAngleFromKeypoints,
  getAngleResult,
  mirrorJointTriplet,
  getJointTripletConfidence,
  type JointRef,
} from '../utils/angleCalculator';
import { mockExercises } from '../data/mockData';
import { appendSessionRecord, getMergedSessionRecords } from '../data/sessionStore';
import { getTodayIsoDate, recordTrainingCompletion } from '../data/progressStore';
import { resolvePrescriptionPlan, usePrescriptions } from '../data/prescriptionStore';
import { getRehabGameForExercise } from '../data/rehabGameCatalog';
import { getRehabExerciseGuidance } from '../data/rehabExerciseGuidance';
import { getExerciseTrackingMode, isGuidedTrackingMode } from '../data/guidedExerciseCatalog';
import {
  CARE_TEAM_CONVERSATION_ID,
  sendConversationMessage,
} from '../data/messageStore';
import {
  buildRehabCoachLine,
  getLocalAiCoachLabel,
  requestLocalAiCoachLine,
  type RehabCoachEvent,
  type RehabCoachContext,
} from '../data/rehabCompanionCoach';
import { readVoiceDialectPreference } from '../utils/voiceDialectPreference';
import {
  formatSecondsSpokenZh,
  integerToZhSpeech,
  ordinalRepCountForSpeech,
  ordinalSetCountForSpeech,
} from '../utils/minNanSpeechNumbers';

const PATIENT_ID = 'P001';
/** 患者端：inline style 字級統一放大（約 +22%） */
const patientPx = (px: number) => Math.round(px * 1.22);
const REST_SECONDS = 15;

interface SessionSummary {
  score: number;
  avgAngle: number;
  maxAngle: number;
  duration: number;
  stabilityPercent: number | null;
  message: string;
}

export default function RehabSession() {
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [focusMode, setFocusMode] = useState<'camera' | 'game'>('camera');
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [holdCountdown, setHoldCountdown] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  const [repArmed, setRepArmed] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'warning'>('info');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [painScore, setPainScore] = useState(0);
  const [safetyStopped, setSafetyStopped] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  /** 僅依長者首頁選擇（localStorage），復健頁內不提供語言按鈕 */
  const [voiceDialect, setVoiceDialect] = useState(() => readVoiceDialectPreference());

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSetRef = useRef<number | null>(null);
  const lastFeedbackRef = useRef<string>('');
  const lastFeedbackTimeRef = useRef<number>(0);
  const sessionStartRef = useRef<number | null>(null);
  const angleStatsRef = useRef({ sum: 0, count: 0, max: 0 });
  const sessionSavedRef = useRef(false);
  const voiceFeedbackCountRef = useRef(0);
  const goalBriefAnnouncedRef = useRef(false);
  const painAlertSentRef = useRef(false);
  const prescriptions = usePrescriptions();

  // Resolve exercise + prescription
  const exercise = mockExercises.find(e => e.id === exerciseId);
  const rehabGame = getRehabGameForExercise(exercise?.id);
  const rehabGuidance = getRehabExerciseGuidance(exercise?.id);
  const prescription = prescriptions.find(
    p => p.patientId === PATIENT_ID && p.exerciseId === exerciseId
  );
  const prescriptionPlan = prescription && exercise
    ? resolvePrescriptionPlan(prescription, exercise)
    : null;
  const difficultyLevel = prescriptionPlan?.difficultyLevel ?? 2;
  const difficultyLabel = prescriptionPlan?.difficultyLabel ?? '標準';
  const targetAngle = prescriptionPlan?.effectiveTargetAngle ?? exercise?.targetAngle ?? 90;
  const tolerance = prescriptionPlan?.effectiveTolerance ?? exercise?.tolerance ?? 10;
  const totalSets = prescriptionPlan?.effectiveSets ?? exercise?.sets ?? 3;
  const totalReps = prescriptionPlan?.effectiveReps ?? exercise?.reps ?? 10;
  const holdSeconds = prescriptionPlan?.effectiveHoldSeconds ?? exercise?.holdSeconds ?? 3;
  const safetyMinAngle = prescriptionPlan?.safetyMinAngle ?? Math.max(0, targetAngle - 20);
  const safetyMaxAngle = prescriptionPlan?.safetyMaxAngle ?? Math.min(175, targetAngle + 20);
  const safetyNote =
    prescriptionPlan?.safetyNote ??
    '疼痛達 7/10 時，系統會建議停止並通知照護團隊。';
  const trackingMode = getExerciseTrackingMode(exercise, prescription);

  useEffect(() => {
    if (!exercise || !isGuidedTrackingMode(trackingMode)) return;
    navigate(`/patient/guided/${prescription?.id ?? `AUTO-${exercise.id}`}`, { replace: true });
  }, [exercise, trackingMode, prescription?.id, navigate]);

  const effectiveTolerance = tolerance;
  const effectiveHoldSeconds = holdSeconds;
  const repRearmMargin = 6;

  // Pose detection hook
  const { keypoints, status, errorMessage, fps } = usePoseDetection(
    videoRef,
    canvasRef,
    isActive
  );

  const wantsYating = wantsYatingFromEnv();
  const yatingReady = isYatingConfigured();
  const wantsOpenAi = wantsOpenAiFromEnv();
  const openAiReady = isOpenAiConfigured();
  /** 雲端擇一：VITE_TTS_PROVIDER=yating 且金鑰就緒 → 雅婷；否則 openai；否則本機 */
  const ttsProvider =
    wantsYating && yatingReady ? 'yating' : wantsOpenAi && openAiReady ? 'openai' : 'browser';

  /** 該動作是否另有台語陪練稿（無則選台語時仍用台語聲線唸國語稿） */
  const hasTaiPromptsForExercise = Boolean(exercise?.voicePromptsTai);

  /** 與長者首頁國／台語連動：選台語且走雅婷時，每個動作都用 tai_*，不限於膝蓋彎曲 */
  const yatingVoiceModel = useMemo(() => {
    if (ttsProvider !== 'yating') return undefined;
    if (voiceDialect === 'taiwanese') {
      return resolveYatingVoiceModelForExercise(exercise) ?? resolveYatingTaiwaneseVoiceModel();
    }
    return resolveYatingMandarinVoiceModel();
  }, [ttsProvider, voiceDialect, exercise]);

  // 本機再略慢、少尖聲；國語／台語由 voiceDialect 決定雅婷聲線（zh_en_* vs tai_*）
  const { speak, setEnabled: setVoiceSetting } = useVoiceCoach({
    throttleMs: 3000,
    lang: 'zh-TW',
    rate: ttsProvider === 'browser' ? 0.88 : 0.92,
    pitch: ttsProvider === 'browser' ? 0.98 : 1.0,
    ttsProvider,
    yatingVoiceModel,
  });

  /** 與語音開場條列：依長者首頁語言偏好（voiceDialect）顯示國語或台語 */
  const goalBriefItems = useMemo(() => {
    const name = exercise?.name ?? '這個動作';
    const zh: string[] = [
      `今天是「${name}」`,
      `角度大概抓 ${targetAngle} 度就行`,
      `一組 ${totalReps} 下，總共 ${totalSets} 組`,
      `有對到先停 ${effectiveHoldSeconds} 秒`,
    ];
    const tai: string[] = [
      `今仔日是「${name}」`,
      `角度大約 ${targetAngle} 度就好`,
      `一組 ${totalReps} 下，攏總 ${totalSets} 組`,
      `有對著先停 ${effectiveHoldSeconds} 秒`,
    ];
    return voiceDialect === 'taiwanese' ? tai : zh;
  }, [
    exercise?.name,
    voiceDialect,
    targetAngle,
    totalReps,
    totalSets,
    effectiveHoldSeconds,
  ]);

  const professionalBriefText = useMemo(() => {
    const steps = rehabGuidance.whatToDo.slice(0, 2).join('。');
    const precautions = rehabGuidance.precautions.slice(0, 2).join('。');
    return `等等要做：${steps}。注意事項：${precautions}。`;
  }, [rehabGuidance]);

  const buildGoalBriefText = useCallback(() => {
    const name = exercise?.name ?? '這個動作';
    if (voiceDialect === 'taiwanese') {
      return `共你講一下，今仔日是「${name}」。角度大約${targetAngle}度就好，一組${totalReps}下、攏總${totalSets}組；有對著就定${effectiveHoldSeconds}秒。莫急，看畫面，欲開始才按開始。`;
    }
    return `跟你講一下，今天是「${name}」。角度大概抓${targetAngle}度就行，一組${totalReps}下、總共${totalSets}組；有對到就停${effectiveHoldSeconds}秒。不用急，看好畫面，準備好了再按開始。`;
  }, [
    exercise?.name,
    voiceDialect,
    targetAngle,
    totalReps,
    totalSets,
    effectiveHoldSeconds,
  ]);

  const speakGoalBrief = useCallback(() => {
    speak(`${buildGoalBriefText()} ${professionalBriefText}`, true, 'zh-TW');
  }, [buildGoalBriefText, professionalBriefText, speak]);

  const handleListenGoalBrief = useCallback(() => {
    speakGoalBrief();
  }, [speakGoalBrief]);

  const getVoiceText = useCallback(
    (key: string, n?: number) => {
      const tai = exercise?.voicePromptsTai;
      const useTai = voiceDialect === 'taiwanese' && tai != null;
      switch (key) {
        case 'start':
          return (useTai ? tai.start : exercise?.voicePrompts.start) ?? '好，開始做啦';
        case 'achieved':
          return (useTai ? tai.achieved : exercise?.voicePrompts.achieved) ?? '有矣，角度有對，先停咧';
        case 'complete':
          return (useTai ? tai.complete : exercise?.voicePrompts.complete) ?? '今仔日按呢就會使，先歇喘';
        case 'setComplete':
          return useTai
            ? `${ordinalSetCountForSpeech(n ?? 1)}先到這。喘一下，等等閣下一組`
            : `${ordinalSetCountForSpeech(n ?? 1)}先到這。喘一下，等等再下一組`;
        case 'repComplete':
          return useTai
            ? `${ordinalRepCountForSpeech(n ?? 1)}有了啦`
            : `${ordinalRepCountForSpeech(n ?? 1)}有了`;
        case 'tooLow':
          return (useTai ? tai!.tooLow : exercise?.voicePrompts.tooLow) ?? '猶差一屑仔，再開一點沒關係';
        case 'tooHigh':
          return useTai
            ? (exercise?.voicePromptsTai?.tooHigh ?? '收一屑仔啦，莫硬拚')
            : ((exercise?.voicePrompts as { tooHigh?: string })?.tooHigh ?? '收一點，別硬拚');
        case 'paused':
          return useTai ? '好，先停啦' : '好，先停';
        case 'resume':
          return useTai ? '好，閣繼續' : '行，繼續';
        default:
          return '';
      }
    },
    [exercise, voiceDialect]
  );

  const speakLocalized = useCallback(
    (key: string, force = false, n?: number) => {
      voiceFeedbackCountRef.current += 1;
      const zhText = getVoiceText(key, n);
      speak(zhText, force, 'zh-TW');
    },
    [getVoiceText, speak]
  );

  const localCoachLabel = getLocalAiCoachLabel();

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

  useEffect(() => {
    setVoiceDialect(readVoiceDialectPreference());
    setSessionStarted(false);
    setIsActive(false);
  }, [exerciseId]);

  /** 與首頁國／台語按鈕連動（同頁事件、他分頁 localStorage） */
  useEffect(() => {
    const sync = () => setVoiceDialect(readVoiceDialectPreference());
    window.addEventListener('rehab-voice-dialect-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('rehab-voice-dialect-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

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

  const buildCoachContext = useCallback(
    (overrides: Partial<RehabCoachContext> = {}): RehabCoachContext => ({
      exerciseName: exercise?.name ?? '這個動作',
      bodyArea: exercise?.bodyArea,
      targetAngle,
      currentAngle: hasValidAngle ? Math.round(currentAngle) : undefined,
      deviation: hasValidAngle ? Math.round(currentAngle - targetAngle) : undefined,
      holdSeconds: effectiveHoldSeconds,
      currentRep,
      totalReps,
      currentSet,
      totalSets,
      ...overrides,
    }),
    [
      exercise?.name,
      exercise?.bodyArea,
      targetAngle,
      hasValidAngle,
      currentAngle,
      effectiveHoldSeconds,
      currentRep,
      totalReps,
      currentSet,
      totalSets,
    ]
  );

  const deliverCoachLine = useCallback(
    (
      event: RehabCoachEvent,
      overrides: Partial<RehabCoachContext> = {},
      options: {
        type?: 'info' | 'success' | 'warning';
        force?: boolean;
        speakLine?: boolean;
        allowLocalAi?: boolean;
      } = {}
    ) => {
      const ctx = buildCoachContext(overrides);
      const fallbackLine = buildRehabCoachLine(event, ctx);
      const shouldSpeak = options.speakLine ?? true;

      setFeedbackMessage(fallbackLine);
      setFeedbackType(options.type ?? 'info');

      if (shouldSpeak) {
        voiceFeedbackCountRef.current += 1;
        speak(fallbackLine, options.force ?? false, 'zh-TW');
      }

      if (options.allowLocalAi) {
        requestLocalAiCoachLine(event, ctx).then((line) => {
          if (!line) return;
          setFeedbackMessage(line);
          if (shouldSpeak) {
            voiceFeedbackCountRef.current += 1;
            speak(line, options.force ?? false, 'zh-TW');
          }
        });
      }

      return fallbackLine;
    },
    [buildCoachContext, speak]
  );

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

  const finishRest = useCallback(() => {
    const nextSet = pendingSetRef.current;
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    pendingSetRef.current = null;
    setIsResting(false);
    setRestCountdown(0);
    setCurrentRep(0);
    setRepArmed(true);

    if (nextSet) {
      setCurrentSet(nextSet);
      deliverCoachLine(
        'restDone',
        { currentSet: nextSet, currentRep: 0 },
        { type: 'info', force: true }
      );
    }
  }, [deliverCoachLine]);

  const startRestCountdown = useCallback(
    (completedSet: number, nextSet: number) => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }

      pendingSetRef.current = nextSet;
      setIsResting(true);
      setRestCountdown(REST_SECONDS);
      setRepArmed(false);
      deliverCoachLine(
        'setComplete',
        {
          completedSet,
          nextSet,
          currentSet: completedSet,
          currentRep: totalReps,
          restSeconds: REST_SECONDS,
        },
        { type: 'info', force: true, allowLocalAi: true }
      );

      let count = REST_SECONDS;
      restTimerRef.current = setInterval(() => {
        count -= 1;
        setRestCountdown(count);
        if (count <= 0) {
          finishRest();
        }
      }, 1000);
    },
    [deliverCoachLine, finishRest, totalReps]
  );

  // Voice & hold logic when angle changes
  useEffect(() => {
    if (!sessionStarted || !isActive || !hasValidAngle || sessionComplete || isResting) return;

    const now = Date.now();
    const isThrottled = now - lastFeedbackTimeRef.current < 3000;

    if (angleResult.status === 'achieved' && repArmed) {
      if (!isHolding) {
        setIsHolding(true);
        setHoldCountdown(effectiveHoldSeconds);
        if (!isThrottled || lastFeedbackRef.current !== 'achieved') {
          deliverCoachLine('achieved', {}, { type: 'success' });
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
                  } else {
                    startRestCountdown(prevSet, nextSet);
                  }
                  return prevSet;
                });
                return totalReps;
              }
              deliverCoachLine(
                'repComplete',
                { currentRep: next },
                { type: next % 3 === 0 || next === totalReps - 1 ? 'success' : 'info' }
              );
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
          deliverCoachLine('tooLow', {}, { type: 'warning' });
        } else if (angleResult.status === 'above') {
          deliverCoachLine('tooHigh', {}, { type: 'warning' });
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
    isResting,
    repArmed,
    effectiveTolerance,
    effectiveHoldSeconds,
    totalReps,
    totalSets,
    targetAngle,
    exercise,
    deliverCoachLine,
    startRestCountdown,
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

    const completedDate = getTodayIsoDate();
    const previousSession = getMergedSessionRecords()
      .filter((record) => record.patientId === PATIENT_ID && record.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const currentDeviation = Math.abs(avgAngle - targetAngle);
    const previousDeviation = previousSession
      ? Math.abs(previousSession.avgAngle - previousSession.targetAngle)
      : 0;
    const stabilityPercent = previousSession
      ? previousDeviation > 0
        ? Math.round(((previousDeviation - currentDeviation) / previousDeviation) * 100)
        : score - previousSession.score
      : null;

    const completionContext = buildCoachContext({
      score,
      avgAngle,
      maxAngle,
      durationMinutes: elapsedMinutes,
      stabilityPercent,
      currentRep: totalReps,
      currentSet: totalSets,
    });
    const completionMessage = buildRehabCoachLine('complete', completionContext);
    setSessionSummary({
      score,
      avgAngle,
      maxAngle,
      duration: elapsedMinutes,
      stabilityPercent,
      message: completionMessage,
    });
    setFeedbackMessage(completionMessage);
    setFeedbackType('success');
    voiceFeedbackCountRef.current += 1;
    speak(completionMessage, true, 'zh-TW');

    requestLocalAiCoachLine('complete', completionContext).then((line) => {
      if (!line) return;
      setSessionSummary((prev) => (prev ? { ...prev, message: line } : prev));
      setFeedbackMessage(line);
      voiceFeedbackCountRef.current += 1;
      speak(line, true, 'zh-TW');
    });

    appendSessionRecord({
      patientId: PATIENT_ID,
      exerciseId,
      date: completedDate,
      duration: elapsedMinutes,
      completedSets: totalSets,
      completedReps: totalReps,
      avgAngle,
      maxAngle,
      targetAngle,
      score,
      voiceFeedbackCount: voiceFeedbackCountRef.current,
    });
    recordTrainingCompletion(PATIENT_ID, { date: completedDate, score });
    sessionSavedRef.current = true;
  }, [buildCoachContext, exerciseId, sessionComplete, speak, targetAngle, totalReps, totalSets]);

  useEffect(() => {
    if (!exercise || sessionStarted || status === 'loading' || goalBriefAnnouncedRef.current) return;
    goalBriefAnnouncedRef.current = true;
    const needPickFirst = ttsProvider === 'yating' && exercise.voicePromptsTai;
    if (needPickFirst) {
      setFeedbackMessage('再按「聽開場說明」');
      setFeedbackType('info');
      return;
    }
    setFeedbackMessage('下面會念今天的練法，聽完再按開始');
    setFeedbackType('info');
    speakGoalBrief();
  }, [exercise, sessionStarted, speakGoalBrief, status, ttsProvider]);

  // Start session
  const handleStart = () => {
    setIsActive(true);
    setSessionStarted(true);
    setRepArmed(true);
    setIsResting(false);
    setRestCountdown(0);
    setSessionSummary(null);
    setSafetyStopped(false);
    setPainScore(0);
    sessionStartRef.current = Date.now();
    angleStatsRef.current = { sum: 0, count: 0, max: 0 };
    voiceFeedbackCountRef.current = 0;
    sessionSavedRef.current = false;
    painAlertSentRef.current = false;
    deliverCoachLine('start', { currentRep: 0, currentSet: 1 }, { type: 'info', force: true });
  };

  const handlePause = () => {
    setIsActive(false);
    deliverCoachLine('pause', {}, { type: 'info', force: true });
  };

  const handleResume = () => {
    if (safetyStopped && painScore >= 7) {
      setFeedbackMessage('疼痛還是偏高，先不要繼續訓練。');
      setFeedbackType('warning');
      speak('疼痛還是偏高，先不要繼續訓練。', true, 'zh-TW');
      return;
    }
    setSafetyStopped(false);
    setIsActive(true);
    deliverCoachLine('resume', {}, { type: 'info', force: true });
  };

  const handlePainScoreChange = (nextScore: number) => {
    setPainScore(nextScore);

    if (nextScore < 7) {
      if (safetyStopped) {
        setFeedbackMessage('疼痛已降低。若還覺得不舒服，建議今天先休息。');
        setFeedbackType('info');
      }
      return;
    }

    setIsActive(false);
    setIsHolding(false);
    setIsResting(false);
    setSafetyStopped(true);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }

    const warning = `疼痛 ${nextScore}/10 偏高，請先停止訓練，坐下休息並通知照護團隊。`;
    setFeedbackMessage(warning);
    setFeedbackType('warning');
    voiceFeedbackCountRef.current += 1;
    speak(warning, true, 'zh-TW');

    if (!painAlertSentRef.current) {
      painAlertSentRef.current = true;
      sendConversationMessage({
        conversationId: CARE_TEAM_CONVERSATION_ID,
        senderId: PATIENT_ID,
        senderRole: 'patient',
        content: `安全回報：我在做「${exercise?.name ?? '復健訓練'}」時疼痛 ${nextScore}/10。系統已先暫停訓練，請醫師或家屬協助確認。`,
      });
    }
  };

  const handleRestart = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setCurrentSet(1);
    setCurrentRep(0);
    setSessionComplete(false);
    setSessionSummary(null);
    setIsHolding(false);
    setIsResting(false);
    setSafetyStopped(false);
    setPainScore(0);
    setHoldCountdown(0);
    setRestCountdown(0);
    setRepArmed(true);
    setIsActive(true);
    setSessionStarted(true);
    sessionStartRef.current = Date.now();
    angleStatsRef.current = { sum: 0, count: 0, max: 0 };
    voiceFeedbackCountRef.current = 0;
    sessionSavedRef.current = false;
    painAlertSentRef.current = false;
    deliverCoachLine('start', { currentRep: 0, currentSet: 1 }, { type: 'info', force: true });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, []);

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EEF2F7' }}>
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p style={{ fontSize: patientPx(18), color: '#546E7A' }}>這個項目目前找不到，先回首頁看看好嗎？</p>
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
  const isGameFocus = sessionStarted && focusMode === 'game';
  const gamePanelProps = {
    game: rehabGame,
    sessionStarted,
    sessionComplete,
    isResting,
    isHolding,
    holdCountdown,
    holdSeconds: effectiveHoldSeconds,
    currentAngle,
    hasValidAngle,
    targetAngle,
    tolerance: effectiveTolerance,
    angleStatus: angleResult.status as 'below' | 'achieved' | 'above',
    currentRep,
    totalReps,
    currentSet,
    totalSets,
    safetyStopped,
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col" style={{ background: '#26201A' }}>
      {/* Top Navigation Bar（語音語言僅於長者首頁選定） */}
      <div style={{ background: '#332A20', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-5 py-4">
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
          {sessionStarted && (
            <div className="flex rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
              {[
                { id: 'camera' as const, label: '看動作' },
                { id: 'game' as const, label: '玩遊戲' },
              ].map((item) => {
                const active = focusMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocusMode(item.id)}
                    className="rounded-xl px-4 py-2 font-black transition-colors"
                    style={{
                      background: active ? '#FACC15' : 'transparent',
                      color: active ? '#111827' : 'rgba(255,255,255,0.72)',
                      fontSize: patientPx(12),
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
          <div
            className="px-2 py-1 rounded-lg shrink-0 max-w-[140px] leading-tight"
            style={{
              background:
                ttsProvider === 'yating'
                  ? 'rgba(3,169,244,0.26)'
                  : ttsProvider === 'openai'
                    ? 'rgba(16,163,127,0.28)'
                    : wantsYating && !yatingReady
                      ? 'rgba(255,167,38,0.22)'
                      : wantsOpenAi && !openAiReady
                        ? 'rgba(255,167,38,0.22)'
                        : 'rgba(255,255,255,0.08)',
            }}
            title={
              ttsProvider === 'yating'
                ? voiceDialect === 'taiwanese'
                  ? hasTaiPromptsForExercise
                    ? '雅婷台語聲線；此動作有台語陪練稿（長者首頁選台語）'
                    : '雅婷台語聲線；此動作尚無台語稿，陪練句仍為國語文案（長者首頁選台語）'
                  : '雅婷國語聲線 zh_en_*（VITE_YATING_VOICE_MODEL）；語速等見 .env'
                : ttsProvider === 'openai'
                  ? 'OpenAI gpt-4o-mini-tts；可用 VITE_OPENAI_TTS_VOICE、VITE_OPENAI_TTS_INSTRUCTIONS、VITE_OPENAI_TTS_SPEED 微調'
                  : wantsYating && !yatingReady
                    ? '想走雅婷：.env 需 YATING_API_KEY（dev 代理）、VITE_TTS_PROVIDER=yating，改完重開 npm run dev'
                    : wantsOpenAi && !openAiReady
                      ? '想走 OpenAI：.env 需 OPENAI_API_KEY（dev 代理）、VITE_TTS_PROVIDER=openai，改完重開 npm run dev'
                      : '本機語音（用 Edge 或 Windows 版 Chrome 時會優先選微軟神經中文聲）'
            }
          >
            <span
              style={{
                fontSize: patientPx(10),
                fontWeight: 700,
                color:
                  ttsProvider === 'yating'
                    ? '#81D4FA'
                    : ttsProvider === 'openai'
                      ? '#A5D6A7'
                      : wantsYating && !yatingReady
                        ? '#FFE082'
                        : wantsOpenAi && !openAiReady
                          ? '#FFE082'
                          : 'rgba(255,255,255,0.55)',
              }}
            >
              {ttsProvider === 'yating'
                ? '雅婷'
                : ttsProvider === 'openai'
                  ? 'OpenAI'
                  : wantsYating && !yatingReady
                    ? '雅婷未就緒'
                    : wantsOpenAi && !openAiReady //openai是三小
                      ? 'OpenAI 未就緒'
                      : '本機語音'}
            </span>
          </div>
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
      </div>

      {/* Main Layout: Camera + Sidebar */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {isGameFocus && (
          <div className="flex-1 min-w-0 bg-[#1B1610] p-4">
            <RehabGamePanel {...gamePanelProps} variant="hero" />
          </div>
        )}

        {/* Camera Feed Column */}
        <div
          className={`${isGameFocus ? 'shrink-0' : 'flex-1'} relative bg-black overflow-hidden`}
          style={isGameFocus ? { width: '36%', minWidth: 420, maxWidth: 760 } : undefined}
          ref={videoContainerRef}
        >
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

          {/* 載入中：不論是否已按開始，都顯示（與舊版一致：按開始後仍會看到載入動畫） */}
          <AnimatePresence>
            {status === 'loading' && (
              <motion.div
                key="pose-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                style={{ background: '#26201A' }}
              >
                <div className="w-24 h-24 border-[5px] border-blue-400 border-t-transparent rounded-full animate-spin mb-8" />
                <p style={{ color: 'white', fontSize: patientPx(28), fontWeight: 700 }}>正在載入姿態偵測模型…</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: patientPx(22), marginTop: 12, fontWeight: 600 }}>
                  第一次會多花幾秒鐘，麻煩稍等一下喔
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* 開場說明：課程未開始且非載入／錯誤時顯示；含相機已開、姿態偵測中（例如重試後），避免畫面上沒有說明與開始鈕 */}
          <AnimatePresence>
            {!sessionStarted && status !== 'error' && status !== 'no-camera' && status !== 'loading' && (
              <motion.div
                key="goal-brief"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto"
                style={{
                  background:
                    status === 'detecting'
                      ? 'rgba(38, 32, 26, 0.94)'
                      : '#26201A',
                  backdropFilter: status === 'detecting' ? 'blur(2px)' : undefined,
                }}
              >
                <div className="text-center px-6 sm:px-10 w-full max-w-xl mx-auto py-6">
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
                        key={`goal-${i}`}
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
                  <div
                    className="rounded-3xl px-5 py-4 sm:px-6 sm:py-5 mb-5 sm:mb-6 text-left border border-emerald-300/25"
                    style={{ background: 'rgba(13, 148, 136, 0.16)' }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p
                          style={{
                            color: '#A7F3D0',
                            fontSize: 'clamp(1.05rem, 3vw, 1.28rem)',
                            fontWeight: 900,
                            marginBottom: 10,
                          }}
                        >
                          等等要做
                        </p>
                        {rehabGuidance.whatToDo.slice(0, 3).map((item, index) => (
                          <p
                            key={`guide-step-${index}`}
                            style={{
                              color: 'rgba(255,255,255,0.88)',
                              fontSize: 'clamp(1rem, 2.75vw, 1.18rem)',
                              lineHeight: 1.55,
                              fontWeight: 650,
                              marginBottom: index === Math.min(2, rehabGuidance.whatToDo.length - 1) ? 0 : 8,
                            }}
                          >
                            {index + 1}. {item}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p
                          style={{
                            color: '#FDE68A',
                            fontSize: 'clamp(1.05rem, 3vw, 1.28rem)',
                            fontWeight: 900,
                            marginBottom: 10,
                          }}
                        >
                          注意事項
                        </p>
                        {rehabGuidance.precautions.slice(0, 3).map((item, index) => (
                          <p
                            key={`guide-caution-${index}`}
                            style={{
                              color: 'rgba(255,255,255,0.88)',
                              fontSize: 'clamp(1rem, 2.75vw, 1.18rem)',
                              lineHeight: 1.55,
                              fontWeight: 650,
                              marginBottom: index === Math.min(2, rehabGuidance.precautions.length - 1) ? 0 : 8,
                            }}
                          >
                            {index + 1}. {item}
                          </p>
                        ))}
                      </div>
                    </div>
                    <a
                      href={rehabGuidance.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block rounded-2xl px-3 py-2 text-center font-bold"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.68)',
                        fontSize: 'clamp(0.86rem, 2.35vw, 1rem)',
                      }}
                    >
                      專業內容參考：{rehabGuidance.sourceLabel}
                    </a>
                  </div>
                  <div className="w-full mb-5">
                    <button
                      type="button"
                      onClick={handleListenGoalBrief}
                      className="w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-2"
                      style={{
                        borderColor: 'rgba(244,167,42,0.55)',
                        background: 'rgba(244,167,42,0.14)',
                        color: '#F4C772',
                        fontSize: 'clamp(1.15rem, 3.2vw, 1.4rem)',
                        fontWeight: 800,
                      }}
                    >
                      <Volume2 size={26} className="shrink-0" />
                      聽開場說明
                    </button>
                  </div>
                  <button
                    onClick={handleStart}
                    className="w-full py-6 sm:py-7 rounded-2xl text-white flex items-center justify-center gap-3 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0E7A6B, #0B6051)',
                      fontSize: 'clamp(1.45rem, 4vw, 1.9rem)',
                      fontWeight: 800,
                    }}
                  >
                    <Play size={36} className="shrink-0" />
                    好，準備好了就開始吧
                  </button>
                </div>
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

          {/* Between-set rest coach */}
          {isResting && !sessionComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
              style={{ background: 'rgba(13,27,42,0.86)', backdropFilter: 'blur(5px)' }}
            >
              <div
                className="rounded-[2rem] border border-white/10 px-10 py-8"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <p style={{ color: '#81D4FA', fontSize: patientPx(20), fontWeight: 800 }}>
                  休息一下
                </p>
                <div
                  className="mx-auto my-5 flex h-32 w-32 items-center justify-center rounded-full"
                  style={{ background: 'rgba(102,187,106,0.15)', color: '#69F0AE' }}
                >
                  <span style={{ fontSize: patientPx(48), fontWeight: 900, lineHeight: 1 }}>
                    {restCountdown}
                  </span>
                </div>
                <p style={{ color: 'white', fontSize: patientPx(22), fontWeight: 800, lineHeight: 1.5 }}>
                  第 {currentSet} 組完成了
                </p>
                <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: patientPx(16), marginTop: 8, lineHeight: 1.6 }}>
                  先放鬆肩膀和腿，倒數完再做下一組。
                </p>
                <button
                  type="button"
                  onClick={finishRest}
                  className="mt-6 rounded-2xl px-6 py-3 font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.16)', fontSize: patientPx(15) }}
                >
                  我休息好了，開始下一組
                </button>
              </div>
            </motion.div>
          )}

          {/* High pain safety stop */}
          {safetyStopped && !sessionComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8 text-center"
              style={{ background: 'rgba(127,29,29,0.88)', backdropFilter: 'blur(5px)' }}
            >
              <div className="max-w-2xl rounded-[2rem] border border-red-200/30 px-8 py-7" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <AlertCircle size={76} style={{ color: '#FCA5A5', margin: '0 auto 18px' }} />
                <h2 style={{ color: 'white', fontSize: patientPx(30), fontWeight: 900, lineHeight: 1.25 }}>
                  先停止訓練
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.86)', fontSize: patientPx(18), lineHeight: 1.7, marginTop: 12, fontWeight: 700 }}>
                  你回報疼痛 {painScore}/10，系統已暫停訓練，並通知醫師、治療師與家屬。
                </p>
                <p style={{ color: '#FECACA', fontSize: patientPx(15), lineHeight: 1.65, marginTop: 10 }}>
                  請坐下休息。若疼痛持續、麻木、頭暈或無法承重，請立即聯絡照護者或就醫。
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/patient')}
                    className="rounded-2xl px-6 py-3 font-black text-white"
                    style={{ background: '#DC2626', fontSize: patientPx(16) }}
                  >
                    回到首頁休息
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('rehabbridge:open-chat'))}
                    className="rounded-2xl px-6 py-3 font-black"
                    style={{ background: 'rgba(255,255,255,0.16)', color: 'white', fontSize: patientPx(16) }}
                  >
                    打開照護訊息
                  </button>
                </div>
              </div>
            </motion.div>
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
                練習完成囉！
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: patientPx(16), marginBottom: 32 }}>
                {sessionSummary
                  ? `${totalSets} 組 × ${totalReps} 次 · ${sessionSummary.score} 分 · 最高角度 ${sessionSummary.maxAngle}°`
                  : `${totalSets} 組 × ${totalReps} 次 · 最高角度 ${currentAngle}°`}
              </p>
              {sessionSummary && (
                <div
                  className="mb-7 max-w-2xl rounded-3xl border border-white/10 px-6 py-5 text-center"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <p style={{ color: 'white', fontSize: patientPx(18), lineHeight: 1.65, fontWeight: 700 }}>
                    {sessionSummary.message}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: '平均角度', value: `${sessionSummary.avgAngle}°` },
                      { label: '訓練時間', value: `${sessionSummary.duration}分` },
                      {
                        label: '穩定度',
                        value:
                          sessionSummary.stabilityPercent == null
                            ? '新紀錄'
                            : `${sessionSummary.stabilityPercent >= 0 ? '+' : ''}${sessionSummary.stabilityPercent}%`,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: patientPx(12), fontWeight: 700 }}>
                          {item.label}
                        </div>
                        <div style={{ color: '#69F0AE', fontSize: patientPx(20), fontWeight: 900 }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleRestart}
                  className="px-6 py-3 rounded-2xl flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: patientPx(16) }}>
                  <RotateCcw size={18} /> 再做一次
                </button>
                <button onClick={() => navigate('/patient')}
                  className="px-6 py-3 rounded-2xl flex items-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)', fontSize: patientPx(16), fontWeight: 700 }}>
                  <CheckCircle size={18} /> 回到首頁
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

          {!isGameFocus && <RehabGamePanel {...gamePanelProps} />}

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

              {isResting && (
                <div
                  className="mt-3 rounded-xl px-3 py-3 text-center"
                  style={{ background: 'rgba(129,212,250,0.14)' }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: patientPx(12), fontWeight: 700 }}>
                    組間休息
                  </div>
                  <div style={{ color: '#81D4FA', fontSize: patientPx(24), fontWeight: 900 }}>
                    {restCountdown} 秒
                  </div>
                </div>
              )}
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
              陪練提示 · {localCoachLabel}
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
                  {feedbackMessage || '看好畫面，要開始再按'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pain Safety Report */}
          {sessionStarted && !sessionComplete && (
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: patientPx(11), fontWeight: 700 }}>
                    疼痛回報
                  </div>
                  <div style={{ color: painScore >= 7 ? '#EF5350' : '#E3F2FD', fontSize: patientPx(24), fontWeight: 900 }}>
                    {painScore}/10
                  </div>
                </div>
                <div
                  className="rounded-xl px-3 py-2 text-center"
                  style={{
                    background: painScore >= 7 ? 'rgba(239,83,80,0.16)' : 'rgba(255,255,255,0.06)',
                    color: painScore >= 7 ? '#EF5350' : 'rgba(255,255,255,0.66)',
                    fontSize: patientPx(12),
                    fontWeight: 800,
                  }}
                >
                  {painScore >= 7 ? '建議停止' : painScore >= 4 ? '注意疼痛' : '可接受'}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={painScore}
                onChange={(event) => handlePainScoreChange(Number(event.target.value))}
                className="w-full accent-red-500"
                aria-label="疼痛程度 0 到 10 分"
              />
              <div className="mt-2 flex justify-between text-[11px] font-bold text-white/35">
                <span>0 不痛</span>
                <span>10 很痛</span>
              </div>
              {safetyStopped && (
                <p style={{ color: '#FFCDD2', fontSize: patientPx(12), lineHeight: 1.55, marginTop: 10, fontWeight: 700 }}>
                  已暫停訓練，並把疼痛回報送到照護團隊聊天室。
                </p>
              )}
            </div>
          )}

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
              今天這樣練
            </div>
            {[
              { label: '關卡難度', value: `第 ${difficultyLevel} 關 / ${difficultyLabel}`, color: '#81D4FA' },
              { label: '目標角度', value: `${targetAngle}°`, color: '#FFD600' },
              { label: '安全範圍', value: `${safetyMinAngle}°-${safetyMaxAngle}°`, color: '#69F0AE' },
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

            <div
              className="mt-3 rounded-xl"
              style={{
                background: 'rgba(102,187,106,0.08)',
                padding: !sessionStarted ? '14px 12px' : '12px',
              }}
            >
              <div
                style={{
                  color: '#69F0AE',
                  fontSize: !sessionStarted ? patientPx(14) : patientPx(11),
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                安全提醒
              </div>
              <p
                style={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: !sessionStarted ? patientPx(16) : patientPx(12),
                  lineHeight: 1.55,
                }}
              >
                {safetyNote}
              </p>
            </div>

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

          {/* 訓練中才顯示控制鈕；開始前用畫面中央大鈕 */}
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
