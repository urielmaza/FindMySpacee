import React from 'react';
import BannerUser from '../components/BannerUser';
import styles from './HomeUser.module.css';

const HomeUser = () => {
  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        <h1 className={styles.title}>Bienvenido a tu panel de usuario</h1>
        <p className={styles.subtitle}>Has iniciado sesión correctamente.</p>
      </div>
    </>
  );
};

export default HomeUser;
