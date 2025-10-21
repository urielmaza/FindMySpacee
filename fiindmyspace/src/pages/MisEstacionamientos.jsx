import React, { useState, useEffect } from 'react';
import BannerUser from '../components/BannerUser';
import styles from './MisEstacionamientos.module.css';

const MisEstacionamientos = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mapasGuardados, setMapasGuardados] = useState([]);

  // Cargar mapas guardados al montar el componente
  useEffect(() => {
    try {
      const raw = localStorage.getItem('findmyspace_mapas');
      if (!raw) {
        setMapasGuardados([]);
        return;
      }
      const parsed = JSON.parse(raw);
      const sanitized = Array.isArray(parsed)
        ? parsed.filter((item) => {
            if (!item || typeof item !== 'object') return false;
            const mapa = item.mapa || {};
            return Array.isArray(mapa.plazasPos);
          })
        : [];
      setMapasGuardados(sanitized);
    } catch (e) {
      console.error('Error leyendo mapas guardados:', e);
      setMapasGuardados([]);
    }
  }, []);

  // Función para eliminar un mapa
  const eliminarMapa = (index) => {
    const nuevosMapas = mapasGuardados.filter((_, i) => i !== index);
    setMapasGuardados(nuevosMapas);
    localStorage.setItem('findmyspace_mapas', JSON.stringify(nuevosMapas));
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
                const estacionamiento = mapaData?.estacionamiento || {};
                const mapa = mapaData?.mapa || {};
                const areaSize = Number(mapa.areaSize) || 400;
                const plazaSize = Number(mapa.plazaSize) || 40;
                const plazasPos = Array.isArray(mapa.plazasPos) ? mapa.plazasPos : [];
                const selectedPlazas = Array.isArray(mapa.selectedPlazas) ? mapa.selectedPlazas : [];
                return (
                  <div key={index} className={styles.mapaCard}>
                    {/* Header de la tarjeta */}
                    <div className={styles.cardHeader}>
                      <h3 className={styles.nombreEstacionamiento}>
                        {estacionamiento.nombre || 'Estacionamiento'}
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
                      <p><strong>📍 Ubicación:</strong> {estacionamiento.ubicacion || '—'}</p>
                      <p><strong>🚗 Plazas:</strong> {estacionamiento.plazas ?? '—'}</p>
                      <p><strong>🏢 Tipo:</strong> {(estacionamiento.tipo || '—')} - {(estacionamiento.tipoEstructura || '—')}</p>
                      {estacionamiento.tipo === 'privado' && typeof estacionamiento.precio !== 'undefined' && (
                        <p><strong>💰 Precio:</strong> ${estacionamiento.precio}/hora</p>
                      )}
                      {estacionamiento.apertura && estacionamiento.cierre && (
                        <p><strong>🕒 Horario:</strong> {estacionamiento.apertura} - {estacionamiento.cierre}</p>
                      )}
                      {estacionamiento.fechaCreacion && (
                        <p><strong>📅 Creado:</strong> {formatearFecha(estacionamiento.fechaCreacion)}</p>
                      )}
                    </div>

                    {/* Visualización del mapa */}
                    <div className={styles.mapaVisualizacion}>
                      <h4 className={styles.mapaTitle}>Layout del Estacionamiento</h4>
                      <div 
                        className={styles.mapaContainer}
                        style={{
                          width: areaSize * 0.6, // Escala reducida para la vista
                          height: areaSize * 0.6,
                          position: 'relative',
                          background: '#f7f7f7',
                          border: '2px solid #2d7cff',
                          borderRadius: 8,
                          margin: '12px auto'
                        }}
                      >
                        {plazasPos.map((plaza) => (
                          <div
                            key={plaza.num}
                            className={styles.plazaVista}
                            style={{
                              position: 'absolute',
                              left: plaza.x * 0.6, // Escala reducida
                              top: plaza.y * 0.6,
                              width: plazaSize * 0.6,
                              height: plazaSize * 0.6,
                              background: selectedPlazas.includes(plaza.num) ? '#2d7cff' : '#fff',
                              color: selectedPlazas.includes(plaza.num) ? '#fff' : '#222',
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
