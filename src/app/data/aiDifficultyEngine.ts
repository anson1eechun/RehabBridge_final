import type { DifficultyLevel, Exercise, Prescription, SessionRecord } from './mockData';
import { normalizeDifficultyLevel, resolvePrescriptionPlan } from './prescriptionStore';

export type AiDifficultyDirection =
  | 'increase'
  | 'decrease'
  | 'maintain'
  | 'not_enough_data';

export interface AiDifficultySuggestion {
  prescriptionId: string;
  patientId: string;
  exerciseId: string;
  exerciseName: string;
  direction: AiDifficultyDirection;
  currentLevel: DifficultyLevel;
  suggestedLevel: DifficultyLevel;
  confidence: number;
  reason: string;
  doctorSummary: string;
  patientMessage: string;
  metrics: {
    recentCount: number;
    avgScore: number;
    avgAngleDeviation: number;
    avgVoiceFeedbackCount: number;
    completionRate: number;
  };
}

function clampDifficultyLevel(level: number): DifficultyLevel {
  if (level <= 1) return 1;
  if (level >= 5) return 5;
  return Math.round(level) as DifficultyLevel;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function sortByRecent(records: SessionRecord[]) {
  return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getCompletionRate(records: SessionRecord[], plannedSets: number, plannedReps: number) {
  if (records.length === 0) return 0;
  const rates = records.map((record) => {
    const setRate = plannedSets > 0 ? Math.min(1, record.completedSets / plannedSets) : 1;
    const repRate = plannedReps > 0 ? Math.min(1, record.completedReps / plannedReps) : 1;
    return (setRate + repRate) / 2;
  });
  return Math.round((rates.reduce((sum, rate) => sum + rate, 0) / rates.length) * 100);
}

function buildDoctorSummary(
  direction: AiDifficultyDirection,
  currentLevel: DifficultyLevel,
  suggestedLevel: DifficultyLevel
) {
  if (direction === 'increase') {
    return `AI 建議：第 ${currentLevel} 關調整為第 ${suggestedLevel} 關`;
  }
  if (direction === 'decrease') {
    return `AI 建議：第 ${currentLevel} 關調整為第 ${suggestedLevel} 關`;
  }
  if (direction === 'maintain') {
    return `AI 建議：維持第 ${currentLevel} 關`;
  }
  return 'AI 建議：先累積更多訓練資料';
}

function buildPatientMessage(direction: AiDifficultyDirection) {
  if (direction === 'increase') {
    return '系統觀察到你最近做得很穩，醫生可以考慮讓你挑戰下一關。';
  }
  if (direction === 'decrease') {
    return '系統觀察到最近比較吃力，先把動作做穩會比勉強加難更重要。';
  }
  if (direction === 'maintain') {
    return '目前節奏適合你，穩穩完成每一次訓練就是很好的累積。';
  }
  return '完成更多訓練後，系統會更了解你的復健狀況。';
}

export function buildAiDifficultySuggestion(
  prescription: Prescription,
  exercise: Exercise | undefined,
  records: SessionRecord[]
): AiDifficultySuggestion {
  const plan = exercise ? resolvePrescriptionPlan(prescription, exercise) : null;
  const currentLevel = normalizeDifficultyLevel(prescription.difficultyLevel);
  const exerciseRecords = sortByRecent(
    records.filter(
      (record) =>
        record.patientId === prescription.patientId &&
        record.exerciseId === prescription.exerciseId
    )
  );
  const recent = exerciseRecords.slice(0, 3);
  const plannedSets = plan?.effectiveSets ?? prescription.sets;
  const plannedReps = plan?.effectiveReps ?? prescription.reps;
  const avgScore = average(recent.map((record) => record.score));
  const avgAngleDeviation = average(
    recent.map((record) => Math.abs((record.targetAngle || prescription.targetAngle) - record.avgAngle))
  );
  const avgVoiceFeedbackCount = average(recent.map((record) => record.voiceFeedbackCount));
  const completionRate = getCompletionRate(recent, plannedSets, plannedReps);
  const metrics = {
    recentCount: recent.length,
    avgScore,
    avgAngleDeviation,
    avgVoiceFeedbackCount,
    completionRate,
  };

  if (recent.length < 2) {
    return {
      prescriptionId: prescription.id,
      patientId: prescription.patientId,
      exerciseId: prescription.exerciseId,
      exerciseName: exercise?.name ?? prescription.exerciseId,
      direction: 'not_enough_data',
      currentLevel,
      suggestedLevel: currentLevel,
      confidence: 42,
      reason: `目前只有 ${recent.length} 次紀錄，建議至少累積 2 次以上再調整。`,
      doctorSummary: buildDoctorSummary('not_enough_data', currentLevel, currentLevel),
      patientMessage: buildPatientMessage('not_enough_data'),
      metrics,
    };
  }

  const stableAngle = avgAngleDeviation <= Math.max(8, (plan?.effectiveTolerance ?? 12) * 0.7);
  const lowVoiceFeedback = avgVoiceFeedbackCount <= 10;
  const highVoiceFeedback = avgVoiceFeedbackCount >= 13;
  const highCompletion = completionRate >= 90;
  const lowCompletion = completionRate < 75;
  const shouldIncrease =
    recent.length >= 3 &&
    avgScore >= 88 &&
    stableAngle &&
    lowVoiceFeedback &&
    highCompletion &&
    currentLevel < 5;
  const shouldDecrease =
    (avgScore < 70 || avgAngleDeviation >= Math.max(14, (plan?.effectiveTolerance ?? 10) * 1.2) || highVoiceFeedback || lowCompletion) &&
    currentLevel > 1;

  let direction: AiDifficultyDirection = 'maintain';
  let suggestedLevel = currentLevel;
  let confidence = 72;
  let reason = `近 ${recent.length} 次平均 ${avgScore} 分，角度偏差約 ${avgAngleDeviation} 度，完成率 ${completionRate}%。`;

  if (shouldIncrease) {
    direction = 'increase';
    suggestedLevel = clampDifficultyLevel(currentLevel + 1);
    confidence = Math.min(96, 78 + Math.round((avgScore - 88) * 1.5) + (stableAngle ? 6 : 0));
    reason = `近 3 次平均 ${avgScore} 分，角度穩定，語音提醒偏少，完成率 ${completionRate}%。`;
  } else if (shouldDecrease) {
    direction = 'decrease';
    suggestedLevel = clampDifficultyLevel(currentLevel - 1);
    confidence = Math.min(94, 76 + Math.max(0, 70 - avgScore) + (highVoiceFeedback ? 6 : 0));
    reason = `近 ${recent.length} 次平均 ${avgScore} 分，角度偏差約 ${avgAngleDeviation} 度，語音提醒 ${avgVoiceFeedbackCount} 次，建議先降低負擔。`;
  }

  return {
    prescriptionId: prescription.id,
    patientId: prescription.patientId,
    exerciseId: prescription.exerciseId,
    exerciseName: exercise?.name ?? prescription.exerciseId,
    direction,
    currentLevel,
    suggestedLevel,
    confidence,
    reason,
    doctorSummary: buildDoctorSummary(direction, currentLevel, suggestedLevel),
    patientMessage: buildPatientMessage(direction),
    metrics,
  };
}

export function getSuggestionTone(direction: AiDifficultyDirection) {
  if (direction === 'increase') {
    return {
      label: '建議升級',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#047857',
    };
  }
  if (direction === 'decrease') {
    return {
      label: '建議降階',
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#C2410C',
    };
  }
  if (direction === 'maintain') {
    return {
      label: '維持難度',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      text: '#4338CA',
    };
  }
  return {
    label: '資料累積中',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    text: '#64748B',
  };
}
