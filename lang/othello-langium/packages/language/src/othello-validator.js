/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.OthelloValidator;
    const checks = {
        // TODO: Declare validators for your properties
        // See doc : https://langium.org/docs/learn/workflow/create_validations/
        Game: [
            validator.checkBoardSize,
            validator.checkTimer,
            validator.checkPlayers,
            validator.checkNumberInitialPositions,
            validator.checkMoveValidity
        ]
    };
    registry.register(checks, validator);
}
/**
 * Implementation of custom validations.
 */
export class OthelloValidator {
    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/
    checkBoardSize(game, accept) {
        if (game.board.rows <= 2 || game.board.columns <= 2) {
            accept('error', 'The board must have at least 3 rows and 3 columns.', { node: game.board });
        }
        else if (game.board.rows > 32 || game.board.columns > 32) {
            accept('error', 'The board must not exceed 32 rows and 32 columns.', { node: game.board });
        }
    }
    checkTimer(game, accept) {
        if (game.runTime?.parameters) {
            const timerParam = game.runTime.parameters.find((p) => p.name === 'timer');
            if (timerParam && typeof timerParam.value === 'number') {
                if (timerParam.value <= 0) {
                    accept('error', 'The timer value must be a positive number.', { node: timerParam });
                }
            }
        }
    }
    checkPlayers(game, accept) {
        if (!game.players?.black || !game.players?.white) {
            accept('error', 'Both black and white players must be defined.', { node: game.players });
        }
        else if (game.players.black.name === game.players.white.name) {
            accept('warning', 'Both players have the same name.', { node: game.players });
        }
    }
    checkNumberInitialPositions(game, accept) {
        if (game.initial) {
            const totalPositions = game.initial.cells.length;
            if (totalPositions < 4) {
                accept('error', 'There must be at least 4 initial positions on the board.', { node: game.initial });
            }
        }
    }
    checkMoveValidity(game, accept) {
        const rows = game.board.rows;
        const cols = game.board.columns;
        // Vérifier toutes les positions initiales
        const occupiedPositions = new Set(game.initial?.cells.map(c => `${c.position.row},${c.position.column}`) || []);
        if (game.rules?.move) {
            // Vérifier que les coordonnées testées sont dans le plateau
            for (const cell of game.initial?.cells || []) {
                const r = cell.position.row;
                const c = cell.position.column;
                if (r < 1 || r > rows || c < 1 || c > cols) {
                    accept('error', `Position (${r},${c}) en dehors du plateau`, { node: cell });
                }
            }
            // Vérifier qu’il n’y a pas de doublon
            if (occupiedPositions.size < (game.initial?.cells.length || 0)) {
                accept('error', 'Il y a des positions initiales dupliquées.', { node: game.initial });
            }
        }
    }
}
//# sourceMappingURL=othello-validator.js.map