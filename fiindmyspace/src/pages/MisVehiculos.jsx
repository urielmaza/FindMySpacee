import React, { useState, useEffect } from 'react';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './MisVehiculos.module.css';

const MisVehiculos = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const handleAgregarVehiculo = () => {
    window.location.href = '/cargar-vehiculo';
  };

  const getVehiculoIcon = (tipoVehiculo) => {
    switch(tipoVehiculo?.toLowerCase()) {
      case 'moto': return '🏍️';
      case 'auto': return '🚗';
      case 'camioneta': return '🚙';
      default: return '🚗';
    }
  };

  if (loading) {
    return (
      <>
        <BannerUser onMenuToggle={setIsMenuOpen} />
        <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
          <div className={styles.contentContainer}>
            <h1 className={styles.pageTitle}>Mis Vehículos</h1>
            <div className={styles.loadingCard}>
              <div className={styles.loadingText}>🚗 Cargando vehículos...</div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className={styles.progressText}>{progress}%</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BannerUser onMenuToggle={setIsMenuOpen} />
        <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
          <div className={styles.contentContainer}>
            <h1 className={styles.pageTitle}>Mis Vehículos</h1>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>❌</div>
              <div className={styles.errorText}>{error}</div>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                🔄 Reintentar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BannerUser onMenuToggle={setIsMenuOpen} />
      <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
        <div className={styles.contentContainer}>
          <h1 className={styles.pageTitle}>Mis Vehículos</h1>
          
          {vehiculos.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>🚗</div>
              <h3 className={styles.emptyTitle}>No tienes vehículos registrados</h3>
              <p className={styles.emptyMessage}>
                Agrega tu primer vehículo para comenzar a usar FindMySpace
              </p>
              <button 
                className={styles.addButton}
                onClick={handleAgregarVehiculo}
              >
                ➕ Agregar mi primer vehículo
              </button>
            </div>
          ) : (
            <>
              <div className={styles.vehiculosGrid}>
                {vehiculos.map((vehiculo) => (
                  <div key={vehiculo.id_vehiculo} className={styles.vehiculoCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.vehiculoIcon}>
                        {getVehiculoIcon(vehiculo.tipo_vehiculo)}
                      </div>
                      <div className={styles.vehiculoType}>
                        {vehiculo.tipo_vehiculo}
                      </div>
                    </div>
                    
                    <div className={styles.vehiculoInfo}>
                      <h3 className={styles.vehiculoMarca}>
                        {vehiculo.marca}
                      </h3>
                      <p className={styles.vehiculoModelo}>
                        {vehiculo.modelo}
                      </p>
                      <div className={styles.vehiculoPatente}>
                        🆔 {vehiculo.patente}
                      </div>
                    </div>
                    
                    <div className={styles.cardActions}>
                      <button className={styles.editButton}>
                        ✏️ Editar
                      </button>
                      <button className={styles.deleteButton}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.actionsContainer}>
                <button 
                  className={styles.addButton}
                  onClick={handleAgregarVehiculo}
                >
                  ➕ Agregar otro vehículo
                </button>
                <div className={styles.statsContainer}>
                  <span className={styles.statsText}>
                    📊 Total: {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MisVehiculos;
