/**
 * 將數字改為漢字讀法，供雅婷 tai_* 等閩南語（台語）TTS 唸稿。
 * 阿拉伯數字常被唸成「一一零」；改為「一百一十」等較符合口語。
 * 秒數：1→一秒、2→兩秒（避免「二秒」）。
 */

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

/** 1–99（含）：十、十一、二十… */
function tensAndOnes(x: number): string {
  if (x < 10) return DIGITS[x];
  const t = Math.floor(x / 10);
  const o = x % 10;
  if (t === 1) return o === 0 ? '十' : '十' + DIGITS[o];
  return DIGITS[t] + '十' + (o ? DIGITS[o] : '');
}

/**
 * 將正整數轉為中文數詞（1–999），用於角度、組數、次數等唸稿。
 */
export function integerToZhSpeech(n: number): string {
  const x = Math.floor(Math.abs(n));
  if (x === 0) return '零';
  if (x < 100) return tensAndOnes(x);
  if (x < 1000) {
    const h = Math.floor(x / 100);
    const t = Math.floor((x % 100) / 10);
    const o = x % 10;
    let s = DIGITS[h] + '百';
    if (t === 0 && o === 0) return s;
    if (t === 0) return s + '零' + DIGITS[o];
    if (t === 1) {
      s += '一十';
      if (o !== 0) s += DIGITS[o];
      return s;
    }
    s += DIGITS[t] + '十';
    if (o !== 0) s += DIGITS[o];
    return s;
  }
  return String(n);
}

/** 保持時間口語：一秒、兩秒；其餘用中文數字＋秒 */
export function formatSecondsSpokenZh(seconds: number): string {
  const n = Math.round(Math.max(0, seconds));
  if (n === 1) return '一秒';
  if (n === 2) return '兩秒';
  if (n <= 0) return '零秒';
  return `${integerToZhSpeech(n)}秒`;
}
