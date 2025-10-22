import type { Game } from 'othello-language';
import { createOthelloServices, OthelloDslLanguageMetaData } from 'othello-language';
import chalk from 'chalk';
import { Command } from 'commander';
import { extractAstNode } from './util.js';
import { generateOutput } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (source: string, destinationOrOptions?: string, maybeOptions?: { out?: string; stdout?: boolean; }): Promise<void> => {
    const services = createOthelloServices(NodeFileSystem).Othello;
    const model = await extractAstNode<Game>(source, services);
    // Normalize inputs: destination may be omitted if options used
    const destination = typeof destinationOrOptions === 'string' ? destinationOrOptions : undefined;
    const options = (typeof destinationOrOptions === 'object' ? destinationOrOptions : maybeOptions) ?? {};
    const result = generateOutput(model, source, { outPath: options.out ?? destination, stdout: options.stdout === true });
    if (result.stdout) {
        console.log(chalk.green('Code generated to stdout successfully.'));
    } else if (result.filePath) {
        console.log(chalk.green(`Code generated successfully: ${result.filePath}`));
    }
};

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = OthelloDslLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('[destination]', 'destination file (optional, can be set via --out)')
        .option('-o, --out <path>', 'output file or directory (defaults to <source>.ascii)')
        .option('--stdout', 'print the generated output to stdout instead of writing a file')
        .description('Generates ASCII output for a provided source file.')
        .action((file: string, destination?: string, options?: { out?: string; stdout?: boolean; }) => generateAction(file, destination, options));

    program.parse(process.argv);
}
