export interface DemoPatientStory {
  patientId: string;
  title: string;
  hook: string;
  profile: string;
  problem: string;
  careGoal: string;
  demoFlow: string[];
  todayResult: string[];
  judgePitch: string;
  collaboration: string[];
}

export const demoPatientStories: DemoPatientStory[] = [
  {
    patientId: 'P001',
    title: '王大明的居家復健闖關故事',
    hook: '72 歲膝退化性關節炎患者，出院後常忘記練習，也不確定自己做得對不對。',
    profile: '王大明，72 歲，右膝退化性關節炎第三期，女兒會協助確認每日復健狀況。',
    problem: '傳統紙本處方難追蹤，患者做錯時醫師不會即時知道，回診時也缺少疼痛與完成率資料。',
    careGoal: '讓王大明每天完成 2 個下肢關卡與 1 個安全引導動作，降低疼痛、增加站起與走路信心。',
    demoFlow: [
      '醫師端依物理治療師動作庫開立膝伸直、坐到站、下巴內縮與踝內翻。',
      '長者端用闖關地圖開始今日任務：膝伸直走鏡頭角度追蹤，下巴內縮走計時引導。',
      '完成後患者回報疼痛、頭暈、腫脹與自覺難度，系統同步到醫師端。',
      'AI 只提出難度建議，由醫師確認是否調整關卡。',
    ],
    todayResult: [
      '膝伸直平均 91 分，角度穩定度良好。',
      '下巴內縮疼痛 1/10、頭暈 0/10，可維持目前劑量。',
      '踝內翻回報不穩感 7/10，醫師端列為需留意異常。',
    ],
    judgePitch:
      'RehabBridge 把居家復健從「醫師開完處方就失聯」變成可追蹤、可回報、可調整的每日照護流程。',
    collaboration: [
      '物理治療師：提供動作、劑量與注意事項。',
      '工程組：完成姿勢偵測、處方資料層、引導式回報與醫師總表。',
      '設計組：整理長者闖關介面、海報與影片敘事。',
      '醫療端：確認 AI 僅作建議，最後由醫師決策。',
    ],
  },
];

export function getDemoPatientStory(patientId?: string | null) {
  if (!patientId) return null;
  return demoPatientStories.find((story) => story.patientId === patientId) ?? null;
}
