// ============================================================
// PatientPortal — 長者端主頁 (專業雙欄固定版)
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, CheckCircle, Clock, Award, ChevronRight,
  ArrowLeft, Bell, Calendar, Flame, Target, Play, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  mockPatients, mockPrescriptions, mockExercises,
  mockAngleProgress
} from '../data/mockData';
import { useSessionRecords, buildWeeklyActivityFromSessions } from '../data/sessionStore';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, CartesianGrid, LineChart, Line
} from 'recharts';

const PATIENT = mockPatients[0]; // 王大明

export default function PatientPortal() {
  const navigate = useNavigate();
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const sessionRecords = useSessionRecords();

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return '早安';
    if (h < 18) return '午安';
    return '晚安';
  });

  const notifications = [
    { id: 1, title: '新處方', body: '陳醫師幫您新增了膝蓋彎曲訓練', time: '10 分鐘前' },
    { id: 2, title: '目標達成', body: '太棒了！您已經連續運動 7 天', time: '2 小時前' },
    { id: 3, title: '家屬關懷', body: '小美：爸，記得要做今天的復健喔！', time: '昨天' },
    { id: 4, title: '訓練提醒', body: '晚餐後是您習慣的第二次訓練時段，先做 3 分鐘暖身再開始。', time: '30 分鐘前' },
    { id: 5, title: '回診提醒', body: '下週三 10:30 與陳醫師視訊回診，請預留約 20 分鐘並準備好平板。', time: '昨天 18:00' },
    { id: 6, title: '語音教練更新', body: '台語語音說明已更新，進入動作頁可按「說明」重聽要點。', time: '2 天前' },
    { id: 7, title: '本週小結', body: '本週您完成訓練 12 次，平均得分 84 分，比上週進步 3 分。', time: '3 天前' },
    { id: 8, title: '安全小叮嚀', body: '訓練時請穿防滑鞋、地面保持乾燥；若頭暈請先坐下休息。', time: '4 天前' },
    { id: 9, title: '成就解鎖', body: '恭喜獲得「一週全勤」徽章，繼續保持！', time: '上週日' },
    { id: 10, title: '治療師留言', body: '黃治療師：抬腿時腳尖朝上、膝蓋盡量打直，有問題可傳訊息問我。', time: '上週五' },
    { id: 11, title: '系統公告', body: '週日凌晨 2:00–4:00 進行維護，期間雲端同步暫停，本機仍可練習。', time: '上週四' },
    { id: 12, title: '處方微調', body: '髖關節外展目標角度已調整為 35°，請依畫面提示練習。', time: '上週三' },
  ];

  const prescriptions = mockPrescriptions.filter(p => p.patientId === PATIENT.id);
  const exercises = mockExercises.map((exercise) => {
    const matchedRx = prescriptions.find((rx) => rx.exerciseId === exercise.id);
    return {
      id: matchedRx?.id ?? `AUTO-${exercise.id}`,
      exercise,
      sets: matchedRx?.sets ?? exercise.sets,
      reps: matchedRx?.reps ?? exercise.reps,
      targetAngle: matchedRx?.targetAngle ?? exercise.targetAngle,
      holdSeconds: matchedRx?.holdSeconds ?? exercise.holdSeconds,
      frequency: matchedRx?.frequency ?? '每天一次',
      source: matchedRx ? 'prescription' : 'catalog',
    };
  });
  const categoryOrder: Record<string, number> = {
    下肢: 0,
    上肢: 1,
    核心: 2,
  };
  const sortedExercises = [...exercises].sort((a, b) => {
    const aOrder = categoryOrder[a.exercise.category] ?? 99;
    const bOrder = categoryOrder[b.exercise.category] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.exercise.name.localeCompare(b.exercise.name, 'zh-Hant');
  });

  // 今日計畫固定最多 6 項，且「下肢、上肢、核心」只要有處方／目錄項目就各至少出現 1 個，其餘名額輪流補滿。
  // 顯示順序仍為：下肢整段 → 上肢整段 → 核心整段。
  const lowerLimb = sortedExercises.filter((item) => item.exercise.category === '下肢');
  const upperLimb = sortedExercises.filter((item) => item.exercise.category === '上肢');
  const coreLimb = sortedExercises.filter((item) => item.exercise.category === '核心');
  const DISPLAY_PLAN_COUNT = 6;
  const limbBuckets = [
    { items: lowerLimb },
    { items: upperLimb },
    { items: coreLimb },
  ].filter((b) => b.items.length > 0);

  const picked: typeof sortedExercises = [];
  const bucketIdx = limbBuckets.map(() => 0);
  while (picked.length < DISPLAY_PLAN_COUNT) {
    let progressed = false;
    for (let b = 0; b < limbBuckets.length && picked.length < DISPLAY_PLAN_COUNT; b++) {
      const i = bucketIdx[b];
      if (i < limbBuckets[b].items.length) {
        picked.push(limbBuckets[b].items[i]);
        bucketIdx[b]++;
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  const displayExercises = [
    ...picked.filter((item) => item.exercise.category === '下肢'),
    ...picked.filter((item) => item.exercise.category === '上肢'),
    ...picked.filter((item) => item.exercise.category === '核心'),
  ];
  const displayExerciseOrder = new Map(
    displayExercises.map((item, index) => [item.exercise.id, index])
  );

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessionRecords.filter(
    s => s.patientId === PATIENT.id && s.date === today
  );

  const plannedExerciseIds = new Set(displayExercises.map((item) => item.exercise.id));
  const completedToday = new Set(
    todaySessions.filter((s) => plannedExerciseIds.has(s.exerciseId)).map((s) => s.exerciseId)
  ).size;
  const totalToday = displayExercises.length;
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const todayAvgScore = Math.round(
    todaySessions.reduce((sum, s) => sum + s.score, 0) / (todaySessions.length || 1)
  );
  const todayBestAngle = Math.max(...todaySessions.map((s) => s.maxAngle), 0);
  const streakDays = 7;
  const patientSessions = sessionRecords.filter(s => s.patientId === PATIENT.id);
  const recentPatientSessions = [...patientSessions]
    .sort((a, b) => {
      const aOrder = displayExerciseOrder.get(a.exerciseId) ?? 999;
      const bOrder = displayExerciseOrder.get(b.exerciseId) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 10);
  const weeklyActivity = buildWeeklyActivityFromSessions(patientSessions);
  const avgAngle = Math.round(
    patientSessions.reduce((sum, s) => sum + s.avgAngle, 0) / (patientSessions.length || 1)
  );
  const maxAngle = Math.max(...patientSessions.map((s) => s.maxAngle), 0);
  const totalMinutes = patientSessions.reduce((sum, s) => sum + s.duration, 0);
  const avgScore = Math.round(
    patientSessions.reduce((sum, s) => sum + s.score, 0) / (patientSessions.length || 1)
  );
  const avgSessionMinutes = Math.round(totalMinutes / (patientSessions.length || 1));
  const weeklySessions = weeklyActivity.reduce((sum, day) => sum + day.sessions, 0);
  const weeklyCompletionAvg = Math.round(
    weeklyActivity.reduce((sum, day) => sum + day.completion, 0) / (weeklyActivity.length || 1)
  );
  const recoveryConfidence = Math.min(
    99,
    Math.round((PATIENT.completionRate * 0.45) + (avgScore * 0.35) + (Math.min(avgAngle, 120) / 120) * 20)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] [&_.text-xs]:text-lg [&_.text-sm]:text-xl [&_.text-base]:text-2xl [&_.text-lg]:text-3xl [&_.text-xl]:text-3xl [&_.text-2xl]:text-4xl">
      
      {/* ── 彈出層：通知面板 ── */}
      <AnimatePresence>
        {isNotifyOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsNotifyOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-80 bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Bell size={20} className="text-blue-500" /> 最新通知
                </h2>
                <button onClick={() => setIsNotifyOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.map(note => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-gray-800 text-xl">{note.title}</p>
                    <p className="text-lg text-gray-500 mt-1">{note.body}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{note.time}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 頂部橫幅 ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 pt-8 pb-16 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
              <ArrowLeft size={18} /> <span>返回</span>
            </button>
            <p className="text-blue-100 text-lg">{greeting}，</p>
            <h1 className="text-white text-4xl font-bold mt-1">{PATIENT.name}</h1>
          </motion.div>
          
          <button 
            onClick={() => setIsNotifyOpen(true)}
            className="relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
            aria-label={notifications.length > 0 ? '通知，有新訊息' : '通知'}
          >
            <Bell size={24} className="text-white" />
            {notifications.length > 0 && (
              <span
                className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-blue-800 shadow-[0_0_10px_rgba(239,68,68,0.95)]"
                aria-hidden
              />
            )}
          </button>
        </div>
      </div>

      {/* ── 主佈覽區 ── */}
      <div className="max-w-7xl mx-auto px-8 -mt-10 pb-12">
        <div className="space-y-6">
            
            {/* 數據小卡 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: '今日完成', value: `${completedToday}/${totalToday}`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                { label: '連續訓練', value: `${streakDays}天`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: '完成率', value: `${PATIENT.completionRate}%`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: '週訓練次數', value: `${weeklySessions}次`, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: '恢復信心', value: `${recoveryConfidence}%`, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} p-4 rounded-3xl border border-white shadow-sm flex flex-col items-center`}>
                  <s.icon className={s.color} size={24} />
                  <span className="text-xl font-bold text-gray-800 mt-2 tabular-nums">{s.value}</span>
                  <span className="text-lg text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>

            {/* 今日訓練計畫 + 近期訓練紀錄（整合置頂） */}
            <div className="bg-white p-5 sm:p-6 rounded-[1.75rem] shadow-sm border border-gray-100">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-5">
                <div className="min-w-0">
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight leading-tight">
                    今日訓練計畫
                  </h3>
                  <p className="text-lg md:text-xl text-gray-500 mt-1.5 font-medium leading-snug">
                    先看目標，再開始偵測。
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center self-start text-base md:text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-full">
                  共 {displayExercises.length} 項
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5">
                {displayExercises.map((item) => {
                  const ex = item.exercise;
                  const isDone = todaySessions.some((s) => s.exerciseId === ex.id);
                  const categoryTheme: Record<string, { bg: string; mark: string }> = {
                    上肢: { bg: 'from-sky-100/70 to-blue-50/70', mark: '💪' },
                    下肢: { bg: 'from-emerald-100/70 to-teal-50/70', mark: '🦵' },
                    核心: { bg: 'from-amber-100/70 to-orange-50/70', mark: '🧘' },
                  };
                  const theme = categoryTheme[ex.category] ?? { bg: 'from-slate-100/70 to-slate-50/70', mark: '🏃' };

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/patient/rehab/${ex.id}`)}
                      className={`relative overflow-hidden p-5 sm:p-6 min-h-[11.5rem] sm:min-h-[12.5rem] md:min-h-52 rounded-2xl text-left transition-all shadow-md border ${
                        isDone ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'
                      }`}
                    >
                      {!isDone && (
                        <>
                          <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`} />
                          <div
                            className="pointer-events-none absolute -right-2 -bottom-3 leading-[0.85] opacity-[0.24] select-none text-[6.25rem] sm:text-[7.5rem] md:text-[9rem]"
                          >
                            {theme.mark}
                          </div>
                        </>
                      )}
                      <div className="relative flex items-center gap-3 sm:gap-4 h-full min-h-[3.5rem]">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 flex items-center justify-center shadow-sm border ${
                            isDone ? 'bg-white border-green-100' : 'bg-white border-blue-100'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle className="text-green-600" size={32} strokeWidth={2.25} />
                          ) : (
                            <Play className="text-blue-600" size={32} fill="currentColor" strokeWidth={2.25} />
                          )}
                        </div>
                        <p className="font-bold text-gray-800 text-[1.46rem] sm:text-[1.625rem] md:text-[1.95rem] leading-tight flex-1 min-w-0">
                          {ex.name}
                        </p>
                        <ChevronRight className="text-gray-400 shrink-0" size={28} strokeWidth={2.25} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 進度條卡片 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">今日進度</h3>
                  <p className="text-gray-400 text-lg">
                    再完成 {Math.max(0, totalToday - completedToday)} 項就達標囉！
                  </p>
                </div>
                <span className="text-2xl font-black text-blue-600">
                  {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}%
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{
                    width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%`,
                  }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                />
              </div>
            </div>

            {/* 近期復健 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-2xl font-bold text-gray-700">近期復健</h4>
                <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  最近 {recentPatientSessions.length} 筆
                </span>
              </div>

              {recentPatientSessions.length > 0 ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {recentPatientSessions.map((session) => {
                    const exName = mockExercises.find((e) => e.id === session.exerciseId)?.name ?? '未命名動作';
                    return (
                      <div key={session.id} className="rounded-xl border border-gray-100 px-4 py-4 min-h-24 bg-white">
                        <p className="text-2xl font-semibold text-gray-800">{exName}</p>
                        <p className="text-lg text-gray-600 mt-1">
                          {session.date} · {session.completedReps}次 · {session.duration}分
                        </p>
                        <p className="text-xl text-blue-700 font-semibold mt-0.5">{session.maxAngle}° · {session.score}分</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xl text-gray-400">目前尚無訓練紀錄。</p>
              )}
            </div>

            {/* 今日紀錄 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">今日紀錄</h3>
                <span className="text-lg font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">
                  {today}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: '今日時長', value: `${todayMinutes} 分` },
                  { label: '平均分數', value: todaySessions.length ? `${todayAvgScore}` : '--' },
                  { label: '最佳角度', value: todaySessions.length ? `${todayBestAngle}°` : '--' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                    <div className="text-base text-gray-400 font-bold">{item.label}</div>
                    <div className="text-2xl font-black text-gray-800 mt-1 tabular-nums">{item.value}</div>
                  </div>
                ))}
              </div>

              {todaySessions.length > 0 ? (
                <div className="space-y-2">
                  {todaySessions.slice(0, 6).map((session) => {
                    const exName = mockExercises.find((e) => e.id === session.exerciseId)?.name ?? '未命名動作';
                    return (
                      <div key={session.id} className="rounded-xl border border-gray-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-xl font-semibold text-gray-700">{exName}</span>
                        <span className="text-lg text-gray-500">
                          {session.completedSets}組/{session.completedReps}次 · {session.maxAngle}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xl text-gray-400">今天還沒有完成訓練紀錄，開始第一個動作吧。</p>
              )}
            </div>

            {/* 圖表卡片 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-blue-600" size={20} />
                <h3 className="font-bold text-gray-800">復健趨勢</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockAngleProgress}>
                    <defs>
                      <linearGradient id="pColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="angle" stroke="#3B82F6" strokeWidth={3} fill="url(#pColor)" />
                    <ReferenceLine y={115} stroke="#F59E0B" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 進階分析卡 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl font-bold text-gray-800">進階分析</h3>
                <span className="text-lg font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">最近 7 天</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: '平均角度', value: `${avgAngle}°`, tone: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: '最高角度', value: `${maxAngle}°`, tone: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: '總訓練時長', value: `${totalMinutes} 分`, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: '平均分數', value: `${avgScore}`, tone: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: '平均每次時長', value: `${avgSessionMinutes} 分`, tone: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: '週平均達標', value: `${weeklyCompletionAvg}%`, tone: 'text-pink-600', bg: 'bg-pink-50' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl border border-gray-100 p-3">
                    <div className={`inline-flex px-2.5 py-1.5 rounded-lg text-base font-bold ${kpi.bg} ${kpi.tone}`}>
                      {kpi.label}
                    </div>
                    <div className="mt-2 text-2xl font-black text-gray-800 tabular-nums">{kpi.value}</div>
                  </div>
                ))}
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 12px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="sessions" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    <ReferenceLine y={4} stroke="#F59E0B" strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-44 w-full mt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Line type="monotone" dataKey="completion" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="duration" stroke="#14B8A6" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 激勵卡片 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-lg">
              <Award className="mb-4 opacity-80" size={32} />
              <p className="font-bold text-xl">做得很好！</p>
              <p className="text-blue-100 text-lg mt-2 leading-relaxed">
                您的膝蓋角度本週平均提升了 8°，這對恢復非常有幫助。繼續保持，您正在變強！
              </p>
            </div>
          </div>
      </div>
    </div>
  );
}