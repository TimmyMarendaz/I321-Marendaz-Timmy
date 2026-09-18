process.env.DB_FILE = ':memory:';

const app = require('../src/app');
const db = require('../src/config/database');

let server;
let baseUrl;

function run(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => err ? reject(err) : resolve());
    });
}

async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
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
    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
    await run('DELETE FROM ingredients');
    await run('DELETE FROM pizzas');
});

afterAll(async () => {
    await new Promise((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve());
        server.closeAllConnections();
    });
    await new Promise((resolve, reject) => {
        db.close((err) => err ? reject(err) : resolve());
    });
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

test('les ingrédients restent indépendants du texte des pizzas', async () => {
    const ingredient = await request('POST', '/api/ingredients', { name: 'Tomate', price: 0 });
    expect(ingredient.status).toBe(201);
    const pizza = await request('POST', '/api/pizzas', {
        name: 'Margherita', ingredients: 'Tomate, mozzarella',
        imageUrl: 'https://example.com/pizza.png', price: 12
    });
    expect(pizza.status).toBe(201);
    await request('PUT', `/api/ingredients/${ingredient.body.id}`, { name: 'Sauce tomate', price: 1 });
    await request('DELETE', `/api/ingredients/${ingredient.body.id}`);
    expect((await request('GET', `/api/pizzas/${pizza.body.id}`)).body).toEqual(pizza.body);
});

test('conserve les alias /api/v1', async () => {
    for (const resource of ['ingredients', 'pizzas']) {
        await request('POST', `/api/${resource}`, { name: 'Test', price: 1 });
        expect(await request('GET', `/api/v1/${resource}`)).toEqual(await request('GET', `/api/${resource}`));
    }
});

test('Swagger documente les cinq opérations de chaque ressource', async () => {
    const response = await request('GET', '/docs/swagger.json');
    expect(response.status).toBe(200);
    for (const resource of ['ingredients', 'pizzas']) {
        expect(Object.keys(response.body.paths[`/api/${resource}`]).sort()).toEqual(['get', 'post']);
        expect(Object.keys(response.body.paths[`/api/${resource}/{id}`]).sort()).toEqual(['delete', 'get', 'put']);
    }
    const ui = await request('GET', '/docs/');
    expect(ui.status).toBe(200);
    expect(ui.body).toContain('swagger-ui');
});
