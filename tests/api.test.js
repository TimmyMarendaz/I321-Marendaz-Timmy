process.env.DB_FILE = ':memory:';

const pizzaApp = require('../ms-pizzas/src/app');
const ingredientApp = require('../ms-ingredients/src/app');
const pizzaDb = require('../ms-pizzas/src/config/database');
const ingredientDb = require('../ms-ingredients/src/config/database');

const servers = {};
const baseUrls = {};

function run(db, sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => err ? reject(err) : resolve());
    });
}

async function request(method, path, body, resource = path.includes('/ingredients') ? 'ingredients' : 'pizzas') {
    const response = await fetch(`${baseUrls[resource]}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    return {
        status: response.status,
        body: response.headers.get('content-type')?.includes('application/json')
            ? JSON.parse(text) : text
    };
}

beforeAll(async () => {
    for (const [resource, app] of Object.entries({ ingredients: ingredientApp, pizzas: pizzaApp })) {
        servers[resource] = await new Promise((resolve) => {
            const server = app.listen(0, '127.0.0.1', () => resolve(server));
        });
        baseUrls[resource] = 'http://127.0.0.1:' + servers[resource].address().port;
    }
    process.env.INGREDIENTS_SERVICE_URL = baseUrls.ingredients;
});

beforeEach(async () => {
    await run(pizzaDb, 'DELETE FROM pizzas');
    await run(ingredientDb, 'DELETE FROM ingredients');
});

afterAll(async () => {
    for (const server of Object.values(servers)) {
        await new Promise((resolve, reject) => {
            server.close((err) => err ? reject(err) : resolve());
            server.closeAllConnections();
        });
    }
    for (const database of [pizzaDb, ingredientDb]) {
        await new Promise((resolve, reject) => {
            database.close((err) => err ? reject(err) : resolve());
        });
    }
});

describe.each(['ingredients', 'pizzas'])('%s', (resource) => {
    const path = `/api/${resource}`;

    test('crée, liste, lit, modifie et supprime une ressource', async () => {
        expect(await request('GET', path)).toEqual({ status: 200, body: [] });

        const created = await request('POST', path, { name: 'Champignons', price: 2 });
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({
            id: expect.any(Number), name: 'Champignons', price: 2,
            created_at: expect.any(String), updated_at: expect.any(String)
        });
        const itemPath = `${path}/${created.body.id}`;
        expect(await request('GET', itemPath)).toEqual({ status: 200, body: created.body });

        const second = await request('POST', path, { name: 'Oignons', price: 1 });
        expect(second.status).toBe(201);
        const list = await request('GET', path);
        expect(list.body.map((item) => item.id)).toEqual([second.body.id, created.body.id]);

        const updated = await request('PUT', itemPath, { name: 'Lardons', price: 3 });
        expect(updated.status).toBe(200);
        expect(updated.body).toMatchObject({ id: created.body.id, name: 'Lardons', price: 3 });
        expect((await request('GET', itemPath)).body).toEqual(updated.body);
        expect(await request('DELETE', itemPath)).toEqual({ status: 204, body: '' });
        expect((await request('GET', itemPath)).status).toBe(404);
        expect((await request('PUT', itemPath, { name: 'Absent', price: 1 })).status).toBe(404);
        expect((await request('DELETE', itemPath)).status).toBe(404);
    });

    test.each([
        { name: '', price: 1 },
        { name: '   ', price: 1 },
        { name: 'Test', price: -1 },
        { name: 'Test' },
        { price: 1 }
    ])('rejette les données invalides : %j', async (body) => {
        expect((await request('POST', path, body)).status).toBe(400);
        expect((await request('PUT', `${path}/1`, body)).status).toBe(400);
        expect((await request('GET', path)).body).toEqual([]);
    });

    test('rejette les identifiants invalides', async () => {
        for (const id of ['abc', '0', '-1', '1.5']) {
            for (const method of ['GET', 'PUT', 'DELETE']) {
                expect((await request(method, `${path}/${id}`, method === 'PUT'
                    ? { name: 'Test', price: 1 } : undefined)).status).toBe(400);
            }
        }
    });

    test('rejette les doublons à la création et à la modification', async () => {
        await request('POST', path, { name: 'Unique', price: 1 });
        expect((await request('POST', path, { name: 'Unique', price: 2 })).status).toBe(409);
        const other = await request('POST', path, { name: 'Autre', price: 1 });
        expect((await request('PUT', `${path}/${other.body.id}`, { name: 'Unique', price: 2 })).status).toBe(409);
        expect((await request('GET', `${path}/${other.body.id}`)).body.name).toBe('Autre');
    });
});

test('conserve les alias /api/v1', async () => {
    for (const resource of ['ingredients', 'pizzas']) {
        await request('POST', `/api/${resource}`, { name: 'Test', price: 1 });
        expect(await request('GET', `/api/v1/${resource}`)).toEqual(await request('GET', `/api/${resource}`));
    }
});

test.each(['ingredients', 'pizzas'])('Swagger documente uniquement le service %s', async (resource) => {
    const response = await request('GET', '/docs/swagger.json', undefined, resource);
    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths['/api/' + resource]).sort()).toEqual(['get', 'post']);
    expect(Object.keys(response.body.paths['/api/' + resource + '/{id}']).sort()).toEqual(['delete', 'get', 'put']);
    const other = resource === 'pizzas' ? 'ingredients' : 'pizzas';
    expect(response.body.paths['/api/' + other]).toBeUndefined();
    if (resource === 'pizzas') {
        expect(Object.keys(response.body.paths['/api/pizzas/{id}/compositions']).sort()).toEqual(['delete', 'get', 'parameters', 'post']);
        expect(response.body.paths['/api/pizzas/{id}/full'].get).toBeDefined();
    }
    const ui = await request('GET', '/docs/', undefined, resource);
    expect(ui.status).toBe(200);
    expect(ui.body).toContain('swagger-ui');
});

function query(database, sql) {
    return new Promise((resolve, reject) => {
        database.all(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
    });
}

test('chaque serveur expose uniquement sa ressource et possède ses propres tables', async () => {
    expect((await request('GET', '/api/ingredients', undefined, 'pizzas')).status).toBe(404);
    expect((await request('GET', '/api/pizzas', undefined, 'ingredients')).status).toBe(404);
    const tables = (rows) => rows.map((row) => row.name).sort();
    expect(tables(await query(pizzaDb, "SELECT name FROM sqlite_master WHERE type = 'table' AND name != 'sqlite_sequence'")))
        .toEqual(['pizzas', 'product_compositions']);
    expect(tables(await query(ingredientDb, "SELECT name FROM sqlite_master WHERE type = 'table' AND name != 'sqlite_sequence'")))
        .toEqual(['ingredients']);
    expect((await query(pizzaDb, 'PRAGMA table_info(pizzas)')).map((column) => column.name))
        .not.toContain('ingredients');
});

test('ajoute, liste, résout par HTTP et retire les compositions', async () => {
    const pizza = await request('POST', '/api/pizzas', { name: 'Margherita', price: 12 });
    const ingredient = await request('POST', '/api/ingredients', { name: 'Mozzarella', price: 2 });
    const path = '/api/pizzas/' + pizza.body.id;
    const composition = await request('POST', path + '/compositions', { item_id: ingredient.body.id });
    expect(composition.status).toBe(201);
    expect(composition.body).toMatchObject({
        id: expect.any(Number), product_id: pizza.body.id, item_id: ingredient.body.id
    });
    expect((await request('GET', path + '/compositions')).body).toEqual([composition.body]);
    expect((await request('GET', path + '/full')).body).toEqual({
        ...pizza.body, ingredients: [ingredient.body]
    });
    const updated = await request('PUT', '/api/ingredients/' + ingredient.body.id, {
        name: 'Mozzarella fraîche', price: 3
    });
    expect((await request('GET', path + '/full')).body.ingredients).toEqual([updated.body]);
    expect((await request('GET', path)).body).toEqual(pizza.body);
    expect((await request('DELETE', path + '/compositions')).status).toBe(204);
    expect((await request('GET', path + '/full')).body.ingredients).toEqual([]);
});

test('rejette les ingrédients inexistants, les doublons et les identifiants invalides', async () => {
    const pizza = await request('POST', '/api/pizzas', { name: 'Test', price: 12 });
    const ingredient = await request('POST', '/api/ingredients', { name: 'Tomate', price: 1 });
    const path = '/api/pizzas/' + pizza.body.id + '/compositions';
    for (const item_id of [0, -1, 'abc', '1', 1.5, null]) {
        expect((await request('POST', path, { item_id })).status).toBe(400);
    }
    expect((await request('POST', path, {})).status).toBe(400);
    expect((await request('POST', path, { item_id: 999999 })).status).toBe(400);
    expect((await request('GET', path)).body).toEqual([]);
    expect((await request('POST', path, { item_id: ingredient.body.id })).status).toBe(201);
    expect((await request('POST', path, { item_id: ingredient.body.id })).status).toBe(409);
    expect((await request('GET', path)).body).toHaveLength(1);
});

test('une pizza absente ou un identifiant de pizza invalide donne une erreur cohérente', async () => {
    for (const id of ['999999', 'abc', '0']) {
        const expected = id === '999999' ? 404 : 400;
        const path = '/api/pizzas/' + id;
        expect((await request('GET', path + '/full')).status).toBe(expected);
        expect((await request('GET', path + '/compositions')).status).toBe(expected);
        expect((await request('POST', path + '/compositions', { item_id: 1 })).status).toBe(expected);
        expect((await request('DELETE', path + '/compositions')).status).toBe(expected);
    }
});

test('supprimer une pizza supprime ses compositions sans supprimer les ingrédients', async () => {
    const pizza = await request('POST', '/api/pizzas', { name: 'Test', price: 12 });
    const ingredient = await request('POST', '/api/ingredients', { name: 'Tomate', price: 1 });
    const path = '/api/pizzas/' + pizza.body.id;
    await request('POST', path + '/compositions', { item_id: ingredient.body.id });
    expect((await request('DELETE', path)).status).toBe(204);
    expect(await query(pizzaDb, 'SELECT * FROM product_compositions')).toEqual([]);
    expect((await request('GET', '/api/ingredients/' + ingredient.body.id)).status).toBe(200);
});

test('un ingrédient supprimé reste une référence distante et peut être retiré de la composition', async () => {
    const pizza = await request('POST', '/api/pizzas', { name: 'Test', price: 12 });
    const ingredient = await request('POST', '/api/ingredients', { name: 'Tomate', price: 1 });
    const path = '/api/pizzas/' + pizza.body.id;
    await request('POST', path + '/compositions', { item_id: ingredient.body.id });
    await request('DELETE', '/api/ingredients/' + ingredient.body.id);
    expect((await request('GET', path)).status).toBe(200);
    expect((await request('GET', path + '/compositions')).body).toHaveLength(1);
    expect((await request('GET', path + '/full')).status).toBe(404);
    expect((await request('DELETE', path + '/compositions')).status).toBe(204);
});

test('le CRUD pizzas reste utilisable lorsque le service ingrédients est indisponible', async () => {
    const pizza = await request('POST', '/api/pizzas', { name: 'Test', price: 12 });
    const ingredient = await request('POST', '/api/ingredients', { name: 'Tomate', price: 1 });
    const path = '/api/pizzas/' + pizza.body.id;
    await request('POST', path + '/compositions', { item_id: ingredient.body.id });
    const previousUrl = process.env.INGREDIENTS_SERVICE_URL;
    process.env.INGREDIENTS_SERVICE_URL = 'http://127.0.0.1:1';
    try {
        expect((await request('GET', path)).status).toBe(200);
        expect((await request('GET', '/api/pizzas')).status).toBe(200);
        expect((await request('PUT', path, { name: 'Autre', price: 15 })).status).toBe(200);
        expect((await request('GET', path + '/compositions')).status).toBe(200);
        expect((await request('POST', path + '/compositions', { item_id: ingredient.body.id })).status).toBe(503);
        expect((await request('GET', path + '/full')).status).toBe(503);
        expect((await request('DELETE', path)).status).toBe(204);
        expect((await request('POST', '/api/pizzas', { name: 'Nouvelle', price: 10 })).status).toBe(201);
    } finally {
        process.env.INGREDIENTS_SERVICE_URL = previousUrl;
    }
});
