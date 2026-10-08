const Pizza = require('../pizzas/Pizza');

function httpError(status, message) {
    return Object.assign(new Error(message), { status });
}

async function requirePizza(id) {
    const pizza = await Pizza.findById(id);
    if (!pizza) throw httpError(404, 'Pizza not found');
    return pizza;
}

// Aucun import ni accès à la base de données du service ingrédients.
async function getIngredient(itemId, missingStatus = 400) {
    const baseUrl = (process.env.INGREDIENTS_SERVICE_URL || 'http://localhost:3001').replace(/\/$/, '');
    let response;
    try {
        response = await fetch(baseUrl + '/api/ingredients/' + itemId, {
            signal: AbortSignal.timeout(5000)
        });
    } catch {
        throw httpError(503, 'Ingredients service unavailable');
    }

    if (response.status === 404) {
        throw httpError(missingStatus, 'Ingredient ' + itemId + ' not found');
    }
    if (!response.ok) throw httpError(503, 'Ingredients service unavailable');

    try {
        return await response.json();
    } catch {
        throw httpError(503, 'Invalid response from ingredients service');
    }
}

module.exports = {
    create: (pizza) => Pizza.create(pizza),
    findAll: () => Pizza.findAll(),
    findById: (id) => Pizza.findById(id),
    update: (id, pizza) => Pizza.update(id, pizza),
    delete: (id) => Pizza.delete(id),

    async getCompositions(id) {
        await requirePizza(id);
        return Pizza.findCompositions(id);
    },

    async addComposition(id, itemId) {
        await requirePizza(id);
        await getIngredient(itemId);
        try {
            return await Pizza.addComposition(id, itemId);
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
                throw httpError(409, 'This ingredient is already in the pizza');
            }
            // La pizza a pu être supprimée pendant l'appel HTTP.
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY')) {
                throw httpError(404, 'Pizza not found');
            }
            throw err;
        }
    },

    async deleteCompositions(id) {
        await requirePizza(id);
        return Pizza.deleteCompositions(id);
    },

    async getWithIngredients(id) {
        const pizza = await requirePizza(id);
        const compositions = await Pizza.findCompositions(id);
        const ingredients = await Promise.all(
            compositions.map((composition) => getIngredient(composition.item_id, 404))
        );
        return { ...pizza, ingredients };
    }
};
