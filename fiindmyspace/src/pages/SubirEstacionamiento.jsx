import React, { useState, useRef } from 'react';
import BannerUser from '../components/BannerUser';
import { getUserSession } from '../utils/auth';
import styles from './SubirEstacionamiento.module.css'; 

// Constantes de diseño y lógica
const API_URL = import.meta.env.VITE_API_URL;
const AREA_SIZE = 400; 
const PLAZA_SIZE = 40; 

const SubirEstacionamiento = () => {
  // --- Estados y Lógica (Se mantienen sin cambios) ---
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [plazas, setPlazas] = useState('');
  const [tipo, setTipo] = useState('');
  const [tipoEstructura, setTipoEstructura] = useState('');
  const [cantidadPisos, setCantidadPisos] = useState('');
  const [tieneSubsuelo, setTieneSubsuelo] = useState('');
  const [precio, setPrecio] = useState('');
  const [apertura, setApertura] = useState('');
  const [cierre, setCierre] = useState('');

  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const [selectedPlazas, setSelectedPlazas] = useState([]);
  const [showMapa, setShowMapa] = useState(false);
  const [plazasPos, setPlazasPos] = useState([]);
  const [mapaGuardado, setMapaGuardado] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); 

  const dragPlaza = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const areaRef = useRef(null); 

  const userSession = getUserSession();
  const userEmail = userSession ? userSession.email : 'Usuario';
  const plazasArray = plazas && Number(plazas) > 0 ? Array.from({ length: Number(plazas) }, (_, i) => i + 1) : [];

  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setUbicacion(value); 
    setSuggestions([]);

    if (value.length > 2) {
      // Lógica de fetch a la API
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setAddressInput(suggestion.properties.formatted);
    setUbicacion(suggestion.properties.formatted);
    setSuggestions([]);
    if (suggestion.geometry && suggestion.geometry.coordinates) {
      setSelectedCoords([suggestion.geometry.coordinates[1], suggestion.geometry.coordinates[0]]);
    }
  };

  const handlePlazaClick = (num) => {
    setSelectedPlazas((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const handleShowMapa = async (e) => {
    e.preventDefault();
    // ... (Tu lógica de validación y fetch a la API) ...
    setMensaje('¡Datos del estacionamiento guardados! Ahora diseña el mapa.');
    setTipoMensaje('exito');

    if (plazasArray.length > 0) {
      const cols = Math.ceil(Math.sqrt(plazasArray.length));
      const spacing = (AREA_SIZE - PLAZA_SIZE) / (cols - 1 || 1);
      const newPos = plazasArray.map((num, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        return { num, x: col * spacing, y: row * spacing };
      });
      setPlazasPos(newPos);
    }
    setShowMapa(true);
    setMapaGuardado(false);
  };
  
  const handleMouseDown = (e, idx) => { /* ... */ };
  const handleMouseMove = (e) => { /* ... */ };
  const handleMouseUp = () => { /* ... */ };

  const handleGuardarMapa = () => {
    // ... (Tu lógica de guardar en localStorage) ...
    setMapaGuardado(true);
    setMensaje('¡Mapa guardado exitosamente en tu sesión!');
    setTipoMensaje('exito');
  };

  return (
    <div className={styles.pageContainer}> 
      <BannerUser /> 
      
      {/* Contenedor principal que centra el contenido */}
      <div className={styles.contentContainer}>
        <div className={styles.formCard}>
          
          {/* TÍTULO MOVIDO DENTRO DEL FORMULARIO/TARJETA */}
          <h1 className={styles.pageTitleInside}>Nuevo Estacionamiento</h1>

          <div className={styles.welcomeMessage}>
            Hola {userEmail}, por favor, completa los detalles de tu estacionamiento.
          </div>
          
          <form onSubmit={handleShowMapa}>
            {/* Campo: Nombre del estacionamiento */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre</label>
              <input
                type="text"
                placeholder="Ej: Estacionamiento Central Sur"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>
            
            {/* Campo: Ubicación con autocompletado */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ubicación</label>
              <input
                type="text"
                placeholder="Busca una dirección"
                value={addressInput}
                onChange={handleAddressChange}
                className={styles.formInput}
                required
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
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
            
            {/* ... (El resto de campos del formulario siguen aquí) ... */}

            {/* Campo: Cantidad de plazas */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad total de plazas</label>
              <input
                type="number"
                placeholder="Mínimo 1"
                value={plazas}
                onChange={e => {
                  setPlazas(e.target.value);
                  setShowMapa(false);
                  setPlazasPos([]);
                }}
                className={styles.formInput}
                required
                min={1}
              />
            </div>
            
            {/* Campo: Tipo de estructura */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo de estructura</label>
              <select
                value={tipoEstructura}
                onChange={e => {
                  setTipoEstructura(e.target.value);
                  if (e.target.value === 'aire_libre') {
                    setCantidadPisos('');
                    setTieneSubsuelo('');
                  }
                }}
                className={styles.formSelect}
                required
              >
                <option value="">Selecciona...</option>
                <option value="aire_libre">Aire Libre</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
            
            {/* Campos Condicionales: Estructura Cerrada */}
            {tipoEstructura === 'cerrado' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cantidad de pisos</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Pisos sobre nivel"
                    value={cantidadPisos}
                    onChange={e => setCantidadPisos(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>¿Tiene subsuelo?</label>
                  <select
                    value={tieneSubsuelo}
                    onChange={e => setTieneSubsuelo(e.target.value)}
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Selecciona...</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </>
            )}

            {/* Campo: Tipo de estacionamiento */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Modelo de negocio</label>
              <select
                value={tipo}
                onChange={e => {
                  setTipo(e.target.value);
                  if (e.target.value === 'publico') {
                    setPrecio('');
                  }
                }}
                className={styles.formSelect}
                required
              >
                <option value="">Selecciona tipo...</option>
                <option value="publico">Público (Gratuito)</option>
                <option value="privado">Privado (Pago)</option>
              </select>
            </div>

            {/* Campo Condicional: Precio por hora */}
            {tipo === 'privado' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio por hora (ARS)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>
            )}
            
            {/* Horarios */}
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Horario de Apertura</label>
                <input
                  type="time"
                  value={apertura}
                  onChange={e => setApertura(e.target.value)}
                  className={styles.formInput}
                  required
                />
            </div>
            
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Horario de Cierre</label>
                <input
                  type="time"
                  value={cierre}
                  onChange={e => setCierre(e.target.value)}
                  className={styles.formInput}
                  required
                />
            </div>
            
            <button type="submit" className={styles.submitButton}>
              Guardar y Generar Mapa
            </button>
          </form>
        </div>
        
        {/* Mensaje de Estado */}
        {mensaje && (
          <div className={`${styles.statusMessage} ${styles[tipoMensaje]}`}>
            {mensaje}
          </div>
        )}
        
        {/* Mapa de plazas interactivo libre */}
        {showMapa && plazasPos.length > 0 && (
          <>
            <div
              ref={areaRef}
              className={styles.mapArea}
            >
              {plazasPos.map((plaza, idx) => (
                <div
                  key={plaza.num}
                  style={{
                    left: plaza.x,
                    top: plaza.y,
                    width: PLAZA_SIZE,
                    height: PLAZA_SIZE,
                  }}
                  className={`${styles.parkingPlaza} ${selectedPlazas.includes(plaza.num) ? styles.selected : ''}`}
                  title={`Plaza ${plaza.num}`}
                  onClick={() => handlePlazaClick(plaza.num)}
                  onMouseDown={e => handleMouseDown(e, idx)}
                >
                  {plaza.num}
                </div>
              ))}
            </div>
            
            {/* Botón Guardar Mapa */}
            {!mapaGuardado ? (
              <button
                onClick={handleGuardarMapa}
                className={styles.saveMapButton}
              >
                💾 Finalizar y Guardar Diseño
              </button>
            ) : (
              <div className={styles.mapSavedMessage}>
                ✅ Diseño del mapa guardado en tu sesión
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubirEstacionamiento;