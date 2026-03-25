// ============================================================
// Mock Data — RehabBridge System
// All data is static mock for prototype / development blueprint
// ============================================================

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
  tolerance: number;
  joints: [string, string, string]; // [p1, vertex, p2] keypoint names
  reps: number;
  sets: number;
  holdSeconds: number;
  side: 'left' | 'right' | 'bilateral';
  guidanceSteps: string[];
  voicePrompts: {
    start: string;
    tooLow: string;
    tooHigh: string;
    achieved: string;
    complete: string;
  };
  bodyArea: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  exerciseId: string;
  targetAngle: number;
  reps: number;
  sets: number;
  holdSeconds: number;
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
  duration: number;
  completedSets: number;
  completedReps: number;
  avgAngle: number;
  maxAngle: number;
  targetAngle: number;
  score: number;
  voiceFeedbackCount: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  department: string;
  avatar: string;
  patientCount: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  patientId: string;
  phone: string;
  notificationsEnabled: boolean;
}

// ─── Doctors ───────────────────────────────────────────────
export const mockDoctors: Doctor[] = [
  {
    id: 'D001',
    name: '陳志明',
    specialty: '骨科復健',
    hospital: '台大醫院',
    department: '復健科',
    avatar: 'D',
    patientCount: 12,
  },
  {
    id: 'D002',
    name: '林美華',
    specialty: '神經復健',
    hospital: '台大醫院',
    department: '神經科',
    avatar: 'L',
    patientCount: 8,
  },
];

// ─── Patients ──────────────────────────────────────────────
export const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: '王大明',
    age: 72,
    gender: '男',
    diagnosis: '右膝退化性關節炎（第三期）',
    doctorId: 'D001',
    familyContact: '王小美（女兒）',
    avatar: '王',
    admissionDate: '2026-01-15',
    completionRate: 85,
    lastSessionDate: '2026-03-23',
    status: 'active',
  },
  {
    id: 'P002',
    name: '李秀英',
    age: 68,
    gender: '女',
    diagnosis: '左肩旋轉肌袖受傷術後復健',
    doctorId: 'D001',
    familyContact: '李建國（兒子）',
    avatar: '李',
    admissionDate: '2026-02-01',
    completionRate: 72,
    lastSessionDate: '2026-03-22',
    status: 'active',
  },
  {
    id: 'P003',
    name: '張福壽',
    age: 75,
    gender: '男',
    diagnosis: '腦中風後右側肢體復健',
    doctorId: 'D002',
    familyContact: '張明芳（配偶）',
    avatar: '張',
    admissionDate: '2026-01-08',
    completionRate: 60,
    lastSessionDate: '2026-03-21',
    status: 'active',
  },
  {
    id: 'P004',
    name: '陳阿蘭',
    age: 70,
    gender: '女',
    diagnosis: '髖關節置換術後復健',
    doctorId: 'D001',
    familyContact: '陳大偉（兒子）',
    avatar: '陳',
    admissionDate: '2026-03-01',
    completionRate: 45,
    lastSessionDate: '2026-03-20',
    status: 'active',
  },
];

// ─── Exercises ─────────────────────────────────────────────
export const mockExercises: Exercise[] = [
  {
    id: 'EX001',
    name: '膝蓋彎曲訓練',
    nameEn: 'Knee Flexion',
    category: '下肢復健',
    description: '坐姿訓練膝關節彎曲角度，增強股四頭肌與膕旁肌群柔軟度與力量',
    targetAngle: 120,
    tolerance: 10,
    joints: ['right_hip', 'right_knee', 'right_ankle'],
    reps: 10,
    sets: 3,
    holdSeconds: 3,
    side: 'right',
    guidanceSteps: [
      '坐在椅子上，背部挺直',
      '緩慢將膝蓋彎曲至最大角度',
      '保持目標角度 3 秒',
      '緩慢伸直回到起始位置',
      '重複動作',
    ],
    voicePrompts: {
      start: '請開始彎曲右膝蓋',
      tooLow: '請繼續彎曲，還差一點點',
      tooHigh: '很好！請稍微放鬆一些',
      achieved: '很棒！已達到目標角度，請保持三秒',
      complete: '這一組完成了！休息一下再繼續',
    },
    bodyArea: '膝蓋',
    difficulty: 'medium',
  },
  {
    id: 'EX002',
    name: '肩膀外展訓練',
    nameEn: 'Shoulder Abduction',
    category: '上肢復健',
    description: '站姿或坐姿將手臂側舉至肩膀高度，訓練三角肌與肩旋轉肌群',
    targetAngle: 90,
    tolerance: 10,
    joints: ['right_hip', 'right_shoulder', 'right_elbow'],
    reps: 12,
    sets: 3,
    holdSeconds: 2,
    side: 'right',
    guidanceSteps: [
      '站立或坐姿，手臂自然垂放',
      '緩慢將右手臂向側方抬起',
      '目標：手臂與地面平行（90度）',
      '保持姿勢 2 秒',
      '緩慢放下回到起始位置',
    ],
    voicePrompts: {
      start: '請開始側舉右手臂',
      tooLow: '請繼續抬高手臂',
      tooHigh: '很好！請稍微放低一些',
      achieved: '完美！手臂已達到目標高度，請保持',
      complete: '這一組完成！做得很好',
    },
    bodyArea: '肩膀',
    difficulty: 'easy',
  },
  {
    id: 'EX003',
    name: '手肘彎曲訓練',
    nameEn: 'Elbow Flexion',
    category: '上肢復健',
    description: '訓練手肘彎曲角度，強化二頭肌，改善日常生活能力',
    targetAngle: 90,
    tolerance: 8,
    joints: ['right_shoulder', 'right_elbow', 'right_wrist'],
    reps: 15,
    sets: 3,
    holdSeconds: 2,
    side: 'right',
    guidanceSteps: [
      '站立或坐姿，手臂自然垂放',
      '保持上臂固定不動',
      '緩慢將前臂向上彎曲',
      '目標：手肘彎曲達 90 度',
      '緩慢放下',
    ],
    voicePrompts: {
      start: '請開始彎曲右手肘',
      tooLow: '請繼續彎曲手肘',
      tooHigh: '再放鬆一點點',
      achieved: '非常好！請保持這個角度',
      complete: '一組完成！休息後繼續',
    },
    bodyArea: '手肘',
    difficulty: 'easy',
  },
  {
    id: 'EX004',
    name: '髖關節外展訓練',
    nameEn: 'Hip Abduction',
    category: '下肢復健',
    description: '側臥或站立將腿部向外展開，強化外展肌群，改善步態穩定性',
    targetAngle: 30,
    tolerance: 8,
    joints: ['left_knee', 'left_hip', 'right_hip'],
    reps: 10,
    sets: 3,
    holdSeconds: 3,
    side: 'left',
    guidanceSteps: [
      '站立，可扶牆保持平衡',
      '重心移至右腳',
      '緩慢將左腿向外側抬起',
      '目標角度：30 度',
      '保持 3 秒後放下',
    ],
    voicePrompts: {
      start: '請開始側舉左腿',
      tooLow: '請再抬高一點',
      tooHigh: '請稍微放低一些',
      achieved: '很好！保持這個高度三秒',
      complete: '完成！換腿之前請休息一下',
    },
    bodyArea: '髖部',
    difficulty: 'medium',
  },
];

// ─── Prescriptions ─────────────────────────────────────────
export const mockPrescriptions: Prescription[] = [
  {
    id: 'RX001',
    patientId: 'P001',
    doctorId: 'D001',
    exerciseId: 'EX001',
    targetAngle: 120,
    reps: 10,
    sets: 3,
    holdSeconds: 3,
    frequency: '每天兩次',
    notes: '術後第六週開始，初期若疼痛請停止，第八週目標達到130度',
    startDate: '2026-02-15',
    endDate: '2026-04-15',
    active: true,
  },
  {
    id: 'RX002',
    patientId: 'P001',
    doctorId: 'D001',
    exerciseId: 'EX004',
    targetAngle: 30,
    reps: 10,
    sets: 2,
    holdSeconds: 3,
    frequency: '每天一次',
    notes: '搭配膝蓋彎曲訓練，注意髖部不要過度代償',
    startDate: '2026-02-15',
    endDate: '2026-04-15',
    active: true,
  },
  {
    id: 'RX003',
    patientId: 'P002',
    doctorId: 'D001',
    exerciseId: 'EX002',
    targetAngle: 90,
    reps: 12,
    sets: 3,
    holdSeconds: 2,
    frequency: '每天兩次',
    notes: '旋轉肌術後第四週，避免超過90度以上的外展',
    startDate: '2026-02-20',
    endDate: '2026-05-01',
    active: true,
  },
  {
    id: 'RX004',
    patientId: 'P002',
    doctorId: 'D001',
    exerciseId: 'EX003',
    targetAngle: 90,
    reps: 15,
    sets: 3,
    holdSeconds: 2,
    frequency: '每天兩次',
    notes: '強化二頭肌，搭配輕啞鈴訓練',
    startDate: '2026-02-20',
    endDate: '2026-05-01',
    active: true,
  },
];

// ─── Session Records ────────────────────────────────────────
export const mockSessionRecords: SessionRecord[] = [
  { id: 'S001', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-24', duration: 18, completedSets: 3, completedReps: 10, avgAngle: 118, maxAngle: 124, targetAngle: 120, score: 92, voiceFeedbackCount: 8 },
  { id: 'S002', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-23', duration: 16, completedSets: 3, completedReps: 10, avgAngle: 115, maxAngle: 121, targetAngle: 120, score: 87, voiceFeedbackCount: 11 },
  { id: 'S003', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-22', duration: 15, completedSets: 3, completedReps: 9, avgAngle: 110, maxAngle: 118, targetAngle: 120, score: 80, voiceFeedbackCount: 15 },
  { id: 'S004', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-21', duration: 14, completedSets: 2, completedReps: 10, avgAngle: 105, maxAngle: 113, targetAngle: 120, score: 73, voiceFeedbackCount: 18 },
  { id: 'S005', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-20', duration: 13, completedSets: 2, completedReps: 8, avgAngle: 100, maxAngle: 108, targetAngle: 120, score: 65, voiceFeedbackCount: 22 },
  { id: 'S006', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-19', duration: 12, completedSets: 2, completedReps: 8, avgAngle: 96, maxAngle: 105, targetAngle: 120, score: 60, voiceFeedbackCount: 25 },
  { id: 'S007', patientId: 'P001', exerciseId: 'EX001', date: '2026-03-18', duration: 11, completedSets: 2, completedReps: 7, avgAngle: 92, maxAngle: 100, targetAngle: 120, score: 55, voiceFeedbackCount: 28 },
  { id: 'S008', patientId: 'P002', exerciseId: 'EX002', date: '2026-03-24', duration: 12, completedSets: 3, completedReps: 12, avgAngle: 85, maxAngle: 93, targetAngle: 90, score: 88, voiceFeedbackCount: 10 },
  { id: 'S009', patientId: 'P002', exerciseId: 'EX002', date: '2026-03-23', duration: 11, completedSets: 3, completedReps: 11, avgAngle: 82, maxAngle: 90, targetAngle: 90, score: 82, voiceFeedbackCount: 13 },
  { id: 'S010', patientId: 'P002', exerciseId: 'EX002', date: '2026-03-22', duration: 10, completedSets: 2, completedReps: 12, avgAngle: 78, maxAngle: 86, targetAngle: 90, score: 75, voiceFeedbackCount: 16 },
];

// ─── Weekly Activity ────────────────────────────────────────
export const mockWeeklyActivity = [
  { day: '週一', sessions: 2, score: 78, duration: 32 },
  { day: '週二', sessions: 2, score: 82, duration: 35 },
  { day: '週三', sessions: 1, score: 79, duration: 18 },
  { day: '週四', sessions: 2, score: 85, duration: 34 },
  { day: '週五', sessions: 2, score: 88, duration: 36 },
  { day: '週六', sessions: 1, score: 87, duration: 20 },
  { day: '週日', sessions: 0, score: 0, duration: 0 },
];

// ─── Angle Progress (last 7 days) ───────────────────────────
export const mockAngleProgress = [
  { date: '3/18', angle: 92, target: 120 },
  { date: '3/19', angle: 96, target: 120 },
  { date: '3/20', angle: 100, target: 120 },
  { date: '3/21', angle: 105, target: 120 },
  { date: '3/22', angle: 110, target: 120 },
  { date: '3/23', angle: 115, target: 120 },
  { date: '3/24', angle: 118, target: 120 },
];

// ─── Family Members ─────────────────────────────────────────
export const mockFamilyMembers: FamilyMember[] = [
  { id: 'F001', name: '王小美', relation: '女兒', patientId: 'P001', phone: '0912-345-678', notificationsEnabled: true },
  { id: 'F002', name: '李建國', relation: '兒子', patientId: 'P002', phone: '0923-456-789', notificationsEnabled: true },
];

// ─── Notifications ──────────────────────────────────────────
export const mockNotifications = [
  { id: 'N001', type: 'success', title: '今日訓練完成', message: '王大明 已完成今日膝蓋彎曲訓練，最大角度達 124°', time: '14:32', read: false },
  { id: 'N002', type: 'warning', title: '訓練未達標', message: '昨日訓練完成率僅 67%，建議調整難度', time: '09:15', read: false },
  { id: 'N003', type: 'info', title: '復健進度更新', message: '本週膝蓋角度平均提升 8°，進步明顯', time: '昨天', read: true },
  { id: 'N004', type: 'success', title: '里程碑達成', message: '累計完成 50 次復健訓練！', time: '昨天', read: true },
];

// ─── System Stats ───────────────────────────────────────────
export const mockSystemStats = {
  totalPatients: 4,
  activeToday: 3,
  avgCompletionRate: 65.5,
  totalSessions: 247,
  avgScore: 81.2,
  improvementRate: 12.4,
};
