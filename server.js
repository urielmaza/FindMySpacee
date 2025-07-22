// server.js
const express = require('express');
const app = express();
const pool = require('./config/db'); // importar conexión a la BD
const PORT = 5000;

app.use(express.json());

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'Hola desde el backend!' });
});

// Ruta para listar marcas
app.get('/api/marcas', (req, res) => {
  pool.query('SELECT marca FROM marca_autos', (error, results) => {
    if (error) {
      console.error('Error al obtener marcas:', error);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
