const Game = {
    cols: 7,
    rows: 6,
    board: Array(42).fill(null),
    currentPlayer: 'X',
    winner: null,
    clocks: { X: 300, O: 300 },
    increment: 0,
    timerId: null,
    isStarted: false,
    isLocal: false,
    lastMoveIdx: -1,

    getLowestEmptyRow(col) {
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r * this.cols + col] === null) return r;
        }
        return -1;
    },

    checkWin() {
        const b = this.board;
        const c = this.cols;
        const r = this.rows;
        for (let j = 0; j < r; j++)
            for (let i = 0; i < c - 3; i++) {
                const idx = j * c + i;
                if (b[idx] && b[idx] === b[idx+1] && b[idx] === b[idx+2] && b[idx] === b[idx+3]) return b[idx];
            }
        for (let i = 0; i < c; i++)
            for (let j = 0; j < r - 3; j++) {
                const idx = j * c + i;
                if (b[idx] && b[idx] === b[(j+1)*c + i] && b[idx] === b[(j+2)*c + i] && b[idx] === b[(j+3)*c + i]) return b[idx];
            }
        for (let i = 0; i < c - 3; i++)
            for (let j = 0; j < r - 3; j++) {
                const idx = j * c + i;
                if (b[idx] && b[idx] === b[(j+1)*c + (i+1)] && b[idx] === b[(j+2)*c + (i+2)] && b[idx] === b[(j+3)*c + (i+3)]) return b[idx];
            }
        for (let i = 3; i < c; i++)
            for (let j = 0; j < r - 3; j++) {
                const idx = j * c + i;
                if (b[idx] && b[idx] === b[(j+1)*c + (i-1)] && b[idx] === b[(j+2)*c + (i-2)] && b[idx] === b[(j+3)*c + (i-3)]) return b[idx];
            }
        return b.includes(null) ? null : 'Draw';
    },

    makeMove(col) {
        if (this.winner) return false;
        const row = this.getLowestEmptyRow(col);
        if (row === -1) return false;
        const idx = row * this.cols + col;
        this.board[idx] = this.currentPlayer;
        this.lastMoveIdx = idx;
        this.winner = this.checkWin();
        if (this.isStarted) this.clocks[this.currentPlayer] += this.increment;
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        return true;
    },

    reset() {
        this.board = Array(42).fill(null);
        this.currentPlayer = 'X';
        this.winner = null;
        this.clocks = { X: 300, O: 300 };
        this.isStarted = false;
        this.lastMoveIdx = -1;
        if (this.timerId) clearInterval(this.timerId);
    }
};

let peer, conn, mySymbol = null, isHost = false, hostStartingAs = 'X';

function updateSliderLabels() {
    document.getElementById('time-val-display').innerText = `${document.getElementById('time-slider').value} MIN`;
    document.getElementById('inc-val-display').innerText = `${document.getElementById('inc-slider').value} SEC`;
}

function setStarter(who) {
    const meBtn = document.getElementById('btn-start-me');
    const peerBtn = document.getElementById('btn-start-peer');
    if (who === 'host') {
        hostStartingAs = 'X';
        meBtn.classList.add('active');
        peerBtn.classList.remove('active');
    } else {
        hostStartingAs = 'O';
        peerBtn.classList.add('active');
        meBtn.classList.remove('active');
    }
}

function initPeer(showId = false) {
    return new Promise((resolve) => {
        if (peer) return resolve(peer);
        const idBtn = document.getElementById('gen-id-btn');
        if (showId) idBtn.innerText = "Connecting...";
        const id = Math.random().toString(36).substr(2, 5).toUpperCase();
        peer = new Peer(id);
        peer.on('open', sid => {
            if (showId) {
                document.getElementById('my-id').value = sid;
                document.getElementById('id-actions').classList.add('hidden');
                document.getElementById('id-display').classList.remove('hidden');
                document.getElementById('status').innerText = "Room Created";
            }
            resolve(peer);
        });
        peer.on('connection', c => {
            if (conn) return c.close();
            conn = c; isHost = true;
            document.getElementById('host-lobby').classList.remove('hidden');
            document.getElementById('status').innerText = "Player Joined";
            setupConnection();
        });
    });
}

async function handleJoin() {
    const targetId = document.getElementById('peer-id').value.toUpperCase();
    const myId = document.getElementById('my-id').value.toUpperCase();
    if (!targetId) return;
    if (myId && targetId === myId) {
        Game.isLocal = true; isHost = true;
        document.getElementById('side-select-group').classList.add('hidden');
        document.getElementById('host-lobby').classList.remove('hidden');
        document.getElementById('status').innerText = "Local Mode";
        return;
    }
    document.getElementById('status').innerText = "Initializing...";
    await initPeer(false);
    document.getElementById('status').innerText = "Connecting...";
    conn = peer.connect(targetId);
    isHost = false;
    setupConnection();
}

function setupConnection() {
    conn.on('open', () => { document.getElementById('status').innerText = "Connected"; });
    conn.on('data', d => {
        if (d.type === 'START') beginMatch(d);
        if (d.type === 'MOVE') { Game.makeMove(d.col); render(); }
    });
}

function beginMatch(config) {
    document.getElementById('setup-view').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    Game.reset();
    const baseSeconds = config.time * 60;
    Game.clocks.X = baseSeconds; Game.clocks.O = baseSeconds;
    Game.increment = config.inc; Game.isStarted = true;
    if (Game.isLocal) { mySymbol = 'LOCAL'; } else { mySymbol = isHost ? config.hostSymbol : (config.hostSymbol === 'X' ? 'O' : 'X'); }
    startClock(); render();
}

document.getElementById('start-game-btn').onclick = () => {
    const config = { type: 'START', time: parseInt(document.getElementById('time-slider').value), inc: parseInt(document.getElementById('inc-slider').value), hostSymbol: hostStartingAs };
    if (!Game.isLocal && conn) conn.send(config);
    beginMatch(config);
};

function startClock() {
    if (Game.timerId) clearInterval(Game.timerId);
    Game.timerId = setInterval(() => {
        if (Game.winner) return clearInterval(Game.timerId);
        Game.clocks[Game.currentPlayer]--;
        if (Game.clocks[Game.currentPlayer] <= 0) { Game.winner = Game.currentPlayer === 'X' ? 'O' : 'X'; clearInterval(Game.timerId); }
        updateClockUI();
    }, 1000);
}

function updateClockUI() {
    const fmt = s => { if (s < 0) return "00:00"; const m = Math.floor(s/60).toString().padStart(2,'0'); const sec = (s%60).toString().padStart(2,'0'); return `${m}:${sec}`; };
    let pTime, oTime, isTopActive;
    if (Game.isLocal) { oTime = Game.clocks.O; pTime = Game.clocks.X; isTopActive = Game.currentPlayer === 'O'; } 
    else { pTime = Game.clocks[mySymbol]; const oSymbol = mySymbol === 'X' ? 'O' : 'X'; oTime = Game.clocks[oSymbol]; isTopActive = Game.currentPlayer !== mySymbol; }
    document.getElementById('time-bottom-val').innerText = fmt(pTime); document.getElementById('time-top-val').innerText = fmt(oTime);
    document.getElementById('timer-top').className = `timer-box ${isTopActive ? 'timer-active' : 'timer-inactive'}`;
    document.getElementById('timer-bottom').className = `timer-box ${!isTopActive ? 'timer-active' : 'timer-inactive'}`;
}

function render() {
    updateClockUI();
    const container = document.getElementById('main-grid');
    container.innerHTML = '';
    const isMyTurn = Game.isLocal || Game.currentPlayer === mySymbol;
    const turnInd = document.getElementById('turn-indicator');
    
    if (Game.winner) {
        if (Game.isLocal) { turnInd.innerText = Game.winner === 'Draw' ? "Draw" : `${Game.winner === 'X' ? 'Red' : 'Yellow'} wins!`; } 
        else { const isIWin = Game.winner === mySymbol; turnInd.innerText = Game.winner === 'Draw' ? "Draw" : (isIWin ? "Victory!" : "Defeat"); }
        turnInd.style.color = '#4285F4'; turnInd.style.fontSize = '24px'; turnInd.style.fontWeight = '700';
    } else {
        if (Game.isLocal) { turnInd.innerText = `${Game.currentPlayer === 'X' ? 'Red' : 'Yellow'}'s turn`; } 
        else { turnInd.innerText = isMyTurn ? "Your turn" : "Opponent's turn"; }
        turnInd.style.color = '#5f6368'; turnInd.style.fontSize = '18px'; turnInd.style.fontWeight = '500';
    }

    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        const col = i % 7;
        cell.onclick = () => { if (isMyTurn && Game.makeMove(col)) { if (!Game.isLocal && conn) conn.send({ type: 'MOVE', col: col }); render(); } };
        const val = Game.board[i];
        if (val) {
            const token = document.createElement('div');
            const isNew = i === Game.lastMoveIdx;
            token.className = `token ${val === 'X' ? 'token-x' : 'token-o'} ${isNew ? 'token-new' : ''}`;
            cell.appendChild(token);
        }
        container.appendChild(cell);
    }
}

async function copyId() {
    const input = document.getElementById('my-id');
    const btn = document.getElementById('copy-btn');
    try {
        await navigator.clipboard.writeText(input.value);
        btn.innerText = "Done!";
        setTimeout(() => { btn.innerText = "Copy"; }, 1500);
    } catch (err) {
        input.select();
        document.execCommand('copy');
    }
}

window.onload = updateSliderLabels;