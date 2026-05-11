// ============================================================
// OpenAI Text-to-Speech（/v1/audio/speech）
// 開發：走 Vite 代理 /api/openai → 注入 Authorization Bearer
// 正式：VITE_OPENAI_API_KEY 直連（金鑰會進 bundle，僅 demo）
//
// 模型／聲線見：https://platform.openai.com/docs/api-reference/audio/createSpeech
// ============================================================

const OPENAI_SPEECH_PATH = '/v1/audio/speech';

/** 支援 instructions 的模型；tts-1 / tts-1-hd 不支援 */
const DEFAULT_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_VOICE = 'coral';

function buildUrl(): string {
  if (import.meta.env.DEV) {
    return `/api/openai${OPENAI_SPEECH_PATH}`;
  }
  return `https://api.openai.com${OPENAI_SPEECH_PATH}`;
}

export function wantsOpenAiFromEnv(): boolean {
  return (import.meta.env.VITE_TTS_PROVIDER ?? '').trim().toLowerCase() === 'openai';
}

export function isOpenAiConfigured(): boolean {
  if (import.meta.env.DEV) {
    return typeof __REHAB_OPENAI_PROXY__ !== 'undefined' && __REHAB_OPENAI_PROXY__ === true;
  }
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY?.trim());
}

const DEFAULT_INSTRUCTIONS =
  'Natural conversational Mandarin Chinese; warm, calm, like a coach beside the patient—not robotic or theatrical.';

export async function synthesizeOpenAiSpeech(
  text: string,
  options?: { signal?: AbortSignal }
): Promise<Blob> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty TTS text');
  }

  const model = (import.meta.env.VITE_OPENAI_TTS_MODEL ?? DEFAULT_MODEL).trim();
  const voice = (import.meta.env.VITE_OPENAI_TTS_VOICE ?? DEFAULT_VOICE).trim();
  const speedStr = import.meta.env.VITE_OPENAI_TTS_SPEED?.trim();
  const instructionsEnv = import.meta.env.VITE_OPENAI_TTS_INSTRUCTIONS?.trim();

  const body: Record<string, unknown> = {
    model,
    input: trimmed.length > 4096 ? trimmed.slice(0, 4096) : trimmed,
    voice,
    response_format: 'mp3',
  };

  if (speedStr) {
    const s = Number(speedStr);
    if (!Number.isNaN(s) && s >= 0.25 && s <= 4) {
      body.speed = s;
    }
  }

  const legacy = model === 'tts-1' || model === 'tts-1-hd';
  if (!legacy) {
    body.instructions = instructionsEnv || DEFAULT_INSTRUCTIONS;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'audio/mpeg',
  };

  const key = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  if (!import.meta.env.DEV && key) {
    headers.Authorization = `Bearer ${key}`;
  }

  const res = await fetch(buildUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI TTS ${res.status}: ${errText.slice(0, 240)}`);
  }

  return res.blob();
}
