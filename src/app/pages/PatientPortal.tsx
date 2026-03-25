// ============================================================
// PatientPortal — 長者端主頁 (專業雙欄固定版)
// ============================================================
import { ChatWidget } from '../components/ChatWidget';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, CheckCircle, Clock, Award, ChevronRight,
  ArrowLeft, Bell, Calendar, Flame, Target, Play, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  mockPatients, mockPrescriptions, mockExercises,
  mockSessionRecords, mockAngleProgress
} from '../data/mockData';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const PATIENT = mockPatients[0]; // 王大明

export default function PatientPortal() {
  const navigate = useNavigate();
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return '早安';
    if (h < 18) return '午安';
    return '晚安';
  });

  const notifications = [
    { id: 1, title: '新處方', body: '陳醫師幫您新增了膝蓋彎曲訓練', time: '10分鐘前' },
    { id: 2, title: '目標達成', body: '太棒了！您已經連續運動 7 天', time: '2小時前' },
    { id: 3, title: '家屬關懷', body: '小美：爸，記得要做今天的復健喔！', time: '昨天' },
  ];

  const prescriptions = mockPrescriptions.filter(p => p.patientId === PATIENT.id);
  const exercises = prescriptions.map(rx => ({
    ...rx,
    exercise: mockExercises.find(e => e.id === rx.exerciseId)!,
  }));

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = mockSessionRecords.filter(
    s => s.patientId === PATIENT.id && s.date === today
  );

  const completedToday = todaySessions.length;
  const totalToday = exercises.length;
  const streakDays = 7;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
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
                    <p className="font-bold text-gray-800 text-sm">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.body}</p>
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
          >
            <Bell size={24} className="text-white" />
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-700" />
          </button>
        </div>
      </div>

      {/* ── 主佈覽區：雙欄排版 ── */}
      <div className="max-w-7xl mx-auto px-8 -mt-10 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 左側：核心功能與圖表 (佔據 1 flex) */}
          <div className="flex-1 space-y-6">
            
            {/* 數據小卡 */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '今日完成', value: `${completedToday}/${totalToday}`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                { label: '連續訓練', value: `${streakDays}天`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: '完成率', value: `${PATIENT.completionRate}%`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} p-4 rounded-3xl border border-white shadow-sm flex flex-col items-center`}>
                  <s.icon className={s.color} size={24} />
                  <span className="text-xl font-bold text-gray-800 mt-2 tabular-nums">{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>

            {/* 進度條卡片 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">今日進度</h3>
                  <p className="text-gray-400 text-sm">再完成 {totalToday - completedToday} 項就達標囉！</p>
                </div>
                <span className="text-2xl font-black text-blue-600">{Math.round((completedToday / totalToday) * 100)}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${(completedToday / totalToday) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                />
              </div>
            </div>

            {/* 訓練計畫清單 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 ml-2">今日訓練計畫</h3>
              {exercises.map((item, index) => {
                const ex = item.exercise;
                const isDone = todaySessions.some(s => s.exerciseId === ex.id);
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/patient/rehab/${ex.id}`)}
                    className={`w-full p-5 rounded-[1.5rem] flex items-center gap-4 transition-all shadow-sm ${isDone ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'} border`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDone ? 'bg-white' : 'bg-blue-50'}`}>
                      {isDone ? <CheckCircle className="text-green-500" /> : <Play className="text-blue-600" fill="currentColor" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-800 text-lg">{ex.name}</p>
                      <p className="text-gray-400 text-sm">{item.sets}組 x {item.reps}次 · 目標 {item.targetAngle}°</p>
                    </div>
                    <ChevronRight className="text-gray-300" />
                  </motion.button>
                );
              })}
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
          </div>

          {/* 右側：固定訊息面板 (佔據 400px) */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              {/* 聊天室組件 */}
              <div className="bg-white rounded-[2rem] shadow-xl border border-blue-50 overflow-hidden">
                <ChatWidget currentUserRole="patient" currentUserId="P001" />
              </div>

              {/* 激勵卡片 */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-lg">
                <Award className="mb-4 opacity-80" size={32} />
                <p className="font-bold text-xl">做得很好！</p>
                <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                  您的膝蓋角度本週平均提升了 8°，這對恢復非常有幫助。繼續保持，您正在變強！
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}