// ============================================================
// PatientPortal — 長者端主頁
// Shows today's exercises, progress, quick stats
// Large fonts & touch targets for elderly usability
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, CheckCircle, Clock, Award, ChevronRight,
  ArrowLeft, Bell, Calendar, Flame, Target, Play
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  mockPatients, mockPrescriptions, mockExercises,
  mockSessionRecords, mockWeeklyActivity, mockAngleProgress
} from '../data/mockData';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const PATIENT = mockPatients[0]; // 王大明

export default function PatientPortal() {
  const navigate = useNavigate();
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return '早安';
    if (h < 18) return '午安';
    return '晚安';
  });

  // Get this patient's prescriptions → exercises
  const prescriptions = mockPrescriptions.filter(p => p.patientId === PATIENT.id);
  const exercises = prescriptions.map(rx => ({
    ...rx,
    exercise: mockExercises.find(e => e.id === rx.exerciseId)!,
  }));

  // Session records for today
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = mockSessionRecords.filter(
    s => s.patientId === PATIENT.id && s.date === today
  );

  const completedToday = todaySessions.length;
  const totalToday = exercises.length;
  const streakDays = 7;

  return (
    <div className="min-h-screen" style={{ background: '#F4F7FC' }}>
      {/* Top Bar */}
      <div style={{ background: 'linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)', paddingBottom: 32 }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: 15 }}>返回</span>
          </button>
          <button className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Bell size={20} className="text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
          </button>
        </div>

        <div className="px-6 pt-3 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16 }}>{greeting}，</p>
            <h1 style={{ color: 'white', fontSize: 30, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
              {PATIENT.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 4 }}>
              {PATIENT.diagnosis}
            </p>
          </motion.div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: '今日完成', value: `${completedToday}/${totalToday}`, icon: CheckCircle, color: '#B9F6CA' },
              { label: '連續天數', value: `${streakDays} 天`, icon: Flame, color: '#FFF9C4' },
              { label: '完成率', value: `${PATIENT.completionRate}%`, icon: Target, color: '#E0F7FA' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <Icon size={18} style={{ color: stat.color, margin: '0 auto 4px' }} />
                  <div style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-10" style={{ marginTop: -16 }}>

        {/* Today's Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-5 shadow-sm"
          style={{ background: 'white' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} style={{ color: '#1976D2' }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1A2035' }}>今日訓練進度</span>
            </div>
            <span style={{ fontSize: 13, color: '#78909C' }}>
              {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <div className="w-full rounded-full h-3" style={{ background: '#EEF2F7' }}>
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${(completedToday / totalToday) * 100}%`,
                background: 'linear-gradient(90deg, #42A5F5, #1976D2)'
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span style={{ fontSize: 13, color: '#78909C' }}>
              已完成 {completedToday} 項
            </span>
            <span style={{ fontSize: 13, color: '#1976D2', fontWeight: 600 }}>
              {Math.round((completedToday / totalToday) * 100)}%
            </span>
          </div>
        </motion.div>

        {/* Exercise List */}
        <div className="mb-5">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2035', marginBottom: 12 }}>
            今日訓練計畫
          </h2>
          <div className="flex flex-col gap-3">
            {exercises.map((item, index) => {
              const ex = item.exercise;
              if (!ex) return null;
              const isDone = todaySessions.some(s => s.exerciseId === ex.id);

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  onClick={() => navigate(`/patient/rehab/${ex.id}`)}
                  className="w-full rounded-2xl p-5 text-left flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
                  style={{
                    background: isDone ? '#F1F8E9' : 'white',
                    border: isDone ? '1.5px solid #C8E6C9' : '1.5px solid #ECF0F4',
                  }}
                >
                  {/* Status indicator */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: isDone ? '#E8F5E9' : '#EEF2F7' }}
                  >
                    {isDone
                      ? <CheckCircle size={24} style={{ color: '#43A047' }} />
                      : <Play size={24} style={{ color: '#1976D2' }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#1A2035' }}>
                        {ex.name}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: ex.difficulty === 'easy' ? '#E3F2FD' : ex.difficulty === 'medium' ? '#FFF3E0' : '#FCE4EC',
                          color: ex.difficulty === 'easy' ? '#1565C0' : ex.difficulty === 'medium' ? '#E65100' : '#C62828',
                        }}
                      >
                        {ex.difficulty === 'easy' ? '輕鬆' : ex.difficulty === 'medium' ? '中等' : '困難'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#78909C', lineHeight: 1.4 }}>
                      {item.sets} 組 × {item.reps} 次 · 目標 {item.targetAngle}°
                    </p>
                  </div>

                  <ChevronRight size={20} style={{ color: '#CFD8DC', flexShrink: 0 }} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Angle Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5 shadow-sm mb-5"
          style={{ background: 'white' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} style={{ color: '#1976D2' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1A2035' }}>膝蓋角度進展（7天）</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={mockAngleProgress} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="angleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#42A5F5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 130]} tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1A2035', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#90A4AE' }}
                itemStyle={{ color: '#69F0AE' }}
                formatter={(val: number) => [`${val}°`, '角度']}
              />
              <ReferenceLine y={120} stroke="#FFB300" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '目標', fill: '#FFB300', fontSize: 11, position: 'right' }} />
              <Area type="monotone" dataKey="angle" stroke="#42A5F5" strokeWidth={2.5} fill="url(#angleGrad)" dot={{ fill: '#42A5F5', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#1976D2' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Encouragement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #E3F2FD, #E8F5E9)' }}
        >
          <Award size={28} style={{ color: '#1976D2', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#1A2035' }}>做得很好！繼續保持！</p>
          <p style={{ fontSize: 13, color: '#546E7A', marginTop: 4 }}>
            膝蓋角度本週平均提升了 <strong style={{ color: '#1976D2' }}>8°</strong> 🎉
          </p>
        </motion.div>
      </div>
    </div>
  );
}