// type Size = { rows: number; cols: number };
function safeString(v) {
    if (v === null || v === undefined)
        return '';
    if (typeof v === 'string')
        return v;
    return String(v);
}
export function renderAscii(game) {
    const lines = [];
    // Header
    lines.push(`# Game: ${safeString(game.name)}`);
    lines.push('');
    // Compile-time parameters
    const ct = game.compileTime?.parameters ?? [];
    if (ct.length > 0) {
        lines.push('> Compile-time:');
        for (const p of ct) {
            lines.push(`  - ${p.name} = ${safeString(p.value)}`);
        }
        lines.push('');
    }
    // Run-time parameters
    const rt = game.runTime?.parameters ?? [];
    if (rt.length > 0) {
        lines.push('> Run-time:');
        for (const p of rt) {
            lines.push(`  - ${p.name} = ${safeString(p.value)}`);
        }
        lines.push('');
    }
    // UI summary
    if (game.ui) {
        const themeName = game.ui.theme?.name;
        if (themeName) {
            lines.push(`> UI Theme: ${safeString(themeName)}`);
        }
        const sprites = game.ui.theme?.sprites ?? [];
        if (sprites.length > 0) {
            lines.push('> Sprites:');
            for (const s of sprites) {
                lines.push(`  - ${s.name}`);
            }
        }
        lines.push('');
    }
    // Board
    if (!game.board) {
        lines.push('! No board defined.');
        return lines.join('\n');
    }
    const rows = game.board.rows;
    const cols = game.board.columns;
    // Initialize grid
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '.'));
    // Place initial pieces
    const inits = game.initial?.cells ?? [];
    for (const cell of inits) {
        const r = cell.position.row;
        const c = cell.position.column;
        if (r >= 1 && r <= rows && c >= 1 && c <= cols) {
            grid[r - 1][c - 1] = cell.color === 'black' ? 'B' : 'W';
        }
    }
    // Column header
    const colHeader = ['   ', ...Array.from({ length: cols }, (_, i) => String(i + 1).padStart(2, ' '))].join(' ');
    lines.push(colHeader);
    lines.push('   ' + '-'.repeat(cols * 3));
    // Rows
    for (let r = 0; r < rows; r++) {
        const rowStr = grid[r].map(v => v.padStart(2, ' ')).join(' ');
        lines.push(String(r + 1).padStart(2, ' ') + ' | ' + rowStr);
    }
    lines.push('');
    lines.push(`Players: ${game.players?.black?.name ?? '?'} (B) vs ${game.players?.white?.name ?? '?'} (W)`);
    return lines.join('\n');
}
//# sourceMappingURL=asciiGenerator.js.map