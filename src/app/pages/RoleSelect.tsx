// ============================================================
// RoleSelect — Entry Point / Role Selection Screen
// 強化版：全畫面流體漸層背景 + 裝飾性光暈
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router';
import { Activity, Users, Stethoscope, LayoutGrid, ChevronRight } from 'lucide-react';

const roles = [
  {
    id: 'patient',
    label: '長者端',
    sublabel: '復健訓練入口',
    description: '查看今日訓練計畫、進行 AI 輔助復健、追蹤進度',
    icon: Activity,
    path: '/patient',
    gradient: 'from-blue-500 to-blue-700',
    shadow: 'shadow-blue-100',
    mockUser: '王大明',
  },
  {
    id: 'family',
    label: '家屬端',
    sublabel: '關懷監控入口',
    description: '即時掌握長輩訓練狀況、查看進度報告、接收通知',
    icon: Users,
    path: '/family',
    gradient: 'from-teal-500 to-teal-700',
    shadow: 'shadow-teal-100',
    mockUser: '王小美',
  },
  {
    id: 'doctor',
    label: '醫師端',
    sublabel: '臨床管理入口',
    description: '管理患者處方、設定訓練目標、查閱分析報告',
    icon: Stethoscope,
    path: '/doctor',
    gradient: 'from-purple-500 to-purple-700',
    shadow: 'shadow-purple-100',
    mockUser: 'Dr. 陳志明',
  },
  {
    id: 'blueprint',
    label: '系統藍圖',
    sublabel: '開發設計規範',
    description: '系統架構圖、使用流程、UI 規範、ML Kit 設計',
    icon: LayoutGrid,
    path: '/blueprint',
    gradient: 'from-orange-500 to-orange-700',
    shadow: 'shadow-orange-100',
    mockUser: '開發團隊',
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="h-full relative overflow-x-hidden flex flex-col" 
      // 這裡加強了背景漸層的色彩濃度，從淡藍到粉紫
      style={{ background: 'linear-gradient(145deg, #F0F4FF 0%, #FDF2F8 50%, #F5F3FF 100%)' }}>
      
      {/* ── 背景裝飾：更明顯的淡色流體光暈 ── */}
      {/* 左上角藍色光暈 */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-300/20 blur-[120px]" />
      
      {/* 右側紫色光暈 */}
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[100px]" />
      
      {/* 底部中間粉色光暈 */}
      <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-pink-200/15 blur-[130px]" />
      
      {/* 左側中間青色光點 */}
      <div className="absolute top-[50%] left-[-5%] w-64 h-64 rounded-full bg-teal-200/20 blur-[80px]" />

      {/* Header */}
      <header
        className="px-6 md:px-8 pb-4 md:pb-6 text-center relative z-10 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
      >
        <div className="flex flex-col items-center justify-center gap-4 mb-2">
          {/* Logo 容器 */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-[24px] flex items-center justify-center overflow-hidden">
            <img
              src="/rehab-home-logo.png"
              alt="RehabBridge 盾牌標誌：防護與復健意象"
              className="w-full h-full object-contain object-center drop-shadow-sm"
              loading="eager"
              decoding="async"
            />
          </div>
          <div>
            <h1 className="tracking-tight" style={{ fontSize: 'clamp(1.9rem, 3.3vw, 2.25rem)', fontWeight: 900, color: '#1A2035' }}>
              Rehab<span className="text-blue-600">Bridge</span>
            </h1>
            <div className="h-1.5 w-12 bg-blue-500 mx-auto rounded-full mt-1 mb-2 shadow-sm shadow-blue-200" />
            <p className="font-bold uppercase tracking-widest" style={{ fontSize: 14, color: '#90A4AE' }}>
              AI 智慧復健追蹤系統
            </p>
          </div>
        </div>
      </header>

      {/* Role Cards */}
      <main
        className="flex-1 min-h-0 px-5 md:px-8 relative z-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 h-full auto-rows-fr">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => navigate(role.path)}
                // 卡片本體改為更透明的玻璃感，讓背景漸層透出來
                className={`
                  group relative overflow-hidden rounded-[28px] md:rounded-[32px] p-4 md:p-5 text-left
                  bg-white/50 border border-white/60 backdrop-blur-lg
                  hover:bg-white/80 transition-all duration-200
                  shadow-xl shadow-gray-200/30 hover:shadow-2xl hover:${role.shadow}
                `}
                style={{ minHeight: 'clamp(150px, 20vh, 210px)' }}
              >
                {/* 裝飾背景色塊 */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${role.gradient} opacity-[0.04] rounded-bl-full transition-opacity group-hover:opacity-[0.1]`} />

                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] bg-gradient-to-br ${role.gradient} mb-3 md:mb-4 shadow-lg ${role.shadow}`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>

                  {/* Labels */}
                  <div className="flex flex-col gap-1 mb-2 md:mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-black" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.55rem)', color: '#1A2035' }}>
                        {role.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-gray-100 text-[10px] font-black text-gray-500 shadow-sm uppercase">
                        {role.sublabel}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm font-bold leading-relaxed max-w-[280px]">
                      {role.description}
                    </p>
                  </div>

                  {/* Mock user chip */}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white/80 p-1.5 pr-3 rounded-full border border-white shadow-sm">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-inner`}>
                        <span style={{ fontSize: 11, color: 'white', fontWeight: 900 }}>
                          {role.mockUser[0]}
                        </span>
                      </div>
                      <span className="font-black text-gray-600" style={{ fontSize: 13 }}>
                        {role.mockUser}
                      </span>
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300 shadow-sm border border-white">
                       <ChevronRight size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center pb-3 relative z-10 shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <p className="font-black" style={{ fontSize: 12, color: '#B0BEC5', letterSpacing: '0.15em' }}>
          REHABBRIDGE · 2026 · VERSION 1.0.0
        </p>
      </footer>
    </div>
  );
}