// 長者端 UI 重設計用的截圖工具。
// 用法: node scripts/screenshot.mjs <path> <outName> [width] [height] [full]
//   path    : 例如 /patient、/patient/rehab/knee_flexion
//   outName : 輸出檔名(不含副檔名)，存到 docs/ui-shots/
//   width   : 視窗寬，預設 820 (iPad 直式)
//   height  : 視窗高，預設 1180
//   full    : 傳 "full" 則截整頁可捲動範圍
//
// 與 scripts/figma-capture-all-routes.sh 不同：那支把畫面上傳 Figma，
// 這支只在本機產生 PNG，用於 before/after 視覺對照。
// 依賴本機已快取的 Playwright Chromium (~/Library/Caches/ms-playwright)。
// 用 playwright-core + 直接指定快取的 headless shell，避免瀏覽器版本不符。

import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_CHROMIUM = path.join(
  os.homedir(),
  'Library/Caches/ms-playwright/chromium_headless_shell-1223',
  'chrome-headless-shell-mac-arm64/chrome-headless-shell'
);
const executablePath = process.env.CHROMIUM_PATH || DEFAULT_CHROMIUM;

const [, , routePath = '/patient', outName = 'shot', wArg, hArg, fullArg] = process.argv;

const width = Number(wArg) || 820;
const height = Number(hArg) || 1180;
const fullPage = fullArg === 'full';

const BASE_URL = process.env.SHOT_BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.resolve('docs/ui-shots');

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const url = `${BASE_URL}${routePath}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  // 給動效與字體載入一點時間
  await page.waitForTimeout(1200);

  // 截圖前可執行一段 JS（例如開啟聊天抽屜）
  if (process.env.SHOT_EVAL) {
    await page.evaluate(process.env.SHOT_EVAL);
    await page.waitForTimeout(900);
  }

  const outFile = path.join(OUT_DIR, `${outName}.png`);
  await page.screenshot({ path: outFile, fullPage });

  console.log(`OK ${url} -> ${outFile} (${width}x${height}${fullPage ? ', full' : ''})`);

  await browser.close();
}

run().catch((err) => {
  console.error('截圖失敗:', err.message);
  process.exit(1);
});
