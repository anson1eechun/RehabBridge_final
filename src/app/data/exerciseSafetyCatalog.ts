import type { Exercise, Prescription, TrackingMode } from './mockData';
import { getExerciseTrackingMode } from './guidedExerciseCatalog';

export interface ExerciseSafetyLabel {
  mode: TrackingMode;
  label: string;
  shortLabel: string;
  description: string;
  doctorNote: string;
  stopRule: string;
  bg: string;
  text: string;
  border: string;
}

const safetyLabels: Record<TrackingMode, ExerciseSafetyLabel> = {
  angle: {
    mode: 'angle',
    label: '可鏡頭追蹤',
    shortLabel: '鏡頭追蹤',
    description: '適合用大關節角度偵測與即時回饋。',
    doctorNote: '系統會追蹤角度、容許誤差、完成次數與姿勢穩定度。',
    stopRule: '鏡頭看不到全身、疼痛升高或角度超出安全範圍時停止。',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    border: '#BFDBFE',
  },
  timed: {
    mode: 'timed',
    label: '計時引導',
    shortLabel: '計時引導',
    description: '適合等長、伸展或小角度動作，以倒數與完成回報追蹤。',
    doctorNote: '系統會記錄完成率、疼痛、難度與動作專屬症狀回報。',
    stopRule: '頭暈、麻、刺痛、疼痛明顯增加時停止並通知照護端。',
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
  },
  manual: {
    mode: 'manual',
    label: '需治療師確認',
    shortLabel: '人工回報',
    description: '細部關節或高代償風險動作，不硬套鏡頭角度分數。',
    doctorNote: '患者依圖示完成並回報代償、疼痛、腫脹、卡住或頭暈等資訊。',
    stopRule: '若有神經症狀、腫脹變熱、明顯不穩或疼痛 >= 7，需重新評估。',
    bg: '#FEF2F2',
    text: '#B91C1C',
    border: '#FECACA',
  },
};

export function getSafetyLabelByMode(mode: TrackingMode): ExerciseSafetyLabel {
  return safetyLabels[mode];
}

export function getExerciseSafetyLabel(
  exercise?: Exercise,
  prescription?: Pick<Prescription, 'trackingMode'>
): ExerciseSafetyLabel {
  const mode = getExerciseTrackingMode(exercise, prescription);
  return safetyLabels[mode];
}
