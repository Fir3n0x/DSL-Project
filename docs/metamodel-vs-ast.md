### Metamodel vs AST

Table de correspondance métamodèle ↔ AST Langium

| Concept du métamodèle UML | Élément AST (TypeScript)         | Type                          | Cardinalité | Commentaire / Arbitrage                                          |
| ------------------------- | -------------------------------- | ----------------------------- | ----------- | ---------------------------------------------------------------- |
| **Game**                  | `Game`                           | Node principal (`entry rule`) | 1           | Représente la racine du programme. Contient tous les sous-blocs. |
| `name`                    | `name: string`                   | Attribut                      | 1           | Nom du jeu, issu du terminal `ID`.                               |
| `compileTime`             | `compileTime?: CompileTimeBlock` | Containment                   | 0..1        | Bloc optionnel, créé seulement si présent dans le code.          |
| `runTime`                 | `runTime?: RunTimeBlock`         | Containment                   | 0..1        | Bloc optionnel similaire.                                        |
| `ui`                      | `ui?: UIBlock`                   | Containment                   | 0..1        | Contient le thème et la disposition du plateau.                  |
| `board`                   | `board: Board`                   | Containment                   | 1           | Dimensions du plateau (rows × columns).                          |
| `players`                 | `players: Players`               | Containment                   | 1           | Deux instances : black et white.                                 |
| `initial`                 | `initial: Initial`               | Containment                   | 1           | Liste d’affectations de cellules.                                |
| `position`                | `position: Position`             | Containment                   | 1           | Position initiale de référence (souvent ignorée en runtime).     |
| `rules`                   | `rules: Rules`                   | Containment                   | 1           | Règles du jeu, structure hiérarchique.                           |


Sous-blocs

| Concept UML          | AST Node           | Champs / sous-propriétés                                                                | Cardinalité | Commentaire                                                 |                                                   |
| -------------------- | ------------------ | --------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- | ------------------------------------------------- |
| **CompileTimeBlock** | `CompileTimeBlock` | `parameters: CTParameter[]`                                                             | 0..*        | Liste de paramètres statiques.                              |                                                   |
| **CTParameter**      | `CTParameter`      | `name: string`, `value: string`                                                         | 1           | Correspond à une ligne `param = value`.                     |                                                   |
| **RunTimeBlock**     | `RunTimeBlock`     | `parameters: RTParameter[]`                                                             | 0..*        | Même structure que compile-time.                            |                                                   |
| **RTParameter**      | `RTParameter`      | `name: string`, `value: string`                                                         | 1           | Paramètre dynamique (e.g. timer).                           |                                                   |
| **UIBlock**          | `UIBlock`          | `theme?: ThemeBlock`, `layout?: LayoutBlock`                                            | 0..1        | Fusion de deux concepts UI.                                 |                                                   |
| **ThemeBlock**       | `ThemeBlock`       | `name: string`, `sprites: SpriteDef[]`                                                  | 1 + 0..*    | Le champ `sprites` contient une liste clé/valeur.           |                                                   |
| **SpriteDef**        | `SpriteDef`        | `name: string`, `value: string`                                                         | 0..*        | Association nom → chemin du sprite.                         |                                                   |
| **LayoutBlock**      | `LayoutBlock`      | `rows: number`, `columns: number`, `left?: string`, `right?: string`, `scaling?: string | number`     | 0..1                                                        | Fusion des sous-blocs `grid`, `hands`, `scaling`. |
| **Board**            | `Board`            | `rows: number`, `columns: number`                                                       | 1           | Directement dérivé de la syntaxe `board NxM`.               |                                                   |
| **Players**          | `Players`          | `black: Player`, `white: Player`                                                        | 1           | Conteneur des deux joueurs.                                 |                                                   |
| **Player**           | `Player`           | `color: string`, `name: string`                                                         | 2           | `color` contraint aux littéraux `black                      | white`.                                           |
| **Initial**          | `Initial`          | `cells: CellAssign[]`                                                                   | 0..*        | Ensemble d’affectations de pions.                           |                                                   |
| **CellAssign**       | `CellAssign`       | `position: Position`, `color: string`                                                   | 1           | Position + couleur associée.                                |                                                   |
| **Position**         | `Position`         | `row: number`, `column: number`                                                         | 1           | Dérivé du pattern `(row,col)`.                              |                                                   |
| **Rules**            | `Rules`            | `move: MoveRule`, `end: EndRule`, `scoring: ScoringRule`                                | 1           | Ensemble des trois types de règles.                         |                                                   |
| **MoveRule**         | `MoveRule`         | `type?: string`, `condition: ConditionExpr`, `effect: string`                           | 1           | Grammaire spécifique pour capture et effet.                 |                                                   |
| **ConditionExpr**    | `ConditionExpr`    | `name: string`                                                                          | 1           | Représente un appel logique `captures_in_any_direction`.    |                                                   |
| **EffectExpr**       | `string`           | —                                                                                       | 1           | Simplifié : stocké sous forme de chaîne, pas de nœud dédié. |                                                   |
| **EndRule**          | `EndRule`          | `condition: ConditionExpr`                                                              | 1           | Condition de fin de partie.                                 |                                                   |
| **ScoringRule**      | `string`           | —                                                                                       | 1           | Littéral direct (`count_pieces_per_player`).                |                                                   |
