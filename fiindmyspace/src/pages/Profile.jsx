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
    })();
  }, []);

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
    </div>
  );
};

export default Profile;
