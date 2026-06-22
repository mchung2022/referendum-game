# 「民主大作戰：公投小達人！」線上學習遊戲

這是一款專為國中學生設計的公民投票（公投）線上學習遊戲。結合了法規問答、思辨卡牌分類、互動式投票所模擬及開票結算，幫助學生在遊戲中理解台灣的公投制度、投票流程及公民素養。

## 🌟 遊戲特點
1. **完全無伺服器架構**：前端網頁託管於 GitHub Pages，後端數據直接寫入您自己的 Google Sheets 試算表。
2. **思辨引導**：第二關卡牌分類引導學生判斷支持、反對論述，並辨識不實言論與情緒性字眼。
3. **即時排行榜與公投統計**：學生完成遊戲後，數據即時上傳，畫面同步顯示全班的投票統計圖表與得分排行榜。

---

## 🛠️ 後端設定教學 (Google Sheets + Apps Script)

要讓遊戲能夠儲存學生的成績與投票結果，您需要設定一個 Google 試算表作為資料庫：

### 第一步：建立試算表與貼上代碼
1. 登入您的 Google 帳號，建立一個新的 **Google 試算表 (Google Sheets)**。
2. 將試算表命名為例如「公投遊戲學生資料庫」。
3. 點選上方選單的 **「擴充功能」** -> **「Apps Script」**。
4. 刪除原本編輯器中的所有內容，並將專案資料夾中的 [google-apps-script.js](file:///google-apps-script.js) 檔案內容完整複製並貼上。
5. 點選上方儲存按鈕（硬碟圖示）。

### 第二步：部署為網頁應用程式
1. 點選右上角的 **「部署」** -> **「新增部署」**。
2. 在彈出的視窗中，點選左側齒輪旁的選單，選取 **「網頁應用程式」**。
3. 進行以下設定：
   - **說明**：公投遊戲後端
   - **專案執行身分**：選擇 **「我」**（您的 Google 帳號）
   - **誰有存取權**：選擇 **「所有人」** (Anyone)  *(請注意：必須是所有人，遊戲網頁才能寫入資料)*
4. 點選下方 **「部署」**。
5. 此時會跳出「授權存取」提示，點選 **「授予存取權」**，選擇您的 Google 帳號。
   - *(若出現「Google 尚未驗證此應用程式」警告，請點選左下角的 **「進階」**，再點選 **「前往『未命名專案』(不安全)」** 即可)*。
6. 部署成功後，**複製畫面上的「網頁應用程式 URL」**。

### 第三步：將 URL 設定到遊戲中
- 您有兩種方式可以設定這個網頁應用程式網址：
  - **方式 A (推薦)**：直接開啟遊戲網頁，點選右上角齒輪設定圖示，將網址貼入「後端 Google Sheet API 網址」欄位並儲存。這會儲存在瀏覽器的 LocalStorage 中，適合每位老師在課堂上各自設定。
  - **方式 B (永久固定)**：在程式碼中修改。打開 `app.js`，找到最上方的 `CONFIG.googleAppScriptUrl`，將您的網址貼入雙引號中，這樣學生打開網頁時就不用手動設定了。

---

## 🚀 前端 GitHub 部署教學

您可以利用 GitHub Pages 免費且快速地發佈此網頁：

### 1. 初始化 Git 並提交代碼
若您本地尚未初始化 Git，請在 `referendum-game` 資料夾下開啟終端機並執行：
```bash
git init
git add .
git commit -m "Initial commit: referendum game"
```

### 2. 在 GitHub 上建立倉庫 (Repository)
1. 登入您的 GitHub 帳號，點選右上角 **「New repository」**。
2. 命名為 `referendum-game`。
3. 設為 **Public**。
4. 不要勾選 Add a README, .gitignore 或 license。
5. 點選 **Create repository**。

### 3. 將代碼 Push 到 GitHub
複製 GitHub 頁面上的終端機指令（請將 `<YOUR_USERNAME>` 替換為您的帳號）：
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/referendum-game.git
git branch -M main
git push -u origin main
```

### 4. 開啟 GitHub Pages 網頁
1. 進入您 GitHub 上的 `referendum-game` 倉庫頁面。
2. 點選右側選單的 **「Settings」** (設定)。
3. 在左側欄選取 **「Pages」**。
4. 在 **Build and deployment** 底下的 **Branch**，將 `None` 改為 **`main`** 或者是 `/ (root)`，然後點選 **「Save」**。
5. 等待約 1-2 分鐘後重新整理頁面，最上方會出現您的專案網址（例如：`https://<YOUR_USERNAME>.github.io/referendum-game/`）。學生只要打開此連結即可開始遊玩！

---

## 📂 專案檔案結構
- `index.html`：遊戲前端介面與結構。
- `style.css`：專為國中生設計的漸層色彩、卡牌動畫與現代化 UI 樣式。
- `app.js`：遊戲的核心關卡邏輯、倒數計時與 API 資料存取。
- `google-apps-script.js`：後端 Google Sheets 串接代碼。
