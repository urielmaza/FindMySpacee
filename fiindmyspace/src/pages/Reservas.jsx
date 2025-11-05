import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Reservas.module.css';
import { getUserSession } from '../utils/auth';
import apiClient from '../apiClient';

const Reservas = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plazaNumero, vehiculoId, vehiculo, parkingId, parkingName } = location.state || {}; // Datos desde Parkin

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(vehiculo || null);
  const [modalidades, setModalidades] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [modalidad, setModalidad] = useState('');
  const [precio, setPrecio] = useState(null);
  const [moneda, setMoneda] = useState('ARS');
  // Fechas/horas según modalidad
  const [fecha, setFecha] = useState(''); // para modalidad 'hora'
  const [horaDesde, setHoraDesde] = useState('');
  const [horaHasta, setHoraHasta] = useState('');
  const [fechaDesde, setFechaDesde] = useState(''); // para modalidad 'dia'
  const [fechaHasta, setFechaHasta] = useState('');
  const [disponible, setDisponible] = useState(null);
  const [checking, setChecking] = useState(false);
  const [errorHorario, setErrorHorario] = useState('');
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoPago, setMetodoPago] = useState('');
  const [ownerPayMethods, setOwnerPayMethods] = useState(null); // detalles del propietario por espacio
  const [userCards, setUserCards] = useState([]); // tarjetas del usuario
  const [selectedCard, setSelectedCard] = useState(null);
  const [espacioInfo, setEspacioInfo] = useState(null); // datos del espacio para maps
  const [showTarifas, setShowTarifas] = useState(false);
  const transferFileRef = useRef(null);
  const walletFileRef = useRef(null);
  const [transferFileName, setTransferFileName] = useState('');
  const [walletFileName, setWalletFileName] = useState('');
  // Largo plazo: semana/mes/año
  const [cantidad, setCantidad] = useState(1);
  // Hora fija para día/semana/mes/año (retiro/entrega)
  const [horaFija, setHoraFija] = useState('07:30');
  const [loading, setLoading] = useState(true);

  // Etiquetas amigables para modalidades
  const LABELS = {
    hora: 'Por hora',
    dia: 'Por día',
    semana: 'Por semana',
    mes: 'Por mes',
    anio: 'Por año',
  };
  const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const WEEK_DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const METODO_PAGO_LABELS = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    billetera: 'Billeteras virtuales',
    transferencia: 'Transferencia bancaria',
  };
  const toTitle = (s='') => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const nombreDiaNumero = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return '';
    const idx = num === 7 ? 0 : num; // 1..6 -> Lunes..Sábado, 7 -> Domingo (0)
    return DIAS_ES[idx] || '';
  };

  // Prefill de usuario
  useEffect(() => {
    const u = getUserSession();
    if (u) {
      setEmail(u.email || '');
      setNombre(u.nombre || u.first_name || '');
      setApellido(u.apellido || u.last_name || '');
    }
  }, []);

  // Cargar datos del espacio
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        if (!parkingId) return;
        
        const resp = await apiClient.get(`/espacios/${parkingId}`);
        const data = resp.data?.data || {};
        setModalidades(Array.isArray(data.modalidades) ? data.modalidades : []);
        setTarifas(Array.isArray(data.tarifas) ? data.tarifas : []);
        setHorarios(Array.isArray(data.horarios) ? data.horarios : []);
        const mp = Array.isArray(data.metodos_pago) ? data.metodos_pago : [];
        setMetodosPago(mp);
        setEspacioInfo(data.espacio || null);
        setMetodoPago(''); // limpiar selección al cambiar de espacio
        // Cargar métodos de pago del propietario para este espacio
        try {
          const mresp = await apiClient.get(`/espacios/${parkingId}/payment-methods`);
          setOwnerPayMethods(mresp.data?.metodos || {});
        } catch (e2) {
          console.warn('No se pudieron cargar los métodos del propietario para este espacio:', e2);
          setOwnerPayMethods({});
        }
        const def = (data.modalidades && data.modalidades[0]) || 'hora';
        setModalidad(def);
      } catch (e) {
        console.error('Error cargando espacio:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [parkingId]);

  // Cargar métodos de pago del usuario (para mostrar tarjetas guardadas)
  useEffect(() => {
    const loadUserMethods = async () => {
      try {
        const res = await apiClient.get('/payment-methods');
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const cards = items.filter(it => String(it.clave) === 'tarjeta');
        setUserCards(cards);
        const first = cards[0];
        setSelectedCard(first ? first.id_cliente_metodo : null);
      } catch (e) {
        // silencioso si no hay sesión o falla
        setUserCards([]);
        setSelectedCard(null);
      }
    };
    loadUserMethods();
  }, []);

  // Calcular precio
  useEffect(() => {
    if (!vehiculoSeleccionado || !modalidad || tarifas.length === 0) {
      setPrecio(null);
      return;
    }
    const tipo = String(vehiculoSeleccionado.tipo_vehiculo || '').toLowerCase();
    const t = tarifas.find(x => String(x.modalidad).toLowerCase() === String(modalidad).toLowerCase() && String(x.tipo_vehiculo).toLowerCase() === tipo);
    if (!t) { setPrecio(null); return; }
    setMoneda(t.moneda || 'ARS');
    const m = String(modalidad);
    if (m === 'hora') {
      const dMin = toMinutes(horaDesde);
      const hMin = toMinutes(horaHasta);
      if (!Number.isFinite(dMin) || !Number.isFinite(hMin) || hMin <= dMin) { setPrecio(null); return; }
      const hours = (hMin - dMin) / 60;
      setPrecio(Number(t.precio) * hours);
    } else if (['dia','semana','mes','anio'].includes(m)) {
      const qty = Math.max(1, Number(cantidad || 1));
      setPrecio(Number(t.precio) * qty);
    } else {
      setPrecio(Number(t.precio));
    }
  }, [vehiculoSeleccionado, modalidad, tarifas, cantidad, horaDesde, horaHasta]);

  // Inicializar controles por defecto
  useEffect(() => {
    const now = new Date();
    now.setMinutes(0,0,0);
    const toLocalDate = (d)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const pad = (n)=> String(n).padStart(2,'0');
    const toLocalTime = (d)=> `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFecha(toLocalDate(now));
    setHoraDesde(toLocalTime(now));
    const end = new Date(now.getTime()+60*60*1000);
    setHoraHasta(toLocalTime(end));
    setFechaDesde(toLocalDate(now));
    const endDay = new Date(now.getTime()+24*60*60*1000);
    setFechaHasta(toLocalDate(endDay));
  }, []);

  // Mapa de horarios por día (0=Dom, 6=Sáb)
  const horariosPorDia = useMemo(() => {
    const map = new Map();
    (horarios || []).forEach(h => {
      const jsDay = (h.dia_semana === 7) ? 0 : (h.dia_semana || 1); // 1..6 -> 1..6, 7->0
      const key = jsDay;
      const arr = map.get(key) || [];
      if (Array.isArray(h.franjas) && h.franjas.length > 0) {
        h.franjas.forEach(f => arr.push({ apertura: f.apertura, cierre: f.cierre }));
      } else if (h.apertura && h.cierre) {
        arr.push({ apertura: h.apertura, cierre: h.cierre });
      }
      map.set(key, arr);
    });
    for (const [k, v] of map.entries()) v.sort((a,b)=> (a.apertura||'').localeCompare(b.apertura||''));
    return map;
  }, [horarios]);

  const diaSemanaJS = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00');
    return d.getDay();
  };
  const nombreDia = (dateStr) => {
    const n = diaSemanaJS(dateStr);
    return (n === null) ? '' : (DIAS_ES[n] || '');
  };

  // Normalización y comparación de horas
  const toHHMM = (t) => {
    if (!t || typeof t !== 'string') return '';
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return '';
    const hh = String(m[1]).padStart(2,'0');
    const mm = String(m[2]).padStart(2,'0');
    return `${hh}:${mm}`;
  };
  const toMinutes = (t) => {
    const hhmm = toHHMM(t);
    if (!hhmm) return NaN;
    const [h, m] = hhmm.split(':').map(Number);
    return h*60 + m;
  };

  const estaDentroDeFranjas = (dateStr, hDesde, hHasta) => {
    const day = diaSemanaJS(dateStr);
    if (day === null) return false;
    const franjas = horariosPorDia.get(day) || [];
    if (!hDesde || !hHasta) return false;
    const dMin = toMinutes(hDesde);
    const hMin = toMinutes(hHasta);
    if (!Number.isFinite(dMin) || !Number.isFinite(hMin) || dMin >= hMin) return false;
    return franjas.some(f => {
      const fa = toMinutes(f.apertura);
      const fc = toMinutes(f.cierre);
      return Number.isFinite(fa) && Number.isFinite(fc) && dMin >= fa && hMin <= fc;
    });
  };

  const horaDentroDeFranjas = (dateStr, timeStr) => {
    const day = diaSemanaJS(dateStr);
    if (day === null) return false;
    const franjas = horariosPorDia.get(day) || [];
    if (!timeStr) return false;
    const t = toMinutes(timeStr);
    if (!Number.isFinite(t)) return false;
    return franjas.some(f => {
      const fa = toMinutes(f.apertura);
      const fc = toMinutes(f.cierre);
      return Number.isFinite(fa) && Number.isFinite(fc) && t >= fa && t <= fc;
    });
  };

  const diasOperativosEntre = (dateStartStr, dateEndStr) => {
    try {
      const start = new Date(dateStartStr + 'T00:00');
      const end = new Date(dateEndStr + 'T00:00');
      if (end < start) return false;
      const cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        const ok = (horariosPorDia.get(day) || []).length > 0;
        if (!ok) return false;
        cur.setDate(cur.getDate()+1);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Validación cliente
  useEffect(() => {
    setDisponible(null);
    setErrorHorario('');
    if (modalidad === 'hora') {
      if (!fecha || !horaDesde || !horaHasta) return;
      if (!estaDentroDeFranjas(fecha, horaDesde, horaHasta)) {
        setErrorHorario('El horario seleccionado no está dentro de las franjas habilitadas para ese día.');
      }
    } else if (modalidad === 'dia') {
      const qty = Math.max(1, Number(cantidad||1));
      if (!fechaDesde || qty < 1) return;
      const endExcl = addDays(fechaDesde, qty);
      const cur = new Date(fechaDesde + 'T00:00:00');
      while (cur < endExcl) {
        const dStr = toLocalDateStr(cur);
        if (!horaDentroDeFranjas(dStr, horaFija)) {
          setErrorHorario('La hora elegida no está disponible todos los días del rango.');
          break;
        }
        cur.setDate(cur.getDate()+1);
      }
    } else if (['semana','mes','anio'].includes(modalidad)) {
      // Validaremos cantidad mínima; además verificamos que la hora fija exista en todas las fechas del rango
      if (Number(cantidad) < 1) setErrorHorario('La cantidad debe ser al menos 1.');
      if (fechaDesde && Number(cantidad) >= 1) {
        let endExcl;
        if (modalidad === 'semana') {
          endExcl = addDays(fechaDesde, 7*Math.max(1, Number(cantidad||1)));
        } else if (modalidad === 'mes') {
          endExcl = addMonths(fechaDesde, Math.max(1, Number(cantidad||1)));
        } else if (modalidad === 'anio') {
          endExcl = addYears(fechaDesde, Math.max(1, Number(cantidad||1)));
        }
        if (endExcl) {
          const cur = new Date(fechaDesde + 'T00:00:00');
          while (cur < endExcl) {
            const dStr = toLocalDateStr(cur);
            if (!horaDentroDeFranjas(dStr, horaFija)) {
              setErrorHorario('La hora elegida no está disponible todos los días del rango.');
              break;
            }
            cur.setDate(cur.getDate()+1);
          }
        }
      }
    }
  }, [modalidad, fecha, horaDesde, horaHasta, fechaDesde, horariosPorDia, cantidad, horaFija]);

  // Helpers de fechas
  const toISODate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}`).toISOString();
  const addDays = (dateStr, days) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate()+days);
    return d;
  };
  const addMonths = (dateStr, months) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate();
    d.setMonth(d.getMonth()+months);
    // Ajuste por fin de mes
    if (d.getDate() < day) d.setDate(0);
    return d;
  };
  const addYears = (dateStr, years) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setFullYear(d.getFullYear()+years);
    return d;
  };
  const toLocalDateStr = (d) => new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);

  const verificarDisponibilidad = async () => {
    let desdeISO = '';
    let hastaISO = '';
    if (modalidad === 'hora') {
      if (!fecha || !horaDesde || !horaHasta || errorHorario) return;
      desdeISO = new Date(`${fecha}T${horaDesde}:00`).toISOString();
      hastaISO = new Date(`${fecha}T${horaHasta}:00`).toISOString();
    } else if (modalidad === 'dia') {
      const qty = Math.max(1, Number(cantidad||1));
      if (!fechaDesde || qty < 1 || errorHorario) return;
      // Usamos fin exclusivo: start + qty días a las 00:00:00
      const endExcl = addDays(fechaDesde, qty);
      desdeISO = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      hastaISO = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else if (modalidad === 'semana') {
      const qty = Math.max(1, Number(cantidad||1));
      if (!fechaDesde || qty < 1 || errorHorario) return;
      const endExcl = addDays(fechaDesde, 7*qty);
      desdeISO = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      hastaISO = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else if (modalidad === 'mes') {
      const qty = Math.max(1, Number(cantidad||1));
      if (!fechaDesde || qty < 1 || errorHorario) return;
      const endExcl = addMonths(fechaDesde, qty);
      desdeISO = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      hastaISO = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else if (modalidad === 'anio') {
      const qty = Math.max(1, Number(cantidad||1));
      if (!fechaDesde || qty < 1 || errorHorario) return;
      const endExcl = addYears(fechaDesde, qty);
      desdeISO = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      hastaISO = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else {
      return;
    }
    if (!parkingId || !plazaNumero) return;
    setChecking(true);
    try {
      const resp = await apiClient.get(`/reservas/disponibilidad`, { params: {
        id_espacio: parkingId,
        parcelaNumero: plazaNumero,
        desde: desdeISO,
        hasta: hastaISO,
      }});
      setDisponible(resp.data?.disponible ?? null);
    } catch (e) {
      console.error('Error verificando disponibilidad:', e);
      setDisponible(null);
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = async (text) => {
    const value = text ?? '';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(String(value));
      } else {
        const ta = document.createElement('textarea');
        ta.value = String(value);
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) {
      console.warn('No se pudo copiar al portapapeles:', e);
    }
  };

  const getProviderUrl = (name) => {
    const s = String(name || '').toLowerCase();
    if (!s) return null;
    if (s.includes('mercado')) return 'https://www.mercadopago.com/';
    if (s.includes('paypal')) return 'https://www.paypal.com/';
    if (s.includes('uala')) return 'https://www.uala.com/';
    if (s.includes('binance')) return 'https://www.binance.com/';
    return null;
  };

  const getProviderAppUrl = (name) => {
    const s = String(name || '').toLowerCase();
    if (!s) return null;
    if (s.includes('mercado')) return 'mercadopago://';
    if (s.includes('paypal')) return 'paypal://';
    if (s.includes('uala')) return 'uala://';
    if (s.includes('binance')) return 'binance://';
    return null;
  };

  const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const openAppThenFallback = (appUrl, webUrl) => {
    try {
      const start = Date.now();
      // Intento abrir la app
      window.location.href = appUrl;
      // Fallback si no se abre (app no instalada)
      setTimeout(() => {
        const elapsed = Date.now() - start;
        // Si seguimos en la misma pestaña rápidamente, probablemente no abrió la app
        if (elapsed < 1600 && webUrl) {
          window.location.href = webUrl;
        }
      }, 1200);
    } catch {
      if (webUrl) window.location.href = webUrl;
    }
  };

  const handleProviderClick = (e, providerName) => {
    const webUrl = getProviderUrl(providerName);
    const appUrl = getProviderAppUrl(providerName);
    if (isMobile() && appUrl) {
      e.preventDefault();
      openAppThenFallback(appUrl, webUrl);
    }
    // En desktop, sigue el href normal
  };

  const getGoogleMapsUrl = () => {
    const e = espacioInfo || {};
    const lat = e.latitud;
    const lng = e.longitud;
    if (lat != null && lng != null && lat !== '' && lng !== '') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
    }
    const q = e.ubicacion || parkingName || '';
    if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    return 'https://www.google.com/maps';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Array.isArray(metodosPago) && metodosPago.length > 0 && !metodoPago) {
      alert('Selecciona al menos un método de pago.');
      return;
    }
    let fecha_desde = '';
    let fecha_hasta = '';
    if (modalidad === 'hora') {
      if (errorHorario) { alert(errorHorario); return; }
      fecha_desde = new Date(`${fecha}T${horaDesde}:00`).toISOString();
      fecha_hasta = new Date(`${fecha}T${horaHasta}:00`).toISOString();
    } else if (modalidad === 'dia') {
      if (errorHorario) { alert(errorHorario); return; }
      const qty = Math.max(1, Number(cantidad||1));
      const endExcl = addDays(fechaDesde, qty);
      fecha_desde = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      fecha_hasta = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else if (modalidad === 'semana') {
      const qty = Math.max(1, Number(cantidad||1));
      const endExcl = addDays(fechaDesde, 7*qty);
      fecha_desde = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      fecha_hasta = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else if (modalidad === 'mes') {
      const qty = Math.max(1, Number(cantidad||1));
      const endExcl = addMonths(fechaDesde, qty);
      fecha_desde = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      fecha_hasta = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else if (modalidad === 'anio') {
      const qty = Math.max(1, Number(cantidad||1));
      const endExcl = addYears(fechaDesde, qty);
      fecha_desde = new Date(`${fechaDesde}T${horaFija}:00`).toISOString();
      fecha_hasta = new Date(`${toLocalDateStr(endExcl)}T${horaFija}:00`).toISOString();
    } else {
      alert('Modalidad no soportada aún en el flujo de fechas.');
      return;
    }
    const payload = {
      id_cliente: getUserSession()?.id_cliente,
      id_vehiculo: vehiculoId || vehiculoSeleccionado?.id_vehiculo,
      id_espacio: parkingId,
      parcelaNumero: plazaNumero,
      fecha_desde,
      fecha_hasta,
      modalidad,
      metodo_pago: metodoPago || null,
      id_cliente_metodo: (metodoPago === 'tarjeta' && selectedCard) ? selectedCard : null,
    };
    apiClient.post('/reservas', payload)
      .then((r) => {
        const codigo = r.data?.codigo || '';
        alert(`Reserva creada. Código: ${codigo}`);
      })
      .catch((err) => {
        console.error('Error creando reserva:', err);
        alert('No se pudo crear la reserva');
      });
  };

  if (loading) {
    return (
      <div className={styles.reservasContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Cargando información de la reserva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reservasContainer}>
      <h1 className={styles.title}>Reservar Estacionamiento {parkingName ? `– ${parkingName}` : ''}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Parcela / Plaza:</label>
          <input type="text" value={plazaNumero || ''} readOnly />
        </div>
        {horarios && horarios.length > 0 && (
          <div className={styles.formGroup}>
            <label>Días disponibles del estacionamiento:</label>
            <input
              type="text"
              readOnly
              value={horarios
                .map(h => `${nombreDiaNumero(h.dia_semana)}: ${Array.isArray(h.franjas) ? h.franjas.map(f => `${toHHMM(f.apertura)}-${toHHMM(f.cierre)}`).join(', ') : ''}`)
                .join(' | ')
              }
            />
          </div>
        )}
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="apellido">Apellido:</label>
          <input
            type="text"
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
        </div>
        {vehiculoSeleccionado && (
          <div className={styles.formGroup}>
            <label>Vehículo seleccionado:</label>
            <input type="text" readOnly value={`${vehiculoSeleccionado.marca || ''} ${vehiculoSeleccionado.modelo || ''} · ${vehiculoSeleccionado.patente || ''} (${vehiculoSeleccionado.tipo_vehiculo || ''})`} />
          </div>
        )}

        {modalidades && modalidades.length > 0 && (
          <div className={styles.formGroup}>
            <label>Fecha/hora de la reserva:</label>
            <div className={styles.checkboxGroup}>
              {modalidades.map((m) => (
                <label key={m} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={modalidad === m}
                    onChange={() => setModalidad((prev) => (prev === m ? '' : m))}
                  />
                  <span>{LABELS[m] || m}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Inputs dependientes, debajo de modalidades */}
        {modalidad === 'hora' && (
          <>
            <div className={styles.formGroup}>
              <label>Fecha desde:</label>
              <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
              {fecha && (
                <p className={styles.helperText}>Día: {nombreDia(fecha)}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Hora desde:</label>
              {fecha && (
                <p className={styles.helperText}>Franjas: {(horariosPorDia.get(diaSemanaJS(fecha))||[]).map(f => `${toHHMM(f.apertura)}-${toHHMM(f.cierre)}`).join(', ') || 'Sin servicio'}</p>
              )}
              <input type="time" value={horaDesde} onChange={(e)=>setHoraDesde(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Hora hasta:</label>
              <input type="time" value={horaHasta} onChange={(e)=>setHoraHasta(e.target.value)} />
            </div>
            {errorHorario && <p className={styles.errorText}>{errorHorario}</p>}
          </>
        )}
        {modalidad === 'dia' && (
          <>
            <div className={styles.formGroup}>
              <label>Fecha inicio:</label>
              <input type="date" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)} />
            </div>
            {fechaDesde && (
              <p className={styles.helperText}>Día de inicio: {nombreDia(fechaDesde)}</p>
            )}
            <div className={styles.formGroup}>
              <label>Hora (retiro/entrega):</label>
              <input type="time" value={horaFija} onChange={(e)=>setHoraFija(e.target.value)} />
              {fechaDesde && (
                <p className={styles.helperText}>Franjas del día: {(horariosPorDia.get(diaSemanaJS(fechaDesde))||[]).map(f => `${toHHMM(f.apertura)}-${toHHMM(f.cierre)}`).join(', ') || 'Sin servicio'}</p>
              )}
              <p className={styles.helperText}>La reserva inicia y finaliza exactamente a esta hora.</p>
            </div>
            <div className={styles.formGroup}>
              <label>Cantidad (Días):</label>
              <input type="number" min={1} value={cantidad} onChange={(e)=>setCantidad(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Fecha fin (auto):</label>
              <input type="text" readOnly value={(function(){
                if (!fechaDesde || Number(cantidad)<1) return '';
                // Fin exclusivo: inicio + cantidad días
                const endExcl = addDays(fechaDesde, Math.max(1, Number(cantidad)));
                return toLocalDateStr(endExcl);
              })()} />
            </div>
            {errorHorario && <p className={styles.errorText}>{errorHorario}</p>}
          </>
        )}
        {['semana','mes','anio'].includes(modalidad) && (
          <>
            <div className={styles.formGroup}>
              <label>Fecha inicio:</label>
              <input type="date" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)} />
            </div>
            {fechaDesde && (
              <p className={styles.helperText}>Día de inicio: {nombreDia(fechaDesde)}</p>
            )}
            <div className={styles.formGroup}>
              <label>Hora (retiro/entrega):</label>
              <input type="time" value={horaFija} onChange={(e)=>setHoraFija(e.target.value)} />
              {fechaDesde && (
                <p className={styles.helperText}>Franjas del día: {(horariosPorDia.get(diaSemanaJS(fechaDesde))||[]).map(f => `${toHHMM(f.apertura)}-${toHHMM(f.cierre)}`).join(', ') || 'Sin servicio'}</p>
              )}
              <p className={styles.helperText}>La reserva inicia y finaliza exactamente a esta hora.</p>
            </div>
            <div className={styles.formGroup}>
              <label>Cantidad ({LABELS[modalidad]}):</label>
              <input type="number" min={1} value={cantidad} onChange={(e)=>setCantidad(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Fecha fin (auto):</label>
              <input type="text" readOnly value={(function(){
                if (!fechaDesde || Number(cantidad)<1) return '';
                const qty = Math.max(1, Number(cantidad||1));
                if (modalidad==='semana') {
                  const end = addDays(fechaDesde, 7*qty - 1);
                  return toLocalDateStr(end);
                }
                if (modalidad==='mes') {
                  const end = addMonths(fechaDesde, qty); end.setDate(end.getDate()-1);
                  return toLocalDateStr(end);
                }
                if (modalidad==='anio') {
                  const end = addYears(fechaDesde, qty); end.setDate(end.getDate()-1);
                  return toLocalDateStr(end);
                }
                return '';
              })()} />
            </div>
            {errorHorario && <p className={styles.errorText}>{errorHorario}</p>}
          </>
        )}

        <div className={styles.formGroup}>
          <label>Precio estimado:</label>
          <input type="text" readOnly value={precio != null ? `${moneda} ${precio}` : '—'} />
        </div>

        {Array.isArray(metodosPago) && metodosPago.length > 0 && (
          <div className={styles.formGroup}>
            <label>Método de pago:</label>
            <div className={styles.checkboxGroup}>
              {(metodosPago.filter(m => m !== 'efectivo')).map((mp) => (
                <label key={mp} className={styles.checkboxItem}>
                  <input
                    type="radio"
                    name="metodoPago"
                    checked={metodoPago === mp}
                    onChange={() => setMetodoPago(mp)}
                  />
                  <span>{METODO_PAGO_LABELS[mp] || toTitle(mp)}</span>
                </label>
              ))}
              {metodosPago.includes('efectivo') && (
                <label key="efectivo" className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={metodoPago === 'efectivo'}
                    onChange={() => setMetodoPago(metodoPago === 'efectivo' ? '' : 'efectivo')}
                  />
                  <span>{METODO_PAGO_LABELS.efectivo}</span>
                </label>
              )}
            </div>
            {!metodoPago && (
              <p className={styles.helperText}>Selecciona un método para continuar.</p>
            )}
            {metodoPago === 'efectivo' && (
              <div className={styles.paymentCardWrapper}>
                <div className={styles.paymentCard}>
                  <p className={styles.helperText} style={{ marginBottom: 8 }}>
                    Este estacionamiento también acepta pago en efectivo. ¿Querés utilizar este método de pago? Pagarás directamente en el lugar. Consultá tus reservas allí.
                  </p>
                  <div className={styles.paymentRow}>
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.providerLink}
                      title="Ver ubicación en Google Maps"
                    >
                      Ver ubicación (Google Maps)
                    </a>
                    <button
                      type="button"
                      className={styles.attachButton}
                      onClick={() => setShowTarifas(v => !v)}
                    >
                      {showTarifas ? 'Ocultar lista de precios' : 'Ver lista de precios'}
                    </button>
                  </div>
                  {showTarifas && (
                    <div style={{ marginTop: 8 }}>
                      {(tarifas || []).length === 0 ? (
                        <p className={styles.helperText}>Este espacio no tiene tarifas configuradas.</p>
                      ) : (
                        <div className={styles.pricesTableWrapper}>
                          <table className={styles.pricesTable}>
                            <thead>
                              <tr>
                                <th style={{ minWidth: 140 }}>Tipo de vehículo</th>
                                {WEEK_DAYS.map(d => (
                                  <th key={d}>{d}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(Array.from(new Set(tarifas.map(t => t.tipo_vehiculo)))).map(tv => {
                                // Elegimos la mejor tarifa por tipo: preferimos 'dia', si no 'hora', si no la primera encontrada
                                const tDia = tarifas.find(t => String(t.tipo_vehiculo) === String(tv) && String(t.modalidad).toLowerCase() === 'dia');
                                const tHora = tarifas.find(t => String(t.tipo_vehiculo) === String(tv) && String(t.modalidad).toLowerCase() === 'hora');
                                const tAny = tarifas.find(t => String(t.tipo_vehiculo) === String(tv));
                                const tarifa = tDia || tHora || tAny;
                                const valor = tarifa ? `${tarifa.moneda || 'ARS'} ${tarifa.precio}` : '—';
                                return (
                                  <tr key={tv}>
                                    <td className={styles.pricesRowHeader}>{tv}</td>
                                    {WEEK_DAYS.map(d => (
                                      <td key={d}>{valor}</td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {metodoPago === 'tarjeta' && (
              <div className={styles.formGroup}>
                {userCards.length > 0 ? (
                  <div className={styles.paymentCardWrapper}>
                    <div className={styles.paymentCard}>
                      {userCards.map((c) => (
                        <label key={c.id_cliente_metodo} className={styles.paymentRow} style={{ cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="selectedCard"
                            checked={selectedCard === c.id_cliente_metodo}
                            onChange={() => setSelectedCard(c.id_cliente_metodo)}
                            style={{ marginRight: 8 }}
                          />
                          <span className={styles.paymentKey} style={{ minWidth: 90 }}>
                            {c.detalle?.marca ? c.detalle.marca.toUpperCase() : 'TARJETA'}
                          </span>
                          <span className={styles.paymentValue} style={{ textAlign: 'left' }}>
                            •••• {c.detalle?.last4 || ''}
                          </span>
                          <span className={styles.paymentValue} style={{ maxWidth: 100 }}>
                            {c.detalle?.vencimiento || ''}
                          </span>
                          {/* sin etiqueta de predeterminada */}
                        </label>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => navigate('/profile')}
                          title="Agregar tarjeta"
                        >
                          + Agregar tarjeta
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.paymentCardWrapper}>
                    <div className={styles.paymentCard}>
                      <div className={styles.paymentRow}>
                        <span className={styles.helperText}>No tienes tarjetas guardadas.</span>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => navigate('/profile')}
                          title="Agregar tarjeta"
                        >
                          + Agregar tarjeta
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {metodoPago === 'transferencia' && (
              <div className={styles.formGroup}>
                {ownerPayMethods?.transferencia ? (
                  <div className={styles.paymentCardWrapper}>
                     <div className={styles.paymentCard}>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>Banco</span>
                        <span className={styles.paymentValue}>{ownerPayMethods.transferencia.banco || '—'}</span>
                      </div>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>Titular</span>
                        <span className={styles.paymentValue}>{ownerPayMethods.transferencia.titular || '—'}</span>
                      </div>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>Alias</span>
                        <span className={styles.paymentValue}>{ownerPayMethods.transferencia.alias || '—'}</span>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(ownerPayMethods.transferencia.alias)}
                          title="Copiar Alias"
                        >
                          <svg className={styles.copyIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        </button>
                      </div>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>CBU</span>
                        <span className={styles.paymentValue}>{ownerPayMethods.transferencia.cbu || '—'}</span>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(ownerPayMethods.transferencia.cbu)}
                          title="Copiar CBU"
                        >
                          <svg className={styles.copyIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        </button>
                      </div>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>CVU</span>
                        <span className={styles.paymentValue}>{ownerPayMethods.transferencia.cvu || '—'}</span>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(ownerPayMethods.transferencia.cvu)}
                          title="Copiar CVU"
                        >
                          <svg className={styles.copyIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        </button>
                      </div>
                      <div className={`${styles.paymentRow} ${styles.paymentRowCenter}`}>
                        <button
                          type="button"
                          className={styles.attachButton}
                          onClick={() => transferFileRef.current?.click()}
                        >
                          + Adjuntar comprobante
                        </button>
                        <input
                          type="file"
                          ref={transferFileRef}
                          style={{ display: 'none' }}
                          accept="image/*,application/pdf"
                          onChange={(e) => setTransferFileName(e.target.files?.[0]?.name || '')}
                        />
                        {transferFileName && (
                          <span className={styles.helperText} style={{ marginLeft: 8 }}>
                            {transferFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={styles.helperText}>El propietario no tiene una transferencia predeterminada configurada para este espacio.</p>
                )}
              </div>
            )}
            {metodoPago === 'billetera' && (
              <div className={styles.formGroup}>
                {ownerPayMethods?.billetera ? (
                  <div className={styles.paymentCardWrapper}>
                    <div className={styles.paymentCard}>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>Proveedor</span>
                        {(function(){
                          const prov = ownerPayMethods.billetera.proveedor || '—';
                          const url = getProviderUrl(prov);
                          if (url) {
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.providerLink}
                                onClick={(e) => handleProviderClick(e, prov)}
                              >
                                {prov}
                              </a>
                            );
                          }
                          return <span className={styles.paymentValue}>{prov}</span>;
                        })()}
                      </div>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentKey}>Alias</span>
                        <span className={styles.paymentValue}>{ownerPayMethods.billetera.handle || '—'}</span>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(ownerPayMethods.billetera.handle)}
                          title="Copiar Alias"
                        >
                          <svg className={styles.copyIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        </button>
                      </div>
                      <div className={`${styles.paymentRow} ${styles.paymentRowCenter}`}>
                        <button
                          type="button"
                          className={styles.attachButton}
                          onClick={() => walletFileRef.current?.click()}
                        >
                          + Adjuntar comprobante
                        </button>
                        <input
                          type="file"
                          ref={walletFileRef}
                          style={{ display: 'none' }}
                          accept="image/*,application/pdf"
                          onChange={(e) => setWalletFileName(e.target.files?.[0]?.name || '')}
                        />
                        {walletFileName && (
                          <span className={styles.helperText} style={{ marginLeft: 8 }}>
                            {walletFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={styles.helperText}>El propietario no tiene una billetera predeterminada configurada para este espacio.</p>
                )}
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!modalidad || !!errorHorario || (Array.isArray(metodosPago) && metodosPago.length > 0 && !metodoPago)}
        >
          Reservar
        </button>
      </form>
    </div>
  );
};

export default Reservas;