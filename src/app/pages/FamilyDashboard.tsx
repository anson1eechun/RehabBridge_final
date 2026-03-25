// ============================================================
// FamilyDashboard — 家屬端
// Monitoring dashboard for family caregivers
// Shows patient progress, compliance, alerts, angle trends
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Bell, Activity, CheckCircle, AlertTriangle,
  TrendingUp, Calendar, Clock, Heart, ChevronRight, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid, Legend
} from 'recharts';
import {
  mockPatients, mockSessionRecords, mockNotifications,
  mockAngleProgress, mockWeeklyActivity
} from '../data/mockData';

const PATIENT = mockPatients[0];
const FAMILY_NAME = '王小美';

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'alerts'>('overview');
  const [unreadAlerts] = useState(mockNotifications.filter(n => !n.read).length);

  const recentSessions = mockSessionRecords
    .filter(s => s.patientId === PATIENT.id)
    .slice(0, 5);

  const lastSession = recentSessions[0];
  const avgScore = Math.round(recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length);

  return (
    <div className="min-h-screen" style={{ background: '#F4F7FC' }}>
      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg, #26A69A 0%, #00897B 100%)', paddingBottom: 28 }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/75 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span style={{ fontSize: 15 }}>返回</span>
          </button>
          <button className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Bell size={20} className="text-white" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center"
                style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>
                {unreadAlerts}
              </span>
            )}
          </button>
        </div>

        <div className="px-6 pt-3 pb-6">
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>歡迎，{FAMILY_NAME}</p>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
            {PATIENT.name} 的復健狀況
          </h1>

          {/* Status Chips */}
          <div className="flex gap-3 mt-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(178,255,228,0.2)', color: '#B2FFCE' }}>
              ● 活躍中
            </span>
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              主治：Dr. 陳志明
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-10" style={{ marginTop: -12 }}>
        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: '完成率', value: `${PATIENT.completionRate}%`, icon: CheckCircle, color: '#00897B', bg: '#E0F2F1' },
            { label: '平均分數', value: `${avgScore}分`, icon: TrendingUp, color: '#1976D2', bg: '#E3F2FD' },
            { label: '最高角度', value: `${lastSession?.maxAngle ?? 0}°`, icon: Activity, color: '#7B1FA2', bg: '#F3E5F5' },
            { label: '連續天數', value: '7天', icon: Heart, color: '#C62828', bg: '#FFEBEE' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 shadow-sm text-center"
                style={{ background: 'white' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: stat.bg }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2035' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#90A4AE' }}>{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
          {[
            { id: 'overview', label: '概覽' },
            { id: 'history', label: '訓練記錄' },
            { id: 'alerts', label: `通知 ${unreadAlerts > 0 ? `(${unreadAlerts})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#00897B' : '#90A4AE',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            {/* Angle Progress Chart */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1A2035' }}>膝蓋角度進展</h3>
                  <p style={{ fontSize: 12, color: '#78909C' }}>近 7 天 · 目標 120°</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                  +26° ↑ 進步中
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={mockAngleProgress} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00897B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00897B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 130]} tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1A2035', border: 'none', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: number) => [`${val}°`, '角度']}
                  />
                  <ReferenceLine y={120} stroke="#FFB300" strokeDasharray="4 4" strokeWidth={1.5}
                    label={{ value: '目標120°', fill: '#FFB300', fontSize: 11, position: 'right' }} />
                  <Area type="monotone" dataKey="angle" stroke="#00897B" strokeWidth={2.5}
                    fill="url(#tealGrad)" dot={{ fill: '#00897B', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Activity */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1A2035', marginBottom: 4 }}>本週訓練活動</h3>
              <p style={{ fontSize: 12, color: '#78909C', marginBottom: 16 }}>每日完成組數與時長</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={mockWeeklyActivity} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1A2035', border: 'none', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#90A4AE' }}
                  />
                  <Bar dataKey="sessions" name="訓練組數" fill="#00897B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="score" name="分數" fill="#B2DFDB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Latest Session */}
            {lastSession && (
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} style={{ color: '#00695C' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1A2035' }}>最近一次訓練</h3>
                  <span className="ml-auto text-sm" style={{ color: '#78909C' }}>{lastSession.date}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '持續時間', value: `${lastSession.duration}分鐘` },
                    { label: '完成次數', value: `${lastSession.completedReps}次` },
                    { label: '最高角度', value: `${lastSession.maxAngle}°` },
                    { label: '平均角度', value: `${lastSession.avgAngle}°` },
                    { label: '訓練分數', value: `${lastSession.score}分` },
                    { label: '語音提示', value: `${lastSession.voiceFeedbackCount}次` },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-3 text-center"
                      style={{ background: '#F8FAFB' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2035' }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: '#78909C' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-3">
            {recentSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 shadow-sm flex items-center gap-4"
                style={{ background: 'white' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: session.score >= 85 ? '#E8F5E9' : session.score >= 70 ? '#FFF3E0' : '#FFEBEE' }}>
                  <span style={{
                    fontSize: 16, fontWeight: 700,
                    color: session.score >= 85 ? '#2E7D32' : session.score >= 70 ? '#E65100' : '#C62828'
                  }}>
                    {session.score}
                  </span>
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2035' }}>{session.date}</div>
                  <div style={{ fontSize: 13, color: '#78909C' }}>
                    最高 {session.maxAngle}° · 完成 {session.completedReps}/{session.completedSets * 10}次 · {session.duration}分鐘
                  </div>
                </div>
                <div className="text-right">
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: session.maxAngle >= session.targetAngle ? '#2E7D32' : '#E65100'
                  }}>
                    {session.maxAngle >= session.targetAngle ? '✓ 達標' : `差 ${session.targetAngle - session.maxAngle}°`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="flex flex-col gap-3">
            {mockNotifications.map((notif, i) => {
              const colors = {
                success: { bg: '#E8F5E9', border: '#A5D6A7', icon: '#2E7D32' },
                warning: { bg: '#FFF3E0', border: '#FFCC02', icon: '#E65100' },
                info: { bg: '#E3F2FD', border: '#90CAF9', icon: '#1565C0' },
              };
              const c = colors[notif.type as keyof typeof colors] ?? colors.info;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl p-4 shadow-sm"
                  style={{
                    background: 'white',
                    borderLeft: `4px solid ${c.border}`,
                    opacity: notif.read ? 0.7 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: c.bg }}>
                      {notif.type === 'success' ? <CheckCircle size={16} style={{ color: c.icon }} /> :
                       notif.type === 'warning' ? <AlertTriangle size={16} style={{ color: c.icon }} /> :
                       <Info size={16} style={{ color: c.icon }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2035' }}>{notif.title}</span>
                        <span style={{ fontSize: 12, color: '#90A4AE' }}>{notif.time}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.5, marginTop: 3 }}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}