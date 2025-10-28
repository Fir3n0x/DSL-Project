import type { AstNode, LangiumCoreServices, LangiumDocument } from 'langium';
export declare function extractDocument(fileName: string, services: LangiumCoreServices): Promise<LangiumDocument>;
export declare function extractAstNode<T extends AstNode>(fileName: string, services: LangiumCoreServices): Promise<T>;
interface FilePathData {
    destination: string;
    name: string;
}
export declare function extractDestinationAndName(destination: string): FilePathData;
export {};
