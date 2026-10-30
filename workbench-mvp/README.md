# 張森焱 AI 工作台 MVP 1.0

免費、無外部依賴的純前端個人工具。採用繁體中文及響應式介面，無外部 API、無 AI 模型串接、無購買服務、無公開部署。客戶與物件均為虛構；台積電、統一企業為企業研究範本，全部財報數字為虛構。

## 預覽（Windows）

1. 下載此分支的 ZIP 並解壓縮，進入 `workbench-mvp` 資料夾。
2. 使用 Edge 或 Chrome 開啟 `index.html`，不需要安裝套件。file:// 的儲存方式依瀏覽器而異，正式測試建議使用以下本機伺服器。
3. 若已安裝 Python 3，在此資料夾開啟 PowerShell，執行：

   ```powershell
   py -m http.server 8000 --bind 127.0.0.1
   ```

4. 開啟 `http://127.0.0.1:8000`；結束按 Ctrl+C。

### 手機預覽（同一個可信任 Wi-Fi）

在 Windows 的此資料夾執行 `py -m http.server 8000 --bind 0.0.0.0`，使用 `ipconfig` 查出 Wi-Fi 的 IPv4，例如 `192.168.1.20`。在手機 Chrome / Safari 開啟 `http://192.168.1.20:8000`。若防火牆詢問，僅允許私人網路；完成後 Ctrl+C 停止伺服器。這是區域網路預覽，不需公開部署、路由器轉發或付費服務。請勿放入真實個資。

電腦與手機資料各自獨立，可用完整 JSON 備份／還原搬移；不會自動同步。請固定同一瀏覽器與網址，file:// 與 http:// 也屬於不同儲存位置。

## 已完成

- 共用導覽、卡片、表單、搜尋、提示與手機版面。
- 房仲：買方、物件、帶看紀錄新增／編輯／刪除；五條件配對（區域、預算、坪數、屋齡、車位）；今日及逾期買方追蹤提醒；物件開發／委託／成交階段統計。
- 投資：企業研究 CRUD、年度財報 CRUD；台積電／統一企業研究頁；EPS、ROE、現金流表格及 EPS 趨勢；自由現金流 = 營業現金流 − 資本支出；EPS × 假設本益比估值、折扣買價與股價安全邊際試算。
- 學習：會計／數學／英文課程、進度、學習時間與錯題 CRUD；答案顯示；間隔複習；各科與總計學習效率。
- localStorage 持久儲存，完整 JSON 備份／還原（覆蓋前確認）；還原先驗證版本、資料型別、數值、日期、關聯、重複代碼與企業年度。
- 防止刪除已被引用的紀錄；使用者文字 HTML 轉義；發現另一分頁變更即停用本頁儲存，避免舊資料覆寫。

## 操作規則與限制

- 房仲金額：萬元；面積：總建坪；屋齡：年。區域依精確文字配對，多區域可用「、」或逗號分隔。五項各占 20%，不是成交機率，備註需人工檢查。成交案件仍列入媒合候選，請人工核對階段。
- 案件統計是「目前狀態」而非歷史漏斗；金額是開價合計，非實際成交金額或佣金。
- 追蹤與複習依 Asia/Taipei 日期，僅開啟網頁時顯示，不發送手機通知。
- ROE、EPS 手動輸入；目前沒有三大報表推導或真實行情。合理價 = EPS × PE，折扣買價 = 合理價 × (1 − 折扣%)，股價安全邊際 = (1 − 手動股價 / 合理價) × 100%。負 EPS 不適用。試算假設不永久儲存。
- 課程進度手動編輯。時間紀錄不自動改變進度，避免修改／刪除時重複加算。效率 = 時間紀錄的完成單元數 ÷ 分鐘 × 60。
- 錯題記得後，以今天為基準排 1、3、7、14、30 日（之後維持 30 日）；忘記重設為明天、等級 0。可以提前複習，會從當天重新排程。
- 沒有帳號、登入、資料加密、後端資料庫、雲端／跨裝置同步、外部 AI、財報擷取、背景排程或公開部署。
- 瀏覽器儲存停用／損壞時只顯示範例且禁止寫入，備份按鈕會下載原始儲存值以供檢查。需修復儲存後重開；不是自動復原。
- 無痕模式或清除網站資料會遺失資料，請定期完整備份。不同分頁同時編輯仍非交易式鎖定，請一次使用一個分頁。
- 舊版 `buyer-desk-v1` localStorage 及原版 CSV 功能未變動；本版採用獨立鍵 `senyan-workbench-v1`。本版沒有自動遷移舊資料或 CSV 匯入。

## 資料結構

`core.js` 的 `fields` 是共用欄位定義，`seed` 是示範資料，頂層 `version: 1`。共八個資料表：

| 表 | 主要欄位與關聯 |
| --- | --- |
| buyers | id, name, district, budget, size, age, parking, status, next, notes |
| properties | id, name, district, price, size, age, parking, stage, notes |
| visits | id, buyerId → buyers, propertyId → properties, date, feedback |
| companies | id, name, ticker, sector, thesis, risk |
| financials | id, companyId → companies, year, eps, roe, operating, capex |
| courses | id, name, subject, total, completed, goal |
| sessions | id, courseId → courses, date, minutes, units, notes |
| questions | id, subject, prompt, answer, next, level |

## 測試

已安裝 Node.js 時，在此資料夾執行 `node test.js`：10 組核心測試，涵蓋媒合邊界、估值、複習日程、日期、關聯、資料驗證與備份往返。原版另以 `node ../test.js` 驗證。

手動驗收：

1. 房仲新增虛構買方，編輯並重整，確認仍存在；配對切換買方。
2. 新增物件並修改階段，確認案件統計改變；新增帶看後確認關聯買方不可直接刪除。
3. 企業研究切換台積電與統一；新增年度財報，確認趨勢與自由現金流改變。
4. 估值輸入 EPS 10、PE 20、折扣 30%、股價 150，應得到合理價 200、目標買價 140、安全邊際 25%。
5. 新增學習時間，查看學習統計；課程進度另外編輯。
6. 錯題按「記得」或「忘記」，確認複習日期更新。
7. 完整備份後新增一筆資料，再還原備份，確認回到備份狀態。無效備份不應更動資料。
8. 在手機測試導覽、表單、研究表格與備份功能。

開發驗證另使用本機 Chromium：通過導覽、新增與重新載入、HTML 文字轉義、配對、案件統計、估值、複習、備份下載／還原、390px 四模組無頁面水平溢位、無 JavaScript 錯誤及無外部請求。未實機驗證 Windows Edge 或 iOS Safari。

## 儲存庫保護

開發前檢查了 GitHub `edwardhisoka-cmd/-` 與乾淨的本機 checkout。僅新增 `workbench-mvp/`，原版 index.html、app.js、core.js、style.css、README.md、test.js 均保留。未變更 GitHub Pages 或任何部署設定。

程式授權見本資料夾 LICENSE（MIT）；crm.js 沿用使用者原有程式。
