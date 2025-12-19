# DSL OTHELLO

## 1 -Project Overview
This project is a Domain-Specific Language (DSL) built with **Langium**. It allows users to generate and play games in different modes, including Human vs Human, Human vs AI, AI vs AI and Human vs LLM. The system supports both visual (HTML/JS) and headless evaluation modes. The DSL programs define game rules, initial board setups, and AI strategies. This project demonstrates the integration of language engineering, AI reasoning, and interactive gameplay.

![Screenshot home project](./media/home.png)
![Screenshot variant 1 project](./media/variant1.png)
![Screenshot variant 5 project](./media/variant5.png)

---

## 2 - Representative DSL Programs
Here are a few examples of DSL programs and what they do:

```dsl
# Example 1: Standard 8x8 Othello game
board 8x8
initial {
  cells {
    (4,4) white
    (4,5) black
    (5,4) black
    (5,5) white
  }
}
rules {
  move: placement
  scoring: count_pieces
}
```
*Explanation*: This program initializes a standard Othello board and sets the move and scoring rules.

```dsl
# Example 2: Custom circular board
board circle radius 4
initial {
  cells {
    (2,3) black
    (3,4) white
  }
}
```
*Explanation*: This program generates a circular board variant where only cells within the radius are playable.

---

## 3 - How to run

1. Install dependencies

```bash
cd lang/othello-langium/
npm install
```

2. Generation and build

```bash
npm run langium:generate
npm run build
npm run test
```

Running the tests will also generate all the different variants in `examples/`.

2. Run games

```bash
python3 packages/backends/server/server.py
```
Browse given link to access games and variants.
All configurations are available on the web user interface.

3. Environment Variables

*OPENROUTER_API_KEY* required for LLM integration. This key must be written in a `.env` file at the root of the `lang/othello-langium/` folder.

---

## 4 - Grammar & metamodel

```bash
./model/metamodel.puml
./lang/othello-langium/packages/language/src/othello.langium
```

---

## 5 - AIs (rule/heuristic/LLM)

### 1. Minimax (Algorithmic)
- Implementation: Standard Minimax algorithm with fixed depth (2 or 3 depending on board size).

- Strengths: Fast, rules-compliant, plays strategically optimal moves for short horizons.

- Weaknesses: Horizon effect, predictable.

### 2. LLM Agent (OpenRouter/GPT-4o)
- Implementation: Sends the board state as an ASCII string to an LLM via OpenRouter.

- Strengths: Can "reason" about the board, provides textual explanations for moves.

- Weaknesses: Slower, occasional "hallucinations" (illegal moves), cost per token.

- Failure Handling: If the LLM proposes an illegal move, the system rejects it and falls back to Minimax (hybrid approach).

---

## 6 - LLM protocol

To ensure consistent gameplay, we use a strict protocol for LLM communication.

### Input Context:

- System Prompt: "You are an expert Othello player..."

- Board Representation: ASCII Grid.

- Legal Moves: List of algebraic coordinates (e.g. [C3, D4]).

### Output Schema (JSON):
```json
{
  "reasoning": "Placing here flips the diagonal line...",
  "move": "C3"
}
```

The logs of all LLM interactions are saved in `lang/othello-langium/packages/backends/llm/data/eval/logs/`.

### Reproducibility:

- Model: openai/gpt-4o

- Temperature: 0.2 (Low randomness for stability)

- Seed: Optional (for testing).

---

## 7 - Mini-evaluation

---

## 8 - Unsupported features / limitations

* Board types beyond square/circle not supported.
* Complex multi-player games not handled.
* LLM AI can occasionally propose illegal moves.
* Only standard "no moves left" or "board full" conditions are robustly supported.
* Waiting for the API response can take 2-5 seconds, which breaks the flow of fast-paced games.

---

## 9 - Lessons learned

* Langium simplifies DSL parsing and validation.
* LLM integration requires careful move validation.
* Designing a mapping between logical board and DOM is critical for non-rectangular boards.
* Separating the Model (DSL) from the View (HTML) and Controller (Python) was crucial. It allowed us to change the backend logic without rewriting the parser.

---

## 10 - Resources

```bash
./Old-README/README.md
./docs/metamodel-vs-ast.md
./docs/services-notes.md
./docs/state-of-the-art.md
./docs/variability.md
```

---
