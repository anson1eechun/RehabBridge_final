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

  const speak = useCallback(
    (text: string, force = false) => {
      if (!enabledRef.current) return;
      if (!('speechSynthesis' in window)) return;

      const now = Date.now();
      const isSameMessage = text === lastSpokenRef.current;
      const isThrottled = now - lastSpokenTimeRef.current < throttleMs;

      if (!force && isSameMessage && isThrottled) return;

      // Cancel ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      window.speechSynthesis.speak(utterance);

      lastSpokenRef.current = text;
      lastSpokenTimeRef.current = now;
    },
    [lang, rate, pitch, volume, throttleMs]
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
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, setEnabled };
}
