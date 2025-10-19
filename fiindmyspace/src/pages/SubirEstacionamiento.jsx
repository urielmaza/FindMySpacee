import React, { useState, useRef } from 'react';
import BannerUser from '../components/BannerUser';
import { getUserSession } from '../utils/auth';
import styles from './SubirEstacionamiento.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const AREA_SIZE = 400;
const PLAZA_SIZE = 40;

const SubirEstacionamiento = () => {
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
  const [resolvedAddress, setResolvedAddress] = useState('');
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
  const idCliente = userSession ? userSession.id_cliente : null;
  const userEmail = userSession ? userSession.email : 'Usuario';

  const plazasArray = plazas && Number(plazas) > 0
    ? Array.from({ length: Number(plazas) }, (_, i) => i + 1)
    : [];

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
    setUbicacion(suggestion.properties.formatted);
    setSuggestions([]);
    if (suggestion.geometry && suggestion.geometry.coordinates) {
      setSelectedCoords([suggestion.geometry.coordinates[1], suggestion.geometry.coordinates[0]]);
    }
  };

  const handlePlazaClick = (num) => {
    setSelectedPlazas((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num]
    );
  };

  const handleShowMapa = async (e) => {
    e.preventDefault();

    if (!nombre || !ubicacion || !plazas || !tipo || !tipoEstructura || !apertura || !cierre) {
      setMensaje('Error al enviar: completa todos los campos.');
      setTipoMensaje('error');
      return;
    }
    if (tipo === 'privado' && !precio) {
      setMensaje('Error al enviar: el precio es obligatorio para estacionamientos privados.');
      setTipoMensaje('error');
      return;
    }
    if (tipoEstructura === 'cerrado' && !cantidadPisos) {
      setMensaje('Error al enviar: la cantidad de pisos es obligatoria para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }
    if (tipoEstructura === 'cerrado' && !tieneSubsuelo) {
      setMensaje('Error al enviar: debe especificar si tiene subsuelo para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const resp = await fetch(`${API_URL}/api/espacios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_cliente: idCliente,
          nombre_estacionamiento: nombre,
          ubicacion,
          latitud: selectedCoords ? selectedCoords[0] : null,
          longitud: selectedCoords ? selectedCoords[1] : null,
          cantidad_plazas: Number(plazas),
          tipo_de_estacionamiento: tipo,
          tipo_estructura: tipoEstructura,
          cantidad_pisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos) : 1,
          tiene_subsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
          precio_por_hora: tipo === 'privado' ? parseFloat(precio) : 0,
          horario_apertura: apertura,
          horario_cierre: cierre
        })
      });

      if (!resp.ok) throw new Error('Error al guardar en la base de datos');

      setMensaje('¡Se envió correctamente!');
      setTipoMensaje('exito');
    } catch (err) {
      setMensaje('Error al enviar: no se pudo guardar en la base de datos.');
      setTipoMensaje('error');
      return;
    }

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

  const handleMouseDown = (e, idx) => {
    dragPlaza.current = idx;
    const rect = e.target.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (dragPlaza.current === null) return;
    setPlazasPos((prev) =>
      prev.map((plaza, idx) => {
        if (idx !== dragPlaza.current) return plaza;
        let newX = e.clientX - offset.current.x - areaRef.current.getBoundingClientRect().left;
        let newY = e.clientY - offset.current.y - areaRef.current.getBoundingClientRect().top;
        newX = Math.max(0, Math.min(newX, AREA_SIZE - PLAZA_SIZE));
        newY = Math.max(0, Math.min(newY, AREA_SIZE - PLAZA_SIZE));
        return { ...plaza, x: newX, y: newY };
      })
    );
  };

  const handleMouseUp = () => {
    dragPlaza.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleGuardarMapa = () => {
    const mapaData = {
      estacionamiento: {
        nombre,
        ubicacion,
        plazas: Number(plazas),
        tipo,
        tipoEstructura,
        cantidadPisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos) : 1,
        tieneSubsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
        precio: tipo === 'privado' ? parseFloat(precio) : 0,
        apertura,
        cierre,
        coordenadas: selectedCoords,
        fechaCreacion: new Date().toISOString()
      },
      mapa: { plazasPos, selectedPlazas, areaSize: AREA_SIZE, plazaSize: PLAZA_SIZE }
    };

    const mapasGuardados = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
    mapasGuardados.push(mapaData);
    localStorage.setItem('findmyspace_mapas', JSON.stringify(mapasGuardados));

    setMapaGuardado(true);
    setMensaje('¡Mapa guardado exitosamente en tu sesión!');
    setTipoMensaje('exito');
  };

  return (
    <>
      <BannerUser />
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.formCard}>
            <h1 className={styles.pageTitle}>Nuevo Estacionamiento</h1>
            <form onSubmit={handleShowMapa}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Nombre del estacionamiento"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Ubicación"
                  value={addressInput}
                  onChange={handleAddressChange}
                  className={styles.formInput}
                  required
                  autoComplete="off"
                />
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
                    {suggestions.map(sug => (
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

              <div className={styles.formGroup}>
                <input
                  type="number"
                  placeholder="Cantidad de plazas"
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

              <div className={styles.formGroup}>
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
                  <option value="">Selecciona estructura del estacionamiento</option>
                  <option value="aire_libre">Aire Libre</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>

              {tipoEstructura === 'cerrado' && (
                <>
                  <div className={styles.formGroup}>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="Cantidad de pisos"
                      value={cantidadPisos}
                      onChange={e => setCantidadPisos(e.target.value)}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <select
                      value={tieneSubsuelo}
                      onChange={e => setTieneSubsuelo(e.target.value)}
                      className={styles.formSelect}
                      required
                    >
                      <option value="">¿Tiene subsuelo?</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <select
                  value={tipo}
                  onChange={e => {
                    setTipo(e.target.value);
                    if (e.target.value === 'publico') setPrecio('');
                  }}
                  className={styles.formSelect}
                  required
                >
                  <option value="">Selecciona tipo de estacionamiento</option>
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                </select>
              </div>

              {tipo === 'privado' && (
                <div className={styles.formGroup}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Precio por hora (ARS)"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <input
                  type="time"
                  placeholder="Horario apertura"
                  value={apertura}
                  onChange={e => setApertura(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="time"
                  placeholder="Horario cierre"
                  value={cierre}
                  onChange={e => setCierre(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Generar mapa
              </button>
            </form>

            {mensaje && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: '600',
                  backgroundColor: tipoMensaje === 'exito' ? '#d4edda' : '#f8d7da',
                  color: tipoMensaje === 'exito' ? '#155724' : '#721c24',
                  border: `1px solid ${tipoMensaje === 'exito' ? '#c3e6cb' : '#f5c6cb'}`
                }}
              >
                {tipoMensaje === 'exito' ? '✅' : '❌'} {mensaje}
              </div>
            )}

            {showMapa && plazasPos.length > 0 && (
              <>
                <div
                  ref={areaRef}
                  style={{
                    width: AREA_SIZE,
                    height: AREA_SIZE,
                    margin: '32px auto',
                    background: '#f7f7f7',
                    border: '2px solid #2d7cff',
                    borderRadius: 12,
                    position: 'relative',
                    overflow: 'hidden',
                    touchAction: 'none'
                  }}
                >
                  {plazasPos.map((plaza, idx) => (
                    <div
                      key={plaza.num}
                      style={{
                        position: 'absolute',
                        left: plaza.x,
                        top: plaza.y,
                        width: PLAZA_SIZE,
                        height: PLAZA_SIZE,
                        background: selectedPlazas.includes(plaza.num) ? '#2d7cff' : '#fff',
                        color: selectedPlazas.includes(plaza.num) ? '#fff' : '#222',
                        border: '2px solid #2d7cff',
                        borderRadius: 6,
                        cursor: 'grab',
                        fontWeight: 'bold',
                        fontFamily: 'cursive',
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                        boxShadow: '0 2px 8px #0002',
                        zIndex: 2
                      }}
                      title={`Plaza ${plaza.num}`}
                      onClick={() => handlePlazaClick(plaza.num)}
                      onMouseDown={e => handleMouseDown(e, idx)}
                    >
                      {plaza.num}
                    </div>
                  ))}
                </div>

                {!mapaGuardado && (
                  <button
                    onClick={handleGuardarMapa}
                    className={styles.submitButton}
                    style={{ backgroundColor: '#28a745', marginTop: '16px' }}
                  >
                    Guardar Mapa
                  </button>
                )}

                {mapaGuardado && (
                  <div
                    style={{
                      textAlign: 'center',
                      margin: '16px 0',
                      color: '#28a745',
                      fontWeight: 'bold',
                      fontFamily: 'cursive',
                      fontSize: 16
                    }}
                  >
                    Mapa guardado en tu sesión
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubirEstacionamiento;
