import React, { useState, useEffect } from 'react';
import styles from './cargarVehiculo.module.css';
import { getUserSession } from '../utils/auth';
import BannerUser from '../components/BannerUser'; // Importa BannerUser

const CargarVehiculo = () => {
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    tipo: '',
    patente: ''
  });
  const [marcas, setMarcas] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/marcas')
      .then(res => res.json())
      .then(data => setMarcas(data))
      .catch(() => setMarcas([]));
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    // Validación simple de campos requeridos
    if (!form.marca || !form.modelo || !form.tipo || !form.patente) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }
    // Obtiene el usuario de la sesión
    const user = getUserSession();
    if (!user || !user.id_cliente) {
      setErrorMsg('No se pudo obtener el id del usuario de la sesión');
      return;
    }
    // Incluye id_cliente en el objeto enviado
    const dataToSend = { ...form, id_cliente: user.id_cliente };
    try {
      const response = await fetch('http://localhost:5000/api/vehiculos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        alert('Vehículo cargado correctamente');
        setForm({ marca: '', modelo: '', tipo: '', patente: '' });
      } else {
        const errorData = await response.json();
        setErrorMsg(errorData?.message || 'Error al cargar el vehículo');
      }
    } catch (error) {
      setErrorMsg('Error de conexión');
    }
  };

  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        <h1 className={styles.title}>Form. vehiculo</h1>
        {errorMsg && <div style={{ color: 'red', marginBottom: 10 }}>{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <select
            name="marca"
            value={form.marca}
            onChange={handleChange}
            className={styles.formInput}
            required
          >
            <option value="">Selecciona una marca</option>
            {marcas.map(marca => (
              <option key={marca.id} value={marca.nombre}>{marca.nombre}</option>
            ))}
          </select>
          <input
            type="text"
            name="modelo"
            placeholder="modelo"
            value={form.modelo}
            onChange={handleChange}
            className={styles.formInput}
          />
          <input
            type="text"
            name="tipo"
            placeholder="tipo"
            value={form.tipo}
            onChange={handleChange}
            className={styles.formInput}
          />
          <input
            type="text"
            name="patente"
            placeholder="patente"
            value={form.patente}
            onChange={handleChange}
            className={styles.formInput}
          />
          <button
            type="submit"
            className={styles.submitButton}
          >
            cargar vehiculo
          </button>
        </form>
      </div>
    </>
  );
};

export default CargarVehiculo;