// ============================================================
// Blueprint — 系統設計藍圖
// Architecture diagram, user flows, design specs, ML Kit design
// For development team reference
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Layers, GitBranch, Palette, Cpu, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const tabs = [
  { id: 'architecture', label: '系統架構', icon: Layers },
  { id: 'userflow', label: '使用流程', icon: GitBranch },
  { id: 'design', label: 'UI 設計規範', icon: Palette },
  { id: 'mlkit', label: 'ML 邊緣運算', icon: Cpu },
];

// ─── Architecture Layer Data ────────────────────────────────
const architectureLayers = [
  {
    name: 'Presentation Layer',
    label: '展示層',
    color: '#1565C0',
    bg: '#E3F2FD',
    items: [
      { name: 'RoleSelect', desc: '角色入口選擇頁面（長者／家屬／醫師／藍圖）' },
      { name: 'PatientPortal', desc: '長者端主頁：今日計畫僅有效處方；下肢／核心合計最多 2、上肢最多 2（腿 2＋手 2）' },
      { name: 'RehabSession', desc: '相機即時姿態偵測、角度儀表、語音提示（zh-TW）' },
      { name: 'FamilyDashboard', desc: '家屬監控儀表板' },
      { name: 'DoctorPortal', desc: '醫師管理與處方頁面' },
      { name: 'ChatWidget', desc: '全站浮動訊息（依路由角色切換對話脈絡）' },
    ],
    components: ['SkeletonCanvas', 'AngleGauge', 'Recharts', 'motion/react'],
  },
  {
    name: 'Business Logic Layer',
    label: '商業邏輯層',
    color: '#00695C',
    bg: '#E0F2F1',
    items: [
      { name: 'usePoseDetection', desc: 'TF.js MoveNet 姿態偵測 Hook' },
      { name: 'useVoiceCoach', desc: '瀏覽器 SpeechSynthesis，或選配雅婷／OpenAI TTS（.env，節流）' },
      { name: 'angleCalculator / poseLogic', desc: '關節角度、左右側自動切換、可信度過濾' },
      { name: 'RehabSession State', desc: '組次、次數、保持倒數、達標狀態機' },
      { name: 'sessionStore', desc: '訓練紀錄：mock 資料 + localStorage 合併與跨頁同步' },
    ],
    components: ['React State', 'useEffect', 'useCallback', 'useRef'],
  },
  {
    name: 'Domain Layer',
    label: '核心領域層',
    color: '#6A1B9A',
    bg: '#F3E5F5',
    items: [
      { name: 'AngleCalculator', desc: '向量內積計算夾角，三點定義關節角度' },
      { name: 'PoseValidator', desc: '關鍵點可信度過濾（score ≥ 0.3）' },
      { name: 'ExerciseStateMachine', desc: '動作狀態機：idle→active→achieved→hold→complete' },
      { name: 'VoiceFeedbackEngine', desc: '語音節流與訊息佇列管理' },
      { name: 'ScoreCalculator', desc: '基於達標率與完成度計算分數' },
    ],
    components: ['Pure Functions', 'State Machine', 'Type Guards'],
  },
  {
    name: 'Data Layer',
    label: '資料層',
    color: '#BF360C',
    bg: '#FBE9E7',
    items: [
      { name: 'mockData.ts', desc: '患者、處方、動作庫、訊息與示範 Session 紀錄' },
      { name: 'TFJSPoseService', desc: 'TF.js createDetector + estimatePoses' },
      { name: 'TTSService', desc: 'SpeechSynthesis API，語系 zh-TW' },
      { name: 'sessionStore (localStorage)', desc: '鍵 rehabbridge.customSessionRecords.v1，與 mock 合併供儀表板使用' },
      { name: 'FirebaseRepo', desc: '雲端資料同步（規劃中：Firestore）' },
    ],
    components: ['TypeScript Types', 'Async/Await', 'IndexedDB'],
  },
];

// ─── User Flow Data ─────────────────────────────────────────
const userFlows = [
  {
    role: '長者端（患者）',
    color: '#1565C0',
    bg: '#E3F2FD',
    steps: [
      { id: 1, action: '開啟 App → 選擇「長者端」', note: '大字體、高對比介面' },
      { id: 2, action: '查看今日訓練計畫', note: '有效處方中腿部復健 2 項＋手部復健 2 項；卡片右側淡色圖示' },
      { id: 3, action: '點選訓練項目', note: '進入該動作復健頁（無列表箭頭，整卡可點）' },
      { id: 4, action: '按「開始訓練」→ 相機啟動', note: '請求相機權限' },
      { id: 5, action: 'AI 偵測姿態 → 繪製骨架', note: 'TF.js 30fps 偵測' },
      { id: 6, action: '即時顯示關節角度', note: '大字體數字 + 顏色指示' },
      { id: 7, action: '語音提示是否達到目標角度', note: '繁體中文（zh-TW）TTS；節流約 3 秒' },
      { id: 8, action: '達標 → 保持倒數計時', note: '綠色高亮 + 倒計時' },
      { id: 9, action: '完成組數次數 → 顯示成績', note: '訓練完成動畫' },
      { id: 10, action: '返回主頁查看進度', note: '更新今日完成狀態' },
    ],
  },
  {
    role: '家屬端（家庭成員）',
    color: '#00695C',
    bg: '#E0F2F1',
    steps: [
      { id: 1, action: '選擇「家屬端」登入', note: '顯示綁定患者資訊' },
      { id: 2, action: '查看今日訓練完成狀況', note: '完成進度條與統計' },
      { id: 3, action: '查看角度進展趨勢圖', note: '折線圖顯示7天角度' },
      { id: 4, action: '查看訓練分數與達標率', note: '分數趨勢圖' },
      { id: 5, action: '接收系統通知', note: '完成通知、未達標警示' },
      { id: 6, action: '查看歷史訓練記錄', note: '每次記錄詳情' },
      { id: 7, action: '聯絡主治醫師 (未來)', note: '訊息功能' },
    ],
  },
  {
    role: '醫師端（主治醫師）',
    color: '#4A148C',
    bg: '#F3E5F5',
    steps: [
      { id: 1, action: '選擇「醫師端」登入', note: '顯示管理患者列表' },
      { id: 2, action: '查看患者完成率儀表板', note: '多患者對比圖表' },
      { id: 3, action: '選擇患者 → 查看詳情', note: '患者個別訓練數據' },
      { id: 4, action: '查看角度進展與達標率', note: '科學化評估報告' },
      { id: 5, action: '調整訓練處方', note: '修改目標角度/組數/次數' },
      { id: 6, action: '儲存 → 即時同步至患者端', note: '變更立即生效' },
      { id: 7, action: '查看數據分析報告', note: '雷達圖多維度評估' },
      { id: 8, action: '新增處方訓練項目 (未來)', note: '從運動庫選擇' },
    ],
  },
];

// ─── Design Tokens ──────────────────────────────────────────
const designTokens = {
  colors: [
    { name: 'Primary Blue', hex: '#1565C0', desc: '主色調 — 信賴感與醫療感' },
    { name: 'Teal', hex: '#00897B', desc: '家屬端 — 自然與關懷' },
    { name: 'Purple', hex: '#4A148C', desc: '醫師端 — 專業與權威' },
    { name: 'Success', hex: '#2E7D32', desc: '達標 · 完成 · 正確姿勢' },
    { name: 'Warning', hex: '#E65100', desc: '接近目標 · 待改善' },
    { name: 'Error', hex: '#C62828', desc: '未達標 · 錯誤 · 警告' },
    { name: 'Background', hex: '#EEF2F7', desc: '頁面背景 — 柔和灰藍' },
    { name: 'Surface', hex: '#FFFFFF', desc: '卡片 · 內容區塊' },
    { name: 'Dark BG', hex: '#111D2D', desc: '復健訓練頁暗色背景（#111D2D／#1A2840 導航列）' },
    { name: 'Skeleton', hex: '#00E5FF', desc: '骨架節點連線顏色' },
    { name: 'Joint Highlight', hex: '#FFD600', desc: '高亮關節節點' },
    { name: 'Angle Active', hex: '#69F0AE', desc: '達標角度指示色' },
  ],
  typography: [
    { name: '主標題 (h1)', size: '28–32px', weight: '700', use: '頁面主標題' },
    { name: '副標題 (h2)', size: '20–24px', weight: '700', use: '區段標題' },
    { name: '卡片標題 (h3)', size: '16–18px', weight: '600', use: '卡片、列表項目' },
    { name: '正文', size: '14–16px', weight: '400', use: '說明文字' },
    { name: '標籤', size: '11–13px', weight: '500', use: '輔助說明、標籤' },
    { name: '角度數字 (特大)', size: '36–48px', weight: '800', use: '復健頁即時角度顯示' },
  ],
  spacing: ['4px', '8px', '12px', '16px', '20px', '24px', '32px', '48px'],
  radius: ['8px (sm)', '12px (md)', '16px (lg)', '20px (xl)', '24px (2xl)', '9999px (full)'],
  touchTargets: '最小 48×48px（長者友善），推薦 56×56px+',
  contrast: 'AA/AAA 最低對比度符合 WCAG 2.1 標準',
};

// ─── ML Kit Design ──────────────────────────────────────────
const mlKitDesign = {
  model: 'TensorFlow.js MoveNet SINGLEPOSE_LIGHTNING',
  alternatives: ['MoveNet Thunder (高精度)', 'BlazePose (全身17+點)', 'PoseNet (舊版)'],
  keypoints: 17,
  fps: '~30fps (iPhone/iPad WebGL)',
  backend: 'WebGL → WASM fallback',
  confidence: '最低信心值 0.3（可調）',
  pipeline: [
    { step: 1, name: '相機初始化', detail: 'navigator.mediaDevices.getUserMedia，前置鏡頭，1280×720' },
    { step: 2, name: '模型載入', detail: 'createDetector(MoveNet, {enableSmoothing: true})，CDN載入~2MB' },
    { step: 3, name: '推理迴圈', detail: 'requestAnimationFrame → estimatePoses(videoElement)' },
    { step: 4, name: '關鍵點過濾', detail: '過濾 score < 0.3 的關鍵點，確保骨架品質' },
    { step: 5, name: '角度計算', detail: '三點向量夾角：acos(v1·v2 / |v1||v2|) × 180/π' },
    { step: 6, name: '狀態判斷', detail: '比較目前角度與目標角度，加入容許誤差帶' },
    { step: 7, name: '骨架繪製', detail: 'Canvas 2D API，關節圓圈 + 連線，高亮運動關節' },
    { step: 8, name: '語音反饋', detail: 'SpeechSynthesisUtterance(zh-TW)，節流 3000ms（RehabSession）' },
  ],
  exercises: [
    { name: '膝蓋彎曲訓練', joints: '[23,25,27]', target: '例 110°' },
    { name: '膝蓋伸膝訓練', joints: '[23,25,27]', target: '例 165°' },
    { name: '肩膀外展訓練', joints: '[23,11,13]', target: '例 90°' },
    { name: '肩膀前舉訓練', joints: '[23,11,13]', target: '例 95°' },
    { name: '手肘彎曲訓練', joints: '[11,13,15]', target: '例 130°' },
    { name: '手肘伸展訓練', joints: '[11,13,15]', target: '例 160–165°' },
    { name: '髖關節外展訓練', joints: '[24,23,25]', target: '例 35°' },
    { name: '直腿抬舉訓練', joints: '[11,23,25]', target: '例 45°' },
    { name: '側面抬腿訓練', joints: '[23,24,26]', target: '例 30°' },
    { name: '靠牆深蹲訓練', joints: '[23,25,27]', target: '例 90–100°' },
  ],
};

function AccordionSection({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm mb-4" style={{ background: 'white' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A2035' }}>{title}</span>
        {open ? <ChevronDown size={18} style={{ color: '#90A4AE' }} /> : <ChevronRight size={18} style={{ color: '#90A4AE' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Blueprint() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('architecture');

  return (
    <div className="min-h-screen" style={{ background: '#F4F7FC' }}>
      {/* Top Bar（返回鈕與家屬端一致：圓框大字 + 不換行） */}
      <div style={{ background: 'linear-gradient(135deg, #FF7043 0%, #F4511E 100%)' }}>
        <div className="pt-8 pb-6 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex flex-nowrap items-center gap-2.5 text-white/85 hover:text-white mb-4 transition-colors text-2xl md:text-3xl font-bold min-h-[52px] w-fit rounded-full border-2 border-white/55 hover:border-white hover:bg-white/15 px-5 py-2.5 active:scale-[0.98] -ml-1"
              >
                <ArrowLeft size={30} strokeWidth={2.5} className="shrink-0" aria-hidden />
                <span className="whitespace-nowrap">返回</span>
              </button>
              <h1 className="text-white text-2xl md:text-4xl font-bold">系統開發藍圖</h1>
              <p className="text-white/65 text-sm md:text-base mt-2">
                RehabBridge v1.1 · 2026-03 · 架構 · 流程 · UI · ML（與目前程式對齊）
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-10" style={{ marginTop: -12 }}>
        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-2 mb-6 p-1.5 rounded-2xl shadow-sm" style={{ background: 'white' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="py-3 rounded-xl flex flex-col items-center gap-1 transition-all"
                style={{
                  background: activeTab === tab.id ? '#F4511E' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#90A4AE',
                }}>
                <Icon size={18} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Architecture Tab ─────────────────────── */}
        {activeTab === 'architecture' && (
          <div>
            <div className="rounded-2xl p-4 mb-5 shadow-sm" style={{ background: 'white' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A2035', marginBottom: 8 }}>分層架構總覽</h2>
              <p style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.6 }}>
                RehabBridge 採用四層分層架構，關注點分離、利於維護。技術棧：React + TypeScript + TailwindCSS；
                姿態：TF.js MoveNet；語音：預設 Web Speech zh-TW，可改雅婷（國語／台語模型）或 OpenAI TTS。長者端今日計畫依分類與
                bodyArea 排序；完成訓練會寫入 sessionStore（localStorage）與 mock 紀錄合併顯示。
              </p>
            </div>

            {architectureLayers.map((layer, i) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl overflow-hidden shadow-sm mb-4"
                style={{ background: 'white', borderLeft: `4px solid ${layer.color}` }}
              >
                <div className="px-5 py-4 flex items-center justify-between"
                  style={{ background: layer.bg }}>
                  <div>
                    <div style={{ fontSize: 11, color: layer.color, fontWeight: 700, letterSpacing: 1 }}>
                      LAYER {i + 1}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2035' }}>{layer.name}</div>
                    <div style={{ fontSize: 13, color: '#546E7A' }}>{layer.label}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-48">
                    {layer.components.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: `${layer.color}20`, color: layer.color, fontWeight: 600 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 gap-2">
                  {layer.items.map(item => (
                    <div key={item.name} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: layer.color }} />
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2035' }}>{item.name}</span>
                        <span style={{ fontSize: 13, color: '#78909C', marginLeft: 8 }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Data Flow Diagram */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A2035', marginBottom: 12 }}>
                復健訓練資料流向
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { from: '相機 (MediaDevices API)', to: 'Video Element', arrow: true },
                  { from: 'Video Element', to: 'TF.js estimatePoses()', arrow: true },
                  { from: 'TF.js Keypoints[17]', to: 'extractAngleFromKeypoints()', arrow: true },
                  { from: 'Current Angle', to: 'getAngleResult() → status', arrow: true },
                  { from: 'Angle Status', to: 'Voice Coach (SpeechSynthesis)', arrow: true },
                  { from: 'Angle Status', to: 'Canvas Skeleton Overlay', arrow: true },
                  { from: 'Angle Status', to: 'AngleGauge UI Component', arrow: true },
                  { from: '訓練完成', to: 'appendSessionRecord → localStorage', arrow: true },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#FBE9E7', color: '#BF360C', whiteSpace: 'nowrap' }}>
                      {step.from}
                    </div>
                    <div style={{ color: '#90A4AE', fontSize: 16 }}>→</div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#E8F5E9', color: '#2E7D32', whiteSpace: 'nowrap' }}>
                      {step.to}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── User Flow Tab ────────────────────────── */}
        {activeTab === 'userflow' && (
          <div>
            {userFlows.map(flow => (
              <AccordionSection key={flow.role} title={flow.role} defaultOpen={flow.role.includes('長者')}>
                <div className="flex flex-col gap-2 mt-2">
                  {flow.steps.map(step => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ background: flow.color, minWidth: 24 }}>
                        {step.id}
                      </div>
                      <div className="flex-1 pb-2" style={{ borderBottom: step.id < flow.steps.length ? '1px dashed #F0F4F8' : 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2035' }}>{step.action}</div>
                        <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 2 }}>💡 {step.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            ))}
          </div>
        )}

        {/* ── Design Spec Tab ──────────────────────── */}
        {activeTab === 'design' && (
          <div>
            {/* Color Palette */}
            <AccordionSection title="🎨 色彩規範" defaultOpen>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {designTokens.colors.map(color => (
                  <div key={color.name} className="rounded-xl overflow-hidden border" style={{ borderColor: '#F0F0F0' }}>
                    <div className="h-10 w-full" style={{ background: color.hex }} />
                    <div className="p-2">
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2035' }}>{color.name}</div>
                      <div style={{ fontSize: 11, color: '#78909C', fontFamily: 'monospace' }}>{color.hex}</div>
                      <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2, lineHeight: 1.3 }}>{color.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Typography */}
            <AccordionSection title="✏️ 字體規範" defaultOpen>
              <div className="flex flex-col gap-3 mt-2">
                {designTokens.typography.map(type => (
                  <div key={type.name} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2035' }}>{type.name}</div>
                      <div style={{ fontSize: 12, color: '#78909C' }}>{type.use}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 12, color: '#E65100', fontFamily: 'monospace', fontWeight: 600 }}>{type.size}</div>
                      <div style={{ fontSize: 11, color: '#90A4AE' }}>weight: {type.weight}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Spacing & Radius */}
            <AccordionSection title="📐 間距 & 圓角">
              <div className="mt-2">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#546E7A', marginBottom: 8 }}>間距規格</div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {designTokens.spacing.map(s => (
                    <div key={s} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#E3F2FD', color: '#1565C0' }}>{s}</div>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#546E7A', marginBottom: 8 }}>圓角規格</div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {designTokens.radius.map(r => (
                    <div key={r} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#F3E5F5', color: '#4A148C' }}>{r}</div>
                  ))}
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#FFF8E1' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F57F17' }}>🖐 觸控目標 (長者友善)</div>
                  <div style={{ fontSize: 12, color: '#7C4D00', marginTop: 4 }}>{designTokens.touchTargets}</div>
                </div>
                <div className="p-3 rounded-xl mt-2" style={{ background: '#E8F5E9' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2E7D32' }}>♿ 無障礙對比度</div>
                  <div style={{ fontSize: 12, color: '#1B5E20', marginTop: 4 }}>{designTokens.contrast}</div>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection title="🗓 長者端 · 今日訓練計畫卡片" defaultOpen>
              <div className="mt-2 flex flex-col gap-3">
                {[
                  { title: '排序邏輯', detail: '僅 active 處方；先依 category／bodyArea 排序後，下肢＋核心取前 2 項（腿）、上肢取前 2 項（手），列為腿區再手區' },
                  { title: '卡片版面', detail: '左：播放圖示方塊 + 動作名稱；右側半透明大圖示（依分類 💪🦵🧘）垂直置中；列表不顯示右箭頭，整卡可點進 RehabSession' },
                  { title: '主頁字級', detail: 'PatientPortal 使用 Tailwind arbitrary variant 整頁放大（text-xs→text-lg 等）以利長者閱讀' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 py-2"
                    style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2035', width: 100, flexShrink: 0 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.5 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* iPad Layout */}
            <AccordionSection title="📱 iPad 版面規範">
              <div className="mt-2 flex flex-col gap-3">
                {[
                  { title: '目標裝置', detail: 'iPad (9~12.9吋) · iPadOS Safari / PWA' },
                  { title: '基準解析度', detail: '1024×768 (橫向) / 768×1024 (直向)' },
                  { title: '安全區域', detail: 'padding: env(safe-area-inset-*)' },
                  { title: '復健頁面佈局', detail: '相機佔左側 75% + 右側資訊欄 280px（橫向）' },
                  { title: '字體縮放', detail: 'base 18px，長者友善模式 20px+' },
                  { title: '動畫效能', detail: 'CSS Transform + opacity，避免 layout reflow' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 py-2"
                    style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2035', width: 140, flexShrink: 0 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#546E7A' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </AccordionSection>
          </div>
        )}

        {/* ── ML Kit Tab ──────────────────────────── */}
        {activeTab === 'mlkit' && (
          <div>
            {/* Model Info */}
            <div className="rounded-2xl p-5 shadow-sm mb-4" style={{ background: 'white', borderLeft: '4px solid #00897B' }}>
              <div style={{ fontSize: 11, color: '#00695C', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                CORE ENGINE
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2035', marginBottom: 4 }}>
                {mlKitDesign.model}
              </h2>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: '關鍵點數量', value: `${mlKitDesign.keypoints} 個` },
                  { label: '推理速度', value: mlKitDesign.fps },
                  { label: '運算後端', value: mlKitDesign.backend },
                  { label: '最低信心值', value: mlKitDesign.confidence },
                  { label: '姿態平滑', value: 'enableSmoothing: true' },
                  { label: '偵測模式', value: 'SINGLEPOSE (單人)' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3"
                    style={{ background: '#E0F2F1' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#00695C' }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: '#546E7A' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inference Pipeline */}
            <AccordionSection title="⚙️ 推理管線 (8步驟)" defaultOpen>
              <div className="flex flex-col gap-3 mt-2">
                {mlKitDesign.pipeline.map(step => (
                  <div key={step.step} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ background: '#00695C' }}>
                      {step.step}
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={{ background: '#F8FAFB' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2035' }}>{step.name}</div>
                      <div style={{ fontSize: 12, color: '#546E7A', marginTop: 2, fontFamily: 'monospace' }}>
                        {step.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Exercise Joint Mapping */}
            <AccordionSection title="🦴 運動關節映射表" defaultOpen>
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #F0F0F0' }}>
                <div className="grid grid-cols-3 px-4 py-2"
                  style={{ background: '#E0F2F1', fontSize: 12, fontWeight: 700, color: '#00695C' }}>
                  <div>訓練名稱</div>
                  <div>關節三點 (P1→頂點→P2)</div>
                  <div>目標角度</div>
                </div>
                {mlKitDesign.exercises.map((ex, i) => (
                  <div key={ex.name} className="grid grid-cols-3 px-4 py-3"
                    style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: '#1A2035' }}>{ex.name}</div>
                    <div style={{ color: '#546E7A', fontFamily: 'monospace', fontSize: 11 }}>{ex.joints}</div>
                    <div style={{ color: '#00695C', fontWeight: 700 }}>{ex.target}</div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Angle Calculation */}
            <AccordionSection title="📐 角度計算公式">
              <div className="mt-2 p-4 rounded-xl" style={{ background: '#1A2035' }}>
                <pre style={{ color: '#69F0AE', fontSize: 12, lineHeight: 1.8, overflowX: 'auto' }}>
{`// 計算三點夾角 (P1-Vertex-P2)
function calculateAngle(p1, vertex, p2) {
  const v1 = { 
    x: p1.x - vertex.x, 
    y: p1.y - vertex.y 
  };
  const v2 = { 
    x: p2.x - vertex.x, 
    y: p2.y - vertex.y 
  };
  
  const dot = v1.x*v2.x + v1.y*v2.y;
  const mag1 = Math.sqrt(v1.x**2 + v1.y**2);
  const mag2 = Math.sqrt(v2.x**2 + v2.y**2);
  
  const cos = Math.max(-1, Math.min(1, 
    dot / (mag1 * mag2)));
  return Math.acos(cos) * (180 / Math.PI);
}

// 狀態判斷
if (|current - target| <= tolerance) → 'achieved'
if (current < target)               → 'below'
if (current > target)               → 'above'`}
                </pre>
              </div>
            </AccordionSection>

            {/* Future: Flutter/Native */}
            <div className="rounded-2xl p-4 shadow-sm" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F57F17', marginBottom: 6 }}>
                🚀 未來遷移至 Flutter + ML Kit
              </div>
              <div className="flex flex-col gap-2">
                {[
                  'Flutter: google_mlkit_pose_detection 套件',
                  'iOS: Vision Framework (Apple ARKit 輔助)',
                  'Android: MLKit Pose Detection API',
                  '離線推理：Core ML (iOS) / TFLite (Android)',
                  '延遲：原生 < 16ms vs Web ~33ms',
                  '支援：多人偵測 (MULTIPERSON_PERFORMANCE)',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span style={{ fontSize: 13, color: '#7C4D00' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}