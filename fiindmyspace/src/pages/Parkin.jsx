import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession } from '../utils/auth';
import apiClient from '../apiClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BannerUser from '../components/BannerUser';
import styles from './Parkin.module.css';

const API_URL = import.meta.env.VITE_API_URL;

// Crear iconos personalizados para diferentes tipos de estacionamiento
const privateIcon = new L.Icon({
  iconUrl: '/privado.png',
  iconSize: [56, 56],
  iconAnchor: [28, 56],
  popupAnchor: [0, -56],
});

const publicIcon = new L.Icon({
  iconUrl: '/publico.png',
  iconSize: [56, 56],
  iconAnchor: [28, 56],
  popupAnchor: [0, -56],
});

const locationIcon = new L.Icon({
  iconUrl: '/ubicacion.png',
  iconSize: [68, 68],
  iconAnchor: [34, 68],
  popupAnchor: [0, -68],
});

// Función para obtener el ícono correcto según el tipo de estacionamiento
const getIconByType = (tipo) => {
  switch (tipo) {
    case 'privado':
      return privateIcon;
    case 'publico':
      return publicIcon;
    default:
      return publicIcon; // Por defecto usar el ícono público
  };
};

const Parkin = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [parkingType, setParkingType] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [direcciones, setDirecciones] = useState([]); // Estado para las direcciones
  const [showMap, setShowMap] = useState(false); // Estado para mostrar el mapa
  const [isLocating, setIsLocating] = useState(false); // Estado para geolocalización
  const [selectedParking, setSelectedParking] = useState(null); // Estado para el estacionamiento seleccionado
  const [parkingMap, setParkingMap] = useState(null); // Estado para el mapa del estacionamiento
  const [selectedNivel, setSelectedNivel] = useState(null); // para multi-piso
  const mapRef = useRef(null); // Referencia al mapa

  // Selección de vehículo para reservar una plaza
  const [selectingPlaza, setSelectingPlaza] = useState(null);
  const [vehiculosUsuario, setVehiculosUsuario] = useState([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [vehiculosError, setVehiculosError] = useState('');
  const [selectedVehiculoId, setSelectedVehiculoId] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // Estados de plazas compartidos con MisEstacionamientos
  const [estadoPlazas, setEstadoPlazas] = useState({}); // { `espacio:<id>`: { [num]: 'libre'|'ocupado'|'reservado' } }

  useEffect(() => {
    const initializeParkin = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          navigate('/');
          return;
        }
        
        // Cargar datos iniciales si es necesario
        // Por ejemplo, cargar direcciones guardadas, etc.
        
      } catch (error) {
        console.error('Error initializing Parkin:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeParkin();
  }, [user, navigate]);

  // Cargar estados de plazas desde localStorage una vez
  useEffect(() => {
    try {
      const raw = localStorage.getItem('findmyspace_estados_plazas');
      if (raw) setEstadoPlazas(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const buildEstKey = (idEspacio) => (idEspacio ? `espacio:${idEspacio}` : null);
  const estadoToClass = (estado) => {
    if (estado === 'ocupado') return styles.plazaOcupado;
    if (estado === 'reservado') return styles.plazaReservado;
    return styles.plazaLibre; // libre
  };
  const setEstadoPersist = (estKey, num, nuevoEstado) => {
    setEstadoPlazas(prev => {
      const updated = { ...prev, [estKey]: { ...(prev[estKey] || {}), [num]: nuevoEstado } };
      try { localStorage.setItem('findmyspace_estados_plazas', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

  const handleLogout = () => {
    clearUserSession();
    navigate('/');
  };

  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setResolvedAddress('');
    setSuggestions([]);

    if (value.length > 2) {
      const resp = await fetch(`${API_URL}/api/autocomplete?text=${encodeURIComponent(value)}`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con tu navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Usar el backend para no exponer la API key y devolver formato requerido
          const resp = await fetch(`${API_URL}/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          const data = await resp.json();

          if (data && data.success) {
            const address = data.address || '';
            setAddressInput(address);
            setResolvedAddress(address);
            setSelectedCoords([latitude, longitude]);
            setSelectedAddress(address);
            setSuggestions([]);
          } else {
            alert(data?.error || 'No se pudo obtener la dirección de tu ubicación.');
          }
        } catch (error) {
          console.error('Error al obtener la dirección:', error);
          alert('Hubo un error al obtener tu ubicación.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
        setIsLocating(false);
        alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  const handleSuggestionClick = (suggestion) => {
    // Manejar explícitamente la opción "Usar mi ubicación actual"
    if (suggestion === 'current-location' || (suggestion && suggestion.id === 'current-location')) {
      handleUseCurrentLocation();
      return;
    }

    // Manejar sugerencias normales con estructura esperada
    if (suggestion && suggestion.properties && suggestion.properties.formatted) {
      setAddressInput(suggestion.properties.formatted);
      setResolvedAddress(suggestion.properties.formatted);
      setSuggestions([]);
      if (suggestion.geometry && suggestion.geometry.coordinates) {
        setSelectedCoords([suggestion.geometry.coordinates[1], suggestion.geometry.coordinates[0]]);
        setSelectedAddress(suggestion.properties.formatted);
      }
    } else {
      // Este caso no debería ocurrir para sugerencias normales
      console.error('La sugerencia seleccionada no tiene la estructura esperada:', suggestion);
    }
  };

  const handleParkingTypeChange = (e) => {    
    setParkingType(e.target.value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchResult(
      `Dirección: ${resolvedAddress || addressInput}\nTipo de estacionamiento: ${parkingType}`
    );

    // Obtener direcciones del backend
    try {
      let url = `${API_URL}/api/direcciones`;
      const params = new URLSearchParams();

      // Agregar filtros si están disponibles
      if (parkingType) {
        params.append('tipo', parkingType);
      }

      // Si tenemos coordenadas, buscar por ubicación
      if (selectedCoords) {
        params.append('latitud', selectedCoords[0]);
        params.append('longitud', selectedCoords[1]);
        params.append('radio', '10'); // Radio de 10km
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const resp = await fetch(url);
      const response = await resp.json();
      
      if (response.success) {
        setDirecciones(response.data);
      } else {
        console.error('Error en la respuesta:', response.error);
        setDirecciones([]);
      }
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
      setDirecciones([]);
    }

    // Mostrar el mapa
    setShowMap(true);

    // Centrar el mapa en las nuevas coordenadas seleccionadas
    if (mapRef.current && selectedCoords) {
      mapRef.current.setView(selectedCoords, 13); // Zoom nivel 13
    }
  };

  // Revisar y ajustar la lógica para asegurar que el mapa se renderice correctamente
  const handleCardClick = async (direccion) => {
    setSelectedParking(direccion); // Guardar el estacionamiento seleccionado

    try {
      // Solicitar el mapa del estacionamiento al backend
      console.log('Solicitando mapa para espacio ID:', direccion.id_espacio);
      const resp = await fetch(`${API_URL}/api/espacios/${direccion.id_espacio}`);
      const data = await resp.json();
      
      console.log('Respuesta del backend:', data);

      if (data.success && data.data?.espacio?.mapa) {
        console.log('Mapa encontrado:', data.data.espacio.mapa);
        const mapa = data.data.espacio.mapa;
        setParkingMap(mapa); // Guardar el mapa obtenido del backend
        // Si es multi-piso, seleccionar el primer nivel disponible
        if (Array.isArray(mapa.pisos) && mapa.pisos.length > 0) {
          const niveles = mapa.pisos.map(p => p.nivel).sort((a,b)=>a-b);
          setSelectedNivel(niveles[0]);
        } else {
          setSelectedNivel(null);
        }
      } else {
        console.log('No se encontró mapa en la respuesta');
        setParkingMap(null); // No se encontró un mapa
        setSelectedNivel(null);
      }
    } catch (error) {
      console.error('Error al obtener el mapa del estacionamiento:', error);
      setParkingMap(null); // En caso de error, no mostrar mapa
    }

    // Asegurarse de que el mapa se muestre correctamente
    setShowMap(true);
  };

  const handleBackClick = () => {
    setSelectedParking(null); // Volver a la vista principal
    setParkingMap(null); // Limpiar el mapa
  };

  const fetchVehiculosUsuario = async () => {
    try {
      setLoadingVehiculos(true);
      setVehiculosError('');
      const session = getUserSession();
      const id = session?.id_cliente;
      if (!id) {
        setVehiculosUsuario([]);
        setVehiculosError('No se encontró la sesión del usuario.');
        return;
      }
      const resp = await apiClient.get(`/vehiculos/usuario/${id}`);
      if (resp.data?.success) {
        setVehiculosUsuario(resp.data.data || []);
      } else {
        setVehiculosUsuario([]);
        setVehiculosError('No se pudieron obtener los vehículos.');
      }
    } catch (err) {
      console.error('Error obteniendo vehículos:', err);
      setVehiculosUsuario([]);
      setVehiculosError('Error al cargar los vehículos.');
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const handleSquareClick = async (plazaNum) => {
    // Abrir modal para seleccionar vehículo antes de reservar
    setSelectingPlaza(plazaNum);
    setIsVehicleModalOpen(true);
    setSelectedVehiculoId(null);
    await fetchVehiculosUsuario();
  };

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setSelectingPlaza(null);
    setSelectedVehiculoId(null);
  };

  const confirmVehicleSelection = () => {
    if (!selectedVehiculoId || !selectingPlaza) return;
    // Marcar como reservado al confirmar selección de vehículo
    const estKey = buildEstKey(selectedParking?.id_espacio);
    if (estKey) setEstadoPersist(estKey, selectingPlaza, 'reservado');
    const vehiculo = vehiculosUsuario.find(v => (v.id_vehiculo || v.id) === selectedVehiculoId);
    navigate('/reservas', { state: {
      plazaNumero: selectingPlaza,
      vehiculoId: selectedVehiculoId,
      vehiculo,
      parkingId: selectedParking?.id_espacio,
      parkingName: selectedParking?.nombre_estacionamiento || selectedParking?.ubicacion || ''
    }});
    closeVehicleModal();
  };

  if (!user) return null;

  // Vista de detalles del estacionamiento
  if (selectedParking) {
    const mapsQuery = (selectedParking.latitud && selectedParking.longitud)
      ? `${selectedParking.latitud},${selectedParking.longitud}`
      : (selectedParking.ubicacion || '');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
    return (
      <div className={styles.detailsPage}>
        <h1 className={styles.detailsTitle}>Reserva tu estacionamiento en</h1>
        <div className={styles.detailsContent}>
          <p className={styles.detailsName}>{selectedParking.nombre_estacionamiento || selectedParking.ubicacion || '—'}</p>
          <div className={styles.detailsAddressRow}>
            <div className={styles.addressInline}>
              {/* Ícono ubicación en SVG */}
              <svg className={styles.pinIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
              </svg>
              <span className={styles.detailsAddressText}>
                {selectedParking.ubicacion || 'Dirección no disponible'}
              </span>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapButton}>
              Cómo llegar
            </a>
          </div>
        </div>

        {/* Renderizar el mapa del estacionamiento */}
        {parkingMap ? (() => {
          // Compatibilidad: un solo piso vs. múltiples pisos
          const isMulti = Array.isArray(parkingMap.pisos) && parkingMap.pisos.length > 0;
          const pisoActual = isMulti
            ? parkingMap.pisos.find(p => p.nivel === selectedNivel) || parkingMap.pisos[0]
            : null;
          const areaSize = isMulti ? (pisoActual?.areaSize || 400) : (parkingMap.areaSize || 400);
          const plazaSize = isMulti ? (pisoActual?.plazaSize || 40) : (parkingMap.plazaSize || 40);
          const plazas = isMulti ? (pisoActual?.plazasPos || []) : (parkingMap.plazasPos || []);
          const seleccionadas = isMulti ? (pisoActual?.selectedPlazas || []) : (parkingMap.selectedPlazas || []);

          return (
            <>
              {isMulti && (
                <div className={styles.formGroup} style={{ maxWidth: 320, margin: '0 auto' }}>
                  <label className={styles.label} htmlFor="nivelSelect">Piso</label>
                  <select
                    id="nivelSelect"
                    className={styles.select}
                    value={selectedNivel ?? ''}
                    onChange={(e) => setSelectedNivel(Number(e.target.value))}
                  >
                    {parkingMap.pisos
                      .map(p => p.nivel)
                      .sort((a,b)=>a-b)
                      .map(n => (
                        <option key={n} value={n}>
                          {n === -1 ? 'Subsuelo (-1)' : (n === 0 ? 'Planta baja (0)' : `Piso ${n}`)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div
                className={styles.mapArea}
                style={{
                  width: areaSize || '100%',
                  height: areaSize || '400px',
                  margin: '20px auto',
                  position: 'relative',
                }}
              >
                {plazas.map((plaza) => {
                  const estKey = buildEstKey(selectedParking?.id_espacio);
                  const estado = estKey ? (estadoPlazas?.[estKey]?.[plaza.num] || 'libre') : 'libre';
                  const leftPx = clamp(Number(plaza.x) || 0, 0, (areaSize || 0) - (plazaSize || 0));
                  const topPx = clamp(Number(plaza.y) || 0, 0, (areaSize || 0) - (plazaSize || 0));
                  return (
                    <div
                      key={plaza.num}
                      className={`${styles.plaza} ${estadoToClass(estado)}`}
                      style={{
                        position: 'absolute',
                        left: `${leftPx}px`,
                        top: `${topPx}px`,
                        width: `${plazaSize}px`,
                        height: `${plazaSize}px`,
                      }}
                      title={`Plaza ${plaza.num} - ${estado}`}
                      aria-label={`Plaza ${plaza.num} - ${estado}${estado === 'libre' ? '. Click para reservar' : '. No disponible'}`}
                      onClick={() => {
                        if (estado !== 'libre') return; // bloquear uso si no está libre
                        handleSquareClick(plaza.num);
                      }}
                    >
                      {plaza.num}
                    </div>
                  );
                })}
              </div>
              <div className={styles.legendRow} style={{ justifyContent: 'center', gap: 16 }}>
                <span className={styles.legendItem}><span className={`${styles.legendDot ?? ''} ${styles.plazaLibre}`}></span>Libre</span>
                <span className={styles.legendItem}><span className={`${styles.legendDot ?? ''} ${styles.plazaOcupado}`}></span>Ocupado</span>
                <span className={styles.legendItem}><span className={`${styles.legendDot ?? ''} ${styles.plazaReservado}`}></span>Reservado</span>
              </div>
            </>
          );
        })() : (
          <p className={styles.noMapMessage}>No hay un mapa disponible para este estacionamiento.</p>
        )}

        <button className={styles.backButton} onClick={handleBackClick}>
          Atrás
        </button>

        {isVehicleModalOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle}>Elegí un vehículo</h3>

              {loadingVehiculos ? (
                <p className={styles.modalText}>Cargando vehículos…</p>
              ) : vehiculosError ? (
                <p className={styles.modalError}>{vehiculosError}</p>
              ) : vehiculosUsuario.length > 0 ? (
                <ul className={styles.vehiculosList}>
                  {vehiculosUsuario.map((v) => {
                    const id = v.id_vehiculo || v.id;
                    return (
                      <li key={id} className={styles.vehiculoItem}>
                        <label className={styles.vehiculoLabel}>
                          <input
                            type="radio"
                            name="vehiculo"
                            value={id}
                            checked={selectedVehiculoId === id}
                            onChange={() => setSelectedVehiculoId(id)}
                          />
                          <span className={styles.vehiculoInfo}>
                            {v.marca} {v.modelo} — {v.patente}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.modalEmpty}>
                  <p className={styles.modalText}>No tenés vehículos cargados.</p>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      navigate('/cargar-vehiculo');
                      closeVehicleModal();
                    }}
                  >
                    Agregar vehículo
                  </button>
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={closeVehicleModal}>
                  Cancelar
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={confirmVehicleSelection}
                  disabled={!selectedVehiculoId}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <BannerUser />
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BannerUser />
      <div className={styles.pageContainer}>
        <h2 className={styles.title}>Bienvenido a Parking</h2>
        <p className={styles.subtitle}>
          <strong>Aclaración:</strong> Las búsquedas de estacionamientos pueden realizarse por ubicación exacta del estacionamiento o mostrando el entorno cercano de la ubicación para facilitar tu elección.
        </p>

        {/* Formulario de lugar destino + Mapa a la derecha cuando esté visible */}
        <div className={styles.contentContainer}>
          <div className={styles.formCard}>
            <form className={styles.form} onSubmit={handleSearch}>
              <div className={styles.addressRow}>
                <label className={styles.label}>Dirección:</label>
                <div className={styles.addressInputWrapper}>
                  <input
                    type="text"
                    value={addressInput}
                    onChange={handleAddressChange}
                    placeholder="Buscar dirección"
                    className={styles.addressInput}
                    required
                    autoComplete="off"
                  />
                  {suggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList} role="listbox">
                      <li
                        className={styles.locationOption}
                        role="option"
                        onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick('current-location'); }}
                      >
                        📍 Usar mi ubicación actual
                      </li>
                      {suggestions.map((sug, idx) => (
                        <li
                          key={idx}
                          className={styles.suggestionItem}
                          role="option"
                          onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(sug); }}
                          title={sug?.properties?.formatted || ''}
                        >
                          {sug?.properties?.formatted || 'Sugerencia'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className={`${styles.useLocationBtn} ${isLocating ? styles.loading : ''}`}
                >
                  {isLocating ? 'Obteniendo…' : 'Usar mi ubicación'}
                </button>
              </div>

              {/* Formulario de tipo de estacionamiento */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de estacionamiento:</label>
                <select
                  value={parkingType}
                  onChange={handleParkingTypeChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="privado">Estacionamiento privado</option>
                  <option value="publico">Estacionamiento público</option>
                </select>
              </div>

              <button type="submit" className={styles.submitButton}>
                Buscar
              </button>
            </form>
          </div>

          {showMap && (<div className={styles.divider} aria-hidden="true" />)}

          {showMap && (
            <div className={styles.mapInline}>
              <MapContainer
                center={selectedCoords || [-34.603722, -58.381592]} // Coordenadas iniciales
                zoom={13}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
                ref={mapRef} // Asignar la referencia al mapa
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marcador de la dirección buscada */}
                {selectedCoords && (
                  <Marker position={selectedCoords} icon={locationIcon}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <strong>Ubicación buscada</strong><br/>
                        {selectedAddress}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Marcadores de direcciones obtenidas del backend */}
                {direcciones.map((direccion) => (
                  <Marker
                    key={direccion.id_espacio}
                    position={[direccion.latitud, direccion.longitud]}
                    icon={getIconByType(direccion.tipo_de_estacionamiento)}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <strong>{direccion.ubicacion}</strong><br/>
                        <small style={{ color: '#666' }}>
                          Tipo: {direccion.tipo_de_estacionamiento === 'privado' ? 'Privado' : 'Público'}
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Sección complementaria cuando el mapa está visible */}
        {showMap && (
          <>
            {/* Leyenda de iconos */}
            <div className={styles.legendCard}>
              <h4 className={styles.legendTitle}>Leyenda del Mapa</h4>
              <div className={styles.legendRow}>
                <div className={styles.legendItem}>
                  <img src="/ubicacion.png" alt="Ubicación" width={38} height={38} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Tu búsqueda</span>
                </div>
                <div className={styles.legendItem}>
                  <img src="/privado.png" alt="Privado" width={32} height={32} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Estacionamiento Privado</span>
                </div>
                <div className={styles.legendItem}>
                  <img src="/publico.png" alt="Público" width={32} height={32} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Estacionamiento Público</span>
                </div>
              </div>
            </div>

            {/* Título/estado de la sección de resultados */}
            {direcciones && direcciones.length > 0 ? (
              <h3 className={styles.cardSectionTitle}>Estacionamientos cercanos</h3>
            ) : (
              <p className={styles.noResults}>No se encontraron estacionamientos cerca</p>
            )}

            {/* Listado de estacionamientos en formato de tarjetas */}
            <div className={styles.cardListWrapper}>
              <div className={styles.cardList}>
                {direcciones.map((direccion) => (
                  <div
                    key={direccion.id_espacio}
                    className={styles.card}
                    onClick={() => handleCardClick(direccion)}
                  >
                    <h5 className={styles.cardTitle}>
                      {direccion.nombre_estacionamiento || direccion.ubicacion}
                    </h5>
                    <p className={styles.cardType}>{direccion.ubicacion}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Modal de selección de vehículo
// Lo renderizamos al final para evitar problemas de stacking context
// Nota: Se apoya en clases CSS definidas en parkin.module.css

export default Parkin;
