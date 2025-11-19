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
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 2em; 
            transition: background 0.3s, color 0.3s;
        }
        body.light {
            background: #f4f4f4;
            color: #333;
        }
        body.dark {
            background: #121212;
            color: #f4f4f4;
        }
        h1 { margin-bottom: 0.5em; }
        .info { margin: 1em 0; font-size: 1.1em; }
        table { 
            margin: 2em auto; 
            border-collapse: collapse; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        td { 
            width: 50px; 
            height: 50px; 
            text-align: center; 
            vertical-align: middle; 
            border: 1px solid #333; 
        }
        body.light td { background: #228B22; } /* vert clair */
        body.dark td { background: #145214; }  /* vert foncé */
        .hidden {
            background: transparent !important;
            border: none !important;
        }
        .piece { 
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            margin: auto; 
        }
        .black { background: #000; }
        .white { background: #fff; border: 2px solid #000; }
        .rules { 
            margin-top: 2em; 
            padding: 1em; 
            background: inherit; 
            border-radius: 8px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            border: 1px solid currentColor;
        }
        .toggle-btn {
            padding: 0.5em 1em;
            margin-top: 1em;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            background: #666;
            color: #fff;
        }
        .game-info {
            margin: 2em auto;
            padding: 1.5em;
            max-width: 600px;
            border: 2px solid currentColor;
            border-radius: 8px;
            background: inherit;
        }
        .game-info h3 {
            margin-top: 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 0.5em 0;
            padding: 0.5em;
            border-radius: 4px;
        }
        body.light .info-row {
            background: rgba(0,0,0,0.05);
        }
        body.dark .info-row {
            background: rgba(255,255,255,0.05);
        }
        .current-turn {
            font-weight: bold;
            font-size: 1.2em;
            padding: 0.5em;
            border-radius: 4px;
        }
        body.light .current-turn {
            background: rgba(34, 139, 34, 0.2);
        }
        body.dark .current-turn {
            background: rgba(34, 139, 34, 0.3);
        }
        .last-move {
            font-style: italic;
            color: #666;
        }
        body.dark .last-move {
            color: #aaa;
        }
        .pass-turn-btn {
            padding: 0.8em 1.5em;
            margin: 1em;
            cursor: pointer;
            border: 2px solid #ff9800;
            border-radius: 6px;
            background: #ff9800;
            color: #fff;
            font-weight: bold;
            font-size: 1.1em;
            display: none;
        }
        .pass-turn-btn:hover {
            background: #e68900;
        }
        .game-over {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 3em;
            border-radius: 12px;
            text-align: center;
            z-index: 1000;
            display: none;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
        }
        .game-over h2 {
            font-size: 2.5em;
            margin: 0.5em 0;
            color: #ffd700;
        }
        .game-over .final-score {
            font-size: 1.5em;
            margin: 1em 0;
        }
        .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            background: #f0f;
            position: absolute;
            animation: confetti-fall 3s linear infinite;
        }
        @keyframes confetti-fall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
    </style>
</head>

<body class="${initialTheme}">
    <h1>${model.name}</h1>
    <div class="info">
        <b>${model.players.black.name}</b> (⚫) vs <b>${model.players.white.name}</b> (⚪)
    </div>
    <button class="toggle-btn" onclick="toggleTheme()">Switch Theme</button>
    <button class="toggle-btn" onclick="sendStateToAI()">Envoyer état au serveur IA</button>
    <div style="margin: 1em 0;">
        <label><input type="radio" name="gameMode" value="human" checked> Humain vs Humain</label>
        <label><input type="radio" name="gameMode" value="ai"> Humain vs IA</label>
    </div>
    
    <button class="pass-turn-btn" id="passTurnBtn" onclick="passTurn()">⏭️ Passer mon tour (aucun coup valide)</button>
    
    <div class="game-over" id="gameOver">
        <h2>🎉 Partie Terminée ! 🎉</h2>
        <div class="final-score" id="finalScore"></div>
        <button class="toggle-btn" onclick="location.reload()">Nouvelle Partie</button>
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
            <span id="gameModeDisplay">Humain vs Humain</span>
        </div>
    </div>
    
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
html += `
    </table>
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
            const mode = getGameMode() === 'ai' ? 'Humain vs IA' : 'Humain vs Humain';
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
        }
        
        function createConfetti() {
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff69b4'];
            const confettiCount = 100;
            
            for (let i = 0; i < confettiCount; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + 'vw';
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 3 + 's';
                    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 5000);
                }, i * 30);
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
                for (const [dr, dc] of directions) {
                    let i = r + dr, j = c + dc, path = [];
                    while (getCell(i, j) && getPiece(getCell(i, j)) === getOpponent(player)) {
                        path.push([i, j]);
                        i += dr; j += dc;
                    }
                    if (path.length && getCell(i, j) && getPiece(getCell(i, j)) === player) {
                        for (const [x, y] of path) {
                            const cell = getCell(x, y);
                            cell.querySelector('.piece').className = 'piece ' + player;
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
                            cell.querySelector('.piece').className = 'piece ' + player;
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
