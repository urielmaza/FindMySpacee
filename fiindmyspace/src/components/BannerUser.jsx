import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BannerUser.module.css';
import logoLight from '../assets/logofindmyspaceB.png';
import logoDark from '../assets/logofindmyspace.png';
import apiClient from '../apiClient';

const BannerUser = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tipoCliente, setTipoCliente] = useState('cliente');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Cargar preferencia de modo oscuro al iniciar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Cargar tipo_cliente del backend para render condicional del menú
  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get('/profile');
        if (data && data.success && data.user && data.user.tipo_cliente) {
          setTipoCliente(data.user.tipo_cliente);
        }
      } catch (e) {
        // Si falla, dejar valor por defecto ('cliente')
      }
    })();
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

  // Logout se maneja desde HomeUser (avatar). Banner ya no incluye cerrar sesión.

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
          <button onClick={() => handleNavigation('/mis-reservas')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v2H2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zM2 10h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
              </svg>
            </span>
            <span className={styles.navText}>Mis Reservas</span>
          </button>
          <button onClick={() => handleNavigation('/mis-vehiculos')} className={styles.navButton}>
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,11L6.5,6.5H17.5L19,11M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
              </svg>
            </span>
            <span className={styles.navText}>Mis vehículos</span>
          </button>
          {tipoCliente === 'propietario' && (
            <button onClick={() => handleNavigation('/mis-estacionamientos')} className={styles.navButton}>
              <span className={styles.navIcon}>
                <svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g>
                    <g>
                      <path d="M510.84,317.223c-0.004-0.008-0.003-0.015-0.007-0.023l-0.052-0.1c-0.007-0.013-0.013-0.026-0.02-0.039l-29.763-56.768
                        c-1.761-3.359-5.24-5.463-9.032-5.463h-110.54c-3.743,0-7.186,2.051-8.968,5.342l-10.692,19.746
                        c-22.764-16.425-48.02-28.037-74.82-34.507c32.643-18.067,54.797-52.861,54.797-92.738c0-58.405-47.515-105.921-105.92-105.921
                        s-105.92,47.516-105.92,105.921c0,39.89,22.169,74.695,54.83,92.756c-38.119,9.198-73.089,28.683-101.515,57.082
                        C22.451,343.236,0,397.408,0,455.049c0,5.632,4.566,10.199,10.199,10.199h491.602c5.633,0,10.199-4.567,10.199-10.199V321.935
                        C512,320.234,511.578,318.633,510.84,317.223z M367.501,275.228h98.296l19.141,36.508H347.732L367.501,275.228z M130.3,152.673
                        c0-47.157,38.364-85.522,85.521-85.522c47.156,0,85.521,38.364,85.521,85.522c0,47.156-38.364,85.521-85.521,85.521
                        C168.664,238.194,130.3,199.829,130.3,152.673z M321.663,317.04c-0.797,1.453-1.251,3.121-1.251,4.895v122.915H20.662
                        c5.332-102.95,90.829-185.076,195.16-185.076c42.368,0,82.372,13.207,116.14,38.248L321.663,317.04z M429.484,444.849h-26.557
                        v-48.151h26.557V444.849z M491.602,444.849h-41.719v-58.351c0-5.632-4.566-10.199-10.199-10.199h-46.955
                        c-5.633,0-10.199,4.567-10.199,10.199v58.351H340.81V332.134h150.791V444.849z"/>
                    </g>
                  </g>
                  <g>
                    <g>
                      <path d="M121.033,317.765c-3.478-4.431-9.89-5.204-14.321-1.725c-4.324,3.395-8.542,7.036-12.537,10.824
                        c-4.088,3.876-4.259,10.332-0.383,14.42c2.006,2.114,4.702,3.181,7.403,3.181c2.519,0,5.044-0.928,7.016-2.798
                        c3.537-3.354,7.271-6.577,11.098-9.582C123.739,328.607,124.511,322.196,121.033,317.765z"/>
                    </g>
                  </g>
                  <g>
                    <g>
                      <path d="M85.284,351.132c-4.61-3.24-10.97-2.131-14.21,2.478c-13.369,19.016-22.718,40.117-27.789,62.719
                        c-1.233,5.497,2.222,10.952,7.719,12.185c0.752,0.168,1.502,0.249,2.242,0.249c4.667,0,8.878-3.224,9.942-7.969
                        c4.483-19.98,12.75-38.637,24.573-55.454C91,360.734,89.892,354.372,85.284,351.132z"/>
                    </g>
                  </g>
                </svg>
              </span>
              <span className={styles.navText}>Mis Estacionamientos</span>
            </button>
          )}
         
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
          
          {/* Botón de Cerrar Sesión removido: la acción vive en el avatar de HomeUser */}
        </div>
      </nav>
      
      {/* Overlay para cerrar el menú al hacer clic fuera */}
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
    </>
  );
};

export default BannerUser;
