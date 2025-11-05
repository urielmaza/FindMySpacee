import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import ClientStatsChart from '../components/charts/ClientStatsChart';
import SavingsChart from '../components/charts/SavingsChart';
import styles from './StatisticsClient.module.css';
import apiClient from '../apiClient';

const StatisticsClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReservas: 0,
    gastoTotal: 0,
    tiempoEstacionado: 0,
    espacioFavorito: '',
    reservasEsteMes: 0,
    ahorroPromedio: 0
  });
  const [periodo, setPeriodo] = useState('mes'); // 'semana', 'mes', 'año'

  useEffect(() => {
    loadStatistics();
  }, [periodo]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Llamada real al endpoint de estadísticas
      const response = await apiClient.get(`/statistics/client?periodo=${periodo}`);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        setStats({
          totalReservas: data.totalReservas || 0,
          gastoTotal: data.gastoTotal || 0,
          tiempoEstacionado: data.tiempoEstacionado || 0,
          espacioFavorito: data.espacioFavorito || 'Sin datos',
          reservasEsteMes: data.reservasEsteMes || 0,
          ahorroPromedio: data.ahorroPromedio || 0
        });
      } else {
        console.error('Error en respuesta de estadísticas:', response.data);
        // Fallback a datos vacíos en caso de error
        setStats({
          totalReservas: 0,
          gastoTotal: 0,
          tiempoEstacionado: 0,
          espacioFavorito: 'Sin datos',
          reservasEsteMes: 0,
          ahorroPromedio: 0
        });
      }
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      
      // Mostrar mensaje de error específico si hay problemas de conexión
      if (error.response?.status === 401) {
        console.error('Usuario no autenticado');
      } else if (error.response?.status === 500) {
        console.error('Error del servidor');
      }
      
      // Fallback a datos vacíos en caso de error
      setStats({
        totalReservas: 0,
        gastoTotal: 0,
        tiempoEstacionado: 0,
        espacioFavorito: 'Error cargando datos',
        reservasEsteMes: 0,
        ahorroPromedio: 0
      });
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <BannerUser />
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mis Estadísticas de Estacionamiento</h1>
          <div className={styles.periodSelector}>
            <button 
              className={`${styles.periodBtn} ${periodo === 'semana' ? styles.active : ''}`}
              onClick={() => setPeriodo('semana')}
            >
              Semana
            </button>
            <button 
              className={`${styles.periodBtn} ${periodo === 'mes' ? styles.active : ''}`}
              onClick={() => setPeriodo('mes')}
            >
              Mes
            </button>
            <button 
              className={`${styles.periodBtn} ${periodo === 'año' ? styles.active : ''}`}
              onClick={() => setPeriodo('año')}
            >
              Año
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Reservas Totales</h3>
              <p className={styles.statNumber}>{stats.totalReservas}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Gasto Total ({periodo})</h3>
              <p className={styles.statNumber}>${stats.gastoTotal.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Tiempo Estacionado</h3>
              <p className={styles.statNumber}>{stats.tiempoEstacionado}h</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Reservas Este Mes</h3>
              <p className={styles.statNumber}>{stats.reservasEsteMes}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Ahorro vs Parquímetro</h3>
              <p className={styles.statNumber}>{stats.ahorroPromedio}%</p>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.fullWidth}`}>
            <div className={styles.statContent}>
              <h3>Estacionamiento Favorito</h3>
              <p className={styles.statText}>{stats.espacioFavorito}</p>
            </div>
          </div>
        </div>

        {/* Sección de Gráficos */}
        <div className={styles.chartsSection}>
          <h2 className={styles.chartsTitle}>Análisis Visual</h2>
          
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <ClientStatsChart stats={stats} periodo={periodo} />
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <SavingsChart 
                  ahorroPromedio={stats.ahorroPromedio} 
                  gastoTotal={stats.gastoTotal} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.actionBtn}
            onClick={() => navigate('/mis-reservas')}
          >
            Ver Mis Reservas
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => navigate('/home-user')}
          >
            Buscar Estacionamiento
          </button>
        </div>
      </div>
    </>
  );
};

export default StatisticsClient;