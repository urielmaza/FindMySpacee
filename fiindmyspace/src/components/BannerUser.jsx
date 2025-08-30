import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BannerUser.module.css';

const BannerUser = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('id_cliente');
    navigate('/');
  };

  return (
    <header className={styles.bannerHeader}>
      <h2 className={styles.bannerTitle}>FINDMYSPACE</h2>
      <div className={styles.bannerButtons}>
        <button onClick={() => navigate('/parkin')} className={styles.bannerButton}>Parkin</button>
        <button onClick={() => navigate('/subir-estacionamiento')} className={styles.bannerButton}>Subir Estacionamiento</button>
        <button onClick={() => navigate('/cargar-vehiculo')} className={styles.bannerButton}>Cargar Vehículo</button>
        <button onClick={handleLogout} className={styles.bannerButton}>Cerrar sesión</button>
      </div>
    </header>
  );
};

export default BannerUser;
