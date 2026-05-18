export type RehabGameVisual =
  | 'soccer'
  | 'balloon'
  | 'windmill'
  | 'starReach'
  | 'basketCharge'
  | 'bowling'
  | 'rocket'
  | 'elevator'
  | 'gate'
  | 'bridge';

export interface RehabGameConfig {
  exerciseId: string;
  title: string;
  shortTitle: string;
  levelName: string;
  description: string;
  actionCue: string;
  successCue: string;
  safetyCue: string;
  rewardLabel: string;
  visual: RehabGameVisual;
  theme: {
    from: string;
    to: string;
    accent: string;
    accentSoft: string;
    dark: string;
  };
  adjustCue: {
    below: string;
    above: string;
  };
}

const defaultTheme = {
  from: '#38BDF8',
  to: '#2563EB',
  accent: '#FACC15',
  accentSoft: 'rgba(250, 204, 21, 0.18)',
  dark: '#0F172A',
};

export const rehabGameCatalog: Record<string, RehabGameConfig> = {
  knee_flexion: {
    exerciseId: 'knee_flexion',
    title: '足球射門',
    shortTitle: '足球射門',
    levelName: '球門挑戰',
    description: '膝蓋彎到安全目標區並穩定停住，就能完成一次射門。',
    actionCue: '慢慢彎膝，進入綠色目標區後穩住。',
    successCue: '角度到位，球準備射門。',
    safetyCue: '只用復健動作集氣，不需要真的踢腳。',
    rewardLabel: '進球',
    visual: 'soccer',
    theme: {
      from: '#22C55E',
      to: '#0EA5E9',
      accent: '#FACC15',
      accentSoft: 'rgba(250, 204, 21, 0.2)',
      dark: '#064E3B',
    },
    adjustCue: {
      below: '膝蓋收得太多，慢慢放回一點。',
      above: '再彎一點，讓球有力量。',
    },
  },
  leg_raise: {
    exerciseId: 'leg_raise',
    title: '熱氣球升空',
    shortTitle: '熱氣球',
    levelName: '天空巡航',
    description: '抬腿高度越接近處方角度，熱氣球就越穩定升高。',
    actionCue: '腿慢慢抬高，停在目標區。',
    successCue: '高度剛好，熱氣球穩穩上升。',
    safetyCue: '抬腿時保持膝蓋穩定，不用追求速度。',
    rewardLabel: '升空',
    visual: 'balloon',
    theme: {
      from: '#38BDF8',
      to: '#8B5CF6',
      accent: '#FB7185',
      accentSoft: 'rgba(251, 113, 133, 0.18)',
      dark: '#1E1B4B',
    },
    adjustCue: {
      below: '再抬高一點點，慢慢靠近目標。',
      above: '高度太高了，輕輕放低一點。',
    },
  },
  shoulder_abduction: {
    exerciseId: 'shoulder_abduction',
    title: '風車發電',
    shortTitle: '風車發電',
    levelName: '能量農場',
    description: '手臂外展到目標角度，風車就會開始發電。',
    actionCue: '手臂向旁邊抬起，肩膀保持放鬆。',
    successCue: '風車轉起來了，動作很穩。',
    safetyCue: '不要聳肩或硬拉，肩膀不舒服就停下。',
    rewardLabel: '能量',
    visual: 'windmill',
    theme: {
      from: '#2DD4BF',
      to: '#0EA5E9',
      accent: '#A7F3D0',
      accentSoft: 'rgba(167, 243, 208, 0.18)',
      dark: '#134E4A',
    },
    adjustCue: {
      below: '手臂再抬一點，慢慢帶起風車。',
      above: '稍微放低一點，回到安全角度。',
    },
  },
  shoulder_flexion: {
    exerciseId: 'shoulder_flexion',
    title: '星星採集',
    shortTitle: '星星採集',
    levelName: '星空任務',
    description: '手臂向前抬到處方角度，就能收集星星能量。',
    actionCue: '手臂向前慢慢抬，不要憋氣。',
    successCue: '星星亮起來了，保持得很好。',
    safetyCue: '手臂不用抬過頭，照醫師角度就好。',
    rewardLabel: '星光',
    visual: 'starReach',
    theme: {
      from: '#6366F1',
      to: '#0F172A',
      accent: '#FDE68A',
      accentSoft: 'rgba(253, 230, 138, 0.2)',
      dark: '#111827',
    },
    adjustCue: {
      below: '再往前抬一點，靠近亮光位置。',
      above: '超過一點了，慢慢放回安全區。',
    },
  },
  elbow_flexion: {
    exerciseId: 'elbow_flexion',
    title: '投籃蓄力',
    shortTitle: '投籃蓄力',
    levelName: '準心訓練',
    description: '手肘彎曲到目標區並停住，籃球就會完成投籃。',
    actionCue: '手肘慢慢彎，讓球停在準心上。',
    successCue: '準心對好了，準備投籃。',
    safetyCue: '上臂穩定，動作小一點也沒關係。',
    rewardLabel: '命中',
    visual: 'basketCharge',
    theme: {
      from: '#FB923C',
      to: '#EF4444',
      accent: '#FDBA74',
      accentSoft: 'rgba(253, 186, 116, 0.18)',
      dark: '#7C2D12',
    },
    adjustCue: {
      below: '手肘角度太小，稍微放開一點。',
      above: '再彎一點，讓準心靠近。',
    },
  },
  elbow_extension: {
    exerciseId: 'elbow_extension',
    title: '保齡球直線推',
    shortTitle: '保齡球',
    levelName: '直線球道',
    description: '手肘穩定伸直到安全角度，球就會沿著直線前進。',
    actionCue: '手肘慢慢伸直，停在目標區。',
    successCue: '球道對準了，推出得很穩。',
    safetyCue: '不要把關節鎖死，停在醫師設定範圍。',
    rewardLabel: '擊倒',
    visual: 'bowling',
    theme: {
      from: '#64748B',
      to: '#0F172A',
      accent: '#A5B4FC',
      accentSoft: 'rgba(165, 180, 252, 0.2)',
      dark: '#020617',
    },
    adjustCue: {
      below: '再伸直一點，慢慢靠近球道中心。',
      above: '伸太多了，稍微回來一點。',
    },
  },
  knee_extension: {
    exerciseId: 'knee_extension',
    title: '小火箭升空',
    shortTitle: '火箭升空',
    levelName: '發射基地',
    description: '膝蓋伸直到處方角度，火箭就會安全升空。',
    actionCue: '膝蓋慢慢伸直，停在目標區。',
    successCue: '發射角度穩定，火箭升空。',
    safetyCue: '伸直但不要硬鎖膝蓋，疼痛就停止。',
    rewardLabel: '升空',
    visual: 'rocket',
    theme: {
      from: '#0EA5E9',
      to: '#1D4ED8',
      accent: '#F97316',
      accentSoft: 'rgba(249, 115, 22, 0.18)',
      dark: '#0C4A6E',
    },
    adjustCue: {
      below: '再伸直一點，火箭才會穩。',
      above: '超過一點了，輕輕回到目標區。',
    },
  },
  squat: {
    exerciseId: 'squat',
    title: '升降台控制',
    shortTitle: '升降台',
    levelName: '穩定平台',
    description: '靠牆下蹲到安全角度，平台就會穩定下降到指定樓層。',
    actionCue: '慢慢下蹲，停在安全目標區。',
    successCue: '平台停得很穩，完成一次控制。',
    safetyCue: '下蹲幅度保守，膝蓋不舒服就停止。',
    rewardLabel: '到站',
    visual: 'elevator',
    theme: {
      from: '#14B8A6',
      to: '#475569',
      accent: '#FCD34D',
      accentSoft: 'rgba(252, 211, 77, 0.2)',
      dark: '#134E4A',
    },
    adjustCue: {
      below: '蹲太深了，慢慢站高一點。',
      above: '再下降一點點，靠近目標樓層。',
    },
  },
  hip_abduction: {
    exerciseId: 'hip_abduction',
    title: '安全門開啟',
    shortTitle: '安全門',
    levelName: '穩定通道',
    description: '髖部外展到處方角度，安全門就會慢慢打開。',
    actionCue: '腳向外慢慢打開，骨盆保持穩定。',
    successCue: '安全門開啟了，控制得很好。',
    safetyCue: '骨盆不要歪，角度小但穩定更重要。',
    rewardLabel: '開門',
    visual: 'gate',
    theme: {
      from: '#10B981',
      to: '#0F766E',
      accent: '#5EEAD4',
      accentSoft: 'rgba(94, 234, 212, 0.18)',
      dark: '#064E3B',
    },
    adjustCue: {
      below: '再往外一點，門會慢慢打開。',
      above: '外展太多了，回來一點比較安全。',
    },
  },
  side_leg_raise: {
    exerciseId: 'side_leg_raise',
    title: '彩虹橋鋪路',
    shortTitle: '彩虹橋',
    levelName: '橋面修復',
    description: '側抬腿進入目標區，每完成一次就鋪上一段橋面。',
    actionCue: '側邊慢慢抬腿，身體保持直線。',
    successCue: '橋面接上了，這一下很穩。',
    safetyCue: '身體不要晃，抬不高也先求穩。',
    rewardLabel: '橋段',
    visual: 'bridge',
    theme: {
      from: '#F472B6',
      to: '#8B5CF6',
      accent: '#FDE047',
      accentSoft: 'rgba(253, 224, 71, 0.18)',
      dark: '#581C87',
    },
    adjustCue: {
      below: '再往側邊抬一點，橋面快接上了。',
      above: '太高了，慢慢放低一點。',
    },
  },
};

export const fallbackRehabGame: RehabGameConfig = {
  exerciseId: 'default',
  title: '穩定集點',
  shortTitle: '集點挑戰',
  levelName: '復健任務',
  description: '進入目標角度並穩定停住，就能完成一次任務。',
  actionCue: '慢慢做到目標區，穩定比速度重要。',
  successCue: '做得很穩，完成一次任務。',
  safetyCue: '所有遊戲都以醫師處方角度為準，不會要求超出安全範圍。',
  rewardLabel: '集點',
  visual: 'bridge',
  theme: defaultTheme,
  adjustCue: {
    below: '再靠近目標角度一點。',
    above: '超過一點了，慢慢回到目標區。',
  },
};

export function getRehabGameForExercise(exerciseId?: string): RehabGameConfig {
  if (!exerciseId) return fallbackRehabGame;
  return rehabGameCatalog[exerciseId] ?? fallbackRehabGame;
}
