import { useEffect, useState } from 'react';
import type { TrackingMode } from './mockData';

const STORAGE_KEY = 'rehabbridge.guidedSessionRecords.v1';
const UPDATE_EVENT = 'rehab:guided-sessions-updated';

export interface GuidedSessionRecord {
  id: string;
  patientId: string;
  prescriptionId: string;
  exerciseId: string;
  trackingMode: Exclude<TrackingMode, 'angle'>;
  date: string;
  duration: number;
  completedSets: number;
  completedReps: number;
  holdSeconds: number;
  painScore: number;
  selfReportedDifficulty: number;
  stoppedEarly: boolean;
  answers: Record<string, string | number | boolean>;
  alerts: string[];
}

const mockGuidedSessionRecords: GuidedSessionRecord[] = [
  {
    id: 'GDEMO-001',
    patientId: 'P001',
    prescriptionId: 'DEMO-CHIN-TUCK',
    exerciseId: 'chin_tuck',
    trackingMode: 'timed',
    date: '2026-05-21',
    duration: 4,
    completedSets: 1,
    completedReps: 10,
    holdSeconds: 5,
    painScore: 1,
    selfReportedDifficulty: 3,
    stoppedEarly: false,
    answers: {
      painScore: 1,
      dizziness: 0,
      armNumbness: false,
      effort: 3,
    },
    alerts: [],
  },
  {
    id: 'GDEMO-002',
    patientId: 'P001',
    prescriptionId: 'DEMO-ANKLE-INVERSION',
    exerciseId: 'ankle_inversion_band',
    trackingMode: 'manual',
    date: '2026-05-21',
    duration: 5,
    completedSets: 2,
    completedReps: 24,
    holdSeconds: 1,
    painScore: 4,
    selfReportedDifficulty: 7,
    stoppedEarly: false,
    answers: {
      painScore: 4,
      swelling: false,
      instability: 7,
      effort: 7,
    },
    alerts: ['腳踝不穩感偏高'],
  },
  {
    id: 'GDEMO-003',
    patientId: 'P001',
    prescriptionId: 'DEMO-SCAPULA',
    exerciseId: 'shoulder_blade_squeeze',
    trackingMode: 'timed',
    date: '2026-05-20',
    duration: 6,
    completedSets: 2,
    completedReps: 30,
    holdSeconds: 5,
    painScore: 2,
    selfReportedDifficulty: 5,
    stoppedEarly: false,
    answers: {
      painScore: 2,
      shrugging: true,
      fatigueArea: '脖子',
      effort: 5,
    },
    alerts: ['可能有聳肩代償'],
  },
  {
    id: 'GDEMO-004',
    patientId: 'P002',
    prescriptionId: 'DEMO-NECK-ROTATION',
    exerciseId: 'neck_rotation',
    trackingMode: 'manual',
    date: '2026-05-21',
    duration: 3,
    completedSets: 1,
    completedReps: 8,
    holdSeconds: 2,
    painScore: 7,
    selfReportedDifficulty: 8,
    stoppedEarly: true,
    answers: {
      painScore: 7,
      limitedSide: '左邊',
      dizziness: 6,
      effort: 8,
    },
    alerts: ['疼痛分數過高', '中途停止'],
  },
];

function readRecords(): GuidedSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuidedSessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records: GuidedSessionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function getGuidedSessionRecords() {
  return [...mockGuidedSessionRecords, ...readRecords()].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return dateDiff || b.id.localeCompare(a.id);
  });
}

export function appendGuidedSessionRecord(record: Omit<GuidedSessionRecord, 'id'>) {
  const records = readRecords();
  const withId: GuidedSessionRecord = {
    ...record,
    id: `GUSR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  records.push(withId);
  writeRecords(records);
  notifyUpdated();
  return withId;
}

export function useGuidedSessionRecords() {
  const [records, setRecords] = useState<GuidedSessionRecord[]>(() => getGuidedSessionRecords());

  useEffect(() => {
    const refresh = () => setRecords(getGuidedSessionRecords());
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
