import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import { extractAstNode } from '../../cli/src/util.js';
import { createOthelloServices } from '../../language/src/othello-module.js';
// ==========================
// 2️⃣ Action principale CLI
// ==========================
export const generateAction = async (fileName, opts) => {
    const { Othello } = createOthelloServices({});
    const model = await extractAstNode(fileName, Othello);
    const generatedFilePath = generateHTML(model, fileName, opts.destination);
    console.log(chalk.green(`✅ HTML generated successfully: ${generatedFilePath}`));
};
// ==========================
// 3️⃣ Commande CLI principale
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
// 4️⃣ Génération du HTML
// ==========================
export function generateHTML(model, filePath, destination) {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = path.join(data.destination, `${data.name}.html`);
    const fileNode = new CompositeGeneratorNode();
    // ======= HEADER HTML =======
    fileNode.append(`<html><head><meta charset="utf-8"><title>${model.name}</title>`, `<style>
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
        </style></head><body>`, NL);
    fileNode.append(`<h1>${model.name}</h1>`, NL);
    fileNode.append(`<div class="info"><b>${model.players.black.name}</b> (⚫) vs <b>${model.players.white.name}</b> (⚪)</div>`, NL);
    // ======= BOARD =======
    const rows = model.board.rows;
    const cols = model.board.columns;
    fileNode.append(`<table>`, NL);
    for (let r = 1; r <= rows; r++) {
        fileNode.append(`<tr>`, NL);
        for (let c = 1; c <= cols; c++) {
            const cell = model.initial?.cells.find(cell => cell.position.row === r && cell.position.column === c);
            let content = '';
            if (cell?.color === 'black')
                content = '<div class="piece black"></div>';
            else if (cell?.color === 'white')
                content = '<div class="piece white"></div>';
            fileNode.append(`<td>${content}</td>`, NL);
        }
        fileNode.append(`</tr>`, NL);
    }
    fileNode.append(`</table>`, NL);
    // ======= FOOTER =======
    fileNode.append(`<div class="rules">`, NL);
    fileNode.append(`<h3>Game Rules</h3>`, NL);
    fileNode.append(`<p><b>Move type:</b> ${model.rules.move?.type ?? 'placement'}</p>`, NL);
    fileNode.append(`<p><b>Scoring:</b> count pieces per player</p>`, NL);
    fileNode.append(`</div>`, NL);
    fileNode.append(`</body></html>`, NL);
    // ======= ÉCRITURE =======
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}
// ==========================
// 5️⃣ Extraction du nom & dossier
// ==========================
function extractDestinationAndName(filePath, destination) {
    const name = path.basename(filePath, path.extname(filePath));
    const dest = destination ?? path.dirname(filePath);
    return { name, destination: dest };
}
// Code prof
// export const generateAction = async (fileName: string, opts: GenerateOptions) : Promise<void> => {
//     const services = createOthelloServices(NodeFileSystem).othello;
//     const model = await extractAsNode<Game>(fileName, services);
//     const generatedFilePath = generateHTLM(model, fileName, opts.destinaton);
//     console.log(chalk.green('HTML code generated successfully: ${generatedFilePath}'));
// };
// export type GenerateOptions = {
//     destination?: string;
// }
// export default function(): void {
//     const program = new Command();
//     // program 
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     // version(require('../../package.json').version);
//     const fileExtensions = PollSystemLanguageMetData.fileExtension.join(', ');
//     program
//         .command('generate')
//         .argument('<file>', 'source file (possible file extensions: ${fileExtensions})')
//         .option('-d, --destination <dir>', 'destination directory of generating')
//         .description('generates HTML that prints the poll system model')
//         .action(generateAction);
//     program.parse(process.argv);
// }
// export function generateHTML(model: Game, filePath: string, destination: string | undefined): string {
//     const data = extractDestinationAndName(filePath, destination);
//     const generatedFilePath = '${path.join(data.destination, data.name)}.html';
//     const fileNode = new CompositeGeneratorNode();
//     // fileNode.append('"use strict";', NL, NL);
//     // model.greetings.forEach(greeting => fileNode.append(`console.log('Hello, ${greeting.person.ref?.name}!');`, NL));
//     fileNode.append('<html><body>');
//     model.polls.forEach(poll => {
//         poll.questions.forEach(question => {
//             fileNode.append(`<h2>${question.text}</h2>`, NL);
//             fileNode.append(`<ul>`, NL);
//             questions.options.forEach(option => {
//                 fileNode.append(`<li>${option.text}</li>`, NL);
//             });
//             fileNode.append(`</ul>`, NL);
//         });
//     });
//     fileNode.append(`</body></html>`, NL);
//     if (!fs.existsSync(data.destination)) {
//         fs.mkdirSync(data.destination, { recursive: true });
//     }
//     fs.writeFileSync(generatedFilePath, toString(fileNode));
//     return generatedFilePath;
// }
//# sourceMappingURL=htmlGenerator.js.map