const { validationResult } = require('express-validator');
const PizzaService = require('../services/pizzasService');

function sendValidationErrors(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return true;
    }

    return false;
}

exports.create = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const { name, imageUrl, price } = req.body;
        const created = await PizzaService.create({ name, imageUrl, price });
        return res.status(201).json(created);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'A pizza with this name already exists' });
        }
        return next(err);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        return res.status(200).json(await PizzaService.findAll());
    } catch (err) {
        return next(err);
    }
};

exports.findOne = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const pizza = await PizzaService.findById(Number(req.params.id));
        if (!pizza) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(200).json(pizza);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const { name, imageUrl, price } = req.body;
        const updated = await PizzaService.update(Number(req.params.id), {
            name,
            imageUrl,
            price
        });

        if (!updated) return res.status(404).json({ error: 'Pizza not found' });
        return res.status(200).json(updated);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'A pizza with this name already exists' });
        }
        return next(err);
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const deleted = await PizzaService.delete(Number(req.params.id));
        if (deleted === 0) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
};

exports.getWithIngredients = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;
        return res.json(await PizzaService.getWithIngredients(Number(req.params.id)));
    } catch (err) {
        return next(err);
    }
};

exports.getCompositions = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;
        return res.json(await PizzaService.getCompositions(Number(req.params.id)));
    } catch (err) {
        return next(err);
    }
};

exports.addComposition = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;
        return res.status(201).json(await PizzaService.addComposition(
            Number(req.params.id), req.body.item_id
        ));
    } catch (err) {
        return next(err);
    }
};

exports.deleteCompositions = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;
        await PizzaService.deleteCompositions(Number(req.params.id));
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
};
