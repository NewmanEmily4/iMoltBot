/* script.js */

// 游戏数据存储系统
const SAVE_KEY = 'blockBuster_saveData';
const SAVE_VERSION = 3;

let grid = [];
let score = 0;
let level = 1;
let targetScore = 500;
let isAnimating = false;
let moves = 0;

let bgmMuted = false;
let sfxMuted = false;
let bgmVolume = 40;
let sfxVolume = 80;

let levelBestScores = {};
let levelBestMoves = {};
let highestScore = 0;
let levelsCompleted = 0;
let currentLevelBest = 0;
let currentLevelBestMoves = 0;
let hasShownHighestRecordToast = false;

function saveGameData() {
    const data = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        score: score,
        level: level,
        targetScore: targetScore,
        bgmMuted: bgmMuted,
        bgmVolume: bgmVolume,
        sfxMuted: sfxMuted,
        sfxVolume: sfxVolume,
        levelBestScores: levelBestScores,
        levelBestMoves: levelBestMoves,
        highestScore: highestScore,
        levelsCompleted: levelsCompleted
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save game data:', e);
    }
}

function loadGameData() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return null;
        
        const data = JSON.parse(saved);
        
        if (data.version !== SAVE_VERSION) {
            console.log('Save data version mismatch, resetting data');
            return null;
        }
        
        return data;
    } catch (e) {
        console.warn('Failed to load game data:', e);
        return null;
    }
}

function applyGameData(data) {
    score = data.score || 0;
    level = data.level || 1;
    targetScore = data.targetScore || 500;
    bgmMuted = data.bgmMuted || false;
    bgmVolume = data.bgmVolume || 40;
    sfxMuted = data.sfxMuted || false;
    sfxVolume = data.sfxVolume || 80;
    levelBestScores = data.levelBestScores || {};
    levelBestMoves = data.levelBestMoves || {};
    highestScore = data.highestScore || 0;
    levelsCompleted = data.levelsCompleted || 0;
    
    moves = 0;
    currentLevelBest = levelBestScores[level] || 0;
    currentLevelBestMoves = levelBestMoves[level] || 0;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    targetElement.textContent = targetScore;
    
    updateBestScoreDisplay();
    
    const bgmSlider = document.getElementById('bgm-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    const bgmIcon = document.getElementById('bgm-icon');
    const sfxIcon = document.getElementById('sfx-icon');
    
    if (bgmSlider) {
        bgmSlider.value = bgmVolume;
        bgmFiles.bgm.volume = bgmVolume / 100;
        bgmIcon.textContent = bgmMuted || bgmVolume === 0 ? '🔇' : (bgmVolume < 50 ? '🎵' : '🎶');
    }
    
    if (sfxSlider) {
        sfxSlider.value = sfxVolume;
        Object.values(sfxFiles).forEach(sfx => sfx.volume = sfxVolume / 100);
        sfxIcon.textContent = sfxMuted || sfxVolume === 0 ? '🔇' : '🔊';
    }
}

function clearGameData() {
    localStorage.removeItem(SAVE_KEY);
    levelBestScores = {};
    levelBestMoves = {};
    highestScore = 0;
    levelsCompleted = 0;
    currentLevelBest = 0;
    currentLevelBestMoves = 0;
    hasShownHighestRecordToast = true;
    updateBestScoreDisplay();
}

function updateBestScoreDisplay() {
    const bestDisplay = document.getElementById('best-score-display');
    if (bestDisplay) {
        let text = '';
        if (currentLevelBest > 0) {
            text += `🏆 ${currentLevelBest}`;
        }
        if (text) {
            bestDisplay.textContent = text;
            bestDisplay.style.display = 'inline';
        } else {
            bestDisplay.style.display = 'none';
        }
    }
    
    const highestDisplay = document.getElementById('highest-score-display');
    if (highestDisplay) {
        highestDisplay.textContent = `⭐ ${highestScore}`;
    }
    
    const completedDisplay = document.getElementById('completed-display');
    if (completedDisplay) {
        completedDisplay.textContent = `🎯 ${levelsCompleted}`;
    }
}

function checkAndUpdateScore() {
    if (score > highestScore) {
        highestScore = score;
        if (!hasShownHighestRecordToast || score >= highestScore + 50) {
            showNewRecordToast('🏆 新纪录!', `历史最高分: ${score}`);
            hasShownHighestRecordToast = true;
        }
    }
    
    updateBestScoreDisplay();
    saveGameData();
}

function onLevelComplete() {
    if (score > 0) {
        levelsCompleted++;
        
        let newRecord = false;
        
        if (score > currentLevelBest) {
            currentLevelBest = score;
            levelBestScores[level] = score;
            newRecord = true;
        }
        
        if (currentLevelBestMoves === 0 || moves < currentLevelBestMoves) {
            currentLevelBestMoves = moves;
            levelBestMoves[level] = moves;
            newRecord = true;
        }
        
        if (newRecord) {
            setTimeout(() => {
                showNewRecordToast('🎊 新纪录!', 
                    (currentLevelBest > 0 ? `得分: ${currentLevelBest}` : '') + 
                    (currentLevelBestMoves > 0 ? (currentLevelBest > 0 ? ' | ' : '') + `步数: ${currentLevelBestMoves}` : '')
                );
            }, 300);
        }
        
        checkAndUpdateScore();
    }
}

function resetMoves() {
    moves = 0;
    const movesValue = document.getElementById('moves-value');
    if (movesValue) {
        movesValue.textContent = '0';
    }
}

function incrementMoves() {
    moves++;
    const movesValue = document.getElementById('moves-value');
    if (movesValue) {
        movesValue.textContent = moves;
    }
}

// 新手引导系统
const GUIDE_KEY = 'blockBuster_guideCompleted';
let currentGuideStep = 0;

const guideSteps = [
    {
        icon: '🎮',
        title: '欢迎来到 Block Buster!',
        text: '点击任意2个或更多相连的同色方块即可消除！',
        hint: '点击任意位置继续',
        target: 'grid'
    },
    {
        icon: '✨',
        title: '消除规则',
        text: '消除的方块越多，得分越高！\n3个方块 = 9分, 4个方块 = 16分',
        hint: '明白了，继续',
        target: 'stats-bar'
    },
    {
        icon: '🎯',
        title: '通关目标',
        text: '每关都有目标分数，达到目标即可进入下一关！',
        hint: '开始游戏！',
        target: 'restart-button'
    }
];

function isGuideCompleted() {
    return localStorage.getItem(GUIDE_KEY) === 'true';
}

function completeGuide() {
    localStorage.setItem(GUIDE_KEY, 'true');
}

function showGuideStep(step) {
    const overlay = document.getElementById('guide-overlay');
    const content = document.getElementById('guide-content');
    const icon = document.getElementById('guide-icon');
    const title = document.getElementById('guide-title');
    const text = document.getElementById('guide-text');
    const hint = document.getElementById('guide-hint');
    const dots = document.querySelectorAll('.guide-dot');
    
    if (step >= guideSteps.length) {
        hideGuide();
        completeGuide();
        return;
    }
    
    const guideData = guideSteps[step];
    icon.textContent = guideData.icon;
    title.textContent = guideData.title;
    text.textContent = guideData.text;
    hint.textContent = guideData.hint;
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === step);
    });
    
    overlay.classList.remove('hidden');
    
    document.querySelectorAll('.guide-highlight').forEach(el => {
        el.classList.remove('guide-highlight');
    });
    
    if (guideData.target) {
        const targetEl = document.getElementById(guideData.target);
        if (targetEl) {
            targetEl.classList.add('guide-highlight');
        }
    }
}

function hideGuide() {
    const overlay = document.getElementById('guide-overlay');
    overlay.classList.add('hidden');
    document.querySelectorAll('.guide-highlight').forEach(el => {
        el.classList.remove('guide-highlight');
    });
}

function initGuide() {
    if (isGuideCompleted()) {
        return;
    }
    
    currentGuideStep = 0;
    
    const overlay = document.getElementById('guide-overlay');
    const content = document.getElementById('guide-content');
    
    const handleNext = () => {
        currentGuideStep++;
        if (currentGuideStep >= guideSteps.length) {
            hideGuide();
            completeGuide();
        } else {
            showGuideStep(currentGuideStep);
        }
    };
    
    content.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNext();
    });
    
    overlay.addEventListener('click', handleNext);
    
    showGuideStep(0);
}

function showGuideOnly() {
    currentGuideStep = 0;
    showGuideStep(0);
    
    const overlay = document.getElementById('guide-overlay');
    const content = document.getElementById('guide-content');
    
    const handleNext = () => {
        currentGuideStep++;
        if (currentGuideStep >= guideSteps.length) {
            hideGuide();
        } else {
            showGuideStep(currentGuideStep);
        }
    };
    
    content.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNext();
    });
    
    overlay.addEventListener('click', handleNext);
}

document.getElementById('help-button').addEventListener('click', (e) => {
    e.stopPropagation();
    showGuideOnly();
});

document.getElementById('help-button').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showGuideOnly();
}, { passive: false });

// 关卡完成弹窗
function showLevelComplete() {
    const modal = document.getElementById('level-complete-modal');
    const completedLevel = document.getElementById('completed-level');
    const modalScore = document.getElementById('modal-score');
    const modalMoves = document.getElementById('modal-moves');
    const modalBestScore = document.getElementById('modal-best-score');
    const modalBestMoves = document.getElementById('modal-best-moves');
    const modalHighest = document.getElementById('modal-highest');
    const modalCompleted = document.getElementById('modal-completed');
    const stars = document.querySelectorAll('.modal-star');
    
    completedLevel.textContent = level;
    modalScore.textContent = score;
    modalMoves.textContent = moves;
    
    const bestScore = levelBestScores[level] || 0;
    const bestMoves = levelBestMoves[level] || 0;
    modalBestScore.textContent = '🏆 最佳: ' + bestScore;
    modalBestMoves.textContent = '👣 最佳: ' + (bestMoves > 0 ? bestMoves + '步' : '-');
    
    modalHighest.textContent = '⭐ 历史最高: ' + highestScore;
    modalCompleted.textContent = '🎯 通关: ' + levelsCompleted;
    
    stars.forEach(star => {
        star.style.opacity = '0';
        star.style.animation = 'none';
    });
    
    setTimeout(() => {
        stars.forEach(star => {
            star.style.animation = '';
        });
    }, 10);
    
    modal.classList.remove('hidden');
    
    const nextLevelHandler = () => {
        modal.classList.add('hidden');
        level++;
        targetScore += 500 + (level * 200);
        levelElement.textContent = level;
        targetElement.textContent = targetScore;
        moves = 0;
        document.getElementById('moves-value').textContent = '0';
        currentLevelBest = levelBestScores[level] || 0;
        currentLevelBestMoves = levelBestMoves[level] || 0;
        updateBestScoreDisplay();
        createGrid();
        checkAndUpdateScore();
        if (!bgmMuted) {
            bgmFiles.bgm.play().catch(() => {});
        }
    };
    
    document.getElementById('next-level-btn').onclick = nextLevelHandler;
    
    modal.querySelector('.modal-backdrop').onclick = nextLevelHandler;
}

const GRID_SIZE = 10;
let BLOCK_SIZE = 40;
const GAP = 3;
const COLORS = {
    red: '#e74c3c',
    green: '#2ecc71',
    blue: '#3498db',
    yellow: '#f1c40f',
    purple: '#9b59b6'
};
const COLOR_KEYS = Object.keys(COLORS);

const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score-value');
const levelElement = document.getElementById('level-value');
const targetElement = document.getElementById('target-value');
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

function getWrapperSize() {
    const wrapper = document.getElementById('grid-wrapper');
    return {
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight
    };
}

function calculateBlockSize() {
    const { width, height } = getWrapperSize();
    const minDimension = Math.min(width, height);
    const totalGap = GAP * (GRID_SIZE - 1);
    const size = (minDimension - totalGap) / GRID_SIZE;
    BLOCK_SIZE = Math.round(size);
    return BLOCK_SIZE;
}

function getCurrentBlockSize() {
    return calculateBlockSize();
}

const bgmFiles = {
    bgm: new Audio('bgm.mp3')
};

const sfxFiles = {
    click: new Audio('click.mp3'),
    pop: new Audio('pop.mp3'),
    levelUp: new Audio('level-up.wav')
};

bgmFiles.bgm.loop = true;
bgmFiles.bgm.volume = 0.2;
bgmFiles.bgm.preload = 'auto';

sfxFiles.click.volume = 0.5;
sfxFiles.pop.volume = 0.5;
sfxFiles.levelUp.volume = 0.7;

let audioInitialized = false;

const bgmVolumeSlider = document.getElementById('bgm-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const bgmIcon = document.getElementById('bgm-icon');
const sfxIcon = document.getElementById('sfx-icon');

function updateBgmVolume() {
    const value = bgmVolumeSlider.value / 100;
    bgmFiles.bgm.volume = value;
    bgmVolume = bgmVolumeSlider.value;
    bgmIcon.textContent = bgmMuted || value === 0 ? '🔇' : (value < 0.5 ? '🎵' : '🎶');
    saveGameData();
}

function updateSfxVolume() {
    const value = sfxVolumeSlider.value / 100;
    Object.values(sfxFiles).forEach(sfx => sfx.volume = value);
    sfxVolume = sfxVolumeSlider.value;
    sfxIcon.textContent = sfxMuted || value === 0 ? '🔇' : '🔊';
    saveGameData();
}

function toggleBgm() {
    if (!audioInitialized) return;
    bgmMuted = !bgmMuted;
    bgmFiles.bgm.muted = bgmMuted;
    bgmIcon.textContent = bgmMuted ? '🔇' : '🎵';
    saveGameData();
}

function toggleSfx() {
    sfxMuted = !sfxMuted;
    Object.values(sfxFiles).forEach(sfx => sfx.muted = sfxMuted);
    sfxIcon.textContent = sfxMuted ? '🔇' : '🔊';
    saveGameData();
}

function initAudio() {
    if (audioInitialized) return;
    audioInitialized = true;
    
    bgmFiles.bgm.play().then(() => {
        if (bgmMuted) {
            bgmFiles.bgm.muted = true;
        }
    }).catch(() => {});
    
    Object.values(sfxFiles).forEach(sfx => {
        sfx.play().then(() => {
            sfx.pause();
            sfx.currentTime = 0;
        }).catch(() => {});
    });
}

bgmVolumeSlider.addEventListener('input', updateBgmVolume);
sfxVolumeSlider.addEventListener('input', updateSfxVolume);
bgmIcon.addEventListener('click', toggleBgm);
sfxIcon.addEventListener('click', toggleSfx);
bgmIcon.addEventListener('touchstart', (e) => { e.preventDefault(); toggleBgm(); }, { passive: false });
sfxIcon.addEventListener('touchstart', (e) => { e.preventDefault(); toggleSfx(); }, { passive: false });

// --- 粒子系统 ---
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.gravity = 0.2;
        this.alpha = 1;
        this.life = 0.95;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        this.speedY += this.gravity; this.alpha *= this.life;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) particles.push(new Particle(x, y, color));
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha < 0.01) particles.splice(i, 1);
    }
    requestAnimationFrame(animateParticles);
}

// --- 核心逻辑 ---
function initGame() {
    applyGameData(loadGameData());
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            calculateBlockSize();
            canvas.width = gridElement.offsetWidth;
            canvas.height = gridElement.offsetHeight;
            animateParticles();
            createGrid();
            initGuide();
        });
    });
    
    const handleFirstInteraction = () => {
        initAudio();
        bgmFiles.bgm.play().catch(() => {});
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
}

function createGrid() {
    gridElement.innerHTML = '';
    grid = [];
    isAnimating = false;
    for (let col = 0; col < GRID_SIZE; col++) {
        let colArray = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
            const block = createBlockElement(row, col, color);
            colArray.push({ color, el: block, row, col, removed: false });
            gridElement.appendChild(block);
        }
        grid.push(colArray);
    }
}

function createBlockElement(row, col, color) {
    const block = document.createElement('div');
    block.classList.add('block', color);
    block.dataset.row = row;
    block.dataset.col = col;
    setBlockPosition(block, row, col);
    
    const handleClick = (e) => {
        e.preventDefault();
        if (isAnimating) return;
        handleBlockClick(parseInt(block.dataset.col), parseInt(block.dataset.row));
    };
    
    block.addEventListener('click', handleClick);
    block.addEventListener('touchstart', handleClick, { passive: false });
    
    return block;
}

function setBlockPosition(el, row, col) {
    const currentSize = getCurrentBlockSize();
    el.style.width = currentSize + 'px';
    el.style.height = currentSize + 'px';
    el.style.left = (col * (currentSize + GAP)) + 'px';
    el.style.top = (row * (currentSize + GAP)) + 'px';
}

function handleBlockClick(col, row) {
    if (!audioInitialized) {
        initAudio();
    }
    
    const cell = grid[col][row];
    const matches = getConnectedBlocks(col, row, cell.color);
    const currentBlockSize = getCurrentBlockSize();
    
    if (matches.length > 1) {
        sfxFiles.pop.currentTime = 0;
        sfxFiles.pop.play();
        
        isAnimating = true;
        incrementMoves();
        const gain = matches.length * matches.length;
        updateScore(matches.length);
        
        if (matches.length > 8) shakeGrid();

        let centerX = 0, centerY = 0;
        let validCenter = false;
        matches.forEach(c => {
            c.removed = true;
            if (!validCenter) {
                centerX = c.col * (currentBlockSize + GAP) + currentBlockSize / 2;
                centerY = c.row * (currentBlockSize + GAP) + currentBlockSize / 2;
                validCenter = true;
            }
            
            createExplosion(centerX, centerY, COLORS[c.color]);
            c.el.style.transform = 'scale(0)';
            c.el.style.opacity = '0';
        });

        showFloatingScore(centerX, centerY, gain);

        setTimeout(() => {
            matches.forEach(c => c.el.remove());
            applyGravity();
            checkLevelUp();
        }, 300);
    } else {
        sfxFiles.click.currentTime = 0;
        sfxFiles.click.play();
    }
}

function updateScore(count) {
    score += count * count;
    scoreElement.textContent = score;
    checkAndUpdateScore();
}

function getConnectedBlocks(col, row, color, visited = new Set()) {
    const key = `${col},${row}`;
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE || visited.has(key)) return [];
    const cell = grid[col][row];
    if (!cell || cell.removed || cell.color !== color) return [];
    visited.add(key);
    return [cell, ...getConnectedBlocks(col-1, row, color, visited), 
                  ...getConnectedBlocks(col+1, row, color, visited),
                  ...getConnectedBlocks(col, row-1, color, visited),
                  ...getConnectedBlocks(col, row+1, color, visited)];
}

function applyGravity() {
    for (let col = 0; col < GRID_SIZE; col++) {
        let survivors = grid[col].filter(c => !c.removed);
        let missing = GRID_SIZE - survivors.length;
        for (let i = 0; i < missing; i++) {
            const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
            const row = -1 - i;
            const el = createBlockElement(row, col, color);
            gridElement.appendChild(el);
            survivors.unshift({ color, el, row, col, removed: false });
        }
        grid[col] = survivors;
        survivors.forEach((c, idx) => {
            c.row = idx;
            c.el.dataset.row = idx;
            requestAnimationFrame(() => setBlockPosition(c.el, idx, c.col));
        });
    }
    setTimeout(() => isAnimating = false, 500);
}

function checkLevelUp() {
    if (score >= targetScore) {
        isAnimating = true;
        setTimeout(() => {
            bgmFiles.bgm.pause();
            bgmFiles.bgm.currentTime = 0;
            if (!audioInitialized) {
                initAudio();
            }
            sfxFiles.levelUp.currentTime = 0;
            sfxFiles.levelUp.play();
            
            onLevelComplete();
            
            setTimeout(() => {
                showLevelComplete();
            }, 300);
        }, 500);
    }
}

function showFloatingScore(x, y, amount) {
    const scorePopup = document.createElement('div');
    scorePopup.className = 'floating-score';
    scorePopup.textContent = `+${amount}`;
    scorePopup.style.left = `${x}px`;
    scorePopup.style.top = `${y}px`;
    document.getElementById('grid-wrapper').appendChild(scorePopup);
    setTimeout(() => scorePopup.remove(), 1000);
}

function shakeGrid() {
    gridElement.classList.add('shake');
    setTimeout(() => gridElement.classList.remove('shake'), 400);
}

document.getElementById('restart-button').addEventListener('click', () => {
    score = 0; level = 1; targetScore = 500; moves = 0;
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    targetElement.textContent = '500';
    document.getElementById('moves-value').textContent = '0';
    currentLevelBest = levelBestScores[level] || 0;
    currentLevelBestMoves = levelBestMoves[level] || 0;
    updateBestScoreDisplay();
    calculateBlockSize();
    createGrid();
    checkAndUpdateScore();
});

document.getElementById('restart-button').addEventListener('touchstart', (e) => {
    e.preventDefault();
    score = 0; level = 1; targetScore = 500; moves = 0;
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    targetElement.textContent = '500';
    document.getElementById('moves-value').textContent = '0';
    currentLevelBest = levelBestScores[level] || 0;
    currentLevelBestMoves = levelBestMoves[level] || 0;
    updateBestScoreDisplay();
    calculateBlockSize();
    createGrid();
    checkAndUpdateScore();
});

window.addEventListener('resize', () => {
    calculateBlockSize();
    canvas.width = gridElement.offsetWidth;
    canvas.height = gridElement.offsetHeight;
    grid.forEach(col => {
        col.forEach((c, idx) => {
            c.row = idx;
            c.el.dataset.row = idx;
            requestAnimationFrame(() => setBlockPosition(c.el, idx, c.col));
        });
    });
});

function pauseAllAudio() {
    Object.values(bgmFiles).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    Object.values(sfxFiles).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseAllAudio();
    }
});

document.addEventListener('pagehide', () => {
    pauseAllAudio();
});

window.addEventListener('beforeunload', () => {
    pauseAllAudio();
});

// 设置模态框
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const bgmSlider = document.getElementById('settings-bgm-volume');
    const sfxSlider = document.getElementById('settings-sfx-volume');
    const bgmValue = document.getElementById('settings-bgm-value');
    const sfxValue = document.getElementById('settings-sfx-value');
    const settingsHighest = document.getElementById('settings-highest');
    const settingsCompleted = document.getElementById('settings-completed');
    
    bgmSlider.value = bgmVolume;
    sfxSlider.value = sfxVolume;
    bgmValue.textContent = bgmVolume + '%';
    sfxValue.textContent = sfxVolume + '%';
    settingsHighest.textContent = '⭐ 历史最高分: ' + highestScore;
    settingsCompleted.textContent = '🎯 总通关次数: ' + levelsCompleted;
    
    modal.classList.remove('hidden');
}

function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
}

document.getElementById('settings-button').addEventListener('click', (e) => {
    e.stopPropagation();
    showSettingsModal();
});

document.getElementById('settings-button').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showSettingsModal();
}, { passive: false });

document.getElementById('close-settings-btn').addEventListener('click', hideSettingsModal);
document.querySelector('#settings-modal .modal-backdrop').addEventListener('click', hideSettingsModal);

document.getElementById('settings-bgm-volume').addEventListener('input', (e) => {
    bgmVolume = e.target.value;
    bgmFiles.bgm.volume = bgmVolume / 100;
    document.getElementById('settings-bgm-value').textContent = bgmVolume + '%';
    document.getElementById('bgm-volume').value = bgmVolume;
    saveGameData();
});

document.getElementById('settings-sfx-volume').addEventListener('input', (e) => {
    sfxVolume = e.target.value;
    Object.values(sfxFiles).forEach(sfx => sfx.volume = sfxVolume / 100);
    document.getElementById('settings-sfx-value').textContent = sfxVolume + '%';
    document.getElementById('sfx-volume').value = sfxVolume;
    saveGameData();
});

document.getElementById('reset-data-btn').addEventListener('click', () => {
    hideSettingsModal();
    document.getElementById('reset-confirm-modal').classList.remove('hidden');
});

document.getElementById('cancel-reset-btn').addEventListener('click', () => {
    document.getElementById('reset-confirm-modal').classList.add('hidden');
});

document.getElementById('confirm-reset-btn').addEventListener('click', () => {
    clearGameData();
    score = 0;
    level = 1;
    targetScore = 500;
    bgmVolume = 40;
    sfxVolume = 80;
    bgmMuted = false;
    sfxMuted = false;
    hasShownHighestRecordToast = true;
    
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    targetElement.textContent = '500';
    
    document.getElementById('bgm-volume').value = 40;
    document.getElementById('sfx-volume').value = 80;
    bgmFiles.bgm.volume = 0.4;
    Object.values(sfxFiles).forEach(sfx => sfx.volume = 0.8);
    
    document.getElementById('settings-bgm-volume').value = 40;
    document.getElementById('settings-sfx-volume').value = 80;
    document.getElementById('settings-bgm-value').textContent = '40%';
    document.getElementById('settings-sfx-value').textContent = '40%';
    
    document.getElementById('reset-confirm-modal').classList.add('hidden');
    document.getElementById('reset-complete-modal').classList.remove('hidden');
    
    createGrid();
});

document.getElementById('close-reset-complete-btn').addEventListener('click', () => {
    document.getElementById('reset-complete-modal').classList.add('hidden');
});

// 统计页面
function showStatsModal() {
    const modal = document.getElementById('stats-modal');
    const statsHighestScore = document.getElementById('stats-highest-score');
    const statsLevelsCompleted = document.getElementById('stats-levels-completed');
    const statsMaxLevel = document.getElementById('stats-max-level');
    const levelBestMovesList = document.getElementById('level-best-moves-list');
    
    statsHighestScore.textContent = highestScore;
    statsLevelsCompleted.textContent = levelsCompleted;
    statsMaxLevel.textContent = level;
    
    levelBestMovesList.innerHTML = '';
    const levels = Object.keys(levelBestMoves).map(Number).sort((a, b) => a - b);
    
    if (levels.length === 0) {
        levelBestMovesList.innerHTML = '<div class="level-best-item">暂无记录</div>';
    } else {
        let html = '';
        levels.forEach(lvl => {
            const moves = levelBestMoves[lvl];
            html += `<div class="level-best-item"><span class="level-num">第${lvl}关</span><span class="level-moves">${moves}步</span></div>`;
        });
        levelBestMovesList.innerHTML = html;
    }
    
    modal.classList.remove('hidden');
}

function hideStatsModal() {
    const modal = document.getElementById('stats-modal');
    modal.classList.add('hidden');
}

document.getElementById('stats-button').addEventListener('click', (e) => {
    e.stopPropagation();
    showStatsModal();
});

document.getElementById('stats-button').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showStatsModal();
}, { passive: false });

document.getElementById('close-stats-btn').addEventListener('click', hideStatsModal);
document.querySelector('#stats-modal .modal-backdrop').addEventListener('click', hideStatsModal);

// 新纪录提示
function showNewRecordToast(title, text) {
    const toast = document.getElementById('record-toast');
    const toastTitle = document.getElementById('record-toast-title');
    const toastText = document.getElementById('record-toast-text');
    
    toastTitle.textContent = title;
    toastText.textContent = text;
    toast.classList.remove('hidden');
    
    if (window.recordToastTimeout) {
        clearTimeout(window.recordToastTimeout);
    }
    
    window.recordToastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

initGame();
