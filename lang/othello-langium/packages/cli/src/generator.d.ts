import type { Game } from 'othello-language';
export interface GenerateOptions {
    outPath?: string;
    stdout?: boolean;
}
export interface GenerateResult {
    filePath?: string;
    stdout?: boolean;
}
export declare function generateOutput(model: Game, source: string, options?: GenerateOptions): GenerateResult;
