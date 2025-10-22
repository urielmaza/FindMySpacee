import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Reservas.module.css';

const Reservas = () => {
  const location = useLocation();
  const { plazaNumero } = location.state || {}; // Obtener el número de plaza desde el estado

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes enviar los datos al backend
    console.log({ email, nombre, apellido, plazaNumero });
    alert('Reserva enviada correctamente');
  };

  return (
    <div className={styles.reservasContainer}>
      <h1 className={styles.title}>Reservar Estacionamiento</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="apellido">Apellido:</label>
          <input
            type="text"
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="plaza">Número de Plaza:</label>
          <input
            type="text"
            id="plaza"
            value={plazaNumero || ''}
            readOnly
          />
        </div>
        <button type="submit" className={styles.submitButton}>Reservar</button>
      </form>
    </div>
  );
};

export default Reservas;