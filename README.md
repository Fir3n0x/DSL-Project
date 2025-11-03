# DSL-Project

## TP1

### Sous-domaine : Jeux de plateau à information parfaite
Périmètre : Définition et paramétrisation de jeux à tour de rôle en 1 vs 1, sans hasard ni information cachée (ex : Othello, Dames, Go simplifié).

Règles du jeu Othello :
Le jeu se joue sur un plateau de 8x8 cases. Deux joueurs, un avec des pions noirs et un avec des pions blancs, s'affrontent.

Le DSL permettra de :

Définir la taille et la forme du plateau (ex : 8x8, hexagonal, rectangulaire).

Décrire les règles de capture (encadrement, inversion, élimination).

Configurer les conditions de victoire (majorité, élimination, domination).

Gérer la séquence des tours et les contraintes de validité des coups.

Le but du langage est d’offrir un moyen concis d’expérimenter des variantes de jeux parfaits comme Othello, en permettant une génération automatique du moteur de règles.

Placement initial : Au début de la partie, quatre pions sont placés au centre du plateau, deux noirs et deux blancs, en diagonale :
<br>
B N
<br>
N B

Déroulement du jeu : Les joueurs placent à tour de rôle un pion de leur couleur sur une case vide du plateau. Le but est de "capturer" les pions adverses.

Capture des pions : Pour capturer des pions, le joueur doit placer son pion de manière à encadrer un ou plusieurs pions adverses entre son nouveau pion et un autre pion de sa couleur déjà présent sur le plateau. Les pions adverses ainsi encadrés sont alors retournés et changent de couleur, devenant de la couleur du joueur qui vient de jouer.
Les captures peuvent se faire horizontalement, verticalement ou en diagonale.
Un joueur doit obligatoirement capturer au moins un pion adverse à chaque coup. S'il ne peut pas faire de capture, il passe son tour.

Fin de la partie : La partie se termine lorsque :
Le plateau est entièrement rempli de pions.
Aucun des deux joueurs ne peut effectuer de mouvement valide (c'est-à-dire qu'aucun ne peut capturer de pions).

Décompte des points : Le joueur qui a le plus de pions de sa couleur sur le plateau à la fin de la partie est déclaré vainqueur.
L’état et l’objectif varient selon les variantes/contraintes



### Brouillon de grammaire (Langium)

Fichier .langium

```langium
grammar OthelloDsl

Model:
    'game' name=ID '{'
        board=Board
        rules+=Rule*
        victory=VictoryCondition
    '}';

Board:
    'board' sizeX=INT 'x' sizeY=INT shape=('square' | 'hex')?;

Rule:
    'rule' name=ID '{'
        'capture' captureType=('sandwich' | 'adjacent') ';'
        'mandatory' mandatory=BOOLEAN ';'
    '}';

VictoryCondition:
    'victory' condition=('most_tokens' | 'least_tokens' | 'no_moves');
```
Exemples de .dsl

```dsl
game Othello {
    board 8x8 square
    rule main {
        capture sandwich;
        mandatory true;
    }
    victory most_tokens
}
```

```dsl
game MiniOthello {
    board 4x4 square
    rule capture {
        capture sandwich;
        mandatory false;
    }
    victory most_tokens
}
```


### Métamodèle UML (PlantUML)

```PlantUML
@startuml
class Game {
  + name: String
  + rules: Rule[*]
  + board: Board
  + victory: VictoryCondition
}

class Board {
  + width: int
  + height: int
  + shape: Shape
}

class Rule {
  + name: String
  + captureType: CaptureType
  + mandatory: boolean
}

class VictoryCondition {
  + condition: String
}

enum Shape { square, hex }
enum CaptureType { sandwich, adjacent }

Game "1" --> "1" Board
Game "1" --> "*" Rule
Game "1" --> "1" VictoryCondition
@enduml
```

Mini-instances:<br>
1 - Othello (8x8, sandwich capture, most_tokens)<br>
2 - MiniOthello (4x4, no mandatory capture, most_tokens)



### Questions ouvertes

Quelle serait la meilleure représentation du plateau (matrice, graphes, coordonnées) pour la génération automatique ?

Comment gérer les conditions d’arrêt multiples (ex : pas de coup possible + plateau plein) ?

Quelle granularité de variabilité à l’exécution est réaliste (paramètres modifiables sans rechargement complet du jeu) ?

Faut-il prévoir une interopérabilité avec d’autres DSLs (ex : GDL, OpenSpiel) pour faciliter les comparaisons ?


## TP2

L’objectif du TP2 est de passer de la modélisation abstraite (métamodèle) à une syntaxe concrète opérationnelle à l’aide du framework Langium.

Notre DSL permet de décrire des jeux de plateau à information parfaite — et plus particulièrement le jeu Othello — tout en intégrant :

* des paramètres compile-time (CT) et run-time (RT),<br>
* une variabilité dans les règles et la structure du jeu,<br>
* et une description de l’apparence (UI / skin) directement dans le .dsl.

### Génération

Installation

```bash
npm install
```

Génération et build du langage

```bash
npm run langium:generate
npm run build
npm run langium:watch
```

Ces commandes:
* génèrent les fichiers nécessaires à Langium,<br>
* compilent le projet TypeScript,<br>
* préparent l’éditeur pour l’ouverture de fichiers .dsl.


Exécution et exploration

Les fichiers d’exemple se trouvent dans le dossier :

```bash
examples/
```

Chaque sous-dossier correspond à une variante d’un même jeu Othello.

### Variantes

Les notes relatifs à la variabilité du projet se trouve dans:
```bash
/docs/variability.md
```

De plus, les variantes sont disponibles dans le dossier:
```bash
/examples
```

### Validation

Les tests de validation (variabilité/contraintes/skin) se trouvent dans:
```bash
/lang/othello-langium/packages/language/src/othello-validator.ts
```

### Preview

La preview de la variante 1 de notre projet se trouve dans le dossier suivant:
```bash
/lang/othello-langium/examples/variant1/preview
```


## TP3

L'objectif du TP3 est de passer de la variante d'un jeu spécifiée dans notre DSL à une interface (pour le moment statique) textuelle out graphique générée automatiquement.

### Grammar Langium

Notre grammaire est disponible à deux endroits différents dans notre projet (comporant le même contenu):
```bash
/examples/othelloGrammar.langium
```
```bash
/lang/othello-langium/packages/language/src/othello.langium
```

### CLI

La partie CLI et les fichiers qui lui sont associés sont situés dans le dossier:
```bash
/lang/othello-langium/packages/cli
```

De plus, le backend (en html) de la variante 1 de notre projet se situe dans le dossier:
```bash
/lang/othello-langium/examples/variant1/preview
```

Les commandes utilisées pour la génération sont les suivantes:
```bash
DSL-Project/lang/othello-langium$ npx tsc (pour compiler les fichiers .ts en .js)


DSL-Project/lang/othello-langium$ node packages/cli/bin/cli.js generate ../../examples/variant1/variant1.othello --target=html --out=examples/variant1/preview
```

### Tests

Les fichiers de test se situent dans le dossier:
```bash
/lang/othello-langium/packages/language/test
```
