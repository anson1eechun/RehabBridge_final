// ============================================================
// VoiceCoach Hook — Domain Layer
// Uses Web Speech API for zh-TW audio coaching feedback
// Includes throttling to prevent repeated messages
// ============================================================

import { useRef, useCallback, useEffect } from 'react';

export interface VoiceCoachOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  throttleMs?: number;
}

export function useVoiceCoach(options: VoiceCoachOptions = {}) {
  const {
    lang = 'zh-TW',
    rate = 0.9,
    pitch = 1.0,
    volume = 1.0,
    throttleMs = 3500,
  } = options;

  const lastSpokenRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);
  const enabledRef = useRef<boolean>(true);
  const pickVoice = useCallback((targetLang: string) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return undefined;

    const normalized = targetLang.toLowerCase();
    const exact = voices.find((v) => v.lang.toLowerCase() === normalized);
    if (exact) return exact;

    // Try same language family first (ex: nan-TW -> nan)
    const family = normalized.split('-')[0];
    const familyMatch = voices.find((v) => v.lang.toLowerCase().startsWith(family));
    if (familyMatch) return familyMatch;

    // Fallback to zh-TW / zh variants for better local pronunciation
    const zhTw = voices.find((v) => v.lang.toLowerCase() === 'zh-tw');
    if (zhTw) return zhTw;
    const zhAny = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
    if (zhAny) return zhAny;

    return undefined;
  }, []);

  const speak = useCallback(
    (text: string, force = false, langOverride?: string) => {
      if (!enabledRef.current) return;
      if (!('speechSynthesis' in window)) return;

      const now = Date.now();
      const isSameMessage = text === lastSpokenRef.current;
      const isThrottled = now - lastSpokenTimeRef.current < throttleMs;

      if (!force && isSameMessage && isThrottled) return;

      // Cancel ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = langOverride ?? lang;
      utterance.lang = targetLang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      const voice = pickVoice(targetLang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      window.speechSynthesis.speak(utterance);

      lastSpokenRef.current = text;
      lastSpokenTimeRef.current = now;
    },
    [lang, rate, pitch, volume, throttleMs, pickVoice]
  );

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (!enabled) stop();
  }, [stop]);

  // Clean up on unmount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Prime voice list (Safari/iOS may populate lazily)
      window.speechSynthesis.getVoices();
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, setEnabled };
}
