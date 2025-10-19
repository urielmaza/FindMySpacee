import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import { getUserSession, logoutAndPreserve } from '../utils/auth';
import styles from './HomeUser.module.css';
import apiClient from '../apiClient';

const HomeUser = () => {
  const navigate = useNavigate();
  const userSession = getUserSession(); 
  const userEmail = userSession ? userSession.email : 'Usuario';

  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  const handleCardClick = (route) => {
    navigate(route);
  };

  const userInitial = userEmail ? (userEmail[0] || 'U').toUpperCase() : 'U';

  const toggleAvatarMenu = () => setIsAvatarOpen((v) => !v);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setIsAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoProfile = () => {
    setIsAvatarOpen(false);
    navigate('/mi-perfil');
  };

  const handleLogout = async () => logoutAndPreserve(navigate);

  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        {/* Barra de acción superior */}
        <div className={styles.actionBar}>
          <div className={styles.leftActions}>
            <button
              type="button"
              className={styles.profileButton}
              aria-label="Completa tu perfil"
              // onClick={() => navigate('/mi-perfil')}
            >
              Completa tu perfil
            </button>
          </div>
          <div className={styles.rightActions} ref={avatarRef}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={toggleAvatarMenu}
              aria-haspopup="menu"
              aria-expanded={isAvatarOpen}
              aria-controls="avatar-menu"
            >
              {userInitial}
            </button>
            {isAvatarOpen && (
              <div id="avatar-menu" role="menu" className={styles.avatarMenu}>
                <button role="menuitem" className={styles.menuItem} onClick={handleGoProfile}>Perfil</button>
                <button role="menuitem" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
        <div className={styles.features}>
          <div 
            className={styles.featureCard} 
            style={{'--delay': '0s'}}
            onClick={() => handleCardClick('/parkin')}
          >
            <span className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"/>
                <circle cx="12" cy="8" r="2"/>
                <path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"/>
              </svg>
            </span>
            <h3 className={styles.featureTitle}>Encuentra Parking</h3>
            <p className={styles.featureDescription}>
              Busca y reserva espacios de estacionamiento
            </p>
          </div>
          
          <div 
            className={styles.featureCard} 
            style={{'--delay': '0.1s'}}
            onClick={() => handleCardClick('/subir-estacionamiento')}
          >
            <span className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.341 6.484A10 10 0 0 1 10.266 21.85"/>
                <path d="M3.659 17.516A10 10 0 0 1 13.74 2.152"/>
                <circle cx="12" cy="12" r="3"/>
                <circle cx="19" cy="5" r="2"/>
                <circle cx="5" cy="19" r="2"/>
              </svg>
            </span>
            <h3 className={styles.featureTitle}>Carga tu Estacionamiento</h3>
            <p className={styles.featureDescription}>
              Monetiza tu espacio disponible y gana dinero
            </p>
          </div>
          
          <div 
            className={styles.featureCard} 
            style={{'--delay': '0.2s'}}
            onClick={() => handleCardClick('/cargar-vehiculo')}
          >
            <span className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/>
                <path d="M7 14h.01"/>
                <path d="M17 14h.01"/>
                <rect width="18" height="8" x="3" y="10" rx="2"/>
                <path d="M5 18v2"/>
                <path d="M19 18v2"/>
              </svg>
            </span>
            <h3 className={styles.featureTitle}>Gestiona tus Vehículos</h3>
            <p className={styles.featureDescription}>
              Administra la información de todos tus vehículos
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeUser;
