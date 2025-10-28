import type { ValidationAcceptor } from 'langium';
import type { Game } from '../out/generated/ast.js';
import type { OthelloServices } from './othello-module.js';
/**
 * Register custom validation checks.
 */
export declare function registerValidationChecks(services: OthelloServices): void;
/**
 * Implementation of custom validations.
 */
export declare class OthelloValidator {
    checkBoardSize(game: Game, accept: ValidationAcceptor): void;
    checkTimer(game: Game, accept: ValidationAcceptor): void;
    checkPlayers(game: Game, accept: ValidationAcceptor): void;
    checkNumberInitialPositions(game: Game, accept: ValidationAcceptor): void;
    checkMoveValidity(game: Game, accept: ValidationAcceptor): void;
}
