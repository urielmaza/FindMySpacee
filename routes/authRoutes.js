// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, activate, login } = require('../controllers/authController');

// Registro
router.post('/register', register);
// Activación
router.get('/activate/:token', activate);
// Login
router.post('/login', login);

module.exports = router;
