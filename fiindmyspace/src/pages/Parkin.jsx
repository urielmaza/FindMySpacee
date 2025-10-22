import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession } from '../utils/auth';
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
  const mapRef = useRef(null); // Referencia al mapa

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

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
        setParkingMap(data.data.espacio.mapa); // Guardar el mapa obtenido del backend
      } else {
        console.log('No se encontró mapa en la respuesta');
        setParkingMap(null); // No se encontró un mapa
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

  const handleSquareClick = (plazaNum) => {
    navigate('/reservas', { state: { plazaNumero: plazaNum } });
  };

  if (!user) return null;

  // Vista de detalles del estacionamiento
  if (selectedParking) {
    return (
      <div className={styles.detailsPage}>
        <h1 className={styles.detailsTitle}>Reserva tu estacionamiento</h1>
        <div className={styles.detailsContent}>
          <p><strong>Ubicación:</strong> {selectedParking.ubicacion}</p>
          <p><strong>Tipo:</strong> {selectedParking.tipo_de_estacionamiento === 'privado' ? 'Privado' : 'Público'}</p>
          <p><strong>Latitud:</strong> {selectedParking.latitud}</p>
          <p><strong>Longitud:</strong> {selectedParking.longitud}</p>
        </div>

        {/* Renderizar el mapa del estacionamiento */}
        {parkingMap ? (
          <div
            className={styles.mapArea}
            style={{
              width: parkingMap.areaSize || '100%',
              height: parkingMap.areaSize || '400px',
              margin: '20px auto',
              position: 'relative',
            }}
          >
            {parkingMap.plazasPos.map((plaza) => (
              <div
                key={plaza.num}
                className={`${styles.plaza} ${parkingMap.selectedPlazas.includes(plaza.num) ? styles.plazaSelected : ''}`}
                style={{
                  position: 'absolute',
                  left: `${plaza.x}px`,
                  top: `${plaza.y}px`,
                  width: `${parkingMap.plazaSize}px`,
                  height: `${parkingMap.plazaSize}px`,
                }}
                title={`Plaza ${plaza.num}`}
                onClick={() => handleSquareClick(plaza.num)} // Redirigir al hacer clic
              >
                {plaza.num}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noMapMessage}>No hay un mapa disponible para este estacionamiento.</p>
        )}

        <button className={styles.backButton} onClick={handleBackClick}>
          Atrás
        </button>
      </div>
    );
  }

  return (
    <>
      <BannerUser />
      <div className={styles.pageContainer} style={{ padding: '20px' }}> {/* Ajustar el contenedor principal */}
        <h2 className={styles.title} style={{ fontSize: '1.5rem', textAlign: 'center' }}>Bienvenido a Parking</h2> {/* Ajustar tamaño de fuente */}
        <p className={styles.subtitle} style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '20px' }}> {/* Ajustar subtítulo */}
          <strong>Aclaración:</strong> Las búsquedas de estacionamientos pueden realizarse por ubicación exacta del estacionamiento o mostrando el entorno cercano de la ubicación para facilitar tu elección.
        </p>

        {/* Formulario de lugar destino */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', position: 'relative', flexDirection: 'column' }}> {/* Ajustar altura del contenedor padre */}
          <div className={styles.card} style={{ textAlign: 'center', padding: '20px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '500px' }}> {/* Ajustar estilo de la tarjeta */}
            <form className={styles.form} onSubmit={handleSearch} style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}> {/* Centrar el formulario y añadir separación */}
              <div className={styles.addressRow} style={{ width: '100%' }}> {/* Ajustar ancho interno */}
                <label className={styles.label} style={{ fontSize: '0.9rem' }}>Dirección:</label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={handleAddressChange}
                  placeholder="Buscar dirección"
                  className={styles.addressInput}
                  required
                  autoComplete="off"
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }} // Hacer el campo de dirección más ancho
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className={styles.useLocationBtn}
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                >
                  {isLocating ? 'Obteniendo…' : 'Usar mi ubicación'}
                </button>
              </div>

              {/* Formulario de tipo de estacionamiento */}
              <div style={{ marginBottom: 24, width: '100%' }}> {/* Ajustar ancho interno */}
                <label className={styles.label} style={{ fontSize: '0.9rem' }}>Tipo de estacionamiento:</label>
                <select
                  value={parkingType}
                  onChange={handleParkingTypeChange}
                  className={styles.select}
                  required
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="privado">Estacionamiento privado</option>
                  <option value="publico">Estacionamiento público</option>
                </select>
              </div>

              <button type="submit" className={styles.submitButton} style={{ fontSize: '0.9rem', padding: '10px' }}>
                Buscar
              </button>
            </form>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchResult && (
          <div className={styles.results} style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>
            {searchResult}
          </div>
        )}

        {/* Mapa con la ubicación seleccionada */}
        {showMap && (
          <>
            {/* Leyenda de iconos */}
            <div className={styles.legendCard} style={{ margin: '20px auto', maxWidth: '500px', fontSize: '0.9rem' }}> {/* Ajustar leyenda */}
              <h4 className={styles.legendTitle} style={{ textAlign: 'center', fontSize: '1rem' }}>Leyenda del Mapa</h4>
              <div className={styles.legendRow} style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div className={styles.legendItem}>
                  <img src="/ubicacion.png" alt="Ubicación" style={{ width: 38, height: 38 }} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Tu búsqueda</span>
                </div>
                <div className={styles.legendItem}>
                  <img src="/privado.png" alt="Privado" style={{ width: 32, height: 32 }} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Estacionamiento Privado</span>
                </div>
                <div className={styles.legendItem}>
                  <img src="/publico.png" alt="Público" style={{ width: 32, height: 32 }} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Estacionamiento Público</span>
                </div>
              </div>
            </div>

            <div className={styles.mapWrapper} style={{ width: '100%', height: '300px', margin: '0 auto', maxWidth: '500px' }}> {/* Ajustar mapa */}
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
                        <strong>📍 Ubicación buscada</strong><br/>
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

            {/* Listado de estacionamientos en formato de tarjetas */}
            <div className={styles.cardListWrapper} style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}> {/* Contenedor padre para centrar las tarjetas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '100%' }}> {/* Tarjetas en forma de fila */}
                {direcciones.map((direccion) => (
                  <div
                    key={direccion.id_espacio}
                    className={styles.card}
                    style={{ flex: '1 1 calc(50% - 10px)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '10px', maxWidth: '300px' }} // Ajustar tamaño de la tarjeta
                    onClick={() => handleCardClick(direccion)} // Manejar clic en la tarjeta
                  >
                    <h5 className={styles.cardTitle} style={{ fontSize: '0.9rem' }}>{direccion.ubicacion}</h5>
                    <p className={styles.cardType} style={{ fontSize: '0.8rem' }}>
                      Tipo: {direccion.tipo_de_estacionamiento === 'privado' ? 'Privado' : 'Público'}
                    </p>
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

export default Parkin;
