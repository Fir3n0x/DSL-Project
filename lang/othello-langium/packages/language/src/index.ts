export {createOthelloServices} from './othello-module.js';
export * from './othello-validator.js';
export * from './generated/ast.js';
export * from './generated/grammar.js';
export * from './generated/module.js';

import { createOthelloServices } from "../../language/out/othello-module.js";
import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import { Game } from "./generated/ast.js";
// import { expect } from 'vitest';


const services = createOthelloServices(EmptyFileSystem);
const parse = parseHelper<Game>(services.Othello);

const document = await parse(`
game Othello {
  board 8 x 8

  players {
    black { id "B" }
    white { id "W" }
  }

  initial {
    cell(4,4) = W
    cell(5,5) = W
    cell(4,5) = B
    cell(5,4) = B
  }

  rules {
    move {
      type placement
      valid if captures_in_any_direction(r,c)
      effect flip_captured_stones(r,c)
    }

    end when captures_in_any_direction(r,c)
    scoring count_pieces_per_player
  }
}
`);

const model = document.parseResult.value;
// expect(model.players).toHaveLength(2);
console.log(`Parsed game with ${model.players} players.`);