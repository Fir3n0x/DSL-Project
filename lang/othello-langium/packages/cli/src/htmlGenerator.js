import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import { extractAstNode } from '../../cli/src/util.js';
import { createOthelloServices } from '../../language/src/othello-module.js';
// ==========================
// Action principale CLI
// ==========================
export const generateAction = async (fileName, opts) => {
    const { Othello } = createOthelloServices({});
    const model = await extractAstNode(fileName, Othello);
    const generatedFilePath = generateHTML(model, fileName, opts.destination);
    console.log(chalk.green(`HTML generated successfully: ${generatedFilePath}`));
};
// ==========================
// Commande CLI principale
// ==========================
export default function () {
    const program = new Command();
    program
        .command('generate')
        .argument('<file>', 'source .dsl file')
        .option('-d, --destination <dir>', 'destination directory for HTML output')
        .description('Generates an HTML visualization of the Othello game variant.')
        .action(generateAction);
    program.parse(process.argv);
}
// ==========================
// Génération du HTML
// ==========================
export function generateHTML(model, filePath, destination) {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = path.join(data.destination, `${data.name}.html`);
    const fileNode = new CompositeGeneratorNode();
    // ======= HEADER HTML =======
    fileNode.append(`<html><head><meta charset="utf-8"><title>${model.name}</title>`, `<style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; text-align: center; }
            table { margin: 2em auto; border-collapse: collapse; }
            td { width: 40px; height: 40px; text-align: center; vertical-align: middle; border: 1px solid #555; }
            .black { background: #000; border-radius: 50%; }
            .white { background: #fff; border-radius: 50%; border: 1px solid #000; }
        </style></head><body>`, NL);
    fileNode.append(`<h1>${model.name}</h1>`, NL);
    fileNode.append(`<p><b>${model.players.black.name}</b> (⚫) vs <b>${model.players.white.name}</b> (⚪)</p>`, NL);
    // ======= BOARD =======
    const rows = model.board.rows;
    const cols = model.board.columns;
    fileNode.append(`<table>`, NL);
    for (let r = 1; r <= rows; r++) {
        fileNode.append(`<tr>`, NL);
        for (let c = 1; c <= cols; c++) {
            const cell = model.initial.cells.find(cell => cell.position.row === r && cell.position.column === c);
            let content = '';
            if (cell?.color === 'black')
                content = `<div class="black"></div>`;
            else if (cell?.color === 'white')
                content = `<div class="white"></div>`;
            fileNode.append(`<td>${content}</td>`, NL);
        }
        fileNode.append(`</tr>`, NL);
    }
    fileNode.append(`</table>`, NL);
    // ======= FOOTER =======
    fileNode.append(`<p>Rules: move=${model.rules.move.type ?? 'placement'}, scoring=count_pieces_per_player</p>`, NL);
    fileNode.append(`</body></html>`, NL);
    // ======= ÉCRITURE =======
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}
// ==========================
// Extraction du nom & dossier
// ==========================
function extractDestinationAndName(filePath, destination) {
    const name = path.basename(filePath, path.extname(filePath));
    const dest = destination ?? path.dirname(filePath);
    return { name, destination: dest };
}
//# sourceMappingURL=htmlGenerator.js.map