// ============================================================
// DoctorPortal — 醫師端 (功能增強版：保留原色調與數據)
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Users, Activity, BarChart3, Settings,
  ChevronRight, Target, Plus, Edit3, TrendingUp,
  AlertCircle, CheckCircle, Clock, Stethoscope, Save, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, ReferenceLine
} from 'recharts';
import {
  mockPatients, mockPrescriptions, mockExercises,
  mockSessionRecords, mockDoctors, mockSystemStats
} from '../data/mockData';

const DOCTOR = mockDoctors[0];

export default function DoctorPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'patients' | 'analytics' | 'prescriptions'>('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [editingRx, setEditingRx] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ targetAngle: number; reps: number; sets: number }>({ targetAngle: 90, reps: 10, sets: 3 });

  // --- 新增：處理「新增處方」彈窗的狀態 ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRx, setNewRx] = useState({ exerciseId: 'knee_flexion', targetAngle: 90, reps: 10, sets: 3 });

  const patients = mockPatients.filter(p => p.doctorId === DOCTOR.id);

  const analyticsData = [
    { name: '王大明', compliance: 85, avgAngle: 118, target: 120, score: 89 },
    { name: '李秀英', compliance: 72, avgAngle: 85, target: 90, score: 82 },
    { name: '陳阿蘭', compliance: 45, avgAngle: 65, target: 90, score: 61 },
  ];

  const radarData = [
    { metric: '完成率', A: 85, B: 72, C: 45 },
    { metric: '角度達標', A: 92, B: 78, C: 52 },
    { metric: '訓練分數', A: 89, B: 82, C: 61 },
    { metric: '連續天數', A: 95, B: 68, C: 40 },
    { metric: '語音反應', A: 80, B: 75, C: 55 },
  ];

  const selectedPatientData = selectedPatient ? mockPatients.find(p => p.id === selectedPatient) : null;
  const selectedPrescriptions = selectedPatient ? mockPrescriptions.filter(p => p.patientId === selectedPatient) : [];
  const selectedSessions = selectedPatient ? mockSessionRecords.filter(s => s.patientId === selectedPatient) : [];

  const handleEditRx = (rxId: string) => {
    const rx = mockPrescriptions.find(p => p.id === rxId);
    if (rx) {
      setEditValues({ targetAngle: rx.targetAngle, reps: rx.reps, sets: rx.sets });
      setEditingRx(rxId);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#F4F7FC' }}>
      
      {/* ── 新增處方彈出視窗 (Modal) ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" 
              style={{ background: 'white' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#5E35B1' }}>新增復健處方</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400"><X size={20} /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">運動項目</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 font-bold text-gray-700"
                    value={newRx.exerciseId}
                    onChange={(e) => setNewRx({...newRx, exerciseId: e.target.value})}
                  >
                    {mockExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">目標角度 (°)</label>
                    <input type="number" className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50" 
                      value={newRx.targetAngle} onChange={(e) => setNewRx({...newRx, targetAngle: parseInt(e.target.value)})}/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">每組次數</label>
                    <input type="number" className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50"
                      value={newRx.reps} onChange={(e) => setNewRx({...newRx, reps: parseInt(e.target.value)})}/>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100">取消</button>
                <button 
                  onClick={() => { alert('處方已成功發布！'); setIsAddModalOpen(false); }}
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg" 
                  style={{ background: '#5E35B1' }}
                >
                  確認儲存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div style={{ background: 'linear-gradient(135deg, #7E57C2 0%, #5E35B1 100%)', paddingBottom: 28 }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span style={{ fontSize: 15 }}>返回</span>
          </button>
        </div>

        <div className="px-6 pt-2 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Stethoscope size={24} className="text-white" />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>復健科主治醫師</p>
              <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                Dr. {DOCTOR.name}
              </h1>
            </div>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '管理患者', value: patients.length, suffix: '位' },
              { label: '平均完成率', value: Math.round(mockSystemStats.avgCompletionRate), suffix: '%' },
              { label: '累計訓練', value: mockSystemStats.totalSessions, suffix: '次' },
              { label: '平均分數', value: Math.round(mockSystemStats.avgScore), suffix: '分' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>
                  {stat.value}<span style={{ fontSize: 13 }}>{stat.suffix}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-10" style={{ marginTop: -12 }}>
        {/* Tab Nav */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl shadow-sm" style={{ background: 'white' }}>
          {[
            { id: 'patients', label: '患者管理', icon: Users },
            { id: 'analytics', label: '數據分析', icon: BarChart3 },
            { id: 'prescriptions', label: '處方設定', icon: Target },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedPatient(null); }}
                className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                style={{
                  background: activeTab === tab.id ? '#5E35B1' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#90A4AE',
                  fontSize: 14, fontWeight: 600,
                }}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Patients Tab ─────────────────────────────── */}
        {activeTab === 'patients' && (
          <div>
            {!selectedPatient ? (
              <div className="flex flex-col gap-3">
                {patients.map((patient, i) => (
                  <motion.button
                    key={patient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setSelectedPatient(patient.id)}
                    className="w-full rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all"
                    style={{ background: 'white' }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)', fontSize: 20, color: 'white', fontWeight: 700 }}>
                        {patient.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A2035' }}>{patient.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: patient.completionRate >= 80 ? '#E8F5E9' : patient.completionRate >= 60 ? '#FFF3E0' : '#FFEBEE',
                              color: patient.completionRate >= 80 ? '#2E7D32' : patient.completionRate >= 60 ? '#E65100' : '#C62828',
                            }}>
                            完成率 {patient.completionRate}%
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#546E7A' }}>
                          {patient.age}歲 · {patient.gender} · {patient.diagnosis}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span style={{ fontSize: 12, color: '#90A4AE' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                            最後訓練 {patient.lastSessionDate}
                          </span>
                        </div>
                        <div className="mt-2 w-full rounded-full h-2" style={{ background: '#EEF2F7' }}>
                          <div className="h-2 rounded-full transition-all"
                            style={{
                              width: `${patient.completionRate}%`,
                              background: patient.completionRate >= 80 ? '#43A047' : patient.completionRate >= 60 ? '#FB8C00' : '#E53935'
                            }} />
                        </div>
                      </div>
                      <ChevronRight size={20} style={{ color: '#B0BEC5' }} />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedPatient(null)}
                  className="flex items-center gap-2 mb-4 text-purple-700 hover:text-purple-900 transition-colors">
                  <ArrowLeft size={16} /> 返回患者列表
                </button>

                {selectedPatientData && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)', fontSize: 24, color: 'white', fontWeight: 700 }}>
                          {selectedPatientData.avatar}
                        </div>
                        <div>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A2035' }}>{selectedPatientData.name}</h2>
                          <p style={{ fontSize: 14, color: '#546E7A' }}>{selectedPatientData.age}歲 · {selectedPatientData.diagnosis}</p>
                          <p style={{ fontSize: 13, color: '#90A4AE', marginTop: 2 }}>家屬聯絡：{selectedPatientData.familyContact}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A2035' }}>目前處方</h3>
                        <button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"
                          style={{ background: '#EDE7F6', color: '#4A148C' }}>
                          <Plus size={14} /> 新增處方
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {selectedPrescriptions.map(rx => {
                          const ex = mockExercises.find(e => e.id === rx.exerciseId);
                          const isEditing = editingRx === rx.id;
                          return (
                            <div key={rx.id} className="rounded-xl p-4"
                              style={{ background: '#F8F4FF', border: '1px solid #E1D5FF' }}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1A2035' }}>{ex?.name}</span>
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: '#EDE7F6', color: '#7B1FA2' }}>{rx.frequency}</span>
                                </div>
                                <button onClick={() => isEditing ? setEditingRx(null) : handleEditRx(rx.id)} className="p-1.5 rounded-lg hover:bg-purple-100"><Edit3 size={15} style={{ color: '#7B1FA2' }} /></button>
                              </div>
                              {isEditing ? (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                  <div className="grid grid-cols-3 gap-3 mb-3">
                                    {[{ label: '目標角度', key: 'targetAngle' }, { label: '每組次數', key: 'reps' }, { label: '組數', key: 'sets' }].map(field => (
                                      <div key={field.key}>
                                        <label className="text-[10px] text-gray-400 block mb-1">{field.label}</label>
                                        <input type="number" value={editValues[field.key as keyof typeof editValues]} onChange={e => setEditValues(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))} className="w-full rounded-lg px-2 py-2 border border-purple-200 text-sm font-bold text-purple-700"/>
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={() => setEditingRx(null)} className="w-full py-2 rounded-lg text-white font-bold text-xs" style={{ background: '#4A148C' }}><Save size={12} className="inline mr-1" />儲存</button>
                                </motion.div>
                              ) : (
                                <div className="grid grid-cols-4 gap-2">
                                  {[{ label: '角度', value: `${rx.targetAngle}°` }, { label: '組數', value: `${rx.sets}組` }, { label: '次數', value: `${rx.reps}次` }, { label: '保持', value: `${rx.holdSeconds}s` }].map(item => (
                                    <div key={item.label} className="rounded-lg p-2 text-center bg-white">
                                      <div style={{ fontSize: 13, fontWeight: 700, color: '#4A148C' }}>{item.value}</div>
                                      <div style={{ fontSize: 10, color: '#90A4AE' }}>{item.label}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab (保留完整 Recharts) ── */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A2035', marginBottom: 4 }}>患者完成率比較</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={analyticsData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#90A4AE' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1A2035', border: 'none', borderRadius: 8, fontSize: 12, color: 'white' }} />
                  <Bar dataKey="compliance" fill="#7B1FA2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="score" fill="#CE93D8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A2035', marginBottom: 12 }}>多維度評估</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E8ECF0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#546E7A' }} />
                  <Radar name="王大明" dataKey="A" stroke="#7B1FA2" fill="#7B1FA2" fillOpacity={0.15} />
                  <Radar name="李秀英" dataKey="B" stroke="#1565C0" fill="#1565C0" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Prescriptions Tab (保留原有的所有患者處方一覽) ── */}
        {activeTab === 'prescriptions' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4 shadow-sm flex items-start gap-3" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }}>
              <AlertCircle size={18} style={{ color: '#F57C00', marginTop: 2 }} />
              <p style={{ fontSize: 13, color: '#7C4D00', lineHeight: 1.5 }}>在此可調整各患者的角度目標。變更後將立即反映至長者端。</p>
            </div>
            {patients.map(patient => (
              <div key={patient.id} className="rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #EDE7F6, #E8EAF6)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: '#7B1FA2' }}>{patient.avatar}</div>
                    <span className="font-bold text-gray-700">{patient.name}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {mockPrescriptions.filter(p => p.patientId === patient.id).map(rx => (
                    <div key={rx.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">{mockExercises.find(e => e.id === rx.exerciseId)?.name}</span>
                      <span className="font-bold text-purple-700">{rx.targetAngle}° | {rx.sets}x{rx.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}