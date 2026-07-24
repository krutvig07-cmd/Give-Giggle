// ===============================
// CORE STATE
// ===============================
let balance = 200;
let score = 0;
const MAX_TIME = 120;
let timeRemaining = MAX_TIME;
let gameActive = false;
let isPaused = false;
let loopEngine = null;
let clockInterval = null;

// Streak system
let streak = 0;
let multiplier = 1;

// Prevent consecutive same type
let lastSelectedType = null;

// Metrics for scorecard
let metrics = {
  savedRupees: 0,
  donations: 0,
  luxury: 0
};
let statSavedCount = 0;
let statSpendCount = 0;
let statDonateCount = 0;
let coinsCollected = 0;

let droppedItems = [];
const arena = document.getElementById('game-arena');

// ===============================
// POOLS (using your emoji sets)
// ===============================

// SAVE (coins / money)
const savePool = [
  { value: 10, emoji: '🪙', label: 'Coin' },
  { value: 20, emoji: '💵', label: 'Cash' },
  { value: 40, emoji: '💰', label: 'Money Bag' },
  { value: 30, emoji: '💴', label: 'Paper Bills' }
];

// SPEND (luxury)
const spendPool = [
  { cost: 20, emoji: '🍦', label: 'Ice Cream' },
  { cost: 80, emoji: '🍕', label: 'Pizza Slice' },
  { cost: 60, emoji: '🍔', label: 'Burger' },
  { cost: 40, emoji: '🍟', label: 'French Fries' },
  { cost: 50, emoji: '🍰', label: 'Cake' },
  { cost: 55, emoji: '🍜', label: 'Noodles' },
  { cost: 65, emoji: '🌯', label: 'Shawarma' },
  { cost: 120, emoji: '🎮', label: 'Video Game' },
  { cost: 70, emoji: '🧸', label: 'Teddy Bear' },
  { cost: 80, emoji: '⚽', label: 'Football' },
  { cost: 150, emoji: '🎧', label: 'Headphones' },
  { cost: 250, emoji: '⌚', label: 'Smart Watch' },
  { cost: 400, emoji: '📱', label: 'New Phone' },
  { cost: 30, emoji: '🍪', label: 'Cookies' },
  { cost: 25, emoji: '🥙', label: 'Pani Puri' }
];

// DONATE (essentials)
const donatePool = [
  { cost: 30, emoji: '👕', label: 'Clothes' },
  { cost: 45, emoji: '🛏️', label: 'Blanket' },
  { cost: 50, emoji: '🎒', label: 'School Bag' },
  { cost: 35, emoji: '📚', label: 'Books' },
  { cost: 20, emoji: '📓', label: 'Notebook' },
  { cost: 25, emoji: '🧸', label: 'Toys' },
  { cost: 40, emoji: '🍚', label: 'Food' }
];

const cheerPhrases = ["Hooray!", "You did it!", "Awesome!", "Great job!", "Perfect!"];
const colors = ["#4D96FF", "#6BCB77", "#5E9EFF", "#9B5DE5", "#2ECC71"];

// ===============================
// AUDIO (Web Audio API)
// ===============================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function soundWin() {
  initAudio(); if (!audioCtx || isPaused) return;
  const now = audioCtx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.50];
  freqs.forEach((f, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + (idx * 0.04));
    gain.gain.setValueAtTime(0.12, now + (idx * 0.04));
    gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.04) + 0.22);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now + (idx * 0.04)); osc.stop(now + (idx * 0.04) + 0.22);
  });
}

function soundLose() {
  initAudio(); if (!audioCtx || isPaused) return;
  const now = audioCtx.currentTime;
  [130.81, 146.83].forEach((f) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.linearRampToValueAtTime(f - 30, now + 0.3);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.3);
  });
}

function soundTrash() {
  initAudio(); if (!audioCtx || isPaused) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.linearRampToValueAtTime(420, now + 0.12);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.12);
}

function soundSwap() {
  initAudio(); if (!audioCtx || isPaused) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.08);
}

// Countdown beep
function soundCountdownBeep() {
  initAudio(); if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(750, now);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.15);
}

// "GO!!!" blast
function soundGoBlast() {
  initAudio(); if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.3);
}

// Cha-ching for scorecard
function soundChaChing() {
  initAudio(); if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc1.connect(gain1); gain1.connect(audioCtx.destination);
  osc1.start(now); osc1.stop(now + 0.25);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1320, now + 0.05);
  gain2.gain.setValueAtTime(0.14, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc2.connect(gain2); gain2.connect(audioCtx.destination);
  osc2.start(now + 0.05); osc2.stop(now + 0.25);
}

// ===============================
// BASKETS (🏦, 🛒, 🫶🏻)
// ===============================
let currentBaskets = [
  { type: 'save', emoji: '🏦', name: 'Save' },
  { type: 'spend', emoji: '🛒', name: 'Spend' },
  { type: 'donate', emoji: '🫶🏻', name: 'Donate' }
];

function renderBaskets() {
  currentBaskets.forEach((b, idx) => {
    document.getElementById(`emoji-${idx}`).innerText = b.emoji;
    document.getElementById(`title-${idx}`).innerText = b.name;
    const element = document.getElementById(`basket-${idx}`);
    element.classList.add('bounce-trigger');
    setTimeout(() => element.classList.remove('bounce-trigger'), 100);
  });
}

window.rotateLeft = function() {
  if (!gameActive || isPaused) return;
  const head = currentBaskets.shift();
  currentBaskets.push(head);
  renderBaskets();
  soundSwap();
};

window.rotateRight = function() {
  if (!gameActive || isPaused) return;
  const tail = currentBaskets.pop();
  currentBaskets.unshift(tail);
  renderBaskets();
  soundSwap();
};

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') rotateLeft();
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') rotateRight();
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') fastSkipCurrentItem();
});

// ===============================
// STREAK / MULTIPLIER
// ===============================
function incrementStreak() {
  streak++;
  if (streak < 3) multiplier = 1;
  else if (streak < 6) multiplier = 2;
  else multiplier = 3;

  document.getElementById('streak-val').innerText = streak;
  document.getElementById('multiplier-val').innerText = `${multiplier}x`;
}

function resetStreak() {
  streak = 0;
  multiplier = 1;
  document.getElementById('streak-val').innerText = streak;
  document.getElementById('multiplier-val').innerText = `${multiplier}x`;
}

// ===============================
// SKIP LOGIC
// ===============================
function fastSkipCurrentItem() {
  if (!gameActive || isPaused || droppedItems.length === 0) return;
  let activeItem = droppedItems[0];
  if (activeItem.isSkipped) return;

  activeItem.isSkipped = true;
  activeItem.fallVelocity = 22.0;

  const widthBound = arena.clientWidth;
  const absoluteX = (activeItem.xPct / 100) * widthBound;

  launchFeedback("Skipped! 💨", false, absoluteX, activeItem.yPos);
  soundTrash();
  resetStreak();
}

// ===============================
// SPAWN ITEMS (with your emoji lists)
// ===============================
function triggerSpawn() {
  if (!gameActive || isPaused) return;

  let selectType;

  if (timeRemaining <= 15 && Math.random() < 0.60) {
    selectType = 'mystery';
  } else {
    const types = ['save', 'spend', 'donate'];
    do {
      selectType = types[Math.floor(Math.random() * types.length)];
    } while (selectType === lastSelectedType);
    lastSelectedType = selectType;
  }

  let node = document.createElement('div');
  node.className = 'falling-item';

  let specData = { type: selectType };

  if (selectType === 'mystery') {
    specData.bonusTime = 15;
    node.innerHTML =
      `🎁<div class="item-card" style="border-color:#9B5DE5; box-shadow: 0 4px 0 #9B5DE5;">
         <span style="color:#9B5DE5; font-weight:700;">MYSTERY BOX</span><br>
         <span style="color:#7F8C8D; font-size:11px;">Catch in Save!</span>
       </div>`;
  } else if (selectType === 'save') {
    let config = savePool[Math.floor(Math.random() * savePool.length)];
    specData.val = config.value;
    node.innerHTML =
      `${config.emoji}<div class="item-card">
         <b>${config.label.toUpperCase()}</b><br>
         <span style="color:#2ECC71;">+₹${config.value}</span>
       </div>`;
  } else if (selectType === 'donate') {
    let config = donatePool[Math.floor(Math.random() * donatePool.length)];
    specData.cost = config.cost;
    specData.label = config.label;
    node.innerHTML =
      `${config.emoji}<div class="item-card">
         <b>${config.label.toUpperCase()}</b><br>
         <span class="cost-tag">GIVE: ₹${config.cost}</span>
       </div>`;
  } else if (selectType === 'spend') {
    let config = spendPool[Math.floor(Math.random() * spendPool.length)];
    specData.cost = config.cost;
    specData.label = config.label;
    node.innerHTML =
      `${config.emoji}<div class="item-card">
         <b>${config.label.toUpperCase()}</b><br>
         <span class="cost-tag">WANT: ₹${config.cost}</span>
       </div>`;
  }

  const lanes = [16.6, 50.0, 83.3];
  let horizontalSpread = lanes[Math.floor(Math.random() * lanes.length)];

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

// ===============================
// POP FEEDBACK
// ===============================
function launchFeedback(msg, success, pixelX, pixelY) {
  let fNode = document.createElement('div');
  fNode.className = 'pop-text';
  fNode.innerText = msg;
  fNode.style.color = success ? colors[Math.floor(Math.random() * colors.length)] : '#7F8C8D';
  fNode.style.left = `${pixelX}px`;
  fNode.style.top = `${pixelY}px`;
  arena.appendChild(fNode);
  setTimeout(() => fNode.remove(), 800);

  if (success) {
    for (let i = 0; i < 12; i++) {
      let conf = document.createElement('div');
      conf.className = 'sparkle';
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.left = `${pixelX}px`;
      conf.style.top = `${pixelY}px`;
      let rad = Math.random() * Math.PI * 2;
      let len = 35 + Math.random() * 60;
      conf.style.setProperty('--mx', `${Math.cos(rad) * len}px`);
      conf.style.setProperty('--my', `${Math.sin(rad) * len}px`);
      arena.appendChild(conf);
      setTimeout(() => conf.remove(), 500);
    }
  }
}

// ===============================
// GAME LOOP
// ===============================
function updateEngine() {
  if (!gameActive || isPaused) {
    loopEngine = requestAnimationFrame(updateEngine);
    return;
  }

  const heightBound = arena.clientHeight;
  const widthBound = arena.clientWidth;

  for (let i = droppedItems.length - 1; i >= 0; i--) {
    let activeItem = droppedItems[i];
    activeItem.yPos += activeItem.fallVelocity;
    activeItem.el.style.top = `${activeItem.yPos}px`;

    const collisionTriggerLine = heightBound - 150;

    if (!activeItem.isSkipped && activeItem.yPos >= collisionTriggerLine && activeItem.yPos <= collisionTriggerLine + 25) {
      const absoluteX = (activeItem.xPct / 100) * widthBound;

      let chosenTrackIndex = 1;
      if (activeItem.xPct < 35) chosenTrackIndex = 0;
      else if (activeItem.xPct > 65) chosenTrackIndex = 2;

      let basketRef = currentBaskets[chosenTrackIndex];

      // Mystery
      if (activeItem.data.type === 'mystery') {
        if (basketRef.type === 'save') {
          timeRemaining = Math.min(MAX_TIME, timeRemaining + 15);
          score += 25 * multiplier;
          incrementStreak();
          launchFeedback(`+15 Seconds! ⏱️✨`, true, absoluteX, activeItem.yPos);
          soundWin();
          document.getElementById('score-val').innerText = score;
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

      // Correct basket type
      if (basketRef.type === activeItem.data.type) {
        let cheer = cheerPhrases[Math.floor(Math.random() * cheerPhrases.length)];

        if (basketRef.type === 'save') {
          balance += activeItem.data.val;
          score += 10 * multiplier;
          metrics.savedRupees += activeItem.data.val;
          statSavedCount++;
          incrementStreak();
          launchFeedback(`+₹${activeItem.data.val}`, true, absoluteX, activeItem.yPos);
          soundWin();
        } else if (basketRef.type === 'donate') {
          if (balance >= activeItem.data.cost) {
            balance -= activeItem.data.cost;
            score += 15 * multiplier;
            metrics.donations++;
            statDonateCount++;
            incrementStreak();
            launchFeedback(cheer, true, absoluteX, activeItem.yPos);
            soundWin();
          } else {
            launchFeedback("Not enough money! ❌", false, absoluteX, activeItem.yPos);
            soundLose();
            resetStreak();
          }
        } else if (basketRef.type === 'spend') {
          if (balance >= activeItem.data.cost) {
            balance -= activeItem.data.cost;
            score += 5 * multiplier;
            metrics.luxury++;
            statSpendCount++;
            incrementStreak();
            launchFeedback("That was a WANT! 😊", true, absoluteX, activeItem.yPos);
            soundWin();
          } else {
            launchFeedback("Too expensive! 🛒", false, absoluteX, activeItem.yPos);
            soundLose();
            resetStreak();
          }
        }

        document.getElementById('balance-display').innerText = `₹${balance}`;
        document.getElementById('score-val').innerText = score;

        activeItem.el.remove();
        droppedItems.splice(i, 1);
        triggerSpawn();
      } else {
        // Wrong basket type
        launchFeedback("Wrong basket! ❌", false, absoluteX, activeItem.yPos);
        soundLose();
        resetStreak();
        activeItem.el.remove();
        droppedItems.splice(i, 1);
        triggerSpawn();
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

// ===============================
// TIMER & CLUTCH BAR
// ===============================
function updateTimerDisplay() {
  const timerBar = document.getElementById('timer-bar');
  const timerText = document.getElementById('timer-val');
  const clutchBar = document.getElementById('clutch-bar');

  timerText.innerText = `${timeRemaining}s`;
  const percentage = (timeRemaining / MAX_TIME) * 100;
  timerBar.style.width = `${percentage}%`;

  if (timeRemaining <= 15) {
    timerBar.style.backgroundColor = '#E74C3C';
    timerBar.classList.add('timer-warning');
    if (gameActive && !isPaused) clutchBar.classList.add('active');
    else clutchBar.classList.remove('active');
  } else if (timeRemaining <= 45) {
    timerBar.style.backgroundColor = '#F39C12';
    timerBar.classList.remove('timer-warning');
    clutchBar.classList.remove('active');
  } else {
    timerBar.style.backgroundColor = '#2ECC71';
    timerBar.classList.remove('timer-warning');
    clutchBar.classList.remove('active');
  }
}

function runTimer() {
  if (isPaused) return;
  timeRemaining--;
  updateTimerDisplay();
  if (timeRemaining <= 0) {
    endSession();
  }
}

// ===============================
// COUNTDOWN
// ===============================
window.triggerCountdown = function() {
  document.getElementById('start-screen').classList.remove('active');

  const overlay = document.getElementById('countdown-overlay');
  const numDisplay = document.getElementById('countdown-number');

  overlay.classList.add('active');
  initAudio();

  let count = 3;
  numDisplay.innerText = count;
  numDisplay.className = "pulse-step";
  soundCountdownBeep();

  let cdInterval = setInterval(() => {
    numDisplay.className = "";
    void numDisplay.offsetWidth;

    count--;
    if (count > 0) {
      numDisplay.innerText = count;
      numDisplay.className = "pulse-step";
      soundCountdownBeep();
    } else if (count === 0) {
      numDisplay.innerText = "GO!!!";
      numDisplay.className = "pulse-step";
      soundGoBlast();
    } else {
      clearInterval(cdInterval);
      overlay.classList.remove('active');
      startGame();
    }
  }, 1000);
};

// ===============================
// PAUSE
// ===============================
window.togglePause = function() {
  if (!gameActive) return;

  const pauseBtn = document.getElementById('pause-btn');
  const clutchBar = document.getElementById('clutch-bar');

  if (!isPaused) {
    isPaused = true;
    pauseBtn.innerText = "▶️ Resume";
    pauseBtn.style.borderColor = "#2ECC71";
    clutchBar.classList.remove('active');
  } else {
    isPaused = false;
    pauseBtn.innerText = "⏸️ Pause";
    pauseBtn.style.borderColor = "#A0AEC0";
    if (timeRemaining <= 15) clutchBar.classList.add('active');
  }
};

// ===============================
// START / END
// ===============================
window.startGame = function() {
  gameActive = true;
  isPaused = false;
  updateTimerDisplay();
  resetStreak();
  loopEngine = requestAnimationFrame(updateEngine);
  clockInterval = setInterval(runTimer, 1000);
  triggerSpawn();
};

function endSession() {
  gameActive = false;

  // Map score/balance/savings to coins for scorecard
  coinsCollected = (metrics.savedRupees * 50) + (score * 100);

  endGame();
}

function renderScorecard(coinsCollected, saveCount, spendCount, donateCount) {
  const CONVERSION_RATE = 1000;

  let baseRupees = coinsCollected / CONVERSION_RATE;

  let saverBonus = (saveCount > spendCount) ? (baseRupees * 0.20) : 0;
  let spendPenalty = (spendCount > 3) ? ((spendCount - 3) * 0.50) : 0;

  let finalTotal = Math.max(0, baseRupees + saverBonus - spendPenalty);

  document.getElementById('stat-saved').innerText = saveCount;
  document.getElementById('stat-spent').innerText = spendCount;
  document.getElementById('stat-donated').innerText = donateCount;

  document.getElementById('total-coins').innerText = `${coinsCollected.toLocaleString()} Coins`;
  document.getElementById('base-rupees').innerText = `₹${baseRupees.toFixed(2)}`;
  document.getElementById('saver-bonus').innerText = `+₹${saverBonus.toFixed(2)}`;
  document.getElementById('spend-penalty').innerText = `-₹${spendPenalty.toFixed(2)}`;
  document.getElementById('final-rupees').innerText = `₹${finalTotal.toFixed(2)}`;

  let feedbackEl = document.getElementById('financial-feedback');
  if (saveCount >= spendCount * 2) {
    feedbackEl.innerText = "🌟 Master Saver! Excellent saving ratio!";
  } else if (spendCount > saveCount) {
    feedbackEl.innerText = "⚠️ Watch out! Too much impulse spending reduced your payout.";
  } else {
    feedbackEl.innerText = "⚖️ Balanced run! Try prioritizing saving next time.";
  }

  soundChaChing();
  document.getElementById('game-over-modal').classList.add('active');
}

function endGame() {
  cancelAnimationFrame(loopEngine);
  clearInterval(clockInterval);
  document.getElementById('clutch-bar').classList.remove('active');

  renderScorecard(coinsCollected, statSavedCount, statSpendCount, statDonateCount);
}

// ===============================
// RESET
// ===============================
window.resetGame = function() {
  droppedItems.forEach(item => item.el.remove());
  droppedItems = [];
  balance = 200;
  score = 0;
  timeRemaining = MAX_TIME;
  metrics = { savedRupees: 0, donations: 0, luxury: 0 };
  coinsCollected = 0;
  statSavedCount = 0;
  statSpendCount = 0;
  statDonateCount = 0;

  document.getElementById('balance-display').innerText = `₹${balance}`;
  document.getElementById('score-val').innerText = score;
  document.getElementById('clutch-bar').classList.remove('active');

  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.innerText = "⏸️ Pause";
  pauseBtn.style.borderColor = "#A0AEC0";

  document.getElementById('game-over-modal').classList.remove('active');

  renderBaskets();
  resetStreak();
  triggerCountdown();
};

// Initial setup
renderBaskets();
updateTimerDisplay();
