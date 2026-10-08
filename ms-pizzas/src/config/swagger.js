const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Foodtruck pizzas API',
            version: '1.0.0',
            description: 'REST API du microservice pizzas.'
        },
        servers: [
            { url: '/', description: 'Local development server' }
        ]
    },
    apis: [path.join(__dirname, '..', '*', '*Router.js').replace(/\\/g, '/')]
};

module.exports = swaggerJSDoc(options);
