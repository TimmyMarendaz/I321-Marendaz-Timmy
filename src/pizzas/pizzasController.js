const { validationResult } = require('express-validator');
const Pizza = require('./Pizza');

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

        const { name, ingredients, imageUrl, price } = req.body;
        const created = await Pizza.create({ name, ingredients, imageUrl, price });
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
        return res.status(200).json(await Pizza.findAll());
    } catch (err) {
        return next(err);
    }
};

exports.findOne = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const pizza = await Pizza.findById(Number(req.params.id));
        if (!pizza) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(200).json(pizza);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        if (sendValidationErrors(req, res)) return;

        const { name, ingredients, imageUrl, price } = req.body;
        const updated = await Pizza.update(Number(req.params.id), {
            name,
            ingredients,
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

        const deleted = await Pizza.delete(Number(req.params.id));
        if (deleted === 0) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
};
