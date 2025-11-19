import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { describe, test, expect } from "vitest";

const variants = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5'];
const dslDir = path.resolve(__dirname, '../../../../../examples');
const outputDir = path.resolve(__dirname, '../../../../../examples');
const cliPath = path.resolve(__dirname, '../../cli/bin/cli.js');

describe('Generation Tests', () => {
    for (const variant of variants) {
        const dslPath = path.join(dslDir, variant, `${variant}.othello`);
        const htmlPath = path.join(outputDir, variant,  `${variant}.html`);
        const asciiPath = path.join(outputDir, variant,  `${variant}.txt`);

        test(`should generate HTML for ${variant}`, () => {
            // Exécute la commande de génération
            execSync(`node "${cliPath}" generate "${dslPath}" --target=html --out="${htmlPath}"`);

            // Vérifie que le fichier HTML existe
            expect(fs.existsSync(htmlPath)).toBe(true);

            // Vérifie le contenu du fichier HTML
            const content = fs.readFileSync(htmlPath, 'utf-8');
            expect(content).toContain('<h1>');
            expect(content).toContain('<table>');
            expect(content).toContain('<div class="rules">');
            expect(content).toMatch(/class="(dark|light)"/);
        });

        test(`should generate ASCII for ${variant}`, () => {
            // Exécute la commande de génération
            execSync(`node "${cliPath}" generate "${dslPath}" --target=ascii --out="${asciiPath}"`);

            // Vérifie que le fichier ASCII existe
            expect(fs.existsSync(asciiPath)).toBe(true);

            // Vérifie le contenu du fichier ASCII
            const content = fs.readFileSync(asciiPath, 'utf-8');
            expect(content).toContain('> Compile-time:');
            expect(content).toContain('> Run-time:');
            expect(content).toMatch(/^\s*1\s+2\s+3\s+4\s+5\s+6\s+7\s+8/m);

            const rows = content.match(/^\s*[1-9]\s*\|.*$/gm) || [];
            expect(rows.length).toBeGreaterThanOrEqual(4);

            expect(content).toMatch(/Players:\s*.+\(.+\)\s+vs\s+.+\(.+\)/);
            expect(content).toMatch(/[\.BW]/);
        });
    }
});