# Variante 4 – Othello 16x16 (Cercle, Max Score)

## Compile-time settings

- **boardType** : cercle (circle) — change la forme du plateau.  
- **scoreGoal** : maximiser le score (max) — standard.  
- **allowDiagonal** : true — les captures diagonales sont autorisées (classique).  
- **initialPosition** : statique (static) — position initiale définie explicitement.  

## Run-time settings

- **theme** : clair (light).  
- **showHints** : activé (true) — l’interface peut montrer des coups possibles.  
- **timer** : 30 secondes par coup — temps intermédiaire entre les variantes précédentes.
- **allowUndo** : false — les joueurs ne peuvent pas annuler leurs coups.
- **soundEnabled** : true — pas de sons pendant le jeu.

## Joueurs

- Noir : Alice  
- Blanc : Bob  

## Position initiale

- Blanc : (8,8), (9,9)  
- Noir : (8,9), (9,8)  

## Règles du jeu

- **Type de coup** : placement d'un pion  
- **Validation** : coup valide si capture d'un ou plusieurs autres pions dans n’importe quelle direction (`captures_in_any_direction(r,c)`)  
- **Effet** : retourner les pions capturés (`flip_captured_pieces(r,c)`)  
- **Fin de partie** : lorsque plus aucun coup ne permet une capture  
- **Score** : nombre de pions par joueur (`count_pieces_per_player`)
