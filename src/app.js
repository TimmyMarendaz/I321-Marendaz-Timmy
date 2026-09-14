const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const router = require('./routes/router');
const swaggerSpec = require('./config/swagger');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

// API du projet Foodtruck.
app.use('/api', router);

// Alias conservé pour rester compatible avec le squelette du cours.
app.use('/api/v1', router);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Foodtruck API' });
});

app.use((err, req, res, next) => {
    console.error(err);

    if (!res.headersSent) {
        return res.status(err.status || 500).json({
            error: err.message || 'Internal Server Error'
        });
    }

    return next(err);
});

module.exports = app;
