
### Variabilité

| Paramètre            | Type (CT/RT) | Domaine de valeurs          | Valeur par défaut | Contraintes                   |
| -------------------- | ------------ | --------------------------- | ----------------- | ----------------------------- |
| Taille du plateau    | CT           | {4x4, 6x6, 8x8, 10x10}      | 8x8               | carré uniquement              |
| Forme du plateau     | CT           | {square, hex}               | square            | cohérence taille              |
| Règle de capture     | RT           | {sandwich, adjacent}        | sandwich          | au moins une capture possible |
| Objectif de victoire | CT           | {most_tokens, least_tokens} | most_tokens       | -                             |
| Vitesse de jeu       | RT           | {1..3 coups/tour}           | 1                 | -                             |

Presets :

-Classic : 8x8, sandwich, most_tokens
-Mini : 4x4, adjacent, most_tokens
-Rapid : 8x8, sandwich, 2 coups/tour