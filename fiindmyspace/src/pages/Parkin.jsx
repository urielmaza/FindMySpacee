import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession } from '../utils/auth';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BannerUser from '../components/BannerUser';
import styles from './parkin.module.css';

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
  }
};

const Parkin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [parkingType, setParkingType] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [direcciones, setDirecciones] = useState([]); // Estado para las direcciones
  const [showMap, setShowMap] = useState(false); // Estado para mostrar el mapa

  useEffect(() => {
    // Dar tiempo para que se cargue la sesión del localStorage
    const checkAuth = () => {
      try {
        const userSession = getUserSession();
        console.log('🔍 Verificando sesión en Parkin:', userSession);
        
        if (userSession) {
          setUser(userSession);
          setIsCheckingAuth(false);
        } else {
          // Dar una segunda oportunidad antes de redirigir
          setTimeout(() => {
            const retrySession = getUserSession();
            if (retrySession) {
              setUser(retrySession);
              setIsCheckingAuth(false);
            } else {
              console.log('❌ No hay sesión válida, redirigiendo al home');
              navigate('/');
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

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

  const handleSuggestionClick = (suggestion) => {
    setAddressInput(suggestion.properties.formatted);
    setResolvedAddress(suggestion.properties.formatted);
    setSuggestions([]);
    if (suggestion.geometry && suggestion.geometry.coordinates) {
      setSelectedCoords([suggestion.geometry.coordinates[1], suggestion.geometry.coordinates[0]]);
      setSelectedAddress(suggestion.properties.formatted);
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
        console.log('Direcciones obtenidas:', response.data.length, 'filtros aplicados:', response.filtros || 'ninguno');
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
  };

  // Mostrar loading mientras verifica la autenticación
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Cargando...
      </div>
    );
  }

  // Si no hay usuario después de la verificación, no mostrar nada (ya se redirigió)
  if (!user) return null;

  return (
    <>
      <BannerUser />
      <div className={styles.container}>
        <h2 className={styles.title}>Bienvenido a Parking</h2>
        <p className={styles.disclaimer}>
          <strong>Aclaración:</strong> Las búsquedas de estacionamientos pueden realizarse por ubicación exacta del estacionamiento o mostrando el entorno cercano de la ubicación para facilitar tu elección.
        </p>

        {/* Formulario de lugar destino */}
        <form className={styles.form} onSubmit={handleSearch}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Lugar destino:</label>
            <input
              type="text"
              value={addressInput}
              onChange={handleAddressChange}
              placeholder="Buscar dirección"
              className={styles.input}
              required
              autoComplete="off"
            />
            {/* Sugerencias de autocompletado */}
            {suggestions.length > 0 && (
              <ul className={styles.suggestions}>
                {suggestions.map((sug) => (
                  <li
                    key={sug.properties.place_id}
                    onClick={() => handleSuggestionClick(sug)}
                    className={styles.suggestionItem}
                  >
                    {sug.properties.formatted}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Mostrar dirección real si existe */}
          {resolvedAddress && (
            <div className={styles.resolvedAddress}>
              {resolvedAddress}
            </div>
          )}

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

          <button
            type="submit"
            className={styles.searchButton}
          >
            Buscar
          </button>
        </form>

        {/* Resultados de búsqueda */}
        {searchResult && (
          <div className={styles.searchResult}>
            {searchResult}
          </div>
        )}

        {/* Mapa con la ubicación seleccionada */}
        {showMap && (
          <>
            {/* Leyenda de iconos */}
            <div className={styles.legend}>
              <h4 className={styles.legendTitle}>Leyenda del Mapa</h4>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <img src="/ubicacion.png" alt="Ubicación" className={styles.legendIcon} style={{ width: 38, height: 38 }} />
                  <span className={styles.legendText}>Tu búsqueda</span>
                </div>
                <div className={styles.legendItem}>
                  <img src="/privado.png" alt="Privado" className={styles.legendIcon} />
                  <span className={styles.legendText}>Estacionamiento Privado</span>
                </div>
                <div className={styles.legendItem}>
                  <img src="/publico.png" alt="Público" className={styles.legendIcon} />
                  <span className={styles.legendText}>Estacionamiento Público</span>
                </div>
              </div>
            </div>

            <div className={styles.mapContainer}>
            <MapContainer
              center={selectedCoords || [-34.603722, -58.381592]} // Coordenadas iniciales
              zoom={13}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
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
          </>
        )}
      </div>
    </>
  );
};

export default Parkin;
