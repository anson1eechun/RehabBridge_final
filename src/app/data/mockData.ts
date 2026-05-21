// ============================================================
// Mock Data — RehabBridge System (Ultimate Edition with Messaging)
// ============================================================

// ─── 介面定義 (Interfaces) ──────────────────────────────────
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: '男' | '女';
  diagnosis: string;
  doctorId: string;
  familyContact: string;
  avatar: string;
  admissionDate: string;
  completionRate: number;
  lastSessionDate: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  targetAngle: number;
  restAngle: number;
  tolerance: number;
  joints: [number, number, number]; 
  reps: number;
  sets: number;
  holdSeconds: number;
  side: 'left' | 'right' | 'bilateral';
  guidanceSteps: string[];
  voicePrompts: {
    start: string;
    tooLow: string;
    achieved: string;
    complete: string;
  };
  /**
   * 台語陪練稿（雅婷 tai_*）。有設定且 VITE_TTS_PROVIDER=yating 時，訓練頁可切「台語」則唸此稿並用 tai_* 聲線；選「國語」則唸 voicePrompts。
   * 本機 Web Speech 仍用 voicePrompts（國語）。
   */
  voicePromptsTai?: {
    start: string;
    tooLow: string;
    achieved: string;
    complete: string;
    /** 角度過高時（可選；未設則用程式內建台語句） */
    tooHigh?: string;
  };
  /** 覆寫雅婷台語聲線，預設 tai_female_2（亦晴） */
  yatingTaiVoiceModel?: string;
  bodyArea: string;
  difficulty: 'easy' | 'medium' | 'hard';
  trackingMode?: TrackingMode;
}

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type TrackingMode = 'angle' | 'timed' | 'manual';

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  exerciseId: string;
  targetAngle: number;
  reps: number;
  sets: number;
  holdSeconds: number;
  difficultyLevel?: DifficultyLevel;
  trackingMode?: TrackingMode;
  frequency: string;
  notes: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface SessionRecord {
  id: string;
  patientId: string;
  exerciseId: string;
  date: string;
  duration: number; // 單位：分鐘
  completedSets: number;
  completedReps: number;
  avgAngle: number;
  maxAngle: number;
  targetAngle: number;
  score: number;
  voiceFeedbackCount: number;
}

// 🌟 新增：物理治療師、家屬與通訊介面
export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  avatar: string;
  patientCount: number;
}

export interface FamilyMember {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  phone: string;
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderRole: 'doctor' | 'patient' | 'family' | 'therapist';
  content: string;
  timestamp: string;
  isRead: boolean;
}

// ─── 人物資料庫 (Users Data) ───────────────────────────────
export const mockDoctors = [
  { id: 'D001', name: '陳志明', specialty: '骨科復健', hospital: '台大醫院', department: '復健科', avatar: 'D', patientCount: 12 },
  { id: 'D002', name: '林美華', specialty: '神經復健', hospital: '台大醫院', department: '神經科', avatar: 'L', patientCount: 8 },
];

export const mockTherapists: Therapist[] = [
  { id: 'T001', name: '黃建宏', specialty: '運動醫學與骨科復健', hospital: '台大醫院', avatar: '黃', patientCount: 15 },
  { id: 'T002', name: '吳雅婷', specialty: '神經物理治療', hospital: '台大醫院', avatar: '吳', patientCount: 10 }
];

export const mockPatients: Patient[] = [
  { id: 'P001', name: '王大明', age: 72, gender: '男', diagnosis: '右膝退化性關節炎（第三期）', doctorId: 'D001', familyContact: '王小美', avatar: '王', admissionDate: '2026-01-15', completionRate: 85, lastSessionDate: '2026-03-24', status: 'active' },
  { id: 'P002', name: '李秀英', age: 68, gender: '女', diagnosis: '左肩旋轉肌袖受傷術後', doctorId: 'D001', familyContact: '李建國', avatar: '李', admissionDate: '2026-02-01', completionRate: 72, lastSessionDate: '2026-03-22', status: 'active' },
  { id: 'P003', name: '張福壽', age: 75, gender: '男', diagnosis: '腦中風後右側肢體偏癱', doctorId: 'D002', familyContact: '張明芳', avatar: '張', admissionDate: '2026-01-08', completionRate: 60, lastSessionDate: '2026-03-21', status: 'active' },
  { id: 'P004', name: '陳阿蘭', age: 70, gender: '女', diagnosis: '全髖關節置換術後（左側）', doctorId: 'D001', familyContact: '陳大偉', avatar: '陳', admissionDate: '2026-03-01', completionRate: 45, lastSessionDate: '2026-03-20', status: 'active' },
  { id: 'P005', name: '林志華', age: 66, gender: '男', diagnosis: '右肩沾黏性關節囊炎', doctorId: 'D001', familyContact: '林佩玲', avatar: '林', admissionDate: '2026-02-18', completionRate: 78, lastSessionDate: '2026-03-24', status: 'active' },
  { id: 'P006', name: '郭美玲', age: 64, gender: '女', diagnosis: '左膝半月板術後恢復期', doctorId: 'D001', familyContact: '郭俊宏', avatar: '郭', admissionDate: '2026-02-25', completionRate: 69, lastSessionDate: '2026-03-23', status: 'active' },
  { id: 'P007', name: '吳建成', age: 73, gender: '男', diagnosis: '髖關節活動受限合併肌力不足', doctorId: 'D001', familyContact: '吳雅芬', avatar: '吳', admissionDate: '2026-03-03', completionRate: 58, lastSessionDate: '2026-03-22', status: 'active' },
  /** 示範：偏好台語衛教／語音陪練（處方見 RX022） */
  { id: 'P008', name: '蔡金枝', age: 78, gender: '女', diagnosis: '雙膝退化性關節炎（偏好台語溝通）', doctorId: 'D001', familyContact: '蔡志成', avatar: '蔡', admissionDate: '2026-03-20', completionRate: 0, lastSessionDate: '—', status: 'active' },
];

export const mockFamilyMembers: FamilyMember[] = [
  { id: 'F001', patientId: 'P001', name: '王小美', relation: '女兒', phone: '0912-345-678', avatar: '美' },
  { id: 'F002', patientId: 'P002', name: '李建國', relation: '兒子', phone: '0922-333-444', avatar: '國' }
];

/** 示範用統一訓練量：各動作相同組數／次數／保持秒，便於介面與處方對齊 */
const DEFAULT_REPS = 10;
const DEFAULT_SETS = 3;
const DEFAULT_HOLD_SEC = 3;

// ─── 偵測動作庫（供處方開立；長者端今日計畫：有效處方中腿部 2＋手部 2）────────
export const mockExercises: Exercise[] = [
  {
    id: 'knee_flexion',
    name: '膝蓋彎曲訓練',
    nameEn: 'Knee Flexion',
    category: '下肢',
    description: '測量髖-膝-踝角度，增強膝關節活動度。使用雅婷時可於訓練頁頂部切換國語／台語語音。',
    targetAngle: 110, restAngle: 170, tolerance: 10, joints: [23, 25, 27],
    reps: DEFAULT_REPS, sets: DEFAULT_SETS, holdSeconds: DEFAULT_HOLD_SEC, side: 'left',
    guidanceSteps: ['坐姿挺直', '腳跟滑向椅子', '保持三秒'],
    voicePrompts: {
      start: '慢慢彎就好，不用急',
      tooLow: '再彎進來一點',
      achieved: '好，停一下',
      complete: '好，這段先到這',
    },
    /** 雅婷陪練：語氣偏口語、句長適合 TTS（見教育部臺灣閩南語常用詞等參考） */
    voicePromptsTai: {
      start: '慢慢彎就好，莫急啦',
      tooLow: '閣彎入來一屑仔啦',
      achieved: '好，定咧',
      complete: '先做到遮啦',
      tooHigh: '收一屑仔啦，莫硬撐',
    },
    bodyArea: '膝蓋', difficulty: 'easy'
  },
  {
    id: 'knee_extension',
    name: '膝蓋伸膝訓練',
    nameEn: 'Knee Extension',
    category: '下肢',
    description: '坐姿將小腿伸直、強化股四頭肌終末角度',
    targetAngle: 165,
    restAngle: 140,
    tolerance: 10,
    joints: [23, 25, 27],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['坐穩椅面', '慢慢將膝蓋打直', '腳尖朝上保持'],
    voicePrompts: {
      start: '膝蓋慢慢打直，輕鬆就好',
      tooLow: '再伸一點',
      achieved: '行，停著',
      complete: '這段好了，歇一下',
    },
    bodyArea: '膝蓋',
    difficulty: 'easy',
  },
  {
    id: 'shoulder_abduction',
    name: '肩膀外展訓練',
    nameEn: 'Shoulder Abduction',
    category: '上肢',
    description: '測量髖-肩-肘角度，測試手臂平舉能力',
    targetAngle: 90, restAngle: 20, tolerance: 10, joints: [23, 11, 13],
    reps: DEFAULT_REPS, sets: DEFAULT_SETS, holdSeconds: DEFAULT_HOLD_SEC, side: 'left',
    guidanceSteps: ['手臂由側邊抬起', '與肩同高', '緩慢放下'],
    voicePrompts: {
      start: '手往旁邊舉，慢慢來',
      tooLow: '再高一點',
      achieved: '高度OK，停',
      complete: '外展先到這',
    },
    bodyArea: '肩膀', difficulty: 'medium'
  },
  {
    id: 'shoulder_flexion',
    name: '肩膀前舉訓練',
    nameEn: 'Shoulder Flexion',
    category: '上肢',
    description: '手臂由身體前方上舉，訓練肩屈曲與穩定度',
    targetAngle: 95,
    restAngle: 22,
    tolerance: 10,
    joints: [23, 11, 13],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['手臂靠身體', '向前上方舉起', '與肩同高即可'],
    voicePrompts: {
      start: '往前舉，別聳肩',
      tooLow: '還可以再高一點',
      achieved: '這樣就行，停',
      complete: '前舉結束',
    },
    bodyArea: '肩膀',
    difficulty: 'medium',
  },
  {
    id: 'elbow_flexion',
    name: '手肘彎曲訓練',
    nameEn: 'Elbow Flexion',
    category: '上肢',
    description: '強化二頭肌肌力',
    targetAngle: 130,
    restAngle: 30,
    tolerance: 8,
    joints: [11, 13, 15],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['上臂固定', '前臂向上彎曲'],
    voicePrompts: {
      start: '手肘彎起來，肩膀鬆的',
      tooLow: '再彎一點',
      achieved: '有了，停',
      complete: '彎曲這組結束',
    },
    bodyArea: '手肘',
    difficulty: 'easy',
  },
  {
    id: 'elbow_extension',
    name: '手肘伸展訓練',
    nameEn: 'Elbow Extension',
    category: '上肢',
    description: '將前臂伸直，強化肱三頭肌與肘關節伸展',
    targetAngle: 165,
    restAngle: 95,
    tolerance: 10,
    joints: [11, 13, 15],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['上臂貼身固定', '慢慢將手肘打直', '勿聳肩'],
    voicePrompts: {
      start: '手肘慢慢打直，呼吸照常',
      tooLow: '再直一點',
      achieved: 'OK，停一下',
      complete: '伸展做完',
    },
    bodyArea: '手肘',
    difficulty: 'easy',
  },
  {
    id: 'hip_abduction',
    name: '髖關節外展訓練',
    nameEn: 'Hip Abduction',
    category: '下肢',
    description: '強化步態穩定性',
    targetAngle: 35,
    restAngle: 5,
    tolerance: 5,
    joints: [24, 23, 25],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['腿部側向抬起', '骨盆保持水平'],
    voicePrompts: {
      start: '腿往旁邊抬，骨盆別跟著歪',
      tooLow: '再高一點',
      achieved: '穩，停',
      complete: '外展先到這',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
  {
    id: 'leg_raise',
    name: '直腿抬舉訓練',
    nameEn: 'Leg Raise',
    category: '下肢',
    description: '訓練核心與股四頭肌',
    targetAngle: 45,
    restAngle: 5,
    tolerance: 5,
    joints: [11, 23, 25],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['平躺於墊子上', '膝蓋伸直抬起'],
    voicePrompts: {
      start: '腿抬起來，膝蓋能直就直',
      tooLow: '再高一點',
      achieved: '對，停',
      complete: '抬腿這組結束',
    },
    bodyArea: '大腿',
    difficulty: 'medium',
  },
  {
    id: 'squat',
    name: '靠牆深蹲訓練',
    nameEn: 'Wall Squat',
    category: '下肢',
    description: '下蹲測量膝蓋彎曲，強化股四頭肌與下肢肌力',
    targetAngle: 100,
    restAngle: 170,
    tolerance: 10,
    joints: [23, 25, 27],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'bilateral',
    guidanceSteps: ['背部貼牆', '緩慢下蹲'],
    voicePrompts: {
      start: '背靠牆慢慢蹲，痛就別硬蹲',
      tooLow: '能再深一點就深一點',
      achieved: '這深度可以，停',
      complete: '深蹲這輪結束',
    },
    bodyArea: '大腿',
    difficulty: 'hard',
  },
  {
    id: 'side_leg_raise',
    name: '側面抬腿訓練',
    nameEn: 'Side Leg Raise',
    category: '下肢',
    description: '側臥強化中臀肌',
    targetAngle: 30,
    restAngle: 5,
    tolerance: 5,
    joints: [23, 24, 26],
    reps: DEFAULT_REPS,
    sets: DEFAULT_SETS,
    holdSeconds: DEFAULT_HOLD_SEC,
    side: 'left',
    guidanceSteps: ['身體側向一邊', '上方腿部抬起'],
    voicePrompts: {
      start: '側躺好，上面那條腿抬起來',
      tooLow: '再高一點',
      achieved: '行，停',
      complete: '側抬結束',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
  {
    id: 'shoulder_press_band',
    name: '彈力帶肩推',
    nameEn: 'Band Shoulder Press',
    category: '上肢',
    description: '物理治療師動作庫：彈力帶肩推，保守訓練肩上舉控制。',
    targetAngle: 155,
    restAngle: 90,
    tolerance: 12,
    joints: [23, 11, 13],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['彈力帶踩穩或固定', '手臂慢慢往上推', '不要聳肩或硬撐'],
    voicePrompts: {
      start: '手慢慢往上推，肩膀放鬆',
      tooLow: '再往上推一點',
      achieved: '高度到了，穩住',
      complete: '肩推完成，休息一下',
    },
    bodyArea: '肩膀',
    difficulty: 'medium',
  },
  {
    id: 'standing_row_band',
    name: '站姿彈力帶划船',
    nameEn: 'Standing Band Row',
    category: '上肢',
    description: '物理治療師動作庫：手肘往後拉，訓練肩胛與上背控制。',
    targetAngle: 115,
    restAngle: 170,
    tolerance: 12,
    joints: [11, 13, 15],
    reps: 12,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['身體站穩', '手肘往後拉', '肩胛輕輕夾住'],
    voicePrompts: {
      start: '手肘往後拉，身體不要晃',
      tooLow: '再拉近一點',
      achieved: '很好，肩胛夾住',
      complete: '划船這組完成',
    },
    bodyArea: '上背',
    difficulty: 'medium',
  },
  {
    id: 'seated_row_band',
    name: '坐姿彈力帶划船',
    nameEn: 'Seated Band Row',
    category: '上肢',
    description: '物理治療師動作庫：坐姿划船，適合平衡能力較弱者練上背。',
    targetAngle: 110,
    restAngle: 170,
    tolerance: 12,
    joints: [11, 13, 15],
    reps: 12,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['坐穩椅面', '彈力帶固定在腳掌或前方', '手肘往後拉'],
    voicePrompts: {
      start: '坐穩，手肘往後拉',
      tooLow: '再拉一點點',
      achieved: '位置很好，停住',
      complete: '坐姿划船完成',
    },
    bodyArea: '上背',
    difficulty: 'easy',
  },
  {
    id: 'push_up_supported',
    name: '扶牆伏地挺身',
    nameEn: 'Supported Push Up',
    category: '上肢',
    description: '物理治療師動作庫：以扶牆或高台版本取代地面伏地挺身，降低長者風險。',
    targetAngle: 95,
    restAngle: 165,
    tolerance: 12,
    joints: [11, 13, 15],
    reps: 8,
    sets: 2,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['雙手扶牆或穩固桌面', '手肘慢慢彎曲', '再慢慢推回'],
    voicePrompts: {
      start: '慢慢靠近牆面，手肘彎起來',
      tooLow: '不用太深，慢慢回一點',
      achieved: '深度剛好，穩住',
      complete: '推撐完成，休息一下',
    },
    bodyArea: '胸肩',
    difficulty: 'hard',
  },
  {
    id: 'biceps_curl_band',
    name: '彈力帶二頭肌彎舉',
    nameEn: 'Band Biceps Curl',
    category: '上肢',
    description: '物理治療師動作庫：固定上臂，手肘彎曲訓練二頭肌。',
    targetAngle: 135,
    restAngle: 30,
    tolerance: 10,
    joints: [11, 13, 15],
    reps: 12,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['上臂貼近身體', '前臂慢慢彎起', '不要甩動'],
    voicePrompts: {
      start: '上臂固定，手肘彎起來',
      tooLow: '再彎一點',
      achieved: '有了，穩住',
      complete: '彎舉完成',
    },
    bodyArea: '手肘',
    difficulty: 'easy',
  },
  {
    id: 'overhead_triceps_extension',
    name: '頸後臂屈伸',
    nameEn: 'Overhead Triceps Extension',
    category: '上肢',
    description: '物理治療師動作庫：手肘由彎曲慢慢伸直，訓練肱三頭肌。',
    targetAngle: 165,
    restAngle: 80,
    tolerance: 10,
    joints: [11, 13, 15],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['上臂盡量固定', '手肘慢慢伸直', '腹部收緊不要拱腰'],
    voicePrompts: {
      start: '手肘慢慢伸直，肩膀不要硬撐',
      tooLow: '再直一點',
      achieved: '很好，停住',
      complete: '肱三頭肌這組完成',
    },
    bodyArea: '手肘',
    difficulty: 'medium',
  },
  {
    id: 'shoulder_lateral_raise_band',
    name: '彈力帶肩側平舉',
    nameEn: 'Band Lateral Raise',
    category: '上肢',
    description: '物理治療師動作庫：手臂側抬到肩高，訓練肩部穩定。',
    targetAngle: 90,
    restAngle: 15,
    tolerance: 10,
    joints: [23, 11, 13],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['手臂由側邊抬起', '最高到肩膀高度', '不聳肩'],
    voicePrompts: {
      start: '手往旁邊抬，慢慢到肩膀高度',
      tooLow: '再高一點',
      achieved: '肩高就好，停住',
      complete: '側平舉完成',
    },
    bodyArea: '肩膀',
    difficulty: 'medium',
  },
  {
    id: 'seated_marching',
    name: '坐姿踏步',
    nameEn: 'Seated Marching',
    category: '下肢',
    description: '物理治療師動作庫：坐姿交替抬膝，練髖屈曲與循環暖身。',
    targetAngle: 70,
    restAngle: 95,
    tolerance: 10,
    joints: [11, 23, 25],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['坐在椅子後半部並挺胸', '單側膝蓋慢慢抬起', '放下後換邊或重複'],
    voicePrompts: {
      start: '坐穩，膝蓋慢慢抬起',
      tooLow: '再抬高一點',
      achieved: '很好，停一下',
      complete: '坐姿踏步完成',
    },
    bodyArea: '髖部',
    difficulty: 'easy',
  },
  {
    id: 'long_arc_quad',
    name: '坐姿膝伸直',
    nameEn: 'Long Arc Quad',
    category: '下肢',
    description: '物理治療師動作庫：坐姿小腿伸直，訓練股四頭肌。',
    targetAngle: 165,
    restAngle: 90,
    tolerance: 10,
    joints: [23, 25, 27],
    reps: 10,
    sets: 2,
    holdSeconds: 3,
    side: 'left',
    guidanceSteps: ['坐穩椅面', '小腿慢慢伸直', '大腿前側出力'],
    voicePrompts: {
      start: '腳慢慢伸直，不要用甩的',
      tooLow: '再伸直一點',
      achieved: '很好，停住',
      complete: '坐姿伸膝完成',
    },
    bodyArea: '膝蓋',
    difficulty: 'easy',
  },
  {
    id: 'sit_to_stand',
    name: '坐到站訓練',
    nameEn: 'Sit to Stand',
    category: '下肢',
    description: '物理治療師動作庫：從椅子站起再控制坐下，訓練日常轉位能力。',
    targetAngle: 165,
    restAngle: 90,
    tolerance: 12,
    joints: [23, 25, 27],
    reps: 8,
    sets: 2,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['椅子放穩', '腳收在膝蓋下方', '慢慢站起再坐下'],
    voicePrompts: {
      start: '腳踩穩，慢慢站起來',
      tooLow: '再站直一點',
      achieved: '站好了，穩一下',
      complete: '坐到站完成',
    },
    bodyArea: '功能性',
    difficulty: 'medium',
  },
  {
    id: 'band_squat',
    name: '彈力帶深蹲',
    nameEn: 'Band Squat',
    category: '下肢',
    description: '物理治療師動作庫：保守下蹲，訓練股四頭肌、臀肌與下肢控制。',
    targetAngle: 100,
    restAngle: 170,
    tolerance: 10,
    joints: [23, 25, 27],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['雙腳與肩同寬', '慢慢往後坐', '膝蓋方向對準腳尖'],
    voicePrompts: {
      start: '慢慢蹲，膝蓋對準腳尖',
      tooLow: '蹲太深了，站高一點',
      achieved: '深度剛好，停住',
      complete: '彈力帶深蹲完成',
    },
    bodyArea: '大腿',
    difficulty: 'hard',
  },
  {
    id: 'split_squat_band',
    name: '彈力帶弓箭步下蹲',
    nameEn: 'Band Split Squat',
    category: '下肢',
    description: '物理治療師動作庫：前後腳分站下蹲，訓練單側下肢控制。',
    targetAngle: 100,
    restAngle: 170,
    tolerance: 12,
    joints: [23, 25, 27],
    reps: 8,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['前後腳站穩', '可扶椅保持平衡', '前膝慢慢彎曲'],
    voicePrompts: {
      start: '前腳踩穩，慢慢往下',
      tooLow: '太深了，先回來一點',
      achieved: '很好，停住',
      complete: '弓箭步完成',
    },
    bodyArea: '大腿',
    difficulty: 'hard',
  },
  {
    id: 'standing_hip_abduction_band',
    name: '站姿彈力帶側抬腿',
    nameEn: 'Standing Band Hip Abduction',
    category: '下肢',
    description: '物理治療師動作庫：扶椅側抬腿，訓練臀中肌與骨盆穩定。',
    targetAngle: 35,
    restAngle: 5,
    tolerance: 6,
    joints: [24, 23, 25],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['手扶椅背站穩', '腿往側邊慢慢抬', '骨盆不要歪'],
    voicePrompts: {
      start: '扶穩，腳往旁邊抬',
      tooLow: '再往外一點',
      achieved: '很好，骨盆穩住',
      complete: '站姿側抬腿完成',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
  {
    id: 'hip_adduction_band',
    name: '站姿髖內收',
    nameEn: 'Standing Band Hip Adduction',
    category: '下肢',
    description: '物理治療師動作庫：腿往身體中線內收，訓練大腿內側控制。',
    targetAngle: 18,
    restAngle: 35,
    tolerance: 6,
    joints: [24, 23, 25],
    reps: 12,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['扶穩椅背', '腿由外側往身體中線收回', '骨盆保持正面'],
    voicePrompts: {
      start: '腳慢慢往身體中線收回',
      tooLow: '再往內收一點',
      achieved: '很好，停一下',
      complete: '髖內收完成',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
  {
    id: 'standing_hip_extension_band',
    name: '站姿髖後伸',
    nameEn: 'Standing Band Hip Extension',
    category: '下肢',
    description: '物理治療師動作庫：將原稿快速踢改為慢速後伸，訓練臀大肌更安全。',
    targetAngle: 25,
    restAngle: 5,
    tolerance: 6,
    joints: [11, 23, 25],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['扶椅站穩', '腿向後慢慢伸', '身體不要前傾'],
    voicePrompts: {
      start: '腳慢慢往後伸，不要用踢的',
      tooLow: '再往後一點',
      achieved: '很好，停住',
      complete: '髖後伸完成',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
  {
    id: 'standing_hip_flexion_band',
    name: '站姿髖屈曲前抬',
    nameEn: 'Standing Band Hip Flexion',
    category: '下肢',
    description: '物理治療師動作庫：站姿扶椅前抬腿，訓練髖屈肌與平衡。',
    targetAngle: 45,
    restAngle: 5,
    tolerance: 7,
    joints: [11, 23, 25],
    reps: 10,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['扶椅站穩', '膝蓋伸直或微彎', '腿往前慢慢抬'],
    voicePrompts: {
      start: '扶穩，腿往前抬',
      tooLow: '再抬高一點',
      achieved: '很好，停住',
      complete: '髖屈曲前抬完成',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
  {
    id: 'terminal_knee_extension_band',
    name: '終端膝伸直訓練',
    nameEn: 'Terminal Knee Extension',
    category: '下肢',
    description: '物理治療師動作庫：由微彎膝慢慢伸直，訓練膝末端控制。',
    targetAngle: 165,
    restAngle: 145,
    tolerance: 8,
    joints: [23, 25, 27],
    reps: 15,
    sets: 2,
    holdSeconds: 2,
    side: 'left',
    guidanceSteps: ['彈力帶固定在膝後', '膝蓋由微彎慢慢打直', '大腿前側出力'],
    voicePrompts: {
      start: '膝蓋慢慢打直，不要鎖死',
      tooLow: '再伸直一點',
      achieved: '很好，停兩秒',
      complete: '終端伸膝完成',
    },
    bodyArea: '膝蓋',
    difficulty: 'easy',
  },
  {
    id: 'hip_bridge',
    name: '橋式訓練',
    nameEn: 'Hip Bridge',
    category: '核心',
    description: '物理治療師動作庫：仰躺抬骨盆，訓練臀肌與核心穩定。',
    targetAngle: 165,
    restAngle: 95,
    tolerance: 12,
    joints: [11, 23, 25],
    reps: 10,
    sets: 2,
    holdSeconds: 3,
    side: 'bilateral',
    guidanceSteps: ['仰躺屈膝踩地', '夾臀慢慢抬骨盆', '肩到膝接近一直線'],
    voicePrompts: {
      start: '夾臀，骨盆慢慢抬起',
      tooLow: '再抬高一點',
      achieved: '很好，停住',
      complete: '橋式完成',
    },
    bodyArea: '臀腿/核心',
    difficulty: 'medium',
  },
  {
    id: 'shoulder_blade_squeeze',
    name: '肩胛骨夾背',
    nameEn: 'Shoulder Blade Squeeze',
    category: '上肢',
    description: '物理治療師動作庫：肩胛後收等長訓練，使用引導式回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [11, 12, 24],
    reps: 15,
    sets: 2,
    holdSeconds: 5,
    side: 'bilateral',
    guidanceSteps: ['坐直或站直', '肩胛往後輕輕夾住', '不要聳肩'],
    voicePrompts: {
      start: '肩胛慢慢夾住，肩膀不要聳',
      tooLow: '保持就好，不用用力過猛',
      achieved: '很好，穩住',
      complete: '肩胛夾背完成',
    },
    bodyArea: '肩胛/上背',
    difficulty: 'easy',
    trackingMode: 'timed',
  },
  {
    id: 'chin_tuck',
    name: '下巴內縮',
    nameEn: 'Chin Tuck',
    category: '頸部',
    description: '物理治療師動作庫：坐姿下巴水平後收，使用引導式計時模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [0, 1, 2],
    reps: 10,
    sets: 1,
    holdSeconds: 5,
    side: 'bilateral',
    guidanceSteps: ['坐直看前方', '下巴水平往後收', '不要低頭或仰頭'],
    voicePrompts: {
      start: '下巴往後收，像做雙下巴',
      tooLow: '不要低頭，保持看前方',
      achieved: '很好，停住',
      complete: '下巴內縮完成',
    },
    bodyArea: '頸椎',
    difficulty: 'easy',
    trackingMode: 'timed',
  },
  {
    id: 'neck_rotation',
    name: '頸部旋轉',
    nameEn: 'Neck Rotation',
    category: '頸部',
    description: '物理治療師動作庫：坐姿左右緩慢轉頭，使用人工回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [0, 1, 2],
    reps: 10,
    sets: 1,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['坐直挺胸', '頭慢慢轉向一側', '回正後換邊'],
    voicePrompts: {
      start: '頭慢慢轉，不要甩',
      tooLow: '做到舒服範圍就好',
      achieved: '很好，慢慢回正',
      complete: '頸部旋轉完成',
    },
    bodyArea: '頸椎',
    difficulty: 'easy',
    trackingMode: 'manual',
  },
  {
    id: 'neck_side_stretch',
    name: '頸部側彎伸展',
    nameEn: 'Neck Side Stretch',
    category: '頸部',
    description: '物理治療師動作庫：耳朵朝肩膀方向輕柔側傾，使用引導式計時模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [0, 1, 2],
    reps: 3,
    sets: 1,
    holdSeconds: 15,
    side: 'bilateral',
    guidanceSteps: ['坐直並放鬆肩膀', '耳朵慢慢靠向肩膀', '感覺拉緊即可'],
    voicePrompts: {
      start: '頭慢慢側彎，肩膀不要聳',
      tooLow: '舒服拉緊就好',
      achieved: '很好，保持呼吸',
      complete: '頸部伸展完成',
    },
    bodyArea: '頸椎',
    difficulty: 'easy',
    trackingMode: 'timed',
  },
  {
    id: 'ankle_inversion_band',
    name: '坐姿踝內翻',
    nameEn: 'Seated Ankle Inversion',
    category: '踝足',
    description: '物理治療師動作庫：彈力帶踝內翻，使用人工回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [25, 27, 31],
    reps: 12,
    sets: 2,
    holdSeconds: 1,
    side: 'left',
    guidanceSteps: ['坐穩並固定彈力帶', '腳掌慢慢往內轉', '小腿不要跟著轉'],
    voicePrompts: {
      start: '腳掌慢慢往內轉',
      tooLow: '做到舒服範圍就好',
      achieved: '很好，慢慢回來',
      complete: '踝內翻完成',
    },
    bodyArea: '踝',
    difficulty: 'easy',
    trackingMode: 'manual',
  },
  {
    id: 'ankle_eversion_band',
    name: '坐姿踝外翻',
    nameEn: 'Seated Ankle Eversion',
    category: '踝足',
    description: '物理治療師動作庫：彈力帶踝外翻，使用人工回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [25, 27, 31],
    reps: 12,
    sets: 2,
    holdSeconds: 1,
    side: 'left',
    guidanceSteps: ['坐穩並固定彈力帶', '腳掌慢慢往外轉', '小腿保持穩定'],
    voicePrompts: {
      start: '腳掌慢慢往外轉',
      tooLow: '做到舒服範圍就好',
      achieved: '很好，慢慢回來',
      complete: '踝外翻完成',
    },
    bodyArea: '踝',
    difficulty: 'easy',
    trackingMode: 'manual',
  },
  {
    id: 'pelvic_tilt',
    name: '骨盆前後傾',
    nameEn: 'Pelvic Tilt',
    category: '核心',
    description: '物理治療師動作庫：坐姿或躺姿骨盆控制，使用人工回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [11, 23, 25],
    reps: 15,
    sets: 1,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['坐姿或仰躺屈膝', '骨盆慢慢前後滾動', '動作小而可控制'],
    voicePrompts: {
      start: '骨盆慢慢前後動',
      tooLow: '動作小也可以',
      achieved: '很好，保持控制',
      complete: '骨盆傾斜完成',
    },
    bodyArea: '腰背',
    difficulty: 'easy',
    trackingMode: 'manual',
  },
  {
    id: 'seated_cat_cow',
    name: '坐姿貓牛式',
    nameEn: 'Seated Cat Cow',
    category: '核心',
    description: '物理治療師動作庫：坐姿脊椎屈伸活動，使用人工回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [11, 23, 25],
    reps: 10,
    sets: 1,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['坐穩雙手放膝蓋', '吸氣挺胸', '吐氣微微圓背'],
    voicePrompts: {
      start: '吸氣挺胸，吐氣圓背',
      tooLow: '慢慢動就好',
      achieved: '很好，呼吸跟上',
      complete: '坐姿貓牛式完成',
    },
    bodyArea: '腰背',
    difficulty: 'easy',
    trackingMode: 'manual',
  },
  {
    id: 'seated_trunk_rotation',
    name: '坐姿轉體',
    nameEn: 'Seated Trunk Rotation',
    category: '核心',
    description: '物理治療師動作庫：坐姿胸口左右旋轉，使用人工回報模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [11, 23, 24],
    reps: 10,
    sets: 1,
    holdSeconds: 2,
    side: 'bilateral',
    guidanceSteps: ['坐穩雙腳踩地', '骨盆不要跟著轉', '胸口慢慢左右轉'],
    voicePrompts: {
      start: '胸口慢慢轉，骨盆固定',
      tooLow: '舒服範圍就好',
      achieved: '很好，慢慢回正',
      complete: '坐姿轉體完成',
    },
    bodyArea: '胸椎',
    difficulty: 'easy',
    trackingMode: 'manual',
  },
  {
    id: 'glute_squeeze',
    name: '臀部夾緊運動',
    nameEn: 'Glute Squeeze',
    category: '下肢',
    description: '物理治療師動作庫：臀肌等長收縮，使用引導式計時模式。',
    targetAngle: 0,
    restAngle: 0,
    tolerance: 0,
    joints: [23, 24, 25],
    reps: 10,
    sets: 1,
    holdSeconds: 5,
    side: 'bilateral',
    guidanceSteps: ['坐姿、趴姿或仰躺皆可', '兩側臀部輕輕夾緊', '維持後放鬆'],
    voicePrompts: {
      start: '臀部輕輕夾緊',
      tooLow: '不用憋氣，穩穩出力',
      achieved: '很好，停住',
      complete: '臀部夾緊完成',
    },
    bodyArea: '臀部',
    difficulty: 'easy',
    trackingMode: 'timed',
  },
];

/** 處方示範：各項目統一 10 次 × 3 組、保持 3 秒、每天兩次（僅目標角度／備註依個案調整） */
const RX_REPS = DEFAULT_REPS;
const RX_SETS = DEFAULT_SETS;
const RX_HOLD = DEFAULT_HOLD_SEC;
const RX_FREQ = '每天兩次';

// ─── 詳細處方設定 ────────────────────────────────────────────
export const mockPrescriptions: Prescription[] = [
  { id: 'RX001', patientId: 'P001', doctorId: 'D001', exerciseId: 'knee_flexion', targetAngle: 110, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '術後第六週，穩定性增加中', startDate: '2026-02-15', endDate: '2026-04-15', active: true },
  { id: 'RX002', patientId: 'P001', doctorId: 'D001', exerciseId: 'leg_raise', targetAngle: 45, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '防止肌肉萎縮', startDate: '2026-02-15', endDate: '2026-04-15', active: true },
  { id: 'RX003', patientId: 'P001', doctorId: 'D001', exerciseId: 'squat', targetAngle: 90, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '靠牆進行（暫停，可於醫師端啟用）', startDate: '2026-03-10', endDate: '2026-04-10', active: false },
  { id: 'RX014', patientId: 'P001', doctorId: 'D001', exerciseId: 'hip_abduction', targetAngle: 35, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '骨盆保持水平（暫停）', startDate: '2026-02-15', endDate: '2026-04-15', active: false },
  { id: 'RX015', patientId: 'P001', doctorId: 'D001', exerciseId: 'side_leg_raise', targetAngle: 30, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '強化中臀肌（暫停）', startDate: '2026-02-15', endDate: '2026-04-15', active: false },
  { id: 'RX016', patientId: 'P001', doctorId: 'D001', exerciseId: 'shoulder_abduction', targetAngle: 90, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '肩外展，與肘彎曲同為上肢主項目', startDate: '2026-02-15', endDate: '2026-04-15', active: true },
  { id: 'RX017', patientId: 'P001', doctorId: 'D001', exerciseId: 'elbow_flexion', targetAngle: 130, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '可視情況搭配 0.5kg 啞鈴', startDate: '2026-02-15', endDate: '2026-04-15', active: true },
  { id: 'RX018', patientId: 'P001', doctorId: 'D001', exerciseId: 'knee_extension', targetAngle: 165, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '伸膝（暫停）', startDate: '2026-02-15', endDate: '2026-04-15', active: false },
  { id: 'RX019', patientId: 'P001', doctorId: 'D001', exerciseId: 'elbow_extension', targetAngle: 160, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '肘伸展（暫停）', startDate: '2026-02-15', endDate: '2026-04-15', active: false },
  { id: 'RX020', patientId: 'P001', doctorId: 'D001', exerciseId: 'shoulder_flexion', targetAngle: 95, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '肩前舉（暫停）', startDate: '2026-02-15', endDate: '2026-04-15', active: false },
  { id: 'RX023', patientId: 'P001', doctorId: 'D001', exerciseId: 'chin_tuck', targetAngle: 0, reps: 10, sets: 1, holdSeconds: 5, difficultyLevel: 2, trackingMode: 'timed', frequency: RX_FREQ, notes: '引導式復健示範：頸部細部動作不使用鏡頭角度，改以圖示計時與頭暈/麻痛回報追蹤。', startDate: '2026-05-21', endDate: '2026-12-31', active: true },
  { id: 'RX004', patientId: 'P002', doctorId: 'D001', exerciseId: 'shoulder_abduction', targetAngle: 90, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '避免聳肩', startDate: '2026-02-20', endDate: '2026-05-01', active: true },
  { id: 'RX005', patientId: 'P002', doctorId: 'D001', exerciseId: 'elbow_flexion', targetAngle: 130, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '搭配 0.5kg 啞鈴', startDate: '2026-02-20', endDate: '2026-05-01', active: true },
  { id: 'RX006', patientId: 'P003', doctorId: 'D002', exerciseId: 'elbow_flexion', targetAngle: 110, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '誘發上肢動作', startDate: '2026-01-10', endDate: '2026-06-10', active: true },
  { id: 'RX007', patientId: 'P003', doctorId: 'D002', exerciseId: 'leg_raise', targetAngle: 30, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '控制力訓練', startDate: '2026-01-10', endDate: '2026-06-10', active: true },
  { id: 'RX008', patientId: 'P003', doctorId: 'D002', exerciseId: 'hip_abduction', targetAngle: 20, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '改善平衡', startDate: '2026-02-01', endDate: '2026-06-10', active: true },
  { id: 'RX009', patientId: 'P004', doctorId: 'D001', exerciseId: 'hip_abduction', targetAngle: 30, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '全髖置換後訓練', startDate: '2026-03-05', endDate: '2026-06-05', active: true },
  { id: 'RX010', patientId: 'P004', doctorId: 'D001', exerciseId: 'side_leg_raise', targetAngle: 25, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '強化中臀肌', startDate: '2026-03-05', endDate: '2026-06-05', active: true },
  { id: 'RX011', patientId: 'P005', doctorId: 'D001', exerciseId: 'shoulder_abduction', targetAngle: 95, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '避免代償聳肩', startDate: '2026-02-20', endDate: '2026-05-20', active: true },
  { id: 'RX012', patientId: 'P006', doctorId: 'D001', exerciseId: 'knee_flexion', targetAngle: 105, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '術後需注意疼痛回報', startDate: '2026-03-01', endDate: '2026-06-01', active: true },
  { id: 'RX013', patientId: 'P007', doctorId: 'D001', exerciseId: 'hip_abduction', targetAngle: 28, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '先穩定平衡再提高角度', startDate: '2026-03-05', endDate: '2026-06-05', active: true },
  { id: 'RX022', patientId: 'P008', doctorId: 'D001', exerciseId: 'knee_flexion', targetAngle: 105, reps: RX_REPS, sets: RX_SETS, holdSeconds: RX_HOLD, frequency: RX_FREQ, notes: '蔡金枝：偏好台語溝通；訓練頁頂部可切換語音', startDate: '2026-03-20', endDate: '2026-06-20', active: true },
];

// ─── 多維度專業統計數據 (Advanced Analytics) ───────────────────
export const mockAnalyticsComparison = [
  { patientId: 'P001', name: '王大明', avgDuration: 28, completionRate: 85, accuracy: 94, improvement: '+12%', trend: 'up' },
  { patientId: 'P002', name: '李秀英', avgDuration: 18, completionRate: 72, accuracy: 88, improvement: '+5%', trend: 'up' },
  { patientId: 'P003', name: '張福壽', avgDuration: 42, completionRate: 60, accuracy: 65, improvement: '+2%', trend: 'stable' },
  { patientId: 'P004', name: '陳阿蘭', avgDuration: 12, completionRate: 45, accuracy: 72, improvement: '-3%', trend: 'down' },
];

export const mockCategoryStats = [
  { category: '下肢', avgCompletion: 78, avgDuration: 15.5, dropRate: 4.2 },
  { category: '上肢', avgCompletion: 82, avgDuration: 12.0, dropRate: 6.8 },
  { category: '核心', avgCompletion: 55, avgDuration: 24.5, dropRate: 22.0 },
];

export const mockSystemStats = {
  totalPatients: 4, activeToday: 4, avgCompletionRate: 68.4,
  totalSessions: 312, avgScore: 82.5, improvementRate: 15.8, avgDailyTime: 32.5
};

export const mockWeeklyActivity = [
  { day: '週一', sessions: 4, duration: 65, completion: 70 },
  { day: '週二', sessions: 5, duration: 80, completion: 82 },
  { day: '週三', sessions: 3, duration: 45, completion: 78 },
  { day: '週四', sessions: 6, duration: 95, completion: 85 },
  { day: '週五', sessions: 4, duration: 60, completion: 88 },
  { day: '週六', sessions: 2, duration: 30, completion: 90 },
  { day: '週日', sessions: 0, duration: 0, completion: 0 },
];

export const mockAlertStats = {
  insufficientAngle: 158, excessiveSpeed: 45, postureDistortion: 32, targetReached: 840
};

// ─── 歷史記錄、通知與進度數據 ──────────────────────────────────
export const mockSessionRecords: SessionRecord[] = [
  // Demo records for the current competition walkthrough week.
  // These cover today ranking, weekly ranking, personal best, badges, and AI difficulty cases.
  { id: 'SD001', patientId: 'P001', exerciseId: 'knee_flexion', date: '2026-05-10', duration: 22, completedSets: 3, completedReps: 12, avgAngle: 111, maxAngle: 116, targetAngle: 110, score: 94, voiceFeedbackCount: 5 },
  { id: 'SD002', patientId: 'P001', exerciseId: 'knee_flexion', date: '2026-05-09', duration: 21, completedSets: 3, completedReps: 12, avgAngle: 109, maxAngle: 115, targetAngle: 110, score: 93, voiceFeedbackCount: 6 },
  { id: 'SD003', patientId: 'P001', exerciseId: 'knee_flexion', date: '2026-05-08', duration: 23, completedSets: 3, completedReps: 12, avgAngle: 112, maxAngle: 117, targetAngle: 110, score: 91, voiceFeedbackCount: 7 },
  { id: 'SD004', patientId: 'P001', exerciseId: 'leg_raise', date: '2026-05-10', duration: 17, completedSets: 3, completedReps: 10, avgAngle: 41, maxAngle: 47, targetAngle: 45, score: 82, voiceFeedbackCount: 10 },
  { id: 'SD005', patientId: 'P001', exerciseId: 'leg_raise', date: '2026-05-08', duration: 18, completedSets: 3, completedReps: 10, avgAngle: 42, maxAngle: 48, targetAngle: 45, score: 84, voiceFeedbackCount: 9 },
  { id: 'SD006', patientId: 'P001', exerciseId: 'leg_raise', date: '2026-05-07', duration: 17, completedSets: 3, completedReps: 10, avgAngle: 40, maxAngle: 46, targetAngle: 45, score: 81, voiceFeedbackCount: 11 },
  { id: 'SD007', patientId: 'P001', exerciseId: 'shoulder_abduction', date: '2026-05-09', duration: 14, completedSets: 2, completedReps: 6, avgAngle: 71, maxAngle: 82, targetAngle: 90, score: 64, voiceFeedbackCount: 16 },
  { id: 'SD008', patientId: 'P001', exerciseId: 'shoulder_abduction', date: '2026-05-08', duration: 15, completedSets: 2, completedReps: 7, avgAngle: 74, maxAngle: 85, targetAngle: 90, score: 68, voiceFeedbackCount: 15 },
  { id: 'SD009', patientId: 'P001', exerciseId: 'shoulder_abduction', date: '2026-05-06', duration: 13, completedSets: 2, completedReps: 6, avgAngle: 70, maxAngle: 81, targetAngle: 90, score: 66, voiceFeedbackCount: 17 },
  { id: 'SD010', patientId: 'P001', exerciseId: 'elbow_flexion', date: '2026-05-03', duration: 16, completedSets: 3, completedReps: 10, avgAngle: 127, maxAngle: 132, targetAngle: 130, score: 88, voiceFeedbackCount: 8 },
  { id: 'SD011', patientId: 'P001', exerciseId: 'hip_abduction', date: '2026-05-05', duration: 15, completedSets: 3, completedReps: 10, avgAngle: 34, maxAngle: 38, targetAngle: 35, score: 89, voiceFeedbackCount: 8 },
  { id: 'SD012', patientId: 'P001', exerciseId: 'side_leg_raise', date: '2026-05-04', duration: 14, completedSets: 3, completedReps: 10, avgAngle: 29, maxAngle: 33, targetAngle: 30, score: 87, voiceFeedbackCount: 9 },

  { id: 'SD101', patientId: 'P002', exerciseId: 'shoulder_abduction', date: '2026-05-10', duration: 18, completedSets: 3, completedReps: 12, avgAngle: 92, maxAngle: 99, targetAngle: 90, score: 96, voiceFeedbackCount: 5 },
  { id: 'SD102', patientId: 'P002', exerciseId: 'elbow_flexion', date: '2026-05-09', duration: 16, completedSets: 3, completedReps: 12, avgAngle: 129, maxAngle: 134, targetAngle: 130, score: 94, voiceFeedbackCount: 6 },
  { id: 'SD103', patientId: 'P002', exerciseId: 'shoulder_abduction', date: '2026-05-08', duration: 17, completedSets: 3, completedReps: 12, avgAngle: 89, maxAngle: 96, targetAngle: 90, score: 92, voiceFeedbackCount: 6 },

  { id: 'SD201', patientId: 'P003', exerciseId: 'elbow_flexion', date: '2026-05-09', duration: 20, completedSets: 2, completedReps: 8, avgAngle: 102, maxAngle: 112, targetAngle: 110, score: 74, voiceFeedbackCount: 12 },
  { id: 'SD202', patientId: 'P003', exerciseId: 'leg_raise', date: '2026-05-07', duration: 19, completedSets: 2, completedReps: 8, avgAngle: 27, maxAngle: 34, targetAngle: 30, score: 78, voiceFeedbackCount: 10 },

  { id: 'SD301', patientId: 'P004', exerciseId: 'hip_abduction', date: '2026-05-10', duration: 13, completedSets: 1, completedReps: 5, avgAngle: 19, maxAngle: 27, targetAngle: 30, score: 58, voiceFeedbackCount: 18 },
  { id: 'SD302', patientId: 'P004', exerciseId: 'side_leg_raise', date: '2026-05-08', duration: 12, completedSets: 1, completedReps: 5, avgAngle: 15, maxAngle: 22, targetAngle: 25, score: 61, voiceFeedbackCount: 16 },

  { id: 'SD401', patientId: 'P005', exerciseId: 'shoulder_abduction', date: '2026-05-10', duration: 21, completedSets: 3, completedReps: 12, avgAngle: 94, maxAngle: 101, targetAngle: 95, score: 91, voiceFeedbackCount: 8 },
  { id: 'SD402', patientId: 'P005', exerciseId: 'shoulder_abduction', date: '2026-05-09', duration: 20, completedSets: 3, completedReps: 12, avgAngle: 93, maxAngle: 100, targetAngle: 95, score: 90, voiceFeedbackCount: 8 },
  { id: 'SD403', patientId: 'P005', exerciseId: 'shoulder_abduction', date: '2026-05-06', duration: 19, completedSets: 3, completedReps: 12, avgAngle: 91, maxAngle: 98, targetAngle: 95, score: 88, voiceFeedbackCount: 9 },

  { id: 'SD501', patientId: 'P006', exerciseId: 'knee_flexion', date: '2026-05-10', duration: 19, completedSets: 3, completedReps: 9, avgAngle: 101, maxAngle: 109, targetAngle: 105, score: 79, voiceFeedbackCount: 12 },
  { id: 'SD502', patientId: 'P006', exerciseId: 'knee_flexion', date: '2026-05-08', duration: 20, completedSets: 3, completedReps: 9, avgAngle: 100, maxAngle: 107, targetAngle: 105, score: 81, voiceFeedbackCount: 11 },

  { id: 'SD601', patientId: 'P007', exerciseId: 'hip_abduction', date: '2026-05-10', duration: 18, completedSets: 2, completedReps: 7, avgAngle: 68, maxAngle: 77, targetAngle: 90, score: 69, voiceFeedbackCount: 14 },
  { id: 'SD602', patientId: 'P007', exerciseId: 'hip_abduction', date: '2026-05-07', duration: 17, completedSets: 2, completedReps: 7, avgAngle: 66, maxAngle: 75, targetAngle: 90, score: 67, voiceFeedbackCount: 15 },

  { id: 'SD701', patientId: 'P008', exerciseId: 'knee_flexion', date: '2026-05-10', duration: 9, completedSets: 1, completedReps: 4, avgAngle: 92, maxAngle: 101, targetAngle: 105, score: 72, voiceFeedbackCount: 13 },
  { id: 'S001', patientId: 'P001', exerciseId: 'knee_flexion', date: '2026-03-24', duration: 25, completedSets: 3, completedReps: 10, avgAngle: 108, maxAngle: 115, targetAngle: 110, score: 92, voiceFeedbackCount: 8 },
  { id: 'S007', patientId: 'P001', exerciseId: 'leg_raise', date: '2026-03-23', duration: 18, completedSets: 3, completedReps: 10, avgAngle: 41, maxAngle: 47, targetAngle: 45, score: 86, voiceFeedbackCount: 7 },
  { id: 'S008', patientId: 'P001', exerciseId: 'squat', date: '2026-03-22', duration: 16, completedSets: 3, completedReps: 10, avgAngle: 93, maxAngle: 101, targetAngle: 90, score: 84, voiceFeedbackCount: 9 },
  { id: 'S009', patientId: 'P001', exerciseId: 'knee_flexion', date: '2026-03-21', duration: 24, completedSets: 3, completedReps: 10, avgAngle: 104, maxAngle: 112, targetAngle: 110, score: 88, voiceFeedbackCount: 8 },
  { id: 'S010', patientId: 'P001', exerciseId: 'hip_abduction', date: '2026-03-20', duration: 17, completedSets: 3, completedReps: 10, avgAngle: 31, maxAngle: 37, targetAngle: 35, score: 82, voiceFeedbackCount: 10 },
  { id: 'S011', patientId: 'P001', exerciseId: 'side_leg_raise', date: '2026-03-19', duration: 15, completedSets: 3, completedReps: 10, avgAngle: 26, maxAngle: 31, targetAngle: 30, score: 80, voiceFeedbackCount: 9 },
  { id: 'S012', patientId: 'P001', exerciseId: 'leg_raise', date: '2026-03-18', duration: 19, completedSets: 3, completedReps: 10, avgAngle: 40, maxAngle: 46, targetAngle: 45, score: 85, voiceFeedbackCount: 8 },
  { id: 'S013', patientId: 'P001', exerciseId: 'knee_flexion', date: '2026-03-17', duration: 23, completedSets: 3, completedReps: 10, avgAngle: 101, maxAngle: 109, targetAngle: 110, score: 83, voiceFeedbackCount: 11 },
  { id: 'S014', patientId: 'P001', exerciseId: 'squat', date: '2026-03-16', duration: 14, completedSets: 3, completedReps: 10, avgAngle: 90, maxAngle: 98, targetAngle: 90, score: 79, voiceFeedbackCount: 12 },
  { id: 'S015', patientId: 'P001', exerciseId: 'hip_abduction', date: '2026-03-15', duration: 16, completedSets: 3, completedReps: 10, avgAngle: 29, maxAngle: 34, targetAngle: 35, score: 78, voiceFeedbackCount: 10 },
  { id: 'S002', patientId: 'P002', exerciseId: 'shoulder_abduction', date: '2026-03-22', duration: 18, completedSets: 3, completedReps: 12, avgAngle: 84, maxAngle: 91, targetAngle: 90, score: 83, voiceFeedbackCount: 10 },
  { id: 'S003', patientId: 'P004', exerciseId: 'hip_abduction', date: '2026-03-20', duration: 20, completedSets: 2, completedReps: 8, avgAngle: 62, maxAngle: 72, targetAngle: 90, score: 61, voiceFeedbackCount: 14 },
  { id: 'S004', patientId: 'P005', exerciseId: 'shoulder_abduction', date: '2026-03-24', duration: 22, completedSets: 3, completedReps: 12, avgAngle: 92, maxAngle: 100, targetAngle: 95, score: 87, voiceFeedbackCount: 9 },
  { id: 'S005', patientId: 'P006', exerciseId: 'knee_flexion', date: '2026-03-23', duration: 21, completedSets: 3, completedReps: 9, avgAngle: 99, maxAngle: 108, targetAngle: 105, score: 79, voiceFeedbackCount: 11 },
  { id: 'S006', patientId: 'P007', exerciseId: 'hip_abduction', date: '2026-03-22', duration: 19, completedSets: 2, completedReps: 7, avgAngle: 70, maxAngle: 79, targetAngle: 90, score: 68, voiceFeedbackCount: 13 }
];

export const mockNotifications = [
  { id: 'N001', type: 'success', title: '今日訓練完成', message: '王大明 已完成膝蓋彎曲訓練', time: '14:32', read: false },
  { id: 'N002', type: 'warning', title: '訓練進度落後', message: '陳阿蘭 本週目標完成率僅 45%', time: '10:15', read: false },
  { id: 'N003', type: 'info', title: '新處方建立', message: '林醫師 已為 張福壽 新增手肘訓練', time: '09:00', read: true },
  { id: 'N004', type: 'success', title: '昨日表現良好', message: '王大明 昨日訓練平均得分 86 分，高於上週平均。', time: '08:40', read: false },
  { id: 'N005', type: 'info', title: '示範影片更新', message: '陳醫師上傳「直腿抬舉」新版示範，建議陪長輩一起看一次。', time: '昨天 17:20', read: false },
  { id: 'N006', type: 'warning', title: '今日第二次未完成', message: '王大明 尚缺 1 次今日預定訓練，可協助提醒暖身與時間。', time: '昨天 21:05', read: true },
  { id: 'N007', type: 'info', title: '家屬留言已讀', message: '您傳給陳醫師的訊息已讀，醫師建議維持每天兩次頻率。', time: '昨天 15:30', read: true },
  { id: 'N008', type: 'success', title: '角度進步', message: '王大明 髖關節外展本週達標率 92%，較上週提升 8%。', time: '3/24', read: true },
  { id: 'N009', type: 'info', title: '回診倒數', message: '王大明 與陳醫師視訊回診將於 3/26（三）10:30 舉行。', time: '3/23', read: false },
  { id: 'N010', type: 'success', title: '連續訓練紀錄', message: '王大明 已連續 7 天完成至少 1 次訓練，可給予鼓勵！', time: '3/22', read: true },
  { id: 'N011', type: 'info', title: '治療師提醒', message: '黃治療師：若抬腿時臀部痠痛明顯，可將保持時間暫降為 2 秒。', time: '3/21', read: true },
  { id: 'N012', type: 'warning', title: '裝置電量偏低', message: '王大明 上次同步時平板電量 18%，建議充電後再開始長時間訓練。', time: '3/20', read: true },
];

export const mockAngleProgress = [
  { date: '3/18', angle: 92, target: 110 }, { date: '3/19', angle: 96, target: 110 }, { date: '3/20', angle: 100, target: 110 },
  { date: '3/21', angle: 105, target: 110 }, { date: '3/22', angle: 110, target: 110 }, { date: '3/23', angle: 115, target: 110 },
  { date: '3/24', angle: 118, target: 110 },
];

// 🌟 新增：跨角色即時通訊系統留言板 (Messages)
export const mockMessages: Message[] = [
  { id: 'M001', senderId: 'D001', receiverId: 'P001', senderRole: 'doctor', content: '大明叔叔，這週的深蹲角度有進步喔！繼續保持。', timestamp: '2026-03-24T10:30:00', isRead: true },
  { id: 'M002', senderId: 'P001', receiverId: 'D001', senderRole: 'patient', content: '謝謝陳醫師，但我做側面抬腿時屁股有點痠，是正常的嗎？', timestamp: '2026-03-24T11:15:00', isRead: false },
  { id: 'M006', senderId: 'D001', receiverId: 'P001', senderRole: 'doctor', content: '前兩天痠痛是常見現象，先把每次保持時間降到 2 秒，觀察三天。', timestamp: '2026-03-24T11:20:00', isRead: true },
  { id: 'M007', senderId: 'P001', receiverId: 'D001', senderRole: 'patient', content: '了解，我今天會照這個方式做。', timestamp: '2026-03-24T11:23:00', isRead: true },
  { id: 'M008', senderId: 'D001', receiverId: 'P001', senderRole: 'doctor', content: '很好，若疼痛超過 6 分（滿分 10 分）就先停止並回報我。', timestamp: '2026-03-24T11:25:00', isRead: true },
  { id: 'M009', senderId: 'F001', receiverId: 'D001', senderRole: 'family', content: '陳醫師您好，我爸晚上比較容易忘記訓練，能否安排固定提醒時間？', timestamp: '2026-03-24T19:10:00', isRead: false },
  { id: 'M010', senderId: 'D001', receiverId: 'F001', senderRole: 'doctor', content: '可以，建議先固定在晚餐後 30 分鐘，每天兩次，家屬協助打卡。', timestamp: '2026-03-24T19:18:00', isRead: true },
  { id: 'M011', senderId: 'F001', receiverId: 'P001', senderRole: 'family', content: '爸，等一下 7:30 我陪你做第一組，做完我們再散步。', timestamp: '2026-03-24T19:22:00', isRead: true },
  { id: 'M012', senderId: 'P001', receiverId: 'F001', senderRole: 'patient', content: '好，謝謝你提醒我，我先暖身。', timestamp: '2026-03-24T19:24:00', isRead: true },
  { id: 'M013', senderId: 'T001', receiverId: 'P001', senderRole: 'therapist', content: '王先生，做抬腿時記得腳尖朝上，膝蓋盡量不要彎。', timestamp: '2026-03-25T08:45:00', isRead: false },
  { id: 'M014', senderId: 'P001', receiverId: 'T001', senderRole: 'patient', content: '收到，我會注意腳尖朝上。', timestamp: '2026-03-25T08:50:00', isRead: false },
  { id: 'M015', senderId: 'D001', receiverId: 'P001', senderRole: 'doctor', content: '今天目標：膝蓋彎曲 10 次 x 3 組，完成後回覆我「已完成」。', timestamp: '2026-03-25T09:05:00', isRead: false },
  { id: 'M016', senderId: 'P001', receiverId: 'D001', senderRole: 'patient', content: '已完成第一組，角度大概 106 度。', timestamp: '2026-03-25T09:25:00', isRead: false },
  { id: 'M017', senderId: 'D001', receiverId: 'P001', senderRole: 'doctor', content: '很棒，繼續保持動作速度，不要太快。第二組可再提高到 108 度。', timestamp: '2026-03-25T09:27:00', isRead: false },
  { id: 'M003', senderId: 'F001', receiverId: 'T001', senderRole: 'family', content: '黃治療師您好，請問我爸爸(王大明)的復健頻率需要增加嗎？', timestamp: '2026-03-23T15:20:00', isRead: true },
  { id: 'M004', senderId: 'T001', receiverId: 'F001', senderRole: 'therapist', content: '目前一天兩次剛好，避免肌肉過度疲勞，多注意他深蹲時背有沒有貼緊牆壁即可。', timestamp: '2026-03-23T16:00:00', isRead: true },
  { id: 'M005', senderId: 'T002', receiverId: 'P003', senderRole: 'therapist', content: '福壽伯伯，明天下午兩點記得開啟平板，我們有線上視訊復健喔！', timestamp: '2026-03-25T09:00:00', isRead: false },
  { id: 'M018', senderId: 'D001', receiverId: 'F001', senderRole: 'doctor', content: '若今天三組都完成，明天可以把每組保持時間加回 3 秒。', timestamp: '2026-03-25T10:00:00', isRead: false },
  { id: 'M019', senderId: 'F001', receiverId: 'D001', senderRole: 'family', content: '收到，我會幫忙記錄完成情況並回傳。', timestamp: '2026-03-25T10:08:00', isRead: false },
];
