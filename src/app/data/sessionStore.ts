import { useEffect, useState } from 'react';
import type { Patient, SessionRecord } from './mockData';
import { mockSessionRecords } from './mockData';

const STORAGE_KEY = 'rehabbridge.customSessionRecords.v1';
const UPDATE_EVENT = 'rehab:sessions-updated';

export type LeaderboardWindow = 'today' | 'week' | 'all';

export interface ScoreLeaderboardEntry {
  patientId: string;
  name: string;
  avatar: string;
  rank: number;
  avgScore: number;
  bestScore: number;
  sessionCount: number;
  lastSessionDate: string;
}

function readCustomRecords(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeCustomRecords(records: SessionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStartIso(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysFromMonday);
  return toIsoDate(date);
}

function isInWindow(record: SessionRecord, window: LeaderboardWindow, now = new Date()) {
  if (window === 'all') return true;
  const today = toIsoDate(now);
  if (window === 'today') return record.date === today;
  return record.date >= getWeekStartIso(now) && record.date <= today;
}

export function getMergedSessionRecords(): SessionRecord[] {
  const merged = [...mockSessionRecords, ...readCustomRecords()];
  return merged.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return bTime - aTime;
  });
}

export function appendSessionRecord(record: Omit<SessionRecord, 'id'>) {
  const custom = readCustomRecords();
  const withId: SessionRecord = {
    ...record,
    id: `SUSR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  custom.push(withId);
  writeCustomRecords(custom);
  notifyUpdated();
}

export function buildWeeklyActivityFromSessions(records: SessionRecord[]) {
  const result: Array<{ day: string; sessions: number; duration: number; completion: number }> = [];
  const labels = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const iso = toIsoDate(date);
    const sameDay = records.filter((r) => r.date === iso);
    const sessions = sameDay.length;
    const duration = sameDay.reduce((sum, s) => sum + s.duration, 0);
    const completion = sessions
      ? Math.round(sameDay.reduce((sum, s) => sum + s.score, 0) / sessions)
      : 0;
    result.push({
      day: labels[date.getDay()],
      sessions,
      duration,
      completion,
    });
  }

  return result;
}

export function buildScoreLeaderboard(
  records: SessionRecord[],
  patients: Patient[],
  options: { window?: LeaderboardWindow; includeEmpty?: boolean } = {}
): ScoreLeaderboardEntry[] {
  const window = options.window ?? 'all';
  const includeEmpty = options.includeEmpty ?? false;
  const scopedRecords = records.filter((record) => isInWindow(record, window));

  const entries = patients
    .map((patient) => {
      const patientRecords = scopedRecords.filter((record) => record.patientId === patient.id);
      const scores = patientRecords.map((record) => record.score);
      const avgScore = scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      const bestScore = scores.length ? Math.max(...scores) : 0;
      const lastSessionDate = patientRecords[0]?.date ?? '';

      return {
        patientId: patient.id,
        name: patient.name,
        avatar: patient.avatar,
        rank: 0,
        avgScore,
        bestScore,
        sessionCount: patientRecords.length,
        lastSessionDate,
      };
    })
    .filter((entry) => includeEmpty || entry.sessionCount > 0)
    .sort((a, b) => {
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
      return b.bestScore - a.bestScore;
    });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function findPersonalBest(records: SessionRecord[], patientId: string) {
  return records
    .filter((record) => record.patientId === patientId)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
}

export function useSessionRecords() {
  const [records, setRecords] = useState<SessionRecord[]>(() => getMergedSessionRecords());

  useEffect(() => {
    const refresh = () => setRecords(getMergedSessionRecords());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(UPDATE_EVENT, refresh as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(UPDATE_EVENT, refresh as EventListener);
    };
  }, []);

  return records;
}
