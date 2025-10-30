import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './MisEstacionamientos.module.css';

// Iconos SVG inline para reemplazar emojis
const IconTrash = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -0.5 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g transform="translate(-179, -360)" fill="currentColor" fillRule="evenodd">
      <g transform="translate(56, 160)">
        <path d="M130.35,216 L132.45,216 L132.45,208 L130.35,208 L130.35,216 Z M134.55,216 L136.65,216 L136.65,208 L134.55,208 L134.55,216 Z M128.25,218 L138.75,218 L138.75,206 L128.25,206 L128.25,218 Z M130.35,204 L136.65,204 L136.65,202 L130.35,202 L130.35,204 Z M138.75,204 L138.75,200 L128.25,200 L128.25,204 L123,204 L123,206 L126.15,206 L126.15,220 L140.85,220 L140.85,206 L144,206 L144,204 L138.75,204 Z" />
      </g>
    </g>
  </svg>
);

const IconLocation = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.686 2 6 4.686 6 8c0 4.637 5.153 9.405 5.373 9.606a1 1 0 0 0 1.254 0C12.847 17.405 18 12.637 18 8c0-3.314-2.686-6-6-6Zm0 2a4 4 0 0 1 4 4c0 2.72-2.62 6.116-4 7.606C10.62 14.116 8 10.72 8 8a4 4 0 0 1 4-4Zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
  </svg>
);

const IconCar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 11 7.1 7.6A3 3 0 0 1 9.86 6h4.28a3 3 0 0 1 2.76 1.6L18.5 11H20a1 1 0 1 1 0 2h-1v3a2 2 0 0 1-2 2h-1a1 1 0 1 1 0-2h1v-3H7v3h1a1 1 0 1 1 0 2H7a2 2 0 0 1-2-2v-3H4a1 1 0 1 1 0-2h1.5Zm2.36-2.86A1 1 0 0 1 9.86 7h4.28a1 1 0 0 1 .9.54L16.92 11H7.08l.78-1.46a1 1 0 0 1 1-.4ZM7 15.5A1.5 1.5 0 1 0 7 12a1.5 1.5 0 0 0 0 3.5Zm10 0A1.5 1.5 0 1 0 17 12a1.5 1.5 0 0 0 0 3.5Z" />
  </svg>
);

const IconBuilding = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 21a1 1 0 0 1-1-1V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2h2a3 3 0 0 1 3 3v10a1 1 0 1 1-2 0V10a1 1 0 0 0-1-1h-2v11a1 1 0 1 1-2 0v-2H6v2a1 1 0 0 1-2 0Zm2-4h8V5a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v12Zm2-9a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2H8Zm0 4a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2H8Zm0 4a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2H8Z" />
  </svg>
);

const IconMoney = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v1h1a1 1 0 1 1 0 2h-1v4h1a1 1 0 1 1 0 2h-1v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Zm2 0v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Zm10 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-2 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
  </svg>
);

const IconClock = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 6V12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.24 16.24L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCalendar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2a1 1 0 0 0 0 2h1v1a1 1 0 1 0 2 0V4h4v1a1 1 0 1 0 2 0V4h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V2H7Zm12 7H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9Z" />
  </svg>
);

const MisEstacionamientos = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mapasGuardados, setMapasGuardados] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [error, setError] = useState(null);
  const [estadoPlazas, setEstadoPlazas] = useState({}); // { keyEst: { [num]: 'libre'|'ocupado'|'reservado' } }

  // Cargar mapas guardados al montar el componente
  useEffect(() => {
    const mapas = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
    setMapasGuardados(mapas);
    // Cargar estados persistidos de plazas
    try {
      const raw = localStorage.getItem('findmyspace_estados_plazas');
      if (raw) setEstadoPlazas(JSON.parse(raw));
    } catch (_) {}
    // Cargar espacios desde la API
    const fetchEspacios = async () => {
      try {
        const session = getUserSession();
        if (!session) return;
        const res = await apiClient.get(`/espacios/usuario/${session.id_cliente}`);
        if (res.data?.success) {
          setEspacios(res.data.data || []);
        } else {
          setError('No se pudieron cargar los estacionamientos');
        }
      } catch (e) {
        console.error('Error cargando espacios:', e);
        setError('Error al cargar los estacionamientos');
      }
    };
    fetchEspacios();
  }, []);

  // Helpers de estados
  const buildEstKey = (esp, estacionamiento, fallbackKey) => {
    if (esp && esp.id_espacio) return `espacio:${esp.id_espacio}`;
    const name = (estacionamiento?.nombre || '').trim().toLowerCase();
    const ubi = (estacionamiento?.ubicacion || '').trim().toLowerCase();
    const plazas = Number(estacionamiento?.plazas || 0);
    return fallbackKey || `est:${name}|${ubi}|${plazas}`;
  };

  const nextEstado = (estadoActual) => {
    switch (estadoActual) {
      case 'libre':
        return 'ocupado';
      case 'ocupado':
        return 'reservado';
      default:
        return 'libre';
    }
  };

  const togglePlaza = (estKey, num) => {
    setEstadoPlazas((prev) => {
      const actual = prev?.[estKey]?.[num] || 'libre';
      const siguiente = nextEstado(actual);
      const updated = {
        ...prev,
        [estKey]: { ...(prev[estKey] || {}), [num]: siguiente },
      };
      try { localStorage.setItem('findmyspace_estados_plazas', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const estadoToClass = (estado) => {
    if (estado === 'ocupado') return styles.plazaOcupado;
    if (estado === 'reservado') return styles.plazaReservado;
    return styles.plazaLibre; // libre por defecto (violeta)
  };

  // Función para eliminar un mapa
  const eliminarMapa = (index) => {
    const nuevosMapas = mapasGuardados.filter((_, i) => i !== index);
    setMapasGuardados(nuevosMapas);
    localStorage.setItem('findmyspace_mapas', JSON.stringify(nuevosMapas));
  };

  // Eliminar un espacio desde la base de datos
  const eliminarEspacioDB = async (id_espacio) => {
    try {
      await apiClient.delete(`/espacios/${id_espacio}`);
      setEspacios((prev) => prev.filter(e => e.id_espacio !== id_espacio));
    } catch (e) {
      console.error('Error al eliminar espacio:', e);
      alert('No se pudo eliminar el estacionamiento.');
    }
  };

  // Editar (navegar a la pantalla de subir con id)
  const editarEspacio = (esp, estacionamiento) => {
    // Intentar enviar el layout asociado por state para que el formulario lo precargue
    const match = mapasGuardados.find((m) => {
      const e = m?.estacionamiento || {};
      // 0) Priorizar coincidencia por ID de espacio si está disponible
      if (e.idEspacio && Number(e.idEspacio) === Number(esp.id_espacio)) return true;
      const byNameUbi = (
        ((e.nombre || '').trim().toLowerCase()) === ((estacionamiento.nombre || '').trim().toLowerCase()) &&
        ((e.ubicacion || '').trim().toLowerCase()) === ((estacionamiento.ubicacion || '').trim().toLowerCase()) &&
        Number(e.plazas) === Number(estacionamiento.plazas)
      );
      if (byNameUbi) return true;
      // Fallback: por coordenadas si existen
      const c = Array.isArray(e.coordenadas) ? e.coordenadas : [];
      if (c.length === 2 && typeof esp.latitud === 'number' && typeof esp.longitud === 'number') {
        const eps = 1e-5;
        const dLat = Math.abs(Number(c[0]) - Number(esp.latitud));
        const dLon = Math.abs(Number(c[1]) - Number(esp.longitud));
        if (dLat < eps && dLon < eps && Number(e.plazas) === Number(estacionamiento.plazas)) return true;
      }
      return false;
    });
    navigate(`/subir-estacionamiento?id=${esp.id_espacio}` , { state: { layout: match?.mapa || null } });
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
          <div className={styles.actionsContainer}>
            <div className={styles.statsContainer}>
              <span className={styles.statsText}>
                Usted tiene {espacios.length} {espacios.length === 1 ? 'estacionamiento' : 'estacionamientos'}
              </span>
            </div>
            <button
              className={styles.addButton}
              type="button"
              onClick={() => navigate('/subir-estacionamiento')}
            >
              + Agregar estacionamiento
            </button>
          </div>
          
          {/* Lista desde BD */}
          {espacios.length > 0 && (
            <div className={styles.mapasGrid}>
              {espacios.map((esp) => {
                const estacionamiento = {
                  nombre: esp.nombre_estacionamiento,
                  ubicacion: esp.ubicacion,
                  plazas: esp.cantidad_plazas,
                  tipo: esp.tipo_de_estacionamiento,
                  tipoEstructura: esp.tipo_estructura,
                  fechaCreacion: esp.fecha_creacion || esp.created_at || new Date().toISOString(),
                };
                
                // Buscar el mapa correspondiente en localStorage
                const mapaEncontrado = mapasGuardados.find((m) => {
                  const e = m?.estacionamiento;
                  if (!e) return false;
                  // 1) Por idEspacio si está disponible
                  if (e.idEspacio && Number(e.idEspacio) === Number(esp.id_espacio)) return true;
                  // 2) Por nombre + ubicación + plazas
                  return (
                    (e.nombre || '').trim().toLowerCase() === (estacionamiento.nombre || '').trim().toLowerCase() &&
                    (e.ubicacion || '').trim().toLowerCase() === (estacionamiento.ubicacion || '').trim().toLowerCase() &&
                    Number(e.plazas) === Number(estacionamiento.plazas)
                  );
                });

                return (
                  <div key={esp.id_espacio} className={styles.mapaCard}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.nombreEstacionamiento}>
                        {estacionamiento.nombre}
                      </h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={styles.editButton}
                          onClick={() => editarEspacio(esp, estacionamiento)}
                          title="Editar estacionamiento"
                          aria-label="Editar estacionamiento"
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => eliminarEspacioDB(esp.id_espacio)}
                          title="Eliminar estacionamiento"
                          aria-label="Eliminar estacionamiento"
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className={styles.infoEstacionamiento}>
                      <p className={styles.infoRow}>
                        <span className={styles.infoLabel}><span className={styles.icon}><IconLocation /></span> Ubicación:</span> {estacionamiento.ubicacion}
                      </p>
                      <p className={styles.infoRow}>
                        <span className={styles.infoLabel}><span className={styles.icon}><IconCar /></span> Plazas:</span> {estacionamiento.plazas}
                      </p>
                      <p className={styles.infoRow}>
                        <span className={styles.infoLabel}><span className={styles.icon}><IconBuilding /></span> Tipo:</span> {estacionamiento.tipo} {estacionamiento.tipoEstructura ? `- ${estacionamiento.tipoEstructura}` : ''}
                      </p>
                      <p className={styles.infoRow}><span className={styles.infoLabel}><span className={styles.icon}><IconCalendar /></span> Creado:</span> {new Date(estacionamiento.fechaCreacion).toLocaleDateString('es-ES')}</p>
                    </div>

                    {/* Visualización del mapa desde localStorage */}
                    {mapaEncontrado && mapaEncontrado.mapa && (
                      <div className={styles.mapaVisualizacion}>
                        <h4 className={styles.mapaTitle}>Layout del Estacionamiento</h4>
                        {Array.isArray(mapaEncontrado.mapa.pisos) && mapaEncontrado.mapa.pisos.length > 0 ? (
                          (() => {
                            const pisosOrdenados = [...mapaEncontrado.mapa.pisos].sort((a,b)=>a.nivel-b.nivel);
                            const piso = pisosOrdenados[0];
                            const areaSize = piso.areaSize || 400;
                            const plazaSize = piso.plazaSize || 40;
                            const plazas = piso.plazasPos || [];
                            const seleccionadas = piso.selectedPlazas || [];
                            return (
                              <>
                                <div className={styles.helperText} style={{ textAlign: 'center' }}>
                                  Mostrando {piso.nivel === -1 ? 'Subsuelo (-1)' : (piso.nivel === 0 ? 'Planta baja (0)' : `Piso ${piso.nivel}`)}
                                </div>
                                <div
                                  className={styles.mapaContainer}
                                  style={{
                                    width: areaSize * 0.9,
                                    height: areaSize * 0.9,
                                    position: 'relative',
                                    background: '#f7f7f7',
                                    border: '2px solid #2d7cff',
                                    borderRadius: 8,
                                    margin: '12px auto'
                                  }}
                                >
                                  {plazas.map((plaza) => {
                                    const estKey = buildEstKey(esp, estacionamiento);
                                    const estado = estadoPlazas?.[estKey]?.[plaza.num] || 'libre';
                                    return (
                                      <div
                                        key={plaza.num}
                                        className={`${styles.plazaVista} ${estadoToClass(estado)}`}
                                        style={{
                                          position: 'absolute',
                                          left: (plaza.x || 0) * 0.9,
                                          top: (plaza.y || 0) * 0.9,
                                          width: plazaSize * 0.9,
                                          height: plazaSize * 0.9,
                                        }}
                                        title={`Plaza ${plaza.num} - ${estado}`}
                                        aria-label={`Plaza ${plaza.num} - ${estado}. Click para cambiar estado`}
                                        tabIndex={0}
                                        onClick={() => togglePlaza(estKey, plaza.num)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlaza(estKey, plaza.num); }
                                        }}
                                      >
                                        {plaza.num}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className={styles.legend}>
                                  <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaLibre}`}></span>Libre</span>
                                  <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaOcupado}`}></span>Ocupado</span>
                                  <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaReservado}`}></span>Reservado</span>
                                </div>
                              </>
                            );
                          })()
                        ) : (
                        <>
                        <div
                          className={styles.mapaContainer}
                          style={{
                            width: (mapaEncontrado.mapa.areaSize || 400) * 0.9,
                            height: (mapaEncontrado.mapa.areaSize || 400) * 0.9,
                            position: 'relative',
                            background: '#f7f7f7',
                            border: '2px solid #2d7cff',
                            borderRadius: 8,
                            margin: '12px auto'
                          }}
                        >
                          {(mapaEncontrado.mapa.plazasPos || []).map((plaza) => {
                            const estKey = buildEstKey(esp, estacionamiento);
                            const estado = estadoPlazas?.[estKey]?.[plaza.num] || 'libre';
                            return (
                              <div
                                key={plaza.num}
                                className={`${styles.plazaVista} ${estadoToClass(estado)}`}
                                style={{
                                  position: 'absolute',
                                  left: (plaza.x || 0) * 0.9,
                                  top: (plaza.y || 0) * 0.9,
                                  width: (mapaEncontrado.mapa.plazaSize || 40) * 0.9,
                                  height: (mapaEncontrado.mapa.plazaSize || 40) * 0.9,
                                }}
                                title={`Plaza ${plaza.num} - ${estado}`}
                                aria-label={`Plaza ${plaza.num} - ${estado}. Click para cambiar estado`}
                                tabIndex={0}
                                onClick={() => togglePlaza(estKey, plaza.num)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlaza(estKey, plaza.num); }
                                }}
                              >
                                {plaza.num}
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.legend}>
                          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaLibre}`}></span>Libre</span>
                          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaOcupado}`}></span>Ocupado</span>
                          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaReservado}`}></span>Reservado</span>
                        </div>
                        </>
                        )}
                      </div>
                    )}

                    {/* Mensaje si no hay mapa */}
                    {!mapaEncontrado && (
                      <div className={styles.mapaVisualizacion}>
                        <p className={styles.noMapMessage}>No hay un diseño de mapa guardado para este estacionamiento.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista local como fallback/legado */}
          {espacios.length === 0 && (
            mapasGuardados.length === 0 ? (
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
                        aria-label="Eliminar estacionamiento"
                        type="button"
                      >
                        <span className={styles.icon}><IconTrash /></span>
                      </button>
                    </div>

                    {/* Información del estacionamiento */}
                    <div className={styles.infoEstacionamiento}>
                      <p className={styles.infoRow}>
                        <span className={styles.infoLabel}><span className={styles.icon}><IconLocation /></span> Ubicación:</span> {estacionamiento.ubicacion}
                      </p>
                      <p className={styles.infoRow}>
                        <span className={styles.infoLabel}><span className={styles.icon}><IconCar /></span> Plazas:</span> {estacionamiento.plazas}
                      </p>
                      <p className={styles.infoRow}>
                        <span className={styles.infoLabel}><span className={styles.icon}><IconBuilding /></span> Tipo:</span> {estacionamiento.tipo} - {estacionamiento.tipoEstructura}
                      </p>
                      {estacionamiento.tipo === 'privado' && (
                        <p className={styles.infoRow}><span className={styles.infoLabel}><span className={styles.icon}><IconMoney /></span> Precio:</span> ${estacionamiento.precio}/hora</p>
                      )}
                      <p className={styles.infoRow}><span className={styles.infoLabel}><span className={styles.icon}><IconClock /></span> Horario:</span> {estacionamiento.apertura} - {estacionamiento.cierre}</p>
                      <p className={styles.infoRow}><span className={styles.infoLabel}><span className={styles.icon}><IconCalendar /></span> Creado:</span> {formatearFecha(estacionamiento.fechaCreacion)}</p>
                    </div>

                    {/* Visualización del mapa */}
                    <div className={styles.mapaVisualizacion}>
                      <h4 className={styles.mapaTitle}>Layout del Estacionamiento</h4>
                      {Array.isArray(mapa.pisos) && mapa.pisos.length > 0 ? (
                        (() => {
                          const pisosOrdenados = [...mapa.pisos].sort((a,b)=>a.nivel-b.nivel);
                          const piso = pisosOrdenados[0];
                          const areaSize = piso.areaSize || 400;
                          const plazaSize = piso.plazaSize || 40;
                          const plazas = piso.plazasPos || [];
                          const seleccionadas = piso.selectedPlazas || [];
                          return (
                            <>
                              <div className={styles.helperText} style={{ textAlign: 'center' }}>
                                Mostrando {piso.nivel === -1 ? 'Subsuelo (-1)' : (piso.nivel === 0 ? 'Planta baja (0)' : `Piso ${piso.nivel}`)}
                              </div>
                              <div 
                                className={styles.mapaContainer}
                                style={{
                                  width: areaSize * 0.9,
                                  height: areaSize * 0.9,
                                  position: 'relative',
                                  background: '#f7f7f7',
                                  border: '2px solid #2d7cff',
                                  borderRadius: 8,
                                  margin: '12px auto'
                                }}
                              >
                                {plazas.map((plaza) => {
                                  const estKey = buildEstKey(null, estacionamiento, `local:${index}`);
                                  const estado = estadoPlazas?.[estKey]?.[plaza.num] || 'libre';
                                  return (
                                    <div
                                      key={plaza.num}
                                      className={`${styles.plazaVista} ${estadoToClass(estado)}`}
                                      style={{
                                        position: 'absolute',
                                        left: plaza.x * 0.9,
                                        top: plaza.y * 0.9,
                                        width: plazaSize * 0.9,
                                        height: plazaSize * 0.9,
                                      }}
                                      title={`Plaza ${plaza.num} - ${estado}`}
                                      aria-label={`Plaza ${plaza.num} - ${estado}. Click para cambiar estado`}
                                      tabIndex={0}
                                      onClick={() => togglePlaza(estKey, plaza.num)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlaza(estKey, plaza.num); }
                                      }}
                                    >
                                      {plaza.num}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={styles.legend}>
                                <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaLibre}`}></span>Libre</span>
                                <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaOcupado}`}></span>Ocupado</span>
                                <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaReservado}`}></span>Reservado</span>
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <>
                        <div 
                          className={styles.mapaContainer}
                          style={{
                            width: mapa.areaSize * 0.9, // Aumentado
                            height: mapa.areaSize * 0.9,
                            position: 'relative',
                            background: '#f7f7f7',
                            border: '2px solid #2d7cff',
                            borderRadius: 8,
                            margin: '12px auto'
                          }}
                        >
                          {mapa.plazasPos.map((plaza) => {
                            const estKey = buildEstKey(null, estacionamiento, `local:${index}`);
                            const estado = estadoPlazas?.[estKey]?.[plaza.num] || 'libre';
                            return (
                              <div
                                key={plaza.num}
                                className={`${styles.plazaVista} ${estadoToClass(estado)}`}
                                style={{
                                  position: 'absolute',
                                  left: plaza.x * 0.9,
                                  top: plaza.y * 0.9,
                                  width: mapa.plazaSize * 0.9,
                                  height: mapa.plazaSize * 0.9,
                                }}
                                title={`Plaza ${plaza.num} - ${estado}`}
                                aria-label={`Plaza ${plaza.num} - ${estado}. Click para cambiar estado`}
                                tabIndex={0}
                                onClick={() => togglePlaza(estKey, plaza.num)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlaza(estKey, plaza.num); }
                                }}
                              >
                                {plaza.num}
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.legend}>
                          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaLibre}`}></span>Libre</span>
                          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaOcupado}`}></span>Ocupado</span>
                          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.plazaReservado}`}></span>Reservado</span>
                        </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default MisEstacionamientos;
