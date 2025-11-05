import { describe, it, expect } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createOthelloServices } from '../src/othello-module.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
describe('Validation des fichiers .othello', () => {
    const services = createOthelloServices(EmptyFileSystem);
    const parse = parseHelper(services.Othello);
    // Chemin vers le dossier DSL-Project/examples/
    const examplesRoot = join(__dirname, '../../../../../examples');
    // On cherche dans base/, variant1/, variant2/, etc.
    const subdirs = readdirSync(examplesRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => join(examplesRoot, d.name));
    for (const dir of subdirs) {
        const files = readdirSync(dir).filter(f => f.endsWith('.othello'));
        for (const file of files) {
            it(`Le fichier ${file} (${dir}) se parse et se valide sans erreur`, async () => {
                const code = readFileSync(join(dir, file), 'utf-8');
                const document = await parse(code, { validation: true });
                if (document.diagnostics?.length) {
                    console.warn(`\nErreurs dans ${file}:`);
                    for (const d of document.diagnostics) {
                        console.warn(`[${d.severity}] ${d.message}`);
                    }
                }
                const hasErrors = document.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error);
                expect(hasErrors).toBeFalsy();
            });
        }
    }
});
//# sourceMappingURL=validation.test.js.map