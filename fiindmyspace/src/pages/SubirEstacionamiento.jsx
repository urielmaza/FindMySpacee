import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import { getUserSession } from '../utils/auth';
import styles from './SubirEstacionamiento.module.css';
import apiClient from '../apiClient';

// Nota: Solo frontend por ahora, sin llamadas de red
// const API_URL = import.meta.env.VITE_API_URL;

const AREA_SIZE = 400;
const PLAZA_SIZE = 40;

const SubirEstacionamiento = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editingId = searchParams.get('id');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [plazas, setPlazas] = useState('');
  const [tipo, setTipo] = useState('');
  const [tipoEstructura, setTipoEstructura] = useState('');
  const [cantidadPisos, setCantidadPisos] = useState('');
  const [tieneSubsuelo, setTieneSubsuelo] = useState('');
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
  const [fase, setFase] = useState('form'); // 'form' | 'tarifas'

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  // ====== NUEVO: Modalidades de cobro dinámicas ======
  // Claves canónicas para modalidades
  const MODALIDADES_DEF = [
    { key: 'hora', label: 'Por hora' },
    { key: 'dia', label: 'Por día' },
    { key: 'semana', label: 'Por semana' },
    { key: 'mes', label: 'Por mes' },
    { key: 'anio', label: 'Por año' }
  ];
  const [modalidades, setModalidades] = useState([]); // array de keys seleccionadas

  // ====== NUEVO: Precios por tipo de vehículo ======
  // Fila: { id, nombre, precios: { [modalidadKey]: string } }
  const defaultVehiculos = useMemo(() => ([
    { id: crypto.randomUUID(), nombre: 'Moto', precios: {} },
    { id: crypto.randomUUID(), nombre: 'Auto', precios: {} },
    { id: crypto.randomUUID(), nombre: 'Camioneta', precios: {} }
  ]), []);
  const [vehiculos, setVehiculos] = useState(defaultVehiculos);
  const [nuevoVehiculoNombre, setNuevoVehiculoNombre] = useState('');

  // ====== NUEVO: Métodos de pago ======
  const METODOS_PAGO_DEF = [
    { key: 'efectivo', label: 'Efectivo' },
    { key: 'tarjeta', label: 'Tarjeta' },
    { key: 'billetera', label: 'Billeteras virtuales' },
    { key: 'transferencia', label: 'Transferencia bancaria' }
  ];
  const [metodosPago, setMetodosPago] = useState([]); // array de keys seleccionadas

  const dragPlaza = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const areaRef = useRef(null);
  // Bandera para evitar reseteos mientras se precargan datos en modo edición
  const isPrefillingRef = useRef(false);

  const userSession = getUserSession();
  const idCliente = userSession ? userSession.id_cliente : null;
  const userEmail = userSession ? userSession.email : 'Usuario';

  const plazasArray = plazas && Number(plazas) > 0
    ? Array.from({ length: Number(plazas) }, (_, i) => i + 1)
    : [];

  // Efecto: título del documento
  useEffect(() => {
    document.title = editingId ? 'Editar Estacionamiento - FindMySpace' : 'Nuevo Estacionamiento - FindMySpace';
  }, [editingId]);

  // Cargar datos cuando editingId existe
  useEffect(() => {
    const cargarDatos = async () => {
      if (!editingId) return;
      try {
        // Evitar que el efecto de reseteo del mapa se dispare mientras precargamos
        isPrefillingRef.current = true;
        // 1) Si viene un layout en el state de navegación, úsalo directamente
        const incomingLayout = location?.state?.layout;
        if (incomingLayout && Array.isArray(incomingLayout.plazasPos)) {
          setPlazasPos(incomingLayout.plazasPos || []);
          setSelectedPlazas(incomingLayout.selectedPlazas || []);
          setMapaGuardado(false);
        }
        const resp = await apiClient.get(`/espacios/${editingId}`);
        if (resp.data?.success) {
          const { espacio, horarios } = resp.data.data || {};
          if (espacio) {
            setNombre(espacio.nombre_estacionamiento || '');
            setUbicacion(espacio.ubicacion || '');
            setAddressInput(espacio.ubicacion || '');
            setPlazas(String(espacio.cantidad_plazas || ''));
            setTipo(espacio.tipo_de_estacionamiento || '');
            setTipoEstructura(espacio.tipo_estructura || '');
            setCantidadPisos(espacio.cantidad_pisos ? String(espacio.cantidad_pisos) : '');
            setTieneSubsuelo(espacio.tiene_subsuelo ? 'si' : 'no');
            if (typeof espacio.latitud === 'number' && typeof espacio.longitud === 'number') {
              setSelectedCoords([espacio.latitud, espacio.longitud]);
            }
            // 2) Si no vino en state, intentar precargar el layout del mapa desde localStorage por coincidencia
            try {
              const mapas = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
              // Búsqueda exacta por nombre, ubicación y plazas
              let match = incomingLayout ? null : mapas.find((m) => {
                const e = m?.estacionamiento || {};
                return (
                  (e.nombre || '').trim() === (espacio.nombre_estacionamiento || '').trim() &&
                  (e.ubicacion || '').trim() === (espacio.ubicacion || '').trim() &&
                  Number(e.plazas) === Number(espacio.cantidad_plazas)
                );
              });
              // Fallback: coincidencia case-insensitive
              if (!match && !incomingLayout) {
                match = mapas.find((m) => {
                  const e = m?.estacionamiento || {};
                  return (
                    ((e.nombre || '').trim().toLowerCase()) === ((espacio.nombre_estacionamiento || '').trim().toLowerCase()) &&
                    ((e.ubicacion || '').trim().toLowerCase()) === ((espacio.ubicacion || '').trim().toLowerCase()) &&
                    Number(e.plazas) === Number(espacio.cantidad_plazas)
                  );
                });
              }
              // Fallback: por coordenadas (si existen) y plazas
              if (!match && !incomingLayout && Array.isArray((mapas[0]?.estacionamiento?.coordenadas))) {
                const lat = Number(espacio.latitud);
                const lon = Number(espacio.longitud);
                const eps = 1e-5; // tolerancia
                match = mapas.find((m) => {
                  const e = m?.estacionamiento || {};
                  const c = Array.isArray(e.coordenadas) ? e.coordenadas : [];
                  if (c.length === 2 && !Number.isNaN(lat) && !Number.isNaN(lon)) {
                    const dLat = Math.abs(Number(c[0]) - lat);
                    const dLon = Math.abs(Number(c[1]) - lon);
                    return dLat < eps && dLon < eps && Number(e.plazas) === Number(espacio.cantidad_plazas);
                  }
                  return false;
                });
              }
              if (!incomingLayout && match && match.mapa) {
                setPlazasPos(match.mapa.plazasPos || []);
                setSelectedPlazas(match.mapa.selectedPlazas || []);
                setMapaGuardado(false);
              } else {
                // Generar una grilla por defecto según la cantidad de plazas
                const total = Number(espacio.cantidad_plazas || 0);
                if (!incomingLayout && total > 0) {
                  const plazasArrayLocal = Array.from({ length: total }, (_, i) => i + 1);
                  const cols = Math.ceil(Math.sqrt(plazasArrayLocal.length));
                  const spacing = (AREA_SIZE - PLAZA_SIZE) / (cols - 1 || 1);
                  const newPos = plazasArrayLocal.map((num, idx) => {
                    const row = Math.floor(idx / cols);
                    const col = idx % cols;
                    return { num, x: col * spacing, y: row * spacing };
                  });
                  setPlazasPos(newPos);
                  setSelectedPlazas([]);
                  setMapaGuardado(false);
                }
              }
            } catch (e) {
              console.warn('No se pudo precargar el layout desde localStorage:', e);
            }
          }
          // Mapear horarios recibidos a estructura de UI
          const diasNombre = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
          if (Array.isArray(horarios) && horarios.length > 0) {
            const byDay = new Map();
            horarios.forEach(h => {
              const name = diasNombre[(h.dia_semana ?? 1) - 1] || diasNombre[0];
              if (!byDay.has(name)) byDay.set(name, []);
              byDay.get(name).push({ start: h.apertura, end: h.cierre });
            });
            const uiDays = Array.from(byDay.entries()).map(([name, ranges]) => ({
              id: crypto.randomUUID(),
              name,
              ranges: ranges.map(r => ({ id: crypto.randomUUID(), start: r.start, end: r.end }))
            }));
            setDays(uiDays);
          }
        }
      } catch (e) {
        console.error('Error precargando espacio:', e);
      }
    };
    cargarDatos().finally(() => {
      // Permitir nuevamente que el efecto de reseteo actúe ante cambios del usuario
      isPrefillingRef.current = false;
    });
  }, [editingId]);

  // Efecto: resetear vista previa del mapa cuando cambian campos clave
  useEffect(() => {
    if (isPrefillingRef.current) return;
    setShowMapa(false);
    setPlazasPos([]);
    setMapaGuardado(false);
    }, [plazas, tipo, tipoEstructura]);

  // Mantener coherencia de columnas (modalidades) en las filas de vehículos
  useEffect(() => {
    // Cuando cambian las modalidades, aseguramos que cada fila tenga las claves necesarias
    setVehiculos(prev => prev.map(v => ({
      ...v,
      precios: modalidades.reduce((acc, mKey) => {
        acc[mKey] = v.precios?.[mKey] ?? '';
        return acc;
      }, {})
    })));
  }, [modalidades]);

  const toggleModalidad = (key) => {
    setModalidades(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handlePrecioChange = (vehiculoId, modalidadKey, value) => {
    setVehiculos(prev => prev.map(v => (
      v.id === vehiculoId ? { ...v, precios: { ...v.precios, [modalidadKey]: value } } : v
    )));
  };

  const handleAddVehiculoRow = () => {
    const nombre = (nuevoVehiculoNombre || '').trim();
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: nombre || `Tipo ${vehiculos.length + 1}`,
      precios: modalidades.reduce((acc, k) => (acc[k] = '', acc), {})
    };
    setVehiculos(prev => [...prev, nuevo]);
    setNuevoVehiculoNombre('');
  };

  const handleRemoveVehiculoRow = (id) => {
    setVehiculos(prev => prev.filter(v => v.id !== id));
  };

  const toggleMetodoPago = (key) => {
    setMetodosPago(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

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
    // Se elimina la obligación de precio por hora: ahora es un bloque dinámico (solo UI)
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

    // Construir tarifas a partir de la tabla UI
    const tarifas = [];
    if (tipo === 'privado' && modalidades.length > 0 && vehiculos.length > 0) {
      vehiculos.forEach(v => {
        const nombreVeh = (v.nombre || '').trim();
        if (!nombreVeh) return;
        modalidades.forEach(mKey => {
          const val = v.precios?.[mKey];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            const precioNum = Number(val);
            if (!Number.isNaN(precioNum) && precioNum >= 0) {
              tarifas.push({ tipo_vehiculo: nombreVeh, modalidad: mKey, precio: precioNum });
            }
          }
        });
      });
    }

    const body = {
      id_cliente: idCliente || null,
      nombre_estacionamiento: nombre,
      ubicacion: ubicacion || addressInput,
      latitud: lat,
      longitud: lon,
      cantidad_plazas: Number(plazas),
      tipo_de_estacionamiento: tipo,
      tipo_estructura: tipoEstructura || null,
      cantidad_pisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos || 1) : 1,
      tiene_subsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si' || tieneSubsuelo === true || tieneSubsuelo === 1) : false,
      horarios: horariosPayload,
      modalidades: tipo === 'privado' ? modalidades : [],
      metodos_pago: tipo === 'privado' ? metodosPago : [],
      tarifas: tipo === 'privado' ? tarifas : []
    };

    try {
      if (editingId) {
        const resp = await apiClient.put(`/espacios/${editingId}`, body);
        if (resp.data?.success) {
          setMensaje('¡Espacio actualizado correctamente!');
          setTipoMensaje('exito');
        } else {
          setMensaje('No se pudo actualizar el espacio.');
          setTipoMensaje('error');
          return;
        }
      } else {
        const resp = await apiClient.post('/espacios', body);
        if (resp.status === 201 && resp.data && (resp.data.success || resp.data.id_espacio)) {
          setMensaje('¡Espacio creado correctamente!');
          setTipoMensaje('exito');
        } else {
          setMensaje('No se pudo crear el espacio.');
          setTipoMensaje('error');
          return;
        }
      }
    } catch (err) {
      console.error('Error al guardar el espacio:', err);
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
  // Mostrar el panel derecho (mapa) solo después de guardar exitosamente
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
        idEspacio: editingId ? Number(editingId) : null,
        nombre,
        ubicacion: ubicacion || addressInput,
        plazas: Number(plazas),
        tipo,
        tipoEstructura,
        cantidadPisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos) : 1,
        tieneSubsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
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
    // Buscar un mapa existente para reemplazar
    const idx = (() => {
      const targetNombre = (mapaData.estacionamiento.nombre || '').trim().toLowerCase();
      const targetUbic = (mapaData.estacionamiento.ubicacion || '').trim().toLowerCase();
      const targetPlazas = Number(mapaData.estacionamiento.plazas);
      const targetCoords = Array.isArray(mapaData.estacionamiento.coordenadas) ? mapaData.estacionamiento.coordenadas : [];
      const targetId = mapaData.estacionamiento.idEspacio ? Number(mapaData.estacionamiento.idEspacio) : null;
      const eps = 1e-5;
      return mapasGuardados.findIndex((m) => {
        const e = m?.estacionamiento || {};
        // 1) Por idEspacio si ambos lo tienen
        if (targetId && e.idEspacio && Number(e.idEspacio) === targetId) return true;
        // 2) Por nombre + ubicación + plazas (case-insensitive)
        const byNameUbi = ((e.nombre || '').trim().toLowerCase()) === targetNombre &&
                          ((e.ubicacion || '').trim().toLowerCase()) === targetUbic &&
                          Number(e.plazas) === targetPlazas;
        if (byNameUbi) return true;
        // 3) Por coordenadas + plazas si existen
        const c = Array.isArray(e.coordenadas) ? e.coordenadas : [];
        if (c.length === 2 && targetCoords.length === 2) {
          const dLat = Math.abs(Number(c[0]) - Number(targetCoords[0]));
          const dLon = Math.abs(Number(c[1]) - Number(targetCoords[1]));
          if (dLat < eps && dLon < eps && Number(e.plazas) === targetPlazas) return true;
        }
        return false;
      });
    })();

    if (idx >= 0) {
      mapasGuardados[idx] = mapaData;
    } else {
      mapasGuardados.push(mapaData);
    }
    localStorage.setItem('findmyspace_mapas', JSON.stringify(mapasGuardados));

    setMapaGuardado(true);
    setMensaje('¡Mapa guardado exitosamente en tu sesión!');
    setTipoMensaje('exito');
    // Avanzar a la fase siguiente después de un breve efecto
    setTimeout(() => setFase('tarifas'), 400);
  };

  return (
    <>
      <BannerUser />
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          {/* Fase tarifas (mock) */}
          {fase === 'tarifas' ? (
            <div className={styles.tarifasCard}>
              <h1 className={styles.pageTitle}>Tarifas</h1>
              <div className={styles.formGroup}>
                <input type="text" className={styles.formInput} placeholder="Nombre" />
              </div>
              <div className={styles.formGroup}>
                <input type="text" className={styles.formInput} placeholder="Ciudad" />
              </div>
              <p className={styles.helperText}>Formulario de ejemplo (no funcional).</p>
            </div>
          ) : (
            <div className={`${styles.splitContainer} ${!showMapa ? styles.singleColumn : ''}`}>
              {/* Columna izquierda: formulario */}
              <div className={styles.panelCard}>
                <h1 className={styles.pageTitle}>{editingId ? 'Editar Estacionamiento' : 'Nuevo Estacionamiento'}</h1>
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

              {/* Bloques dinámicos: solo visibles para estacionamiento Privado */}
              {tipo === 'privado' && (
                <>
                  {/* Modalidades de cobro */}
                  <div className={styles.formGroup}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Modalidades de cobro</h2>
                      <p className={styles.helperText}>Selecciona una o más modalidades. La tabla de precios se adaptará automáticamente.</p>
                    </div>
                    <div className={styles.checkboxGroup}>
                      {MODALIDADES_DEF.map(m => (
                        <label key={m.key} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={modalidades.includes(m.key)}
                            onChange={() => toggleModalidad(m.key)}
                          />
                          <span>{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Precios por tipo de vehículo */}
                  <div className={styles.formGroup}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Precios por tipo de vehículo</h2>
                      <p className={styles.helperText}>Tabla demostrativa. Los valores no se envían ni se persisten (solo vista).</p>
                    </div>

                    {modalidades.length === 0 ? (
                      <p className={styles.helperText}>Primero selecciona al menos una modalidad.</p>
                    ) : (
                      <div className={styles.tableWrapper}>
                        <table className={styles.pricingTable}>
                          <thead>
                            <tr>
                              <th>Tipo de vehículo</th>
                              {modalidades.map(key => {
                                const label = MODALIDADES_DEF.find(m => m.key === key)?.label || key;
                                return <th key={key}>{label} (ARS)</th>;
                              })}
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehiculos.map(v => (
                              <tr key={v.id}>
                                <td className={styles.vehicleNameCell}>
                                  <input
                                    type="text"
                                    value={v.nombre}
                                    onChange={(e) => setVehiculos(prev => prev.map(x => x.id === v.id ? { ...x, nombre: e.target.value } : x))}
                                    className={styles.formInput}
                                    placeholder="Ej: Moto"
                                  />
                                </td>
                                {modalidades.map(mKey => (
                                  <td key={mKey}>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={v.precios?.[mKey] ?? ''}
                                      onChange={(e) => handlePrecioChange(v.id, mKey, e.target.value)}
                                      className={styles.formInput}
                                      placeholder="0.00"
                                    />
                                  </td>
                                ))}
                                <td className={styles.actionsCell}>
                                  <button type="button" className={styles.removeRowButton} onClick={() => handleRemoveVehiculoRow(v.id)}>
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className={styles.addRowBar}>
                          <input
                            type="text"
                            value={nuevoVehiculoNombre}
                            onChange={(e) => setNuevoVehiculoNombre(e.target.value)}
                            className={styles.formInput}
                            placeholder="Nuevo tipo de vehículo"
                          />
                          <button type="button" className={styles.addRowButton} onClick={handleAddVehiculoRow}>
                            + Agregar tipo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Métodos de pago */}
                  <div className={styles.formGroup}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Métodos de pago</h2>
                      <p className={styles.helperText}>Selecciona los métodos aceptados. Solo demostrativo.</p>
                    </div>
                    <div className={styles.checkboxGroup}>
                      {METODOS_PAGO_DEF.map(p => (
                        <label key={p.key} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={metodosPago.includes(p.key)}
                            onChange={() => toggleMetodoPago(p.key)}
                          />
                          <span>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
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
                    {editingId ? 'Guardar cambios' : 'Generar mapa'}
                  </button>
                </form>

                {mensaje && (
                  <div className={`${styles.message} ${tipoMensaje === 'exito' ? styles.success : styles.error}`}>
                    {mensaje}
                  </div>
                )}
              </div>
              {/* Columna derecha: mapa, solo aparece tras guardar exitosamente */}
              {showMapa && (
                <div className={`${styles.panelCard} ${styles.mapPanel}`}>
                  <h2 className={styles.sectionTitle}>Mapa</h2>
                  {plazasPos.length > 0 ? (
                    <>
                      <div
                        ref={areaRef}
                        className={styles.mapArea}
                        style={{ width: AREA_SIZE, height: AREA_SIZE, margin: '0 auto' }}
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
                  ) : (
                    <p className={styles.helperText}>No hay plazas disponibles para mostrar.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubirEstacionamiento;
