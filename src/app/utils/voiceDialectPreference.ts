// 長者端「國語／台語」偏好：首頁與訓練頁共用（localStorage）

export type VoiceDialectPreference = 'mandarin' | 'taiwanese';

const STORAGE_KEY = 'rehab_voice_dialect';

export function readVoiceDialectPreference(): VoiceDialectPreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'taiwanese') return 'taiwanese';
  } catch {
    /* ignore */
  }
  return 'mandarin';
}

export function writeVoiceDialectPreference(d: VoiceDialectPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, d);
  } catch {
    /* ignore */
  }
}
