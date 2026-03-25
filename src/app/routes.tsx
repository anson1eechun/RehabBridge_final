// ============================================================
// routes.tsx — 最終整合版 (浮動訊息球 + 抽屜式訊息欄)
// ============================================================
import { createBrowserRouter, Outlet, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo } from 'react';

// 頁面組件引入
import RoleSelect from './pages/RoleSelect';
import PatientPortal from './pages/PatientPortal';
import RehabSession from './pages/RehabSession';
import FamilyDashboard from './pages/FamilyDashboard';
import DoctorPortal from './pages/DoctorPortal';
import Blueprint from './pages/Blueprint';

// 功能組件引入
import { ChatWidget } from './components/ChatWidget';
import { MessageCircle, X, Bell } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. 判斷顯示邏輯：只有在身分頁面（長者/家屬/醫生）才顯示訊息球
  // 首頁 (/) 與 復健執行頁 (/rehab/) 保持完全清爽
  const showChatButton = location.pathname !== '/' && !location.pathname.includes('/rehab/');
  const isEntryPage = location.pathname === '/';

  // 2. 換頁自動重置：當使用者切換頁面時，自動關閉訊息抽屜
  useEffect(() => {
    setIsChatOpen(false);
  }, [location.pathname]);

  // 3. 身分自動判斷：根據目前 URL 決定 ChatWidget 的權限與對話對象
  const roleInfo = useMemo(() => {
    if (location.pathname.includes('/doctor')) {
      return { role: 'doctor' as const, id: 'D001', label: '醫師管理端' };
    }
    if (location.pathname.includes('/family')) {
      return { role: 'family' as const, id: 'F001', label: '家屬守護端' };
    }
    return { role: 'patient' as const, id: 'P001', label: '長者康復端' };
  }, [location.pathname]);

  const { role, id, label } = roleInfo;

  return (
    <div className="h-[100dvh] w-screen bg-[#F8FAFC] overflow-hidden relative font-sans">
      
      {/* 🌟 核心內容區 (Outlet)
          這裡永遠佔據 100% 寬度與高度，側邊欄開啟時也不會擠壓此區域 */}
      <main
        className={`h-full w-full relative scroll-smooth [transform:translateZ(0)] ${
          isEntryPage ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'
        }`}
        style={{ WebkitOverflowScrolling: isEntryPage ? 'auto' : 'touch' }}
      >
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* 🌟 浮動訊息按鈕 (FAB)
          平常縮在右下角，只有 showChatButton 為 true 時才出現 */}
      <AnimatePresence initial={false}>
        {showChatButton && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.14 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-10 right-10 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center z-[60] border-4 border-white"
          >
            <MessageCircle size={28} />
            {/* 提示小紅點 */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
              !
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 🌟 側邊訊息抽屜面板 (Drawer)
          只有點擊球之後才會滑入 */}
      <AnimatePresence initial={false}>
        {isChatOpen && (
          <>
            {/* 背景遮罩 (Overlay)：模糊背景並提供點擊關閉功能 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/30 z-[70]"
            />
            
            {/* 面板主體 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300, mass: 0.7 }}
              className="fixed top-0 right-0 w-full sm:w-[450px] h-full bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.15)] z-[80] flex flex-col"
            >
              {/* 面板頭部 */}
              <div className="p-6 border-b flex items-center justify-between bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">醫護即時通訊</h3>
                    <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">
                      {label}模式
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-3 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* 訊息組件本體 (填滿剩餘高度) */}
              <div className="flex-1 overflow-hidden relative">
                <ChatWidget currentUserRole={role} currentUserId={id} />
              </div>

              {/* 面板底部裝飾 */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                  Secure Medical Communication
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// 🌟 路由配置中心
export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: RoleSelect },
      { path: 'patient', Component: PatientPortal },
      { path: 'patient/rehab/:exerciseId', Component: RehabSession },
      { path: 'family', Component: FamilyDashboard },
      { path: 'doctor', Component: DoctorPortal },
      { path: 'blueprint', Component: Blueprint },
    ],
  },
]);