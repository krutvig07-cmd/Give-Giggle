function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, duration, type = 'sine', gainValue = 0.08) {
    ensureAudio();
    if (!audioCtx || isPaused) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
}

function playVictorySound() {
    ensureAudio();
    if (!audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.18, 'sine', 0.09), i * 90);
    });
}

function playCoinTick() {
    playTone(880, 0.07, 'triangle', 0.05);
}

function animateCoinConversion(finminnCoins) {
    const countEl = document.getElementById('coin-count');
    const iconEl = document.getElementById('coin-icon');
    if (!countEl || !iconEl) return;

    iconEl.classList.remove('coin-burst');
    countEl.classList.remove('count-pop');
    void iconEl.offsetWidth;
    void countEl.offsetWidth;

    iconEl.classList.add('coin-burst');
    countEl.classList.add('count-pop');

    let current = 0;
    const step = Math.max(1, Math.ceil(finminnCoins / 30));

    const ticker = setInterval(() => {
        current += step;
        if (current >= finminnCoins) {
            current = finminnCoins;
            clearInterval(ticker);
        }

        countEl.innerText = current;
        playCoinTick();
    }, 35);
}

function showRewardConversion() {
    const finminnCoins = Math.floor(score / SCORE_TO_FINMINN_RATIO);
    const rupeeValue = finminnCoins / FINMINN_TO_RUPEE_RATIO;

    const countEl = document.getElementById('coin-count');
    const valueEl = document.getElementById('end-rupees');
    const finEl = document.getElementById('end-finminn');

    if (finEl) finEl.innerText = finminnCoins;
    if (valueEl) valueEl.innerText = `₹${rupeeValue.toFixed(2)}`;
    if (countEl) countEl.innerText = '0';

    animateCoinConversion(finminnCoins);
    playVictorySound();
}
let balance = 200;
let score = 0;
let streak = 0;
let multiplier = 1;

const MAX_TIME = 120;
let timeRemaining = MAX_TIME;
let gameActive = false;
let isPaused = false;
let loopEngine, clockInterval, countdownInterval;

let lastSelectedType = null;
let metrics = { saved: 0, donations: 0, luxury: 0 };

let currentBaskets = [
    { type: 'save', emoji: '🏦', name: 'Piggy Bank' },
    { type: 'spend', emoji: '🛍️', name: 'Shopping Cart' },
    { type: 'donate', emoji: '❤️', name: 'Charity Box' }
];

let droppedItems = [];
const arena = document.getElementById('game-arena');

const SCORE_TO_FINMINN_RATIO = 10;
const FINMINN_TO_RUPEE_RATIO = 1000;
const MAX_MULTIPLIER = 5;

const coinPool = [
    { value: 10, emoji: '🪙', variant: ['Bronze Coin', 'Shiny Ten', 'Pocket Change', 'Lucky Dime'] },
    { value: 20, emoji: '🪙', variant: ['Silver Token', 'Lucky Twenty', 'Sparkle Coin', 'Nickel Roll'] },
    { value: 50, emoji: '💵', variant: ['Bright Fifty', 'Paper Cash', 'Crisp Bill', 'Savings Slip'] },
    { value: 100, emoji: '💰', variant: ['Grand Note', 'Big Bill', 'Gold Bundle', 'Treasure Cache'] }
];

const coinGreetings = ["YOU'RE LUCKY! 🌟", "SUPER BONUS! ⚡", "WOW! LUCKY DROP! 💎", "SPARKLE COIN! ✨"];

const donationPool = [
    { cost: 30, emoji: '👕', variant: ['Clothes'] },
    { cost: 40, emoji: '👟', variant: ['Shoes'] },
    { cost: 25, emoji: '🧸', variant: ['Toys'] },
    { cost: 30, emoji: '📚', variant: ['Books'] },
    { cost: 50, emoji: '🎒', variant: ['School Bag'] }
];

const luxuryPool = [
    { cost: 20, emoji: '🍦', variant: ['Ice Cream'] },
    { cost: 25, emoji: '😋', variant: ['Pani Puri'] },
    { cost: 15, emoji: '🍫', variant: ['Chocolate'] },
    { cost: 80, emoji: '🍕', variant: ['Pizza'] },
    { cost: 60, emoji: '🍔', variant: ['Burger'] }
];

const cheerPhrases = ["Hooray!", "You did it!", "Awesome!", "Great job!", "Perfect!"];
const colors = ["#4D96FF", "#6BCB77", "#5E9EFF", "#9B5DE5", "#2ECC71"];

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
}

function soundWin() {
    initAudio();
    if (!audioCtx || isPaused) return;
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (idx * 0.04));
        gain.gain.setValueAtTime(0.12, now + (idx * 0.04));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.04) + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + (idx * 0.04));
        osc.stop(now + (idx * 0.04) + 0.22);
    });
}

function soundLose() {
    initAudio();
    if (!audioCtx || isPaused) return;
    const now = audioCtx.currentTime;
    [130.81, 146.83].forEach((f) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f - 30, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    });
}

function soundTrash() {
    initAudio();
    if (!audioCtx || isPaused) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
}

function soundSwap() {
    initAudio();
    if (!audioCtx || isPaused) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtValueAtTime?.(0.001, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
}

function renderBaskets() {
    currentBaskets.forEach((b, idx) => {
        document.getElementById(`emoji-${idx}`).innerText = b.emoji;
        document.getElementById(`title-${idx}`).innerText = b.name;
        const element = document.getElementById(`basket-${idx}`);
        element.classList.add('bounce-trigger');
        setTimeout(() => element.classList.remove('bounce-trigger'), 100);
    });
}

function updateHUDExtras() {
    const streakEl = document.getElementById('streak-val');
    const multEl = document.getElementById('multiplier-val');
    if (streakEl) streakEl.innerText = streak;
    if (multEl) multEl.innerText = `${multiplier}x`;
}

function updateHUD() {
    document.getElementById('balance-display').innerText = `₹${balance}`;
    document.getElementById('score-val').innerText = score;
    updateHUDExtras();
}

function updateScoreCard() {
    const finminnCoins = Math.floor(score / SCORE_TO_FINMINN_RATIO);
    const rupeeValue = finminnCoins / FINMINN_TO_RUPEE_RATIO;

    const endScore = document.getElementById('end-points');
    const endFinminn = document.getElementById('end-finminn');
    const endRupees = document.getElementById('end-rupees');

    if (endScore) endScore.innerText = score;
    if (endFinminn) endFinminn.innerText = finminnCoins;
    if (endRupees) endRupees.innerText = `₹${rupeeValue.toFixed(2)}`;
}

function addScore(basePoints) {
    const gained = basePoints * multiplier;
    score += gained;
    streak += 1;
    multiplier = Math.min(MAX_MULTIPLIER, 1 + Math.floor(streak / 5));
    updateHUDExtras();
    return gained;
}

function resetStreak() {
    streak = 0;
    multiplier = 1;
    updateHUDExtras();
}

window.rotateLeft = function () {
    if (!gameActive || isPaused) return;
    const head = currentBaskets.shift();
    currentBaskets.push(head);
    renderBaskets();
    soundSwap();
};

window.rotateRight = function () {
    if (!gameActive || isPaused) return;
    const tail = currentBaskets.pop();
    currentBaskets.unshift(tail);
    renderBaskets();
    soundSwap();
};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowdown', 'a', 'd', 's'].includes(key)) e.preventDefault();
    if (key === 'arrowleft' || key === 'a') rotateLeft();
    if (key === 'arrowright' || key === 'd') rotateRight();
    if (key === 'arrowdown' || key === 's') fastSkipCurrentItem();
});

function fastSkipCurrentItem() {
    if (!gameActive || isPaused || droppedItems.length === 0) return;
    const activeItem = droppedItems[0];
    if (activeItem.isSkipped) return;

    activeItem.isSkipped = true;
    activeItem.fallVelocity = 22.0;

    const widthBound = arena.clientWidth;
    const absoluteX = (activeItem.xPct / 100) * widthBound;

    launchFeedback("Skipped! 💨", false, absoluteX, activeItem.yPos);
    soundTrash();
}

function triggerSpawn() {
    if (!gameActive || isPaused) return;

    let selectType;

    if (timeRemaining <= 15) {
        selectType = 'mystery';
    } else {
        const types = ['save', 'spend', 'donate'];
        do {
            selectType = types[Math.floor(Math.random() * types.length)];
        } while (selectType === lastSelectedType);
        lastSelectedType = selectType;
    }

    const node = document.createElement('div');
    node.className = 'falling-item';

    const specData = { type: selectType };

    if (selectType === 'mystery') {
        specData.bonusTime = 15;
        node.innerHTML = `🎁 <div class="item-card" style="border-color:#9B5DE5; box-shadow: 0 4px 0 #9B5DE5;"><span style="color:#9B5DE5; font-weight:700;">MYSTERY BOX</span><br><span style="color:#7F8C8D; font-size:11px;">Catch in Bank!</span></div>`;
    } else if (selectType === 'save') {
        const config = coinPool[Math.floor(Math.random() * coinPool.length)];
        const variantName = config.variant[Math.floor(Math.random() * config.variant.length)];
        const bonusText = coinGreetings[Math.floor(Math.random() * coinGreetings.length)];
        specData.val = config.value;
        node.innerHTML = `${config.emoji} <div class="item-card"><span style="color:#9B5DE5; font-size:10px;">${bonusText}</span><br><b>${variantName.toUpperCase()}</b><br><span style="color:#2ECC71;">+₹${config.value}</span></div>`;
    } else if (selectType === 'donate') {
        const config = donationPool[Math.floor(Math.random() * donationPool.length)];
        const variantName = config.variant[Math.floor(Math.random() * config.variant.length)];
        specData.cost = config.cost;
        node.innerHTML = `${config.emoji} <div class="item-card"><b>${variantName.toUpperCase()}</b><br><span class="cost-tag">GIVE: ₹${config.cost}</span></div>`;
    } else if (selectType === 'spend') {
        const config = luxuryPool[Math.floor(Math.random() * luxuryPool.length)];
        const variantName = config.variant[Math.floor(Math.random() * config.variant.length)];
        specData.cost = config.cost;
        node.innerHTML = `${config.emoji} <div class="item-card"><b>${variantName.toUpperCase()}</b><br><span class="cost-tag">WANT: ₹${config.cost}</span></div>`;
    }

    const lanes = [16.6, 50.0, 83.3];
    const horizontalSpread = lanes[Math.floor(Math.random() * lanes.length)];

    node.style.left = `${horizontalSpread}%`;
    node.style.transform = 'translateX(-50%)';
    node.style.top = `-130px`;
    arena.appendChild(node);

    droppedItems.push({
        el: node,
        data: specData,
        xPct: horizontalSpread,
        yPos: -130,
        fallVelocity: 2.3,
        isSkipped: false
    });
}

function launchFeedback(msg, success, pixelX, pixelY) {
    const fNode = document.createElement('div');
    fNode.className = 'pop-text';
    fNode.innerText = msg;
    fNode.style.color = success ? colors[Math.floor(Math.random() * colors.length)] : '#7F8C8D';
    fNode.style.left = `${pixelX}px`;
    fNode.style.top = `${pixelY}px`;
    arena.appendChild(fNode);
    setTimeout(() => fNode.remove(), 800);

    if (success) {
        for (let i = 0; i < 12; i++) {
            const conf = document.createElement('div');
            conf.className = 'sparkle';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.left = `${pixelX}px`;
            conf.style.top = `${pixelY}px`;
            const rad = Math.random() * Math.PI * 2;
            const len = 35 + Math.random() * 60;
            conf.style.setProperty('--mx', `${Math.cos(rad) * len}px`);
            conf.style.setProperty('--my', `${Math.sin(rad) * len}px`);
            arena.appendChild(conf);
            setTimeout(() => conf.remove(), 500);
        }
    }
}

function updateEngine() {
    if (!gameActive || isPaused) {
        loopEngine = requestAnimationFrame(updateEngine);
        return;
    }

    const heightBound = arena.clientHeight;
    const widthBound = arena.clientWidth;

    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const activeItem = droppedItems[i];
        activeItem.yPos += activeItem.fallVelocity;
        activeItem.el.style.top = `${activeItem.yPos}px`;

        const collisionTriggerLine = heightBound - 150;

        if (!activeItem.isSkipped && activeItem.yPos >= collisionTriggerLine && activeItem.yPos <= collisionTriggerLine + 25) {
            const absoluteX = (activeItem.xPct / 100) * widthBound;

            let chosenTrackIndex = 1;
            if (activeItem.xPct < 35) chosenTrackIndex = 0;
            else if (activeItem.xPct > 65) chosenTrackIndex = 2;

            const basketRef = currentBaskets[chosenTrackIndex];

            if (activeItem.data.type === 'mystery') {
                if (basketRef.type === 'save') {
                    timeRemaining = Math.min(MAX_TIME, timeRemaining + 15);
                    const gained = addScore(25);
                    launchFeedback(`+15 Seconds! +${gained} pts ⏱️✨`, true, absoluteX, activeItem.yPos);
                    soundWin();
                    updateTimerDisplay();
                } else {
                    launchFeedback("Wrong box! ❌", false, absoluteX, activeItem.yPos);
                    soundLose();
                    resetStreak();
                }
                activeItem.el.remove();
                droppedItems.splice(i, 1);
                triggerSpawn();
                continue;
            }

            if (basketRef.type === activeItem.data.type) {
                const activeCheer = cheerPhrases[Math.floor(Math.random() * cheerPhrases.length)];

                if (basketRef.type === 'save') {
                    balance += activeItem.data.val;
                    const gained = addScore(10);
                    metrics.saved += activeItem.data.val;
                    launchFeedback(`+₹${activeItem.data.val} (+${gained} pts)`, true, absoluteX, activeItem.yPos);
                    soundWin();
                } else if (basketRef.type === 'donate') {
                    if (balance >= activeItem.data.cost) {
                        balance -= activeItem.data.cost;
                        const gained = addScore(15);
                        metrics.donations++;
                        launchFeedback(`${activeCheer} +${gained} pts`, true, absoluteX, activeItem.yPos);
                        soundWin();
                    } else {
                        launchFeedback("Not enough money! ❌", false, absoluteX, activeItem.yPos);
                        soundLose();
                        resetStreak();
                    }
                } else if (basketRef.type === 'spend') {
                    if (balance >= activeItem.data.cost) {
                        balance -= activeItem.data.cost;
                        const gained = addScore(5);
                        metrics.luxury++;
                        launchFeedback(`That was a WANT! +${gained} pts 😊`, true, absoluteX, activeItem.yPos);
                        soundWin();
                    } else {
                        launchFeedback("Too expensive! 🛒", false, absoluteX, activeItem.yPos);
                        soundLose();
                        resetStreak();
                    }
                }

                updateHUD();
                activeItem.el.remove();
                droppedItems.splice(i, 1);
                triggerSpawn();
            } else {
                resetStreak();
            }
        } else if (activeItem.yPos > heightBound - 40) {
            if (!activeItem.isSkipped) {
                const absoluteX = (activeItem.xPct / 100) * widthBound;
                launchFeedback("Missed! ❌", false, absoluteX, heightBound - 140);
                soundLose();
                resetStreak();
            }
            activeItem.el.remove();
            droppedItems.splice(i, 1);
            triggerSpawn();
        }
    }

    loopEngine = requestAnimationFrame(updateEngine);
}

function updateTimerDisplay() {
    const timerBar = document.getElementById('timer-bar');
    const timerText = document.getElementById('timer-val');
    const warningBanner = document.getElementById('clutch-warning-banner');

    timerText.innerText = `${timeRemaining}s`;
    const percentage = (timeRemaining / MAX_TIME) * 100;
    timerBar.style.width = `${percentage}%`;

    if (timeRemaining <= 15) {
        timerBar.style.backgroundColor = '#E74C3C';
        timerBar.classList.add('timer-warning');
        if (gameActive && !isPaused) warningBanner.classList.add('visible');
        else warningBanner.classList.remove('visible');
    } else if (timeRemaining <= 45) {
        timerBar.style.backgroundColor = '#F39C12';
        timerBar.classList.remove('timer-warning');
        warningBanner.classList.remove('visible');
    } else {
        timerBar.style.backgroundColor = '#2ECC71';
        timerBar.classList.remove('timer-warning');
        warningBanner.classList.remove('visible');
    }
}

function runTimer() {
    if (isPaused) return;
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) endSession();
}

window.triggerCountdown = function () {
    document.getElementById('start-screen').classList.remove('active');

    const overlay = document.getElementById('countdown-overlay');
    const numDisplay = document.getElementById('countdown-number');

    overlay.classList.add('active');
    initAudio();

    let count = 3;
    numDisplay.innerText = count;
    numDisplay.className = "pulse-step";

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        numDisplay.className = "";
        void numDisplay.offsetWidth;

        count--;
        if (count > 0) {
            numDisplay.innerText = count;
            numDisplay.className = "pulse-step";
        } else if (count === 0) {
            numDisplay.innerText = "GO!!!";
            numDisplay.className = "pulse-step";
        } else {
            clearInterval(countdownInterval);
            overlay.classList.remove('active');
            startGame();
        }
    }, 1000);
};

window.togglePause = function () {
    if (!gameActive) return;

    const pauseBtn = document.getElementById('pause-btn');
    const warningBanner = document.getElementById('clutch-warning-banner');

    if (!isPaused) {
        isPaused = true;
        pauseBtn.innerText = "▶️ Resume";
        pauseBtn.style.borderColor = "#2ECC71";
        warningBanner.classList.remove('visible');
    } else {
        isPaused = false;
        pauseBtn.innerText = "⏸️ Pause";
        pauseBtn.style.borderColor = "#A0AEC0";
        if (timeRemaining <= 15) warningBanner.classList.add('visible');
    }
};

window.startGame = function () {
    gameActive = true;
    isPaused = false;
    updateHUD();
    updateTimerDisplay();
    loopEngine = requestAnimationFrame(updateEngine);
    clockInterval = setInterval(runTimer, 1000);
    triggerSpawn();
};

function endSession() {
    gameActive = false;
    cancelAnimationFrame(loopEngine);
    clearInterval(clockInterval);
    document.getElementById('clutch-warning-banner').classList.remove('visible');

    let title = "Budget Learner 🎒";
    if (score >= 250) title = "Money Master 👑";
    else if (score >= 150) title = "Budget Hero 🌟";
    else if (score >= 80) title = "Super Saver 👑";

    document.getElementById('end-save').innerText = `₹${balance}`;
    document.getElementById('end-points').innerText = score;
    document.getElementById('end-donate').innerText = metrics.donations;
    document.getElementById('end-luxury').innerText = metrics.luxury;
    document.getElementById('final-badge').innerText = title;
    updateScoreCard();
    showRewardConversion();
    document.getElementById('game-over-screen').classList.add('active');
}

window.resetGame = function () {
    droppedItems.forEach(item => item.el.remove());
    droppedItems = [];
    balance = 200;
    score = 0;
    streak = 0;
    multiplier = 1;
    timeRemaining = MAX_TIME;
    metrics = { saved: 0, donations: 0, luxury: 0 };
    lastSelectedType = null;

    document.getElementById('balance-display').innerText = `₹${balance}`;
    document.getElementById('score-val').innerText = score;
    document.getElementById('streak-val').innerText = streak;
    document.getElementById('multiplier-val').innerText = `${multiplier}x`;
    document.getElementById('clutch-warning-banner').classList.remove('visible');

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.innerText = "⏸️ Pause";
    pauseBtn.style.borderColor = "#A0AEC0";

    document.getElementById('game-over-screen').classList.remove('active');

    renderBaskets();
    triggerCountdown();
};

renderBaskets();
updateHUD();
updateTimerDisplay();
function bindMobileTouchControls() {
    const left = document.getElementById('mobile-left');
    const right = document.getElementById('mobile-right');
    const skip = document.getElementById('mobile-skip');

    const tap = (el, fn) => {
        if (!el) return;
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            fn();
        }, { passive: false });
    };

    tap(left, rotateLeft);
    tap(right, rotateRight);
    tap(skip, fastSkipCurrentItem);
}

window.addEventListener('load', () => {
    bindMobileTouchControls();
});
