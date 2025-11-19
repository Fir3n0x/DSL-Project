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
        
        function getGameMode() {
            return document.querySelector('input[name="gameMode"]:checked').value;
        }
        
        function getOpponent(player) {
            return player === 'black' ? 'white' : 'black';
        }
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
                        currentPlayer = getOpponent(currentPlayer);
                        
                        // Si mode IA et c'est le tour de l'IA
                        if (getGameMode() === 'ai' && currentPlayer === 'white') {
                            setTimeout(sendStateToAI, 500);
                        }
                    });
                }
            }
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
            currentPlayer = getOpponent(currentPlayer);
        }
    </script>
</body>
</html>`;

    return html;
}
