const express = require('express');
const usersRouter = require('./routes/users');
const app = express();
app.use('/api/users', usersRouter);
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});
module.exports = app;