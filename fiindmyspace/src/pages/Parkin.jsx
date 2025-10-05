import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession } from '../utils/auth';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BannerUser from '../components/BannerUser';
// Los archivos en /public/ se referencian con ruta directa
const icono_privado = '/icono_publico.jpg';

const API_URL = import.meta.env.VITE_API_URL;

// Crear un ícono personalizado
const privateParkingIcon = new L.Icon({
  iconUrl: icono_privado, // Ruta al ícono
  iconSize: [32, 32], // Tamaño del ícono
  iconAnchor: [16, 32], // Punto de anclaje del ícono
  popupAnchor: [0, -32], // Punto de anclaje del popup
});

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
      const resp = await fetch(`${API_URL}/api/direcciones`);
      const data = await resp.json();
      setDirecciones(data);
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
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
                <Marker position={selectedCoords}>
                  <Popup>{selectedAddress}</Popup>
                </Marker>
              )}

              {/* Marcadores de direcciones obtenidas del backend */}
              {direcciones.map((direccion) => (
                <Marker
                  key={direccion.id_espacio}
                  position={[direccion.latitud, direccion.longitud]}
                  icon={privateParkingIcon} // Aplicar el ícono personalizado
                >
                  <Popup>{direccion.ubicacion}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </>
  );
};

export default Parkin;
