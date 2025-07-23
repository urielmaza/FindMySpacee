import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession } from '../utils/auth';

const Parkin = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const handleLogout = () => {
    clearUserSession();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div style={{ marginTop: 100, marginBottom: 60, textAlign: 'center' }}>
      <h2>Bienvenido a su estacionamiento</h2>
      <button style={{ marginTop: 32, padding: '12px 32px', fontSize: 18, cursor: 'pointer' }} onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
};

export default Parkin;
