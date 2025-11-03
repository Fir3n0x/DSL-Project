# Variante 3 – Othello 16x16 (Carré, Min Score)

## Compile-time settings

- **boardType** : carré (square) — classique.  
- **scoreGoal** : minimiser le score (min) — inversé par rapport au standard.  
- **allowDiagonal** : true — les captures diagonales sont autorisées (classique).  
- **initialPosition** : dynamique (dynamic) — la position initiale peut varier ou être générée au hasard.  

## Run-time settings

- **theme** : clair (light).  
- **showHints** : activé (true) — l’interface peut montrer des coups possibles.  
- **timer** : 20 secondes par coup — moins de temps que les variantes précédentes.
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
