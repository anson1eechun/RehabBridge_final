// ============================================================
// RoleSelect — Entry Point / Role Selection Screen
// Supports: 長者端 · 家屬端 · 醫師端 · 系統藍圖
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router';
import { Activity, Users, Stethoscope, LayoutGrid, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';

const roles = [
  {
    id: 'patient',
    label: '長者端',
    sublabel: '復健訓練入口',
    description: '查看今日訓練計畫、進行 AI 輔助復健、追蹤進度',
    icon: Activity,
    path: '/patient',
    gradient: 'from-blue-500 to-blue-700',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-500',
    mockUser: '王大明',
    mockInfo: '72歲 · 右膝退化性關節炎',
  },
  {
    id: 'family',
    label: '家屬端',
    sublabel: '關懷監控入口',
    description: '即時掌握長輩訓練狀況、查看進度報告、接收通知',
    icon: Users,
    path: '/family',
    gradient: 'from-teal-500 to-teal-700',
    bgLight: 'bg-teal-50',
    border: 'border-teal-200',
    iconBg: 'bg-teal-500',
    mockUser: '王小美',
    mockInfo: '家屬（女兒）· 王大明的監護人',
  },
  {
    id: 'doctor',
    label: '醫師端',
    sublabel: '臨床管理入口',
    description: '管理患者處方、設定訓練目標、查閱分析報告',
    icon: Stethoscope,
    path: '/doctor',
    gradient: 'from-purple-500 to-purple-700',
    bgLight: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-500',
    mockUser: 'Dr. 陳志明',
    mockInfo: '復健科主治醫師 · 台大醫院',
  },
  {
    id: 'blueprint',
    label: '系統藍圖',
    sublabel: '開發設計規範',
    description: '系統架構圖、使用流程、UI 規範、ML Kit 設計',
    icon: LayoutGrid,
    path: '/blueprint',
    gradient: 'from-orange-500 to-orange-700',
    bgLight: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-500',
    mockUser: '開發團隊',
    mockInfo: 'RehabBridge v1.0 · 系統設計文件',
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F4F7FC' }}>
      {/* Header */}
      <header className="px-8 pt-12 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-md">
            <HeartPulse className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: '#1A2035' }}>
              RehabBridge
            </h1>
            <p style={{ fontSize: 14, color: '#78909C', lineHeight: 1.4 }}>
              AI 智慧復健追蹤系統
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p style={{ color: '#90A4AE', fontSize: 15 }}>請選擇角色入口</p>
        </motion.div>
      </header>

      {/* Role Cards */}
      <main className="flex-1 px-8 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-5 h-full">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                onClick={() => navigate(role.path)}
                className={`
                  group relative overflow-hidden rounded-3xl p-8 text-left
                  bg-white border hover:shadow-lg
                  transition-all duration-300 hover:scale-[1.02]
                  cursor-pointer
                `}
                style={{ minHeight: 200, borderColor: '#E8ECF4' }}
              >
                {/* Background tint on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} mb-5 shadow-md`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Labels */}
                <div className="mb-3 flex items-baseline gap-2">
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#1A2035', lineHeight: 1.2 }}>
                    {role.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#90A4AE' }}>
                    {role.sublabel}
                  </span>
                </div>

                {/* Mock user chip */}
                <div className="flex items-center gap-2 mt-auto">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                    <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>
                      {role.mockUser[0]}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
                      {role.mockUser}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="absolute right-6 bottom-6 opacity-20 group-hover:opacity-50 group-hover:translate-x-1 transition-all duration-200">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10h12M12 6l4 4-4 4" stroke="#1A2035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-6">
        <p style={{ fontSize: 12, color: '#B0BEC5' }}>
          RehabBridge v1.0 · 僅供開發測試使用
        </p>
      </footer>
    </div>
  );
}