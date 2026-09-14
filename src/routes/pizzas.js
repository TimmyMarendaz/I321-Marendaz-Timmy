const express = require('express');
const { body, param } = require('express-validator');
const pizzasController = require('../controllers/pizzasController');

const router = express.Router();

const idValidation = [
    param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

const pizzaValidation = [
    body('name').isString().trim().notEmpty().withMessage('name is required'),
    body('ingredients').optional({ nullable: true }).isString().withMessage('ingredients must be a string'),
    body('imageUrl')
        .optional({ nullable: true, checkFalsy: true })
        .isURL()
        .withMessage('imageUrl must be a valid URL'),
    body('price').isFloat({ gt: 0 }).withMessage('price must be a positive number')
];

/**
 * @openapi
 * /api/pizzas:
 *   get:
 *     tags: [Pizzas]
 *     summary: Retrieve all pizzas
 *     responses:
 *       200:
 *         description: List of pizzas
 *   post:
 *     tags: [Pizzas]
 *     summary: Create a pizza
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
 *                 example: Margherita
 *               ingredients:
 *                 type: string
 *                 example: Sauce tomate, mozzarella
 *               imageUrl:
 *                 type: string
 *                 example: https://picsum.photos/200
 *               price:
 *                 type: number
 *                 example: 12
 *     responses:
 *       201:
 *         description: Pizza created
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Pizza name already exists
 *
 * /api/pizzas/{id}:
 *   get:
 *     tags: [Pizzas]
 *     summary: Retrieve one pizza
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pizza found
 *       404:
 *         description: Pizza not found
 *   put:
 *     tags: [Pizzas]
 *     summary: Update a pizza
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
 *               ingredients:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pizza updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Pizza not found
 *   delete:
 *     tags: [Pizzas]
 *     summary: Delete a pizza
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Pizza deleted
 *       404:
 *         description: Pizza not found
 */
router.get('/', pizzasController.findAll);
router.post('/', pizzaValidation, pizzasController.create);
router.get('/:id', idValidation, pizzasController.findOne);
router.put('/:id', [...idValidation, ...pizzaValidation], pizzasController.update);
router.delete('/:id', idValidation, pizzasController.delete);

module.exports = router;
