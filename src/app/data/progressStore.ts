import { useEffect, useState } from 'react';
import type { SessionRecord } from './mockData';

const STORAGE_KEY = 'rehabbridge.patientProgress.v1';
const UPDATE_EVENT = 'rehab:progress-updated';

const DEMO_PROGRESS_RECORDS: PatientProgressRecord[] = [
  {
    patientId: 'P001',
    firstVisitDate: '2026-05-01',
    openedDates: [
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
      '2026-05-05',
      '2026-05-06',
      '2026-05-08',
      '2026-05-09',
      '2026-05-10',
    ],
    completedTrainingDates: [
      '2026-05-04',
      '2026-05-05',
      '2026-05-06',
      '2026-05-08',
      '2026-05-09',
      '2026-05-10',
    ],
    rescueTokens: 2,
    unlockedBadges: {
      first_training: '2026-05-04',
      streak_3: '2026-05-06',
      score_90: '2026-05-08',
      training_10: '2026-05-10',
    },
  },
];

export type BadgeId = string;

type BadgeMetric =
  | 'firstTraining'
  | 'trainingSessions'
  | 'completedDays'
  | 'openedDays'
  | 'streakDays'
  | 'bestScore'
  | 'highScoreSessions'
  | 'weeklyComplete'
  | 'weeklyCompletedCount'
  | 'uniqueExercises'
  | 'rescueTokensEarned'
  | 'perfectScoreSessions'
  | 'exerciseSessions'
  | 'totalMinutes'
  | 'averageScore';

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
  metric: BadgeMetric;
  exerciseId?: string;
  hidden?: boolean;
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

const toneSets = [
  { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { color: 'text-orange-700', bg: 'bg-orange-50' },
  { color: 'text-amber-700', bg: 'bg-amber-50' },
  { color: 'text-blue-700', bg: 'bg-blue-50' },
  { color: 'text-purple-700', bg: 'bg-purple-50' },
  { color: 'text-teal-700', bg: 'bg-teal-50' },
  { color: 'text-pink-700', bg: 'bg-pink-50' },
  { color: 'text-indigo-700', bg: 'bg-indigo-50' },
];

const exerciseBadgeSources = [
  { exerciseId: 'knee_flexion', name: '膝蓋彎曲' },
  { exerciseId: 'leg_raise', name: '抬腿' },
  { exerciseId: 'shoulder_abduction', name: '肩膀外展' },
  { exerciseId: 'elbow_flexion', name: '手肘彎曲' },
  { exerciseId: 'hip_abduction', name: '髖部外展' },
  { exerciseId: 'side_leg_raise', name: '側抬腿' },
  { exerciseId: 'knee_extension', name: '膝蓋伸直' },
  { exerciseId: 'elbow_extension', name: '手肘伸直' },
];

function tone(index: number) {
  return toneSets[index % toneSets.length];
}

function makeBadge(
  badge: Omit<BadgeDefinition, 'color' | 'bg'>,
  index: number
): BadgeDefinition {
  return {
    ...badge,
    ...tone(index),
  };
}

const coreBadges: BadgeDefinition[] = [
  {
    id: 'first_training',
    title: '第一步完成',
    description: '完成第一次復健訓練',
    encouragement: '你已經踏出復健的第一步，開始就是很重要的進步。',
    lockedHint: '完成一次訓練就能解鎖',
    target: 1,
    metric: 'firstTraining',
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
    metric: 'streakDays',
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
    metric: 'streakDays',
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
    metric: 'bestScore',
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
    metric: 'trainingSessions',
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
    metric: 'weeklyComplete',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
  },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  ...coreBadges,
  ...[1, 3, 5, 15, 20, 25, 30, 40, 50, 75, 100, 150].map((target, index) =>
    makeBadge(
      {
        id: `training_count_${target}`,
        title: `累積 ${target} 次`,
        description: `累積完成 ${target} 次復健訓練`,
        encouragement: `你已經累積 ${target} 次訓練，這份穩定很珍貴。`,
        lockedHint: `累積完成 ${target} 次訓練`,
        target,
        metric: 'trainingSessions',
        hidden: target >= 75,
      },
      index
    )
  ),
  ...[1, 2, 3, 5, 7, 10, 14, 21, 30, 45].map((target, index) =>
    makeBadge(
      {
        id: `completed_day_${target}`,
        title: `${target} 天有完成`,
        description: `累積 ${target} 天完成訓練`,
        encouragement: `你已經有 ${target} 天真的完成訓練，身體會記得這些努力。`,
        lockedHint: `累積 ${target} 天完成訓練`,
        target,
        metric: 'completedDays',
      },
      index + 2
    )
  ),
  ...[1, 3, 5, 7, 10, 14, 21, 30, 45, 60].map((target, index) =>
    makeBadge(
      {
        id: `open_day_${target}`,
        title: `回來看看 ${target} 天`,
        description: `累積打開 App ${target} 天`,
        encouragement: `你願意回來看看自己的復健，這也是照顧自己的方式。`,
        lockedHint: `累積打開 App ${target} 天`,
        target,
        metric: 'openedDays',
      },
      index + 4
    )
  ),
  ...[2, 3, 5, 7, 10, 14, 21, 30, 45, 60].map((target, index) =>
    makeBadge(
      {
        id: `streak_milestone_${target}`,
        title: `連續 ${target} 天`,
        description: `連續訓練 ${target} 天`,
        encouragement: `連續 ${target} 天不容易，你正在把復健變成生活的一部分。`,
        lockedHint: `連續訓練 ${target} 天`,
        target,
        metric: 'streakDays',
        hidden: target >= 30,
      },
      index + 6
    )
  ),
  ...[60, 70, 75, 80, 85, 88, 90, 92, 95, 98].map((target, index) =>
    makeBadge(
      {
        id: `best_score_${target}`,
        title: `${target} 分突破`,
        description: `單次訓練達到 ${target} 分`,
        encouragement: `這次表現很穩，分數只是結果，真正重要的是你有把動作做好。`,
        lockedHint: `單次訓練達到 ${target} 分`,
        target,
        metric: 'bestScore',
        hidden: target >= 95,
      },
      index + 1
    )
  ),
  ...[1, 2, 3, 5, 7, 10, 15, 20].map((target, index) =>
    makeBadge(
      {
        id: `high_score_count_${target}`,
        title: `高分穩定 ${target} 次`,
        description: `累積 ${target} 次 90 分以上訓練`,
        encouragement: `高分不是偶然，你正在建立穩定的動作品質。`,
        lockedHint: `累積 ${target} 次 90 分以上訓練`,
        target,
        metric: 'highScoreSessions',
        hidden: target >= 15,
      },
      index + 3
    )
  ),
  ...[1, 2, 3, 4, 5, 6].map((target, index) =>
    makeBadge(
      {
        id: `weekly_completed_${target}`,
        title: `本週 ${target} 個任務`,
        description: `本週完成 ${target} 個安排動作`,
        encouragement: `這週你有穩穩往前，完成一個任務就是一個小勝利。`,
        lockedHint: `本週完成 ${target} 個安排動作`,
        target,
        metric: 'weeklyCompletedCount',
      },
      index + 5
    )
  ),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((target, index) =>
    makeBadge(
      {
        id: `unique_exercises_${target}`,
        title: `探索 ${target} 種動作`,
        description: `完成過 ${target} 種不同復健動作`,
        encouragement: `你願意嘗試不同動作，讓復健變得更完整。`,
        lockedHint: `完成 ${target} 種不同復健動作`,
        target,
        metric: 'uniqueExercises',
        hidden: target >= 7,
      },
      index
    )
  ),
  ...exerciseBadgeSources.flatMap((exercise, exerciseIndex) =>
    [1, 3].map((target, targetIndex) =>
      makeBadge(
        {
          id: `exercise_${exercise.exerciseId}_${target}`,
          title: `${exercise.name} ${target} 次`,
          description: `完成 ${target} 次${exercise.name}`,
          encouragement: `${exercise.name}有持續做，這會慢慢累積成身體的穩定感。`,
          lockedHint: `完成 ${target} 次${exercise.name}`,
          target,
          metric: 'exerciseSessions',
          exerciseId: exercise.exerciseId,
        },
        exerciseIndex + targetIndex
      )
    )
  ),
  ...[10, 20, 30, 45, 60, 90, 120, 180].map((target, index) =>
    makeBadge(
      {
        id: `total_minutes_${target}`,
        title: `${target} 分鐘累積`,
        description: `累積復健時間 ${target} 分鐘`,
        encouragement: `時間一點一點累積，身體也一點一點變得更可靠。`,
        lockedHint: `累積復健 ${target} 分鐘`,
        target,
        metric: 'totalMinutes',
      },
      index + 2
    )
  ),
  ...[70, 75, 80, 85, 90].map((target, index) =>
    makeBadge(
      {
        id: `average_score_${target}`,
        title: `平均 ${target} 分`,
        description: `平均訓練分數達到 ${target} 分`,
        encouragement: `你不是只好一次，而是整體越來越穩。`,
        lockedHint: `平均分數達到 ${target} 分`,
        target,
        metric: 'averageScore',
        hidden: target >= 85,
      },
      index + 4
    )
  ),
  ...[1, 2, 3, 5].map((target, index) =>
    makeBadge(
      {
        id: `rescue_tokens_${target}`,
        title: `補救券 ${target} 張`,
        description: `累積獲得 ${target} 張補救券`,
        encouragement: `偶爾休息沒有關係，能回來繼續才是重點。`,
        lockedHint: `累積獲得 ${target} 張補救券`,
        target,
        metric: 'rescueTokensEarned',
      },
      index + 1
    )
  ),
  ...[
    {
      id: 'secret_quiet_master',
      title: '安靜高手',
      description: '在語音提醒很少的情況下完成多次訓練',
      encouragement: '你的動作越來越穩，系統需要提醒你的次數也變少了。',
      lockedHint: '保持穩定，某個神秘徽章會出現。',
      target: 3,
      metric: 'perfectScoreSessions' as BadgeMetric,
      hidden: true,
    },
    {
      id: 'secret_comeback',
      title: '回來就好',
      description: '休息後重新完成訓練',
      encouragement: '中斷不是失敗，願意回來就是新的開始。',
      lockedHint: '有些成就會在你重新開始時出現。',
      target: 1,
      metric: 'rescueTokensEarned' as BadgeMetric,
      hidden: true,
    },
    {
      id: 'secret_all_rounder',
      title: '全方位嘗試者',
      description: '完成多種不同復健動作',
      encouragement: '你願意探索不同訓練，讓復健更完整。',
      lockedHint: '試試不同動作，也許會有驚喜。',
      target: 6,
      metric: 'uniqueExercises' as BadgeMetric,
      hidden: true,
    },
    {
      id: 'secret_long_warmth',
      title: '長長的耐心',
      description: '累積大量復健時間',
      encouragement: '復健不是衝刺，是一段有耐心的路。',
      lockedHint: '累積時間會帶來神秘成就。',
      target: 120,
      metric: 'totalMinutes' as BadgeMetric,
      hidden: true,
    },
    {
      id: 'secret_shining_day',
      title: '閃亮的一天',
      description: '單次訓練表現非常出色',
      encouragement: '今天的你很穩，值得被記錄下來。',
      lockedHint: '某一次特別穩的訓練會解鎖它。',
      target: 95,
      metric: 'bestScore' as BadgeMetric,
      hidden: true,
    },
  ].map((badge, index) => makeBadge(badge, index + 5)),
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

function mergeProgressRecord(base: PatientProgressRecord, override?: PatientProgressRecord): PatientProgressRecord {
  if (!override) return base;
  return {
    patientId: override.patientId,
    firstVisitDate: override.firstVisitDate || base.firstVisitDate,
    openedDates: sortIsoDates([...base.openedDates, ...override.openedDates]),
    completedTrainingDates: sortIsoDates([
      ...base.completedTrainingDates,
      ...override.completedTrainingDates,
    ]),
    rescueTokens: Math.max(base.rescueTokens ?? 1, override.rescueTokens ?? 1),
    unlockedBadges: {
      ...base.unlockedBadges,
      ...override.unlockedBadges,
    },
  };
}

export function getPatientProgress(patientId: string) {
  const records = readProgressRecords();
  const demo = DEMO_PROGRESS_RECORDS.find((record) => record.patientId === patientId);
  const stored = records.find((record) => record.patientId === patientId);
  return mergeProgressRecord(demo ?? createProgressRecord(patientId), stored);
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
  badge: BadgeDefinition,
  values: {
    completedDays: number;
    trainingSessions: number;
    bestScore: number;
    streakDays: number;
    openedDays: number;
    highScoreSessions: number;
    weeklyCompletedCount: number;
    weeklyPlannedCount: number;
    uniqueExercises: number;
    rescueTokensEarned: number;
    perfectScoreSessions: number;
    exerciseCounts: Record<string, number>;
    totalMinutes: number;
    averageScore: number;
  }
) {
  switch (badge.metric) {
    case 'firstTraining':
      return values.completedDays > 0 ? 1 : 0;
    case 'streakDays':
      return values.streakDays;
    case 'bestScore':
      return values.bestScore;
    case 'trainingSessions':
      return values.trainingSessions;
    case 'completedDays':
      return values.completedDays;
    case 'openedDays':
      return values.openedDays;
    case 'highScoreSessions':
      return values.highScoreSessions;
    case 'weeklyComplete':
      return values.weeklyPlannedCount > 0 && values.weeklyCompletedCount >= values.weeklyPlannedCount ? 1 : 0;
    case 'weeklyCompletedCount':
      return values.weeklyCompletedCount;
    case 'uniqueExercises':
      return values.uniqueExercises;
    case 'rescueTokensEarned':
      return values.rescueTokensEarned;
    case 'perfectScoreSessions':
      return values.perfectScoreSessions;
    case 'exerciseSessions':
      return badge.exerciseId ? values.exerciseCounts[badge.exerciseId] ?? 0 : 0;
    case 'totalMinutes':
      return values.totalMinutes;
    case 'averageScore':
      return values.averageScore;
    default:
      return 0;
  }
}

function getProgressLabel(badge: BadgeDefinition, current: number, weeklyPlannedCount: number) {
  if (badge.metric === 'weeklyComplete') {
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
  const exerciseCounts = patientSessions.reduce<Record<string, number>>((counts, session) => {
    counts[session.exerciseId] = (counts[session.exerciseId] ?? 0) + 1;
    return counts;
  }, {});
  const totalMinutes = patientSessions.reduce((sum, session) => sum + session.duration, 0);
  const averageScore = patientSessions.length
    ? Math.round(patientSessions.reduce((sum, session) => sum + session.score, 0) / patientSessions.length)
    : 0;
  const values = {
    completedDays: completedDates.length,
    trainingSessions: patientSessions.length,
    bestScore,
    streakDays: bestStreakDays,
    openedDays: openedDates.length,
    highScoreSessions: patientSessions.filter((session) => session.score >= 90).length,
    weeklyCompletedCount: weeklyCompletedExerciseIds.size,
    weeklyPlannedCount: plannedExerciseIds.length,
    uniqueExercises: Object.keys(exerciseCounts).length,
    rescueTokensEarned: trainingStreak.earnedRescueTokens,
    perfectScoreSessions: patientSessions.filter(
      (session) => session.score >= 95 || (session.score >= 90 && session.voiceFeedbackCount <= 6)
    ).length,
    exerciseCounts,
    totalMinutes,
    averageScore,
  };

  const badges = BADGE_DEFINITIONS.map((badge) => {
    const current = getBadgeCurrentValue(badge, values);
    const unlocked = current >= badge.target;
    return {
      ...badge,
      unlocked,
      unlockedAt: progress.unlockedBadges[badge.id],
      current,
      progressLabel: getProgressLabel(
        badge,
        badge.metric === 'weeklyComplete' ? values.weeklyCompletedCount : current,
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
