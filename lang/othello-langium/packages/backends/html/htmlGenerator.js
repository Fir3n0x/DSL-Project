const blackName = document.body.dataset.black;
const whiteName = document.body.dataset.white;

// Sauvegarde de la configuration initiale du plateau
let initialBoardState = null;
let gameSessionActive = false;

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark');
    body.classList.toggle('light');
}

// --- Othello Game Logic ---
let currentPlayer = 'black';
let isWaitingForAI = false;
let moveCount = 0;
let lastMove = null;
let videoVisible = false;
let aiDepth = 3; // Profondeur par défaut
let aiSpeed = 500; // valeur par défaut

/**
 * Notifie le backend qu'une nouvelle partie commence
 */
async function notifyGameStart() {
    const mode = getGameMode();
    
    // On ne notifie le backend que pour le mode LLM
    if (mode !== 'llm') {
        gameSessionActive = false;
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_mode: 'human_vs_llm' })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            console.log('Nouvelle session de jeu créée:', data.session_id);
            gameSessionActive = true;
        }
    } catch (error) {
        console.error('Erreur lors de la création de session:', error);
        gameSessionActive = false;
    }
}

/**
 * Notifie le backend qu'une partie est terminée
 */
async function notifyGameEnd(winner, finalScores) {
    // On ne notifie que si une session est active
    if (!gameSessionActive) {
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/end_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner: winner,
                final_scores: finalScores
            })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            console.log('Partie terminée et sauvegardée:', data.log_path);
        }
        gameSessionActive = false;
    } catch (error) {
        console.error('Erreur lors de la finalisation de session:', error);
    }
}

// Sauvegarder l'état initial du plateau
function saveInitialBoardState() {
    const table = document.querySelector('table');
    if (!table) return;
    
    const rows = table.rows.length;
    const cols = table.rows[0].cells.length;
    initialBoardState = [];
    
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = table.rows[r].cells[c];
            if (cell.classList.contains('hidden')) {
                row.push({ type: 'hidden' });
            } else {
                const piece = cell.querySelector('.piece');
                if (!piece) {
                    row.push({ type: 'empty' });
                } else if (piece.classList.contains('black')) {
                    row.push({ type: 'black' });
                } else if (piece.classList.contains('white')) {
                    row.push({ type: 'white' });
                }
            }
        }
        initialBoardState.push(row);
    }
}

// Réinitialiser le plateau à son état initial
async function resetBoard() {
    if (!initialBoardState) return;
    
    const table = document.querySelector('table');
    if (!table) return;
    
    // Réinitialiser toutes les variables de jeu
    currentPlayer = 'black';
    isWaitingForAI = false;
    moveCount = 0;
    lastMove = null;
    
    // Cacher le bouton "passer son tour" s'il est visible
    const passTurnBtn = document.getElementById('passTurnBtn');
    if (passTurnBtn) {
        passTurnBtn.style.display = 'none';
    }
    
    // Cacher l'écran de fin de partie s'il est visible
    const gameOverDiv = document.getElementById('gameOver');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'none';
    }
    
    // Restaurer l'état initial du plateau
    for (let r = 0; r < initialBoardState.length; r++) {
        for (let c = 0; c < initialBoardState[r].length; c++) {
            const cell = table.rows[r].cells[c];
            const cellState = initialBoardState[r][c];
            
            // Supprimer toutes les pièces existantes
            const existingPiece = cell.querySelector('.piece');
            if (existingPiece) {
                existingPiece.remove();
            }
            
            // Restaurer l'état initial
            if (cellState.type === 'black') {
                const piece = document.createElement('div');
                piece.className = 'piece black';
                cell.appendChild(piece);
            } else if (cellState.type === 'white') {
                const piece = document.createElement('div');
                piece.className = 'piece white';
                cell.appendChild(piece);
            }
        }
    }
    
    // Mettre à jour l'affichage
    updateGameInfo();
    
    // Notifier le backend qu'une nouvelle partie commence
    await notifyGameStart();
}

// Écouter les changements du slider de difficulté
document.addEventListener('DOMContentLoaded', () => {
    // Notifier le backend au chargement de la page (nouvelle partie)
    notifyGameStart();
    
    loadYouTubeAPI();
    
    // Sauvegarder l'état initial du plateau au chargement
    saveInitialBoardState();
    
    const difficultySlider = document.getElementById('aiDifficulty');
    const difficultyDisplay = document.getElementById('difficultyDisplay');
    const depthDisplay = document.getElementById('depthDisplay');
    
    difficultySlider.addEventListener('input', (e) => {
        aiDepth = parseInt(e.target.value);
        difficultyDisplay.textContent = aiDepth;
        depthDisplay.textContent = aiDepth;
    });

    const speedSlider = document.getElementById('aiSpeed');
    const speedDisplay = document.getElementById('speedDisplay');

    speedSlider.addEventListener('input', (e) => {
        aiSpeed = parseInt(e.target.value);
        speedDisplay.textContent = aiSpeed;
    });

    // Écouter les changements de mode de jeu
    document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
        radio.addEventListener('change', async () => {
            // Réinitialiser le plateau à chaque changement de mode
            await resetBoard();
            
            // Si le mode est IA vs IA, démarrer la boucle
            if (radio.value === "ai-ai" && radio.checked) {
                setTimeout(() => {
                    sendStateToAI();
                }, 1000);
            }
        });
    });
});

function getGameMode() {
    return document.querySelector('input[name="gameMode"]:checked').value;
}

function getOpponent(player) {
    return player === 'black' ? 'white' : 'black';
}

function flipPieceWithAnimation(piece, newColor) {
    // Empêcher les animations multiples
    if (piece.classList.contains('flipping')) {
        return;
    }
    
    piece.classList.add('flipping');
    
    // Changer la couleur à mi-animation (quand la pièce est de profil)
    setTimeout(() => {
        piece.classList.remove('black', 'white');
        piece.classList.add(newColor);
    }, 300);
    
    // Retirer la classe d'animation après
    setTimeout(() => {
        piece.classList.remove('flipping');
    }, 600);
}

function updateControlsVisibility() {
    const mode = getGameMode();
    const speedSlider = document.querySelector('.speed-slider');
    const difficultySlider = document.querySelector('.difficulty-slider');
    
    // On cache tout par défaut si c'est "Humain vs Humain"
    if (mode === 'human' || mode === 'llm') {
        if (speedSlider) speedSlider.style.display = 'none';
        if (difficultySlider) difficultySlider.style.display = 'none';
    } else {
        // Pour les modes IA (Minimax) et IA vs IA
        if (difficultySlider) difficultySlider.style.display = 'block';
        
        // La vitesse n'est pertinente que pour le mode "IA vs IA" (vitesse de l'animation)
        if (speedSlider) speedSlider.style.display = (mode === 'ai-ai' || mode === 'ai') ? 'block' : 'none';
    }
}

function updateGameInfo() {
    updateControlsVisibility();
    // Mise à jour du tour actuel
    const turnPlayer = document.getElementById('turnPlayer');
    const playerName = currentPlayer === 'black' ? blackName : whiteName;
    const playerSymbol = currentPlayer === 'black' ? '⚫' : '⚪';
    turnPlayer.textContent = playerSymbol + ' ' + playerName;
    
    // Mise à jour des scores
    const table = document.querySelector('table');
    let blackCount = 0, whiteCount = 0;
    for (let r = 0; r < table.rows.length; r++) {
        for (let c = 0; c < table.rows[r].cells.length; c++) {
            const cell = table.rows[r].cells[c];
            const piece = cell.querySelector('.piece');
            if (piece) {
                if (piece.classList.contains('black')) blackCount++;
                else if (piece.classList.contains('white')) whiteCount++;
            }
        }
    }
    document.getElementById('blackScore').textContent = blackCount;
    document.getElementById('whiteScore').textContent = whiteCount;
    
    // Mise à jour du dernier coup
    if (lastMove) {
        const [r, c] = lastMove.position;
        const moveSymbol = lastMove.player === 'black' ? '⚫' : '⚪';
        document.getElementById('lastMove').textContent = 
            moveSymbol + ' → Ligne ' + (r + 1) + ', Colonne ' + (c + 1);
    } else {
        document.getElementById('lastMove').textContent = '-';
    }
    
    // Mise à jour du nombre de coups
    document.getElementById('moveCount').textContent = moveCount;
    
    // Mise à jour du mode de jeu
    let mode;
    switch (getGameMode()) {
        case 'ai':
            mode = '🤖 Humain vs IA';
            break;
        case 'ai-ai':
            mode = '🦾 IA vs IA';
            break;
        case 'llm':
            mode = '🧠 Humain vs LLM';
            break;
        default:
            mode = '👥 Humain vs Humain';
    }
    document.getElementById('gameModeDisplay').textContent = mode;
    
    // Vérifier si le joueur actuel peut jouer
    checkIfPlayerCanMove();
}

function checkIfPlayerCanMove() {
    const table = document.querySelector('table');
    if (!table) return;
    
    const rows = table.rows.length;
    const cols = table.rows[0].cells.length;
    let hasValidMove = false;
    
    function getCell(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
        return table.rows[r].cells[c];
    }
    
    function getPiece(cell) {
        if (!cell) return null;
        const piece = cell.querySelector('.piece');
        if (!piece) return null;
        if (piece.classList.contains('black')) return 'black';
        if (piece.classList.contains('white')) return 'white';
        return null;
    }
    
    function validMove(r, c, player) {
        if (getPiece(getCell(r, c))) return false;
        const directions = [
            [0,1], [1,0], [0,-1], [-1,0],
            [1,1], [1,-1], [-1,1], [-1,-1]
        ];
        for (const [dr, dc] of directions) {
            let i = r + dr, j = c + dc, foundOpponent = false;
            while (getCell(i, j) && getPiece(getCell(i, j)) === getOpponent(player)) {
                foundOpponent = true;
                i += dr; j += dc;
            }
            if (foundOpponent && getCell(i, j) && getPiece(getCell(i, j)) === player) {
                return true;
            }
        }
        return false;
    }
    
    // Vérifier si le joueur actuel peut jouer
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = getCell(r, c);
            if (!cell || cell.classList.contains('hidden')) continue;
            if (validMove(r, c, currentPlayer)) {
                hasValidMove = true;
                break;
            }
        }
        if (hasValidMove) break;
    }
    
    // Si le joueur actuel ne peut pas jouer, vérifier l'adversaire
    if (!hasValidMove) {
        let opponentCanMove = false;
        const opponent = getOpponent(currentPlayer);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = getCell(r, c);
                if (!cell || cell.classList.contains('hidden')) continue;
                if (validMove(r, c, opponent)) {
                    opponentCanMove = true;
                    break;
                }
            }
            if (opponentCanMove) break;
        }
        
        // Si aucun des deux ne peut jouer, fin de partie
        if (!opponentCanMove) {
            console.log('Aucun joueur ne peut jouer, fin de partie');
            endGame();
            return;
        }
        
        // Déterminer qui doit passer son tour
        const mode = getGameMode();
        const passTurnBtn = document.getElementById('passTurnBtn');
        const isAiOrLlm = (mode === 'ai' || mode === 'llm');
        const isAiTurn = isAiOrLlm && currentPlayer === 'white';
        const isHumanTurn = mode === 'human' || (isAiOrLlm && currentPlayer === 'black');
        
        if (isAiTurn) {
            // L'IA/LLM ne peut pas jouer, passer automatiquement
            passTurnBtn.style.display = 'none';
            console.log(`${mode.toUpperCase()} (${currentPlayer}) ne peut pas jouer, passage automatique du tour`);
            
            setTimeout(() => {
                currentPlayer = opponent;
                updateGameInfo();
                
                // Si c'est toujours au tour de l'IA après le passage, la laisser jouer
                if (mode === 'ai' && currentPlayer === 'white') {
                    makeAiMove();
                } else if (mode === 'llm' && currentPlayer === 'white') {
                    makeLlmMove();
                }
            }, 1000);
        } else if (isHumanTurn) {
            // Le joueur humain ne peut pas jouer, afficher le bouton
            passTurnBtn.style.display = 'inline-block';
            console.log(`Joueur ${currentPlayer} ne peut pas jouer, cliquez sur "Passer son tour"`);
        }
    } else {
        const passTurnBtn = document.getElementById('passTurnBtn');
        if (passTurnBtn) {
            passTurnBtn.style.display = 'none';
        }
    }
}

function passTurn() {
    console.log(`${currentPlayer} passe son tour`);
    currentPlayer = getOpponent(currentPlayer);
    updateGameInfo();
    
    // Si c'est le tour de l'IA après avoir passé, la faire jouer
    const mode = getGameMode();
    if ((mode === 'ai' || mode === 'llm') && currentPlayer === 'white') {
        setTimeout(sendStateToAI, 500);
    } else if (mode === 'ai-ai') {
        setTimeout(sendStateToAI, aiSpeed);
    }
}

// Fonction endGame pour notifier le backend
async function endGame() {
    const table = document.querySelector('table');
    let blackCount = 0, whiteCount = 0;
    
    for (let r = 0; r < table.rows.length; r++) {
        for (let c = 0; c < table.rows[r].cells.length; c++) {
            const cell = table.rows[r].cells[c];
            const piece = cell.querySelector('.piece');
            if (piece) {
                if (piece.classList.contains('black')) blackCount++;
                else if (piece.classList.contains('white')) whiteCount++;
            }
        }
    }
    
    let winner;
    let winnerForBackend; // Format pour le backend
    if (blackCount > whiteCount) {
        winner = `⚫ ${blackName} gagne !`;
        winnerForBackend = 'black';
    } else if (whiteCount > blackCount) {
        winner = `⚪ ${whiteName} gagne !`;
        winnerForBackend = 'white';
    } else {
        winner = '🤝 Match nul !';
        winnerForBackend = 'draw';
    }
    
    document.getElementById('finalScore').innerHTML = `
        ${winner}<br>
        ⚫ ${blackName}: ${blackCount}<br>
        ⚪ ${whiteName}: ${whiteCount}
    `;
    
    const gameOverDiv = document.getElementById('gameOver');
    gameOverDiv.style.display = 'block';
    
    // Notifier le backend de la fin de partie
    await notifyGameEnd(winnerForBackend, {
        black: blackCount,
        white: whiteCount
    });
    
    // Animation de confettis
    for (let i = 0; i < 50; i++) {
        setTimeout(() => createConfetti(), i * 30);
    }
}

function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)];
    confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
}

// --- YouTube API ---
let player;
let videoIds = [];
let currentVideoIndex = 0;

function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube API prête !');
};

function toggleSecretVideo() {
    const videoSection = document.getElementById('videoSection');
    const videoContainer = document.getElementById('videoContainer');
    const videoTitle = document.querySelector('.video-title');
    
    if (!videoVisible) {
        videoIds = [
            'X8avbciUP3c', 
            'KQ6zr6kCPj8', 
            'yCmWOZ81njQ'
        ];
        
        currentVideoIndex = Math.floor(Math.random() * videoIds.length);
        
        videoSection.classList.add('show');
        videoVisible = true;
        
        if (!player) {
            player = new YT.Player('videoContainer', {
                height: '100%',
                width: '100%',
                videoId: videoIds[currentVideoIndex],
                playerVars: {
                    'autoplay': 1,
                    'controls': 1
                },
                events: {
                    'onStateChange': onPlayerStateChange
                }
            });
        } else {
            player.loadVideoById(videoIds[currentVideoIndex]);
        }
        
        videoTitle.textContent = getVideoTitle(currentVideoIndex);
        
    } else {
        if (player) {
            player.stopVideo();
        }
        videoSection.classList.remove('show');
        videoVisible = false;
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        currentVideoIndex = (currentVideoIndex + 1) % videoIds.length;
        player.loadVideoById(videoIds[currentVideoIndex]);
        
        const videoTitle = document.querySelector('.video-title');
        videoTitle.textContent = getVideoTitle(currentVideoIndex);
    }
}

function getVideoTitle(index) {
    const titles = [
        "🎵 Rick Astley - Never Gonna Give You Up",
        "🎵 Darude - Sandstorm",
        "🎵 Toto - Africa"
    ];
    return titles[index];
}

// --- Initialisation du plateau ---
document.addEventListener('DOMContentLoaded', () => {
    const table = document.querySelector('table');
    const rows = table.rows.length;
    const cols = table.rows[0].cells.length;
    function getCell(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
        return table.rows[r].cells[c];
    }
    function getPiece(cell) {
        if (!cell) return null;
        const piece = cell.querySelector('.piece');
        if (!piece) return null;
        if (piece.classList.contains('black')) return 'black';
        if (piece.classList.contains('white')) return 'white';
        return null;
    }
    const directions = [
        [0,1], [1,0], [0,-1], [-1,0],
        [1,1], [1,-1], [-1,1], [-1,-1]
    ];
    function validMove(r, c, player) {
        if (getPiece(getCell(r, c))) return false;
        for (const [dr, dc] of directions) {
            let i = r + dr, j = c + dc, foundOpponent = false;
            while (getCell(i, j) && getPiece(getCell(i, j)) === getOpponent(player)) {
                foundOpponent = true;
                i += dr; j += dc;
            }
            if (foundOpponent && getCell(i, j) && getPiece(getCell(i, j)) === player) {
                return true;
            }
        }
        return false;
    }
    function flipPieces(r, c, player) {
        const directions = [
            [0,1], [1,0], [0,-1], [-1,0],
            [1,1], [1,-1], [-1,1], [-1,-1]
        ];
        for (const [dr, dc] of directions) {
            let i = r + dr, j = c + dc, path = [];
            while (table.rows[i]?.cells[j] && getPiece(table.rows[i].cells[j]) === getOpponent(player)) {
                path.push([i, j]);
                i += dr; j += dc;
            }
            if (path.length && table.rows[i]?.cells[j] && getPiece(table.rows[i].cells[j]) === player) {
                for (const [x, y] of path) {
                    const cell = table.rows[x].cells[y];
                    const piece = cell.querySelector('.piece');
                    if (piece) {
                        flipPieceWithAnimation(piece, player);
                    }
                }
            }
        }
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = getCell(r, c);
            if (!cell || cell.classList.contains('hidden')) continue;
            cell.addEventListener('click', () => {   
                const mode = getGameMode();             
                // Si c'est le tour de l'IA (en mode "ai" ou "llm"), on ne fait rien
                if ((mode === 'ai' || mode === 'llm') && currentPlayer === 'white') {
                    console.log("C'est au tour de l'IA. Vous ne pouvez pas jouer.");
                    return;
                }
                
                // Si on est en mode "IA vs IA", l'humain ne doit jamais pouvoir cliquer
                if (mode === 'ai-ai') {
                    return;
                }

                if (!validMove(r, c, currentPlayer)) return;
                if (getPiece(cell)) return;
                const piece = document.createElement('div');
                piece.className = 'piece ' + currentPlayer;
                cell.appendChild(piece);
                flipPieces(r, c, currentPlayer);
                
                lastMove = { player: currentPlayer, position: [r, c] };
                moveCount++;
                
                currentPlayer = getOpponent(currentPlayer);
                updateGameInfo();
                
                // Si mode IA ou LLM et c'est le tour de l'IA
                if ((mode === 'ai' || mode === 'llm') && currentPlayer === 'white') {
                    setTimeout(sendStateToAI, 500);
                }
            });
        }
    }
    
    // Initialiser l'affichage
    updateGameInfo();
});

function getBoardState() {
    const table = document.querySelector('table');
    if (!table) return [];
    const rows = table.rows.length;
    const cols = table.rows[0].cells.length;
    const state = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = table.rows[r].cells[c];
            if (!cell || cell.classList.contains('hidden')) {
                row.push('wall');
            } else {
                const piece = cell.querySelector('.piece');
                if (!piece) row.push(null);
                else if (piece.classList.contains('black')) row.push('black');
                else if (piece.classList.contains('white')) row.push('white');
                else row.push(null);
            }
        }
        state.push(row);
    }
    return state;
}

function sendStateToAI() {
    if (isWaitingForAI) return;
    isWaitingForAI = true;

    const mode = getGameMode();
    // Si le mode est 'llm', on envoie 'llm', sinon 'minimax' par défaut
    const aiType = (mode === 'llm') ? 'llm' : 'minimax';

    const board = getBoardState();
    const payload = {
        board: board,
        player: currentPlayer,
        depth: aiDepth, // Ajouter la profondeur au payload
        aiType: aiType // IA ou LLM
    };
    
    fetch('http://127.0.0.1:5000/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        console.log('Réponse IA:', data);
        if (data.move && Array.isArray(data.move) && data.move.length === 2) {
            const [row, col] = data.move;
            playAIMove(row, col);
        }
        isWaitingForAI = false;

        // Si mode IA vs IA, relancer automatiquement
        if (getGameMode() === "ai-ai") {
            setTimeout(sendStateToAI, aiSpeed); // délai pour voir l'animation
        }
    })
    .catch(err => {
        console.error('Erreur IA:', err);
        isWaitingForAI = false;
    });
}

function playAIMove(r, c) {
    const table = document.querySelector('table');
    if (!table) return;
    
    const cell = table.rows[r].cells[c];
    if (!cell || cell.classList.contains('hidden')) return;
    
    function getPiece(cell) {
        if (!cell) return null;
        const piece = cell.querySelector('.piece');
        if (!piece) return null;
        if (piece.classList.contains('black')) return 'black';
        if (piece.classList.contains('white')) return 'white';
        return null;
    }
    
    function validMove(r, c, player) {
        const cell = table.rows[r]?.cells[c];
        if (getPiece(cell)) return false;
        const directions = [
            [0,1], [1,0], [0,-1], [-1,0],
            [1,1], [1,-1], [-1,1], [-1,-1]
        ];
        for (const [dr, dc] of directions) {
            let i = r + dr, j = c + dc, foundOpponent = false;
            while (table.rows[i]?.cells[j] && getPiece(table.rows[i].cells[j]) === getOpponent(player)) {
                foundOpponent = true;
                i += dr; j += dc;
            }
            if (foundOpponent && table.rows[i]?.cells[j] && getPiece(table.rows[i].cells[j]) === player) {
                return true;
            }
        }
        return false;
    }
    
    // Ajouter l'animation de retournement
    function flipPieces(r, c, player) {
        const directions = [
            [0,1], [1,0], [0,-1], [-1,0],
            [1,1], [1,-1], [-1,1], [-1,-1]
        ];
        for (const [dr, dc] of directions) {
            let i = r + dr, j = c + dc, path = [];
            while (table.rows[i]?.cells[j] && getPiece(table.rows[i].cells[j]) === getOpponent(player)) {
                path.push([i, j]);
                i += dr; j += dc;
            }
            if (path.length && table.rows[i]?.cells[j] && getPiece(table.rows[i].cells[j]) === player) {
                for (const [x, y] of path) {
                    const cell = table.rows[x].cells[y];
                    const piece = cell.querySelector('.piece');
                    
                    // Ajouter l'animation de retournement
                    piece.classList.add('flipping');
                    
                    // Changer la couleur à mi-animation
                    setTimeout(() => {
                        piece.className = 'piece flipping ' + player;
                    }, 300);
                    
                    // Retirer la classe d'animation après
                    setTimeout(() => {
                        piece.classList.remove('flipping');
                    }, 600);
                }
            }
        }
    }
    
    if (!validMove(r, c, currentPlayer)) {
        console.error('Coup IA invalide');
        return;
    }
    
    const piece = document.createElement('div');
    piece.className = 'piece ' + currentPlayer;
    cell.appendChild(piece);
    flipPieces(r, c, currentPlayer);
    
    lastMove = { player: currentPlayer, position: [r, c] };
    moveCount++;
    
    currentPlayer = getOpponent(currentPlayer);
    updateGameInfo();
}