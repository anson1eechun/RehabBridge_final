// ============================================================
// 長者端設計系統 — 色彩與尺寸 token
// 原則：溫暖親和、大字、高對比、大點擊區。
// 只給長者端頁面用，不動全站 theme.css（家屬/醫師端不受影響）。
// ============================================================

/** 溫暖親和色盤（高對比、健康照護感） */
export const ELDER_COLORS = {
  // 頁面與表面
  pageBg: '#FBF4EA', // 暖奶油底
  surface: '#FFFFFF', // 卡片
  surfaceSoft: '#FFF9F1', // 次級卡片

  // 文字（高對比）
  ink: '#2A2620', // 主文字，近黑暖調
  inkSoft: '#6F6557', // 次要文字
  inkFaint: '#9A8F7F', // 輔助說明

  // 主色（沉穩溫暖的青綠，代表健康／鼓勵）
  primary: '#0E7A6B',
  primaryDark: '#0B6051',
  primarySoft: '#DEF1ED',

  // 鼓勵／成就暖琥珀
  amber: '#B47514',
  amberSoft: '#FBEFD6',

  border: '#EADFCD',
} as const;

/**
 * 四大功能格配色（柔和、彼此可辨、文字高對比）。
 * 對應 Hub：回憶相片館 / 復健紀錄 / 聊天室 / 我的成就。
 */
export const TILE_THEMES = {
  memories: { bg: '#FBE7EA', ink: '#B23A48', ring: '#E9B9C0' },
  records: { bg: '#DEF1ED', ink: '#0B6051', ring: '#A9D8CD' },
  chat: { bg: '#E2EEFB', ink: '#1E63A8', ring: '#B6D2F1' },
  achievements: { bg: '#FBEFD6', ink: '#9A6310', ring: '#EBD3A0' },
} as const;

export type TileThemeKey = keyof typeof TILE_THEMES;

/** 尺寸規範（長者易點、易讀） */
export const ELDER_SIZING = {
  minTapPx: 56, // 最小點擊區
  ctaHeightPx: 76, // 主按鈕高度
  pagePadX: 'px-5', // 頁面左右留白
  cardRadius: 'rounded-[28px]',
  tileRadius: 'rounded-[24px]',
} as const;
