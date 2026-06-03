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
import { ELDER_COLORS } from './elderly/tokens';

// 長者視角的角色配色：醫師藍／治療師綠／家人玫瑰／長者琥珀
const ROLE_ACCENT: Record<MessageRole, { bg: string; fg: string }> = {
  doctor: { bg: '#E2EEFB', fg: '#1E63A8' },
  therapist: { bg: ELDER_COLORS.primarySoft, fg: ELDER_COLORS.primaryDark },
  family: { bg: '#FBE7EA', fg: '#B23A48' },
  patient: { bg: ELDER_COLORS.amberSoft, fg: ELDER_COLORS.amber },
};

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

  // ── 長者視角：暖色大字、對方有頭像與角色配色 ──────────────
  if (patientComfort) {
    return (
      <div className="flex h-full min-h-0 flex-col" style={{ background: ELDER_COLORS.pageBg }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${ELDER_COLORS.border}`, background: ELDER_COLORS.surface }}>
          <h3 className="font-black" style={{ fontSize: 23, color: ELDER_COLORS.ink }}>照護團隊聊天室</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {members
              .filter((member) => member.id !== currentUserId)
              .map((member) => {
                const accent = ROLE_ACCENT[member.role];
                return (
                  <span key={member.id} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold"
                    style={{ background: accent.bg, color: accent.fg, fontSize: 16 }}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full font-black text-white"
                      style={{ background: accent.fg, fontSize: 13 }}>
                      {member.avatar}
                    </span>
                    {getRoleLabel(member.role)}
                  </span>
                );
              })}
          </div>
        </div>

        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((message) => {
            const isMe = message.senderId === currentUserId;
            const sender = getCareTeamUser(message.senderId);
            const senderName = sender?.name ?? '照護夥伴';
            const role = sender?.role ?? message.senderRole;
            const accent = ROLE_ACCENT[role];
            const timeLabel = new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

            if (isMe) {
              return (
                <div key={message.id} className="flex flex-col items-end">
                  <span className="mb-1 px-1 font-bold" style={{ fontSize: 15, color: ELDER_COLORS.inkFaint }}>
                    我 · {timeLabel}
                  </span>
                  <div className="max-w-[82%] rounded-[22px] rounded-tr-md px-4 py-3 font-bold text-white"
                    style={{ background: ELDER_COLORS.primary, fontSize: 19, lineHeight: 1.55 }}>
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className="flex items-start gap-2.5">
                <span className="mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-black text-white"
                  style={{ background: accent.fg, fontSize: 17 }}>
                  {sender?.avatar ?? '友'}
                </span>
                <div className="min-w-0">
                  <span className="mb-1 block px-1 font-bold" style={{ fontSize: 15, color: accent.fg }}>
                    {senderName}｜{getRoleLabel(role)} · <span style={{ color: ELDER_COLORS.inkFaint }}>{timeLabel}</span>
                  </span>
                  <div className="inline-block max-w-full rounded-[22px] rounded-tl-md px-4 py-3 font-bold"
                    style={{ background: ELDER_COLORS.surface, color: ELDER_COLORS.ink, border: `1px solid ${ELDER_COLORS.border}`, fontSize: 19, lineHeight: 1.55 }}>
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2.5 px-4 py-4"
          style={{ background: ELDER_COLORS.surface, borderTop: `1px solid ${ELDER_COLORS.border}` }}>
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="輸入訊息給照護團隊…"
            className="flex-1 rounded-full px-5 font-bold focus:outline-none focus-visible:ring-4"
            style={{ minHeight: 56, fontSize: 19, background: ELDER_COLORS.surfaceSoft, border: `2px solid ${ELDER_COLORS.border}`, color: ELDER_COLORS.ink }}
          />
          <button type="submit" disabled={!newMessage.trim()} aria-label="送出訊息"
            className="flex shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:opacity-50"
            style={{ width: 56, height: 56, background: newMessage.trim() ? ELDER_COLORS.primary : '#B9C5C0' }}>
            <SendHorizontal size={26} />
          </button>
        </form>
      </div>
    );
  }

  // ── 家屬／醫師端：維持原樣 ──────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-0">
      <div className="border-b border-gray-100 bg-blue-50 rounded-t-2xl p-4">
        <h3 className="font-bold text-blue-900 flex items-center gap-2 text-lg">照護團隊聊天室</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {members.map((member) => (
            <span key={member.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-100 text-blue-700 font-semibold px-2.5 py-1 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px]">
                {member.avatar}
              </span>
              {getRoleLabel(member.role)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 bg-gray-50 p-4">
        {messages.map((message) => {
          const isMe = message.senderId === currentUserId;
          const sender = getCareTeamUser(message.senderId);
          const senderName = sender?.name ?? '照護夥伴';
          const roleLabel = sender ? getRoleLabel(sender.role) : getRoleLabel(message.senderRole);
          const timeLabel = new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-gray-400 mb-1 px-1 text-xs">
                {isMe ? '我' : `${senderName}｜${roleLabel}`} · {timeLabel}
              </span>
              <div className={`max-w-[82%] rounded-2xl p-3 text-sm leading-relaxed ${
                isMe
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none'
              }`}>
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white border-t border-gray-100 rounded-b-2xl flex gap-2 p-3">
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="輸入訊息..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={!newMessage.trim()} aria-label="送出訊息"
          className="bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shrink-0 w-10 h-10">
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
};
