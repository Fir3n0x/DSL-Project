// Noms par défaut (peuvent être remplacés dynamiquement)
let blackName = document.body.dataset.black || "Alice";
let whiteName = document.body.dataset.white || "Bob";

// Sauvegarde de la configuration initiale du plateau
let initialBoardState = null;

// Variable pour tracker l'état de la session de jeu
let gameSessionActive = false;

function getPlayerNames() {
    return { black: 'Alice', white: 'Bob' };
}

/**
 * Met à jour les noms des joueurs affichés
 */
function updatePlayerNames() {
    const names = getPlayerNames();
    blackName = names.black;
    whiteName = names.white;
}

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
let aiDepth = 3; // Profondeur par défaut (pour mode IA unique)
let aiDepthBlack = 3; // Profondeur pour joueur noir en mode IA vs IA
let aiDepthWhite = 3; // Profondeur pour joueur blanc en mode IA vs IA
let aiSpeed = 500; // valeur par défaut

/**
 * Notifie le backend qu'une nouvelle partie commence
 */
async function notifyGameStart() {
    const mode = getGameMode();
    
    // On notifie le backend pour tous les modes qui utilisent le LLM
    const llmModes = ['llm', 'ai-llm', 'llm-llm'];
    if (!llmModes.includes(mode)) {
        gameSessionActive = false;
        return;
    }
    
    // Déterminer le mode de jeu pour les logs
    let gameMode = 'human_vs_llm';
    if (mode === 'ai-llm') gameMode = 'ai_vs_llm';
    else if (mode === 'llm-llm') gameMode = 'llm_vs_llm';
    
    try {
        const response = await fetch('http://127.0.0.1:5000/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_mode: gameMode })
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

// Fonction pour sauvegarder l'état initial du plateau
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

// Fonction pour réinitialiser le plateau à son état initial
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
    
    // Mettre à jour les noms des joueurs selon le mode
    updatePlayerNames();
    
    // Mettre à jour l'affichage
    updateGameInfo();
    
    // Notifier le backend qu'une nouvelle partie commence
    await notifyGameStart();
}

// Écouter les changements du slider de difficulté
document.addEventListener('DOMContentLoaded', () => {
    // Mettre à jour les noms des joueurs au chargement
    updatePlayerNames();
    
    // Notifier le backend au chargement de la page (nouvelle partie)
    notifyGameStart();
    
    loadYouTubeAPI();
    
    // Sauvegarder l'état initial du plateau au chargement
    saveInitialBoardState();
    
    // Slider de difficulté pour mode IA unique (Humain vs IA / LLM)
    const difficultySlider = document.getElementById('aiDifficulty');
    const difficultyDisplay = document.getElementById('difficultyDisplay');
    const depthDisplay = document.getElementById('depthDisplay');
    
    difficultySlider.addEventListener('input', (e) => {
        aiDepth = parseInt(e.target.value);
        difficultyDisplay.textContent = aiDepth;
        depthDisplay.textContent = aiDepth;
    });
    
    // Slider de difficulté pour joueur noir (mode IA vs IA)
    const difficultySliderBlack = document.getElementById('aiDifficultyBlack');
    const difficultyDisplayBlack = document.getElementById('difficultyDisplayBlack');
    const depthDisplayBlack = document.getElementById('depthDisplayBlack');
    
    difficultySliderBlack.addEventListener('input', (e) => {
        aiDepthBlack = parseInt(e.target.value);
        difficultyDisplayBlack.textContent = aiDepthBlack;
        depthDisplayBlack.textContent = aiDepthBlack;
    });
    
    // Slider de difficulté pour joueur blanc (mode IA vs IA)
    const difficultySliderWhite = document.getElementById('aiDifficultyWhite');
    const difficultyDisplayWhite = document.getElementById('difficultyDisplayWhite');
    const depthDisplayWhite = document.getElementById('depthDisplayWhite');
    
    difficultySliderWhite.addEventListener('input', (e) => {
        aiDepthWhite = parseInt(e.target.value);
        difficultyDisplayWhite.textContent = aiDepthWhite;
        depthDisplayWhite.textContent = aiDepthWhite;
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
            
            // Si un mode automatique est sélectionné, démarrer la boucle
            const autoModes = ['ai-ai', 'ai-llm', 'llm-llm'];
            if (autoModes.includes(radio.value) && radio.checked) {
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
    const singleDifficultySlider = document.getElementById('singleDifficultySlider');
    const blackDifficultySlider = document.getElementById('blackDifficultySlider');
    const whiteDifficultySlider = document.getElementById('whiteDifficultySlider');
    
    // Déterminer quels contrôles afficher selon le mode
    const needsSpeedControl = ['ai', 'ai-ai', 'ai-llm'];
    if (speedSlider) {
        speedSlider.style.display = needsSpeedControl.includes(mode) ? 'block' : 'none';
    }
    
    if (mode === 'human' || mode === 'llm' || mode === 'llm-llm') {
        // Pas d'IA Minimax du tout
        if (singleDifficultySlider) singleDifficultySlider.style.display = 'none';
        if (blackDifficultySlider) blackDifficultySlider.style.display = 'none';
        if (whiteDifficultySlider) whiteDifficultySlider.style.display = 'none';
    } else if (mode === 'ai-ai') {
        // Deux IA Minimax : sliders séparés pour chaque joueur
        if (singleDifficultySlider) singleDifficultySlider.style.display = 'none';
        if (blackDifficultySlider) blackDifficultySlider.style.display = 'block';
        if (whiteDifficultySlider) whiteDifficultySlider.style.display = 'block';
    } else if (mode === 'ai-llm') {
        // IA vs LLM : slider unique pour l'IA (noir)
        if (singleDifficultySlider) singleDifficultySlider.style.display = 'block';
        if (blackDifficultySlider) blackDifficultySlider.style.display = 'none';
        if (whiteDifficultySlider) whiteDifficultySlider.style.display = 'none';
    } else if (mode === 'ai') {
        // Humain vs IA : slider unique pour l'IA (blanc)
        if (singleDifficultySlider) singleDifficultySlider.style.display = 'block';
        if (blackDifficultySlider) blackDifficultySlider.style.display = 'none';
        if (whiteDifficultySlider) whiteDifficultySlider.style.display = 'none';
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
        case 'ai-llm':
            mode = '⚔️ IA vs LLM';
            break;
        case 'llm-llm':
            mode = '🧠🧠 LLM vs LLM';
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
        
        // Modes automatiques (les joueurs passent automatiquement)
        const autoModes = ['ai-ai', 'ai-llm', 'llm-llm'];
        const isAutoMode = autoModes.includes(mode);
        
        // Modes où le joueur blanc est contrôlé par l'IA/LLM
        const whiteIsAI = ['ai', 'llm', 'ai-ai', 'ai-llm', 'llm-llm'].includes(mode);
        const isAiTurn = whiteIsAI && currentPlayer === 'white';
        
        // Modes où le joueur noir est contrôlé par l'IA/LLM
        const blackIsAI = ['ai-ai', 'ai-llm', 'llm-llm'].includes(mode);
        const isBlackAiTurn = blackIsAI && currentPlayer === 'black';
        
        if (isAutoMode || isAiTurn || isBlackAiTurn) {
            // Passage automatique du tour pour les IA/LLM
            passTurnBtn.style.display = 'none';
            console.log(`${currentPlayer} (automatique) ne peut pas jouer, passage du tour`);
            
            setTimeout(() => {
                currentPlayer = opponent;
                updateGameInfo();
                
                // Relancer le tour si nécessaire
                if (isAutoMode || (whiteIsAI && currentPlayer === 'white') || (blackIsAI && currentPlayer === 'black')) {
                    setTimeout(sendStateToAI, aiSpeed);
                }
            }, 1000);
        } else {
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
    const autoModes = ['ai-ai', 'ai-llm', 'llm-llm'];
    const whiteIsAI = ['ai', 'llm', 'ai-ai', 'ai-llm', 'llm-llm'].includes(mode);
    
    if (autoModes.includes(mode) || (whiteIsAI && currentPlayer === 'white')) {
        setTimeout(sendStateToAI, aiSpeed);
    }
}

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
    let winnerForBackend;
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
            'QPW3XwBoQlw', 
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
        "Subway Surfers",
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
                
                // Modes où l'humain ne peut jamais jouer
                const autoOnlyModes = ['ai-ai', 'ai-llm', 'llm-llm'];
                if (autoOnlyModes.includes(mode)) {
                    console.log("Mode automatique, l'humain ne peut pas jouer.");
                    return;
                }
                
                // Modes où l'humain joue les noirs (blanc = IA/LLM)
                const humanBlackModes = ['ai', 'llm'];
                if (humanBlackModes.includes(mode) && currentPlayer === 'white') {
                    console.log("C'est au tour de l'IA/LLM. Vous ne pouvez pas jouer.");
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
                
                // Si mode IA ou LLM et c'est le tour de l'IA/LLM
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
    const board = getBoardState();
    
    // Déterminer le type d'IA en fonction du mode et du joueur
    let aiType;
    
    if (mode === 'ai-llm') {
        // IA vs LLM: noir = minimax, blanc = llm
        aiType = currentPlayer === 'black' ? 'minimax' : 'llm';
    } else if (mode === 'llm-llm') {
        // LLM vs LLM: les deux jouent avec le LLM
        aiType = 'llm';
    } else if (mode === 'llm') {
        // Humain vs LLM: blanc joue avec le LLM
        aiType = 'llm';
    } else {
        // Par défaut (ai, ai-ai): utiliser minimax
        aiType = 'minimax';
    }
    
    // Déterminer la depth à utiliser selon le mode et le joueur
    let currentDepth = aiDepth;
    if (mode === 'ai-ai') {
        currentDepth = (currentPlayer === 'black') ? aiDepthBlack : aiDepthWhite;
    }
    
    const payload = {
        board: board,
        player: currentPlayer,
        depth: currentDepth,
        aiType: aiType
    };
    
    console.log(`Envoi requête: ${currentPlayer} joue avec ${aiType}`);
    
    fetch('http://127.0.0.1:5000/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        console.log('Réponse IA:', data);
        
        // Vérifier si l'IA peut jouer
        if (!data.canPlay || !data.move) {
            console.log(`${currentPlayer} ne peut pas jouer. Passage du tour.`);
            isWaitingForAI = false;
            
            // Afficher un message temporaire
            const turnPlayerElem = document.getElementById('turnPlayer');
            const originalText = turnPlayerElem.textContent;
            const playerSymbol = currentPlayer === 'black' ? '⚫' : '⚪';
            const playerName = currentPlayer === 'black' ? blackName : whiteName;
            turnPlayerElem.textContent = `${playerSymbol} ${playerName} passe son tour (aucun coup valide)`;
            
            // Passer au joueur suivant après un délai
            setTimeout(() => {
                currentPlayer = getOpponent(currentPlayer);
                updateGameInfo();
                
                // Si mode IA vs IA, continuer avec l'autre IA
                if (getGameMode() === "ai-ai") {
                    setTimeout(sendStateToAI, aiSpeed);
                }
            }, 1500);
            return;
        }
        
        if (data.move && Array.isArray(data.move) && data.move.length === 2) {
            const [row, col] = data.move;
            playAIMove(row, col);
        }
        isWaitingForAI = false;

        // Relancer automatiquement pour les modes auto
        const autoModes = ['ai-ai', 'ai-llm', 'llm-llm'];
        if (autoModes.includes(mode)) {
            setTimeout(sendStateToAI, aiSpeed);
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