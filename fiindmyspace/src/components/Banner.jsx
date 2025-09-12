import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Banner.module.css';
import logo from '../assets/logofindmyspace.png';

const Banner = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const idCliente = sessionStorage.getItem('id_cliente');
    setIsLoggedIn(!!idCliente);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('id_cliente');
    setIsLoggedIn(false);
    navigate('/');
  };

  // Navega al Home y hace scroll a una sección con id
  const scrollToSection = (sectionId) => {
    // Si ya estamos en la ruta '/', hacemos scroll inmediato
    const doScroll = () => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (window.location.pathname === '/') {
      doScroll();
    } else {
      navigate('/');
      // esperar un breve momento para que la página Home se renderice
      setTimeout(doScroll, 200);
    }
  };

  return (
    <header className={styles.bannerHeader}>
      <div className={styles.bannerContent}>
        <img src={logo} alt="Logo FindMySpace" className={styles.logo} />
        <div className={styles.bannerButtons}>
          {isLoggedIn ? (
            <>
              <button onClick={() => navigate('/parkin')} className={styles.bannerButton}>Parkin</button>
              <button onClick={() => navigate('/subir-estacionamiento')} className={styles.bannerButton}>Subir Estacionamiento</button>
              <button onClick={() => navigate('/cargar-vehiculo')} className={styles.bannerButton}>Cargar Vehículo</button>
              <button onClick={handleLogout} className={styles.bannerButton}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <button onClick={() => scrollToSection('inicio')} className={styles.bannerButton}>Inicio</button>
              <button onClick={() => scrollToSection('testimonios')} className={styles.bannerButton}>Testimonios</button>
              <button onClick={() => scrollToSection('preguntas')} className={styles.bannerButton}>FAQ</button>
              <button onClick={() => navigate('/login')} className={`${styles.bannerButton} ${styles.login}`}>Login</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Banner;
