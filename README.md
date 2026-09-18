# Foodtruck API — I321

Projet réalisé pour les étapes 02 et 03 du laboratoire Foodtruck.

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
