import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import {
  CARE_TEAM_CONVERSATION_ID,
  getCareTeamMembers,
  getCareTeamUser,
  getRoleLabel,
  markConversationRead,
  MessageRole,
  sendConversationMessage,
  useConversationMessages,
} from '../data/messageStore';

export const ChatWidget = ({
  currentUserRole,
  currentUserId,
}: {
  currentUserRole: MessageRole;
  currentUserId: string;
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messages = useConversationMessages(CARE_TEAM_CONVERSATION_ID);
  const members = getCareTeamMembers();
  const patientComfort = currentUserRole === 'patient';

  useEffect(() => {
    markConversationRead(CARE_TEAM_CONVERSATION_ID, currentUserId);
  }, [currentUserId, messages.length]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (event?: FormEvent) => {
    event?.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    sendConversationMessage({
      conversationId: CARE_TEAM_CONVERSATION_ID,
      senderId: currentUserId,
      senderRole: currentUserRole,
      content,
    });
    setNewMessage('');
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-0 ${
        patientComfort ? 'text-lg' : ''
      }`}
    >
      <div className={`border-b border-gray-100 bg-blue-50 rounded-t-2xl ${patientComfort ? 'p-5' : 'p-4'}`}>
        <h3
          className={`font-bold text-blue-900 flex items-center gap-2 ${
            patientComfort ? 'text-2xl' : 'text-lg'
          }`}
        >
          照護團隊聊天室
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {members.map((member) => (
            <span
              key={member.id}
              className={`inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-100 text-blue-700 font-semibold ${
                patientComfort ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px]">
                {member.avatar}
              </span>
              {getRoleLabel(member.role)}
            </span>
          ))}
        </div>
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto space-y-4 bg-gray-50 ${patientComfort ? 'p-5' : 'p-4'}`}>
        {messages.map((message) => {
          const isMe = message.senderId === currentUserId;
          const sender = getCareTeamUser(message.senderId);
          const senderName = sender?.name ?? '照護夥伴';
          const roleLabel = sender ? getRoleLabel(sender.role) : getRoleLabel(message.senderRole);
          const timeLabel = new Date(message.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span
                className={`text-gray-400 mb-1 px-1 ${patientComfort ? 'text-base font-semibold' : 'text-xs'}`}
              >
                {isMe ? '我' : `${senderName}｜${roleLabel}`} · {timeLabel}
              </span>
              <div
                className={`max-w-[82%] rounded-2xl ${
                  patientComfort ? 'p-4 text-lg leading-relaxed' : 'p-3 text-sm leading-relaxed'
                } ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className={`bg-white border-t border-gray-100 rounded-b-2xl flex gap-2 ${patientComfort ? 'p-4' : 'p-3'}`}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="輸入訊息..."
          className={`flex-1 bg-gray-100 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            patientComfort ? 'py-3.5 text-lg min-h-[52px]' : 'py-2 text-sm'
          }`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className={`bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shrink-0 ${
            patientComfort ? 'w-14 h-14' : 'w-10 h-10'
          }`}
          aria-label="送出訊息"
        >
          <SendHorizontal size={patientComfort ? 26 : 20} />
        </button>
      </form>
    </div>
  );
};
