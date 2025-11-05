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
    </script>
</body>
</html>`;

    return html;
}
