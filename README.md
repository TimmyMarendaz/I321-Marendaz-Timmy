# Foodtruck — Étape 05

Deux microservices indépendants, conformément aux
[consignes de l'étape 05](https://jithurbide-cpnv.github.io/I321-2026/laboratoires/projet-foodtruck/etape-05-deux-micro-services-independants/).

| Microservice | Port | Base SQLite | Ressource |
| --- | --- | --- | --- |
| `ms-ingredients` | 3001 | `ms-ingredients/ingredients.sqlite` | `/api/ingredients` |
| `ms-pizzas` | 3000 | `ms-pizzas/pizzas.sqlite` | `/api/pizzas` |

Chaque dossier possède son serveur, sa configuration et ses dépendances.
Le service pizzas ne contient aucune table ni entité Ingredient : il communique
avec le service ingrédients par HTTP via `INGREDIENTS_SERVICE_URL`.
Les CRUD restent utilisables indépendamment ; seuls l'ajout d'une composition et
la lecture détaillée d'une pizza composée nécessitent le service ingrédients.

## Installation et lancement

Node.js 18 ou plus récent.

À la racine :

```bash
npm ci
```

Copier le `.env.example` de chaque microservice vers un `.env` dans le même
dossier si vous souhaitez modifier les valeurs par défaut.

Démarrer dans deux terminaux :

```bash
npm run start:ingredients
```

```bash
npm run start:pizzas
```

Pour démarrer un seul service sur un autre nœud : copier son dossier, puis
`npm install` et `npm start` dans ce dossier. Dans `ms-pizzas/.env`,
configurer `INGREDIENTS_SERVICE_URL` avec l'adresse du serveur ingrédients
(par exemple `http://192.168.1.10:3001`).

`DB_FILE` est résolu à partir du dossier du microservice, même si le lancement
se fait depuis la racine. Aucun fichier SQLite n'est partagé entre les services.

## API et documentation

Les deux services gardent les routes CRUD :
`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
sous leur ressource. L'alias `/api/v1` reste disponible.

- Swagger pizzas : <http://localhost:3000/docs>
- Swagger ingrédients : <http://localhost:3001/docs>
- Spécification JSON : `/docs/swagger.json` sur chaque serveur.

Créer un ingrédient sur le port 3001, avec `POST /api/ingredients` :

```json
{ "name": "Mozzarella", "price": 2 }
```

Créer une pizza sur le port 3000, avec `POST /api/pizzas` :

```json
{ "name": "Margherita", "imageUrl": "https://example.com/pizza.png", "price": 12 }
```

Le texte `ingredients` a été retiré du modèle Pizza. La composition se gère
avec les routes suivantes, sur le serveur pizzas :

| Méthode | Route | Action |
| --- | --- | --- |
| POST | `/api/pizzas/:id/compositions` | Ajoute un ingrédient après validation HTTP |
| GET | `/api/pizzas/:id/compositions` | Liste les associations locales |
| DELETE | `/api/pizzas/:id/compositions` | Retire toutes les associations |
| GET | `/api/pizzas/:id/full` | Retourne la pizza et les ingrédients obtenus par HTTP |

Corps de l'ajout (utiliser un identifiant existant retourné par le service ingrédients) :

```json
{ "item_id": 1 }
```

La table `product_compositions` contient `id`, `product_id` (pizza locale),
`item_id` (ingrédient distant) et `created_at`. Une contrainte UNIQUE interdit
les doublons. La clé étrangère locale supprime les compositions lorsque la pizza
est supprimée. Aucune clé étrangère ne traverse les deux bases.

Un ingrédient inexistant lors de l'ajout produit HTTP 400, un doublon HTTP 409,
une pizza absente HTTP 404 et un service ingrédients indisponible HTTP 503
(délai maximal de 5 secondes). Les modifications du catalogue sont visibles
sur `/full`. Si un ingrédient associé a ensuite été supprimé, cette lecture
retourne HTTP 404 ; retirer les compositions permet de corriger les références.

## Tests

```bash
npm test -- --runInBand
```

Les tests démarrent deux serveurs HTTP avec deux bases en mémoire et vérifient
les CRUD, l'isolation des routes et des tables, la documentation, les compositions,
les erreurs distantes et la suppression des associations.

Les diagrammes dans `docs/` conservent la modélisation historique de l'étape 04.
