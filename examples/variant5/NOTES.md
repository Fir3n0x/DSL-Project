# Variante 5 – Othello 8x8 (Hexagone, Max Score)

## Compile-time settings

- **boardType** : hexagone (hexagon) — forme du plateau différente.  
- **scoreGoal** : maximiser le score (max) — standard.  
- **allowDiagonal** : true — les captures diagonales sont autorisées (classique).  
- **initialPosition** : dynamique (dynamic) — la position initiale peut varier ou être générée au hasard.  

## Run-time settings

- **theme** : clair (light).  
- **showHints** : activé (true) — l’interface peut montrer des coups possibles.  
- **timer** : 30 secondes par coup — temps standard.  

## UI / Interface

**Thème** : retro avec sprites personnalisés  

- noir : assets/black.png  
- blanc : assets/white.png  
- plateau : assets/board16x16.png  

**Layout** :  

- Grille 8x8  
- Affichage Mains : noir à gauche et blanc à droite  
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
