// controllers/marcaController.js
const pool = require('../config/db');

// Controlador para obtener las marcas de autos
function getMarcas(req, res) {
  pool.query('SELECT marca FROM marca_autos', (error, results) => {
    if (error) {
      console.error('Error al obtener marcas:', error);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
}

module.exports = { getMarcas };
