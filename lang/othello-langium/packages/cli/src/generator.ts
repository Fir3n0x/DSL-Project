import fs from 'node:fs';
import path from 'node:path';
import type { Game } from '../../language/out/generated/ast.js';
import { renderAscii } from '../../backends/out/ascii/asciiGenerator.js';
import { renderHTML } from '../../backends/out/html/htmlGenerator.js';

export type TargetName = 'ascii' | 'html' | 'react' | 'engine:pixi' | 'engine:phaser';

export interface GenerateOptions {
    target: TargetName;
    outPath?: string;
    stdout?: boolean;
}

export interface GenerateResult {
    filePath?: string;
    stdout?: boolean;
    content?: string;
}

export function generateOutput(model: Game, source: string, options: GenerateOptions): GenerateResult {
    const content = renderByTarget(options.target, model);

    if (options.stdout) {
        return { stdout: true, content };
    }

    const destination = resolveOutPath(source, options.outPath, options.target);
    const dir = path.dirname(destination);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destination, content, 'utf-8');
    return { filePath: destination };
}

function resolveOutPath(source: string, outPath: string | undefined, target: TargetName): string {
    const srcDir = path.dirname(source);
    const srcBase = path.basename(source, path.extname(source));
    const ext = extForTarget(target);
    const defaultName = target === 'ascii' ? 'ascii.txt' : `${srcBase}.${ext}`;

    if (!outPath) {
        return path.join(srcDir, defaultName);
    }

    try {
        const stat = fs.existsSync(outPath) ? fs.statSync(outPath) : undefined;
        const isDir = (stat?.isDirectory() === true) || outPath.endsWith(path.sep) || path.extname(outPath) === '';
        
        if (isDir) {
            return path.join(outPath, defaultName);
        }
        return outPath;
    } catch {
        return outPath;
    }
}

function extForTarget(target: TargetName): string {
    switch (target) {
        case 'ascii': return 'txt';
        case 'html': return 'html';
        case 'react': return 'jsx';
        case 'engine:pixi': return 'pixi.js';
        case 'engine:phaser': return 'phaser.js';
        default: return 'txt';
    }
}

function renderByTarget(target: TargetName, model: Game): string {
    switch (target) {
        case 'ascii':
            return renderAscii(model);
        case 'html':
            return renderHTML(model);
        case 'react':
        case 'engine:pixi':
        case 'engine:phaser':
            throw new Error(`Target '${target}' not implemented yet.`);
        default:
            throw new Error(`Unknown target '${target}'.`);
    }
}