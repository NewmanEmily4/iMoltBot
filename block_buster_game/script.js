/* script.js */
const GRID_SIZE = 10;
const BLOCK_SIZE = 40;
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

// --- 粒子系统开始 ---
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.gravity = 0.2;
        this.alpha = 1;
        this.life = 0.95; // 每一帧透明度减少的比例
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha *= this.life;
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
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
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
// --- 粒子系统结束 ---

function initGame() {
    canvas.width = 430;
    canvas.height = 430;
    animateParticles();
    createGrid();
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
    block.addEventListener('click', () => {
        if (isAnimating) return;
        const r = parseInt(block.dataset.row);
        const c = parseInt(block.dataset.col);
        handleBlockClick(c, r);
    });
    return block;
}

function setBlockPosition(el, row, col) {
    el.style.left = `${col * (BLOCK_SIZE + GAP)}px`;
    el.style.top = `${row * (BLOCK_SIZE + GAP)}px`;
}

function handleBlockClick(col, row) {
    const cell = grid[col][row];
    const matches = getConnectedBlocks(col, row, cell.color);
    if (matches.length > 1) {
        isAnimating = true;
        updateScore(matches.length);
        
        matches.forEach(c => {
            c.removed = true;
            // 获取方块中心位置触发粒子
            const rect = c.el.getBoundingClientRect();
            const gridRect = gridElement.getBoundingClientRect();
            const centerX = rect.left - gridRect.left + BLOCK_SIZE / 2;
            const centerY = rect.top - gridRect.top + BLOCK_SIZE / 2;
            createExplosion(centerX, centerY, COLORS[c.color]);
            
            c.el.style.transform = 'scale(0)';
            c.el.style.opacity = '0';
        });

        setTimeout(() => {
            matches.forEach(c => c.el.remove());
            applyGravity();
            checkLevelUp(); // 每次下落后检查是否过关
        }, 300);
    }
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
            requestAnimationFrame(() => setBlockPosition(c.el, idx, col));
        });
    }
    setTimeout(() => isAnimating = false, 500);
}

function updateScore(count) {
    score += count * count;
    scoreElement.textContent = score;
}

// 关卡检查逻辑
function checkLevelUp() {
    if (score >= targetScore) {
        isAnimating = true; // 暂停点击
        alert(`恭喜！完成第 ${level} 关！点击确定进入下一关。`);
        level++;
        targetScore += 500 + (level * 200); // 每一关目标分更高
        levelElement.textContent = level;
        targetElement.textContent = targetScore;
        createGrid(); // 刷新网格
    }
}

document.getElementById('restart-button').addEventListener('click', () => {
    score = 0;
    level = 1;
    targetScore = 500;
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    targetElement.textContent = '500';
    createGrid();
});

initGame();