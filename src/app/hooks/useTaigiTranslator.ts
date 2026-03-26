import { useCallback, useMemo, useRef } from 'react';

type TranslatorResponse =
  | Array<{ generated_text?: string; translation_text?: string }>
  | { generated_text?: string; translation_text?: string }
  | { text?: string };

const TAIGI_REHAB_OVERRIDES: Array<[RegExp, string]> = [
  [/请|請/g, '請'],
  [/目标|目標/g, '目標'],
  [/继续|繼續/g, '繼續'],
  [/继续训练|繼續訓練/g, '繼續做'],
  [/暂停|暫停/g, '暫停'],
  [/动作|動作/g, '動作'],
  [/训练|訓練/g, '訓練'],
  [/完成了|完成啦/g, '完成矣'],
  [/完成了。|完成啦。/g, '完成矣。'],
  [/很好/g, '真好'],
  [/保持/g, '保持'],
  [/放松|放鬆/g, '放輕鬆'],
  [/再高一点|再高一點/g, '閣較懸一點'],
  [/再用力一点|再用力一點/g, '閣較出力一點'],
  [/一下子|一下/g, '一下'],
  [/先休息一下/g, '先歇一下'],
];

function extractText(payload: TranslatorResponse): string | null {
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (!first) return null;
    return first.translation_text ?? first.generated_text ?? null;
  }
  return payload.translation_text ?? payload.generated_text ?? payload.text ?? null;
}

function toHanPrompt(source: string): string {
  return `[TRANS]\n請將下句翻做臺灣閩南語漢字，語氣自然、口語、適合復健語音教練：${source}\n[/TRANS]\n[HAN]\n`;
}

function postProcessTaigi(text: string): string {
  let output = text.trim();
  for (const [pattern, replacement] of TAIGI_REHAB_OVERRIDES) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

export function useTaigiTranslator() {
  const cacheRef = useRef<Map<string, string>>(new Map());

  const endpoint = import.meta.env.VITE_TAIGI_TRANSLATOR_API_URL as string | undefined;
  const token = import.meta.env.VITE_TAIGI_TRANSLATOR_API_TOKEN as string | undefined;

  const enabled = useMemo(() => Boolean(endpoint), [endpoint]);

  const translateToTaigi = useCallback(
    async (zhText: string): Promise<string> => {
      const normalized = zhText.trim();
      if (!normalized) return zhText;
      const cached = cacheRef.current.get(normalized);
      if (cached) return cached;
      if (!endpoint) return zhText;

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            inputs: toHanPrompt(normalized),
            parameters: {
              temperature: 0.2,
              max_new_tokens: 96,
              repetition_penalty: 1.1,
              return_full_text: false,
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) return zhText;
        const payload = (await res.json()) as TranslatorResponse;
        const translated = extractText(payload)?.trim();
        if (!translated) return zhText;

        const adapted = postProcessTaigi(translated);
        cacheRef.current.set(normalized, adapted);
        return adapted;
      } catch {
        return zhText;
      } finally {
        window.clearTimeout(timer);
      }
    },
    [endpoint, token]
  );

  return { translateToTaigi, taigiModelEnabled: enabled };
}

