
import React, { useState, useRef } from 'react';
import BannerUser from '../components/BannerUser'; // Importa BannerUser
import { getUserSession } from '../utils/auth';
import styles from './SubirEstacionamiento.module.css'; // Asegúrate de tener un archivo CSS para estilos

const API_URL = import.meta.env.VITE_API_URL;


const AREA_SIZE = 400; // Tamaño del área del estacionamiento en px
const PLAZA_SIZE = 40; // Tamaño de cada plaza en px

const SubirEstacionamiento = () => {
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [plazas, setPlazas] = useState('');
  const [tipo, setTipo] = useState('');
  const [tipoEstructura, setTipoEstructura] = useState(''); // aire libre o cerrado
  const [cantidadPisos, setCantidadPisos] = useState(''); // solo para estacionamientos cerrados
  const [tieneSubsuelo, setTieneSubsuelo] = useState(''); // solo para estacionamientos cerrados
  const [precio, setPrecio] = useState('');
  const [apertura, setApertura] = useState('');
  const [cierre, setCierre] = useState('');

  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const [selectedPlazas, setSelectedPlazas] = useState([]);
  const [showMapa, setShowMapa] = useState(false);
  const [plazasPos, setPlazasPos] = useState([]); // [{num, x, y}]
  const [mapaGuardado, setMapaGuardado] = useState(false); // Nuevo estado

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // 'error' o 'exito'

  const dragPlaza = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  // Obtener datos de la sesión del usuario
  const userSession = getUserSession();
  const idCliente = userSession ? userSession.id_cliente : null;
  const userEmail = userSession ? userSession.email : 'Usuario';

  // Generar array de plazas según la cantidad
  const plazasArray = plazas && Number(plazas) > 0
    ? Array.from({ length: Number(plazas) }, (_, i) => i + 1)
    : [];

  // Autocompletar direcciones usando el backend
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

  // Cuando el usuario selecciona una sugerencia
  const handleSuggestionClick = (suggestion) => {
    setAddressInput(suggestion.properties.formatted);
    setResolvedAddress(suggestion.properties.formatted);
    setUbicacion(suggestion.properties.formatted);
    setSuggestions([]);
    if (suggestion.geometry && suggestion.geometry.coordinates) {
      setSelectedCoords([suggestion.geometry.coordinates[1], suggestion.geometry.coordinates[0]]);
    }
  };

  // Selección de plaza (opcional)
  const handlePlazaClick = (num) => {
    setSelectedPlazas((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num]
    );
  };

  // Inicializar posiciones al generar el mapa
  const handleShowMapa = async (e) => {
    e.preventDefault();
    
    // Validación básica para todos los campos excepto precio y pisos
    if (!nombre || !ubicacion || !plazas || !tipo || !tipoEstructura || !apertura || !cierre) {
      setMensaje('Error al enviar: completa todos los campos.');
      setTipoMensaje('error');
      return;
    }
    
    // Validación específica para precio solo si es privado
    if (tipo === 'privado' && !precio) {
      setMensaje('Error al enviar: el precio es obligatorio para estacionamientos privados.');
      setTipoMensaje('error');
      return;
    }
    
    // Validación específica para cantidad de pisos solo si es cerrado
    if (tipoEstructura === 'cerrado' && !cantidadPisos) {
      setMensaje('Error al enviar: la cantidad de pisos es obligatoria para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }
    
    // Validación específica para subsuelo solo si es cerrado
    if (tipoEstructura === 'cerrado' && !tieneSubsuelo) {
      setMensaje('Error al enviar: debe especificar si tiene subsuelo para estacionamientos cerrados.');
      setTipoMensaje('error');
      return;
    }

    const token = localStorage.getItem('token'); // Obtener el token del almacenamiento local

    // Enviar datos al backend
    try {
      const resp = await fetch(`${API_URL}/api/espacios`, { // URL usando variable de entorno
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // Agregar el token en los encabezados
        },
        body: JSON.stringify({
          id_cliente: idCliente, // Incluir id_cliente
          nombre_estacionamiento: nombre,
          ubicacion,
          latitud: selectedCoords ? selectedCoords[0] : null, // Agregar latitud
          longitud: selectedCoords ? selectedCoords[1] : null, // Agregar longitud
          cantidad_plazas: Number(plazas),
          tipo_de_estacionamiento: tipo,
          tipo_estructura: tipoEstructura, // Nuevo campo
          cantidad_pisos: tipoEstructura === 'cerrado' ? parseInt(cantidadPisos) : 1, // Solo enviar pisos si es cerrado
          tiene_subsuelo: tipoEstructura === 'cerrado' ? (tieneSubsuelo === 'si') : false, // Solo relevante si es cerrado
          precio_por_hora: tipo === 'privado' ? parseFloat(precio) : 0, // Solo enviar precio si es privado
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
        return {
          num,
          x: col * spacing,
          y: row * spacing,
        };
      });
      setPlazasPos(newPos);
    }
    setShowMapa(true);
    setMapaGuardado(false); // Resetear estado de mapa guardado
  };

  // Drag & Drop libre
  const handleMouseDown = (e, idx) => {
    dragPlaza.current = idx;
    const rect = e.target.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (dragPlaza.current === null) return;
    setPlazasPos((prev) => {
      return prev.map((plaza, idx) => {
        if (idx !== dragPlaza.current) return plaza;
        let newX = e.clientX - offset.current.x - areaRef.current.getBoundingClientRect().left;
        let newY = e.clientY - offset.current.y - areaRef.current.getBoundingClientRect().top;
        // Limitar dentro del área
        newX = Math.max(0, Math.min(newX, AREA_SIZE - PLAZA_SIZE));
        newY = Math.max(0, Math.min(newY, AREA_SIZE - PLAZA_SIZE));
        return { ...plaza, x: newX, y: newY };
      });
    });
  };

  const handleMouseUp = () => {
    dragPlaza.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Referencia al área del estacionamiento
  const areaRef = useRef(null);

  // Función para guardar el mapa en la sesión del usuario
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
      mapa: {
        plazasPos,
        selectedPlazas,
        areaSize: AREA_SIZE,
        plazaSize: PLAZA_SIZE
      }
    };

    // Obtener mapas existentes de la sesión
    const mapasGuardados = JSON.parse(localStorage.getItem('findmyspace_mapas') || '[]');
    
    // Agregar el nuevo mapa
    mapasGuardados.push(mapaData);
    
    // Guardar en localStorage
    localStorage.setItem('findmyspace_mapas', JSON.stringify(mapasGuardados));
    
    console.log('🗺️ Mapa guardado en sesión:', mapaData);
    console.log('📊 Total de mapas guardados:', mapasGuardados.length);
    
    setMapaGuardado(true);
    setMensaje('¡Mapa guardado exitosamente en tu sesión!');
    setTipoMensaje('exito');
  };

  return (
    <>
      <BannerUser />
      <div style={{ maxWidth: 420, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
        <h1 style={{ fontFamily: 'cursive', fontSize: 48, textAlign: 'center', marginBottom: 24 }}>ADMIN</h1>
        <div className={styles.welcomeCard}>
          <h1 className={styles.title}>¡Bienvenido de vuelta!</h1>
          <p className={styles.subtitle}>
            Hola {userEmail}, has iniciado sesión correctamente en FindMySpace
          </p>
        </div>
        <form onSubmit={handleShowMapa}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Nombre del estacionamiento"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 20 }}
              required
            />
          </div>
          {/* Formulario de dirección con autocompletado */}
          <div style={{ marginBottom: 12, position: 'relative' }}>
            <input
              type="text"
              placeholder="Ubicación"
              value={addressInput}
              onChange={handleAddressChange}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
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
          <div style={{ marginBottom: 12 }}>
            <input
              type="number"
              placeholder="Cantidad de plazas"
              value={plazas}
              onChange={e => {
                setPlazas(e.target.value);
                setShowMapa(false); // Oculta el mapa si cambia la cantidad
                setPlazasPos([]); // Reinicia el orden
              }}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
              required
              min={1}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <select
              value={tipoEstructura}
              onChange={e => {
                setTipoEstructura(e.target.value);
                // Limpiar la cantidad de pisos y subsuelo si cambia de cerrado a aire libre
                if (e.target.value === 'aire_libre') {
                  setCantidadPisos('');
                  setTieneSubsuelo('');
                }
              }}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
              required
            >
              <option value="">Selecciona estructura del estacionamiento</option>
              <option value="aire_libre">Aire Libre</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          {/* Campo de cantidad de pisos solo visible para estacionamientos cerrados */}
          {tipoEstructura === 'cerrado' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Cantidad de pisos"
                  value={cantidadPisos}
                  onChange={e => setCantidadPisos(e.target.value)}
                  style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <select
                  value={tieneSubsuelo}
                  onChange={e => setTieneSubsuelo(e.target.value)}
                  style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
                  required
                >
                  <option value="">¿Tiene subsuelo?</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </>
          )}
           <div style={{ marginBottom: 4 }}>
            <select
              value={tipo}
              onChange={e => {
                setTipo(e.target.value);
                // Limpiar el precio si cambia de privado a público
                if (e.target.value === 'publico') {
                  setPrecio('');
                }
              }}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
              required
            >
              <option value="">Selecciona tipo de estacionamiento</option>
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </select>
          </div>
          {/* Campo de precio solo visible para estacionamientos privados */}
          {tipo === 'privado' && (
            <div style={{ marginBottom: 12 }}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio por hora (ARS)"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
                required
              />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <input
              type="time"
              placeholder="Horario apertura"
              value={apertura}
              onChange={e => setApertura(e.target.value)}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="time"
              placeholder="Horario cierre"
              value={cierre}
              onChange={e => setCierre(e.target.value)}
              style={{ width: '100%', fontFamily: 'cursive', fontSize: 18 }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: '60%',
              margin: '0 auto',
              display: 'block',
              fontFamily: 'cursive',
              fontSize: 18,
              padding: '8px 0'
            }}
          >
            Generar mapa
          </button>
        </form>
        {mensaje && (
          <div
            style={{
              margin: '16px 0',
              color: tipoMensaje === 'error' ? '#d32f2f' : '#388e3c',
              fontWeight: 'bold',
              fontFamily: 'cursive',
              fontSize: 18,
              textAlign: 'center'
            }}
          >
            {mensaje}
          </div>
        )}
        {/* Mapa de plazas interactivo libre */}
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
            
            {/* Botón Guardar Mapa */}
            {!mapaGuardado && (
              <button
                onClick={handleGuardarMapa}
                style={{
                  width: '60%',
                  margin: '16px auto',
                  display: 'block',
                  fontFamily: 'cursive',
                  fontSize: 18,
                  padding: '12px 0',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💾 Guardar Mapa
              </button>
            )}
            
            {/* Mensaje de confirmación si ya se guardó */}
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
                ✅ Mapa guardado en tu sesión
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default SubirEstacionamiento;