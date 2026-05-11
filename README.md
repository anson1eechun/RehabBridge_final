# RehabBridge

居家復健原型 Web App：以瀏覽器相機搭配 **TensorFlow.js MoveNet** 做即時姿態偵測，輔以 **繁體中文語音回饋**（Web Speech／可選雅婷 TTS／OpenAI TTS），並區分 **長者端、家屬端、醫師端** 與開發用 **系統藍圖** 頁。資料以 **mock + `localStorage` 訓練紀錄** 為主，適合競賽展示與概念驗證。

---

## 功能概覽

| 角色 | 路徑 | 說明 |
|------|------|------|
| 入口 | `/` | 選擇長者／家屬／醫師／系統藍圖 |
| 長者端 | `/patient` | 今日訓練計畫（有效處方、下肢／核心與上肢各至多 2 項） |
| 復健訓練 | `/patient/rehab/:exerciseId` | 相機、骨架、關節角度、組數／次數、語音提示 |
| 家屬端 | `/family` | 完成度、趨勢圖、歷史紀錄（與 mock／localStorage 合併） |
| 醫師端 | `/doctor` | 患者列表、處方調整、圖表分析 |
| 系統藍圖 | `/blueprint` | 架構、使用者流程、UI 規範、ML 設計（與實作對照） |

長者／家屬／醫師主頁提供 **浮動訊息** 與側欄 **醫護即時通訊**（`ChatWidget`）；首頁、復健執行頁、藍圖頁不顯示該按鈕。

---

## 技術棧

- **前端**：React 18、TypeScript、Vite 6、React Router 7、Tailwind CSS 4  
- **姿態**：`@tensorflow/tfjs`、`@tensorflow-models/pose-detection`（MoveNet）  
- **圖表**：Recharts  
- **動效**：motion（原 Framer Motion）  
- **原生殼**：Capacitor 8（iOS，`com.rehabbridge.app`），內建 **CapacitorHttp** 以利雅婷 API 在 WKWebView 環境呼叫  

---

## 環境需求

- **Node.js** 18+（建議與團隊 LTS 一致）  
- **npm** 或 **pnpm**（專案含 `pnpm.overrides`，使用 pnpm 時行為與 lockfile 一致）  

---

## 安裝與執行

```bash
npm install
npm run dev
```

瀏覽器開啟終端機顯示的本機網址（預設多為 `http://localhost:5173`）。  
復健頁需 **相機權限**；若部署至非本機網域，請使用 **HTTPS**，否則 `getUserMedia` 可能被瀏覽器阻擋。

```bash
npm run build
```

產出於 `dist/`。生產環境會嘗試註冊 `/sw.js` Service Worker（見 `src/main.tsx`）。

---

## 環境變數（TTS）

請複製範本並自行建立 `.env`（勿將含金鑰的 `.env` 提交版本庫）：

```bash
cp .env.example .env
```

完整變數說明、開發用 **Vite 代理**（`OPENAI_API_KEY`、`YATING_API_KEY`）與 **Capacitor 打包** 注意事項，皆在 **[`.env.example`](./.env.example)**。

摘要：

- **`VITE_TTS_PROVIDER`**：`browser`（預設 Web Speech）／`yating`／`openai`  
- 開發時建議將 **OpenAI／雅婷金鑰** 寫在 **非 `VITE_` 前綴** 變數，由 `vite.config.ts` 代理，避免金鑰進入前端 bundle  

---

## iOS（Capacitor）

```bash
npm run build
npm run cap:sync    # 等同 build + npx cap sync ios
npm run cap:open:ios
# 或
npm run cap:run:ios
```

打包 iOS 前若使用雅婷，請依 `.env.example` 設定 `VITE_TTS_PROVIDER` 與 `VITE_YATING_API_KEY`（或於原生／後端安全轉發）。

---

## 專案結構（精簡）

```
src/
  app/
    pages/          # RoleSelect, PatientPortal, RehabSession, FamilyDashboard, DoctorPortal, Blueprint
    components/     # ChatWidget 等
    hooks/          # usePoseDetection, useVoiceCoach
    services/       # yatingTts, openaiTts 等
    data/           # mockData, sessionStore
    utils/          # angleCalculator, poseLogic
  main.tsx
capacitor.config.ts
ios/                # Xcode 工程
```

---

## 其他文件

- **[`guidelines/Guidelines.md`](./guidelines/Guidelines.md)** — 可自訂團隊／AI 協作規範（預設為範本）  
- **[`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md)** — 第三方素材與授權（如 shadcn/ui、Unsplash）  

---

## 免責聲明

本專案為 **原型／展示用途**，不構成醫療器材或醫療建議。任何臨床決策應以專業醫事人員為準。

---

## 設計來源

初始 UI 曾與 Figma 設計稿流程銜接；產品邏輯與程式已以 **RehabBridge** 需求為主持續演進。若需對照設計檔，可參考原 Figma 連結（若仍有效）：  
https://www.figma.com/design/tECXSI74ZqsJSXEGIHpVX1/Design-Development-Blueprint
