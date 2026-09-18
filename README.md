# Foodtruck API — I321

Projet Foodtruck : API des étapes 02–03 et modélisation de l'étape 04.

## Étape 04 — Lier les pizzas et les ingrédients

La [consigne de modélisation](https://jithurbide-cpnv.github.io/I321-2026/laboratoires/projet-foodtruck/etape-04-lier-deux-ressources-pizzas-et-ingredients/modelisation/)
demande trois diagrammes PlantUML. Ils décrivent le modèle cible ; l'API exécutable
et sa base restent à l'étape 03. Les exemples d'API ci-dessous correspondent à cette
version existante.

| Livrable | Source PlantUML | Aperçu |
| --- | --- | --- |
| Diagramme de classes | [class_diagram.puml](docs/class_diagram.puml) | [SVG](docs/rendered/class_diagram.svg) |
| Modèle logique de données | [logical_data_model.puml](docs/logical_data_model.puml) | [SVG](docs/rendered/logical_data_model.svg) |
| Séquence de création d'une pizza | [sequence-pizza.puml](docs/sequence-pizza.puml) | [SVG](docs/rendered/sequence-pizza.svg) |

Le modèle reprend les cardinalités `1..*` de l'énoncé de chaque côté : une pizza
contient au moins un ingrédient et un ingrédient peut être partagé entre plusieurs
pizzas. La table `pizza_ingredients` porte les deux clés étrangères et une clé
primaire composée, qui interdit les associations en double. Les cardinalités
minimales sont des règles métier : les clés étrangères seules ne les garantissent
pas. Un ingrédient nouvellement saisi dans le catalogue peut être en attente de son
affectation ; les diagrammes décrivent les compositions finalisées.

### Contrat proposé pour la future création d'une pizza

Tous les champs suivants sont obligatoires dans le modèle cible. `ingredients`
contient des identifiants existants, entiers positifs et distincts ; le tableau
contient au moins un élément. `name` est une chaîne non vide, `imageUrl` une URL
et `price` un nombre strictement positif.

```json
{
  "name": "Margherita",
  "imageUrl": "https://example.com/margherita.png",
  "price": 12,
  "ingredients": [1, 2]
}
```

Les identifiants `1` et `2` sont illustratifs et devront exister dans le catalogue.
Le prix de la pizza reste fourni explicitement ; aucun calcul de prix n'est imposé
par cet exercice.

| Critère d'acceptation | Traitement représenté dans la séquence |
| --- | --- |
| Paramètre manquant ou de mauvais type | `ValidationError`, réponse HTTP 400 avant toute écriture |
| Ingrédient inexistant | `IngredientNotFoundError`, réponse HTTP 400 avec les IDs manquants |
| Nom de pizza déjà utilisé | Contrainte UNIQUE, annulation de la transaction et `PizzaNameAlreadyExistsError`, HTTP 409 |
| Dialogue entre ressources | `pizzasController` appelle `ingredientsController.requireExisting()` ; seul ce dernier accède à l'entité `Ingredient` |

Les noms de méthodes et les codes HTTP ci-dessus sont les choix de conception
proposés ; ils ne sont pas encore implémentés. La création d'une pizza et de ses
associations forme une seule transaction : un échec annule l'ensemble. Les clés
étrangères protègent aussi contre la suppression concurrente d'un ingrédient entre
sa vérification et son association. Supprimer une pizza supprime ses liens ;
supprimer un ingrédient encore utilisé est refusé.

Pour régénérer les aperçus avec PlantUML (Java 11 ou plus récent) :

```bash
java -jar plantuml.jar -charset UTF-8 -tsvg -o rendered docs/class_diagram.puml docs/logical_data_model.puml docs/sequence-pizza.puml
```

## Fonctionnalités

- CRUD complet des pizzas
- CRUD complet des ingrédients
- SQLite comme couche de données
- Validation des entrées avec `express-validator`
- Documentation Swagger disponible dans le navigateur
- Les ingrédients sont encore indépendants des pizzas, conformément à l'étape 03

## Installation

```bash
npm install
```

Copier `.env.example` vers `.env` si nécessaire :

```env
PORT=3000
DB_FILE=./dev.sqlite
NODE_ENV=development
```

## Démarrage

```bash
npm start
```

Mode développement :

```bash
npm run dev
```

## URLs

- API : `http://localhost:3000/api`
- Swagger : `http://localhost:3000/docs`
- JSON Swagger : `http://localhost:3000/docs/swagger.json`

## Routes Pizzas

- `GET /api/pizzas`
- `POST /api/pizzas`
- `GET /api/pizzas/:id`
- `PUT /api/pizzas/:id`
- `DELETE /api/pizzas/:id`

Exemple de pizza :

```json
{
  "name": "Margherita",
  "ingredients": "Sauce tomate, mozzarella",
  "imageUrl": "https://picsum.photos/200",
  "price": 12
}
```

## Routes Ingredients

- `GET /api/ingredients`
- `POST /api/ingredients`
- `GET /api/ingredients/:id`
- `PUT /api/ingredients/:id`
- `DELETE /api/ingredients/:id`

Exemple d'ingrédient :

```json
{
  "name": "Champignons",
  "price": 1
}
```

## Structure

```text
src/
├── app.js
├── server.js
├── config/
│   ├── database.js
│   └── swagger.js
├── ingredients/
│   ├── Ingredient.js
│   ├── ingredientsController.js
│   └── ingredientsRouter.js
├── pizzas/
│   ├── Pizza.js
│   ├── pizzasController.js
│   └── pizzasRouter.js
└── routes/
    └── router.js
```

Chaque ressource regroupe sa couche présentation (`*Router.js`), sa logique
métier (`*Controller.js`) et son accès aux données (`Ingredient.js` ou `Pizza.js`).
Le serveur, l'application, la connexion SQLite et la configuration Swagger sont
communs. Le routeur principal monte les deux ressources sous `/api`.

Les fichiers `src/routes/users.js` et `src/controllers/usercontroller.js` sont
des exemples du squelette initial, non utilisés par l'API Foodtruck.

## Tests

```bash
npm test -- --runInBand
```

Les tests utilisent une base SQLite en mémoire et vérifient les routes CRUD,
la validation, les erreurs, l'indépendance des pizzas et la documentation Swagger.
Ils ne modifient pas `dev.sqlite`.
