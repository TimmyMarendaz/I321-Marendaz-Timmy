const express = require('express');
const pizzasRouter = require('../pizzas/pizzasRouter');
const ingredientsRouter = require('../ingredients/ingredientsRouter');

const router = express.Router();

router.use('/pizzas', pizzasRouter);
router.use('/ingredients', ingredientsRouter);

module.exports = router;
