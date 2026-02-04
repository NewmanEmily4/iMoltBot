/* script.js */

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

let grid = [];
let score = 0;
let level = 1;
let targetScore = 500;
let isAnimating = false;

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

let bgmMuted = false;
let sfxMuted = false;
let audioInitialized = false;

const bgmVolumeSlider = document.getElementById('bgm-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const bgmIcon = document.getElementById('bgm-icon');
const sfxIcon = document.getElementById('sfx-icon');

function updateBgmVolume() {
    const value = bgmVolumeSlider.value / 100;
    bgmFiles.bgm.volume = value;
    bgmIcon.textContent = bgmMuted || value === 0 ? '🔇' : (value < 0.5 ? '🎵' : '🎶');
}

function updateSfxVolume() {
    const value = sfxVolumeSlider.value / 100;
    Object.values(sfxFiles).forEach(sfx => sfx.volume = value);
    sfxIcon.textContent = sfxMuted || value === 0 ? '🔇' : '🔊';
}

function toggleBgm() {
    if (!audioInitialized) return;
    bgmMuted = !bgmMuted;
    bgmFiles.bgm.muted = bgmMuted;
    bgmIcon.textContent = bgmMuted ? '🔇' : '🎵';
}

function toggleSfx() {
    sfxMuted = !sfxMuted;
    Object.values(sfxFiles).forEach(sfx => sfx.muted = sfxMuted);
    sfxIcon.textContent = sfxMuted ? '🔇' : '🔊';
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
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            calculateBlockSize();
            canvas.width = gridElement.offsetWidth;
            canvas.height = gridElement.offsetHeight;
            animateParticles();
            createGrid();
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
            
            setTimeout(() => {
                alert(`恭喜！完成第 ${level} 关！`);
                level++;
                targetScore += 500 + (level * 200);
                levelElement.textContent = level;
                targetElement.textContent = targetScore;
                createGrid();
                if (!bgmMuted) {
                    bgmFiles.bgm.play().catch(() => {});
                }
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
    score = 0; level = 1; targetScore = 500;
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    targetElement.textContent = '500';
    calculateBlockSize();
    createGrid();
});

document.getElementById('restart-button').addEventListener('touchstart', (e) => {
    e.preventDefault();
    score = 0; level = 1; targetScore = 500;
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    targetElement.textContent = '500';
    calculateBlockSize();
    createGrid();
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

initGame();
