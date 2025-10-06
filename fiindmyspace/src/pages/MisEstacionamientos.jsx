import React, { useState, useEffect } from 'react';
import BannerUser from '../components/BannerUser';
import styles from './MisEstacionamientos.module.css';

const MisEstacionamientos = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mapasGuardados, setMapasGuardados] = useState([]);

  // Cargar mapas guardados al montar el componente
  useEffect(() => {
    const mapas = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
    setMapasGuardados(mapas);
    console.log('🗺️ Mapas cargados desde sesión:', mapas);
  }, []);

  // Función para eliminar un mapa
  const eliminarMapa = (index) => {
    const nuevosMapas = mapasGuardados.filter((_, i) => i !== index);
    setMapasGuardados(nuevosMapas);
    localStorage.setItem('findmyspace_mapas', JSON.stringify(nuevosMapas));
    console.log('🗑️ Mapa eliminado. Mapas restantes:', nuevosMapas.length);
  };

  // Función para formatear fecha
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <BannerUser onMenuToggle={setIsMenuOpen} />
      <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
        <div className={styles.contentContainer}>
          <h1 className={styles.pageTitle}>Mis Estacionamientos</h1>
          
          {mapasGuardados.length === 0 ? (
            <div className={styles.listContainer}>
              <p className={styles.emptyMessage}>
                No tienes estacionamientos registrados aún.
              </p>
            </div>
          ) : (
            <div className={styles.mapasGrid}>
              {mapasGuardados.map((mapaData, index) => {
                const { estacionamiento, mapa } = mapaData;
                return (
                  <div key={index} className={styles.mapaCard}>
                    {/* Header de la tarjeta */}
                    <div className={styles.cardHeader}>
                      <h3 className={styles.nombreEstacionamiento}>
                        {estacionamiento.nombre}
                      </h3>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => eliminarMapa(index)}
                        title="Eliminar estacionamiento"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Información del estacionamiento */}
                    <div className={styles.infoEstacionamiento}>
                      <p><strong>📍 Ubicación:</strong> {estacionamiento.ubicacion}</p>
                      <p><strong>🚗 Plazas:</strong> {estacionamiento.plazas}</p>
                      <p><strong>🏢 Tipo:</strong> {estacionamiento.tipo} - {estacionamiento.tipoEstructura}</p>
                      {estacionamiento.tipo === 'privado' && (
                        <p><strong>💰 Precio:</strong> ${estacionamiento.precio}/hora</p>
                      )}
                      <p><strong>🕒 Horario:</strong> {estacionamiento.apertura} - {estacionamiento.cierre}</p>
                      <p><strong>📅 Creado:</strong> {formatearFecha(estacionamiento.fechaCreacion)}</p>
                    </div>

                    {/* Visualización del mapa */}
                    <div className={styles.mapaVisualizacion}>
                      <h4 className={styles.mapaTitle}>Layout del Estacionamiento</h4>
                      <div 
                        className={styles.mapaContainer}
                        style={{
                          width: mapa.areaSize * 0.6, // Escala reducida para la vista
                          height: mapa.areaSize * 0.6,
                          position: 'relative',
                          background: '#f7f7f7',
                          border: '2px solid #2d7cff',
                          borderRadius: 8,
                          margin: '12px auto'
                        }}
                      >
                        {mapa.plazasPos.map((plaza) => (
                          <div
                            key={plaza.num}
                            className={styles.plazaVista}
                            style={{
                              position: 'absolute',
                              left: plaza.x * 0.6, // Escala reducida
                              top: plaza.y * 0.6,
                              width: mapa.plazaSize * 0.6,
                              height: mapa.plazaSize * 0.6,
                              background: mapa.selectedPlazas.includes(plaza.num) ? '#2d7cff' : '#fff',
                              color: mapa.selectedPlazas.includes(plaza.num) ? '#fff' : '#222',
                              border: '1px solid #2d7cff',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                            }}
                            title={`Plaza ${plaza.num}`}
                          >
                            {plaza.num}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MisEstacionamientos;
