const express = require('express');
const { getUsers } = require('../controllers/usercontroller');
const router = express.Router();
router.get('/', getUsers);
module.exports = router;