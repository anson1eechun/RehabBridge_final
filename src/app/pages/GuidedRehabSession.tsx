import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Dumbbell,
  Footprints,
  HeartPulse,
  MessageCircle,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { mockExercises, mockPatients } from '../data/mockData';
import { getRehabExerciseGuidance } from '../data/rehabExerciseGuidance';
import { getTodayIsoDate, recordTrainingCompletion } from '../data/progressStore';
import { usePrescriptions } from '../data/prescriptionStore';
import {
  getExerciseTrackingMode,
  getGuidedExerciseConfig,
  type GuidedReportQuestion,
  type GuidedVisualKey,
} from '../data/guidedExerciseCatalog';
import { appendGuidedSessionRecord } from '../data/guidedSessionStore';
import { getExerciseSafetyLabel } from '../data/exerciseSafetyCatalog';

const PATIENT = mockPatients[0];

function visualTheme(visual: GuidedVisualKey) {
  switch (visual) {
    case 'neck':
      return {
        icon: HeartPulse,
        title: '頸部安全',
        bg: 'from-sky-100 to-blue-50',
        color: 'text-sky-700',
        ring: 'ring-sky-100',
      };
    case 'ankle':
      return {
        icon: Footprints,
        title: '踝足控制',
        bg: 'from-emerald-100 to-teal-50',
        color: 'text-emerald-700',
        ring: 'ring-emerald-100',
      };
    case 'spine':
      return {
        icon: Activity,
        title: '核心活動',
        bg: 'from-amber-100 to-orange-50',
        color: 'text-amber-700',
        ring: 'ring-amber-100',
      };
    case 'glute':
      return {
        icon: Dumbbell,
        title: '臀肌啟動',
        bg: 'from-fuchsia-100 to-pink-50',
        color: 'text-fuchsia-700',
        ring: 'ring-fuchsia-100',
      };
    case 'scapula':
      return {
        icon: ShieldCheck,
        title: '肩胛穩定',
        bg: 'from-indigo-100 to-violet-50',
        color: 'text-indigo-700',
        ring: 'ring-indigo-100',
      };
    default:
      return {
        icon: RotateCcw,
        title: '人工引導',
        bg: 'from-slate-100 to-white',
        color: 'text-slate-700',
        ring: 'ring-slate-100',
      };
  }
}

function MiniInstructionIllustration({
  visual,
  stepIndex,
}: {
  visual: GuidedVisualKey;
  stepIndex: number;
}) {
  const palette: Record<GuidedVisualKey, { main: string; soft: string; dark: string }> = {
    scapula: { main: '#4F46E5', soft: '#EEF2FF', dark: '#312E81' },
    neck: { main: '#0284C7', soft: '#E0F2FE', dark: '#075985' },
    ankle: { main: '#059669', soft: '#D1FAE5', dark: '#065F46' },
    spine: { main: '#D97706', soft: '#FEF3C7', dark: '#92400E' },
    glute: { main: '#C026D3', soft: '#FAE8FF', dark: '#86198F' },
    manual: { main: '#475569', soft: '#F1F5F9', dark: '#1E293B' },
  };
  const colors = palette[visual];
  const progressLeft = 18 + stepIndex * 30;

  return (
    <div className="relative mx-auto mb-3 h-28 w-full max-w-[12rem] overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-sm">
      <div className="absolute inset-0" style={{ background: colors.soft }} />
      <div className="absolute bottom-3 left-4 right-4 h-2 rounded-full bg-white/90">
        <div
          className="h-full rounded-full"
          style={{ width: `${34 + stepIndex * 28}%`, background: colors.main }}
        />
      </div>

      {visual === 'neck' && (
        <>
          <div
            className="absolute left-1/2 top-4 h-10 w-10 -translate-x-1/2 rounded-full border-4 bg-white"
            style={{
              borderColor: colors.main,
              transform: `translateX(-50%) translateX(${stepIndex === 1 ? -8 : stepIndex === 2 ? 8 : 0}px)`,
            }}
          />
          <div className="absolute left-1/2 top-[3.35rem] h-8 w-3 -translate-x-1/2 rounded-full bg-white" />
          <div className="absolute left-10 right-10 top-[5.1rem] h-3 rounded-full" style={{ background: colors.main }} />
          <div className="absolute right-7 top-6 h-2 w-8 rounded-full" style={{ background: colors.main, opacity: stepIndex === 1 ? 1 : 0.45 }} />
        </>
      )}

      {visual === 'scapula' && (
        <>
          <div className="absolute left-1/2 top-5 h-14 w-20 -translate-x-1/2 rounded-[2rem] bg-white" />
          <div className="absolute left-[3.25rem] top-8 h-7 w-7 rounded-full" style={{ background: colors.main }} />
          <div className="absolute right-[3.25rem] top-8 h-7 w-7 rounded-full" style={{ background: colors.main }} />
          <div className="absolute left-[4.1rem] top-10 h-2 w-9 rounded-full bg-white" />
          <div className="absolute right-[4.1rem] top-10 h-2 w-9 rounded-full bg-white" />
          <div className="absolute left-8 top-[3.2rem] h-1.5 w-8 rounded-full" style={{ background: colors.dark, transform: `rotate(${stepIndex === 1 ? 0 : 18}deg)` }} />
          <div className="absolute right-8 top-[3.2rem] h-1.5 w-8 rounded-full" style={{ background: colors.dark, transform: `rotate(${stepIndex === 1 ? 0 : -18}deg)` }} />
        </>
      )}

      {visual === 'ankle' && (
        <>
          <div className="absolute left-1/2 top-4 h-16 w-5 -translate-x-1/2 rounded-full bg-white" />
          <div
            className="absolute left-1/2 top-[4.6rem] h-5 w-20 origin-left rounded-full"
            style={{
              background: colors.main,
              transform: `translateX(-12px) rotate(${stepIndex === 1 ? -16 : stepIndex === 2 ? 14 : 0}deg)`,
            }}
          />
          <div className="absolute right-7 top-7 h-12 w-3 rounded-full bg-white/80" />
          <div className="absolute right-7 top-7 h-12 w-3 rounded-full" style={{ background: colors.main, transform: 'rotate(35deg)' }} />
        </>
      )}

      {visual === 'spine' && (
        <>
          <div className="absolute left-1/2 top-5 h-9 w-9 -translate-x-1/2 rounded-full bg-white" />
          <div
            className="absolute left-1/2 top-14 h-12 w-6 -translate-x-1/2 rounded-full border-4 border-white"
            style={{
              borderLeftColor: colors.main,
              borderRightColor: colors.main,
              transform: `translateX(-50%) skewX(${stepIndex === 1 ? -10 : stepIndex === 2 ? 10 : 0}deg)`,
            }}
          />
          <div className="absolute left-8 top-12 h-2 w-8 rounded-full" style={{ background: colors.main, transform: `rotate(${stepIndex === 1 ? -18 : 12}deg)` }} />
          <div className="absolute right-8 top-12 h-2 w-8 rounded-full" style={{ background: colors.main, transform: `rotate(${stepIndex === 1 ? 18 : -12}deg)` }} />
        </>
      )}

      {visual === 'glute' && (
        <>
          <div className="absolute left-1/2 top-8 h-16 w-24 -translate-x-1/2 rounded-[2rem] bg-white" />
          <div className="absolute left-[3.4rem] top-12 h-10 w-10 rounded-full" style={{ background: colors.main, opacity: stepIndex === 1 ? 1 : 0.7 }} />
          <div className="absolute right-[3.4rem] top-12 h-10 w-10 rounded-full" style={{ background: colors.main, opacity: stepIndex === 1 ? 1 : 0.7 }} />
          <div className="absolute left-8 top-[3.65rem] h-2 w-8 rounded-full bg-white" style={{ transform: `translateX(${stepIndex === 1 ? 12 : 0}px)` }} />
          <div className="absolute right-8 top-[3.65rem] h-2 w-8 rounded-full bg-white" style={{ transform: `translateX(${stepIndex === 1 ? -12 : 0}px)` }} />
        </>
      )}

      {visual === 'manual' && (
        <div className="absolute left-1/2 top-7 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-3xl bg-white">
          <RotateCcw size={34} color={colors.main} />
        </div>
      )}

      <div
        className="absolute top-3 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-white"
        style={{ left: `${progressLeft}%`, background: colors.main }}
      />
    </div>
  );
}

function ReportInput({
  question,
  value,
  onChange,
}: {
  question: GuidedReportQuestion;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}) {
  if (question.type === 'scale') {
    const numericValue = typeof value === 'number' ? value : 0;
    return (
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <div className="text-2xl font-black text-slate-800">{question.label}</div>
        <p className="mt-1 text-lg font-bold text-slate-500">{question.helper}</p>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={numericValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-5 w-full accent-blue-600"
        />
        <div className="mt-2 flex items-center justify-between text-base font-black text-slate-500">
          <span>{question.minLabel}</span>
          <span className="rounded-2xl bg-white px-5 py-2 text-3xl text-blue-700 shadow-sm">
            {numericValue}
          </span>
          <span>{question.maxLabel}</span>
        </div>
      </div>
    );
  }

  if (question.type === 'boolean') {
    return (
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <div className="text-2xl font-black text-slate-800">{question.label}</div>
        <p className="mt-1 text-lg font-bold text-slate-500">{question.helper}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: '沒有', answer: false },
            { label: '有', answer: true },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onChange(item.answer)}
              className={`min-h-16 rounded-2xl border-2 text-2xl font-black ${
                value === item.answer
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <div className="text-2xl font-black text-slate-800">{question.label}</div>
      <p className="mt-1 text-lg font-bold text-slate-500">{question.helper}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-14 rounded-2xl border-2 px-4 text-xl font-black ${
              value === option
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GuidedRehabSession() {
  const navigate = useNavigate();
  const { prescriptionId = '' } = useParams<{ prescriptionId: string }>();
  const prescriptions = usePrescriptions();
  const prescription = prescriptions.find((item) => item.id === prescriptionId);
  const autoExerciseId = prescriptionId.startsWith('AUTO-')
    ? prescriptionId.replace('AUTO-', '')
    : undefined;
  const exerciseId = prescription?.exerciseId ?? autoExerciseId;
  const exercise = mockExercises.find((item) => item.id === exerciseId);
  const trackingMode = getExerciseTrackingMode(exercise, prescription);
  const config = getGuidedExerciseConfig(exercise?.id);
  const guidance = getRehabExerciseGuidance(exercise?.id);
  const safetyLabel = getExerciseSafetyLabel(exercise, prescription);
  const theme = visualTheme(config.visual);
  const VisualIcon = theme.icon;

  const totalSets = prescription?.sets ?? exercise?.sets ?? 1;
  const totalReps = prescription?.reps ?? exercise?.reps ?? 10;
  const holdSeconds = prescription?.holdSeconds ?? exercise?.holdSeconds ?? 3;
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [countdown, setCountdown] = useState(holdSeconds);
  const [isCounting, setIsCounting] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [stoppedEarly, setStoppedEarly] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {};
    config.reportQuestions.forEach((question) => {
      if (question.type === 'scale') initial[question.id] = question.id === 'effort' ? 5 : 0;
      if (question.type === 'boolean') initial[question.id] = false;
      if (question.type === 'choice') initial[question.id] = question.options[0] ?? '';
    });
    return initial;
  });

  useEffect(() => {
    setCountdown(holdSeconds);
  }, [holdSeconds]);

  useEffect(() => {
    if (trackingMode === 'angle' && exercise) {
      navigate(`/patient/rehab/${exercise.id}`, { replace: true });
    }
  }, [trackingMode, exercise, navigate]);

  const completedReps = (currentSet - 1) * totalReps + currentRep;
  const totalTargetReps = totalSets * totalReps;
  const progressPercent = totalTargetReps
    ? Math.min(100, Math.round((completedReps / totalTargetReps) * 100))
    : 0;

  const completeOneRep = () => {
    setIsCounting(false);
    setCountdown(holdSeconds);

    if (currentRep + 1 >= totalReps) {
      if (currentSet >= totalSets) {
        setCurrentRep(totalReps);
        setIsReportOpen(true);
        return;
      }
      setCurrentSet((value) => value + 1);
      setCurrentRep(0);
      return;
    }

    setCurrentRep((value) => value + 1);
  };

  useEffect(() => {
    if (!isCounting) return;
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          completeOneRep();
          return holdSeconds;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isCounting, holdSeconds, currentRep, currentSet, totalReps, totalSets]);

  const saveReport = () => {
    if (!exercise) return;
    const painScore = Number(answers.painScore ?? 0);
    const selfReportedDifficulty = Number(answers.effort ?? 5);
    const alerts = [
      painScore >= 7 ? '疼痛分數過高' : '',
      Object.entries(answers).some(([key, value]) => key.toLowerCase().includes('dizziness') && Number(value) >= 7)
        ? '頭暈分數過高'
        : '',
      Object.entries(answers).some(([key, value]) => key.toLowerCase().includes('numbness') && value === true)
        ? '出現麻或刺痛'
        : '',
    ].filter(Boolean);

    appendGuidedSessionRecord({
      patientId: PATIENT.id,
      prescriptionId,
      exerciseId: exercise.id,
      trackingMode: trackingMode === 'manual' ? 'manual' : 'timed',
      date: getTodayIsoDate(),
      duration: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      completedSets: stoppedEarly ? currentSet : totalSets,
      completedReps: stoppedEarly ? completedReps : totalTargetReps,
      holdSeconds,
      painScore,
      selfReportedDifficulty,
      stoppedEarly,
      answers,
      alerts,
    });

    recordTrainingCompletion(PATIENT.id, {
      date: getTodayIsoDate(),
      score: Math.max(50, 100 - painScore * 4 - selfReportedDifficulty),
    });
    navigate('/patient');
  };

  if (!exercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-center">
        <div>
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h1 className="mt-4 text-3xl font-black text-slate-800">找不到這個處方</h1>
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-xl font-black text-white"
          >
            回到長者端
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-5 text-slate-900`}>
      <div className="mx-auto flex h-[calc(100dvh-2.5rem)] max-w-7xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xl font-black text-slate-600"
          >
            <ArrowLeft size={24} />
            返回
          </button>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
              Guided Rehab
            </p>
            <h1 className="text-3xl font-black text-slate-900">{exercise.name}</h1>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
            <p className="text-sm font-black text-blue-500">
              {trackingMode === 'timed' ? '計時引導' : '人工回報'}
            </p>
            <p className="text-xl font-black text-blue-800">{currentSet}/{totalSets} 組</p>
          </div>
        </header>

        <div
          className="mx-5 mt-4 rounded-2xl border px-4 py-3 text-sm font-black"
          style={{
            background: safetyLabel.bg,
            borderColor: safetyLabel.border,
            color: safetyLabel.text,
          }}
        >
          {safetyLabel.label}：{safetyLabel.description} {safetyLabel.stopRule}
        </div>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex min-h-0 flex-col gap-5">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[2rem] bg-slate-900 text-white">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-12 top-12 h-44 w-44 rounded-full bg-blue-400 blur-3xl" />
                <div className="absolute bottom-8 right-16 h-52 w-52 rounded-full bg-emerald-300 blur-3xl" />
              </div>
              <div className="relative flex flex-col items-center text-center">
                <div className={`mb-6 flex h-44 w-44 items-center justify-center rounded-[3rem] bg-white ${theme.color} shadow-2xl ring-[18px] ${theme.ring}`}>
                  <VisualIcon size={92} strokeWidth={1.8} />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.35em] text-white/50">{theme.title}</p>
                <h2 className="mt-3 max-w-2xl text-5xl font-black leading-tight">{config.headline}</h2>
                <p className="mt-4 max-w-2xl text-2xl font-bold text-white/75">{config.shortCue}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {config.illustrationSteps.map((step, index) => (
                <div key={step} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <MiniInstructionIllustration visual={config.visual} stepIndex={index} />
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-blue-700 shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-xl font-black text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
            <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-slate-500">目前進度</p>
                  <p className="text-4xl font-black text-slate-900">
                    {currentRep}/{totalReps} 次
                  </p>
                </div>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-black text-blue-700 shadow-sm">
                  {progressPercent}%
                </div>
              </div>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-white">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                  animate={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-blue-50 p-4">
                <Clock className="text-blue-600" size={28} />
                <p className="mt-2 text-base font-black text-blue-500">每次保持</p>
                <p className="text-4xl font-black text-blue-800">{holdSeconds}s</p>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-4">
                <CheckCircle className="text-emerald-600" size={28} />
                <p className="mt-2 text-base font-black text-emerald-500">總目標</p>
                <p className="text-4xl font-black text-emerald-800">{totalSets * totalReps}</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-5">
              <h3 className="text-2xl font-black text-slate-800">注意事項</h3>
              <div className="mt-3 space-y-3">
                {[...config.focusPoints, ...guidance.precautions.slice(0, 2)].map((point) => (
                  <div key={point} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <ShieldCheck className="mt-1 shrink-0 text-emerald-600" size={22} />
                    <p className="text-lg font-bold leading-relaxed text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <button
                type="button"
                onClick={() => {
                  if (trackingMode === 'timed') {
                    setIsCounting(true);
                    return;
                  }
                  completeOneRep();
                }}
                disabled={isCounting}
                className="min-h-20 rounded-3xl bg-blue-600 px-6 text-3xl font-black text-white shadow-lg disabled:bg-blue-300"
              >
                {isCounting ? `${countdown} 秒` : trackingMode === 'timed' ? '開始這一下' : '我完成一下'}
                {!isCounting && <Play className="ml-3 inline" size={30} fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoppedEarly(true);
                  setIsReportOpen(true);
                }}
                className="min-h-20 rounded-3xl bg-red-50 px-5 text-xl font-black text-red-600"
              >
                痛/不舒服
              </button>
            </div>
          </section>
        </main>
      </div>

      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <MessageCircle size={34} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-900">完成後回報</h2>
                <p className="mt-1 text-xl font-bold text-slate-500">
                  這些答案會幫醫師判斷疼痛、代償和下次處方調整。
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {config.reportQuestions.map((question) => (
                <ReportInput
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="min-h-16 flex-1 rounded-3xl bg-slate-100 text-2xl font-black text-slate-600"
              >
                回去繼續
              </button>
              <button
                type="button"
                onClick={saveReport}
                className="min-h-16 flex-1 rounded-3xl bg-emerald-600 text-2xl font-black text-white shadow-lg"
              >
                送出給醫師
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
