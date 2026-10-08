const { validationResult } = require('express-validator');
const Ingredient = require('./Ingredient');

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

        const { name, price } = req.body;
        const created = await Ingredient.create({ name, price });
        return res.status(201).json(created);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'An ingredient with this name already exists' });
        }
        return next(err);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        return res.status(200).json(await Ingredient.findAll());
    } catch (err) {
        return next(err);
    }
};

exports.findOne = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const ingredient = await Ingredient.findById(Number(req.params.id));
        if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });

        return res.status(200).json(ingredient);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const { name, price } = req.body;
        const updated = await Ingredient.update(Number(req.params.id), { name, price });

        if (!updated) return res.status(404).json({ error: 'Ingredient not found' });
        return res.status(200).json(updated);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'An ingredient with this name already exists' });
        }
        return next(err);
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const deleted = await Ingredient.delete(Number(req.params.id));
        if (deleted === 0) return res.status(404).json({ error: 'Ingredient not found' });

        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
};
