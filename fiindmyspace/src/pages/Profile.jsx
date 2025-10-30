import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.Module.css';
import { getUserSession, setUserSession } from '../utils/auth';
import apiClient from '../apiClient';

const Profile = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [idCliente, setIdCliente] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showGoHome, setShowGoHome] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [providerGoogle, setProviderGoogle] = useState(false);
  const [tipoCliente, setTipoCliente] = useState('cliente');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [editPwMode, setEditPwMode] = useState(false);

  // Métodos de pago
  const [pmAvailableTypes, setPmAvailableTypes] = useState([]); // ['tarjeta','transferencia','billetera']
  const [pmItems, setPmItems] = useState([]); // lista de métodos guardados
  // Formularios
  const [cardForm, setCardForm] = useState({ marca: '', last4: '', exp_mes: '', exp_anio: '', titular: '' });
  // Campo local para ingresar número de tarjeta sólo en el cliente (no se envía al servidor)
  const [cardNumber, setCardNumber] = useState('');
  const [trfForm, setTrfForm] = useState({ alias: '', cbu: '', cvu: '', banco: '', titular: '' });
  const [walForm, setWalForm] = useState({ proveedor: '', handle: '' });
  const [pmSaving, setPmSaving] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.id_cliente) setIdCliente(session.id_cliente);
      if (session.nombre) setNombre(session.nombre);
      if (session.apellido) setApellido(session.apellido);
      if (session.email) setEmail(session.email);
    }
    (async () => {
      try {
        const { data } = await apiClient.get('/profile');
        if (data && data.success && data.user) {
          setHasPassword(!!data.user.hasPassword);
          setProviderGoogle(!!data.user.providerGoogle);
          setEditPwMode(false);
          if (data.user.nombre) setNombre(data.user.nombre);
          if (data.user.apellido) setApellido(data.user.apellido);
          if (data.user.email) setEmail(data.user.email);
          if (data.user.tipo_cliente) setTipoCliente(data.user.tipo_cliente);
        }
      } catch (e) {
        // Si falla (sin token), mantenemos los valores de sesión
      }
      try {
        const [typesRes, listRes] = await Promise.all([
          apiClient.get('/payment-methods/available-types'),
          apiClient.get('/payment-methods')
        ]);
        if (typesRes?.data?.success) setPmAvailableTypes(typesRes.data.tipos || []);
        if (listRes?.data?.success) setPmItems(listRes.data.items || []);
      } catch (e) {
        // opcional: silenciar
      }
    })();
  }, []);

  // Detectar marca de tarjeta en base al BIN/prefijo
  const detectCardBrand = (digits) => {
    // digits: sólo números
    if (!digits) return '';
    // Reglas básicas de detección
    if (/^4\d{0,}$/.test(digits)) return 'visa';
    // Mastercard: 51-55, 2221-2720
    if (/^(5[1-5]|22[2-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d*$/.test(digits)) return 'mastercard';
    if (/^3[47]\d{0,}$/.test(digits)) return 'amex';
    // Discover: 6011, 65, 644-649
    if (/^(6011|65|64[4-9])\d*$/.test(digits)) return 'discover';
    // Diners: 300-305, 36, 38-39
    if (/^(30[0-5]|36|3[89])\d*$/.test(digits)) return 'diners';
    // JCB: 3528-3589
    if (/^35(2[89]|[3-8])\d*$/.test(digits)) return 'jcb';
    // Maestro (opcional): 50, 56-69
    if (/^(50|5[6-9]|6[0-9])\d*$/.test(digits)) return 'maestro';
    return '';
  };

  const formatCardNumber = (digits, brand) => {
    // Formatear con espacios; para Amex 4-6-5, resto 4-4-4-4
    const parts = [];
    if (brand === 'amex') {
      parts.push(digits.slice(0, 4));
      if (digits.length > 4) parts.push(digits.slice(4, 10));
      if (digits.length > 10) parts.push(digits.slice(10, 15));
      return parts.filter(Boolean).join(' ');
    }
    for (let i = 0; i < digits.length; i += 4) parts.push(digits.slice(i, i + 4));
    return parts.filter(Boolean).join(' ');
  };

  const handleCardNumberChange = (val) => {
    const digits = String(val).replace(/\D/g, '').slice(0, 19);
    const brand = detectCardBrand(digits);
    setCardNumber(formatCardNumber(digits, brand));
    // Actualizamos marca y últimos 4 en el form (sin guardar el PAN)
    setCardForm((v) => ({
      ...v,
      marca: brand || '',
      last4: digits.slice(-4) || ''
    }));
  };

  const handleGuardarDatos = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
  // No enviamos email porque no es editable
  const payload = { id_cliente: idCliente, nombre, apellido };
  const { data } = await apiClient.put('/profile', { ...payload, tipo_cliente: tipoCliente });
      if (data && data.success) {
        setMessage('Perfil actualizado correctamente');
        const session = getUserSession() || {};
        const updated = { ...session, nombre, apellido, email };
        setUserSession(updated);
        setShowGoHome(true);
      } else {
        setError(data?.error || 'No se pudo actualizar el perfil');
      }
    } catch (e) {
      if (e?.response?.status === 409) setError('El email ya está en uso');
      else if (e?.response?.data?.error) setError(e.response.data.error);
      else setError('Error de conexión con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarPassword = async () => {
    setSavingPw(true);
    setMessage('');
    setError('');
    try {
      const payload = { currentPw: hasPassword ? currentPw : undefined, newPw };
      const { data } = await apiClient.put('/profile/password', payload);
      if (data && data.success) {
        setMessage(data.message || (hasPassword ? 'Contraseña actualizada' : 'Contraseña establecida'));
        setHasPassword(true);
        setCurrentPw('');
        setNewPw('');
  // Salir de modo edición de contraseña (los campos se muestran de nuevo tal como estaban)
  setEditPwMode(false);
      } else {
        setError(data?.error || 'No se pudo actualizar la contraseña');
      }
    } catch (e) {
      if (e?.response?.data?.error) setError(e.response.data.error);
      else setError('Error de conexión con el servidor');
    } finally {
      setSavingPw(false);
    }
  };

  const enterEditPasswordMode = () => {
    // Entrar al modo de edición de contraseña: ocultar campos de perfil pero no borrar valores
    setMessage('');
    setError('');
    setEditPwMode(true);
  };

  const cancelEditPasswordMode = () => {
    // Salir del modo edición: mostrar nuevamente los campos y limpiar inputs de contraseña
    setEditPwMode(false);
    setCurrentPw('');
    setNewPw('');
  };

  // Métodos de pago: helpers
  const reloadPaymentData = async () => {
    try {
      const [typesRes, listRes] = await Promise.all([
        apiClient.get('/payment-methods/available-types'),
        apiClient.get('/payment-methods')
      ]);
      if (typesRes?.data?.success) setPmAvailableTypes(typesRes.data.tipos || []);
      if (listRes?.data?.success) setPmItems(listRes.data.items || []);
    } catch (e) {}
  };

  const addPaymentMethod = async (clave, detalle, es_default = false) => {
    setPmSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await apiClient.post('/payment-methods', { clave, detalle, es_default });
      if (data && data.success) {
        await reloadPaymentData();
        setMessage('Método de pago agregado');
  if (clave === 'tarjeta') { setCardForm({ marca: '', last4: '', exp_mes: '', exp_anio: '', titular: '' }); setCardNumber(''); }
        if (clave === 'transferencia') setTrfForm({ alias: '', cbu: '', cvu: '', banco: '', titular: '' });
        if (clave === 'billetera') setWalForm({ proveedor: '', handle: '' });
      } else {
        setError(data?.error || 'No se pudo agregar el método');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al agregar método');
    } finally {
      setPmSaving(false);
    }
  };

  const removePaymentMethod = async (id) => {
    setPmSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await apiClient.delete(`/payment-methods/${id}`);
      if (data && data.success) {
        await reloadPaymentData();
        setMessage('Método de pago eliminado');
      } else {
        setError(data?.error || 'No se pudo eliminar');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al eliminar');
    } finally {
      setPmSaving(false);
    }
  };

  const setDefaultPaymentMethod = async (id) => {
    setPmSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await apiClient.post(`/payment-methods/${id}/default`);
      if (data && data.success) {
        await reloadPaymentData();
        setMessage('Predeterminado actualizado');
      } else {
        setError(data?.error || 'No se pudo actualizar predeterminado');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar predeterminado');
    } finally {
      setPmSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="profileFormCard">
        <div className="profileHeader">
          <button
            type="button"
            className="profileAvatarButton"
            aria-label="Ir a inicio"
            title="Inicio"
            onClick={() => navigate('/home-user')}
          >
            {(email && email[0] ? email[0] : 'U').toUpperCase()}
          </button>
          <h1 className="profileFormTitle" style={{ margin: 0 }}>Perfil</h1>
        </div>
        <form>
          {/* Datos básicos (ocultos cuando se cambia contraseña) */}
          {!editPwMode && (
            <>
              <div className="profileFormRow">
                <div className="profileFormCol">
                  <label className="profileFormLabel" htmlFor="nombre">Nombre</label>
                  <input id="nombre" type="text" className="profileFormInput" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div className="profileFormCol">
                  <label className="profileFormLabel" htmlFor="apellido">Apellido</label>
                  <input id="apellido" type="text" className="profileFormInput" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} />
                </div>
              </div>
              <div className="profileFormGroup">
                <label className="profileFormLabel" htmlFor="gmail">Gmail</label>
                <input id="gmail" type="email" className="profileFormInput" placeholder="correo@gmail.com" value={email} readOnly />
              </div>
            </>
          )}

          {/* Contraseña integrada arriba */}
          <div className="profileFormGroup">
            <label className="profileFormLabel">Contraseña</label>
            {hasPassword ? (
              editPwMode ? (
                <>
                  <input
                    type="password"
                    className="profileFormInput"
                    placeholder="Contraseña actual"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                  />
                  <input
                    type="password"
                    className="profileFormInput"
                    placeholder="Nueva contraseña"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="profileFormButton" onClick={handleGuardarPassword} disabled={savingPw || !newPw}>
                      {savingPw ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                    <button type="button" className="profileFormButton" style={{ backgroundColor: '#999' }} onClick={cancelEditPasswordMode}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="password"
                    className="profileFormInput"
                    value="********"
                    readOnly
                  />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={enterEditPasswordMode}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') enterEditPasswordMode(); }}
                    style={{ color: '#6c43ff', cursor: 'pointer', fontSize: 14, marginTop: 8, display: 'inline-block' }}
                  >
                    ¿Desea cambiar contraseña?
                  </span>
                </>
              )
            ) : (
              <>
                <input
                  type="password"
                  className="profileFormInput"
                  placeholder="Definir contraseña"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                />
                <button type="button" className="profileFormButton" onClick={handleGuardarPassword} disabled={savingPw || !newPw}>
                  {savingPw ? 'Guardando...' : 'Establecer contraseña'}
                </button>
                {providerGoogle && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                    Esta cuenta se registró con Google. Puedes definir una contraseña para iniciar sesión también con email y contraseña.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tipo de usuario */}
          {!editPwMode && (
            <div className="profileFormGroup">
              <label className="profileFormLabel" htmlFor="tipoUsuario">Tipo de usuario</label>
              <select id="tipoUsuario" className="profileFormInput" value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
                <option value="cliente">Cliente</option>
                <option value="propietario">Propietario</option>
              </select>
            </div>
          )}

          {!editPwMode && (
            <button type="button" className="profileFormButton" onClick={handleGuardarDatos} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
          {showGoHome && (
            <button
              type="button"
              className="profileFormButton"
              style={{ marginTop: 12, backgroundColor: '#10b981' }}
              onClick={() => navigate('/home-user')}
            >
              Ir a Home
            </button>
          )}
          {message && <div style={{ color: 'green', marginTop: 12 }}>{message}</div>}
          
          {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
        </form>
      </div>
      {/* Métodos de pago */}
      <div className="profileFormCard" style={{ marginTop: 16 }}>
        <h2 className="profileFormTitle" style={{ marginBottom: 8 }}>Métodos de pago</h2>
        {pmAvailableTypes.length === 0 ? (
          <div className="profileFormGroup" style={{ color: '#666' }}>
            No hay tipos disponibles para administrar desde el perfil.
          </div>
        ) : (
          <>
            {/* Listado */}
            <div className="profileFormGroup">
              {pmItems.length === 0 ? (
                <div style={{ color: '#666' }}>Aún no agregaste métodos.</div>
              ) : (
                pmItems.map(it => (
                  <div key={it.id_cliente_metodo} style={{ border: '1px solid #e1e8ed', borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {it.clave === 'tarjeta' && `Tarjeta ${it.detalle?.marca || ''} •••• ${it.detalle?.last4 || ''}`}
                        {it.clave === 'transferencia' && `Transferencia ${it.detalle?.alias || it.detalle?.banco || ''}`}
                        {it.clave === 'billetera' && `Billetera ${it.detalle?.proveedor || ''} (${it.detalle?.handle || ''})`}
                      </div>
                      <div style={{ fontSize: 12, color: '#555' }}>
                        {it.es_default ? 'Predeterminado' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!it.es_default && (
                        <button type="button" className="profileFormButton" style={{ width: 'auto', padding: '8px 10px' }} onClick={() => setDefaultPaymentMethod(it.id_cliente_metodo)} disabled={pmSaving}>
                          Predeterminar
                        </button>
                      )}
                      <button type="button" className="profileFormButton" style={{ width: 'auto', padding: '8px 10px', background: '#b91c1c' }} onClick={() => removePaymentMethod(it.id_cliente_metodo)} disabled={pmSaving}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formularios condicionales según tipos disponibles */}
            {pmAvailableTypes.includes('tarjeta') && (
              <div className="profileFormGroup" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                <h3 className="profileFormLabel" style={{ marginBottom: 4 }}>Agregar tarjeta</h3>
                <div className="profileFormGroup">
                  <label className="profileFormLabel">Número de tarjeta</label>
                  <input
                    className="profileFormInput"
                    value={cardNumber}
                    onChange={(e)=>handleCardNumberChange(e.target.value)}
                    inputMode="numeric"
                    placeholder="#### #### #### ####"
                  />
                  <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                    Detectamos la marca automáticamente en tu navegador. No almacenamos el número completo.
                  </div>
                </div>
                <div className="profileFormRow">
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Marca</label>
                    <input className="profileFormInput" value={cardForm.marca} readOnly={cardNumber.replace(/\D/g,'').length>0} onChange={e=>setCardForm(v=>({...v, marca:e.target.value}))} placeholder="visa, mastercard" />
                  </div>
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Últimos 4</label>
                    <input className="profileFormInput" value={cardForm.last4} readOnly={cardNumber.replace(/\D/g,'').length>0} onChange={e=>setCardForm(v=>({...v, last4:e.target.value.replace(/\D/g,'').slice(0,4)}))} placeholder="1234" />
                  </div>
                </div>
                <div className="profileFormRow">
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Mes venc.</label>
                    <input className="profileFormInput" type="number" min={1} max={12} value={cardForm.exp_mes} onChange={e=>setCardForm(v=>({...v, exp_mes:e.target.value}))} />
                  </div>
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Año venc.</label>
                    <input className="profileFormInput" type="number" min={new Date().getFullYear()} value={cardForm.exp_anio} onChange={e=>setCardForm(v=>({...v, exp_anio:e.target.value}))} />
                  </div>
                </div>
                <div className="profileFormGroup">
                  <label className="profileFormLabel">Titular</label>
                  <input className="profileFormInput" value={cardForm.titular} onChange={e=>setCardForm(v=>({...v, titular:e.target.value}))} placeholder="Nombre del titular" />
                </div>
                <button type="button" className="profileFormButton" onClick={() => addPaymentMethod('tarjeta', cardForm)} disabled={pmSaving || !cardForm.last4 || !cardForm.marca}>
                  {pmSaving ? 'Guardando...' : 'Agregar tarjeta'}
                </button>
              </div>
            )}

            {pmAvailableTypes.includes('transferencia') && (
              <div className="profileFormGroup" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                <h3 className="profileFormLabel" style={{ marginBottom: 4 }}>Agregar cuenta (transferencia)</h3>
                <div className="profileFormRow">
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Alias</label>
                    <input className="profileFormInput" value={trfForm.alias} onChange={e=>setTrfForm(v=>({...v, alias:e.target.value}))} placeholder="mi.alias.mp" />
                  </div>
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Banco</label>
                    <input className="profileFormInput" value={trfForm.banco} onChange={e=>setTrfForm(v=>({...v, banco:e.target.value}))} placeholder="Banco" />
                  </div>
                </div>
                <div className="profileFormRow">
                  <div className="profileFormCol">
                    <label className="profileFormLabel">CBU</label>
                    <input className="profileFormInput" value={trfForm.cbu} onChange={e=>setTrfForm(v=>({...v, cbu:e.target.value.replace(/\D/g,'').slice(0,22)}))} placeholder="22 dígitos" />
                  </div>
                  <div className="profileFormCol">
                    <label className="profileFormLabel">CVU</label>
                    <input className="profileFormInput" value={trfForm.cvu} onChange={e=>setTrfForm(v=>({...v, cvu:e.target.value.replace(/\D/g,'').slice(0,22)}))} placeholder="22 dígitos" />
                  </div>
                </div>
                <div className="profileFormGroup">
                  <label className="profileFormLabel">Titular</label>
                  <input className="profileFormInput" value={trfForm.titular} onChange={e=>setTrfForm(v=>({...v, titular:e.target.value}))} placeholder="Nombre del titular" />
                </div>
                <button type="button" className="profileFormButton" onClick={() => addPaymentMethod('transferencia', trfForm)} disabled={pmSaving || (!trfForm.alias && !trfForm.cbu && !trfForm.cvu)}>
                  {pmSaving ? 'Guardando...' : 'Agregar cuenta'}
                </button>
              </div>
            )}

            {pmAvailableTypes.includes('billetera') && (
              <div className="profileFormGroup" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                <h3 className="profileFormLabel" style={{ marginBottom: 4 }}>Agregar billetera</h3>
                <div className="profileFormRow">
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Proveedor</label>
                    <input className="profileFormInput" value={walForm.proveedor} onChange={e=>setWalForm(v=>({...v, proveedor:e.target.value}))} placeholder="MercadoPago, Ualá..." />
                  </div>
                  <div className="profileFormCol">
                    <label className="profileFormLabel">Handle</label>
                    <input className="profileFormInput" value={walForm.handle} onChange={e=>setWalForm(v=>({...v, handle:e.target.value}))} placeholder="Alias/usuario" />
                  </div>
                </div>
                <button type="button" className="profileFormButton" onClick={() => addPaymentMethod('billetera', walForm)} disabled={pmSaving || !walForm.proveedor || !walForm.handle}>
                  {pmSaving ? 'Guardando...' : 'Agregar billetera'}
                </button>
              </div>
            )}
          </>
        )}
        {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
        {message && <div style={{ color: 'green', marginTop: 8 }}>{message}</div>}
      </div>
    </div>
  );
};

export default Profile;
