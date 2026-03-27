// ============================================================
// FamilyDashboard — 家屬端 (專業雙欄固定版)
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Bell, Activity, CheckCircle, TrendingUp, 
  Calendar, Heart, ChevronRight, X, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, LineChart, Line
} from 'recharts';
import {
  mockPatients, mockNotifications, mockAngleProgress, mockExercises
} from '../data/mockData';
import { useSessionRecords, buildWeeklyActivityFromSessions } from '../data/sessionStore';

const PATIENT = mockPatients[0]; // 王大明
const FAMILY_NAME = '王小美';

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'概覽' | '紀錄' | '通知'>('概覽');
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const sessionRecords = useSessionRecords();

  const unreadAlerts = mockNotifications.filter(n => !n.read).length;
  const patientSessions = sessionRecords.filter(s => s.patientId === PATIENT.id);
  const weeklyActivity = buildWeeklyActivityFromSessions(patientSessions);
  const recentSessions = patientSessions.slice(0, 10);

  const lastSession = recentSessions[0];
  const avgScore = Math.round(recentSessions.reduce((sum, s) => sum + s.score, 0) / (recentSessions.length || 1));
  const totalCareMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);
  const weeklyCompletionAvg = Math.round(
    weeklyActivity.reduce((sum, d) => sum + d.completion, 0) / (weeklyActivity.length || 1)
  );
  const weeklySessionCount = weeklyActivity.reduce((sum, d) => sum + d.sessions, 0);
  const careStability = Math.round((PATIENT.completionRate * 0.6) + (avgScore * 0.4));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* ── 彈出層：通知訊息面板 ── */}
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
                  <Bell size={20} className="text-teal-600" /> 最新通知
                </h2>
                <button onClick={() => setIsNotifyOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {mockNotifications.map(note => (
                  <div key={note.id} className={`p-4 rounded-2xl border ${note.read ? 'bg-gray-50' : 'bg-teal-50/30 border-teal-100'}`}>
                    <p className="font-bold text-gray-800 text-sm">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{note.time}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 頂部橫幅 ── */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 pt-8 pb-16 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex flex-nowrap items-center gap-2.5 text-white/85 hover:text-white mb-4 transition-colors text-2xl md:text-3xl font-bold min-h-[52px] w-fit rounded-full border-2 border-white/55 hover:border-white hover:bg-white/15 px-5 py-2.5 active:scale-[0.98] -ml-1"
            >
              <ArrowLeft size={30} strokeWidth={2.5} className="shrink-0" aria-hidden />
              <span className="whitespace-nowrap">返回</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold backdrop-blur-md border border-white/30">
                {PATIENT.avatar}
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold">家屬守護面板</h1>
                <p className="text-teal-100/60 text-sm mt-1">正在守護：{PATIENT.name}</p>
              </div>
            </div>
          </motion.div>
          
          <button
            onClick={() => setIsNotifyOpen(true)}
            className="relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
            aria-label={unreadAlerts > 0 ? '通知，有未讀訊息' : '通知'}
          >
            <Bell size={24} className="text-white" />
            {unreadAlerts > 0 && (
              <span
                className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-teal-800 shadow-[0_0_10px_rgba(239,68,68,0.95)]"
                aria-hidden
              />
            )}
          </button>
        </div>
      </div>

      {/* ── 主佈局區 ── */}
      <div className="max-w-7xl mx-auto px-8 -mt-10 pb-12">
        <div className="space-y-6">
          
          {/* 數據分析與頁籤 */}
          <div className="space-y-6 w-full">
            
            {/* 核心指標卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: '完成率', value: `${PATIENT.completionRate}%`, icon: CheckCircle, color: '#00897B', bg: '#E0F2F1' },
                { label: '平均分數', value: `${avgScore}`, icon: TrendingUp, color: '#1976D2', bg: '#E3F2FD' },
                { label: '最高角度', value: `${lastSession?.maxAngle ?? 0}°`, icon: Activity, color: '#7B1FA2', bg: '#F3E5F5' },
                { label: '連續天數', value: '7天', icon: Heart, color: '#C62828', bg: '#FFEBEE' },
                { label: '本週總時長', value: `${totalCareMinutes}分`, icon: Calendar, color: '#6D4C41', bg: '#EFEBE9' },
                { label: '守護穩定度', value: `${careStability}%`, icon: Bell, color: '#00838F', bg: '#E0F7FA' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: stat.bg }}>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <div className="text-xl font-bold text-gray-800 tabular-nums">{stat.value}</div>
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* 頁籤切換 */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
              {(['概覽', '紀錄', '通知'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-400'}`}
                >
                  {tab === '概覽' ? (
                    '進度概覽'
                  ) : tab === '紀錄' ? (
                    '訓練記錄'
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      通知
                      {unreadAlerts > 0 && (
                        <span
                          className="shrink-0 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                          aria-hidden
                        />
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 內容區：根據頁籤切換 */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="min-h-[400px]">
                
                {activeTab === '概覽' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-teal-600" /> 膝蓋角度進展
                      </h3>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockAngleProgress}>
                            <defs>
                              <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00897B" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#00897B" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="angle" stroke="#00897B" strokeWidth={3} fill="url(#tealGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-teal-600" /> 本週訓練活動
                      </h3>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyActivity}>
                            <Bar dataKey="sessions" fill="#00897B" radius={[6, 6, 0, 0]} barSize={40} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                            <Tooltip cursor={{fill: '#F8FAFB'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800">照護品質分析</h3>
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">家庭觀測</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                          { label: '週平均達標', value: `${weeklyCompletionAvg}%` },
                          { label: '本週總訓練', value: `${weeklySessionCount}次` },
                          { label: '未讀提醒', value: `${unreadAlerts}則` },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-gray-50 p-3 text-center">
                            <div className="text-sm text-gray-400">{item.label}</div>
                            <div className="text-xl font-bold text-gray-800 mt-1">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Line type="monotone" dataKey="completion" stroke="#00897B" strokeWidth={2.5} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="sessions" stroke="#1976D2" strokeWidth={2.5} dot={{ r: 3 }} />
                            <ReferenceLine y={80} stroke="#FFA726" strokeDasharray="3 3" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === '紀錄' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xl font-bold text-gray-700">近期復健</h4>
                      <span className="text-lg font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                        共 {recentSessions.length} 筆
                      </span>
                    </div>
                    {recentSessions.length > 0 ? (
                      <div className="max-h-[440px] overflow-y-auto pr-1 space-y-3">
                        {recentSessions.map((session) => {
                          const exerciseName =
                            mockExercises.find((exercise) => exercise.id === session.exerciseId)?.name ??
                            '未命名動作';
                          return (
                            <div key={session.id} className="bg-transparent p-5 min-h-24 rounded-2xl border border-gray-200/80 flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl ${session.score >= 85 ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'}`}>
                                {session.score}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-800 text-xl">
                                  {exerciseName}
                                </p>
                                <p className="text-lg text-gray-500 mt-1">
                                  {session.date} · {session.completedReps}次 · {session.duration}分
                                </p>
                              </div>
                              <div className="text-xl font-bold text-blue-700">
                                {session.maxAngle}°
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-transparent p-5 rounded-2xl border border-gray-200/80 text-xl text-gray-400">
                        目前尚無訓練紀錄。
                      </div>
                    )}
                  </div>
                )}

                {activeTab === '通知' && (
                  <div className="space-y-3">
                    {mockNotifications.map(note => (
                      <div key={note.id} className={`p-5 rounded-2xl border-l-4 bg-white shadow-sm ${note.type === 'warning' ? 'border-orange-400' : 'border-teal-400'}`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-gray-800 text-sm">{note.title}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{note.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{note.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 提醒卡片 */}
          <div className="bg-gradient-to-br from-indigo-600 to-teal-700 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden">
            <Award className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20" />
            <div className="relative z-10">
              <p className="font-bold text-xl">全能守護者</p>
              <p className="text-white/80 text-sm mt-2 leading-relaxed">
                王大明 今天的訓練量已達標！陳醫師建議這兩天可以帶他去戶外走走，增加腿部耐力。
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}