import type { Game } from '../../language/src/generated/ast.js';
export type GenerateOptions = {
    destination?: string;
};
export declare const generateAction: (fileName: string, opts: GenerateOptions) => Promise<void>;
export default function (): void;
export declare function generateHTML(model: Game, filePath: string, destination: string | undefined): string;
