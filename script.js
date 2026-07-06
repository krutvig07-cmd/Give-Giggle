// Game Core State Objects
let balance = 200;
let score = 0;
let timeRemaining = 120; // 2-minute limit
let gameActive = false; 
let loopEngine, clockInterval;

// Track and block consecutive duplicate element repetitions
let lastSelectedType = null;
let lastSelectedVariant = null;

// Analytics Metrics Trackers
let metrics = { saved: 0, donations: 0, luxury: 0, smartChoices: 0 };

// Places Basket Track Management Array 
let currentBaskets = [
    { type: 'save', emoji: '🏦', name: 'Piggy Bank' },
    { type: 'spend', emoji: '🛍️', name: 'Shopping Cart' },
    { type: 'donate', emoji: '❤️', name: 'Charity Box' }
];

let droppedItems = [];
const arena = document.getElementById('game-arena');

// Item Pool Generation Catalogs
const coinPool = [
    { value: 10, emoji: '🪙', variant: ['Bronze Coin', 'Shiny Ten', 'Pocket Change', 'Lucky Dime'] },
    { value: 20, emoji: '🪙', variant: ['Silver Token', 'Lucky Twenty', 'Sparkle Coin', 'Nickel Roll'] },
    { value: 50, emoji: '💵', variant: ['Bright Fifty', 'Paper Cash', 'Crisp Bill', 'Savings Slip'] },
    { value: 100, emoji: '💰', variant: ['Grand Note', 'Big Bill', 'Gold Bundle', 'Treasure Cache'] }
];

const coinGreetings = ["YOU'RE LUCKY! 🌟", "SUPER BONUS! ⚡", "WOW! LUCKY DROP! 💎", "SPARKLE COIN! ✨", "PIGGY BONUS! 🐖"];

const donationPool = [
    { cost: 30, emoji: '👕', variant: ['Clothes'] },
    { cost: 40, emoji: '👟', variant: ['Shoes'] },
    { cost: 25, emoji: '🧸', variant: ['Toys'] },
    { cost: 30, emoji: '📚', variant: ['Books'] },
    { cost: 20, emoji: '📒', variant: ['Notebooks'] },
    { cost: 15, emoji: '✏️', variant: ['Pens & Pencils'] },
    { cost: 50, emoji: '🎒', variant: ['School Bag'] },
    { cost: 20, emoji: '🖍️', variant: ['Crayons'] },
    { cost: 35, emoji: '🧩', variant: ['Games & Puzzles'] },
    { cost: 40, emoji: '🥫', variant: ['Food'] },
    { cost: 15, emoji: '🍎', variant: ['Fruits'] },
    { cost: 10, emoji: '💧', variant: ['Water'] },
    { cost: 60, emoji: '🛏️', variant: ['Blanket'] },
    { cost: 10, emoji: '🧼', variant: ['Soap'] },
    { cost: 15, emoji: '🪥', variant: ['Toothbrush'] },
    { cost: 15, emoji: '🧴', variant: ['Toothpaste'] },
    { cost: 15, emoji: '🧦', variant: ['Socks'] },
    { cost: 70, emoji: '🧥', variant: ['Jacket'] },
    { cost: 20, emoji: '🧢', variant: ['Cap'] },
    { cost: 50, emoji: '💰', variant: ['Money'] }
];

const luxuryPool = [
    { cost: 20, emoji: '🍦', variant: ['Ice Cream'] },
    { cost: 25, emoji: '😋', variant: ['Pani Puri'] },
    { cost: 15, emoji: '🍫', variant: ['Chocolate'] },
    { cost: 10, emoji: '🍬', variant: ['Candy'] },
    { cost: 15, emoji: '🍪', variant: ['Cookies'] },
    { cost: 80, emoji: '🍕', variant: ['Pizza'] },
    { cost: 60, emoji: '🍔', variant: ['Burger'] },
    { cost: 20, emoji: '🥤', variant: ['Soft Drink'] },
    { cost: 45, emoji: '🧸', variant: ['New Toy'] },
    { cost: 180, emoji: '🎮', variant: ['Video Game'] }
];

const cheerPhrases = ["Hooray!", "You did it!", "Awesome!", "Great job!", "Perfect!"];
const colors = ["#4D96FF", "#6BCB77", "#5E9EFF", "#9B5DE5", "#2ECC71"];

// Web Audio Synth Tones
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
}

function soundWin() {
    initAudio(); if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // Sweet high happy chords
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
    initAudio(); if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [130.81, 146.83].forEach((f) => { // Sad sliding down tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f - 40, now + 0.4); 
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.4);
    });
}

function soundTrash() {
    initAudio(); if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.15);
}

function soundSwap() {
    initAudio(); if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.08);
}

// Basket Layout Sorters
function renderBaskets() {
    currentBaskets.forEach((b, idx) => {
        document.getElementById(`emoji-${idx}`).innerText = b.emoji;
        document.getElementById(`title-${idx}`).innerText = b.name;
        const element = document.getElementById(`basket-${idx}`);
        element.classList.add('bounce-trigger');
        setTimeout(() => element.classList.remove('bounce-trigger'), 120);
    });
}

window.rotateLeft = function() {
    if (!gameActive) return;
    let head = currentBaskets.shift();
    currentBaskets.push(head);
    renderBaskets();
    soundSwap();
}

window.rotateRight = function() {
    if (!gameActive) return;
    let tail = currentBaskets.pop();
    currentBaskets.unshift(tail);
    renderBaskets();
    soundSwap();
}

// Keyboards (Down Arrow Skips)
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') rotateLeft();
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') rotateRight();
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        fastSkipCurrentItem();
    }
});

// Fast Skip Logic: Rockets item down at 10x speed!
function fastSkipCurrentItem() {
    if (!gameActive || droppedItems.length === 0) return;
    
    let activeItem = droppedItems[0];
    if (activeItem.isSkipped) return; 
    
    activeItem.isSkipped = true;
    activeItem.fallVelocity = 18.0; 
    
    const widthBound = arena.clientWidth;
    const absoluteX = (activeItem.xPct / 100) * widthBound;
    
    launchFeedback("Skipped! 💨", false, absoluteX, activeItem.yPos);
    soundTrash();
}

// Item Spawner
function triggerSpawn() {
    if (!gameActive) return;
    if (droppedItems.length > 0) return;

    const types = ['save', 'spend', 'donate'];
    let selectType;
    
    do {
        selectType = types[Math.floor(Math.random() * types.length)];
    } while (selectType === lastSelectedType);
    lastSelectedType = selectType;
    
    let node = document.createElement('div');
    node.className = 'falling-item';
    node.style.transform = 'scale(1.25)'; 
    
    let specData = { type: selectType };

    if (selectType === 'save') {
        let config = coinPool[Math.floor(Math.random() * coinPool.length)];
        let variantName = config.variant[Math.floor(Math.random() * config.variant.length)];
        let bonusText = coinGreetings[Math.floor(Math.random() * coinGreetings.length)];

        specData.val = config.value;
        specData.label = variantName;
        node.innerHTML = `${config.emoji} <div class="item-card" style="font-size:13px; padding:6px 10px;"><span style="color:#9B5DE5; font-size:10px; font-weight:700;">${bonusText}</span><br><b>${variantName.toUpperCase()}</b><br><span style="color:#2ECC71; font-weight:700;">+₹${config.value}</span></div>`;
    } else if (selectType === 'donate') {
        let config = donationPool[Math.floor(Math.random() * donationPool.length)];
        let variantName = config.variant[Math.floor(Math.random() * config.variant.length)];

        specData.cost = config.cost;
        specData.label = variantName;
        node.innerHTML = `${config.emoji} <div class="item-card" style="font-size:13px; padding:6px 10px;"><b>${variantName.toUpperCase()}</b><br><span class="cost-tag" style="font-weight:700;">GIVE: ₹${config.cost}</span></div>`;
    } else if (selectType === 'spend') {
        let config = luxuryPool[Math.floor(Math.random() * luxuryPool.length)];
        let variantName = config.variant[Math.floor(Math.random() * config.variant.length)];

        specData.cost = config.cost;
        specData.label = variantName;
        node.innerHTML = `${config.emoji} <div class="item-card" style="font-size:13px; padding:6px 10px;"><b>${variantName.toUpperCase()}</b><br><span class="cost-tag" style="font-weight:700;">WANT: ₹${config.cost}</span></div>`;
    }

    let horizontalSpread = 20 + Math.random() * 60; 
    node.style.left = `${horizontalSpread}%`;
    node.style.top = `-100px`;
    arena.appendChild(node);

    droppedItems.push({
        el: node,
        data: specData,
        xPct: horizontalSpread,
        yPos: -100,
        fallVelocity: 1.4, 
        isSkipped: false
    });
}

// Particles Feedback
// Visual Burst Particle Effects
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
            conf.style.left = `${pixelX + 20}px`;
            conf.style.top = `${pixelY + 20}px`;
            let rad = Math.random() * Math.PI * 2;
            let len = 30 + Math.random() * 65;
            conf.style.setProperty('--mx', `${Math.cos(rad) * len}px`);
            conf.style.setProperty('--my', `${Math.sin(rad) * len}px`);
            arena.appendChild(conf);
            setTimeout(() => conf.remove(), 500);
        }
    }
}

function queueNextSpawn() {
    setTimeout(() => {
        if (gameActive) triggerSpawn();
    }, 550);
}

// Main Game Loop Engine
function updateEngine() {
    if (!gameActive) return;
    const heightBound = arena.clientHeight;
    const widthBound = arena.clientWidth;

    for (let i = droppedItems.length - 1; i >= 0; i--) {
        let activeItem = droppedItems[i];
        activeItem.yPos += activeItem.fallVelocity;
        activeItem.el.style.top = `${activeItem.yPos}px`;

        const collisionTriggerLine = heightBound - 150;
        
        // Catch Check (Only triggers if item was NOT skipped)
        if (!activeItem.isSkipped && activeItem.yPos >= collisionTriggerLine && activeItem.yPos <= collisionTriggerLine + 25) {
            const absoluteX = (activeItem.xPct / 100) * widthBound;
            
            let chosenTrackIndex = 1; 
            if (absoluteX < widthBound * 0.38) chosenTrackIndex = 0; 
            else if (absoluteX > widthBound * 0.62) chosenTrackIndex = 2; 

            let basketRef = currentBaskets[chosenTrackIndex];

            if (basketRef.type === activeItem.data.type) {
                let activeCheer = cheerPhrases[Math.floor(Math.random() * cheerPhrases.length)];
                
                if (basketRef.type === 'save') {
                    balance += activeItem.data.val;
                    score += 10;
                    metrics.saved += activeItem.data.val;
                    metrics.smartChoices++;
                    launchFeedback(`+₹${activeItem.data.val}`, true, absoluteX, activeItem.yPos);
                    soundWin();
                } 
                else if (basketRef.type === 'donate') {
                    if (balance >= activeItem.data.cost) {
                        balance -= activeItem.data.cost;
                        score += 15;
                        metrics.donations++;
                        metrics.smartChoices++;
                        launchFeedback(activeCheer, true, absoluteX, activeItem.yPos);
                        soundWin();
                    } else {
                        launchFeedback("Not enough money! ❌", false, absoluteX, activeItem.yPos);
                        soundLose();
                    }
                } 
                else if (basketRef.type === 'spend') {
                    if (balance >= activeItem.data.cost) {
                        balance -= activeItem.data.cost;
                        metrics.luxury++;
                        metrics.smartChoices++;
                        launchFeedback("That was a WANT! 😊", true, absoluteX, activeItem.yPos);
                        soundWin();
                    } else {
                        launchFeedback("Too expensive! 🛒", false, absoluteX, activeItem.yPos);
                        soundLose();
                    }
                }

                document.getElementById('balance-display').innerText = `₹${balance}`;
                document.getElementById('score-val').innerText = score;

                activeItem.el.remove();
                droppedItems.splice(i, 1);
                queueNextSpawn();
            }
        } 
        // Auto-Fall Collector
        else if (activeItem.yPos > heightBound - 60) {
            if (!activeItem.isSkipped) {
                const absoluteX = (activeItem.xPct / 100) * widthBound;
                let chosenTrackIndex = 1; 
                if (absoluteX < widthBound * 0.38) chosenTrackIndex = 0; 
                else if (absoluteX > widthBound * 0.62) chosenTrackIndex = 2; 

                let basketRef = currentBaskets[chosenTrackIndex];

                if (basketRef.type === activeItem.data.type) {
                    if (basketRef.type === 'save') {
                        balance += activeItem.data.val; score += 10; metrics.smartChoices++;
                        launchFeedback(`+₹${activeItem.data.val}`, true, absoluteX, heightBound - 140); soundWin();
                    } else if (basketRef.type === 'donate' && balance >= activeItem.data.cost) {
                        balance -= activeItem.data.cost; score += 15; metrics.donations++; metrics.smartChoices++;
                        launchFeedback("Hurray! ❤️", true, absoluteX, heightBound - 140); soundWin();
                    } else if (basketRef.type === 'spend' && balance >= activeItem.data.cost) {
                        balance -= activeItem.data.cost; metrics.luxury++; metrics.smartChoices++;
                        launchFeedback("That was a WANT! 😊", true, absoluteX, heightBound - 140); soundWin();
                    } else {
                        launchFeedback("Oops! ❌", false, absoluteX, heightBound - 140); soundLose();
                    }
                } else {
                    launchFeedback("Oops! ❌", false, absoluteX, heightBound - 140); soundLose();
                }

                document.getElementById('balance-display').innerText = `₹${balance}`;
                document.getElementById('score-val').innerText = score;
            }

            activeItem.el.remove();
            droppedItems.splice(i, 1);
            queueNextSpawn();
        }
    }
    loopEngine = requestAnimationFrame(updateEngine);
}

// Timer Functions
function runTimer() {
    timeRemaining--;
    document.getElementById('timer-val').innerText = `${timeRemaining}s`;
    if (timeRemaining <= 0) {
        endSession();
    }
}

// Start Game Hook
window.startGame = function() {
    initAudio();
    document.getElementById('start-screen').classList.remove('active');
    gameActive = true;
    loopEngine = requestAnimationFrame(updateEngine);
    clockInterval = setInterval(runTimer, 1000);
    triggerSpawn();
}

function endSession() {
    gameActive = false;
    cancelAnimationFrame(loopEngine);
    clearInterval(clockInterval);

    let title = "Budget Learner 🎒";
    if (metrics.smartChoices >= 22) { title = "Money Master 👑"; }
    else if (metrics.smartChoices >= 15) { title = "Budget Hero 🌟"; }
    else if (metrics.smartChoices >= 8) { title = "Super Saver 👑"; }
    else if (metrics.smartChoices >= 4) { title = "Kind Helper ❤️"; }

    document.getElementById('end-save').innerText = `₹${balance}`;
    document.getElementById('end-donate').innerText = metrics.donations;
    document.getElementById('end-luxury').innerText = metrics.luxury;
    document.getElementById('end-smart').innerText = metrics.smartChoices;
    document.getElementById('final-badge').innerText = title;

    document.getElementById('game-over-screen').classList.add('active');
}

window.resetGame = function() {
    droppedItems.forEach(item => item.el.remove());
    droppedItems = [];
    balance = 200;
    score = 0;
    timeRemaining = 120;
    metrics = { saved: 0, donations: 0, luxury: 0, smartChoices: 0 };
    gameActive = true;

    document.getElementById('balance-display').innerText = `₹${balance}`;
    document.getElementById('score-val').innerText = score;
    document.getElementById('timer-val').innerText = "120s";
    document.getElementById('game-over-screen').classList.remove('active');

    renderBaskets();
    loopEngine = requestAnimationFrame(updateEngine);
    clockInterval = setInterval(runTimer, 1000);
    triggerSpawn();
}

// Run initial boot setup placement
renderBaskets();

