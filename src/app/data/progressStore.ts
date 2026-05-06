import { useEffect, useState } from 'react';
import type { SessionRecord } from './mockData';

const STORAGE_KEY = 'rehabbridge.patientProgress.v1';
const UPDATE_EVENT = 'rehab:progress-updated';

export type BadgeId =
  | 'first_training'
  | 'streak_3'
  | 'streak_7'
  | 'score_90'
  | 'training_10'
  | 'weekly_complete';

export interface PatientProgressRecord {
  patientId: string;
  firstVisitDate: string;
  openedDates: string[];
  completedTrainingDates: string[];
  rescueTokens: number;
  unlockedBadges: Partial<Record<BadgeId, string>>;
}

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  description: string;
  encouragement: string;
  lockedHint: string;
  target: number;
  color: string;
  bg: string;
}

export interface BadgeProgress extends BadgeDefinition {
  unlocked: boolean;
  unlockedAt?: string;
  current: number;
  progressLabel: string;
}

export interface ProtectedStreak {
  days: number;
  usedRescueTokens: number;
  earnedRescueTokens: number;
  availableRescueTokens: number;
  lastCompletedDate: string;
  message: string;
}

export interface ProgressSummary {
  firstVisitDate: string;
  openedDays: number;
  completedTrainingDays: number;
  totalTrainingSessions: number;
  bestScore: number;
  weeklyCompletedCount: number;
  weeklyPlannedCount: number;
  trainingStreak: ProtectedStreak;
  badges: BadgeProgress[];
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_training',
    title: '第一步完成',
    description: '完成第一次復健訓練',
    encouragement: '你已經踏出復健的第一步，開始就是很重要的進步。',
    lockedHint: '完成一次訓練就能解鎖',
    target: 1,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  {
    id: 'streak_3',
    title: '穩穩三天',
    description: '連續訓練 3 天',
    encouragement: '穩定比速度更重要，你正在把照顧自己變成習慣。',
    lockedHint: '連續訓練 3 天就能解鎖',
    target: 3,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
  },
  {
    id: 'streak_7',
    title: '一週守護者',
    description: '連續訓練 7 天',
    encouragement: '一週的堅持很不容易，請繼續溫柔地照顧自己的身體。',
    lockedHint: '連續訓練 7 天就能解鎖',
    target: 7,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  {
    id: 'score_90',
    title: '動作很穩',
    description: '單次訓練 90 分以上',
    encouragement: '這次動作很穩定，身體正在記住正確的節奏。',
    lockedHint: '單次訓練達到 90 分就能解鎖',
    target: 90,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  {
    id: 'training_10',
    title: '累積十次',
    description: '累積完成 10 次訓練',
    encouragement: '十次訓練不是小事，這是很紮實的復健累積。',
    lockedHint: '累積完成 10 次訓練就能解鎖',
    target: 10,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  {
    id: 'weekly_complete',
    title: '本週全勤',
    description: '本週完成所有安排訓練',
    encouragement: '這週的任務完成了，請給自己一點肯定。',
    lockedHint: '完成本週所有安排訓練就能解鎖',
    target: 1,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
  },
];

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function readProgressRecords(): PatientProgressRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PatientProgressRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeProgressRecords(records: PatientProgressRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function sortIsoDates(dates: string[]) {
  return [...new Set(dates.filter(Boolean))].sort();
}

function addUniqueDate(dates: string[], date: string) {
  return sortIsoDates([...dates, date]);
}

export function getTodayIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return getTodayIsoDate(date);
}

function getWeekStartIso(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysFromMonday);
  return getTodayIsoDate(date);
}

function createProgressRecord(patientId: string): PatientProgressRecord {
  const today = getTodayIsoDate();
  return {
    patientId,
    firstVisitDate: today,
    openedDates: [],
    completedTrainingDates: [],
    rescueTokens: 1,
    unlockedBadges: {},
  };
}

export function getPatientProgress(patientId: string) {
  const records = readProgressRecords();
  return records.find((record) => record.patientId === patientId) ?? createProgressRecord(patientId);
}

function upsertProgressRecord(
  patientId: string,
  updater: (record: PatientProgressRecord) => PatientProgressRecord
) {
  const records = readProgressRecords();
  const index = records.findIndex((record) => record.patientId === patientId);
  const current = index >= 0 ? records[index] : createProgressRecord(patientId);
  const next = updater({
    ...current,
    openedDates: sortIsoDates(current.openedDates ?? []),
    completedTrainingDates: sortIsoDates(current.completedTrainingDates ?? []),
    unlockedBadges: current.unlockedBadges ?? {},
    rescueTokens: current.rescueTokens ?? 1,
  });

  if (index >= 0) {
    records[index] = next;
  } else {
    records.push(next);
  }

  writeProgressRecords(records);
  notifyUpdated();
  return next;
}

export function recordPatientOpen(patientId: string, date = getTodayIsoDate()) {
  return upsertProgressRecord(patientId, (record) => ({
    ...record,
    firstVisitDate: record.firstVisitDate || date,
    openedDates: addUniqueDate(record.openedDates, date),
  }));
}

export function recordTrainingCompletion(
  patientId: string,
  options: { date?: string; score?: number } = {}
) {
  const date = options.date ?? getTodayIsoDate();
  return upsertProgressRecord(patientId, (record) => {
    const unlockedBadges = { ...record.unlockedBadges };
    unlockedBadges.first_training ??= date;
    if ((options.score ?? 0) >= 90) {
      unlockedBadges.score_90 ??= date;
    }

    return {
      ...record,
      firstVisitDate: record.firstVisitDate || date,
      openedDates: addUniqueDate(record.openedDates, date),
      completedTrainingDates: addUniqueDate(record.completedTrainingDates, date),
      unlockedBadges,
    };
  });
}

function getNaturalLongestStreak(dates: string[]) {
  const uniqueDates = sortIsoDates(dates);
  if (uniqueDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i] === addDaysIso(uniqueDates[i - 1], 1)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function hasAnyCompletionBefore(dateSet: Set<string>, iso: string) {
  return [...dateSet].some((date) => date < iso);
}

export function calculateProtectedTrainingStreak(dates: string[], now = new Date()): ProtectedStreak {
  const uniqueDates = sortIsoDates(dates);
  const dateSet = new Set(uniqueDates);
  const today = getTodayIsoDate(now);
  const yesterday = addDaysIso(today, -1);
  const lastCompletedDate = uniqueDates[uniqueDates.length - 1] ?? '';
  const earnedRescueTokens = 1 + Math.floor(getNaturalLongestStreak(uniqueDates) / 3);
  const startDate = dateSet.has(today) ? today : yesterday;

  let cursor = startDate;
  let days = 0;
  let usedRescueTokens = 0;
  let completedDaysInStreak = 0;

  while (cursor >= (uniqueDates[0] ?? cursor)) {
    if (dateSet.has(cursor)) {
      days += 1;
      completedDaysInStreak += 1;
      cursor = addDaysIso(cursor, -1);
      continue;
    }

    if (usedRescueTokens < earnedRescueTokens && hasAnyCompletionBefore(dateSet, cursor)) {
      days += 1;
      usedRescueTokens += 1;
      cursor = addDaysIso(cursor, -1);
      continue;
    }

    break;
  }

  if (completedDaysInStreak === 0) {
    days = 0;
    usedRescueTokens = 0;
  }

  const availableRescueTokens = Math.max(0, earnedRescueTokens - usedRescueTokens);
  const message =
    days === 0
      ? '新的連續挑戰可以從今天開始。'
      : usedRescueTokens > 0
        ? '昨天休息了一下，補救券已幫你保留連續紀錄。'
        : '保持穩定就很好，照自己的節奏前進。';

  return {
    days,
    usedRescueTokens,
    earnedRescueTokens,
    availableRescueTokens,
    lastCompletedDate,
    message,
  };
}

function getBadgeCurrentValue(
  badgeId: BadgeId,
  values: {
    completedDays: number;
    trainingSessions: number;
    bestScore: number;
    streakDays: number;
    weeklyCompletedCount: number;
    weeklyPlannedCount: number;
  }
) {
  switch (badgeId) {
    case 'first_training':
      return values.completedDays > 0 ? 1 : 0;
    case 'streak_3':
    case 'streak_7':
      return values.streakDays;
    case 'score_90':
      return values.bestScore;
    case 'training_10':
      return values.trainingSessions;
    case 'weekly_complete':
      return values.weeklyPlannedCount > 0 && values.weeklyCompletedCount >= values.weeklyPlannedCount ? 1 : 0;
    default:
      return 0;
  }
}

function getProgressLabel(badge: BadgeDefinition, current: number, weeklyPlannedCount: number) {
  if (badge.id === 'weekly_complete') {
    return weeklyPlannedCount > 0 ? `${current}/${weeklyPlannedCount}` : '待安排';
  }
  return `${Math.min(current, badge.target)}/${badge.target}`;
}

export function buildProgressSummary(
  progress: PatientProgressRecord,
  patientSessions: SessionRecord[],
  plannedExerciseIds: string[] = []
): ProgressSummary {
  const completedDates = sortIsoDates([
    ...progress.completedTrainingDates,
    ...patientSessions.map((session) => session.date),
  ]);
  const trainingStreak = calculateProtectedTrainingStreak(completedDates);
  const bestStreakDays = Math.max(trainingStreak.days, getNaturalLongestStreak(completedDates));
  const openedDates = sortIsoDates(progress.openedDates);
  const weekStart = getWeekStartIso();
  const today = getTodayIsoDate();
  const plannedSet = new Set(plannedExerciseIds);
  const weeklyCompletedExerciseIds = new Set(
    patientSessions
      .filter((session) => session.date >= weekStart && session.date <= today)
      .filter((session) => plannedSet.size === 0 || plannedSet.has(session.exerciseId))
      .map((session) => session.exerciseId)
  );
  const bestScore = Math.max(...patientSessions.map((session) => session.score), 0);
  const values = {
    completedDays: completedDates.length,
    trainingSessions: patientSessions.length,
    bestScore,
    streakDays: bestStreakDays,
    weeklyCompletedCount: weeklyCompletedExerciseIds.size,
    weeklyPlannedCount: plannedExerciseIds.length,
  };

  const badges = BADGE_DEFINITIONS.map((badge) => {
    const current = getBadgeCurrentValue(badge.id, values);
    const unlocked = current >= badge.target;
    return {
      ...badge,
      unlocked,
      unlockedAt: progress.unlockedBadges[badge.id],
      current,
      progressLabel: getProgressLabel(
        badge,
        badge.id === 'weekly_complete' ? values.weeklyCompletedCount : current,
        values.weeklyPlannedCount
      ),
    };
  });

  return {
    firstVisitDate: progress.firstVisitDate,
    openedDays: openedDates.length,
    completedTrainingDays: completedDates.length,
    totalTrainingSessions: patientSessions.length,
    bestScore,
    weeklyCompletedCount: weeklyCompletedExerciseIds.size,
    weeklyPlannedCount: plannedExerciseIds.length,
    trainingStreak,
    badges,
  };
}

export function syncUnlockedBadges(
  patientId: string,
  patientSessions: SessionRecord[],
  plannedExerciseIds: string[] = []
) {
  const current = getPatientProgress(patientId);
  const summary = buildProgressSummary(current, patientSessions, plannedExerciseIds);
  const today = getTodayIsoDate();
  let changed = false;
  const unlockedBadges = { ...current.unlockedBadges };

  summary.badges.forEach((badge) => {
    if (badge.unlocked && !unlockedBadges[badge.id]) {
      unlockedBadges[badge.id] = today;
      changed = true;
    }
  });

  if (!changed) return current;
  return upsertProgressRecord(patientId, (record) => ({
    ...record,
    unlockedBadges,
  }));
}

export function usePatientProgress(patientId: string) {
  const [progress, setProgress] = useState<PatientProgressRecord>(() => getPatientProgress(patientId));

  useEffect(() => {
    const refresh = () => setProgress(getPatientProgress(patientId));
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refresh();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(UPDATE_EVENT, refresh as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(UPDATE_EVENT, refresh as EventListener);
    };
  }, [patientId]);

  return progress;
}
