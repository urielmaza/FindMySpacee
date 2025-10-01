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
          <button onClick={() => handleNavigation('/home-user')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Home</span>
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
