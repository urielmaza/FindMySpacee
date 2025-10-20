import React, { useState, useRef, useEffect, useMemo } from 'react';
import BannerUser from '../components/BannerUser';
import { getUserSession } from '../utils/auth';
import styles from './SubirEstacionamiento.module.css';
import apiClient from '../apiClient';

// Nota: Solo frontend por ahora, sin llamadas de red
// const API_URL = import.meta.env.VITE_API_URL;

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
  // Nueva estructura de horarios dinámicos por día
  // days: [{ id, name, ranges: [{ id, start, end }] }]
  const [days, setDays] = useState([]);
  const [newDay, setNewDay] = useState('');

  // Orden fijo de la semana
  const dayOrder = useMemo(() => ({
    'Lunes': 0,
    'Martes': 1,
    'Miércoles': 2,
    'Jueves': 3,
    'Viernes': 4,
    'Sábado': 5,
    'Domingo': 6
  }), []);

  const sortedDays = useMemo(() => {
    return [...days].sort((a, b) => (dayOrder[a.name] ?? 99) - (dayOrder[b.name] ?? 99));
  }, [days, dayOrder]);

  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]); // UI-only, sin fetch
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

  // Efecto: título del documento
  useEffect(() => {
    document.title = 'Nuevo Estacionamiento - FindMySpace';
  }, []);

  // Efecto: resetear vista previa del mapa cuando cambian campos clave
  useEffect(() => {
    setShowMapa(false);
    setPlazasPos([]);
    setMapaGuardado(false);
  }, [plazas, tipo, tipoEstructura, precio]);

  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setResolvedAddress('');
    setSuggestions([]);
    if (value && value.length > 2) {
      try {
        const resp = await apiClient.get('/autocomplete', { params: { text: value } });
        if (Array.isArray(resp.data)) {
          setSuggestions(resp.data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error cargando sugerencias:', err);
        setSuggestions([]);
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

    // Validación básica solo de UI
    if (!nombre || !ubicacion || !plazas || !tipo || !tipoEstructura) {
      setMensaje('Completa los campos obligatorios.');
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

    // Construir payload para backend
    const horariosPayload = sortedDays
      .map(d => ({
        dia: d.name,
        franjas: (d.ranges || [])
          .filter(r => r.start && r.end)
          .map(r => ({ apertura: r.start, cierre: r.end }))
      }))
      .filter(d => d.franjas.length > 0);

    const lat = selectedCoords ? Number(Number(selectedCoords[0]).toFixed(8)) : null;
    const lon = selectedCoords ? Number(Number(selectedCoords[1]).toFixed(8)) : null;

    const body = {
      id_cliente: idCliente || null,
      nombre_estacionamiento: nombre,
      ubicacion: ubicacion || addressInput,
      latitud: lat,
      longitud: lon,
      cantidad_plazas: Number(plazas),
      precio_por_hora: tipo === 'privado' ? Number(precio || 0) : 0,
      tipo_de_estacionamiento: tipo,
      tipo_estructura: tipoEstructura || null,
      cantidad_pisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos || 1) : 1,
      tiene_subsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si' || tieneSubsuelo === true || tieneSubsuelo === 1) : false,
      horarios: horariosPayload
    };

    try {
      const resp = await apiClient.post('/espacios', body);
      if (resp.status === 201 && resp.data && (resp.data.success || resp.data.id_espacio)) {
        setMensaje('¡Espacio creado correctamente!');
        setTipoMensaje('exito');
      } else {
        setMensaje('No se pudo crear el espacio.');
        setTipoMensaje('error');
        return;
      }
    } catch (err) {
      console.error('Error al crear el espacio:', err);
      const data = err?.response?.data;
      let msg = data?.error || 'Error en el servidor';
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        msg += ': ' + data.errors.join(', ');
      } else if (data?.detail) {
        msg += ` (${data.detail})`;
      }
      setMensaje(msg);
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
        horarios: sortedDays.map(d => ({
          dia: d.name,
          franjas: d.ranges.map(r => ({ apertura: r.start, cierre: r.end }))
        })),
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
                  <ul className={styles.suggestionsList}>
                    {suggestions.map(sug => (
                      <li
                        key={sug.properties.place_id}
                        onClick={() => handleSuggestionClick(sug)}
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
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Franja horaria</h2>
                  <div className={styles.addDayRow}>
                    <select
                      value={newDay}
                      onChange={e => setNewDay(e.target.value)}
                      className={styles.formSelect}
                    >
                      <option value="">Selecciona un día</option>
                      {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
                        .filter(d => !days.some(x => x.name === d))
                        .map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className={styles.addButton}
                      onClick={() => {
                        if (!newDay) return;
                        setDays(prev => ([...prev, { id: crypto.randomUUID(), name: newDay, ranges: [{ id: crypto.randomUUID(), start: '', end: '' }] }]));
                        setNewDay('');
                      }}
                    >
                      Agregar día
                    </button>
                  </div>
                </div>

                {days.length === 0 && (
                  <p className={styles.helperText}>Agrega uno o más días y define sus franjas horarias.</p>
                )}

                <div className={styles.dayCards}>
                  {sortedDays.map((day) => (
                    <div key={day.id} className={styles.dayCard}>
                      <div className={styles.dayHeader}>
                        <h3 className={styles.dayTitle}>{day.name}</h3>
                        <button
                          type="button"
                          className={styles.removeDayButton}
                          onClick={() => setDays(prev => prev.filter(d => d.id !== day.id))}
                          aria-label={`Eliminar ${day.name}`}
                        >
                          Eliminar día
                        </button>
                      </div>

                      <div className={styles.rangesList}>
                        {day.ranges.map((rg, idx) => (
                          <div key={rg.id} className={styles.rangeRow}>
                            <div className={styles.rangeInputs}>
                              <input
                                type="time"
                                value={rg.start}
                                onChange={(e) => setDays(prev => prev.map(d => d.id === day.id ? ({
                                  ...d,
                                  ranges: d.ranges.map(r => r.id === rg.id ? ({ ...r, start: e.target.value }) : r)
                                }) : d))}
                                className={styles.formInput}
                                aria-label={`Apertura ${day.name} - ${idx + 1}`}
                              />
                              <span className={styles.rangeSeparator}>a</span>
                              <input
                                type="time"
                                value={rg.end}
                                onChange={(e) => setDays(prev => prev.map(d => d.id === day.id ? ({
                                  ...d,
                                  ranges: d.ranges.map(r => r.id === rg.id ? ({ ...r, end: e.target.value }) : r)
                                }) : d))}
                                className={styles.formInput}
                                aria-label={`Cierre ${day.name} - ${idx + 1}`}
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.removeRangeButton}
                              onClick={() => setDays(prev => prev.map(d => d.id === day.id ? ({
                                ...d,
                                ranges: d.ranges.filter(r => r.id !== rg.id)
                              }) : d))}
                              disabled={day.ranges.length <= 1}
                              title={day.ranges.length <= 1 ? 'Debe haber al menos una franja' : 'Eliminar franja'}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className={styles.addRangeButton}
                        onClick={() => setDays(prev => prev.map(d => d.id === day.id ? ({
                          ...d,
                          ranges: [...d.ranges, { id: crypto.randomUUID(), start: '', end: '' }]
                        }) : d))}
                      >
                        + Agregar franja
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className={styles.submitButton}>
                Generar mapa
              </button>
            </form>

            {mensaje && (
              <div className={`${styles.message} ${tipoMensaje === 'exito' ? styles.success : styles.error}`}>
                {tipoMensaje === 'exito' ? '✅' : '❌'} {mensaje}
              </div>
            )}

            {showMapa && plazasPos.length > 0 && (
              <>
                <div
                  ref={areaRef}
                  className={styles.mapArea}
                  style={{ width: AREA_SIZE, height: AREA_SIZE, margin: '32px auto' }}
                >
                  {plazasPos.map((plaza, idx) => (
                    <div
                      key={plaza.num}
                      className={`${styles.plaza} ${selectedPlazas.includes(plaza.num) ? styles.plazaSelected : ''}`}
                      style={{ left: plaza.x, top: plaza.y, width: PLAZA_SIZE, height: PLAZA_SIZE }}
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
                    className={styles.saveMapButton}
                    style={{ marginTop: '16px' }}
                  >
                    Guardar Mapa
                  </button>
                )}

                {mapaGuardado && (
                  <div className={styles.mapSavedMessage}>
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
