// ============================================================
// PatientPortal — 長者主頁「今日任務 Hub」
// 取代原闖關地圖：問候 + 今日任務大卡 + 一鍵開始 + 四大功能格。
// 溫暖親和、大字、高對比、大點擊區。資料邏輯沿用既有 store。
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Bell, X, Play, RefreshCw, CheckCircle2, Circle, Flame, CalendarCheck,
  Images, NotebookText, MessageCircle, Trophy, ChevronRight, Sparkles, Lock,
  Volume2, UserRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { mockPatients, mockExercises } from '../data/mockData';
import { useSessionRecords } from '../data/sessionStore';
import { resolvePrescriptionPlan, usePrescriptions } from '../data/prescriptionStore';
import { getExerciseTrackingMode, isGuidedTrackingMode } from '../data/guidedExerciseCatalog';
import { useGuidedSessionRecords } from '../data/guidedSessionStore';
import {
  buildProgressSummary, getTodayIsoDate, recordPatientOpen, syncUnlockedBadges,
  usePatientProgress, type BadgeProgress,
} from '../data/progressStore';
import {
  readVoiceDialectPreference, writeVoiceDialectPreference, type VoiceDialectPreference,
} from '../utils/voiceDialectPreference';
import { CARE_TEAM_CONVERSATION_ID, useUnreadConversationCount } from '../data/messageStore';
import {
  ElderPageShell, PrimaryCTA, FeatureTile, SectionCard, StatChip,
} from '../components/elderly/ElderlyKit';
import { ELDER_COLORS } from '../components/elderly/tokens';

const PATIENT = mockPatients[0]; // 王大明

const CATEGORY_ORDER: Record<string, number> = { 下肢: 0, 上肢: 1, 核心: 2, 踝足: 3, 頸部: 4 };
const BODY_AREA_ORDER: Record<string, number> = {
  膝蓋: 0, 大腿: 1, 髖部: 2, 功能性: 3, '臀腿/核心': 4, 全身: 5,
  手肘: 0, 肩膀: 1, 上背: 2, 胸肩: 3, '肩胛/上背': 4, 踝: 5, 頸椎: 6, 腰背: 7, 胸椎: 8, 臀部: 9,
};
const MAX_LEG = 3;
const MAX_ARM = 2;

const NOTIFICATIONS = [
  { id: 1, title: '新處方', body: '陳醫師幫您新增了膝蓋彎曲訓練', time: '10 分鐘前' },
  { id: 2, title: '目標達成', body: '太棒了！您已經連續運動 7 天', time: '2 小時前' },
  { id: 3, title: '家人關懷', body: '小美：爸，記得要做今天的復健喔！', time: '昨天' },
  { id: 4, title: '回診提醒', body: '下週三 10:30 與陳醫師視訊回診。', time: '昨天 18:00' },
  { id: 5, title: '治療師留言', body: '黃治療師：抬腿時腳尖朝上、膝蓋打直。', time: '上週五' },
];

export default function PatientPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  const sessionRecords = useSessionRecords();
  const guidedSessionRecords = useGuidedSessionRecords();
  const allPrescriptions = usePrescriptions();
  const progress = usePatientProgress(PATIENT.id);
  const unreadCount = useUnreadConversationCount(CARE_TEAM_CONVERSATION_ID, PATIENT.id);

  const [planVoiceDialect, setPlanVoiceDialect] = useState<VoiceDialectPreference>(() =>
    readVoiceDialectPreference()
  );
  const pickPlanVoiceDialect = useCallback((d: VoiceDialectPreference) => {
    setPlanVoiceDialect(d);
    writeVoiceDialectPreference(d);
    window.dispatchEvent(new Event('rehab-voice-dialect-change'));
  }, []);

  // 從訓練頁返回或他分頁同步時，國／台語與首頁一致
  useEffect(() => {
    if (location.pathname !== '/patient') return;
    setPlanVoiceDialect(readVoiceDialectPreference());
    recordPatientOpen(PATIENT.id);
  }, [location.pathname]);

  useEffect(() => {
    const sync = () => setPlanVoiceDialect(readVoiceDialectPreference());
    window.addEventListener('rehab-voice-dialect-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('rehab-voice-dialect-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return '早安';
    if (h < 18) return '午安';
    return '晚安';
  });

  // ── 今日計畫（只納入有處方者，與原邏輯一致）──────────────
  const prescriptions = allPrescriptions.filter((p) => p.patientId === PATIENT.id && p.active);
  const exercises = mockExercises.map((exercise) => {
    const matchedRx = prescriptions.find((rx) => rx.exerciseId === exercise.id);
    const plan = matchedRx ? resolvePrescriptionPlan(matchedRx, exercise) : null;
    const trackingMode = getExerciseTrackingMode(exercise, matchedRx);
    return {
      id: matchedRx?.id ?? `AUTO-${exercise.id}`,
      exercise,
      sets: plan?.effectiveSets ?? exercise.sets,
      reps: plan?.effectiveReps ?? exercise.reps,
      holdSeconds: plan?.effectiveHoldSeconds ?? exercise.holdSeconds,
      trackingMode,
      source: matchedRx ? 'prescription' : 'catalog',
    };
  });

  const prescribedOnly = exercises.filter((item) => item.source === 'prescription');
  const planPool = prescribedOnly.length > 0 ? prescribedOnly : exercises;
  const sortedExercises = [...planPool].sort((a, b) => {
    const aCat = CATEGORY_ORDER[a.exercise.category] ?? 99;
    const bCat = CATEGORY_ORDER[b.exercise.category] ?? 99;
    if (aCat !== bCat) return aCat - bCat;
    const aArea = BODY_AREA_ORDER[a.exercise.bodyArea] ?? 50;
    const bArea = BODY_AREA_ORDER[b.exercise.bodyArea] ?? 50;
    if (aArea !== bArea) return aArea - bArea;
    return a.exercise.name.localeCompare(b.exercise.name, 'zh-Hant');
  });
  const legPool = sortedExercises.filter((item) => item.exercise.category !== '上肢');
  const armPool = sortedExercises.filter((item) => item.exercise.category === '上肢');
  const displayExercises = [...legPool.slice(0, MAX_LEG), ...armPool.slice(0, MAX_ARM)];

  const today = getTodayIsoDate();
  const todaySessions = sessionRecords.filter((s) => s.patientId === PATIENT.id && s.date === today);
  const todayGuidedSessions = guidedSessionRecords.filter(
    (s) => s.patientId === PATIENT.id && s.date === today
  );
  const plannedExerciseIdList = displayExercises.map((item) => item.exercise.id);
  const plannedExerciseIds = new Set(plannedExerciseIdList);
  const completedExerciseIds = new Set([
    ...todaySessions.filter((s) => plannedExerciseIds.has(s.exerciseId)).map((s) => s.exerciseId),
    ...todayGuidedSessions.filter((s) => plannedExerciseIds.has(s.exerciseId)).map((s) => s.exerciseId),
  ]);
  const completedToday = completedExerciseIds.size;
  const totalToday = displayExercises.length;

  const patientSessions = sessionRecords.filter((s) => s.patientId === PATIENT.id);
  const progressSummary = buildProgressSummary(progress, patientSessions, plannedExerciseIdList);
  const streakDays = progressSummary.trainingStreak.days;
  const unlockedBadgeCount = progressSummary.badges.filter((b) => b.unlocked).length;

  const plannedProgressKey = plannedExerciseIdList.join('|');
  useEffect(() => {
    syncUnlockedBadges(PATIENT.id, patientSessions, plannedExerciseIdList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientSessions.length, plannedProgressKey]);

  const firstIncompleteIndex = displayExercises.findIndex(
    (item) => !completedExerciseIds.has(item.exercise.id)
  );
  const allDone = totalToday > 0 && completedToday >= totalToday;
  const nextItem =
    firstIncompleteIndex >= 0 ? displayExercises[firstIncompleteIndex] : displayExercises[0];

  const streakLabelShort = streakDays > 0 ? `${streakDays} 天` : '開始累積';
  const streakLabelLong = streakDays > 0 ? `連續 ${streakDays} 天` : '開始累積';
  const estMinutes = nextItem
    ? Math.max(
        1,
        Math.round(
          (nextItem.sets * nextItem.reps * ((nextItem.holdSeconds ?? 0) + 4) + nextItem.sets * 15) / 60
        )
      )
    : 5;

  const openTraining = useCallback(
    (item: typeof displayExercises[number] | undefined) => {
      if (!item) return;
      writeVoiceDialectPreference(planVoiceDialect);
      window.dispatchEvent(new Event('rehab-voice-dialect-change'));
      if (isGuidedTrackingMode(item.trackingMode)) {
        navigate(`/patient/guided/${item.id}`);
        return;
      }
      navigate(`/patient/rehab/${item.exercise.id}`);
    },
    [navigate, planVoiceDialect]
  );

  const tiles = [
    { theme: 'memories' as const, icon: Images, label: '回憶相片館', sublabel: '和家人的照片', onClick: () => navigate('/patient/memories') },
    { theme: 'records' as const, icon: NotebookText, label: '復健紀錄', sublabel: '看我的進步', onClick: () => navigate('/patient/records') },
    { theme: 'chat' as const, icon: MessageCircle, label: '聊天室', sublabel: '醫師 · 治療師 · 家人', badge: unreadCount > 0 ? String(unreadCount) : undefined, onClick: () => window.dispatchEvent(new Event('rehabbridge:open-chat')) },
    { theme: 'achievements' as const, icon: Trophy, label: '我的成就', sublabel: `已得 ${unlockedBadgeCount} 枚`, onClick: () => setIsAchievementsOpen(true) },
  ];

  return (
    <ElderPageShell>
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 px-6 pb-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}>

        {/* ── 問候列 ── */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full font-black text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${ELDER_COLORS.primary}, ${ELDER_COLORS.primaryDark})`, fontSize: 24 }}>
              {PATIENT.avatar}
            </div>
            <div className="min-w-0">
              <p className="font-bold" style={{ fontSize: 17, color: ELDER_COLORS.inkSoft }}>{greeting}</p>
              <p className="truncate font-black leading-tight" style={{ fontSize: 28, color: ELDER_COLORS.ink }}>
                {PATIENT.name}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setIsNotifyOpen(true)}
            aria-label={`通知，${NOTIFICATIONS.length} 則`}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 active:scale-95 focus:outline-none focus-visible:ring-4"
            style={{ background: ELDER_COLORS.surface, border: `2px solid ${ELDER_COLORS.border}`, color: ELDER_COLORS.primaryDark }}>
            <Bell size={28} strokeWidth={2.4} />
            {NOTIFICATIONS.length > 0 && (
              <span className="absolute right-2.5 top-2.5 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
            )}
          </button>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-5">
        {/* ── 今日任務大卡 ── */}
        <SectionCard className="!p-6">
          {totalToday === 0 ? (
            <div className="py-4 text-center">
              <Sparkles size={40} className="mx-auto mb-3" style={{ color: ELDER_COLORS.amber }} />
              <p className="font-black" style={{ fontSize: 24 }}>今天沒有安排運動</p>
              <p className="mt-1 font-bold" style={{ fontSize: 18, color: ELDER_COLORS.inkSoft }}>好好休息，明天再加油！</p>
            </div>
          ) : allDone ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: ELDER_COLORS.primarySoft, color: ELDER_COLORS.primary }}>
                <CheckCircle2 size={48} strokeWidth={2.4} />
              </div>
              <div>
                <p className="font-black" style={{ fontSize: 26 }}>今天的運動都完成了！</p>
                <p className="mt-1 font-bold" style={{ fontSize: 18, color: ELDER_COLORS.inkSoft }}>
                  您真棒，完成了全部 {totalToday} 項
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <StatChip icon={Flame} label={streakLabelLong} tone="amber" />
                <StatChip icon={CalendarCheck} label={`今天 ${completedToday}/${totalToday} 項`} />
              </div>
              <button type="button" onClick={() => openTraining(displayExercises[0])}
                className="mt-1 flex items-center gap-2 rounded-full px-6 font-black active:scale-95 focus:outline-none focus-visible:ring-4"
                style={{ height: 56, background: ELDER_COLORS.surfaceSoft, border: `2px solid ${ELDER_COLORS.border}`, color: ELDER_COLORS.primaryDark, fontSize: 19 }}>
                <RefreshCw size={22} strokeWidth={2.6} /> 再做一次
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold" style={{ fontSize: 18, color: ELDER_COLORS.inkSoft }}>今天的運動</p>
                  <p className="font-black leading-tight" style={{ fontSize: 30, color: ELDER_COLORS.ink }}>
                    {nextItem?.exercise.name}
                  </p>
                  <p className="mt-1 font-bold" style={{ fontSize: 18, color: ELDER_COLORS.primaryDark }}>
                    第 {(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0) + 1} 項 · 共 {totalToday} 項
                    {nextItem && ` · ${nextItem.sets} 組 ${nextItem.reps} 下`}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <StatChip icon={Flame} label={streakLabelShort} tone="amber" />
                </div>
              </div>

              {/* 語音方言 */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold" style={{ fontSize: 17, color: ELDER_COLORS.inkSoft }}>
                  <Volume2 size={20} strokeWidth={2.4} /> 語音
                </span>
                <div className="flex gap-2">
                  {(['mandarin', 'taiwanese'] as VoiceDialectPreference[]).map((d) => {
                    const active = planVoiceDialect === d;
                    return (
                      <button key={d} type="button" onClick={() => pickPlanVoiceDialect(d)}
                        aria-pressed={active}
                        className="rounded-full px-5 font-black active:scale-95 focus:outline-none focus-visible:ring-4"
                        style={{
                          height: 48, fontSize: 18,
                          background: active ? ELDER_COLORS.primary : ELDER_COLORS.surfaceSoft,
                          color: active ? '#fff' : ELDER_COLORS.inkSoft,
                          border: `2px solid ${active ? ELDER_COLORS.primary : ELDER_COLORS.border}`,
                        }}>
                        {d === 'mandarin' ? '國語' : '台語'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <PrimaryCTA
                label="開始今天的運動"
                sublabel={nextItem ? `約 ${estMinutes} 分鐘` : undefined}
                icon={Play}
                onClick={() => openTraining(nextItem)}
                ariaLabel={`開始今天的運動，${nextItem?.exercise.name}`}
              />
            </div>
          )}
        </SectionCard>

        {/* ── 今日清單 ── */}
        {totalToday > 0 && (
          <SectionCard title="今天的清單" icon={CalendarCheck}>
            <ul className="flex flex-col gap-2.5">
              {displayExercises.map((item, idx) => {
                const done = completedExerciseIds.has(item.exercise.id);
                return (
                  <li key={item.exercise.id}>
                    <button type="button" onClick={() => openTraining(item)}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 text-left active:scale-[0.99] focus:outline-none focus-visible:ring-4"
                      style={{
                        minHeight: 64,
                        background: done ? ELDER_COLORS.primarySoft : ELDER_COLORS.surfaceSoft,
                        border: `2px solid ${done ? '#A9D8CD' : ELDER_COLORS.border}`,
                      }}>
                      {done
                        ? <CheckCircle2 size={30} strokeWidth={2.4} style={{ color: ELDER_COLORS.primary }} />
                        : <Circle size={30} strokeWidth={2.4} style={{ color: ELDER_COLORS.inkFaint }} />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black" style={{ fontSize: 20, color: ELDER_COLORS.ink }}>
                          {idx + 1}. {item.exercise.name}
                        </span>
                        <span className="font-bold" style={{ fontSize: 15, color: ELDER_COLORS.inkSoft }}>
                          {done ? '已完成' : `${item.sets} 組 ${item.reps} 下`}
                        </span>
                      </span>
                      <ChevronRight size={26} style={{ color: ELDER_COLORS.inkFaint }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}
          </div>

          <div className="flex flex-col gap-4">
        {/* ── 四大功能格 ── */}
        <div className="grid grid-cols-2 gap-4">
          {tiles.map((t) => (
            <FeatureTile key={t.label} theme={t.theme} icon={t.icon} label={t.label}
              sublabel={t.sublabel} badge={t.badge} onClick={t.onClick} />
          ))}
        </div>

        {/* ── 切換身分 ── */}
        <button type="button" onClick={() => navigate('/')}
          className="mx-auto mt-1 flex items-center gap-2 rounded-full px-5 font-bold active:scale-95 focus:outline-none focus-visible:ring-4"
          style={{ height: 52, color: ELDER_COLORS.inkSoft, fontSize: 17 }}>
          <UserRound size={22} strokeWidth={2.4} /> 切換使用者身分
        </button>
          </div>
        </div>
      </div>

      {/* ── 通知抽屜 ── */}
      <AnimatePresence>
        {isNotifyOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsNotifyOpen(false)} className="fixed inset-0 z-[70] bg-black/30" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed right-0 top-0 z-[80] flex h-full w-full flex-col sm:w-[460px]"
              style={{ background: ELDER_COLORS.pageBg }}>
              <div className="flex items-center justify-between px-5 pb-4"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', borderBottom: `1px solid ${ELDER_COLORS.border}` }}>
                <h2 className="font-black" style={{ fontSize: 24 }}>通知</h2>
                <button type="button" onClick={() => setIsNotifyOpen(false)} aria-label="關閉通知"
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: ELDER_COLORS.surface, border: `2px solid ${ELDER_COLORS.border}` }}>
                  <X size={26} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="flex flex-col gap-3">
                  {NOTIFICATIONS.map((n) => (
                    <li key={n.id} className="rounded-2xl p-4"
                      style={{ background: ELDER_COLORS.surface, border: `1px solid ${ELDER_COLORS.border}` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black" style={{ fontSize: 19, color: ELDER_COLORS.primaryDark }}>{n.title}</span>
                        <span className="font-bold" style={{ fontSize: 14, color: ELDER_COLORS.inkFaint }}>{n.time}</span>
                      </div>
                      <p className="mt-1 font-bold" style={{ fontSize: 18, color: ELDER_COLORS.ink, lineHeight: 1.5 }}>{n.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 成就 Modal ── */}
      <AnimatePresence>
        {isAchievementsOpen && (
          <AchievementsModal badges={progressSummary.badges} onClose={() => setIsAchievementsOpen(false)} />
        )}
      </AnimatePresence>
    </ElderPageShell>
  );
}

// ── 成就 Modal ──────────────────────────────────────────────
function AchievementsModal({ badges, onClose }: { badges: BadgeProgress[]; onClose: () => void }) {
  const unlocked = badges.filter((b) => b.unlocked).length;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[70] bg-black/40" />
      <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
          className="pointer-events-auto flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-[32px] shadow-2xl"
          style={{ background: ELDER_COLORS.pageBg }}>
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy size={28} style={{ color: ELDER_COLORS.amber }} />
            <h2 className="font-black" style={{ fontSize: 24 }}>我的成就</h2>
            <span className="rounded-full px-3 font-black"
              style={{ background: ELDER_COLORS.amberSoft, color: ELDER_COLORS.amber, fontSize: 16, lineHeight: '32px' }}>
              {unlocked} / {badges.length}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="關閉成就"
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: ELDER_COLORS.surface, border: `2px solid ${ELDER_COLORS.border}` }}>
            <X size={26} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto px-6 pb-8 sm:grid-cols-3">
          {badges.map((b) => {
            const locked = !b.unlocked;
            const hiddenLocked = Boolean(b.hidden && locked);
            return (
              <div key={b.id} className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
                style={{
                  background: locked ? '#F1EADC' : ELDER_COLORS.surface,
                  border: `2px solid ${locked ? ELDER_COLORS.border : '#EBD3A0'}`,
                  opacity: locked ? 0.72 : 1,
                }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: locked ? '#E3D9C6' : ELDER_COLORS.amberSoft, color: locked ? ELDER_COLORS.inkFaint : ELDER_COLORS.amber }}>
                  {locked ? <Lock size={26} /> : <Trophy size={28} />}
                </div>
                <span className="font-black leading-tight" style={{ fontSize: 17, color: ELDER_COLORS.ink }}>
                  {hiddenLocked ? '神秘徽章' : b.title}
                </span>
                <span className="font-bold leading-tight" style={{ fontSize: 13, color: ELDER_COLORS.inkSoft }}>
                  {hiddenLocked ? '繼續努力解鎖' : b.progressLabel}
                </span>
              </div>
            );
          })}
        </div>
        </motion.div>
      </div>
    </>
  );
}
