/// <reference types="vite/client" />

/** Vite define：開發環境是否已設定 OPENAI_API_KEY（代理可用） */
declare const __REHAB_OPENAI_PROXY__: boolean;
/** Vite define：開發環境是否已設定 YATING_API_KEY（代理可用） */
declare const __REHAB_YATING_PROXY__: boolean;

interface ImportMetaEnv {
  readonly VITE_TTS_PROVIDER?: string;
  /** OpenAI TTS：正式直連用（金鑰暴露，勿用於產品） */
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_TTS_MODEL?: string;
  readonly VITE_OPENAI_TTS_VOICE?: string;
  /** 0.25～4，預設由 API 決定 */
  readonly VITE_OPENAI_TTS_SPEED?: string;
  /** 僅 gpt-4o-mini-tts 等；空則用程式內預設（英文指令較穩） */
  readonly VITE_OPENAI_TTS_INSTRUCTIONS?: string;
  /** 雅婷：正式直連用（金鑰暴露，勿用於產品） */
  readonly VITE_YATING_API_KEY?: string;
  /** 國語：zh_en_female_1／2、zh_en_male_1／2；台語：tai_female_1／2、tai_male_1 */
  readonly VITE_YATING_VOICE_MODEL?: string;
  readonly VITE_YATING_SPEED?: string;
  readonly VITE_YATING_PITCH?: string;
  readonly VITE_YATING_ENERGY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
