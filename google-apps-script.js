/**
 * 「民主大作戰：公投小達人！」線上遊戲 - 後端 Google Apps Script (完整修正版)
 * 
 * 使用方式：
 * 1. 建立一個新的 Google 試算表 (Google Sheets)。
 * 2. 點選選單的「擴充功能」->「Apps Script」。
 * 3. 將此檔案的所有程式碼複製並貼上，覆蓋原本的內容。
 * 4. 點選「儲存」(儲存專案)。
 * 5. 點選「網頁應用程式部署」：
 *    - 點選右上角「部署」->「新增部署」。
 *    - 選取類型：選取「網頁應用程式」。
 *    - 說明：輸入「公投遊戲後端」。
 *    - 專案執行身分：選擇「我」(您的 Google 帳號)。
 *    - 誰有存取權：選擇「所有人」(Anyone)。
 *    - 點選「部署」。
 * 6. 授權存取（若有跳出安全性警告，點選「進階」並允許存取）。
 * 7. 複製產生的「網頁應用程式 URL」，將其填入遊戲網頁的後台設定中。
 */

function doGet(e) {
  // 防呆：如果是從編輯器直接點選「執行」，e 會是 undefined
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("⚠️ 提示：您目前是從 Google Apps Script 編輯器直接按「執行」按鈕，此時系統沒有傳入網頁參數。請將此專案「部署為網頁應用程式」，並使用部署產生的網址來連接遊戲前端。")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  var action = e.parameter.action;
  var callback = e.parameter.callback; // 用於 JSONP 的 Callback 函式名稱
  var responseData;
  
  try {
    if (action === 'submit') {
      // 透過 GET 提交資料 (解決 CORS 與多帳號登入導致的 NetworkError)
      responseData = handleSubmitData(e.parameter);
    } else if (action === 'getLeaderboard') {
      responseData = getLeaderboardData();
    } else if (action === 'getStats') {
      responseData = getStatsData();
    } else {
      // 預設返回全部
      responseData = {
        leaderboard: getLeaderboardData(),
        stats: getStatsData()
      };
    }
  } catch (error) {
    responseData = {
      success: false,
      error: error.toString()
    };
  }
  
  // 輸出處理：如果是 JSONP 請求，包裝成 JS Callback 執行
  if (callback) {
    var jsonString = JSON.stringify(responseData);
    var callbackSource = callback + "(" + jsonString + ");";
    return ContentService.createTextOutput(callbackSource)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 否則回傳一般 JSON
    return sendJsonResponse(responseData);
  }
}

// 相容 doPost
function doPost(e) {
  if (!e) {
    return sendJsonResponse({
      success: false,
      error: "⚠️ 提示：您目前是從 Apps Script 編輯器直接執行，請使用遊戲前端發送 POST 請求。"
    });
  }
  
  try {
    var postData;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      postData = e.parameter;
    }
    
    var result = handleSubmitData(postData);
    return sendJsonResponse(result);
    
  } catch (error) {
    return sendJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 寫入試算表記錄的主程式
function handleSubmitData(data) {
  var name = data.name || "匿名學生";
  var classId = data.classId || "未填寫";
  var score = parseInt(data.score) || 0;
  var timeSec = parseInt(data.timeSec) || 0;
  var topic = data.topic || "未知議題";
  var voteResult = data.voteResult || "無效票";
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 如果是空試算表，先初始化標頭
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["時間戳記", "姓名", "班級座號", "公投議題", "遊戲得分", "所花時間(秒)", "公投投票"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e6f7ff");
  }
  
  // 新增一筆記錄
  sheet.appendRow([
    new Date(),
    name,
    classId,
    topic,
    score,
    timeSec,
    voteResult
  ]);
  
  return {
    success: true,
    leaderboard: getLeaderboardData(),
    stats: getStatsData()
  };
}

// 取得前 20 名排行榜 (分數由高到低，時間由短到長)
function getLeaderboardData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() <= 1) return [];
  
  var range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7);
  var values = range.getValues();
  
  var list = [];
  for (var i = 0; i < values.length; i++) {
    list.push({
      timestamp: values[i][0],
      name: values[i][1],
      classId: values[i][2],
      topic: values[i][3],
      score: parseInt(values[i][4]) || 0,
      timeSec: parseInt(values[i][5]) || 0,
      voteResult: values[i][6]
    });
  }
  
  // 排序：分數降冪，時間升冪
  list.sort(function(a, b) {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timeSec - b.timeSec;
  });
  
  // 只取前 20 名
  return list.slice(0, 20);
}

// 取得投票統計數據
function getStatsData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() <= 1) return { agree: 0, disagree: 0, total: 0 };
  
  var range = sheet.getRange(2, 7, sheet.getLastRow() - 1, 1); // 讀取投票結果那一欄
  var values = range.getValues();
  
  var agree = 0;
  var disagree = 0;
  var invalid = 0;
  
  for (var i = 0; i < values.length; i++) {
    var v = values[i][0];
    if (v === "同意" || v === "Agree" || v === "贊成") {
      agree++;
    } else if (v === "不同意" || v === "Disagree" || v === "反對") {
      disagree++;
    } else {
      invalid++;
    }
  }
  
  var total = agree + disagree + invalid;
  
  return {
    agree: agree,
    disagree: disagree,
    invalid: invalid,
    total: total
  };
}

// 包裝 JSON 回傳 (移除了不支援的 setHeader 呼叫，由 Google 伺服器自動處理跨網域)
function sendJsonResponse(data) {
  var json = JSON.stringify(data);
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
