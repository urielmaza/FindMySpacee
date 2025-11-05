import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserSession } from '../utils/auth';
import apiClient from '../apiClient';
import StatisticsOwner from './StatisticsOwner';
import StatisticsClient from './StatisticsClient';
import styles from './Statistics.module.css';

const Statistics = () => {
  const [tipoCliente, setTipoCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUserType = async () => {
      try {
        // Primero intentar obtener desde sesión local
        const session = getUserSession();
        if (session?.tipo_cliente) {
          setTipoCliente(session.tipo_cliente);
          setLoading(false);
          return;
        }

        // Si no está en sesión, consultar al backend
        const { data } = await apiClient.get('/profile');
        if (data && data.success && data.user && data.user.tipo_cliente) {
          setTipoCliente(data.user.tipo_cliente);
        } else {
          setError('No se pudo determinar el tipo de usuario');
        }
      } catch (e) {
        console.error('Error cargando tipo de usuario:', e);
        setError('Error de conexión. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadUserType();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Cargando estadísticas...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>
          {error}
        </div>
        <button 
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Render the appropriate component based on user type
  if (tipoCliente === 'propietario') {
    return <StatisticsOwner />;
  } else if (tipoCliente === 'cliente') {
    return <StatisticsClient />;
  } else {
    // Fallback: redirect to home if user type is unknown
    return <Navigate to="/home-user" replace />;
  }
};

export default Statistics;