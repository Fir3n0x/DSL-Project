# Variante 2 - Othello 8x8 (Carré, Min Score)

## Compile-time settings

- **boardType** : carré (square) — classique.
- **scoreGoal** : minimiser le score (min) — inversé par rapport au standard.
- **allowDiagonal** : true — les captures diagonales sont autorisées (classique).
- **initialPosition** : dynamique (dynamic) — la position initiale peut varier ou être générée au hasard.

## Run-time settings

- **theme** : sombre (dark).
- **showHints** : activé (true) — l’interface peut montrer des coups possibles.
- **timer** : 45 secondes par coup — plus de temps que la Variante 1.

## UI / Interface

**Thème** : retro avec sprites personnalisés  

- noir : assets/black.png  
- blanc : assets/white.png  
- plateau : assets/board8x8.png  

**Layout** :  

- Grille 8x8  
- Affichage mains : noir à gauche et blanc à droite  
- Redimensionnement automatique (fit)  

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
