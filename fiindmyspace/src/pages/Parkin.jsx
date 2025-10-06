import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession } from '../utils/auth';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BannerUser from '../components/BannerUser';

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

  if (!user) return null;

  return (
    <>
      <BannerUser />
      <div style={{ marginTop: 100, marginBottom: 60, textAlign: 'center' }}>
        <h2>Bienvenido a Parking</h2>
        <p style={{ 
          marginTop: 20, 
          marginBottom: 30, 
          fontSize: 14, 
          color: '#666', 
          fontStyle: 'italic',
          maxWidth: 600,
          margin: '20px auto 30px auto',
          lineHeight: 1.5
        }}>
          <strong>Aclaración:</strong> Las búsquedas de estacionamientos pueden realizarse por ubicación exacta del estacionamiento o mostrando el entorno cercano de la ubicación para facilitar tu elección.
        </p>

        {/* Formulario de lugar destino */}
        <form style={{ marginTop: 40 }} onSubmit={handleSearch}>
          <div style={{ marginBottom: 24, position: 'relative', display: 'inline-block' }}>
            <label style={{ fontWeight: 'bold', fontSize: 18 }}>Lugar destino:</label>
            <input
              type="text"
              value={addressInput}
              onChange={handleAddressChange}
              placeholder="Buscar dirección"
              style={{ marginLeft: 12, padding: 8, fontSize: 16, width: 250 }}
              required
              autoComplete="off"
            />
            {/* Sugerencias de autocompletado */}
            {suggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 40,
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  zIndex: 10,
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  maxHeight: 180,
                  overflowY: 'auto',
                  width: '100%',
                }}
              >
                {suggestions.map((sug) => (
                  <li
                    key={sug.properties.place_id}
                    onClick={() => handleSuggestionClick(sug)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {sug.properties.formatted}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Mostrar dirección real si existe */}
          {resolvedAddress && (
            <div style={{ marginBottom: 24, color: '#2d7cff', fontWeight: 'bold' }}>
              {resolvedAddress}
            </div>
          )}

          {/* Formulario de tipo de estacionamiento */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 'bold', fontSize: 18 }}>Tipo de estacionamiento:</label>
            <select
              value={parkingType}
              onChange={handleParkingTypeChange}
              style={{ marginLeft: 12, padding: 8, fontSize: 16 }}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="privado">Estacionamiento privado</option>
              <option value="publico">Estacionamiento público</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 32px',
              fontSize: 18,
              cursor: 'pointer',
              backgroundColor: '#2d7cff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
            }}
          >
            Buscar
          </button>
        </form>

        {/* Resultados de búsqueda */}
        {searchResult && (
          <div style={{ marginTop: 40, whiteSpace: 'pre-line', fontSize: 16 }}>
            {searchResult}
          </div>
        )}

        {/* Mapa con la ubicación seleccionada */}
        {showMap && (
          <>
            {/* Leyenda de iconos */}
            <div style={{ 
              marginTop: 30, 
              marginBottom: 20, 
              padding: 15, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 8, 
              border: '1px solid #dee2e6',
              maxWidth: 600,
              margin: '30px auto 20px auto'
            }}>
              <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', color: '#495057' }}>Leyenda del Mapa</h4>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/ubicacion.png" alt="Ubicación" style={{ width: 38, height: 38 }} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Tu búsqueda</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/privado.png" alt="Privado" style={{ width: 32, height: 32 }} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Estacionamiento Privado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/publico.png" alt="Público" style={{ width: 32, height: 32 }} />
                  <span style={{ fontSize: 14, color: '#495057' }}>Estacionamiento Público</span>
                </div>
              </div>
            </div>

            <div style={{ margin: '40px auto', width: '80vw', height: '400px', maxWidth: 600 }}>
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
