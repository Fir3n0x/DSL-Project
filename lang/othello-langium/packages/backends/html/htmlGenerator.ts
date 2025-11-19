import type { Game } from '../../language/src/generated/ast.js';

export function renderHTML(model: Game): string {
    const rows = model.board.rows;
    const cols = model.board.columns;

    // --- Thème ---
    const uiTheme = model.ui?.theme?.name?.replace(/['"]/g, '');
    const runtimeThemeParam = model.runTime?.parameters.find(p => p.name === 'Gtheme');
    const runtimeTheme = runtimeThemeParam ? String(runtimeThemeParam.value).replace(/['"]/g, '') : undefined;
    const initialTheme = uiTheme || runtimeTheme || 'light';

    // --- Type de plateau (square ou circle) ---
    const boardTypeParam = model.compileTime?.parameters.find(p => p.name === 'boardType');
    const boardType = boardTypeParam ? String(boardTypeParam.value).replace(/['"]/g, '') : 'square';

    // Rayon pour la forme circulaire
    const radius = Math.min(rows, cols) / 2;

    // --- HTML principal ---
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${model.name}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center; 
            padding: 2em; 
            transition: background 0.3s, color 0.3s;
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        body.light {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }
        body.dark {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #f4f4f4;
        }
        h1 { 
            margin-bottom: 0.5em;
            font-size: 3em;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .info { 
            margin: 1em 0; 
            font-size: 1.3em;
            font-weight: 500;
        }
        .game-container {
            display: flex;
            gap: 3em;
            align-items: flex-start;
            justify-content: center;
            max-width: 1600px;
            margin: 2em auto;
        }
        .video-section {
            width: 280px;
            position: sticky;
            top: 2em;
            display: none;
        }
        .video-section.show {
            display: block;
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .video-container {
            width: 280px;
            height: 500px;
            border-radius: 20px;
            overflow: hidden;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 3px solid rgba(255,215,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .video-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .video-title {
            text-align: center;
            margin-top: 1em;
            font-size: 1.2em;
            font-weight: 600;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .board-section {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        table { 
            margin: 0; 
            border-collapse: collapse; 
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            border-radius: 12px;
            overflow: hidden;
        }
        td { 
            width: 60px; 
            height: 60px; 
            text-align: center; 
            vertical-align: middle; 
            border: 2px solid rgba(0,0,0,0.2);
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }
        body.light td { background: linear-gradient(145deg, #2ecc71, #27ae60); }
        body.dark td { background: linear-gradient(145deg, #1e5128, #145214); }
        td:hover:not(.hidden) { 
            filter: brightness(1.1);
        }
        .hidden {
            background: transparent !important;
            border: none !important;
            cursor: default !important;
        }
        .piece { 
            width: 45px; 
            height: 45px; 
            border-radius: 50%; 
            margin: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            transition: transform 0.3s;
            position: relative;
            transform-style: preserve-3d;
        }
        .piece:hover {
            transform: scale(1.1);
        }
        .piece.flipping {
            animation: flip 0.6s ease-in-out;
        }
        @keyframes flip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(90deg); }
            100% { transform: rotateY(180deg); }
        }
        .black { 
            background: radial-gradient(circle at 30% 30%, #333, #000);
        }
        .white { 
            background: radial-gradient(circle at 30% 30%, #fff, #ddd);
            border: 2px solid #000; 
        }
        .rules { 
            margin-top: 2em; 
            padding: 1.5em; 
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        .toggle-btn {
            padding: 0.7em 1.5em;
            margin: 0.5em;
            cursor: pointer;
            border: none;
            border-radius: 25px;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            color: #fff;
            font-weight: 600;
            font-size: 1em;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .toggle-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        }
        .game-info {
            margin: 0;
            padding: 2em;
            width: 350px;
            border: none;
            border-radius: 20px;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            position: sticky;
            top: 2em;
        }
        .game-info h3 {
            margin-top: 0;
            font-size: 1.8em;
            font-weight: 700;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 0.8em 0;
            padding: 0.8em 1.2em;
            border-radius: 12px;
            background: rgba(255,255,255,0.1);
            font-size: 1.1em;
        }
        .current-turn {
            font-weight: bold;
            font-size: 1.4em;
            padding: 1em;
            border-radius: 12px;
            background: rgba(46, 204, 113, 0.3);
            margin-bottom: 1em;
        }
        .last-move {
            font-style: italic;
            opacity: 0.9;
        }
        .pass-turn-btn {
            padding: 1em 2em;
            margin: 1em 0;
            cursor: pointer;
            border: none;
            border-radius: 25px;
            background: linear-gradient(135deg, #ff9800, #ff5722);
            color: #fff;
            font-weight: bold;
            font-size: 1.2em;
            display: none;
            box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
            transition: all 0.3s;
            width: 100%;
        }
        .pass-turn-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(255, 152, 0, 0.6);
        }
        .game-over {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3em 4em;
            border-radius: 24px;
            text-align: center;
            z-index: 1001;
            display: none;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.6);
            border: 3px solid rgba(255, 215, 0, 0.5);
            backdrop-filter: blur(20px);
        }
        .game-over h2 {
            font-size: 3em;
            margin: 0.3em 0;
            color: #ffd700;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
            animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .game-over .final-score {
            font-size: 1.6em;
            margin: 1.5em 0;
            line-height: 1.8;
        }
        .game-over .toggle-btn {
            margin-top: 1em;
            background: rgba(255,255,255,0.3);
            font-size: 1.1em;
        }
        .confetti {
            position: fixed;
            width: 12px;
            height: 12px;
            z-index: 1000;
            pointer-events: none;
        }
        @keyframes confetti-fall {
            0% {
                transform: translateY(-100px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        input[type="radio"] {
            margin: 0 0.5em;
            cursor: pointer;
            transform: scale(1.3);
        }
        label {
            margin: 0 1em;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.2s;
        }
        label:hover {
            transform: scale(1.05);
        }
        .controls {
            display: flex;
            flex-direction: column;
            gap: 1em;
            margin-top: 1em;
        }
        @media (max-width: 1200px) {
            .game-container {
                flex-direction: column;
                align-items: center;
            }
            .video-section {
                width: 100%;
                max-width: 280px;
                position: static;
            }
            .game-info {
                width: 100%;
                max-width: 600px;
                position: static;
            }
        }
    </style>
</head>

<body class="${initialTheme}">
    <h1>${model.name}</h1>
    <p class="info">Jouez à l'Othello ! Retournez les pièces adverses.</p>
    
    <div style="margin: 1em 0;">
        <button class="toggle-btn" onclick="toggleTheme()">🌓 Changer de thème</button>
        <button class="toggle-btn" onclick="sendStateToAI()">🤖 Envoyer état au serveur IA</button>
    </div>
    
    <div style="margin: 1em 0;">
        <label><input type="radio" name="gameMode" value="human" checked> 👥 Humain vs Humain</label>
        <label><input type="radio" name="gameMode" value="ai"> 🤖 Humain vs IA</label>
    </div>
    
    <div class="game-over" id="gameOver">
        <h2>🎉 Partie Terminée ! 🎉</h2>
        <div class="final-score" id="finalScore"></div>
        <button class="toggle-btn" onclick="location.reload()">🔄 Nouvelle Partie</button>
    </div>
    
    <div class="game-container">
        <div class="video-section" id="videoSection">
            <div class="video-container" id="videoContainer">
                <!-- La vidéo sera chargée dynamiquement -->
            </div>
            <div class="video-title">🎉 Victoire ! 🎉</div>
        </div>
        
        <div class="board-section">
            <table>`;

    // --- Génération de la grille ---
    for (let r = 1; r <= rows; r++) {
        html += '\n        <tr>';
        for (let c = 1; c <= cols; c++) {
            // Calcul de la distance pour le “cercle Minecraft”
            const dx = c - (cols + 1) / 2;
            const dy = r - (rows + 1) / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const isInsideCircle =
                boardType !== 'circle' ||
                distance <= radius - 0.3;

            const cell = model.initial?.cells.find(cell =>
                cell.position.row === r && cell.position.column === c
            );

            let content = '';
            if (cell?.color === 'black') content = '<div class="piece black"></div>';
            else if (cell?.color === 'white') content = '<div class="piece white"></div>';

            html += `<td class="${isInsideCircle ? '' : 'hidden'}">${content}</td>`;
        }
        html += '</tr>';
    }

    // --- Fin du HTML ---
html += `</table>
        </div>
        
        <div class="game-info">
            <h3>📊 État de la Partie</h3>
            <div class="current-turn" id="currentTurn">
                Tour actuel : <span id="turnPlayer">⚫ ${model.players.black.name}</span>
            </div>
            <div class="info-row">
                <span><b>⚫ ${model.players.black.name}</b></span>
                <span id="blackScore">2</span>
            </div>
            <div class="info-row">
                <span><b>⚪ ${model.players.white.name}</b></span>
                <span id="whiteScore">2</span>
            </div>
            <div class="info-row">
                <span><b>Dernier coup :</b></span>
                <span class="last-move" id="lastMove">-</span>
            </div>
            <div class="info-row">
                <span><b>Nombre de coups :</b></span>
                <span id="moveCount">0</span>
            </div>
            <div class="info-row">
                <span><b>Mode de jeu :</b></span>
                <span id="gameModeDisplay">👥 Humain vs Humain</span>
            </div>
            <div class="controls">
                <button class="pass-turn-btn" id="passTurnBtn" onclick="passTurn()">⏭️ Passer mon tour</button>
            </div>
        </div>
    </div>
    
    <div class="rules">
        <h3>Game Rules</h3>
        <p><b>Move type:</b> ${model.rules.move?.type ?? 'placement'}</p>
        <p><b>Scoring:</b> count pieces per player</p>
    </div>
    <script>
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
        
        function updateGameInfo() {
            // Mise à jour du tour actuel
            const turnPlayer = document.getElementById('turnPlayer');
            const playerName = currentPlayer === 'black' ? '${model.players.black.name}' : '${model.players.white.name}';
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
            const mode = getGameMode() === 'ai' ? '🤖 Humain vs IA' : '👥 Humain vs Humain';
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
                if (getGameMode() === 'human') {
                    passTurnBtn.style.display = 'inline-block';
                } else if (getGameMode() === 'ai' && currentPlayer === 'black') {
                    // Humain bloqué en mode IA
                    passTurnBtn.style.display = 'inline-block';
                } else if (getGameMode() === 'ai' && currentPlayer === 'white') {
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
                winner = '⚫ ${model.players.black.name} gagne !';
            } else if (whiteCount > blackCount) {
                winner = '⚪ ${model.players.white.name} gagne !';
            } else {
                winner = 'Égalité ! 🤝';
            }
            
            // Afficher l'écran de fin
            const finalScore = document.getElementById('finalScore');
            finalScore.innerHTML = \`
                <div>\${winner}</div>
                <div style="margin-top: 1em;">
                    <b>⚫ ${model.players.black.name}:</b> \${blackCount} pions<br>
                    <b>⚪ ${model.players.white.name}:</b> \${whiteCount} pions
                </div>
            \`;
            
            document.getElementById('gameOver').style.display = 'block';
            
            // Lancer les confettis
            createConfetti();
            
            // Afficher la vidéo de victoire
            showVictoryVideo();
        }
        
        function showVictoryVideo() {
            const videoSection = document.getElementById('videoSection');
            const videoContainer = document.getElementById('videoContainer');
            
            // Charger la vidéo YouTube
            videoContainer.innerHTML = \`
                <iframe 
                    width="280" 
                    height="500" 
                    src="https://www.youtube.com/embed/OqPxaKs8xrk?autoplay=1&mute=1&loop=1&playlist=OqPxaKs8xrk" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            \`;
            
            // Afficher la section vidéo avec animation
            videoSection.classList.add('show');
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
                    confetti.style.animation = \`confetti-fall \${(Math.random() * 2 + 3)}s linear forwards\`;
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
            
            // Si mode IA et c'est le tour de l'IA
            if (getGameMode() === 'ai' && currentPlayer === 'white') {
                setTimeout(sendStateToAI, 500);
            }
        }
        
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
                        
                        // Si mode IA et c'est le tour de l'IA
                        if (getGameMode() === 'ai' && currentPlayer === 'white') {
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
                    // Ne rien ajouter
                    continue;
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
            
            const board = getBoardState();
            const payload = {
                board: board,
                player: currentPlayer
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
    </script>
</body>
</html>`;

    return html;
}
