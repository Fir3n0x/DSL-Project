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
    <link rel="stylesheet" href="/static/htmlGenerator.css"> 
</head>

<body data-black="Alice" data-white="Bob" class="${initialTheme}">
    <button class="home-btn" onclick="window.location.href='/'">🏠</button>

    <h1>${model.name}</h1>
    <p class="info">Jouez à l'Othello ! Retournez les pièces adverses.</p>
    
    <div style="margin: 1em 0;">
        <button class="toggle-btn" onclick="toggleTheme()">🌓 Changer de thème</button>
        <button class="toggle-btn" onclick="sendStateToAI()">🤖 Envoyer état au serveur IA</button>
        <button class="toggle-btn" onclick="toggleSecretVideo()">Bonus</button>
    </div>
    
    <div style="margin: 1em 0;">
        <label><input type="radio" name="gameMode" value="human" checked> 👥 Humain vs Humain</label>
        <label><input type="radio" name="gameMode" value="ai"> 🤖 Humain vs IA</label>
        <label><input type="radio" name="gameMode" value="ai-ai"> 🦾 IA vs IA</label>
    </div>

    <div class="speed-slider">
        <label for="aiSpeed">⏱️ Vitesse de l'IA</label>
        <input type="range" id="aiSpeed" min="100" max="2000" value="500" step="100" autocomplete="off">
        <div class="speed-value">
            Délai: <span id="speedDisplay">500</span> ms
        </div>
    </div>
    
    <div class="difficulty-slider">
        <label for="aiDifficulty">🎯 Niveau de difficulté de l'IA</label>
        <input type="range" id="aiDifficulty" min="1" max="6" value="3" step="1" autocomplete="off">
        <div class="difficulty-value">
            Niveau: <span id="difficultyDisplay">3</span> (Depth: <span id="depthDisplay">3</span>)
        </div>
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
            <div class="video-title"></div>
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
    <script defer src="/static/htmlGenerator.js"></script>
</body>
</html>`;

    return html;
}
