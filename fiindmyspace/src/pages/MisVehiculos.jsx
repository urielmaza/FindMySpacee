import React, { useState, useEffect } from 'react';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './MisVehiculos.module.css';

const MisVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        // Simular progreso de carga
        setProgress(20);
        
        const userSession = getUserSession();
        if (!userSession) {
          setError('No se pudo obtener la sesión del usuario');
          setLoading(false);
          return;
        }

        console.log('🔍 Sesión del usuario:', userSession);
        console.log('🆔 ID Cliente:', userSession.id_cliente);

        setProgress(50);
        
        const url = `/vehiculos/usuario/${userSession.id_cliente}`;
        console.log('🌐 URL a consultar:', url);
        
        const response = await apiClient.get(url);
        
        setProgress(80);
        
        if (response.data.success) {
          setVehiculos(response.data.data);
        } else {
          setError('No se pudieron cargar los vehículos');
        }
        
        setProgress(100);
      } catch (error) {
        console.error('Error al obtener vehículos:', error);
        setError('Error al cargar los vehículos');
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    fetchVehiculos();
  }, []);

  if (loading) {
    return (
      <>
        <BannerUser />
        <div className={styles.container}>
          <h1 className={styles.title}>Mis Vehículos</h1>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingText}>Cargando vehículos...</div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={styles.progressText}>{progress}%</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BannerUser />
        <div className={styles.container}>
          <h1 className={styles.title}>Mis Vehículos</h1>
          <div className={styles.error}>{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        <h1 className={styles.title}>Mis Vehículos</h1>
        
        {vehiculos.length === 0 ? (
          <div className={styles.noVehiculos}>
            <div className={styles.noVehiculosIcon}>🚗</div>
            <p>No tienes vehículos registrados</p>
            <button 
              className={styles.btnAgregar}
              onClick={() => window.location.href = '/cargar-vehiculo'}
            >
              Agregar mi primer vehículo
            </button>
          </div>
        ) : (
          <>
            <div className={styles.vehiculosGrid}>
              {vehiculos.map((vehiculo) => (
                <div key={vehiculo.id_vehiculo} className={styles.vehiculoCard}>
                  <div className={styles.cardIcon}>🚗</div>
                  <div className={styles.vehiculoInfo}>
                    <h3 className={styles.vehiculoMarca}>
                      {vehiculo.marca}
                    </h3>
                    <p className={styles.vehiculoModelo}>
                      {vehiculo.modelo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.accionesContainer}>
              <button 
                className={styles.btnAgregar}
                onClick={() => window.location.href = '/cargar-vehiculo'}
              >
                Agregar otro vehículo
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MisVehiculos;
