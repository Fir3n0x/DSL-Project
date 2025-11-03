import { type TargetName } from './generator.js';
export declare const generateAction: (source: string, options: {
    target?: TargetName;
    out?: string;
    stdout?: boolean;
}) => Promise<void>;
export default function (): void;
