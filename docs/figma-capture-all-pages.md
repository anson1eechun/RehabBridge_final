# RehabBridge 全頁面 Figma 擷取指南

目標檔案：[RehabBridge UI](https://www.figma.com/design/RspAOoTwAbWf6FEzrlNoRw)

## 路由清單（共 7 個畫面類型）

| # | 路徑 | 元件 | 說明 |
|---|------|------|------|
| 1 | `/` | `RoleSelect` | 角色選擇入口 |
| 2 | `/patient` | `PatientPortal` | 長者首頁、處方、進度 |
| 3 | `/patient/rehab/knee_flexion` | `RehabSession` | 角度追蹤訓練（可換其他 `exerciseId`） |
| 4 | `/patient/guided/RX023` | `GuidedRehabSession` | 引導式／計時（`chin_tuck` 處方） |
| 5 | `/family` | `FamilyDashboard` | 家屬儀表板 |
| 6 | `/doctor` | `DoctorPortal` | 醫師處方與個案 |
| 7 | `/blueprint` | `Blueprint` | 系統藍圖說明頁 |

動態路由只需各擷取 **一個代表 URL** 即可；不必為每個 `exerciseId` / `RXxxx` 各建一頁。

## 目前已擷取（2026-06-03）

| 路徑 | Figma |
|------|--------|
| `/patient` | [node-id=1-2](https://www.figma.com/design/RspAOoTwAbWf6FEzrlNoRw?node-id=1-2) |
| `/patient/rehab/knee_flexion` | [node-id=2-2](https://www.figma.com/design/RspAOoTwAbWf6FEzrlNoRw?node-id=2-2) |

尚缺：`/`、`/patient/guided/RX023`、`/family`、`/doctor`、`/blueprint`

## MCP 額度限制（重要）

目前 Figma 帳號為 **Starter + View 席位**，MCP 工具呼叫約 **每月 6 次**（讀取類工具）。  
自動擷取需使用 `generate_figma_design`；若出現 rate limit，需：

- 將席位改為 **Full / Dev**，或升級 **Pro / Organization**，或  
- 等待下個月額度重置，或  
- 請有 Dev 席位的成員代為執行擷取

升級說明：<https://www.figma.com/files/team/1552270081130736554/all-projects?upgrade=mcp_rate_limit_paywall>

## 方式 A：在 Cursor 請 Agent 代擷取（額度足夠時）

對 Agent 說：

> 用 Figma MCP 把 RehabBridge 剩餘 5 個路由擷取到 RspAOoTwAbWf6FEzrlNoRw

Agent 會對每個路由各產生一個 `captureId`，開啟本地頁並輪詢直到 `completed`。

## 方式 B：本機腳本 + MCP 產生的 capture ID

1. 啟動開發伺服器：

```bash
cd RehabBridge_final && npm run dev
```

2. 在 Cursor（額度可用時）對 **每個未擷取路由** 各呼叫一次 `generate_figma_design`，取得 7 個 UUID（已擷取的 2 頁可跳過）。

3. 複製設定檔並填入 ID：

```bash
cp scripts/figma-capture-ids.env.example scripts/figma-capture-ids.env
# 編輯 figma-capture-ids.env
```

4. 執行批次開啟（會暫時在 `index.html` 注入 capture script）：

```bash
chmod +x scripts/figma-capture-all-routes.sh
./scripts/figma-capture-all-routes.sh --batch
```

5. 在 Cursor 對每個 `captureId` 輪詢 `generate_figma_design`（`fileKey` + `captureId`）直到完成。

僅預覽所有頁面（不上傳 Figma）：

```bash
./scripts/figma-capture-all-routes.sh --preview
```

## 方式 C：瀏覽器工具列手動補頁（無 MCP 額度時）

1. 開啟已擷取過的頁面（需帶 capture 參數的一次性連結，或保留 `index.html` 內的 capture script）。
2. 擷取完成後，Figma 會在瀏覽器顯示 **capture toolbar**。
3. 在 App 內用導覽切到 `/family`、`/doctor` 等，再點工具列 **Re-capture**（會自動產生新 capture ID）。

本地預覽所有路由：

```bash
./scripts/figma-capture-all-routes.sh --preview
```

## 擷取後整理建議

在 Figma 中將 Page 重新命名，例如：

- `00 · 角色選擇 /`
- `01 · 長者首頁 /patient`
- `02 · 角度訓練 /patient/rehab`
- `03 · 引導式訓練 /patient/guided`
- `04 · 家屬端 /family`
- `05 · 醫師端 /doctor`
- `06 · Blueprint /blueprint`

擷取結果為 **raw frames**；若要元件化，需 Full/Dev 席位下使用 `use_figma` + `search_design_system`。
