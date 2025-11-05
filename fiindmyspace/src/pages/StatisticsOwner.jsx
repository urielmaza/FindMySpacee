import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import OwnerStatsChart from '../components/charts/OwnerStatsChart';
import OccupancyChart from '../components/charts/OccupancyChart';
import RevenueChart from '../components/charts/RevenueChart';
import styles from './StatisticsOwner.module.css';
import apiClient from '../apiClient';

const StatisticsOwner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEspacios: 0,
    totalReservas: 0,
    ingresosMensuales: 0,
    espacioMasPopular: '',
    reservasActivas: 0,
    tasaOcupacion: 0
  });
  const [periodo, setPeriodo] = useState('mes'); // 'semana', 'mes', 'año'

  useEffect(() => {
    loadStatistics();
  }, [periodo]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Llamada real al endpoint de estadísticas
      const response = await apiClient.get(`/statistics/owner?periodo=${periodo}`);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        setStats({
          totalEspacios: data.totalEspacios || 0,
          totalReservas: data.totalReservas || 0,
          ingresosMensuales: data.ingresosMensuales || 0,
          espacioMasPopular: data.espacioMasPopular || 'Sin datos',
          reservasActivas: data.reservasActivas || 0,
          tasaOcupacion: data.tasaOcupacion || 0
        });
      } else {
        console.error('Error en respuesta de estadísticas:', response.data);
        // Fallback a datos simulados en caso de error
        setStats({
          totalEspacios: 0,
          totalReservas: 0,
          ingresosMensuales: 0,
          espacioMasPopular: 'Sin datos',
          reservasActivas: 0,
          tasaOcupacion: 0
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
        totalEspacios: 0,
        totalReservas: 0,
        ingresosMensuales: 0,
        espacioMasPopular: 'Error cargando datos',
        reservasActivas: 0,
        tasaOcupacion: 0
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
          <h1 className={styles.title}>Estadísticas de Propietario</h1>
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
                <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Espacios Totales</h3>
              <p className={styles.statNumber}>{stats.totalEspacios}</p>
            </div>
          </div>

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
              <h3>Ingresos ({periodo})</h3>
              <p className={styles.statNumber}>${stats.ingresosMensuales.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Reservas Activas</h3>
              <p className={styles.statNumber}>{stats.reservasActivas}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <h3>Tasa de Ocupación</h3>
              <p className={styles.statNumber}>{stats.tasaOcupacion}%</p>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.fullWidth}`}>
            <div className={styles.statContent}>
              <h3>Espacio Más Popular</h3>
              <p className={styles.statText}>{stats.espacioMasPopular}</p>
            </div>
          </div>
        </div>

        {/* Sección de Gráficos */}
        <div className={styles.chartsSection}>
          <h2 className={styles.chartsTitle}>Análisis Visual</h2>
          
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <OwnerStatsChart stats={stats} periodo={periodo} />
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <OccupancyChart 
                  tasaOcupacion={stats.tasaOcupacion} 
                  reservasActivas={stats.reservasActivas}
                  totalEspacios={stats.totalEspacios}
                />
              </div>
            </div>
            
            <div className={`${styles.chartCard} ${styles.fullWidthChart}`}>
              <div className={styles.chartContainer}>
                <RevenueChart ingresosMensuales={stats.ingresosMensuales} periodo={periodo} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.actionBtn}
            onClick={() => navigate('/mis-estacionamientos')}
          >
            Gestionar Espacios
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => window.print()}
          >
            Exportar Reporte
          </button>
        </div>
      </div>
    </>
  );
};

export default StatisticsOwner;