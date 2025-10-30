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
  const [isLocating, setIsLocating] = useState(false);

  const [selectedPlazas, setSelectedPlazas] = useState([]);
  const [showMapa, setShowMapa] = useState(false);
  const [plazasPos, setPlazasPos] = useState([]);
  const [mapaGuardado, setMapaGuardado] = useState(false);
  // Multi-piso: niveles disponibles, piso actual y mapas por piso
  const [niveles, setNiveles] = useState([]); // e.g., [-1,0,1,2]
  const [nivelActual, setNivelActual] = useState(null); // e.g., 0
  const [pisosMap, setPisosMap] = useState({}); // { [nivel]: { plazasPos: [], selectedPlazas: [] } }

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
  const [tarifas, setTarifas] = useState([]); // Nueva variable para almacenar tarifas

  const dragPlaza = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const areaRef = useRef(null);
  // Bandera para evitar reseteos mientras se precargan datos en modo edición
  const isPrefillingRef = useRef(false);
  const prefillDoneRef = useRef(false);
  const initialStructRef = useRef({ plazas: null, tipo: null, tipoEstructura: null });

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
        // Soportar layouts de un solo piso y multi-piso (pisos)
        if (incomingLayout) {
          if (Array.isArray(incomingLayout.pisos)) {
            // Nuevo formato multi-piso
            const nivelesIncoming = incomingLayout.pisos.map(p => p.nivel).sort((a,b)=>a-b);
            setNiveles(nivelesIncoming);
            const mapObj = {};
            incomingLayout.pisos.forEach(p => {
              mapObj[p.nivel] = {
                plazasPos: Array.isArray(p.plazasPos) ? p.plazasPos : [],
                selectedPlazas: Array.isArray(p.selectedPlazas) ? p.selectedPlazas : []
              };
            });
            setPisosMap(mapObj);
            const firstNivel = nivelesIncoming[0] ?? 0;
            setNivelActual(firstNivel);
            setPlazasPos(mapObj[firstNivel]?.plazasPos || []);
            setSelectedPlazas(mapObj[firstNivel]?.selectedPlazas || []);
            setMapaGuardado(false);
            setShowMapa(true);
          } else if (Array.isArray(incomingLayout.plazasPos)) {
            // Formato antiguo
            setPlazasPos(incomingLayout.plazasPos || []);
            setSelectedPlazas(incomingLayout.selectedPlazas || []);
            setMapaGuardado(false);
            setShowMapa(true); // Mostrar el mapa inmediatamente en edición
          }
        }
        const resp = await apiClient.get(`/espacios/${editingId}`);
        if (resp.data?.success) {
          const { espacio, horarios, modalidades: modKeys, metodos_pago: mpKeys, tarifas: tarifasSrv } = resp.data.data || {};
          if (espacio) {
            setNombre(espacio.nombre_estacionamiento || '');
            setUbicacion(espacio.ubicacion || '');
            setAddressInput(espacio.ubicacion || '');
            setPlazas(String(espacio.cantidad_plazas || ''));
            setTipo(espacio.tipo_de_estacionamiento || '');
            setTipoEstructura(espacio.tipo_estructura || '');
            // Guardar valores iniciales para detectar cambios del usuario luego
            initialStructRef.current = {
              plazas: String(espacio.cantidad_plazas || ''),
              tipoEstructura: (espacio.tipo_estructura || ''),
              cantidadPisos: espacio.cantidad_pisos ? String(espacio.cantidad_pisos) : '',
              tieneSubsuelo: espacio.tiene_subsuelo ? 'si' : 'no',
            };
            setCantidadPisos(espacio.cantidad_pisos ? String(espacio.cantidad_pisos) : '');
            setTieneSubsuelo(espacio.tiene_subsuelo ? 'si' : 'no');
            if (typeof espacio.latitud === 'number' && typeof espacio.longitud === 'number') {
              setSelectedCoords([espacio.latitud, espacio.longitud]);
            }
            // Precargar modalidades y métodos de pago para privados
            if (espacio.tipo_de_estacionamiento === 'privado') {
              if (Array.isArray(modKeys) && modKeys.length > 0) setModalidades(modKeys);
              if (Array.isArray(mpKeys) && mpKeys.length > 0) setMetodosPago(mpKeys);
            }
            // 2) Si no vino en state, intentar precargar el layout del mapa desde localStorage por coincidencia
            try {
              const mapas = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
              // 1) Coincidencia directa por ID de espacio
              let match = incomingLayout ? null : mapas.find((m) => Number(m?.estacionamiento?.idEspacio) === Number(editingId));
              // 2) Búsqueda exacta por nombre, ubicación y plazas
              if (!match && !incomingLayout) {
                match = mapas.find((m) => {
                  const e = m?.estacionamiento || {};
                  return (
                    (e.nombre || '').trim() === (espacio.nombre_estacionamiento || '').trim() &&
                    (e.ubicacion || '').trim() === (espacio.ubicacion || '').trim() &&
                    Number(e.plazas) === Number(espacio.cantidad_plazas)
                  );
                });
              }
              // 3) Fallback: coincidencia case-insensitive
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
              // 4) Fallback: por coordenadas (si existen) y plazas
              if (!match && !incomingLayout) {
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
                if (Array.isArray(match.mapa.pisos)) {
                  const nivelesLocal = match.mapa.pisos.map(p => p.nivel).sort((a,b)=>a-b);
                  setNiveles(nivelesLocal);
                  const mapObj = {};
                  match.mapa.pisos.forEach(p => {
                    mapObj[p.nivel] = {
                      plazasPos: Array.isArray(p.plazasPos) ? p.plazasPos : [],
                      selectedPlazas: Array.isArray(p.selectedPlazas) ? p.selectedPlazas : []
                    };
                  });
                  setPisosMap(mapObj);
                  const firstNivel = nivelesLocal[0] ?? 0;
                  setNivelActual(firstNivel);
                  setPlazasPos(mapObj[firstNivel]?.plazasPos || []);
                  setSelectedPlazas(mapObj[firstNivel]?.selectedPlazas || []);
                  setMapaGuardado(false);
                  setShowMapa(true);
                } else {
                  setPlazasPos(match.mapa.plazasPos || []);
                  setSelectedPlazas(match.mapa.selectedPlazas || []);
                  setMapaGuardado(false);
                  setShowMapa(true); // Mostrar mapa si se encontró diseño guardado
                }
              } else {
                // Generar una grilla por defecto según la cantidad de plazas
                const total = Number(espacio.cantidad_plazas || 0);
                if (!incomingLayout && total > 0) {
                  const nivelesCalc = (() => {
                    if ((espacio.tipo_estructura || '') === 'cerrado') {
                      const n = Number(espacio.cantidad_pisos || 1);
                      const arr = [];
                      if (espacio.tiene_subsuelo) arr.push(-1);
                      // N incluye planta baja
                      for (let i = 0; i < Math.max(1, n); i++) arr.push(i);
                      return arr;
                    }
                    return [0];
                  })();
                  setNiveles(nivelesCalc);
                  if (nivelesCalc.length > 1) {
                    // Distribuir plazas entre pisos
                    const perFloorBase = Math.floor(total / nivelesCalc.length);
                    let remainder = total % nivelesCalc.length;
                    const mapObj = {};
                    let current = 1;
                    nivelesCalc.forEach(niv => {
                      const count = perFloorBase + (remainder > 0 ? 1 : 0);
                      if (remainder > 0) remainder -= 1;
                      const nums = Array.from({ length: count }, (_, i) => current + i);
                      current += count;
                      const cols = Math.ceil(Math.sqrt(nums.length || 1));
                      const spacing = (AREA_SIZE - PLAZA_SIZE) / (cols - 1 || 1);
                      const pos = nums.map((num, idx) => {
                        const row = Math.floor(idx / cols);
                        const col = idx % cols;
                        return { num, x: col * spacing, y: row * spacing };
                      });
                      mapObj[niv] = { plazasPos: pos, selectedPlazas: [] };
                    });
                    setPisosMap(mapObj);
                    const firstNivel = nivelesCalc[0];
                    setNivelActual(firstNivel);
                    setPlazasPos(mapObj[firstNivel]?.plazasPos || []);
                    setSelectedPlazas(mapObj[firstNivel]?.selectedPlazas || []);
                    setMapaGuardado(false);
                    setShowMapa(true);
                  } else {
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
                    setShowMapa(true); // Mostrar mapa con la grilla por defecto
                  }
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

          // Mapear tarifas a estructura de UI de vehículos (si es privado)
          if (espacio?.tipo_de_estacionamiento === 'privado' && Array.isArray(tarifasSrv) && tarifasSrv.length > 0) {
            const byVeh = new Map();
            tarifasSrv.forEach(t => {
              const veh = t.tipo_vehiculo || 'Vehículo';
              if (!byVeh.has(veh)) byVeh.set(veh, {});
              if (t.modalidad) byVeh.get(veh)[t.modalidad] = String(t.precio ?? '');
            });
            // Si no se recibieron modKeys, derivarlas de tarifas
            if ((!Array.isArray(modKeys) || modKeys.length === 0)) {
              const allMods = new Set();
              tarifasSrv.forEach(t => t.modalidad && allMods.add(t.modalidad));
              setModalidades(Array.from(allMods));
            }
            const vehRows = Array.from(byVeh.entries()).map(([nombre, precios]) => ({
              id: crypto.randomUUID(),
              nombre,
              precios
            }));
            setVehiculos(vehRows);
          }
        }
      } catch (e) {
        console.error('Error precargando espacio:', e);
      }
    };
    cargarDatos().finally(() => {
      // Permitir nuevamente que el efecto de reseteo actúe ante cambios del usuario
      isPrefillingRef.current = false;
      // Marcar que la precarga terminó; desde ahora, cambios en estructura son del usuario
      prefillDoneRef.current = true;
    });
  }, [editingId]);

  // Recalcular niveles cuando cambien estructura, cantidad de pisos o subsuelo (solo para nuevos mapas)
  useEffect(() => {
    if (isPrefillingRef.current) return; // evitar mientras precargamos
    if (tipoEstructura !== 'cerrado') {
      setNiveles([0]);
      setNivelActual(0);
      return;
    }
    const n = Math.max(1, Number(cantidadPisos || 1));
    const arr = [];
    if (tieneSubsuelo === 'si') arr.push(-1);
    for (let i = 0; i < n; i++) arr.push(i);
    setNiveles(arr);
    if (!arr.includes(nivelActual)) setNivelActual(arr[0] ?? 0);
  }, [tipoEstructura, cantidadPisos, tieneSubsuelo]);

  // Efecto: resetear vista previa del mapa SOLO si el usuario cambió la estructura (que afecta el mapa)
  useEffect(() => {
    // No hacer nada mientras estamos precargando
    if (isPrefillingRef.current || !prefillDoneRef.current) return;

    const init = initialStructRef.current || {};
    const changed = (
      String(plazas ?? '') !== String(init.plazas ?? '') ||
      String(tipoEstructura ?? '') !== String(init.tipoEstructura ?? '') ||
      String(cantidadPisos ?? '') !== String(init.cantidadPisos ?? '') ||
      String(tieneSubsuelo ?? '') !== String(init.tieneSubsuelo ?? '')
    );
    if (!changed) return;

    setShowMapa(false);
    setPlazasPos([]);
    setMapaGuardado(false);
  }, [plazas, tipoEstructura, cantidadPisos, tieneSubsuelo]);

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
    // Sanitize: permitir solo dígitos y punto decimal
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Evitar múltiples puntos
    const parts = sanitized.split('.');
    const normalized = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0];
    setVehiculos(prev => prev.map(v => (
      v.id === vehiculoId ? { ...v, precios: { ...v.precios, [modalidadKey]: normalized } } : v
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
          const resp = await apiClient.get('/reverse-geocode', { params: { lat: latitude, lon: longitude } });
          const data = resp.data;
          if (data && data.success) {
            const address = data.address || '';
            setAddressInput(address);
            setResolvedAddress(address);
            setUbicacion(address);
            setSelectedCoords([latitude, longitude]);
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

  const handlePlazaClick = (num) => {
    setSelectedPlazas((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num]
    );
  };

  const handleShowMapa = (e) => {
    e.preventDefault();

    // Validación básica solo de UI
    if (!nombre || !ubicacion || !plazas || !tipo || !tipoEstructura) {
      setMensaje('Completa los campos obligatorios.');
      setTipoMensaje('error');
      return;
    }
    if (tipoEstructura === 'cerrado' && !cantidadPisos) {
      setMensaje('Error: la cantidad de pisos es obligatoria para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }
    if (tipoEstructura === 'cerrado' && !tieneSubsuelo) {
      setMensaje('Error: debe especificar si tiene subsuelo para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }

    // Generar posiciones iniciales si no existen
    if (plazasArray.length > 0 && plazasPos.length === 0) {
      if (tipoEstructura === 'cerrado' && niveles.length > 1) {
        const total = plazasArray.length;
        const perFloorBase = Math.floor(total / niveles.length);
        let remainder = total % niveles.length;
        const mapObj = {};
        let current = 1;
        niveles.forEach(niv => {
          const count = perFloorBase + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder -= 1;
          const nums = Array.from({ length: count }, (_, i) => current + i);
          current += count;
          const cols = Math.ceil(Math.sqrt(nums.length || 1));
          const spacing = (AREA_SIZE - PLAZA_SIZE) / (cols - 1 || 1);
          const pos = nums.map((num, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            return { num, x: col * spacing, y: row * spacing };
          });
          mapObj[niv] = { plazasPos: pos, selectedPlazas: [] };
        });
        setPisosMap(mapObj);
        const firstNivel = niveles[0];
        setNivelActual(firstNivel);
        setPlazasPos(mapObj[firstNivel]?.plazasPos || []);
        setSelectedPlazas(mapObj[firstNivel]?.selectedPlazas || []);
      } else {
        const cols = Math.ceil(Math.sqrt(plazasArray.length));
        const spacing = (AREA_SIZE - PLAZA_SIZE) / (cols - 1 || 1);
        const newPos = plazasArray.map((num, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          return { num, x: col * spacing, y: row * spacing };
        });
        setPlazasPos(newPos);
      }
    }

    // Mostrar el mapa
    setShowMapa(true);
  };

  // Sincronizar ediciones con el piso actual cuando hay múltiples pisos
  useEffect(() => {
    if (!showMapa) return;
    if (!(tipoEstructura === 'cerrado' && niveles.length > 1)) return;
    if (nivelActual === null || nivelActual === undefined) return;
    setPisosMap(prev => ({
      ...prev,
      [nivelActual]: {
        ...(prev[nivelActual] || {}),
        plazasPos: plazasPos
      }
    }));
  }, [plazasPos, nivelActual, showMapa, tipoEstructura, niveles]);

  useEffect(() => {
    if (!showMapa) return;
    if (!(tipoEstructura === 'cerrado' && niveles.length > 1)) return;
    if (nivelActual === null || nivelActual === undefined) return;
    setPisosMap(prev => ({
      ...prev,
      [nivelActual]: {
        ...(prev[nivelActual] || {}),
        selectedPlazas: selectedPlazas
      }
    }));
  }, [selectedPlazas, nivelActual, showMapa, tipoEstructura, niveles]);

  // Guardar cambios (sin guardar el mapa). Deja el mapa visible en edición.
  const handleGuardarCambios = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!nombre || !ubicacion || !plazas || !tipo || !tipoEstructura) {
      setMensaje('Completa los campos obligatorios.');
      setTipoMensaje('error');
      return;
    }
    if (tipoEstructura === 'cerrado' && !cantidadPisos) {
      setMensaje('Error: la cantidad de pisos es obligatoria para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }
    if (tipoEstructura === 'cerrado' && !tieneSubsuelo) {
      setMensaje('Error: debe especificar si tiene subsuelo para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }

    // Construir horarios para el backend y validar
    const horariosPayload = sortedDays
      .map(d => ({
        dia: d.name,
        franjas: (d.ranges || [])
          .filter(r => r.start && r.end)
          .map(r => ({ apertura: r.start, cierre: r.end }))
      }))
      .filter(d => d.franjas.length > 0);

    if (horariosPayload.length === 0) {
      setMensaje('Error: Debes agregar al menos una franja horaria con hora de apertura y cierre.');
      setTipoMensaje('error');
      return;
    }
    for (const d of horariosPayload) {
      for (const f of d.franjas) {
        const [ha, ma] = f.apertura.split(':').map(Number);
        const [hc, mc] = f.cierre.split(':').map(Number);
        if (Number.isNaN(ha) || Number.isNaN(ma) || Number.isNaN(hc) || Number.isNaN(mc)) {
          setMensaje(`Error: Horario inválido en ${d.dia}.`);
          setTipoMensaje('error');
          return;
        }
        const aperturaMin = ha * 60 + ma;
        const cierreMin = hc * 60 + mc;
        if (aperturaMin >= cierreMin) {
          setMensaje(`Error: En ${d.dia} la hora de apertura debe ser anterior a la de cierre.`);
          setTipoMensaje('error');
          return;
        }
      }
    }

    // Asegurar coordenadas (como en guardar mapa)
    let lat = selectedCoords?.[0] ?? null;
    let lon = selectedCoords?.[1] ?? null;
    if ((lat === null || lon === null) && (addressInput || ubicacion)) {
      try {
        const texto = (addressInput || ubicacion || '').trim();
        if (texto.length > 3) {
          const respGeo = await apiClient.get('/autocomplete', { params: { text: texto } });
          const features = Array.isArray(respGeo.data) ? respGeo.data : [];
          const best = features[0];
          if (best?.geometry?.coordinates && best.geometry.coordinates.length >= 2) {
            lon = Number(best.geometry.coordinates[0]);
            lat = Number(best.geometry.coordinates[1]);
            setSelectedCoords([lat, lon]);
          }
        }
      } catch (e) {
        console.warn('Fallo geocodificando dirección para obtener coordenadas:', e);
      }
    }
    if (lat === null || lon === null || Number.isNaN(lat) || Number.isNaN(lon)) {
      setMensaje('No se pudo determinar la ubicación en el mapa. Elegí una sugerencia o usa "Usar mi ubicación".');
      setTipoMensaje('error');
      return;
    }

    // Construir tarifas desde la tabla de vehículos
    const tarifasPayload = [];
    if (tipo === 'privado' && Array.isArray(vehiculos) && vehiculos.length > 0 && Array.isArray(modalidades)) {
      vehiculos.forEach(v => {
        modalidades.forEach(mKey => {
          const val = v?.precios?.[mKey];
          if (val !== undefined && val !== null && String(val).trim() !== '' && !Number.isNaN(Number(val))) {
            tarifasPayload.push({ tipo_vehiculo: (v.nombre || '').trim() || 'Vehículo', modalidad: mKey, precio: Number(val) });
          }
        });
      });
    }

    // Construir datos de mapa actuales (si existen) para persistirlos también al guardar cambios
    let hasMap = false;
    let mapaData = {};
    if (tipoEstructura === 'cerrado' && niveles.length > 1) {
      const pisos = niveles.map(niv => ({
        nivel: niv,
        plazasPos: pisosMap[niv]?.plazasPos || [],
        selectedPlazas: pisosMap[niv]?.selectedPlazas || [],
        areaSize: AREA_SIZE,
        plazaSize: PLAZA_SIZE
      }));
      hasMap = pisos.some(p => Array.isArray(p.plazasPos) && p.plazasPos.length > 0);
      mapaData = { pisos };
    } else {
      hasMap = Array.isArray(plazasPos) && plazasPos.length > 0;
      mapaData = {
        plazasPos,
        selectedPlazas,
        areaSize: AREA_SIZE,
        plazaSize: PLAZA_SIZE
      };
    }

    const body = {
      id_cliente: idCliente || null,
      nombre_estacionamiento: nombre,
      ubicacion: ubicacion || addressInput,
      latitud: Number(lat.toFixed(8)),
      longitud: Number(lon.toFixed(8)),
      cantidad_plazas: Number(plazas),
      tipo_de_estacionamiento: tipo,
      tipo_estructura: tipoEstructura || null,
      cantidad_pisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos || 1) : 1,
      tiene_subsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
      horarios: horariosPayload,
      modalidades: tipo === 'privado' ? modalidades : [],
      metodos_pago: tipo === 'privado' ? metodosPago : [],
      tarifas: tipo === 'privado' ? tarifasPayload : []
    };
    // Incluir mapa solo si existe (evita sobreescribir con vacío)
    if (hasMap) {
      body.mapa = mapaData;
    }

    try {
      const response = await apiClient.put(`/espacios/${editingId}`, body);
      if (response.data?.success) {
        setMensaje('Cambios guardados.');
        setTipoMensaje('exito');
        // Si aún no hay grilla o cambió la cantidad de plazas, regenerar y mostrar mapa
        const total = Number(plazas || 0);
        if (total > 0 && plazasPos.length === 0) {
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
        }
        setShowMapa(true);
        // Evaluar si hubo cambios estructurales que requieran re-guardar el mapa
        const init = initialStructRef.current || {};
        const structuralChanged = (
          String(plazas ?? '') !== String(init.plazas ?? '') ||
          String(tipoEstructura ?? '') !== String(init.tipoEstructura ?? '') ||
          String(cantidadPisos ?? '') !== String(init.cantidadPisos ?? '') ||
          String(tieneSubsuelo ?? '') !== String(init.tieneSubsuelo ?? '')
        );
        // Si no hubo cambios estructurales y tenemos mapa, considerarlo guardado
        if (hasMap && !structuralChanged) {
          setMapaGuardado(true);
          // Actualizar localStorage para mantener consistencia con el servidor
          try {
            const espacioId = editingId;
            const estacionamientoData = {
              estacionamiento: {
                idEspacio: espacioId,
                nombre,
                ubicacion: ubicacion || addressInput,
                plazas: Number(plazas),
                tipo,
                tipoEstructura,
                cantidadPisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos || 1) : 1,
                tieneSubsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
                coordenadas: [lat, lon],
                fechaCreacion: new Date().toISOString()
              },
              mapa: mapaData
            };
            const mapasGuardadosLS = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
            const existingIndex = mapasGuardadosLS.findIndex(m => m.estacionamiento?.idEspacio === espacioId);
            if (existingIndex >= 0) {
              mapasGuardadosLS[existingIndex] = estacionamientoData;
            } else {
              mapasGuardadosLS.push(estacionamientoData);
            }
            localStorage.setItem('findmyspace_mapas', JSON.stringify(mapasGuardadosLS));
          } catch (e) {
            console.warn('No se pudo actualizar el mapa en localStorage tras guardar cambios:', e);
          }
        } else {
          setMapaGuardado(false);
        }
      } else {
        throw new Error('Error al guardar cambios.');
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setMensaje('No se pudieron guardar los cambios.');
      setTipoMensaje('error');
    }
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

  const handleGuardarMapa = async () => {
    // Construcción del mapa para guardar (soporta multi-piso)
    let mapaData = {};
    if (tipoEstructura === 'cerrado' && niveles.length > 1) {
      mapaData = {
        pisos: niveles.map(niv => ({
          nivel: niv,
          plazasPos: pisosMap[niv]?.plazasPos || [],
          selectedPlazas: pisosMap[niv]?.selectedPlazas || [],
          areaSize: AREA_SIZE,
          plazaSize: PLAZA_SIZE
        }))
      };
    } else {
      mapaData = {
        plazasPos,
        selectedPlazas,
        areaSize: AREA_SIZE,
        plazaSize: PLAZA_SIZE
      };
    }

    // Construir horarios para el backend y validar
    const horariosPayload = sortedDays
      .map(d => ({
        dia: d.name,
        franjas: (d.ranges || [])
          .filter(r => r.start && r.end)
          .map(r => ({ apertura: r.start, cierre: r.end }))
      }))
      .filter(d => d.franjas.length > 0);

    // Validación: debe haber al menos una franja válida
    if (horariosPayload.length === 0) {
      setMensaje('Error: Debes agregar al menos una franja horaria con hora de apertura y cierre.');
      setTipoMensaje('error');
      return;
    }

    // Validación: cada franja apertura < cierre
    for (const d of horariosPayload) {
      for (const f of d.franjas) {
        const [ha, ma] = f.apertura.split(':').map(Number);
        const [hc, mc] = f.cierre.split(':').map(Number);
        if (Number.isNaN(ha) || Number.isNaN(ma) || Number.isNaN(hc) || Number.isNaN(mc)) {
          setMensaje(`Error: Horario inválido en ${d.dia}.`);
          setTipoMensaje('error');
          return;
        }
        const aperturaMin = ha * 60 + ma;
        const cierreMin = hc * 60 + mc;
        if (aperturaMin >= cierreMin) {
          setMensaje(`Error: En ${d.dia} la hora de apertura debe ser anterior a la de cierre.`);
          setTipoMensaje('error');
          return;
        }
      }
    }

    console.log('Horarios enviados al backend:', horariosPayload); // Verificar el payload

    // Asegurar coordenadas: si el usuario escribió la dirección sin elegir sugerencia ni usar ubicación,
    // intentamos geocodificar antes de guardar.
    let lat = selectedCoords?.[0] ?? null;
    let lon = selectedCoords?.[1] ?? null;
    if ((lat === null || lon === null) && (addressInput || ubicacion)) {
      try {
        const texto = (addressInput || ubicacion || '').trim();
        if (texto.length > 3) {
          const respGeo = await apiClient.get('/autocomplete', { params: { text: texto } });
          const features = Array.isArray(respGeo.data) ? respGeo.data : [];
          const best = features[0];
          if (best?.geometry?.coordinates && best.geometry.coordinates.length >= 2) {
            // Geoapify devuelve [lon, lat]
            lon = Number(best.geometry.coordinates[0]);
            lat = Number(best.geometry.coordinates[1]);
            setSelectedCoords([lat, lon]);
          }
        }
      } catch (e) {
        console.warn('Fallo geocodificando dirección para obtener coordenadas:', e);
      }
    }

    // Validación final de coordenadas (preferimos guardarlas para búsquedas posteriores)
    if (lat === null || lon === null || Number.isNaN(lat) || Number.isNaN(lon)) {
      setMensaje('No se pudo determinar la ubicación en el mapa. Elegí una sugerencia o usa "Usar mi ubicación".');
      setTipoMensaje('error');
      return;
    }
    
    // Construir tarifas a partir de la tabla de vehículos y modalidades seleccionadas
    const tarifasPayload = [];
    if (tipo === 'privado' && Array.isArray(vehiculos) && vehiculos.length > 0 && Array.isArray(modalidades)) {
      vehiculos.forEach(v => {
        modalidades.forEach(mKey => {
          const val = v?.precios?.[mKey];
          if (val !== undefined && val !== null && String(val).trim() !== '' && !Number.isNaN(Number(val))) {
            tarifasPayload.push({ tipo_vehiculo: (v.nombre || '').trim() || 'Vehículo', modalidad: mKey, precio: Number(val) });
          }
        });
      });
    }

    const body = {
      id_cliente: idCliente || null,
      nombre_estacionamiento: nombre,
      ubicacion: ubicacion || addressInput,
      latitud: Number(lat.toFixed(8)),
      longitud: Number(lon.toFixed(8)),
      cantidad_plazas: Number(plazas),
      tipo_de_estacionamiento: tipo,
      tipo_estructura: tipoEstructura || null,
      cantidad_pisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos || 1) : 1,
      tiene_subsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
      horarios: horariosPayload,
      modalidades: tipo === 'privado' ? modalidades : [],
      metodos_pago: tipo === 'privado' ? metodosPago : [],
      tarifas: tipo === 'privado' ? tarifasPayload : [],
      mapa: mapaData
    };

    try {
      const response = editingId
        ? await apiClient.put(`/espacios/${editingId}`, body)
        : await apiClient.post('/espacios', body);

      if (response.data?.success) {
        const espacioId = editingId || response.data?.id_espacio;
        
        // Guardar también en localStorage para la sesión
        const estacionamientoData = {
          estacionamiento: {
            idEspacio: espacioId,
            nombre,
            ubicacion: ubicacion || addressInput,
            plazas: Number(plazas),
            tipo,
            tipoEstructura,
            cantidadPisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos) : 1,
            tieneSubsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false,
            coordenadas: selectedCoords,
            fechaCreacion: new Date().toISOString()
          },
          mapa: mapaData
        };

        // Guardar en localStorage
        const mapasGuardados = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
        
        // Buscar si ya existe un mapa para este espacio
        const existingIndex = mapasGuardados.findIndex(m => 
          m.estacionamiento.idEspacio === espacioId ||
          (m.estacionamiento.nombre === nombre && 
           m.estacionamiento.ubicacion === (ubicacion || addressInput) &&
           m.estacionamiento.plazas === Number(plazas))
        );

        if (existingIndex >= 0) {
          // Actualizar el mapa existente
          mapasGuardados[existingIndex] = estacionamientoData;
        } else {
          // Agregar nuevo mapa
          mapasGuardados.push(estacionamientoData);
        }

        localStorage.setItem('findmyspace_mapas', JSON.stringify(mapasGuardados));

        setMensaje('¡Mapa guardado exitosamente en el servidor y en tu sesión!');
        setTipoMensaje('exito');
        setMapaGuardado(true);
      } else {
        throw new Error('Error al guardar el mapa en el servidor.');
      }
    } catch (error) {
      console.error('Error al guardar el mapa en el servidor:', error);
      setMensaje('No se pudo guardar el mapa en el servidor.');
      setTipoMensaje('error');
    }
  };

  return (
    <>
      <BannerUser />
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
            <div className={`${styles.splitContainer} ${!showMapa ? styles.singleColumn : ''}`}>
              {/* Columna izquierda: formulario */}
              <div className={styles.panelCard}>
                <h1 className={styles.pageTitle}>{editingId ? 'Editar Estacionamiento' : 'Nuevo Estacionamiento'}</h1>
                {/* Toggle mostrar/ocultar mapa */}
                <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => setShowMapa(prev => !prev)}
                    aria-label={showMapa ? 'Ocultar mapa' : 'Mostrar mapa'}
                  >
                    {showMapa ? 'Ocultar mapa' : 'Mostrar mapa'}
                  </button>
                </div>
                <form onSubmit={editingId ? handleGuardarCambios : handleShowMapa}>
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
                <div className={styles.inlineRow}>
                  <input
                    type="text"
                    placeholder="Ubicación"
                    value={addressInput}
                    onChange={handleAddressChange}
                    className={styles.formInput}
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className={styles.useLocationBtn}
                  >
                    {isLocating ? 'Obteniendo…' : 'Usar mi ubicación'}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <ul className={styles.suggestionsList}>
                    <li
                      onClick={handleUseCurrentLocation}
                      className={styles.locationOption}
                    >
                       Usar mi ubicación actual
                    </li>
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
                      <p className={styles.helperText}>Define los precios para cada tipo de vehículo y modalidad de cobro.</p>
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
                      <p className={styles.helperText}>Selecciona los métodos de pago aceptados.</p>
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
              {/* Columna derecha: mapa. En edición, se muestra automáticamente. */}
              {showMapa && (
                <div className={`${styles.panelCard} ${styles.mapPanel}`}>
                  <h2 className={styles.sectionTitle}>Mapa</h2>
                  {tipoEstructura === 'cerrado' && niveles.length > 1 && (
                    <div className={styles.formGroup} style={{ marginTop: '-8px' }}>
                      <label className={styles.helperText} htmlFor="nivelSelect">Piso</label>
                      <select
                        id="nivelSelect"
                        className={styles.formSelect}
                        value={nivelActual ?? ''}
                        onChange={e => {
                          const nuevo = Number(e.target.value);
                          // al cambiar de piso, reflejar ediciones actuales ya están sincronizadas por efecto
                          setNivelActual(nuevo);
                          const data = pisosMap[nuevo] || { plazasPos: [], selectedPlazas: [] };
                          setPlazasPos(data.plazasPos || []);
                          setSelectedPlazas(data.selectedPlazas || []);
                        }}
                      >
                        {niveles.map(n => (
                          <option key={n} value={n}>
                            {n === -1 ? 'Subsuelo (-1)' : (n === 0 ? 'Planta baja (0)' : `Piso ${n}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {plazasPos.length > 0 ? (
                    <>
                      <div className={styles.mapWrapper} style={{ width: AREA_SIZE }}>
                        <div
                          ref={areaRef}
                          className={styles.mapArea}
                          style={{ width: AREA_SIZE, height: AREA_SIZE }}
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
                              <span className={styles.plazaNumber}>{plaza.num}</span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.mapLegend}>
                          <div className={styles.legendItem}><span className={styles.legendDot}></span> Plaza disponible</div>
                          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendSelected}`}></span> Plaza seleccionada</div>
                        </div>
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
        </div>
      </div>
    </>
  );
};

export default SubirEstacionamiento;
