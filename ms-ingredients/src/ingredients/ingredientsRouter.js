const express = require('express');
const { body, param } = require('express-validator');
const ingredientsController = require('./ingredientsController');

const router = express.Router();

const idValidation = [
    param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

const ingredientValidation = [
    body('name').isString().trim().notEmpty().withMessage('name is required'),
    body('price').isFloat({ min: 0 }).withMessage('price must be a positive number or zero')
];

/**
 * @openapi
 * /api/ingredients:
 *   get:
 *     tags: [Ingredients]
 *     summary: Retrieve all ingredients
 *     responses:
 *       200:
 *         description: List of ingredients
 *   post:
 *     tags: [Ingredients]
 *     summary: Create an ingredient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Champignons
 *               price:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Ingredient created
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Ingredient name already exists
 *
 * /api/ingredients/{id}:
 *   get:
 *     tags: [Ingredients]
 *     summary: Retrieve one ingredient
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ingredient found
 *       404:
 *         description: Ingredient not found
 *   put:
 *     tags: [Ingredients]
 *     summary: Update an ingredient
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Ingredient updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Ingredient not found
 *   delete:
 *     tags: [Ingredients]
 *     summary: Delete an ingredient
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Ingredient deleted
 *       404:
 *         description: Ingredient not found
 */
router.get('/', ingredientsController.findAll);
router.post('/', ingredientValidation, ingredientsController.create);
router.get('/:id', idValidation, ingredientsController.findOne);
router.put('/:id', [...idValidation, ...ingredientValidation], ingredientsController.update);
router.delete('/:id', idValidation, ingredientsController.delete);

module.exports = router;
