import { useEffect, useState } from 'react';
import {
  Message,
  mockDoctors,
  mockFamilyMembers,
  mockMessages,
  mockPatients,
  mockTherapists,
} from './mockData';

export type MessageRole = Message['senderRole'];

export interface ChatUser {
  id: string;
  role: MessageRole;
  name: string;
  avatar: string;
}

export interface ConversationMessage extends Message {
  conversationId: string;
  receiverIds: string[];
  readBy: string[];
}

interface ReadReceiptRecord {
  messageId: string;
  conversationId: string;
  userIds: string[];
}

const MESSAGE_STORAGE_KEY = 'rehabbridge.chat.messages.v1';
const READ_STORAGE_KEY = 'rehabbridge.chat.readReceipts.v1';
const MESSAGE_UPDATE_EVENT = 'rehabbridge:chat-updated';

export const CARE_TEAM_CONVERSATION_ID = 'P001-care-team';

const pickAvatar = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 1) : fallback;

const primaryDoctor = mockDoctors.find((doctor) => doctor.id === 'D001') ?? mockDoctors[0];
const primaryPatient = mockPatients.find((patient) => patient.id === 'P001') ?? mockPatients[0];
const primaryFamily = mockFamilyMembers.find((family) => family.id === 'F001') ?? mockFamilyMembers[0];
const primaryTherapist = mockTherapists.find((therapist) => therapist.id === 'T001') ?? mockTherapists[0];

const CARE_TEAM_MEMBERS: ChatUser[] = [
  {
    id: primaryDoctor?.id ?? 'D001',
    role: 'doctor',
    name: primaryDoctor?.name ?? '陳醫師',
    avatar: pickAvatar(primaryDoctor?.avatar, '醫'),
  },
  {
    id: primaryPatient?.id ?? 'P001',
    role: 'patient',
    name: primaryPatient?.name ?? '王大明',
    avatar: pickAvatar(primaryPatient?.avatar, '王'),
  },
  {
    id: primaryFamily?.id ?? 'F001',
    role: 'family',
    name: primaryFamily?.name ?? '家屬',
    avatar: pickAvatar(primaryFamily?.avatar, '家'),
  },
  {
    id: primaryTherapist?.id ?? 'T001',
    role: 'therapist',
    name: primaryTherapist?.name ?? '黃治療師',
    avatar: pickAvatar(primaryTherapist?.avatar, '治'),
  },
];

const careTeamIds = CARE_TEAM_MEMBERS.map((member) => member.id);

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const parseStoredArray = <T,>(key: string): T[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredArray = <T,>(key: string, values: T[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(values));
};

const broadcastMessageUpdate = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(MESSAGE_UPDATE_EVENT));
};

const getReceiptMap = () => {
  const receipts = parseStoredArray<ReadReceiptRecord>(READ_STORAGE_KEY);
  return receipts.reduce<Record<string, Set<string>>>((acc, receipt) => {
    acc[receipt.messageId] = new Set(receipt.userIds);
    return acc;
  }, {});
};

const buildBaseMessages = (): ConversationMessage[] => {
  const receiptMap = getReceiptMap();

  return mockMessages
    .filter(
      (message) =>
        careTeamIds.includes(message.senderId) &&
        careTeamIds.includes(message.receiverId)
    )
    .map((message) => {
      const readBy = new Set<string>([message.senderId]);
      if (message.isRead) {
        readBy.add(message.receiverId);
      }
      receiptMap[message.id]?.forEach((userId) => readBy.add(userId));

      return {
        ...message,
        conversationId: CARE_TEAM_CONVERSATION_ID,
        receiverIds: careTeamIds.filter((userId) => userId !== message.senderId),
        readBy: Array.from(readBy),
      };
    });
};

const getStoredMessages = (): ConversationMessage[] =>
  parseStoredArray<ConversationMessage>(MESSAGE_STORAGE_KEY).map((message) => ({
    ...message,
    readBy: Array.isArray(message.readBy) ? message.readBy : [message.senderId],
    receiverIds: Array.isArray(message.receiverIds)
      ? message.receiverIds
      : careTeamIds.filter((userId) => userId !== message.senderId),
  }));

export const getCareTeamMembers = () => CARE_TEAM_MEMBERS;

export const getCareTeamUser = (userId: string) =>
  CARE_TEAM_MEMBERS.find((member) => member.id === userId);

export const getRoleLabel = (role: MessageRole) => {
  switch (role) {
    case 'doctor':
      return '醫師';
    case 'therapist':
      return '治療師';
    case 'family':
      return '家屬';
    case 'patient':
    default:
      return '長者';
  }
};

export const getConversationMessages = (
  conversationId = CARE_TEAM_CONVERSATION_ID
): ConversationMessage[] => {
  const merged = [...buildBaseMessages(), ...getStoredMessages()].filter(
    (message) => message.conversationId === conversationId
  );
  const byId = new Map<string, ConversationMessage>();
  merged.forEach((message) => byId.set(message.id, message));

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const sendConversationMessage = ({
  conversationId = CARE_TEAM_CONVERSATION_ID,
  senderId,
  senderRole,
  content,
}: {
  conversationId?: string;
  senderId: string;
  senderRole: MessageRole;
  content: string;
}) => {
  const trimmedContent = content.trim();
  if (!trimmedContent) return null;

  const receiverIds = careTeamIds.filter((userId) => userId !== senderId);
  const nextMessage: ConversationMessage = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId,
    senderId,
    receiverId: receiverIds[0] ?? '',
    receiverIds,
    senderRole,
    content: trimmedContent,
    timestamp: new Date().toISOString(),
    isRead: true,
    readBy: [senderId],
  };

  writeStoredArray(MESSAGE_STORAGE_KEY, [...getStoredMessages(), nextMessage]);
  broadcastMessageUpdate();
  return nextMessage;
};

export const markConversationRead = (
  conversationId = CARE_TEAM_CONVERSATION_ID,
  userId: string
) => {
  if (!userId) return;

  const messages = getConversationMessages(conversationId);
  const receipts = parseStoredArray<ReadReceiptRecord>(READ_STORAGE_KEY);
  const receiptMap = new Map(receipts.map((receipt) => [receipt.messageId, receipt]));
  let changed = false;

  messages.forEach((message) => {
    if (message.senderId === userId || message.readBy.includes(userId)) return;

    const existing = receiptMap.get(message.id);
    if (existing) {
      existing.userIds = Array.from(new Set([...existing.userIds, userId]));
    } else {
      receiptMap.set(message.id, {
        messageId: message.id,
        conversationId: message.conversationId,
        userIds: [userId],
      });
    }
    changed = true;
  });

  if (changed) {
    writeStoredArray(READ_STORAGE_KEY, Array.from(receiptMap.values()));
    broadcastMessageUpdate();
  }
};

export const getUnreadConversationCount = (
  conversationId = CARE_TEAM_CONVERSATION_ID,
  userId: string
) =>
  getConversationMessages(conversationId).filter(
    (message) => message.senderId !== userId && !message.readBy.includes(userId)
  ).length;

export const useConversationMessages = (
  conversationId = CARE_TEAM_CONVERSATION_ID
) => {
  const [messages, setMessages] = useState(() => getConversationMessages(conversationId));

  useEffect(() => {
    const syncMessages = () => setMessages(getConversationMessages(conversationId));
    syncMessages();

    window.addEventListener(MESSAGE_UPDATE_EVENT, syncMessages);
    window.addEventListener('storage', syncMessages);
    return () => {
      window.removeEventListener(MESSAGE_UPDATE_EVENT, syncMessages);
      window.removeEventListener('storage', syncMessages);
    };
  }, [conversationId]);

  return messages;
};

export const useUnreadConversationCount = (
  conversationId = CARE_TEAM_CONVERSATION_ID,
  userId: string
) => {
  const [count, setCount] = useState(() => getUnreadConversationCount(conversationId, userId));

  useEffect(() => {
    const syncCount = () => setCount(getUnreadConversationCount(conversationId, userId));
    syncCount();

    window.addEventListener(MESSAGE_UPDATE_EVENT, syncCount);
    window.addEventListener('storage', syncCount);
    return () => {
      window.removeEventListener(MESSAGE_UPDATE_EVENT, syncCount);
      window.removeEventListener('storage', syncCount);
    };
  }, [conversationId, userId]);

  return count;
};
