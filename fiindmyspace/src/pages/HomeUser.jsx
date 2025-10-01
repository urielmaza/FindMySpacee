import React from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import { getUserSession } from '../utils/auth';
import styles from './HomeUser.module.css';

const HomeUser = () => {
  const navigate = useNavigate();
  const userSession = getUserSession(); 
  const userEmail = userSession ? userSession.email : 'Usuario';

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <h1 className={styles.title}>¡Bienvenido de vuelta!</h1>
          <p className={styles.subtitle}>
            Hola {userEmail}, has iniciado sesión correctamente en FindMySpace
          </p>
        </div>

        <div className={styles.features}>
          <div 
            className={styles.featureCard} 
            style={{'--delay': '0s'}}
            onClick={() => handleCardClick('/parkin')}
          >
            <span className={styles.featureIcon}>🅿️</span>
            <h3 className={styles.featureTitle}>Encuentra Parking</h3>
            <p className={styles.featureDescription}>
              Busca y reserva espacios de estacionamiento cerca de ti
            </p>
          </div>
          
          <div 
            className={styles.featureCard} 
            style={{'--delay': '0.1s'}}
            onClick={() => handleCardClick('/subir-estacionamiento')}
          >
            <span className={styles.featureIcon}>🏢</span>
            <h3 className={styles.featureTitle}>Sube tu Estacionamiento</h3>
            <p className={styles.featureDescription}>
              Monetiza tu espacio disponible y gana dinero extra
            </p>
          </div>
          
          <div 
            className={styles.featureCard} 
            style={{'--delay': '0.2s'}}
            onClick={() => handleCardClick('/cargar-vehiculo')}
          >
            <span className={styles.featureIcon}>🚗</span>
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
