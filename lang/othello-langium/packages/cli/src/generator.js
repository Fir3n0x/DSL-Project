import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
export function generateOutput(model, source, options = {}) {
    const ascii = renderAscii(model);
    if (options.stdout) {
        // Print directly and do not write a file
        // eslint-disable-next-line no-console
        console.log(ascii);
        return { stdout: true };
    }
    const destination = resolveOutPath(source, options.outPath);
    const dir = path.dirname(destination);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const fileNode = expandToNode `${ascii}`.appendNewLineIfNotEmpty();
    fs.writeFileSync(destination, toString(fileNode));
    return { filePath: destination };
}
function resolveOutPath(source, outPath) {
    const srcDir = path.dirname(source);
    const srcBase = path.basename(source, path.extname(source));
    const defaultName = `${srcBase}.ascii`;
    if (!outPath) {
        return path.join(srcDir, defaultName);
    }
    // If outPath points to an existing directory or ends with path separator or has no extension, treat as directory
    try {
        const stat = fs.existsSync(outPath) ? fs.statSync(outPath) : undefined;
        const isDir = (stat && stat.isDirectory()) || outPath.endsWith(path.sep) || path.extname(outPath) === '';
        return isDir ? path.join(outPath, defaultName) : outPath;
    }
    catch {
        // Fallback to treat as file path
        return outPath;
    }
}
function renderAscii(game) {
    const rows = game.board.rows;
    const cols = game.board.columns;
    // Initialize empty board
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '.'));
    // Place initial pieces
    for (const cell of game.initial.cells) {
        const r = cell.position.row; // 1-based per grammar usage
        const c = cell.position.column;
        if (r >= 1 && r <= rows && c >= 1 && c <= cols) {
            grid[r - 1][c - 1] = cell.color === 'black' ? 'B' : 'W';
        }
    }
    const lines = [];
    lines.push(`Game: ${game.name}`);
    lines.push(`Players: ${game.players.black.name} (black) vs ${game.players.white.name} (white)`);
    lines.push(`Board: ${rows}x${cols}`);
    lines.push('');
    // Column header
    const colHeader = ['   ', ...Array.from({ length: cols }, (_, i) => String(i + 1).padStart(2, ' '))].join(' ');
    lines.push(colHeader);
    // Separator
    lines.push('   ' + '-'.repeat(cols * 3));
    // Board rows
    for (let r = 0; r < rows; r++) {
        const rowLabel = String(r + 1).padStart(2, ' ');
        const rowCells = grid[r].map(ch => ` ${ch} `).join('');
        lines.push(`${rowLabel}|${rowCells}`);
    }
    // Optional: rules summary
    lines.push('');
    const moveType = game.rules.move.type ?? 'placement';
    lines.push(`Rules: move=${moveType}, end=captures_in_any_direction(r,c), scoring=count_pieces_per_player`);
    return lines.join('\n');
}
//# sourceMappingURL=generator.js.map