# Variante 1 - Othello 8x8 (Carré, Max Score)

## Compile-time settings

- **boardType** : carré (square) — classique.  
- **scoreGoal** : maximiser le score (max) — standard.  
- **allowDiagonal** : true — les captures diagonales sont autorisées (classique).  
- **initialPosition** : statique (static) — position initiale définie explicitement.  

## Run-time settings

- **theme** : sombre (dark).  
- **showHints** : activé (true) — l’interface peut montrer des coups possibles.  
- **timer** : 30 secondes par coup — ajoute une contrainte de temps.
- **allowUndo** : false — les joueurs ne peuvent pas annuler leurs coups.
- **soundEnabled** : true — pas de sons pendant le jeu.

## Joueurs

- Noir : Alice  
- Blanc : Bob  

## Position initiale

Même configuration classique :  

- Blanc : (4,4), (5,5)  
- Noir : (4,5), (5,4)  

## Règles du jeu

- **Type de coup** : placement d'un pion  
- **Validation** : coup valide si capture d'un ou plusieurs autres pions dans n’importe quelle direction (`captures_in_any_direction(r,c)`)  
- **Effet** : retourner les pions capturés (`flip_captured_pieces(r,c)`)  
- **Fin de partie** : lorsque plus aucun coup ne permet une capture  
- **Score** : nombre de pions par joueur (`count_pieces_per_player`)
