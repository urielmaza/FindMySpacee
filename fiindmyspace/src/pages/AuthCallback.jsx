import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay parámetros de éxito de Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      // Redirigir a la página de login con el parámetro de éxito
      navigate('/login?success=true');
    } else {
      // Si no hay éxito, redirigir a login normal
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px' 
    }}>
      Procesando autenticación con Google...
    </div>
  );
};

export default AuthCallback;