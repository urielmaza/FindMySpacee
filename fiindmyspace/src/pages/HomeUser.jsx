import React from 'react';
import BannerUser from '../components/BannerUser';

const HomeUser = () => {
  return (
    <>
      <BannerUser />
      <div style={{ marginTop: 100, textAlign: 'center' }}>
        <h1>Bienvenido a tu panel de usuario</h1>
        <p>Has iniciado sesión correctamente.</p>
      </div>
    </>
  );
};

export default HomeUser;
