// server.js
const express = require('express');
const app = express();
// const pool = require('./config/db'); // importar conexión a la BD
const marcaRoutes = require('./routes/marcaRoutes');
const authRoutes = require('./routes/authRoutes');

const PORT = 5000;

app.use(express.json());


// Usar rutas de marcas
app.use('/api', marcaRoutes);
// Usar rutas de autenticación
app.use('/api', authRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'Hola desde el backend!' });
});

// ...existing code...

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
