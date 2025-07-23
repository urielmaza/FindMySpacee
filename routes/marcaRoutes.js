// routes/marcaRoutes.js
const express = require('express');
const router = express.Router();
const { getMarcas } = require('../controllers/marcaController');

// Ruta para listar marcas
router.get('/marcas', getMarcas);

module.exports = router;
