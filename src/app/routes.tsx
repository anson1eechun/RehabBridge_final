import React, { useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, MessageCircle, X } from 'lucide-react';

import Blueprint from './pages/Blueprint';
import DoctorPortal from './pages/DoctorPortal';
import FamilyDashboard from './pages/FamilyDashboard';
import GuidedRehabSession from './pages/GuidedRehabSession';
import PatientPortal from './pages/PatientPortal';
import RehabSession from './pages/RehabSession';
import RoleSelect from './pages/RoleSelect';
import { ChatWidget } from './components/ChatWidget';
import {
  CARE_TEAM_CONVERSATION_ID,
  MessageRole,
  useUnreadConversationCount,
} from './data/messageStore';

const MainLayout = () => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const showChatButton =
    location.pathname.startsWith('/patient') ||
    location.pathname === '/family' ||
    location.pathname === '/doctor';
  const isEntryPage = location.pathname === '/';

  useEffect(() => {
    setIsChatOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const openChat = () => {
      if (showChatButton) {
        setIsChatOpen(true);
      }
    };

    window.addEventListener('rehabbridge:open-chat', openChat);
    return () => window.removeEventListener('rehabbridge:open-chat', openChat);
  }, [showChatButton]);

  const roleInfo = useMemo((): { role: MessageRole; id: string; label: string } => {
    if (location.pathname.includes('/doctor')) {
      return { role: 'doctor', id: 'D001', label: '醫師端' };
    }
    if (location.pathname.includes('/family')) {
      return { role: 'family', id: 'F001', label: '家屬端' };
    }
    return { role: 'patient', id: 'P001', label: '長者端' };
  }, [location.pathname]);

  const { role, id, label } = roleInfo;
  const patientDrawerComfort = location.pathname.startsWith('/patient');
  const unreadCount = useUnreadConversationCount(CARE_TEAM_CONVERSATION_ID, id);
  const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div className="h-[100dvh] w-screen bg-[#F8FAFC] overflow-hidden relative font-sans">
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

      <AnimatePresence initial={false}>
        {showChatButton && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.14 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-10 right-10 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center z-[60] border-4 border-white"
            aria-label="開啟照護團隊聊天室"
          >
            <MessageCircle size={28} />
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
                {unreadLabel}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/30 z-[70]"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300, mass: 0.7 }}
              className={`fixed top-0 right-0 h-full bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.15)] z-[80] flex flex-col w-full ${
                patientDrawerComfort ? 'sm:w-[500px]' : 'sm:w-[450px]'
              }`}
            >
              <div className="p-6 border-b flex items-center justify-between bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 ${
                      patientDrawerComfort ? 'p-3.5' : 'p-2.5'
                    }`}
                  >
                    <Bell size={patientDrawerComfort ? 28 : 22} />
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-gray-800 ${
                        patientDrawerComfort ? 'text-2xl' : 'text-lg'
                      }`}
                    >
                      照護通知
                    </h3>
                    <p
                      className={`text-blue-600 font-bold uppercase tracking-wider mt-0.5 ${
                        patientDrawerComfort ? 'text-sm' : 'text-[11px]'
                      }`}
                    >
                      {label} · 團隊訊息
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-3 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                  aria-label="關閉聊天室"
                >
                  <X size={patientDrawerComfort ? 28 : 24} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <ChatWidget currentUserRole={role} currentUserId={id} />
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                  Local Care Team Communication
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: RoleSelect },
      { path: 'patient', Component: PatientPortal },
      { path: 'patient/rehab/:exerciseId', Component: RehabSession },
      { path: 'patient/guided/:prescriptionId', Component: GuidedRehabSession },
      { path: 'family', Component: FamilyDashboard },
      { path: 'doctor', Component: DoctorPortal },
      { path: 'blueprint', Component: Blueprint },
    ],
  },
]);
