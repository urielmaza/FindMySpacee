import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BannerUser.module.css';
import logoLight from '../assets/logofindmyspaceB.png';
import logoDark from '../assets/logofindmyspace.png';
import apiClient from "../apiClient";

const BannerUser = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Cargar preferencia de modo oscuro al iniciar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Toggle modo oscuro
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout en el backend
      await apiClient.post('/logout');

      // Guardar los mapas antes de limpiar
      const mapasGuardados = localStorage.getItem('findmyspace_mapas');
      const darkMode = localStorage.getItem('darkMode');

      // Eliminar todos los datos de sesión en el cliente
      sessionStorage.clear();
      localStorage.clear();

      // Restaurar los mapas y preferencias que queremos mantener
      if (mapasGuardados) {
        localStorage.setItem('findmyspace_mapas', mapasGuardados);
        console.log('🗺️ Mapas preservados al cerrar sesión');
      }
      if (darkMode) {
        localStorage.setItem('darkMode', darkMode);
        console.log('🌙 Preferencia de modo oscuro preservada');
      }

      // Redirigir al usuario a la página de inicio
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    if (onMenuToggle) {
      onMenuToggle(newMenuState);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    if (onMenuToggle) {
      onMenuToggle(false);
    }
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
          src={isDarkMode ? logoDark : logoLight} 
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
          <button onClick={() => handleNavigation('/mis-vehiculos')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,11L6.5,6.5H17.5L19,11M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Mis vehículos</span>
          </button>
          <button onClick={() => handleNavigation('/mis-estacionamientos')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A2,2 0 0,1 14,4V8L15,7V16H13V9.5L12,10.5L11,9.5V16H9V7L10,8V4A2,2 0 0,1 12,2M12,6A1,1 0 0,0 11,7A1,1 0 0,0 12,8A1,1 0 0,0 13,7A1,1 0 0,0 12,6M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M17,18A1,1 0 0,0 16,19A1,1 0 0,0 17,20A1,1 0 0,0 18,19A1,1 0 0,0 17,18Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Mis Estacionamientos</span>
          </button>
         
        </div>
        
        <div className={styles.sidebarFooter}>
          {/* Toggle modo oscuro */}
          <div className={`${styles.darkModeToggle} ${isMenuOpen ? styles.darkModeToggleVisible : ''}`} onClick={toggleDarkMode}>
            <div className={`${styles.toggleCircle} ${isDarkMode ? styles.toggleCircleActive : ''}`}>
              <svg className={`${styles.sunIcon} ${isDarkMode ? styles.iconHidden : ''}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.52,9.22 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.22 6.91,16.84 7.51,17.35L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.22 18.05,8.5C17.63,7.78 17.09,7.15 16.49,6.65L20.65,7M20.64,17L16.5,17.35C17.1,16.84 17.64,16.22 18.06,15.5C18.48,14.78 18.75,14 18.89,13.23L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,18.98 11.98,18.98C12.82,18.98 13.63,18.83 14.37,18.56L12,22Z"/>
              </svg>
              <svg className={`${styles.moonIcon} ${isDarkMode ? '' : styles.iconHidden}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
              </svg>
            </div>
          </div>
          
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
