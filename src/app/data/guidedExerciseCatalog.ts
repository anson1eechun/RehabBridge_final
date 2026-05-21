import type { Exercise, Prescription, TrackingMode } from './mockData';

export type GuidedVisualKey =
  | 'scapula'
  | 'neck'
  | 'ankle'
  | 'spine'
  | 'glute'
  | 'manual';

export type GuidedReportQuestion =
  | {
      id: string;
      type: 'scale';
      label: string;
      helper: string;
      minLabel: string;
      maxLabel: string;
    }
  | {
      id: string;
      type: 'boolean';
      label: string;
      helper: string;
    }
  | {
      id: string;
      type: 'choice';
      label: string;
      helper: string;
      options: string[];
    };

export interface GuidedExerciseConfig {
  exerciseId: string;
  mode: Exclude<TrackingMode, 'angle'>;
  visual: GuidedVisualKey;
  headline: string;
  shortCue: string;
  illustrationSteps: string[];
  focusPoints: string[];
  reportQuestions: GuidedReportQuestion[];
}

const commonPainQuestion: GuidedReportQuestion = {
  id: 'painScore',
  type: 'scale',
  label: '這個動作做完，疼痛大概幾分？',
  helper: '0 是不痛，10 是非常痛。',
  minLabel: '不痛',
  maxLabel: '很痛',
};

const effortQuestion: GuidedReportQuestion = {
  id: 'effort',
  type: 'scale',
  label: '你覺得這個動作難度幾分？',
  helper: '醫師可用這個判斷是否要調整次數或阻力。',
  minLabel: '輕鬆',
  maxLabel: '很吃力',
};

export const guidedExerciseCatalog: Record<string, GuidedExerciseConfig> = {
  shoulder_blade_squeeze: {
    exerciseId: 'shoulder_blade_squeeze',
    mode: 'timed',
    visual: 'scapula',
    headline: '把肩胛往後輕輕夾住',
    shortCue: '肩膀放鬆，不要往耳朵聳。',
    illustrationSteps: ['坐直', '肩胛往後夾', '維持後放鬆'],
    focusPoints: ['感覺出力在上背，不是在脖子。', '胸口自然打開，手臂不用大力往後拉。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'shrugging',
        type: 'boolean',
        label: '做的時候有沒有一直聳肩？',
        helper: '如果常聳肩，醫師可能需要降低強度或改姿勢。',
      },
      {
        id: 'fatigueArea',
        type: 'choice',
        label: '最明顯的酸累在哪裡？',
        helper: '幫助判斷是否有代償。',
        options: ['肩胛中間', '脖子', '肩膀前側', '沒有特別酸累'],
      },
      effortQuestion,
    ],
  },
  chin_tuck: {
    exerciseId: 'chin_tuck',
    mode: 'timed',
    visual: 'neck',
    headline: '下巴水平往後收',
    shortCue: '像做雙下巴，不低頭也不仰頭。',
    illustrationSteps: ['看前方', '下巴往後收', '維持後放鬆'],
    focusPoints: ['眼睛看前方，頭不要往下點。', '如果頭暈、手麻或痛往手臂跑，立刻停止。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'dizziness',
        type: 'scale',
        label: '做完有頭暈嗎？',
        helper: '頸部動作最需要追蹤頭暈狀況。',
        minLabel: '沒有',
        maxLabel: '很暈',
      },
      {
        id: 'armNumbness',
        type: 'boolean',
        label: '有沒有手麻或刺痛？',
        helper: '若有，醫師需要重新評估頸部處方。',
      },
      effortQuestion,
    ],
  },
  neck_rotation: {
    exerciseId: 'neck_rotation',
    mode: 'manual',
    visual: 'neck',
    headline: '頭慢慢左右轉',
    shortCue: '只轉到舒服範圍，不要甩頭。',
    illustrationSteps: ['坐直', '慢慢轉左/右', '回到正中'],
    focusPoints: ['骨盆和肩膀不要跟著轉。', '左右兩邊差很多時，回報哪一側比較卡。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'limitedSide',
        type: 'choice',
        label: '哪一邊比較卡或比較緊？',
        helper: '幫助醫師判斷活動受限方向。',
        options: ['左邊', '右邊', '兩邊差不多', '都不緊'],
      },
      {
        id: 'dizziness',
        type: 'scale',
        label: '轉頭時有頭暈嗎？',
        helper: '頭暈分數高時不建議自行增加次數。',
        minLabel: '沒有',
        maxLabel: '很暈',
      },
      effortQuestion,
    ],
  },
  neck_side_stretch: {
    exerciseId: 'neck_side_stretch',
    mode: 'timed',
    visual: 'neck',
    headline: '耳朵慢慢靠向肩膀',
    shortCue: '肩膀不要聳，拉緊就好。',
    illustrationSteps: ['坐直', '頭往側邊傾', '維持伸展'],
    focusPoints: ['伸展感應該是緊，不是刺痛。', '不要用手大力壓頭。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'stretchIntensity',
        type: 'scale',
        label: '伸展感覺有多強？',
        helper: '太強代表可能需要降低角度或縮短秒數。',
        minLabel: '很輕',
        maxLabel: '太緊',
      },
      {
        id: 'radiatingPain',
        type: 'boolean',
        label: '痛或麻有沒有往手臂延伸？',
        helper: '這是頸部伸展需要特別注意的警訊。',
      },
      effortQuestion,
    ],
  },
  ankle_inversion_band: {
    exerciseId: 'ankle_inversion_band',
    mode: 'manual',
    visual: 'ankle',
    headline: '腳掌慢慢往內轉',
    shortCue: '小腿固定，只動腳踝。',
    illustrationSteps: ['坐穩固定帶子', '腳掌往內', '慢慢回正'],
    focusPoints: ['不要讓膝蓋跟著轉。', '踝部腫、痛或不穩要回報。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'swelling',
        type: 'boolean',
        label: '做完腳踝有變腫或變熱嗎？',
        helper: '醫師可用來判斷負荷是否過高。',
      },
      {
        id: 'instability',
        type: 'scale',
        label: '腳踝有不穩或快扭到的感覺嗎？',
        helper: '0 是很穩，10 是很不穩。',
        minLabel: '很穩',
        maxLabel: '很不穩',
      },
      effortQuestion,
    ],
  },
  ankle_eversion_band: {
    exerciseId: 'ankle_eversion_band',
    mode: 'manual',
    visual: 'ankle',
    headline: '腳掌慢慢往外轉',
    shortCue: '小腿固定，只動腳踝。',
    illustrationSteps: ['坐穩固定帶子', '腳掌往外', '慢慢回正'],
    focusPoints: ['動作要小而穩，不要用膝蓋代償。', '外側腳踝疼痛或腫脹要回報。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'outerAnklePain',
        type: 'scale',
        label: '外側腳踝不舒服幾分？',
        helper: '外翻訓練常需要觀察外側踝反應。',
        minLabel: '沒有',
        maxLabel: '很不舒服',
      },
      {
        id: 'swelling',
        type: 'boolean',
        label: '做完腳踝有變腫或變熱嗎？',
        helper: '若有，下一次可能需要減量。',
      },
      effortQuestion,
    ],
  },
  pelvic_tilt: {
    exerciseId: 'pelvic_tilt',
    mode: 'manual',
    visual: 'spine',
    headline: '骨盆小幅前後滾動',
    shortCue: '動作小、慢、可控制。',
    illustrationSteps: ['坐穩或仰躺', '骨盆前傾', '骨盆後傾'],
    focusPoints: ['不要憋氣。', '下背痛增加時立刻停止。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'backTension',
        type: 'scale',
        label: '下背緊繃感幾分？',
        helper: '幫助醫師判斷是否需要改成更小幅度。',
        minLabel: '放鬆',
        maxLabel: '很緊',
      },
      {
        id: 'breathing',
        type: 'boolean',
        label: '做的時候會不會忍不住憋氣？',
        helper: '常憋氣代表核心控制還需要簡化。',
      },
      effortQuestion,
    ],
  },
  seated_cat_cow: {
    exerciseId: 'seated_cat_cow',
    mode: 'manual',
    visual: 'spine',
    headline: '吸氣挺胸，吐氣圓背',
    shortCue: '讓脊椎慢慢活動。',
    illustrationSteps: ['坐穩', '吸氣挺胸', '吐氣圓背'],
    focusPoints: ['動作跟呼吸配合，不用做很大。', '頭暈或背痛增加就停止。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'mobility',
        type: 'choice',
        label: '哪個方向比較卡？',
        helper: '幫助治療師判斷脊椎活動限制。',
        options: ['挺胸比較卡', '圓背比較卡', '都差不多', '都很順'],
      },
      {
        id: 'dizziness',
        type: 'boolean',
        label: '做的時候有頭暈嗎？',
        helper: '若會頭暈，可能要改小幅度或減少次數。',
      },
      effortQuestion,
    ],
  },
  seated_trunk_rotation: {
    exerciseId: 'seated_trunk_rotation',
    mode: 'manual',
    visual: 'spine',
    headline: '胸口慢慢左右轉',
    shortCue: '骨盆坐穩，不跟著轉。',
    illustrationSteps: ['坐穩', '胸口轉左', '胸口轉右'],
    focusPoints: ['左右兩邊差很多要回報。', '腰痛增加時降低角度。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'limitedSide',
        type: 'choice',
        label: '哪一邊比較卡？',
        helper: '幫助醫師判斷胸腰椎旋轉限制。',
        options: ['左轉較卡', '右轉較卡', '兩邊差不多', '都不卡'],
      },
      {
        id: 'pelvisMoved',
        type: 'boolean',
        label: '你覺得骨盆有跟著轉嗎？',
        helper: '如果常代償，治療師可能會改成更簡單版本。',
      },
      effortQuestion,
    ],
  },
  glute_squeeze: {
    exerciseId: 'glute_squeeze',
    mode: 'timed',
    visual: 'glute',
    headline: '臀部輕輕夾緊',
    shortCue: '出力但不要憋氣。',
    illustrationSteps: ['坐/躺穩', '臀部夾緊', '維持後放鬆'],
    focusPoints: ['感覺臀部出力，不是腰在硬撐。', '可以用在站起前的啟動練習。'],
    reportQuestions: [
      commonPainQuestion,
      {
        id: 'feltGlutes',
        type: 'boolean',
        label: '你有感覺到臀部出力嗎？',
        helper: '若沒有，治療師可能需要調整姿勢。',
      },
      {
        id: 'backCompensation',
        type: 'boolean',
        label: '做的時候下背會不會跟著用力？',
        helper: '這可幫助判斷是否有腰部代償。',
      },
      effortQuestion,
    ],
  },
};

export const fallbackGuidedExerciseConfig: GuidedExerciseConfig = {
  exerciseId: 'default',
  mode: 'manual',
  visual: 'manual',
  headline: '跟著治療師步驟慢慢做',
  shortCue: '安全、舒服、可控制，比做很大更重要。',
  illustrationSteps: ['看步驟', '慢慢完成', '回報感覺'],
  focusPoints: ['不要硬撐疼痛。', '不舒服時先停止並回報。'],
  reportQuestions: [commonPainQuestion, effortQuestion],
};

export function getExerciseTrackingMode(
  exercise?: Exercise,
  prescription?: Pick<Prescription, 'trackingMode'>
): TrackingMode {
  return prescription?.trackingMode ?? exercise?.trackingMode ?? 'angle';
}

export function getGuidedExerciseConfig(exerciseId?: string): GuidedExerciseConfig {
  if (!exerciseId) return fallbackGuidedExerciseConfig;
  return guidedExerciseCatalog[exerciseId] ?? {
    ...fallbackGuidedExerciseConfig,
    exerciseId,
  };
}

export function isGuidedTrackingMode(mode: TrackingMode) {
  return mode === 'timed' || mode === 'manual';
}
