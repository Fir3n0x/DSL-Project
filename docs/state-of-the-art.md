### Références pertinentes + tableau
| Name | Category | Lang/Runtime | License | Game families | Rules expressivity | Variability | Interop | Maturity | URL |

|------|-----------|---------------|----------|----------------|--------------------|--------------|----------|-----------|
| OthelloGPT (Neel Nanda) | AI / interpretability | Python | MIT | Othello | Moyen (état fixe) | Run-time | N/A | Active (2024) | [neelnanda.io](https://www.neelnanda.io/mechanistic-interpretability/othello) |
| Rule DSL (GUPEA Thesis) | DSL / Rules | Java / ANTLR | Open | Multi-games | Haute (état / contraintes) | Compile-time | XML | Stable | [gupea link](https://gupea.ub.gu.se/bitstream/handle/2077/66884/gupea_2077_66884_1.pdf) |
| Game Description Language (GDL) | DSL / AI | Prolog-like | Open | Multi-games | Haute | Compile-time | OpenAI Gym | Mature | [arxiv link](https://arxiv.org/html/2506.22609v1) |
| Boardgame DSL (UTwente) | DSL / Simulation | Kotlin | Open | Strategy | Moyenne | Compile-time | JSON | Expérimental | [utwente](https://essay.utwente.nl/fileshare/file/79157/Schroten_BA_ewi.pdf) |
| OpenSpiel | Framework | C++ / Python | Apache 2.0 | Multi | Haute | Run-time | GDL / Py | Très actif | [github.com/deepmind/open_spiel](https://github.com/google-deepmind/open_spiel) |


### Note d’originalité

Axes d’innovation proposés :

Langage centré sur la paramétrisation des variantes d’un même jeu
→ Permet de définir plusieurs variantes d’Othello à partir d’un même modèle (taille du plateau, règles de capture, objectifs).

Génération automatique du moteur de jeu à partir du DSL
→ L’interpréteur Langium produit directement un moteur JavaScript exécutable pour simuler la partie.

Support de la variabilité statique et dynamique
→ Les paramètres peuvent être figés à la compilation (CT) ou modifiés à l’exécution (RT), pour explorer facilement de nouvelles règles.