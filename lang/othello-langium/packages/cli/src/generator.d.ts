import type { Game } from '../../language/out/generated/ast.js';
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
export declare function generateOutput(model: Game, source: string, options: GenerateOptions): GenerateResult;
