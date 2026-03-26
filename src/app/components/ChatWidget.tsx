import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mockMessages, mockDoctors, mockTherapists } from '../data/mockData';

export const ChatWidget = ({ currentUserRole, currentUserId }: { currentUserRole: string, currentUserId: string }) => {
  const [newMessage, setNewMessage] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const initialMessages = useMemo(
    () =>
      mockMessages
        .filter((msg) => msg.receiverId === currentUserId || msg.senderId === currentUserId)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
    [currentUserId]
  );
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getDefaultReceiver = () => {
    if (currentUserRole === 'doctor') {
      return mockTherapists[0]?.id ?? 'T001';
    }
    return mockDoctors[0]?.id ?? 'D001';
  };

  const handleSend = () => {
    const content = newMessage.trim();
    if (!content) return;

    const nextMessage = {
      id: `local-${Date.now()}`,
      senderId: currentUserId,
      receiverId: getDefaultReceiver(),
      senderRole: currentUserRole as 'doctor' | 'patient' | 'family' | 'therapist',
      content,
      timestamp: new Date().toISOString(),
      isRead: true,
    };
    setMessages((prev) => [...prev, nextMessage]);
    setNewMessage('');
  };

  const patientComfort = currentUserRole === 'patient';

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-0 ${
        patientComfort ? 'text-lg' : ''
      }`}
    >
      {/* 聊天室標題 */}
      <div className={`border-b border-gray-100 bg-blue-50 rounded-t-2xl ${patientComfort ? 'p-5' : 'p-4'}`}>
        <h3
          className={`font-bold text-blue-800 flex items-center gap-2 ${
            patientComfort ? 'text-2xl' : ''
          }`}
        >
          💬 醫療團隊訊息
        </h3>
      </div>

      {/* 訊息顯示區 (對話泡泡) */}
      <div className={`flex-1 min-h-0 overflow-y-auto space-y-4 bg-gray-50 ${patientComfort ? 'p-5' : 'p-4'}`}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span
                className={`text-gray-400 mb-1 px-1 ${patientComfort ? 'text-base font-semibold' : 'text-xs'}`}
              >
                {isMe ? '我' : (msg.senderRole === 'doctor' ? '陳醫師' : '治療師')}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl ${
                  patientComfort ? 'p-4 text-lg leading-relaxed' : 'p-3'
                } ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* 輸入框 */}
      <div className={`bg-white border-t border-gray-100 rounded-b-2xl flex gap-2 ${patientComfort ? 'p-4' : 'p-3'}`}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="輸入訊息..."
          className={`flex-1 bg-gray-100 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            patientComfort ? 'py-3.5 text-lg min-h-[52px]' : 'py-2 text-sm'
          }`}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className={`bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shrink-0 ${
            patientComfort ? 'w-14 h-14 text-xl' : 'w-10 h-10'
          }`}
        >
          ➤
        </button>
      </div>
    </div>
  );
};