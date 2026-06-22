/**
 * 「民主大作戰：公投小達人！」線上遊戲 - 前端核心邏輯 (app.js)
 */

// ================= 全局配置與狀態 =================
const CONFIG = {
    // 預設為空。教師可在遊戲右上角設定，或者在此直接寫入 GAS 網頁部署網址
    googleAppScriptUrl: "https://script.google.com/macros/s/AKfycbwNyvt459msBLMuTvYlefiDez9LAiI2XY1hXw-dvVKvElXZzjGhvvvDAR1T7Q7UX_vDvg/exec" 
};

const gameState = {
    playerName: "",
    classId: "",
    topic: "phone", // 'phone' | 'shelter'
    score: 0,
    startTime: null,
    totalTimeSec: 0,
    
    // 關卡計時與資料
    currentStage: 0, // 0: welcome, 1: quiz, 2: debate, 3: polling, 4: counting, 5: results
    stage1Score: 0, // 連署分數
    stage2Score: 0, // 思辨分數
    voteChoice: "", // 'agree' | 'disagree' | 'invalid'
    ballotValidity: "valid", // 'valid' | 'invalid'
    selectedStampTool: "official", // 'official' | 'personal'
    
    // 關卡計時器
    timerInterval: null,
    stageTimers: {
        stage1: 0,
        stage2: 0,
        stage3: 0,
        stage4: 0
    }
};

// ================= 關卡資料 =================
// 第一關：法規問題
const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "【年齡門檻】依照我國《公民投票法》規定，除了受監護宣告尚未撤銷者外，國民年滿幾歲才具有公民投票權？",
        options: [
            { text: "16 歲", isCorrect: false },
            { text: "18 歲", isCorrect: true },
            { text: "20 歲", isCorrect: false },
            { text: "22 歲", isCorrect: false }
        ],
        explanation: "💡 答案是：18 歲！2018 年公投法修正後，公投投票權年齡已調降至 18 歲，目的在鼓勵青年參與公共事務；但請注意，總統與民意代表等一般公職人員的「選舉權」在憲法中仍規定為 20 歲喔！"
    },
    {
        id: 2,
        question: "【提案限制】公投是人民直接民權的展現。但為了防止民粹或保障少數，下列哪一個事項「絕對不可以」作為全國性公民投票的提案主題？",
        options: [
            { text: "預算、租稅、薪俸及人事事項", isCorrect: true },
            { text: "能源與環境保護政策 (如核四、中油三接)", isCorrect: false },
            { text: "勞動基準法修改與基本工資調漲", isCorrect: false },
            { text: "延長義務役役期或國防政策", isCorrect: false }
        ],
        explanation: "💡 答案是：預算、租稅、薪俸及人事事項！《公民投票法》第 1 條明文限制這些財務人事案不得公投，否則若大家都公投「不用繳稅」或「大幅加薪」，國家財政與運作將會崩潰！"
    },
    {
        id: 3,
        question: "【投票規則】在公投投票所投票時，如果手抖不小心蓋錯選票（例如本來想蓋同意，卻蓋到不同意），該怎麼處理最符合法律規定？",
        options: [
            { text: "可以舉手向現場選務人員申請換發一張新選票", isCorrect: false },
            { text: "直接撕毀蓋錯的選票，並重新領取一張", isCorrect: false },
            { text: "只能直接將選票投進票匭（絕對不能撕毀，否則會被罰款）", isCorrect: true },
            { text: "用自己帶的原子筆在蓋錯的地方打叉，改蓋在正確位置", isCorrect: false }
        ],
        explanation: "💡 答案是：只能直接將選票投進票匭！公投票領取後一旦有任何污損、蓋錯，均「無法換發」。絕對不能當場撕毀選票，否則會違反公投法處以 5,000 元至 50,000 元罰鍰；亦不可在選票上塗改或書寫任何字樣，否則會被認定為無效票。"
    }
];

// 第二關：思辨卡牌資料
const TOPIC_DEBATE_CARDS = {
    phone: [
        {
            text: "「下課時間是學生的自由休閒時間，開放使用手機有助於訓練學生的數位自主管理，並能適度舒緩課業壓力。」",
            category: "pro",
            source: "—— 贊成方：學生權益促進小組"
        },
        {
            text: "「國中生自制力尚在發展階段，若下課開放使用手機，容易造成上課分心，且會大幅減少同學間面對面的人際實體社交。」",
            category: "con",
            source: "—— 反對方：家長與教師聯合會"
        },
        {
            text: "「如果不開放手機，大家的手腦發育就會嚴重退化，最後像恐龍滅絕一樣變成沒有智慧的石器時代原始人！」",
            category: "invalid",
            source: "—— 網路论坛留言 (滑坡謬誤與情緒性字眼)"
        },
        {
            text: "「美國太空總署 NASA 內部研究指出，全面禁止手機的學校學生，腦波會產生異常波動，智商比一般人低 50%！」",
            category: "invalid",
            source: "—— 社群媒體傳言 (未經證實的假訊息與偽科學)"
        },
        {
            text: "「開放手機使用，讓學生在遇到突發緊急狀況（如受傷、病假、臨時補習改時間）時，能即時與家長取得聯繫，提升人身安全保障。」",
            category: "pro",
            source: "—— 贊成方：部分家長與學生代表"
        },
        {
            text: "「許多學校現有的無線網路基礎建設不足，若下課大量手機連線，會導致校園行政網路癱瘓，且充電設備也可能引發安全隱憂。」",
            category: "con",
            source: "—— 反對方：學校資訊處行政主管"
        }
    ],
    shelter: [
        {
            text: "「流浪動物在外遭受風吹雨打，興建完善的收容所能提供安全庇護、安排結紮與醫療，從源頭減少流浪犬貓與人衝突的機會。」",
            category: "pro",
            source: "—— 贊成方：動物保護福利基金會"
        },
        {
            text: "「收容所會帶來長期的犬吠噪音與動物排泄物異味問題，對周邊居民的環境生活品質與房價會產生嚴重的負面影響。」",
            category: "con",
            source: "—— 反對方：社區居民自救會"
        },
        {
            text: "「聽說興建收容所是政府為了要秘密集體毒殺流浪動物，背後有著龐大的官商勾結利益，大家千萬不能被騙！」",
            category: "invalid",
            source: "—— LINE群組瘋傳消息 (陰謀論與不實指控)"
        },
        {
            text: "「只要我們的收容所一蓋好，全台灣的流浪狗明天都會瞬間被太空傳送門吸到我們社區，我們出門一定會被狗咬死！」",
            category: "invalid",
            source: "—— 網路論壇激烈言論 (極度誇張的情緒字眼與謬誤)"
        },
        {
            text: "「規劃良好的收容中心可以轉型為生命教育園區，定期舉辦學童動保講座、志工服務與認養會，讓社區成為人與動物和諧相處的示範區。」",
            category: "pro",
            source: "—— 贊成方：生命教育推廣協會"
        },
        {
            text: "「社區目前的土地資源十分稀缺，應該優先興建市民活動中心、圖書館或兒童公園綠地，而非將預算花在非人類身上。」",
            category: "con",
            source: "—— 反對方：里民代表與城市規劃學者"
        }
    ]
};

// ================= DOM 元素 =================
const views = {
    welcome: document.getElementById("view-welcome"),
    stage1: document.getElementById("view-stage1"),
    stage2: document.getElementById("view-stage2"),
    stage3: document.getElementById("view-stage3"),
    stage4: document.getElementById("view-stage4"),
    results: document.getElementById("view-results")
};

// ================= 輔助函式 =================
// 切換畫面
function showView(viewName) {
    Object.keys(views).forEach(key => {
        views[key].classList.remove("active");
    });
    views[viewName].classList.add("active");
    
    // 捲動至最上方
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 載入設定好的 GAS URL
function getGasUrl() {
    return localStorage.getItem("gas_backend_url") || CONFIG.googleAppScriptUrl || "";
}

// 計時器管理
function startStageTimer(stageKey, displayElement) {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    let seconds = 0;
    displayElement.textContent = seconds;
    
    gameState.timerInterval = setInterval(() => {
        seconds++;
        gameState.stageTimers[stageKey] = seconds;
        displayElement.textContent = seconds;
    }, 1000);
}

function stopStageTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// ================= 初始化設定 =================
document.addEventListener("DOMContentLoaded", () => {
    // 載入已儲存的 GAS API URL 到設定欄位
    const savedUrl = localStorage.getItem("gas_backend_url");
    if (savedUrl) {
        document.getElementById("input-gas-url").value = savedUrl;
    }
    
    // 初始化設定視窗事件
    const settingsModal = document.getElementById("settings-modal");
    document.getElementById("btn-open-settings").addEventListener("click", () => {
        settingsModal.classList.add("active");
    });
    
    document.getElementById("btn-close-settings").addEventListener("click", () => {
        settingsModal.classList.remove("active");
    });
    
    document.getElementById("btn-save-settings").addEventListener("click", () => {
        const urlValue = document.getElementById("input-gas-url").value.trim();
        localStorage.setItem("gas_backend_url", urlValue);
        alert("💾 設定已成功儲存！");
        settingsModal.classList.remove("active");
    });
    
    document.getElementById("btn-test-connection").addEventListener("click", async () => {
        const url = document.getElementById("input-gas-url").value.trim();
        const resultDiv = document.getElementById("settings-test-result");
        resultDiv.style.display = "block";
        resultDiv.style.color = "var(--warning)";
        resultDiv.textContent = "⚡ 正在發送測試請求...";
        
        if (!url) {
            resultDiv.style.color = "var(--danger)";
            resultDiv.textContent = "❌ 請先輸入 API 網址！";
            return;
        }
        
        try {
            // 使用 JSONP 發送一個測試的 GET 請求 (避免 CORS 與多帳號登入問題)
            const data = await fetchJsonp(url, { action: "getStats" });
            
            if (data && typeof data.agree !== 'undefined') {
                resultDiv.style.color = "var(--accent)";
                resultDiv.textContent = "✅ 連線成功！Google Sheet 可以正常通訊。";
            } else {
                resultDiv.style.color = "var(--danger)";
                resultDiv.textContent = "❌ 連線成功，但回傳的資料格式不符。請確認 Apps Script 部署正確。";
            }
        } catch (error) {
            console.error(error);
            resultDiv.style.color = "var(--danger)";
            resultDiv.textContent = "❌ 連線失敗：" + error.message;
        }
    });

    // 議題卡片選擇事件
    const topicCards = document.querySelectorAll(".topic-card");
    topicCards.forEach(card => {
        card.addEventListener("click", () => {
            topicCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            gameState.topic = card.getAttribute("data-topic");
        });
    });

    // 開始按鈕
    document.getElementById("btn-start-game").addEventListener("click", startGame);
});

// ================= 遊戲核心邏輯 =================

// 開始遊戲
function startGame() {
    const nameInput = document.getElementById("input-name").value.trim();
    const classInput = document.getElementById("input-class").value.trim();
    
    if (!nameInput) {
        alert("請輸入您的姓名或暱稱以開始遊戲！");
        return;
    }
    
    gameState.playerName = nameInput;
    gameState.classId = classInput || "未填寫班級";
    gameState.score = 0;
    gameState.startTime = Date.now();
    
    // 初始化關卡
    initStage1();
}

// ---------------- 第一關：公投連署大作戰 ----------------
let s1CurrentQuestionIdx = 0;
let s1CorrectAnswersCount = 0;

function initStage1() {
    gameState.currentStage = 1;
    s1CurrentQuestionIdx = 0;
    s1CorrectAnswersCount = 0;
    updateS1Progress();
    
    showView("stage1");
    startStageTimer("stage1", document.getElementById("s1-timer-val"));
    
    loadQuizQuestion();
    
    document.getElementById("btn-next-q").onclick = () => {
        s1CurrentQuestionIdx++;
        loadQuizQuestion();
    };
    
    document.getElementById("btn-finish-s1").onclick = () => {
        stopStageTimer();
        initStage2();
    };
}

function updateS1Progress() {
    const progressFill = document.getElementById("s1-progress");
    const progressText = document.getElementById("s1-progress-text");
    const signatures = s1CorrectAnswersCount * 1000;
    
    const pct = (signatures / 3000) * 100;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `已收集連署書：${signatures.toLocaleString()} / 3,000 份`;
}

function loadQuizQuestion() {
    const question = QUIZ_QUESTIONS[s1CurrentQuestionIdx];
    
    document.getElementById("btn-next-q").style.display = "none";
    document.getElementById("btn-finish-s1").style.display = "none";
    
    const expPanel = document.getElementById("quiz-explanation");
    expPanel.classList.remove("active");
    
    document.getElementById("quiz-question").textContent = question.question;
    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";
    
    const badges = ["A", "B", "C", "D"];
    question.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = `<span class="option-badge">${badges[idx]}</span> ${opt.text}`;
        
        btn.addEventListener("click", () => handleQuizAnswer(opt, btn, question.explanation));
        optionsContainer.appendChild(btn);
    });
}

function handleQuizAnswer(option, clickedBtn, explanation) {
    // 禁用所有按鈕
    const allButtons = document.querySelectorAll(".option-btn");
    allButtons.forEach(btn => btn.disabled = true);
    
    const isCorrect = option.isCorrect;
    
    if (isCorrect) {
        clickedBtn.classList.add("correct");
        s1CorrectAnswersCount++;
        gameState.score += 500; // 每題 500 分
        updateS1Progress();
    } else {
        clickedBtn.classList.add("incorrect");
        // 找出正確的按鈕標註綠色
        const question = QUIZ_QUESTIONS[s1CurrentQuestionIdx];
        const correctIdx = question.options.findIndex(o => o.isCorrect);
        if (correctIdx !== -1) {
            allButtons[correctIdx].classList.add("correct");
        }
    }
    
    // 顯示解析說明
    const expPanel = document.getElementById("quiz-explanation");
    expPanel.innerHTML = explanation;
    expPanel.classList.add("active");
    
    // 判斷是否為最後一題
    if (s1CurrentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
        document.getElementById("btn-next-q").style.display = "flex";
    } else {
        // 連署結算
        const signatures = s1CorrectAnswersCount * 1000;
        const resultBtn = document.getElementById("btn-finish-s1");
        
        if (signatures >= 2000) {
            resultBtn.textContent = `連署成功！送交中選會！📂 (獲得 ${signatures.toLocaleString()} 份連署)`;
            resultBtn.className = "btn btn-accent";
        } else {
            resultBtn.textContent = `連署失敗！但獲得地方支持破格送審 📁 (僅獲得 ${signatures.toLocaleString()} 份連署，扣 300 分)`;
            resultBtn.className = "btn btn-danger";
            gameState.score = Math.max(0, gameState.score - 300);
        }
        resultBtn.style.display = "flex";
    }
}


// ---------------- 第二關：議題大辯論 ----------------
let s2CurrentCardIdx = 0;
let s2Deck = [];
let s2Score = 0;

function initStage2() {
    gameState.currentStage = 2;
    s2CurrentCardIdx = 0;
    s2Score = 0;
    s2Deck = [...TOPIC_DEBATE_CARDS[gameState.topic]];
    
    // 打亂卡牌順序
    s2Deck.sort(() => Math.random() - 0.5);
    
    document.getElementById("s2-score").textContent = s2Score;
    updateS2Progress();
    
    showView("stage2");
    startStageTimer("stage2", document.getElementById("s2-timer-val"));
    
    loadDebateCard();
    
    // 綁定分類按鈕
    const sortButtons = document.querySelectorAll(".sort-btn");
    sortButtons.forEach(btn => {
        // 先複製按鈕清除舊事件
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", () => {
            const category = newBtn.getAttribute("data-category");
            handleCardSort(category);
        });
    });
    
    document.getElementById("btn-finish-s2").onclick = () => {
        stopStageTimer();
        initStage3();
    };
    
    document.getElementById("btn-finish-s2").style.display = "none";
    document.querySelector(".sorting-buttons").style.display = "grid";
}

function updateS2Progress() {
    const progressFill = document.getElementById("s2-progress");
    const pct = (s2CurrentCardIdx / s2Deck.length) * 100;
    progressFill.style.width = `${pct}%`;
    document.getElementById("s2-card-idx").textContent = Math.min(s2CurrentCardIdx + 1, s2Deck.length);
}

function loadDebateCard() {
    if (s2CurrentCardIdx >= s2Deck.length) {
        // 完成所有卡牌
        document.querySelector(".sorting-buttons").style.display = "none";
        const finishBtn = document.getElementById("btn-finish-s2");
        finishBtn.style.display = "flex";
        finishBtn.textContent = `辯論結束！獲得思辨積分：${s2Score} 分 ➡️`;
        
        gameState.stage2Score = s2Score;
        gameState.score += s2Score;
        return;
    }
    
    const card = s2Deck[s2CurrentCardIdx];
    const cardEl = document.getElementById("debate-card");
    
    cardEl.style.transform = "scale(0.8) rotateY(-10deg)";
    cardEl.style.opacity = "0";
    
    setTimeout(() => {
        document.getElementById("card-content").textContent = card.text;
        document.getElementById("card-source").textContent = card.source;
        cardEl.style.transform = "scale(1) rotateY(0)";
        cardEl.style.opacity = "1";
    }, 150);
}

function handleCardSort(userCategory) {
    const card = s2Deck[s2CurrentCardIdx];
    const cardEl = document.getElementById("debate-card");
    const isCorrect = card.category === userCategory;
    
    // 動畫回饋：飛出畫面
    let flyClass = "";
    if (userCategory === "pro") {
        flyClass = "translate(150px, -50px) rotate(15deg)";
        cardEl.style.borderColor = "var(--accent)";
    } else if (userCategory === "con") {
        flyClass = "translate(-150px, -50px) rotate(-15deg)";
        cardEl.style.borderColor = "var(--secondary)";
    } else {
        flyClass = "translate(0px, 150px) scale(0.8)";
        cardEl.style.borderColor = "var(--danger)";
    }
    
    cardEl.style.transform = flyClass;
    cardEl.style.opacity = "0";
    
    if (isCorrect) {
        s2Score += 200;
    } else {
        s2Score = Math.max(0, s2Score - 100);
    }
    
    document.getElementById("s2-score").textContent = s2Score;
    
    s2CurrentCardIdx++;
    updateS2Progress();
    
    setTimeout(() => {
        cardEl.style.borderColor = "var(--glass-border)";
        loadDebateCard();
    }, 350);
}


// ---------------- 第三關：走入投票所 ----------------
let pollingStep = 1;

function initStage3() {
    gameState.currentStage = 3;
    pollingStep = 1;
    gameState.voteChoice = "";
    gameState.ballotValidity = "valid";
    gameState.selectedStampTool = "official";
    
    // 更新互動 UI
    updatePollingStepUI();
    
    showView("stage3");
    startStageTimer("stage3", document.getElementById("s3-timer-val"));
    
    // Step 1: 身分證、印章點選
    let idDone = false;
    let stampDone = false;
    
    document.getElementById("item-idcard").onclick = () => {
        idDone = true;
        document.getElementById("item-idcard").style.opacity = "0.4";
        document.getElementById("item-idcard").style.borderColor = "var(--accent)";
        checkStep1();
    };
    
    document.getElementById("item-stamp").onclick = () => {
        stampDone = true;
        document.getElementById("item-stamp").style.opacity = "0.4";
        document.getElementById("item-stamp").style.borderColor = "var(--accent)";
        checkStep1();
    };
    
    function checkStep1() {
        if (idDone && stampDone) {
            setTimeout(() => {
                pollingStep = 2;
                updatePollingStepUI();
            }, 800);
        }
    }
    
    // Step 2: 領票點選
    document.getElementById("item-getballot").onclick = () => {
        document.getElementById("item-getballot").style.transform = "scale(0.9)";
        setTimeout(() => {
            pollingStep = 3;
            updatePollingStepUI();
        }, 600);
    };
    
    // Step 3: 圈選選票與工具切換
    // 設定公投選票題目
    const topicTitle = gameState.topic === "phone" ? "校園下課時間開放使用手機公投案" : "社區興建流浪貓狗收容中心公投案";
    document.getElementById("ballot-topic-text").textContent = topicTitle;
    
    // 清除舊有的蓋印
    document.getElementById("circle-agree").innerHTML = "";
    document.getElementById("circle-disagree").innerHTML = "";
    
    // 切換圈選章工具
    const toolOfficial = document.getElementById("tool-official-stamp");
    const toolPersonal = document.getElementById("tool-personal-stamp");
    const ballotArea = document.getElementById("interactive-ballot");
    const toolInfo = document.getElementById("tool-info-text");
    
    // 預設為官方章
    ballotArea.classList.add("custom-stamp-cursor");
    
    toolOfficial.onclick = () => {
        gameState.selectedStampTool = "official";
        toolOfficial.style.border = "2px solid var(--accent)";
        toolPersonal.style.border = "1px solid var(--glass-border)";
        ballotArea.classList.add("custom-stamp-cursor");
        toolInfo.textContent = "目前使用工具：官方圈選章 (合法圈選工具)";
        toolInfo.style.color = "#fca5a5";
    };
    
    toolPersonal.onclick = () => {
        gameState.selectedStampTool = "personal";
        toolPersonal.style.border = "2px solid var(--danger)";
        toolOfficial.style.border = "1px solid var(--glass-border)";
        ballotArea.classList.remove("custom-stamp-cursor");
        toolInfo.textContent = "🚨 注意：使用個人印章蓋印會使公投票「無效」！";
        toolInfo.style.color = "var(--danger)";
    };
    
    // 蓋章點擊事件
    document.getElementById("choice-agree").onclick = () => {
        stampBallot("agree");
    };
    
    document.getElementById("choice-disagree").onclick = () => {
        stampBallot("disagree");
    };
    
    function stampBallot(choice) {
        const targetCircle = choice === "agree" ? document.getElementById("circle-agree") : document.getElementById("circle-disagree");
        const oppositeCircle = choice === "agree" ? document.getElementById("circle-disagree") : document.getElementById("circle-agree");
        
        // 清除另一個的章，公投是單選
        oppositeCircle.innerHTML = "";
        targetCircle.innerHTML = "";
        
        gameState.voteChoice = choice;
        
        if (gameState.selectedStampTool === "official") {
            targetCircle.innerHTML = `<div class="stamp-mark"></div>`;
            gameState.ballotValidity = "valid";
        } else {
            // 個人私章
            targetCircle.innerHTML = `<div class="invalid-stamp-mark">${gameState.playerName[0] || "印"}</div>`;
            gameState.ballotValidity = "invalid";
        }
        
        // 延遲進入 Step 4
        setTimeout(() => {
            pollingStep = 4;
            updatePollingStepUI();
        }, 1200);
    }
    
    // Step 4: 投入票匭
    document.getElementById("ballot-box-target").onclick = () => {
        document.getElementById("ballot-box-target").style.transform = "scale(0.9)";
        
        // 投票成功加分
        if (gameState.ballotValidity === "valid") {
            gameState.score += 500; // 成功投下有效票加 500 分
        } else {
            gameState.score += 100; // 投下無效票只加基本分
        }
        
        setTimeout(() => {
            stopStageTimer();
            initStage4();
        }, 800);
    };
}

function updatePollingStepUI() {
    // 隱藏所有互動面板
    document.getElementById("polling-step1").style.display = "none";
    document.getElementById("polling-step2").style.display = "none";
    document.getElementById("polling-step3").style.display = "none";
    document.getElementById("polling-step4").style.display = "none";
    
    // 更新指示器節點狀態
    for (let i = 1; i <= 4; i++) {
        const node = document.getElementById(`step-node-${i}`);
        node.className = "step-node";
        if (i < pollingStep) {
            node.classList.add("done");
        } else if (i === pollingStep) {
            node.classList.add("active");
        }
    }
    
    // 顯示對應面板
    if (pollingStep === 1) {
        document.getElementById("polling-step1").style.display = "block";
    } else if (pollingStep === 2) {
        document.getElementById("polling-step2").style.display = "block";
    } else if (pollingStep === 3) {
        document.getElementById("polling-step3").style.display = "flex";
    } else if (pollingStep === 4) {
        document.getElementById("polling-step4").style.display = "block";
    }
}


// ---------------- 第四關：開票與結算 ----------------
function initStage4() {
    gameState.currentStage = 4;
    showView("stage4");
    startStageTimer("stage4", document.getElementById("s4-timer-val"));
    
    // 更新開票標題
    const topicText = gameState.topic === "phone" ? "校園下課開放手機案" : "社區流浪犬貓收容所案";
    document.getElementById("counting-topic-title").textContent = topicText;
    
    document.getElementById("result-pass-card").classList.remove("active");
    document.getElementById("result-fail-card").classList.remove("active");
    document.getElementById("btn-finish-s4").style.display = "none";
    
    // 動畫開票
    animateCounting();
}

function animateCounting() {
    const barAgree = document.getElementById("bar-agree");
    const barDisagree = document.getElementById("bar-disagree");
    const agreeTxt = document.getElementById("agree-votes-display");
    const disagreeTxt = document.getElementById("disagree-votes-display");
    
    // 模擬統計票數
    // 總選民數 10,000 人。同意票與不同意票將在 1/4 門檻 (2,500) 附近浮動。
    // 我們可以根據學生的投票決定是否更容易通過，增強帶入感！
    let targetAgree = 0;
    let targetDisagree = 0;
    
    if (gameState.topic === "phone") {
        // 手機案通常同意票稍高，但不同意票也多
        targetAgree = 3200 + Math.floor(Math.random() * 800); // 3200-4000
        targetDisagree = 2400 + Math.floor(Math.random() * 800); // 2400-3200
    } else {
        // 收容所案意見較為分歧，可能同意未達門檻
        targetAgree = 2200 + Math.floor(Math.random() * 1000); // 2200-3200
        targetDisagree = 2000 + Math.floor(Math.random() * 1000); // 2000-3000
    }
    
    // 把玩家的票加進去 (若是有效票的話)
    if (gameState.ballotValidity === "valid") {
        if (gameState.voteChoice === "agree") {
            targetAgree += 1;
        } else if (gameState.voteChoice === "disagree") {
            targetDisagree += 1;
        }
    }
    
    const totalSimulated = 10000;
    const agreePct = (targetAgree / totalSimulated) * 100;
    const disagreePct = (targetDisagree / totalSimulated) * 100;
    
    // 開票動畫
    let currentAgree = 0;
    let currentDisagree = 0;
    const duration = 2000; // 2秒
    const stepTime = 30;
    const steps = duration / stepTime;
    const agreeStep = targetAgree / steps;
    const disagreeStep = targetDisagree / steps;
    
    let stepCount = 0;
    const timer = setInterval(() => {
        stepCount++;
        currentAgree = Math.min(Math.round(agreeStep * stepCount), targetAgree);
        currentDisagree = Math.min(Math.round(disagreeStep * stepCount), targetDisagree);
        
        const curAgreePct = (currentAgree / totalSimulated) * 100;
        const curDisagreePct = (currentDisagree / totalSimulated) * 100;
        
        barAgree.style.width = `${curAgreePct}%`;
        barDisagree.style.width = `${curDisagreePct}%`;
        
        agreeTxt.textContent = `${currentAgree.toLocaleString()} 票 (${curAgreePct.toFixed(1)}%)`;
        disagreeTxt.textContent = `${currentDisagree.toLocaleString()} 票 (${curDisagreePct.toFixed(1)}%)`;
        
        if (stepCount >= steps) {
            clearInterval(timer);
            // 動畫結束，檢驗門檻
            checkReferendumThreshold(targetAgree, targetDisagree);
        }
    }, stepTime);
}

function checkReferendumThreshold(agree, disagree) {
    const threshold = 2500; // 1/4 of 10,000 electors
    
    const condMoreAgree = agree > disagree;
    const condReachThreshold = agree >= threshold;
    
    const elCond1 = document.getElementById("cond-more-agree");
    const elCond2 = document.getElementById("cond-reach-threshold");
    
    if (condMoreAgree) {
        elCond1.textContent = "✅ 是 (同意多於不同意)";
        elCond1.style.color = "#10b981";
    } else {
        elCond1.textContent = "❌ 否 (同意小於或等於不同意)";
        elCond1.style.color = "var(--danger)";
    }
    
    if (condReachThreshold) {
        elCond2.textContent = `✅ 是 (達門檻，${agree.toLocaleString()} 票 ≥ 2,500 票)`;
        elCond2.style.color = "#10b981";
    } else {
        elCond2.textContent = `❌ 否 (未達門檻，${agree.toLocaleString()} 票 < 2,500 票)`;
        elCond2.style.color = "var(--danger)";
    }
    
    // 判定最終通過
    const isPassed = condMoreAgree && condReachThreshold;
    
    setTimeout(() => {
        if (isPassed) {
            document.getElementById("result-pass-card").classList.add("active");
        } else {
            document.getElementById("result-fail-card").classList.add("active");
        }
        
        // 顯示最後按鈕
        const finishBtn = document.getElementById("btn-finish-s4");
        finishBtn.style.display = "flex";
        
        finishBtn.onclick = () => {
            stopStageTimer();
            finishGame();
        };
    }, 800);
}


// ---------------- 遊戲結算與排行榜 ----------------
async function finishGame() {
    gameState.currentStage = 5;
    
    // 計算總時間
    const elapsed = Math.round((Date.now() - gameState.startTime) / 1000);
    gameState.totalTimeSec = elapsed;
    
    // 渲染個人學習成果
    document.getElementById("res-val-score").textContent = gameState.score;
    document.getElementById("res-val-time").textContent = `${gameState.totalTimeSec} 秒`;
    
    const valStatus = document.getElementById("res-val-status");
    if (gameState.ballotValidity === "valid") {
        valStatus.textContent = "有效票 ⭕";
        valStatus.style.color = "var(--accent)";
    } else {
        valStatus.textContent = "無效票 ❌ (蓋私章)";
        valStatus.style.color = "var(--danger)";
    }
    
    const valVote = document.getElementById("res-val-vote");
    if (gameState.voteChoice === "agree") {
        valVote.textContent = "同意 👍";
        valVote.style.color = "#10b981";
    } else if (gameState.voteChoice === "disagree") {
        valVote.textContent = "不同意 👎";
        valVote.style.color = "var(--danger)";
    } else {
        valVote.textContent = "無投票印記";
        valVote.style.color = "var(--text-muted)";
    }
    
    showView("results");
    
    // 上傳資料與同步排行榜
    await syncLeaderboardAndStats();
    
    document.getElementById("btn-restart").onclick = () => {
        // 重置狀態並回首頁
        gameState.score = 0;
        gameState.stageTimers = { stage1: 0, stage2: 0, stage3: 0, stage4: 0 };
        document.getElementById("input-name").value = "";
        document.getElementById("input-class").value = "";
        showView("welcome");
    };
}

// 串接 Google Sheet API (發送與獲取)
// ---------------- JSONP 通訊輔助函式 (免去 CORS 限制) ----------------
function fetchJsonp(url, params) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_cb_' + Math.round(1000000 * Math.random());
        
        // 解析並組合 URL 參數
        const urlObj = new URL(url);
        Object.keys(params).forEach(key => {
            urlObj.searchParams.append(key, params[key]);
        });
        urlObj.searchParams.append('callback', callbackName);
        
        // 12 秒連線超時處理
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('伺服器連線超時，請檢查 Apps Script 是否部署正確並設定「所有人」皆可存取。'));
        }, 12000);
        
        function cleanup() {
            delete window[callbackName];
            const script = document.getElementById(callbackName);
            if (script) {
                script.parentNode.removeChild(script);
            }
            clearTimeout(timeoutId);
        }
        
        // 全域回呼函式
        window[callbackName] = function(data) {
            cleanup();
            resolve(data);
        };
        
        // 建立 Script 節點載入
        const script = document.createElement('script');
        script.id = callbackName;
        script.src = urlObj.toString();
        script.onerror = function() {
            cleanup();
            reject(new Error('網路連線失敗，請確認您的網路狀況或 API 網址是否正確。'));
        };
        
        document.body.appendChild(script);
    });
}

async function syncLeaderboardAndStats() {
    const gasUrl = getGasUrl();
    const statusContainer = document.getElementById("db-status-container");
    const statusText = document.getElementById("db-status-text");
    const spinner = document.getElementById("db-status-spinner");
    
    const params = {
        action: "submit",
        name: gameState.playerName,
        classId: gameState.classId,
        score: gameState.score,
        timeSec: gameState.totalTimeSec,
        topic: gameState.topic === "phone" ? "手機開放公投" : "動物收容所公投",
        voteResult: gameState.ballotValidity === "invalid" ? "無效票" : (gameState.voteChoice === "agree" ? "同意" : "不同意")
    };
    
    // 如果沒有設定後端，使用 LocalStorage 進行離線模擬
    if (!gasUrl) {
        statusText.textContent = "💡 未設定 Google Sheet API。使用本地暫存模擬排行數據。";
        spinner.style.display = "none";
        
        saveLocalRecord(params);
        renderLocalLeaderboard();
        renderLocalStats();
        return;
    }
    
    try {
        statusText.textContent = "正在將您的成績上傳至雲端試算表...";
        spinner.style.display = "inline-block";
        
        // 使用 JSONP 提交 (免去所有 CORS 與帳號跳轉導致的 NetworkError)
        const data = await fetchJsonp(gasUrl, params);
        
        if (data.success) {
            statusText.textContent = "✅ 資料同步成功！雲端數據載入完成。";
            spinner.style.display = "none";
            
            renderLeaderboard(data.leaderboard);
            renderStats(data.stats);
        } else {
            throw new Error(data.error || "後端返回失敗");
        }
        
    } catch (error) {
        console.error("雲端上傳失敗：", error);
        statusText.innerHTML = `⚠️ 雲端上傳失敗 (已自動轉為本地暫存)：${error.message}`;
        spinner.style.display = "none";
        
        saveLocalRecord(params);
        renderLocalLeaderboard();
        renderLocalStats();
    }
}

// ---------------- 離線 LocalStorage 暫存模擬邏輯 ----------------
function saveLocalRecord(record) {
    let localRecords = [];
    try {
        localRecords = JSON.parse(localStorage.getItem("referendum_records")) || [];
    } catch (e) {
        localRecords = [];
    }
    
    // 加入時間戳記
    record.timestamp = new Date().toISOString();
    localRecords.push(record);
    localStorage.setItem("referendum_records", JSON.stringify(localRecords));
}

function renderLeaderboard(list) {
    const tbody = document.getElementById("leaderboard-tbody");
    tbody.innerHTML = "";
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">尚無排行榜數據</td></tr>`;
        return;
    }
    
    list.forEach((item, index) => {
        const tr = document.createElement("tr");
        
        // 格式化投票選擇顯示
        let voteSpan = `<span style="color: var(--text-muted);">${item.voteResult}</span>`;
        if (item.voteResult === "同意") {
            voteSpan = `<span style="color: #10b981; font-weight: bold;">同意 👍</span>`;
        } else if (item.voteResult === "不同意") {
            voteSpan = `<span style="color: var(--danger); font-weight: bold;">不同意 👎</span>`;
        }
        
        tr.innerHTML = `
            <td style="text-align: center;"><span class="rank-badge">${index + 1}</span></td>
            <td>${escapeHtml(item.classId)}</td>
            <td style="font-weight: 600;">${escapeHtml(item.name)}</td>
            <td style="text-align: center; font-weight: bold; color: var(--accent);">${item.score}</td>
            <td style="text-align: center; font-family: var(--font-en);">${item.timeSec} 秒</td>
            <td>${voteSpan}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderStats(stats) {
    const globalBarAgree = document.getElementById("global-bar-agree");
    const globalBarDisagree = document.getElementById("global-bar-disagree");
    const agreePctSpan = document.getElementById("global-agree-pct");
    const disagreePctSpan = document.getElementById("global-disagree-pct");
    
    const total = stats.total || 0;
    const agree = stats.agree || 0;
    const disagree = stats.disagree || 0;
    
    let agreePct = 0;
    let disagreePct = 0;
    
    if (total > 0) {
        // 排除無效票來計算同意與不同意比例，或者以總投票為分母
        // 這裡採用有效票比例展示
        const validTotal = agree + disagree;
        if (validTotal > 0) {
            agreePct = (agree / validTotal) * 100;
            disagreePct = (disagree / validTotal) * 100;
        }
    } else {
        // 沒有資料時顯示預設
        agreePct = 50;
        disagreePct = 50;
    }
    
    globalBarAgree.style.width = `${agreePct}%`;
    globalBarDisagree.style.width = `${disagreePct}%`;
    
    agreePctSpan.textContent = `${agreePct.toFixed(1)}% (${agree} 票)`;
    disagreePctSpan.textContent = `${disagreePct.toFixed(1)}% (${disagree} 票)`;
}

// 離線本地排行榜渲染
function renderLocalLeaderboard() {
    let localRecords = [];
    try {
        localRecords = JSON.parse(localStorage.getItem("referendum_records")) || [];
    } catch(e) {
        localRecords = [];
    }
    
    // 依分數降冪、時間升冪排序
    localRecords.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.timeSec - b.timeSec;
    });
    
    // 取前 10 名
    renderLeaderboard(localRecords.slice(0, 10));
}

// 離線本地統計圖渲染
function renderLocalStats() {
    let localRecords = [];
    try {
        localRecords = JSON.parse(localStorage.getItem("referendum_records")) || [];
    } catch(e) {
        localRecords = [];
    }
    
    // 過濾目前主題的統計
    const curTopicName = gameState.topic === "phone" ? "手機開放公投" : "動物收容所公投";
    const filtered = localRecords.filter(r => r.topic === curTopicName);
    
    let agree = 0;
    let disagree = 0;
    let invalid = 0;
    
    filtered.forEach(r => {
        if (r.voteResult === "同意") agree++;
        else if (r.voteResult === "不同意") disagree++;
        else invalid++;
    });
    
    renderStats({
        agree: agree,
        disagree: disagree,
        invalid: invalid,
        total: filtered.length
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
