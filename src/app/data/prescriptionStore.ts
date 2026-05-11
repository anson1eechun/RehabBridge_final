import { useEffect, useState } from 'react';
import type { DifficultyLevel, Exercise, Prescription } from './mockData';
import { mockPrescriptions } from './mockData';

const STORAGE_KEY = 'rehabbridge.prescriptionOverrides.v1';
const UPDATE_EVENT = 'rehab:prescriptions-updated';

export type PrescriptionEditableFields = Pick<
  Prescription,
  'targetAngle' | 'reps' | 'sets' | 'holdSeconds'
> & {
  difficultyLevel: DifficultyLevel;
};

type PrescriptionOverride = Partial<PrescriptionEditableFields>;

export const DEFAULT_DIFFICULTY_LEVEL: DifficultyLevel = 2;

export const DIFFICULTY_LEVELS: Array<{
  level: DifficultyLevel;
  label: string;
  tone: string;
  targetAngleDelta: number;
  tolerance: number;
  repsDelta: number;
  setsDelta: number;
  holdSecondsDelta: number;
}> = [
  {
    level: 1,
    label: '輕鬆',
    tone: '復健暖身',
    targetAngleDelta: -5,
    tolerance: 20,
    repsDelta: -3,
    setsDelta: -1,
    holdSecondsDelta: -1,
  },
  {
    level: 2,
    label: '標準',
    tone: '醫囑基準',
    targetAngleDelta: 0,
    tolerance: 16,
    repsDelta: 0,
    setsDelta: 0,
    holdSecondsDelta: 0,
  },
  {
    level: 3,
    label: '挑戰',
    tone: '穩定進步',
    targetAngleDelta: 3,
    tolerance: 13,
    repsDelta: 2,
    setsDelta: 0,
    holdSecondsDelta: 1,
  },
  {
    level: 4,
    label: '進階',
    tone: '耐力加強',
    targetAngleDelta: 4,
    tolerance: 10,
    repsDelta: 3,
    setsDelta: 1,
    holdSecondsDelta: 1,
  },
  {
    level: 5,
    label: '極限',
    tone: '高強度關卡（保守升階）',
    targetAngleDelta: 6,
    tolerance: 8,
    repsDelta: 5,
    setsDelta: 1,
    holdSecondsDelta: 2,
  },
];

export interface ResolvedPrescriptionPlan {
  difficultyLevel: DifficultyLevel;
  difficultyLabel: string;
  difficultyTone: string;
  effectiveTargetAngle: number;
  effectiveTolerance: number;
  effectiveReps: number;
  effectiveSets: number;
  effectiveHoldSeconds: number;
  safetyMinAngle: number;
  safetyMaxAngle: number;
  safetyNote: string;
}

interface StoredPrescriptionState {
  overrides: Record<string, PrescriptionOverride>;
  custom: Prescription[];
}

const emptyState = (): StoredPrescriptionState => ({
  overrides: {},
  custom: [],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readState(): StoredPrescriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyState();

    const overrides = isRecord(parsed.overrides)
      ? (parsed.overrides as Record<string, PrescriptionOverride>)
      : {};
    const custom = Array.isArray(parsed.custom) ? (parsed.custom as Prescription[]) : [];

    return { overrides, custom };
  } catch {
    return emptyState();
  }
}

function writeState(state: StoredPrescriptionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function toPositiveInteger(value: unknown, fallback: number) {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) return fallback;
  return Math.round(next);
}

export function normalizeDifficultyLevel(value: unknown): DifficultyLevel {
  const next = Number(value);
  if (!Number.isFinite(next)) return DEFAULT_DIFFICULTY_LEVEL;
  if (next <= 1) return 1;
  if (next >= 5) return 5;
  return Math.round(next) as DifficultyLevel;
}

export function getDifficultyMeta(level: unknown) {
  const normalized = normalizeDifficultyLevel(level);
  return (
    DIFFICULTY_LEVELS.find((item) => item.level === normalized) ??
    DIFFICULTY_LEVELS[1]
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function resolveSafetyRange(targetAngle: number, exercise?: Exercise) {
  const bodyArea = exercise?.bodyArea ?? '';
  const category = exercise?.category ?? '';
  const baseMargin =
    bodyArea.includes('肩') || bodyArea.includes('膝')
      ? 25
      : bodyArea.includes('髖') || bodyArea.includes('腿')
        ? 18
        : 20;
  const upperCap =
    category.includes('上肢') || bodyArea.includes('肩')
      ? 165
      : bodyArea.includes('膝')
        ? 175
        : 120;
  const lowerCap = bodyArea.includes('膝') && targetAngle > 130 ? 110 : 0;
  const safetyMinAngle = clamp(Math.round(targetAngle - baseMargin), lowerCap, upperCap);
  const safetyMaxAngle = clamp(Math.round(targetAngle + baseMargin), safetyMinAngle + 5, upperCap);

  return {
    safetyMinAngle,
    safetyMaxAngle,
    safetyNote: '疼痛達 7/10 或角度超出安全範圍時，系統會建議停止並通知照護團隊。',
  };
}

function normalizeEditableFields(
  patch: Partial<PrescriptionEditableFields>,
  fallback?: Partial<PrescriptionEditableFields>
): PrescriptionOverride {
  const next: PrescriptionOverride = {};

  if ('targetAngle' in patch) {
    next.targetAngle = toPositiveInteger(patch.targetAngle, fallback?.targetAngle ?? 90);
  }
  if ('reps' in patch) {
    next.reps = toPositiveInteger(patch.reps, fallback?.reps ?? 10);
  }
  if ('sets' in patch) {
    next.sets = toPositiveInteger(patch.sets, fallback?.sets ?? 3);
  }
  if ('holdSeconds' in patch) {
    next.holdSeconds = toPositiveInteger(patch.holdSeconds, fallback?.holdSeconds ?? 3);
  }
  if ('difficultyLevel' in patch) {
    next.difficultyLevel = normalizeDifficultyLevel(
      patch.difficultyLevel ?? fallback?.difficultyLevel
    );
  }

  return next;
}

function withDefaultDifficulty(rx: Prescription): Prescription {
  return {
    ...rx,
    difficultyLevel: normalizeDifficultyLevel(rx.difficultyLevel),
  };
}

export function resolvePrescriptionPlan(
  prescription: Prescription,
  exercise?: Exercise
): ResolvedPrescriptionPlan {
  const meta = getDifficultyMeta(prescription.difficultyLevel);
  const targetAngle = clamp(
    toPositiveInteger(prescription.targetAngle, exercise?.targetAngle ?? 90) +
      meta.targetAngleDelta,
    5,
    175
  );
  const safety = resolveSafetyRange(targetAngle, exercise);

  return {
    difficultyLevel: meta.level,
    difficultyLabel: meta.label,
    difficultyTone: meta.tone,
    effectiveTargetAngle: targetAngle,
    effectiveTolerance: meta.tolerance,
    effectiveReps: clamp(
      toPositiveInteger(prescription.reps, exercise?.reps ?? 10) + meta.repsDelta,
      3,
      20
    ),
    effectiveSets: clamp(
      toPositiveInteger(prescription.sets, exercise?.sets ?? 3) + meta.setsDelta,
      1,
      5
    ),
    effectiveHoldSeconds: clamp(
      toPositiveInteger(prescription.holdSeconds, exercise?.holdSeconds ?? 3) +
        meta.holdSecondsDelta,
      1,
      6
    ),
    ...safety,
  };
}

export function getMergedPrescriptions(): Prescription[] {
  const state = readState();
  const mockIds = new Set(mockPrescriptions.map((rx) => rx.id));

  const mergedMock = mockPrescriptions.map((rx) =>
    withDefaultDifficulty({
      ...rx,
      ...(state.overrides[rx.id] ?? {}),
    })
  );

  const custom = state.custom
    .filter((rx) => !mockIds.has(rx.id))
    .map((rx) =>
      withDefaultDifficulty({
        ...rx,
        ...(state.overrides[rx.id] ?? {}),
      })
    );

  return [...mergedMock, ...custom];
}

export function updatePrescription(
  id: string,
  patch: Partial<PrescriptionEditableFields>
) {
  const state = readState();
  const current = getMergedPrescriptions().find((rx) => rx.id === id);
  const normalized = normalizeEditableFields(patch, current);

  const customIndex = state.custom.findIndex((rx) => rx.id === id);
  if (customIndex >= 0) {
    state.custom[customIndex] = {
      ...state.custom[customIndex],
      ...normalized,
    };
  } else {
    state.overrides[id] = {
      ...(state.overrides[id] ?? {}),
      ...normalized,
    };
  }

  writeState(state);
  notifyUpdated();
}

export function createPrescription(
  prescription: Omit<Prescription, 'id'> & { id?: string }
) {
  const state = readState();
  const id = prescription.id ?? `RXUSR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const withId: Prescription = withDefaultDifficulty({
    ...prescription,
    id,
    ...normalizeEditableFields(prescription, prescription),
  });

  state.custom.push(withId);
  writeState(state);
  notifyUpdated();
  return withId;
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() =>
    getMergedPrescriptions()
  );

  useEffect(() => {
    const refresh = () => setPrescriptions(getMergedPrescriptions());
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

  return prescriptions;
}
