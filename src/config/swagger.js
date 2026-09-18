const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Foodtruck API',
            version: '1.0.0',
            description: 'REST API pour gérer les pizzas et les ingrédients du Foodtruck.'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local development server' }
        ]
    },
    apis: [path.join(__dirname, '..', '*', '*Router.js').replace(/\\/g, '/')]
};

module.exports = swaggerJSDoc(options);
