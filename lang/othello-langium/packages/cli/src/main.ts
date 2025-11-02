import { Command } from 'commander';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import chalk from 'chalk';
import { createOthelloServices } from '../../language/src/othello-module.js';
import { extractAstNode } from './util.js';
import type { Game } from '../../language/src/generated/ast.js';
import { OthelloDslLanguageMetaData } from '../../language/out/generated/module.js';
import { generateOutput, type TargetName } from './generator.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (
    source: string,
    options: { target?: TargetName; out?: string; stdout?: boolean }
): Promise<void> => {
    try {
        const services = createOthelloServices(NodeFileSystem).Othello;
        const model = await extractAstNode<Game>(source, services);

        const target: TargetName = options.target ?? 'ascii';
        const result = generateOutput(model, source, {
            target,
            outPath: options.out,
            stdout: options.stdout === true,
        });

        if (result.stdout) {
            console.log(result.content);
        } else if (result.filePath) {
            console.log(chalk.green(`✅ ${target.toUpperCase()} generated successfully: ${result.filePath}`));
        }
    } catch (error) {
        console.error(chalk.red('❌ Generation failed:'), error);
        process.exit(1);
    }
};

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = OthelloDslLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-t, --target <type>', 'target format: ascii|html|react|engine:pixi|engine:phaser', 'ascii')
        .option('-o, --out <path>', 'output file or directory')
        .option('--stdout', 'print output to stdout instead of writing a file')
        .description('Generates output for a provided source file.')
        .action(generateAction);

    program.parse(process.argv);
}
