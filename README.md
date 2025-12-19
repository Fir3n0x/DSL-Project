# DSL OTHELLO

## 1 -Project Overview
This project is a Domain-Specific Language (DSL) built with **Langium**. It allows users to generate and play games in different modes, including Human vs AI, Human vs LLM, and AI/LLM vs AI/LLM. The system supports both visual (HTML/JS) and headless evaluation modes. The DSL programs define game rules, initial board setups, and AI strategies. This project demonstrates the integration of language engineering, AI reasoning, and interactive gameplay.

![Screenshot or GIF of the project in action](./media/screenshot.gif)

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
```

2. Run games

```bash
python3 packages/backends/server/server.py
```
Browse given link to access games and variants.
All configurations are available on the web user interface.

3. Environment Variables

*OPENROUTER_API_KEY* required for LLM integration.

---

## 4 - Grammar & metamodel

```bash
./model/metamodel.puml
./lang/othello-langium/packages/language/src/othello.langium
---

## 5 - AIs (rule/heuristic/LLM)

---

## 6 - LLM protocol

---

## 7 - Mini-evaluation

---

## 8 - Unsupported features / limitations

** Board types beyond square/circle not supported.
** Complex multi-player games not handled.
** LLM AI can occasionally propose illegal moves.

---

## 9 - Lessons learned

** Langium simplifies DSL parsing and validation.
** LLM integration requires careful move validation.
** Designing a mapping between logical board and DOM is critical for non-rectangular boards.

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