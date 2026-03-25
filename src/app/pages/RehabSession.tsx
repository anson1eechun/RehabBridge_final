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
} from '../utils/angleCalculator';
import { mockExercises, mockPrescriptions } from '../data/mockData';

const PATIENT_ID = 'P001';

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
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'warning'>('info');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFeedbackRef = useRef<string>('');
  const lastFeedbackTimeRef = useRef<number>(0);

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

  // Pose detection hook
  const { keypoints, status, errorMessage, fps } = usePoseDetection(
    videoRef,
    canvasRef,
    isActive
  );

  // Voice coach hook
  const { speak, setEnabled: setVoiceSetting } = useVoiceCoach({ throttleMs: 3000 });

  // Toggle voice
  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    setVoiceSetting(next);
  };

  // Calculate current angle from keypoints
  const currentAngle = exercise?.joints
    ? extractAngleFromKeypoints(keypoints, exercise.joints as [string, string, string]) ?? 0
    : 0;

  const angleResult = getAngleResult(currentAngle, targetAngle, tolerance);

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
    if (!sessionStarted || !isActive || currentAngle === 0) return;

    const now = Date.now();
    const isThrottled = now - lastFeedbackTimeRef.current < 3000;

    if (angleResult.status === 'achieved') {
      if (!isHolding) {
        setIsHolding(true);
        setHoldCountdown(holdSeconds);
        if (!isThrottled || lastFeedbackRef.current !== 'achieved') {
          speak(exercise?.voicePrompts.achieved ?? '很棒！已達到目標角度，請保持');
          setFeedbackMessage(`✅ 達到目標！保持 ${holdSeconds} 秒`);
          setFeedbackType('success');
          lastFeedbackRef.current = 'achieved';
          lastFeedbackTimeRef.current = now;
        }
        // Hold countdown
        let count = holdSeconds;
        holdTimerRef.current = setInterval(() => {
          count--;
          setHoldCountdown(count);
          if (count <= 0) {
            clearInterval(holdTimerRef.current!);
            setIsHolding(false);
            // Count rep
            setCurrentRep(prev => {
              const next = prev + 1;
              if (next >= totalReps) {
                // Set complete
                setCurrentSet(prevSet => {
                  const nextSet = prevSet + 1;
                  if (nextSet > totalSets) {
                    setSessionComplete(true);
                    speak(exercise?.voicePrompts.complete ?? '恭喜！全部訓練完成！');
                    setFeedbackMessage('🎉 訓練完成！');
                    setFeedbackType('success');
                  } else {
                    speak(`第 ${prevSet} 組完成，請休息一下`);
                    setFeedbackMessage(`第 ${prevSet} 組完成，準備下一組`);
                    setFeedbackType('info');
                  }
                  return nextSet > totalSets ? prevSet : nextSet;
                });
                return 0;
              }
              speak(`第 ${next} 次`);
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

      if (!isThrottled) {
        if (angleResult.status === 'below') {
          speak(exercise?.voicePrompts.tooLow ?? '請繼續加大動作幅度');
          setFeedbackMessage('📈 請繼續加大動作幅度');
          setFeedbackType('warning');
        } else if (angleResult.status === 'above') {
          speak(exercise?.voicePrompts.tooHigh ?? '請稍微放鬆一些');
          setFeedbackMessage('📉 請稍微放鬆一些');
          setFeedbackType('warning');
        }
        lastFeedbackTimeRef.current = now;
        lastFeedbackRef.current = angleResult.status;
      }
    }
  }, [angleResult.status, currentAngle]);

  // Start session
  const handleStart = () => {
    setIsActive(true);
    setSessionStarted(true);
    setFeedbackMessage(exercise?.voicePrompts.start ?? '請開始動作');
    setFeedbackType('info');
    speak(exercise?.voicePrompts.start ?? '請開始動作');
  };

  const handlePause = () => {
    setIsActive(false);
    speak('訓練已暫停');
    setFeedbackMessage('訓練已暫停');
    setFeedbackType('info');
  };

  const handleResume = () => {
    setIsActive(true);
    speak('繼續訓練');
    setFeedbackMessage('繼續訓練');
    setFeedbackType('info');
  };

  const handleRestart = () => {
    setCurrentSet(1);
    setCurrentRep(0);
    setSessionComplete(false);
    setIsHolding(false);
    setHoldCountdown(0);
    setIsActive(true);
    setSessionStarted(true);
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
          <p style={{ fontSize: 18, color: '#546E7A' }}>找不到此訓練項目</p>
          <button onClick={() => navigate('/patient')} className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white">
            返回
          </button>
        </div>
      </div>
    );
  }

  const angleColor =
    angleResult.status === 'achieved' ? '#66BB6A' :
    angleResult.status === 'below' ? '#EF5350' :
    '#FFA726';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#111D2D' }}>
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-5 py-4" style={{ background: '#1A2840', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => { setIsActive(false); navigate('/patient'); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}
        >
          <ArrowLeft size={18} />
          返回
        </button>

        <div className="text-center">
          <div style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>{exercise.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            目標 {targetAngle}° · Dr. 陳志明
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* FPS indicator */}
          {status === 'detecting' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(102,187,106,0.2)' }}>
              <Wifi size={12} style={{ color: '#66BB6A' }} />
              <span style={{ fontSize: 11, color: '#66BB6A' }}>{fps}fps</span>
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
            highlightJoints={exercise.joints}
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
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6" />
                    <p style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>正在載入姿態偵測模型...</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>首次載入需數秒</p>
                  </>
                ) : (
                  <div className="text-center px-8">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto"
                      style={{ background: 'rgba(66,165,245,0.15)' }}>
                      <Play size={40} style={{ color: '#64B5F6', marginLeft: 4 }} />
                    </div>
                    <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                      {exercise.name}
                    </h2>
                    <button
                      onClick={handleStart}
                      className="w-full py-5 rounded-2xl text-white flex items-center justify-center gap-3"
                      style={{ background: 'linear-gradient(135deg, #42A5F5, #1976D2)', fontSize: 18, fontWeight: 700 }}
                    >
                      <Play size={22} />
                      開始訓練
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
              <p style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>{errorMessage}</p>
              <button
                onClick={() => { setIsActive(false); setTimeout(() => setIsActive(true), 100); }}
                className="mt-6 px-6 py-3 rounded-xl flex items-center gap-2 text-white"
                style={{ background: '#1565C0', fontSize: 15 }}
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
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>即時角度</div>
                <div style={{ color: angleColor, fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
                  {currentAngle}°
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
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>保持</div>
                  <div style={{ color: 'white', fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
                    {holdCountdown}
                  </div>
                </motion.div>
              )}

              {/* Deviation indicator */}
              <div className="px-4 py-3 rounded-2xl text-right"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>目標差距</div>
                <div style={{
                  color: angleResult.status === 'achieved' ? '#66BB6A' : '#FFA726',
                  fontSize: 22, fontWeight: 700, lineHeight: 1.2
                }}>
                  {angleResult.status === 'achieved' ? '✓ 達標' : `${Math.abs(angleResult.deviation)}°`}
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
              <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                訓練完成！
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginBottom: 32 }}>
                {totalSets} 組 × {totalReps} 次 · 最高角度 {currentAngle}°
              </p>
              <div className="flex gap-3">
                <button onClick={handleRestart}
                  className="px-6 py-3 rounded-2xl flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 16 }}>
                  <RotateCcw size={18} /> 再做一次
                </button>
                <button onClick={() => navigate('/patient')}
                  className="px-6 py-3 rounded-2xl flex items-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)', fontSize: 16, fontWeight: 700 }}>
                  <CheckCircle size={18} /> 完成返回
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar — Stats & Controls */}
        <div className="flex flex-col gap-0 overflow-y-auto"
          style={{ width: 280, background: '#1A2840', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Angle Gauge */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <AngleGauge
              currentAngle={sessionStarted ? currentAngle : 0}
              targetAngle={targetAngle}
              tolerance={tolerance}
              size={220}
            />
          </div>

          {/* Set/Rep Counter */}
          {sessionStarted && (
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(21,101,192,0.2)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>組次</div>
                  <div style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>
                    {Math.min(currentSet, totalSets)}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/{totalSets}</span>
                  </div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(102,187,106,0.15)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>次數</div>
                  <div style={{ color: '#69F0AE', fontSize: 24, fontWeight: 700 }}>
                    {currentRep}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/{totalReps}</span>
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
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>語音提示</div>
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
                }}
              >
                <p style={{
                  color:
                    feedbackType === 'success' ? '#69F0AE' :
                    feedbackType === 'warning' ? '#FFA726' :
                    'rgba(255,255,255,0.75)',
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  {feedbackMessage || '等待開始訓練...'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Exercise Info */}
          <div className="p-4 border-b flex-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>訓練資訊</div>
            {[
              { label: '目標角度', value: `${targetAngle}°`, color: '#FFD600' },
              { label: '容許誤差', value: `±${tolerance}°`, color: 'rgba(255,255,255,0.6)' },
              { label: '保持時間', value: `${holdSeconds} 秒`, color: 'rgba(255,255,255,0.6)' },
              { label: '頻率', value: prescription?.frequency ?? '每天兩次', color: 'rgba(255,255,255,0.6)' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center mb-2.5">
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}

            {prescription?.notes && (
              <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,214,0,0.08)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>醫師備注</div>
                <p style={{ color: '#FFD600', fontSize: 12, lineHeight: 1.5 }}>{prescription.notes}</p>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="p-4">
            {!sessionStarted ? (
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #42A5F5, #1976D2)', fontSize: 16, fontWeight: 700 }}
              >
                <Play size={20} /> 開始訓練
              </button>
            ) : (
              <div className="flex gap-2">
                {isActive ? (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 600 }}
                  >
                    <Pause size={18} /> 暫停
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 text-white"
                    style={{ background: 'linear-gradient(135deg, #42A5F5, #1976D2)', fontSize: 15, fontWeight: 600 }}
                  >
                    <Play size={18} /> 繼續
                  </button>
                )}
                <button
                  onClick={() => navigate('/patient')}
                  className="px-4 py-4 rounded-2xl"
                  style={{ background: 'rgba(239,83,80,0.15)', color: '#EF5350', fontSize: 15, fontWeight: 600 }}
                >
                  結束
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}