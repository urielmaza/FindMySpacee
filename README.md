# 🚗 FindMySpace

Proyecto Fullstack desarrollado con **React (frontend)** y **Node.js + Express + MySQL (backend)**. El sistema permite consultar marcas de autos desde una base de datos y consumirlas desde una API en una interfaz web moderna.

---

## 📁 Estructura General

```
FindMySpace/
├── server/           # Backend (Node.js + Express)
└── client/           # Frontend (React + Vite)
```

---

## 🧠 Backend: Node.js + Express + MySQL

### 📦 Dependencias

```bash
npm install express mysql2 dotenv cors
```

### 📂 Estructura

```
server/
├── config/
│   └── db.js                # Conexión a MySQL
├── controllers/
│   └── marcasController.js  # Lógica para obtener marcas
├── routes/
│   └── marcas.js            # Rutas de API
├── .env                     # Variables de entorno
└── server.js                # Punto de entrada
```

### 🌐 Configuración de `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_bd
PORT=5000
```

### 🔌 Archivo `db.js`

```js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;
```

### 📥 Controlador `marcasController.js`

```js
import pool from '../config/db.js';

export const getMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT marca FROM marca_autos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
};
```

### 🧭 Rutas `marcas.js`

```js
import express from 'express';
import { getMarcas } from '../controllers/marcasController.js';

const router = express.Router();
router.get('/', getMarcas);

export default router;
```

### 🚀 Servidor `server.js`

```js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import marcasRoutes from './routes/marcas.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/marcas', marcasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
```

---

## 🎨 Frontend: React + Vite + React Router

### 📦 Dependencias

```bash
npm install react-router-dom
```

> Vite ya incluye React por defecto si usaste `npm create vite@latest`.

### 📂 Estructura de carpetas

```
client/
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── pages/
    │   └── Home.jsx
    └── components/
        └── MarcaList/
            ├── MarcaList.jsx
            └── MarcaList.module.css
```

### 📄 `App.jsx`

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### 📄 `Home.jsx`

```jsx
import MarcaList from '../components/MarcaList/MarcaList';

const Home = () => {
  return (
    <div>
      <h1>Listado de Marcas</h1>
      <MarcaList />
    </div>
  );
};

export default Home;
```

### 📄 `MarcaList.jsx`

```jsx
import { useEffect, useState } from 'react';
import styles from './MarcaList.module.css';

const MarcaList = () => {
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/marcas')
      .then((res) => res.json())
      .then((data) => setMarcas(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <ul className={styles.lista}>
      {marcas.map((m, i) => (
        <li key={i}>{m.marca}</li>
      ))}
    </ul>
  );
};

export default MarcaList;
```

### 📄 `MarcaList.module.css`

```css
.lista {
  list-style: none;
  padding: 0;
  font-size: 1.2rem;
}
```

---

## 🧪 Cómo correr el proyecto

### Backend

```bash
cd server
npm install
node server.js
```

### Frontend

```bash
cd client
npm install
npm run dev
```

---

## ✅ Resultado esperado

- Accedé a `http://localhost:5173/` para ver la interfaz React.
- Esta consume la API en `http://localhost:5000/api/marcas` y muestra las marcas desde tu base de datos MySQL.

---

## 📌 Notas finales

- Recordá tener tu base de datos MySQL en funcionamiento.
- Asegurate de que `marca_autos` tenga una columna `marca`.
- Se puede extender fácilmente para agregar más entidades o autenticación.

---

## 🛠️ Tecnologías utilizadas

- React
- Vite
- React Router
- Node.js
- Express
- MySQL
- Dotenv
- CORS
