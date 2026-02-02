/* script.js */
const GRID_SIZE = 10;
const BLOCK_SIZE = 40;
const GAP = 3;
const COLORS = ['red', 'green', 'blue', 'yellow', 'purple'];

// grid 存放对象: { color: string, el: HTMLElement, row: number, col: number, removed: boolean }
let grid = []; 
let score = 0;
let isAnimating = false; // 防止动画过程中重复点击

const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score-value');
const restartButton = document.getElementById('restart-button');

function createGrid() {
    gridElement.innerHTML = '';
    grid = [];
    score = 0;
    scoreElement.textContent = score;
    isAnimating = false;

    for (let col = 0; col < GRID_SIZE; col++) {
        let colArray = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const block = createBlockElement(row, col, color);
            
            // 存入逻辑网格
            colArray.push({
                color: color,
                el: block,
                row: row,
                col: col,
                removed: false
            });
            
            gridElement.appendChild(block);
        }
        grid.push(colArray);
    }
}

// 计算坐标并设置位置
function setBlockPosition(element, row, col) {
    const x = col * (BLOCK_SIZE + GAP);
    const y = row * (BLOCK_SIZE + GAP);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
}

function createBlockElement(row, col, color) {
    const block = document.createElement('div');
    block.classList.add('block', color);
    
    // 初始化坐标属性
    block.dataset.row = row;
    block.dataset.col = col;

    setBlockPosition(block, row, col);
    
    // 修正：点击时不使用闭包里的 row，而是读取当前元素上的 data-row
    block.addEventListener('click', (e) => {
        // e.target 可能是内部元素，所以用 block 变量本身最安全
        const currentRow = parseInt(block.dataset.row); 
        handleBlockClick(col, currentRow);
    });

    return block;
}

function handleBlockClick(col, row) {
    if (isAnimating) return; // 动画中禁止点击

    const cell = grid[col][row];
    if (!cell || cell.removed) return;

    const blocksToRemove = getConnectedBlocks(col, row, cell.color);

    if (blocksToRemove.length > 1) {
        updateScore(blocksToRemove.length);
        eliminateBlocks(blocksToRemove);
    }
}

function getConnectedBlocks(col, row, color, visited = new Set()) {
    const key = `${col},${row}`;
    if (
        col < 0 || col >= GRID_SIZE || 
        row < 0 || row >= GRID_SIZE || 
        visited.has(key)
    ) return [];

    const cell = grid[col][row];
    if (!cell || cell.removed || cell.color !== color) return [];

    visited.add(key);
    let matches = [cell];

    matches = matches.concat(getConnectedBlocks(col - 1, row, color, visited));
    matches = matches.concat(getConnectedBlocks(col + 1, row, color, visited));
    matches = matches.concat(getConnectedBlocks(col, row - 1, color, visited));
    matches = matches.concat(getConnectedBlocks(col, row + 1, color, visited));

    return matches;
}

function eliminateBlocks(blocks) {
    isAnimating = true;

    // 1. 标记并执行消除动画（淡出）
    blocks.forEach(cell => {
        cell.removed = true;
        cell.el.style.opacity = '0';
        cell.el.style.transform = 'scale(0.8)';
    });

    // 等待消除动画完成 (300ms) 后，执行下落
    setTimeout(() => {
        // 清除DOM
        blocks.forEach(cell => {
            if (cell.el.parentNode) cell.el.remove();
        });
        
        applyGravity();
    }, 300);
}

function applyGravity() {
    // 对每一列进行处理
    for (let col = 0; col < GRID_SIZE; col++) {
        const colData = grid[col]; 
        
        // 1. 收集幸存的方块
        let survivingBlocks = colData.filter(cell => !cell.removed);
        
        // 2. 计算需要补充多少个新方块
        let missingCount = GRID_SIZE - survivingBlocks.length;
        
        // 3. 生成新方块
        for (let i = 0; i < missingCount; i++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            
            // 计算起始行号（隐藏在上方）
            const startRow = -1 - i; 
            
            // 修正：使用 createBlockElement 统一创建，确保 dataset 和点击事件被正确绑定
            const block = createBlockElement(startRow, col, color);
            
            gridElement.appendChild(block);

            // 加到幸存列表的最前面
            survivingBlocks.unshift({
                color: color,
                el: block,
                row: startRow, 
                col: col,
                removed: false
            });
        }

        // 4. 更新整个列的数据
        grid[col] = survivingBlocks; 
        
        survivingBlocks.forEach((cell, newRowIndex) => {
            // 更新内部逻辑数据
            cell.row = newRowIndex;
            
            // 关键修正：必须同步更新 DOM 上的 dataset，否则点击事件会错乱
            cell.el.dataset.row = newRowIndex;

            // 触发下落动画
            requestAnimationFrame(() => {
                setBlockPosition(cell.el, newRowIndex, col);
            });
        });
    }

    setTimeout(() => {
        isAnimating = false;
    }, 550);
}

function updateScore(count) {
    score += count * count;
    scoreElement.textContent = score;
}

restartButton.addEventListener('click', createGrid);

// 初始化
createGrid();