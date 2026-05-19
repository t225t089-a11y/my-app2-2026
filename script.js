const grid = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const bestDisplay = document.getElementById('best');
const resetBtn = document.getElementById('reset-btn');

const width = 8;
const tiles = [];
let score = 0;
let bestScore = localStorage.getItem('crystalMatchBest') || 0;

// Tile symbols (using emojis for simplicity and visual appeal)
const tileTypes = ['💎', '✨', '🌟', '🔮', '💠'];

bestDisplay.innerHTML = bestScore;

function createBoard() {
    grid.innerHTML = '';
    tiles.length = 0;
    for (let i = 0; i < width * width; i++) {
        const tile = document.createElement('div');
        tile.setAttribute('draggable', true);
        tile.setAttribute('id', i);
        tile.classList.add('tile');
        
        let randomType = Math.floor(Math.random() * tileTypes.length);
        tile.innerHTML = tileTypes[randomType];
        tile.classList.add(`tile-${randomType}`);
        
        grid.appendChild(tile);
        tiles.push(tile);
    }
    
    // Initial check to make sure there are no matches at start
    while (checkMatches(false)) {
        tiles.forEach(tile => {
            let randomType = Math.floor(Math.random() * tileTypes.length);
            tile.innerHTML = tileTypes[randomType];
            tile.className = 'tile ' + `tile-${randomType}`;
        });
    }
}

createBoard();

let tileIdBeingDragged;
let tileIdBeingReplaced;

tiles.forEach(tile => tile.addEventListener('dragstart', dragStart));
tiles.forEach(tile => tile.addEventListener('dragover', dragOver));
tiles.forEach(tile => tile.addEventListener('dragenter', dragEnter));
tiles.forEach(tile => tile.addEventListener('dragleave', dragLeave));
tiles.forEach(tile => tile.addEventListener('drop', dragDrop));
tiles.forEach(tile => tile.addEventListener('dragend', dragEnd));

// Touch support
tiles.forEach(tile => tile.addEventListener('touchstart', touchStart, {passive: false}));
tiles.forEach(tile => tile.addEventListener('touchend', touchEnd, {passive: false}));

let selectedTile = null;

tiles.forEach(tile => tile.addEventListener('click', () => {
    if (selectedTile) {
        const firstId = parseInt(selectedTile.id);
        const secondId = parseInt(tile.id);
        
        const validMoves = [firstId - 1, firstId + 1, firstId - width, firstId + width];
        if (validMoves.includes(secondId)) {
            swapTiles(firstId, secondId);
            selectedTile.classList.remove('selected');
            selectedTile = null;
        } else {
            selectedTile.classList.remove('selected');
            selectedTile = tile;
            selectedTile.classList.add('selected');
        }
    } else {
        selectedTile = tile;
        selectedTile.classList.add('selected');
    }
}));

function dragStart() {
    tileIdBeingDragged = parseInt(this.id);
}

function dragOver(e) { e.preventDefault(); }
function dragEnter(e) { e.preventDefault(); }
function dragLeave() {}

function dragDrop() {
    tileIdBeingReplaced = parseInt(this.id);
}

function dragEnd() {
    const validMoves = [
        tileIdBeingDragged - 1,
        tileIdBeingDragged + 1,
        tileIdBeingDragged - width,
        tileIdBeingDragged + width
    ];

    if (tileIdBeingReplaced !== undefined && validMoves.includes(tileIdBeingReplaced)) {
        swapTiles(tileIdBeingDragged, tileIdBeingReplaced);
    }
}

let touchStartX, touchStartY;
function touchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    tileIdBeingDragged = parseInt(this.id);
}

function touchEnd(e) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // Ignore small movements

    let targetId;
    if (Math.abs(dx) > Math.abs(dy)) {
        targetId = dx > 0 ? tileIdBeingDragged + 1 : tileIdBeingDragged - 1;
    } else {
        targetId = dy > 0 ? tileIdBeingDragged + width : tileIdBeingDragged - width;
    }

    if (targetId >= 0 && targetId < width * width) {
        const isHorizontalMove = Math.abs(dx) > Math.abs(dy);
        const isSameRow = Math.floor(tileIdBeingDragged / width) === Math.floor(targetId / width);
        
        if (!isHorizontalMove || isSameRow) {
            swapTiles(tileIdBeingDragged, targetId);
        }
    }
}

function swapTiles(id1, id2) {
    const type1 = tiles[id1].innerHTML;
    const class1 = tiles[id1].className;
    
    tiles[id1].innerHTML = tiles[id2].innerHTML;
    tiles[id1].className = tiles[id2].className;
    
    tiles[id2].innerHTML = type1;
    tiles[id2].className = class1;
    
    if (!checkMatches(true)) {
        // Swap back if no match
        setTimeout(() => {
            const t = tiles[id1].innerHTML;
            const c = tiles[id1].className;
            tiles[id1].innerHTML = tiles[id2].innerHTML;
            tiles[id1].className = tiles[id2].className;
            tiles[id2].innerHTML = t;
            tiles[id2].className = c;
        }, 300);
    }
}

function checkMatches(applyChanges) {
    let hasMatches = false;
    const matches = new Set();

    // Check Rows
    for (let i = 0; i < width * width; i++) {
        if (i % width < width - 2) {
            const row = [i, i + 1, i + 2];
            const type = tiles[i].innerHTML;
            if (row.every(index => tiles[index].innerHTML === type && type !== '')) {
                row.forEach(index => matches.add(index));
                hasMatches = true;
            }
        }
    }

    // Check Columns
    for (let i = 0; i < width * (width - 2); i++) {
        const col = [i, i + width, i + width * 2];
        const type = tiles[i].innerHTML;
        if (col.every(index => tiles[index].innerHTML === type && type !== '')) {
            col.forEach(index => matches.add(index));
            hasMatches = true;
        }
    }

    if (applyChanges && hasMatches) {
        score += matches.size * 10;
        scoreDisplay.innerHTML = score;
        if (score > bestScore) {
            bestScore = score;
            bestDisplay.innerHTML = bestScore;
            localStorage.setItem('crystalMatchBest', bestScore);
        }

        matches.forEach(index => {
            tiles[index].classList.add('match-fade');
        });

        setTimeout(() => {
            matches.forEach(index => {
                tiles[index].innerHTML = '';
                tiles[index].className = 'tile';
            });
            dropTiles();
        }, 300);
    }

    return hasMatches;
}

function dropTiles() {
    for (let i = 0; i < width * (width - 1); i++) {
        for (let j = 0; j < width; j++) {
            const current = i + j;
            const below = current + width;
            if (tiles[below].innerHTML === '') {
                tiles[below].innerHTML = tiles[current].innerHTML;
                tiles[below].className = tiles[current].className;
                tiles[current].innerHTML = '';
                tiles[current].className = 'tile';
            }
        }
    }
    
    // Fill top row
    for (let i = 0; i < width; i++) {
        if (tiles[i].innerHTML === '') {
            let randomType = Math.floor(Math.random() * tileTypes.length);
            tiles[i].innerHTML = tileTypes[randomType];
            tiles[i].classList.add(`tile-${randomType}`);
        }
    }

    if (tiles.some(tile => tile.innerHTML === '')) {
        setTimeout(dropTiles, 100);
    } else {
        setTimeout(() => checkMatches(true), 100);
    }
}

resetBtn.addEventListener('click', () => {
    score = 0;
    scoreDisplay.innerHTML = score;
    createBoard();
});
