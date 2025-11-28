const blackName = document.body.dataset.black;
const whiteName = document.body.dataset.white;

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

// Écouter les changements du slider de difficulté
document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeAPI();
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

    document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === "ai-ai" && radio.checked) {
                sendStateToAI(); // démarrer la boucle IA vs IA
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
            endGame();
            return;
        }
        
        // Sinon, afficher le bouton passer son tour
        const passTurnBtn = document.getElementById('passTurnBtn');
        const mode = getGameMode();
        const isAiTurn = (mode === 'ai' || mode === 'llm') && currentPlayer === 'white';
        const isHumanTurnInAiMode = (mode === 'ai' || mode === 'llm') && currentPlayer === 'black';
        if (mode === 'human') {
            passTurnBtn.style.display = 'inline-block';
        } else if (isHumanTurnInAiMode) {
            // Humain bloqué en mode IA/LLM
            passTurnBtn.style.display = 'inline-block';
        } else if (isAiTurn) {
            // IA bloquée, passer automatiquement
            passTurnBtn.style.display = 'none';
            setTimeout(() => {
                console.log('IA bloquée, passage automatique du tour');
                currentPlayer = getOpponent(currentPlayer);
                updateGameInfo();
            }, 1000);
        }
    } else {
        // Le joueur peut jouer, masquer le bouton
        document.getElementById('passTurnBtn').style.display = 'none';
    }
}

function endGame() {
    // Compter les scores finaux
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
    
    // Déterminer le vainqueur
    let winner = '';
    if (blackCount > whiteCount) {
        winner = `⚫ ${blackName} gagne !`;
    } else if (whiteCount > blackCount) {
        winner = `⚪ ${whiteName} gagne !`;
    } else {
        winner = 'Égalité ! 🤝';
    }
    
    // Afficher l'écran de fin
    const finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = `
        <div>${winner}</div>
        <div style="margin-top: 1em;">
            <b>⚫ ${blackName}:</b> ${blackCount} pions<br>
            <b>⚪ ${whiteName}:</b> ${whiteCount} pions
        </div>
    `;
    
    document.getElementById('gameOver').style.display = 'block';
    
    // Lancer les confettis
    createConfetti();
    
}
// Ajouter une liste de vidéos prédéfinies
const videoUrls = [
"6djc3Cf3bd0",
"BHRTDr6nGa8",
"EvsfYYY_pIQ",
"FOJgWchmd8o",
"-aPw_oYhxHw",
"--owd7CIjYs",
];

let currentVideoIndex = 0; // Index de la vidéo actuellement affichée
let player; // Variable pour le lecteur YouTube
function toggleSecretVideo() {
const videoSection = document.getElementById('videoSection');
const videoContainer = document.getElementById('videoContainer');

if (!videoVisible) {
// Charger et afficher la première vidéo
loadVideo(currentVideoIndex);
videoSection.classList.add('show');
videoVisible = true;
} else {
// Masquer la vidéo
videoSection.classList.remove('show');
videoContainer.innerHTML = '';
videoVisible = false;
}
}
function loadVideo(index) {
const videoContainer = document.getElementById('videoContainer');
const videoId = videoUrls[index];

// Si le lecteur existe déjà, charger une nouvelle vidéo
if (player) {
player.loadVideoById(videoId);
} else {
// Créer un nouveau lecteur YouTube
videoContainer.innerHTML = `<div id="youtubePlayer"></div>`;
player = new YT.Player('youtubePlayer', {
    height: '500',
    width: '280',
    videoId: videoId,
    playerVars: {
        autoplay: 1,
        controls: 1,
        loop: 0,
        modestbranding: 1,
        rel: 0
    },
    events: {
        onStateChange: onPlayerStateChange
    }
});
}
}

function prevVideo() {
currentVideoIndex = (currentVideoIndex - 1 + videoUrls.length) % videoUrls.length;
loadVideo(currentVideoIndex);
}

function nextVideo() {
currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
loadVideo(currentVideoIndex);
}
function onPlayerStateChange(event) {
if (event.data === YT.PlayerState.ENDED) {
nextVideo(); // Passer automatiquement à la vidéo suivante
}
}
function loadYouTubeAPI() {
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff69b4'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `confetti-fall ${(Math.random() * 2 + 3)}s linear forwards`;
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            
            // Formes variées
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 6000);
        }, i * 20);
    }
}

function passTurn() {
    console.log(currentPlayer + ' passe son tour');
    currentPlayer = getOpponent(currentPlayer);
    updateGameInfo();

    const mode = getGameMode();
    // Si mode IA ou LLM et c'est le tour de l'IA
    if ((mode === 'ai' || mode === 'llm') && currentPlayer === 'white') {
        setTimeout(sendStateToAI, 500);
    }
}


window.toggleTheme = toggleTheme;
window.sendStateToAI = sendStateToAI;
window.toggleSecretVideo = toggleSecretVideo;
window.passTurn = passTurn;

// Écouter les changements de mode de jeu
document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
    radio.addEventListener('change', updateGameInfo);
});

const directions = [
    [0,1], [1,0], [0,-1], [-1,0],
    [1,1], [1,-1], [-1,1], [-1,-1]
];
document.addEventListener('DOMContentLoaded', () => {
    const table = document.querySelector('table');
    if (!table) return;
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

        // 🔁 Si mode IA vs IA, relancer automatiquement
        if (getGameMode() === "ai-ai") {
            setTimeout(sendStateToAI, aiSpeed); // délai pour voir l’animation
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

