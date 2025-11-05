import type { Game } from '../../language/src/generated/ast.js';


export function renderHTML(model: Game): string {
    const rows = model.board.rows;
    const cols = model.board.columns;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${model.name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #f4f4f4; 
            text-align: center; 
            padding: 2em; 
        }
        h1 { color: #333; }
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
            background: #228B22; 
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
            background: white; 
            border-radius: 8px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
    </style>
</head>
<body>
    <h1>${model.name}</h1>
    <div class="info">
        <b>${model.players.black.name}</b> (⚫) vs <b>${model.players.white.name}</b> (⚪)
    </div>
    <table>`;

    // Generate board
    for (let r = 1; r <= rows; r++) {
        html += '\n        <tr>';
        for (let c = 1; c <= cols; c++) {
            const cell = model.initial?.cells.find(cell =>
                cell.position.row === r && cell.position.column === c
            );
            let content = '';
            if (cell?.color === 'black') content = '<div class="piece black"></div>';
            else if (cell?.color === 'white') content = '<div class="piece white"></div>';
            html += `<td>${content}</td>`;
        }
        html += '</tr>';
    }

    html += `
    </table>
    <div class="rules">
        <h3>Game Rules</h3>
        <p><b>Move type:</b> ${model.rules.move?.type ?? 'placement'}</p>
        <p><b>Scoring:</b> count pieces per player</p>
    </div>
</body>
</html>`;

    return html;
}