const express = require('express');
const { body, param } = require('express-validator');
const controller = require('./pizzasController');

const router = express.Router();
const idValidation = [
    param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

/**
 * @openapi
 * /api/pizzas/{id}/full:
 *   get:
 *     tags: [Pizzas]
 *     summary: Retrieve a pizza with ingredients fetched from the ingredients service
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Pizza with an ingredients array
 *       404:
 *         description: Pizza or referenced ingredient not found
 *       503:
 *         description: Ingredients service unavailable
 *
 * /api/pizzas/{id}/compositions:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     tags: [Compositions]
 *     summary: List the local ingredient references of a pizza
 *     responses:
 *       200:
 *         description: Composition rows with id, product_id and item_id
 *       404:
 *         description: Pizza not found
 *   post:
 *     tags: [Compositions]
 *     summary: Validate a remote ingredient and add it to a pizza
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id]
 *             properties:
 *               item_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *     responses:
 *       201:
 *         description: Composition created
 *       400:
 *         description: Invalid input or ingredient not found
 *       404:
 *         description: Pizza not found
 *       409:
 *         description: Ingredient already associated with this pizza
 *       503:
 *         description: Ingredients service unavailable
 *   delete:
 *     tags: [Compositions]
 *     summary: Remove all ingredient references from a pizza
 *     responses:
 *       204:
 *         description: Compositions removed
 *       404:
 *         description: Pizza not found
 */
router.get('/:id/full', idValidation, controller.getWithIngredients);
router.get('/:id/compositions', idValidation, controller.getCompositions);
router.post('/:id/compositions', [
    ...idValidation,
    body('item_id').custom((value) => Number.isSafeInteger(value) && value > 0)
        .withMessage('item_id must be a positive integer')
], controller.addComposition);
router.delete('/:id/compositions', idValidation, controller.deleteCompositions);

module.exports = router;
