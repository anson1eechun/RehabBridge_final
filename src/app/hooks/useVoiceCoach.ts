// ============================================================
// VoiceCoach Hook — Web Speech（zh-TW）／雅婷 Yating／OpenAI Speech API
// ============================================================

import { useRef, useCallback, useEffect } from 'react';
import { synthesizeOpenAiSpeech } from '../services/openaiTts';
import { synthesizeYatingSpeech } from '../services/yatingTts';

export interface VoiceCoachOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  throttleMs?: number;
  /** browser = SpeechSynthesis；yating = 雅婷 v2；openai = OpenAI /v1/audio/speech */
  ttsProvider?: 'browser' | 'yating' | 'openai';
  /** 雅婷聲線覆寫（例如動作帶台語稿時傳 tai_female_1）；未設則用 VITE_YATING_VOICE_MODEL */
  yatingVoiceModel?: string;
}

export function useVoiceCoach(options: VoiceCoachOptions = {}) {
  const {
    lang = 'zh-TW',
    rate = 0.9,
    pitch = 1.0,
    volume = 1.0,
    throttleMs = 3500,
    ttsProvider = 'browser',
    yatingVoiceModel,
  } = options;

  const lastSpokenRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);
  const enabledRef = useRef<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 本機 TTS 選音：
   * - Microsoft Edge（與 Windows 上的 Chrome 等）會列出「Microsoft … Natural / Online」中文神經語音，
   *   與其說「另外接一套 Edge API」，不如在 Web Speech 裡優先選這些聲音即可。
   * - macOS Safari 通常沒有 Microsoft 聲音，會自動退回系統中文。
   */
  const pickVoice = useCallback((targetLang: string) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return undefined;

    const normalized = targetLang.toLowerCase();
    const langPrefix = normalized.split('-')[0] || 'zh';

    const sameOrFamily = (v: SpeechSynthesisVoice) => {
      const l = v.lang.toLowerCase();
      return l === normalized || l.startsWith(`${langPrefix}-`);
    };

    const candidates = voices.filter(sameOrFamily);
    const pool = candidates.length > 0 ? candidates : voices;

    const msScore = (v: SpeechSynthesisVoice) => {
      if (!/microsoft/i.test(v.name)) return 0;
      let s = 10;
      if (/natural|online/i.test(v.name)) s += 5;
      if (v.lang.toLowerCase() === 'zh-tw') s += 3;
      else if (v.lang.toLowerCase().startsWith('zh')) s += 1;
      return s;
    };

    let bestMs: SpeechSynthesisVoice | undefined;
    let bestMsScore = 0;
    for (const v of pool) {
      const s = msScore(v);
      if (s > bestMsScore) {
        bestMsScore = s;
        bestMs = v;
      }
    }
    if (bestMs && bestMsScore > 0) return bestMs;

    const exact = voices.find((v) => v.lang.toLowerCase() === normalized);
    if (exact) return exact;

    const familyMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (familyMatch) return familyMatch;

    const zhTw = voices.find((v) => v.lang.toLowerCase() === 'zh-tw');
    if (zhTw) return zhTw;
    const zhAny = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
    if (zhAny) return zhAny;

    return undefined;
  }, []);

  const cleanupRemotePlayback = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const speakBrowser = useCallback(
    (text: string, targetLang: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
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
    },
    [rate, pitch, volume, pickVoice]
  );

  const speak = useCallback(
    (text: string, force = false, langOverride?: string) => {
      if (!enabledRef.current) return;
      const now = Date.now();
      const isSameMessage = text === lastSpokenRef.current;
      const isThrottled = now - lastSpokenTimeRef.current < throttleMs;

      if (!force && isSameMessage && isThrottled) return;

      lastSpokenRef.current = text;
      lastSpokenTimeRef.current = now;

      const targetLang = langOverride ?? lang;
      const useYating = ttsProvider === 'yating';
      const useOpenAi = ttsProvider === 'openai';

      const playBlob = async (blob: Blob, ac: AbortController) => {
        if (!enabledRef.current || abortRef.current !== ac) return;
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audio.volume = volume;
        audioRef.current = audio;
        audio.onended = () => {
          if (objectUrlRef.current === url) {
            URL.revokeObjectURL(url);
            objectUrlRef.current = null;
          }
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        };
        await audio.play();
      };

      if (useYating) {
        cleanupRemotePlayback();
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        const ac = new AbortController();
        abortRef.current = ac;
        void (async () => {
          try {
            const blob = await synthesizeYatingSpeech(text, {
              signal: ac.signal,
              voiceModel: yatingVoiceModel,
            });
            await playBlob(blob, ac);
          } catch (e) {
            if ((e as Error).name === 'AbortError') return;
            if (import.meta.env.DEV) {
              console.warn(
                '[VoiceCoach] 雅婷 TTS 失敗，已改用本機語音。請檢查 .env：YATING_API_KEY（dev 代理）或 VITE_YATING_API_KEY，VITE_TTS_PROVIDER=yating，並重啟 npm run dev',
                e
              );
            }
            speakBrowser(text, targetLang);
          }
        })();
        return;
      }

      if (useOpenAi) {
        cleanupRemotePlayback();
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        const ac = new AbortController();
        abortRef.current = ac;
        void (async () => {
          try {
            const blob = await synthesizeOpenAiSpeech(text, { signal: ac.signal });
            await playBlob(blob, ac);
          } catch (e) {
            if ((e as Error).name === 'AbortError') return;
            if (import.meta.env.DEV) {
              console.warn(
                '[VoiceCoach] OpenAI TTS 失敗，已改用本機語音。請檢查 .env：OPENAI_API_KEY（dev 代理）或 VITE_OPENAI_API_KEY，VITE_TTS_PROVIDER=openai，並重啟 npm run dev',
                e
              );
            }
            speakBrowser(text, targetLang);
          }
        })();
        return;
      }

      speakBrowser(text, targetLang);
    },
    [lang, volume, throttleMs, ttsProvider, yatingVoiceModel, cleanupRemotePlayback, speakBrowser]
  );

  const stop = useCallback(() => {
    cleanupRemotePlayback();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [cleanupRemotePlayback]);

  const setEnabled = useCallback(
    (enabled: boolean) => {
      enabledRef.current = enabled;
      if (!enabled) stop();
    },
    [stop]
  );

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const synth = window.speechSynthesis;
    const prime = () => synth.getVoices();
    prime();
    synth.addEventListener('voiceschanged', prime);
    return () => {
      synth.removeEventListener('voiceschanged', prime);
      synth.cancel();
      cleanupRemotePlayback();
    };
  }, [cleanupRemotePlayback]);

  return { speak, stop, setEnabled };
}
