import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './MisVehiculos.module.css';

const MisVehiculos = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, vehiculo: null });

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        setLoading(true);
        const userSession = getUserSession();
        if (!userSession) {
          setError('No se pudo obtener la sesión del usuario');
          return;
        }

        const url = `/vehiculos/usuario/${userSession.id_cliente}`;
        
        const response = await apiClient.get(url);
        
        if (response.data.success) {
          setVehiculos(response.data.data);
          setError(null);
        } else {
          setError('No se pudieron cargar los vehículos');
        }
      } catch (error) {
        console.error('Error al obtener vehículos:', error);
        setError('Error al cargar los vehículos');
      } finally {
        setLoading(false);
      }
    };

    fetchVehiculos();
  }, []);

  const handleAgregarVehiculo = () => {
    navigate('/cargar-vehiculo');
  };

  const refrescarLista = async () => {
    try {
      const userSession = getUserSession();
      if (!userSession) return;
      const url = `/vehiculos/usuario/${userSession.id_cliente}`;
      const response = await apiClient.get(url);
      if (response.data.success) {
        setVehiculos(response.data.data);
      }
    } catch (err) {
      console.error('Error al refrescar lista:', err);
    }
  };

  const handleEditar = (vehiculo) => {
    navigate(`/cargar-vehiculo?id=${vehiculo.id_vehiculo}`);
  };

  const solicitarEliminar = (vehiculo) => {
    setConfirmDelete({ open: true, vehiculo });
  };

  const cerrarConfirmacion = () => setConfirmDelete({ open: false, vehiculo: null });

  const confirmarEliminar = async () => {
    const vehiculo = confirmDelete.vehiculo;
    if (!vehiculo) return;
    try {
      await apiClient.delete(`/vehiculos/${vehiculo.id_vehiculo}`);
      setVehiculos((prev) => prev.filter(v => v.id_vehiculo !== vehiculo.id_vehiculo));
      cerrarConfirmacion();
      refrescarLista();
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
      cerrarConfirmacion();
    }
  };

  const getVehiculoIcon = (tipoVehiculo) => {
    const size = 56; // tamaño visual del ícono (aumentado)
    switch (tipoVehiculo?.toLowerCase()) {
      case 'auto':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 30 30"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 6C12.558 6 10.204531 6.3630781 9.0195312 6.5800781C8.0555312 6.7550781 7.2380313 7.3931094 6.8320312 8.2871094L5.0664062 12.169922C4.0514063 12.494922 3 13.223281 3 13.738281L3 22C3 23.105 3.895 24 5 24C6.105 24 7 23.105 7 22L23 22C23 23.105 23.895 24 25 24C26.105 24 27 23.105 27 22L27 13.738281C27 13.223281 25.948594 12.494922 24.933594 12.169922L23.167969 8.2890625C22.760969 7.3930625 21.942469 6.7550781 20.980469 6.5800781C19.794469 6.3630781 17.442 6 15 6 z M 15 8C17.284 8 19.503047 8.342875 20.623047 8.546875C20.941047 8.605875 21.211656 8.8172344 21.347656 9.1152344L22.445312 11.529297C21.153312 11.270297 18.885 11 15 11C11.115 11 8.8466875 11.270297 7.5546875 11.529297L8.6523438 9.1152344C8.7873437 8.8172344 9.0599063 8.604875 9.3789062 8.546875C10.497906 8.342875 12.716 8 15 8 z M 2 10 A 1.0001 1.0001 0 1 0 2 12L3 12 A 1.0001 1.0001 0 1 0 3 10L2 10 z M 27 10 A 1.0001 1.0001 0 1 0 27 12L28 12 A 1.0001 1.0001 0 1 0 28 10L27 10 z M 5.5 13C6.328 13 7 13.672 7 14.5C7 15.328 6.328 16 5.5 16C4.672 16 4 15.328 4 14.5C4 13.672 4.672 13 5.5 13 z M 24.5 13C25.328 13 26 13.672 26 14.5C26 15.328 25.328 16 24.5 16C23.672 16 23 15.328 23 14.5C23 13.672 23.672 13 24.5 13 z M 15 17.5C19.99 17.5 23 18 23 18L22.552734 18.894531C22.213734 19.572531 21.520672 20 20.763672 20L9.2363281 20C8.4783281 20 7.7862656 19.572531 7.4472656 18.894531L7 18C7 18 10.01 17.5 15 17.5 z" />
          </svg>
        );
      case 'moto':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path d="M27,17c-0.2,0-0.4,0-0.6,0.1l-0.6-1.9C26.2,15,26.6,15,27,15c0.7,0,1.4,0.1,2.1,0.3c0.5,0.2,1.1-0.1,1.3-0.6 c0.2-0.5-0.1-1.1-0.6-1.3C28.9,13.1,27.9,13,27,13c-0.6,0-1.3,0.1-1.9,0.2l-2.2-6.5C22.8,6.3,22.4,6,22,6h-4c-0.6,0-1,0.4-1,1 s0.4,1,1,1h3.3l0.7,2H17c-0.4,0-0.7,0.2-0.9,0.5l-0.4,0.6c-1.4,2.3-4,3.4-6.6,2.9c0,0,0,0,0,0c-1.2-0.6-2.7-1-4.1-1 c-0.6,0-1,0.4-1,1s0.4,1,1,1c3.9,0,7,3.1,7,7c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1c0-2.7,1.6-5.1,3.9-6.2l0.6,1.9 C23,18.6,22,20.2,22,22c0,2.8,2.2,5,5,5s5-2.2,5-5S29.8,17,27,17z"></path>
              <path d="M5,17c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S7.8,17,5,17z"></path>
            </g>
          </svg>
        );
      case 'camioneta':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 -26.28 122.88 122.88"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <g>
                <path d="M29.34,41.02c-12.27,0-18.31,10.91-15.43,22.31L5.5,63.33C1.89,61.72,0.39,58.4,0,54.17v-6.96 c0-5.68,0-11.36,0-17.52c0-4.74,3.02-7.11,9.1-7.11l4.35,0L22.2,4.35C23.41,1.45,25.61,0,28.72,0h16.93v0.1h69.13 c5.16,0.05,7.96,2.51,8.11,7.68v55.55h-6.98c4.2-10.86-3.59-22.27-15.12-22.27c-11.55,0-19.35,11.4-15.14,22.27H45.39 C47.53,52.59,41.3,41.02,29.34,41.02L29.34,41.02z M41.26,57.74c0,3.47-1.15,6.44-3.49,8.89c-2.32,2.45-5.14,3.69-8.43,3.69 c-3.32,0-6.14-1.24-8.46-3.69c-2.32-2.45-3.49-5.42-3.49-8.89c0-3.47,1.17-6.44,3.49-8.89c2.32-2.47,5.14-3.69,8.46-3.69 c3.29,0,6.11,1.21,8.43,3.69C40.11,51.3,41.26,54.28,41.26,57.74L41.26,57.74z M112.61,57.74c0,3.47-1.15,6.44-3.49,8.89 c-2.32,2.45-5.14,3.69-8.43,3.69c-3.32,0-6.14-1.24-8.46-3.69c-2.32-2.45-3.49-5.42-3.49-8.89c0-3.47,1.17-6.44,3.49-8.89 c2.32-2.47,5.14-3.69,8.46-3.69c3.29,0,6.11,1.21,8.43,3.69C111.46,51.3,112.61,54.28,112.61,57.74L112.61,57.74z M100.67,53.74 c2.21,0,4,1.79,4,4c0,2.21-1.79,4-4,4c-2.21,0-4-1.79-4-4C96.67,55.53,98.46,53.74,100.67,53.74L100.67,53.74z M29.32,53.74 c2.21,0,4,1.79,4,4c0,2.21-1.79,4-4,4c-2.21,0-4-1.79-4-4C25.32,55.53,27.11,53.74,29.32,53.74L29.32,53.74z M52.54,8.05h15.08 v20.07H52.54V8.05L52.54,8.05z M37.62,32.16h6.21v1.7h-6.21V32.16L37.62,32.16z M43.83,28.12V8.05H28.76l-7.97,20.07H43.83 L43.83,28.12L43.83,28.12z M99.61,8.05h15.08v20.07H99.61V8.05L99.61,8.05z M76.55,8.05h15.08v20.07H76.55V8.05L76.55,8.05z" />
              </g>
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <BannerUser onMenuToggle={setIsMenuOpen} />
        <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
          <div className={styles.contentContainer}>
            <h1 className={styles.pageTitle}>Mis Vehículos</h1>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Cargando vehículos...</p>
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
              <div className={styles.errorIcon}></div>
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
          <div className={styles.statsContainer} style={{ marginBottom: '12px' }}>
            <span className={styles.statsText}>
              Usted tiene {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            className={styles.addButton}
            onClick={handleAgregarVehiculo}
            type="button"
            aria-label="Agregar otro vehículo"
          >
            <span className={styles.addButtonIcon} aria-hidden="true">
              {/* Ícono plus */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </span>
            <span className={styles.addButtonLabel}>Agregar vehículo</span>
          </button>
          {vehiculos.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}></div>
              <h3 className={styles.emptyTitle}>No tienes vehículos registrados</h3>

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
                         {vehiculo.patente}
                      </div>
                    </div>
                    
                    <div className={styles.cardActions}>
               <button className={styles.editButton} onClick={() => handleEditar(vehiculo)}>
                         Editar
                      </button>
            <button className={styles.deleteButton} onClick={() => solicitarEliminar(vehiculo)}>
                         Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {confirmDelete.open && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmCard}>
            <h3 className={styles.confirmTitle}>¿Eliminar vehículo?</h3>
            <p className={styles.confirmText}>
              Se eliminará "{confirmDelete.vehiculo?.marca} {confirmDelete.vehiculo?.modelo}" con patente {confirmDelete.vehiculo?.patente}.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmCancel} onClick={cerrarConfirmacion}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmDelete} onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MisVehiculos;

