// src/components/MarcaList/MarcaList.jsx
import { useEffect, useState } from 'react';
import styles from './MarcaList.module.css';

// Ya no necesitamos API_URL porque usaremos rutas relativas con el proxy de Vite

const MarcaList = () => {
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Usar ruta relativa - Vite proxy redirigirá a localhost:5000
    fetch('/api/marcas')
      .then(res => res.json())
      .then(data => {
        setMarcas(data);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error al obtener marcas:', err);
        setCargando(false);
      });
  }, []);

  if (cargando) return <p>Cargando marcas...</p>;

  return (
    <div className={styles.lista}>
      <h2>Marcas de Autos</h2>
      <ul>
        {marcas.map((m, index) => (
          <li key={index}>{m.marca}</li>
        ))}
      </ul>
    </div>
  );
};

export default MarcaList;
