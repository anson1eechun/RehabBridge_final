import { useEffect, useState } from 'react';
import type { SessionRecord } from './mockData';
import { mockSessionRecords } from './mockData';

const STORAGE_KEY = 'rehabbridge.customSessionRecords.v1';
const UPDATE_EVENT = 'rehab:sessions-updated';

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
    const iso = date.toISOString().split('T')[0];
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

