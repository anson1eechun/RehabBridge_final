import type { Exercise } from '../data/mockData';

// ============================================================
// 雅婷 Yating TTS v2（國語 zh_en_*／台語 tai_*）
// 開發：Vite 代理 /api/yating → 注入 Header key
// 正式：VITE_YATING_API_KEY 直連（金鑰會進 bundle，僅 demo）
//
// 文件：https://developer.yating.tw/zh-TW/doc/tts-TTS%20%E8%AA%9E%E9%9F%B3%E5%90%88%E6%88%90v2
// ============================================================

const YATING_SPEECH_PATH = '/v2/speeches/short';

/** 雅婷「亦晴」系列：國語 zh_en_*／台語 tai_*（文件見官網語音表） */
export const YATING_DEFAULT_MANDARIN_MODEL = 'zh_en_female_2';
export const YATING_DEFAULT_TAIWANESE_MODEL = 'tai_female_2';

/** 與 .env 的 VITE_YATING_VOICE_PROFILE=yiqing 對應（非 API provider；API 仍為 VITE_TTS_PROVIDER=yating） */
export const YATING_VOICE_PROFILE_YIQING = 'yiqing';

/**
 * 國語預設聲線：VITE_YATING_VOICE_PROFILE=yiqing（預設）→ 亦晴 zh_en_female_2；
 * 可被 VITE_YATING_VOICE_MODEL 直接覆寫。
 */
export function resolveYatingMandarinVoiceModel(): string {
  const override = import.meta.env.VITE_YATING_VOICE_MODEL?.trim();
  if (override) return override;
  const profile = (import.meta.env.VITE_YATING_VOICE_PROFILE ?? YATING_VOICE_PROFILE_YIQING)
    .trim()
    .toLowerCase();
  if (profile === YATING_VOICE_PROFILE_YIQING) return YATING_DEFAULT_MANDARIN_MODEL;
  return YATING_DEFAULT_MANDARIN_MODEL;
}

/**
 * 台語預設聲線：亦晴為 tai_female_2；可被 VITE_YATING_TAI_VOICE_MODEL 覆寫。
 */
export function resolveYatingTaiwaneseVoiceModel(): string {
  const override = import.meta.env.VITE_YATING_TAI_VOICE_MODEL?.trim();
  if (override) return override;
  return YATING_DEFAULT_TAIWANESE_MODEL;
}

function buildUrl(): string {
  if (import.meta.env.DEV) {
    return `/api/yating${YATING_SPEECH_PATH}`;
  }
  return `https://tts.api.yating.tw${YATING_SPEECH_PATH}`;
}

export function wantsYatingFromEnv(): boolean {
  return (import.meta.env.VITE_TTS_PROVIDER ?? '').trim().toLowerCase() === 'yating';
}

export function isYatingConfigured(): boolean {
  if (import.meta.env.DEV) {
    return typeof __REHAB_YATING_PROXY__ !== 'undefined' && __REHAB_YATING_PROXY__ === true;
  }
  return Boolean(import.meta.env.VITE_YATING_API_KEY?.trim());
}

/** 動作有台語稿且使用者選台語時，雅婷改用 tai_*（可覆寫 yatingTaiVoiceModel） */
export function resolveYatingVoiceModelForExercise(exercise: Exercise | undefined): string | undefined {
  if (!exercise?.voicePromptsTai) return undefined;
  return (exercise.yatingTaiVoiceModel ?? resolveYatingTaiwaneseVoiceModel()).trim();
}

/**
 * 雅婷純文字長度：中文等寬字元算 2、ASCII 算 1，上限約 600。
 */
function truncateForYating(text: string, maxUnits = 580): string {
  let units = 0;
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    const u = code <= 0xff ? 1 : 2;
    if (units + u > maxUnits) break;
    units += u;
    out += ch;
  }
  return out;
}

function parseEnvFloat(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function base64ToWavBlob(base64: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

export async function synthesizeYatingSpeech(
  text: string,
  options?: { signal?: AbortSignal; voiceModel?: string }
): Promise<Blob> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty TTS text');
  }

  const model = (options?.voiceModel?.trim() || resolveYatingMandarinVoiceModel()).trim();
  const sampleRate = model.startsWith('tai_') ? '16K' : '22K';

  const speed = parseEnvFloat(import.meta.env.VITE_YATING_SPEED, 0.85, 0.5, 1.5);
  const pitch = parseEnvFloat(import.meta.env.VITE_YATING_PITCH, 1.0, 0.5, 1.5);
  const energy = parseEnvFloat(import.meta.env.VITE_YATING_ENERGY, 1.0, 0.5, 1.5);

  const inputText = truncateForYating(trimmed);

  const body = {
    input: { text: inputText, type: 'text' as const },
    voice: { model, speed, pitch, energy },
    audioConfig: { encoding: 'LINEAR16' as const, sampleRate },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const key = import.meta.env.VITE_YATING_API_KEY?.trim();
  if (!import.meta.env.DEV && key) {
    headers.key = key;
  }

  const res = await fetch(buildUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Yating TTS ${res.status}: ${errText.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    audioContent?: string;
    statusCode?: number;
    message?: string | string[];
  };

  if (!data.audioContent) {
    throw new Error('Yating TTS: 回應缺少 audioContent');
  }

  return base64ToWavBlob(data.audioContent);
}
