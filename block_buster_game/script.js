const GRID_SIZE = 10;
const COLORS = ['red', 'green', 'blue', 'yellow', 'purple'];
let grid = [];
let score = 0;

const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score-value');
const restartButton = document.getElementById('restart-button');

function createGrid() {
    grid = [];
    gridElement.innerHTML = '';
    for (let row = 0; row < GRID_SIZE; row++) {
        let rowArray = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            rowArray.push(color);

            const block = createBlockElement(row, col, color);
            gridElement.appendChild(block);
        }
        grid.push(rowArray);
    }
}

function createBlockElement(row, col, color) {
    const block = document.createElement('div');
    block.classList.add('block', color);
    block.dataset.row = row;
    block.dataset.col = col;
    block.dataset.color = color;

    block.addEventListener('click', () => handleBlockClick(row, col));

    return block;
}

function handleBlockClick(row, col) {
    const color = grid[row][col];
    if (!color) return;

    const blocksToRemove = getConnectedBlocks(row, col, color);
    if (blocksToRemove.length > 1) {
        removeBlocks(blocksToRemove);
        updateScore(blocksToRemove.length);
        dropBlocks();
        setTimeout(refillGrid, 200); // Add slight delay for visual effect on drop
    }
}

function getConnectedBlocks(row, col, color, visited = new Set()) {
    const key = row + ',' + col;
    if (
        row < 0 ||
        col < 0 ||
        row >= GRID_SIZE ||
        col >= GRID_SIZE ||
        grid[row][col] !== color ||
        visited.has(key)
    ) {
        return [];
    }

    visited.add(key);
    let blocks = [{ row, col }];

    blocks = blocks.concat(getConnectedBlocks(row - 1, col, color, visited));
    blocks = blocks.concat(getConnectedBlocks(row + 1, col, color, visited));
    blocks = blocks.concat(getConnectedBlocks(row, col - 1, color, visited));
    blocks = blocks.concat(getConnectedBlocks(row, col + 1, color, visited));

    return blocks;
}

function removeBlocks(blocks) {
    blocks.forEach(({ row, col }) => {
        grid[row][col] = null;
        const blockElement = document.querySelector(
            `.block[data-row='${row}'][data-col='${col}']`
        );
        blockElement.classList.add('removed'); // Add a class for animation
        setTimeout(() => {
            blockElement.remove();
        }, 200);
    });
}

function updateScore(blockCount) {
    score += blockCount * blockCount; // Score increases quadratically with block count
    scoreElement.textContent = score;
}

function dropBlocks() {
    for (let col = 0; col < GRID_SIZE; col++) {
        let emptyRows = [];
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
            if (!grid[row][col]) {
                emptyRows.push(row);
            } else if (emptyRows.length > 0) {
                const emptyRow = emptyRows.shift();
                grid[emptyRow][col] = grid[row][col];
                grid[row][col] = null;

                const blockElement = document.querySelector(
                    `.block[data-row='${row}'][data-col='${col}']`
                );
                blockElement.dataset.row = emptyRow;
                blockElement.style.transform = `translateY(${(emptyRow - row) * 43}px)`; // Add animation for falling
                setTimeout(() => {
                    blockElement.style.transform = '';
                }, 200);
            }
        }
    }
}

function refillGrid() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (!grid[row][col]) {
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                grid[row][col] = color;

                const block = createBlockElement(row, col, color);
                block.style.opacity = 0;
                gridElement.appendChild(block);

                setTimeout(() => {
                    block.style.opacity = 1;
                }, 10);
            }
        }
    }
}

// Event listener for restarting the game
restartButton.addEventListener('click', () => {
    score = 0;
    scoreElement.textContent = '0';
    createGrid();
});

// Initialize the game
createGrid();