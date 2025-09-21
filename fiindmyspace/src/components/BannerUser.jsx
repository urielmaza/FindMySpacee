import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BannerUser.module.css';
import logo from '../assets/logofindmyspaceB.png';
import apiClient from "../apiClient";

const BannerUser = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout en el backend
      await apiClient.post('/logout');

      // Eliminar todos los datos de sesión en el cliente
      sessionStorage.clear();
      localStorage.clear();

      // Redirigir al usuario a la página de inicio
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  return (
    <>
      {/* Contenedor que incluye logo y hamburguesa */}
      <div className={`${styles.headerContainer} ${isMenuOpen ? styles.headerContainerOpen : ''}`}>
        {/* Logo que aparece cuando el menú está abierto */}
        <img 
          src={logo} 
          alt="FindMySpace Logo" 
          className={`${styles.headerLogo} ${isMenuOpen ? styles.headerLogoVisible : ''}`}
        />
        
        {/* Botón hamburguesa que se desplaza */}
        <button 
          className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>
      
      {/* Sidebar lateral */}
      <nav className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
        
        <div className={styles.sidebarContent}>
          <button onClick={() => handleNavigation('/parkin')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6,13 L18,13 L18,17 C18,18.1045695 17.1045695,19 16,19 L8,19 C6.8954305,19 6,18.1045695 6,17 L6,13 Z M2,7 L22,7 L22,11 L2,11 L2,7 Z M4,9 L20,9 L20,7 L4,7 L4,9 Z M8,15 L16,15 L16,13 L8,13 L8,15 Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Parkin</span>
          </button>
          <button onClick={() => handleNavigation('/subir-estacionamiento')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Subir Estacionamiento</span>
          </button>
          <button onClick={() => handleNavigation('/cargar-vehiculo')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,11L6.5,6.5H17.5L19,11M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Cargar Vehículo</span>
          </button>
        </div>
        
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={`${styles.navButton} ${styles.logoutButton}`}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Cerrar Sesión</span>
          </button>
        </div>
      </nav>
      
      {/* Overlay para cerrar el menú al hacer clic fuera */}
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
    </>
  );
};

export default BannerUser;
