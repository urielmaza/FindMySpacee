import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../components/user/Login.module.css';
import apiClient from '../apiClient';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const location = useLocation();

  useEffect(() => {
    // Primero intentar con React Router (funciona con HashRouter)
    const params = new URLSearchParams(location.search);
    let t = params.get('token');
    // Fallback: si viene dentro del hash (por si el entorno no lo parsea)
    if (!t && typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const idx = hash.indexOf('?');
      if (idx !== -1) {
        const qp = new URLSearchParams(hash.substring(idx));
        t = qp.get('token');
      }
    }
    if (t) setToken(t);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!token) {
      setError('Falta el token. Revisa el enlace recibido.');
      return;
    }
    if (pw !== confirmPw) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (pw.length < 8 || pw.length > 25) {
      setError('La contraseña debe tener entre 8 y 25 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/reset-password', { token, newPw: pw });
      if (data && data.success) {
        setMessage('Contraseña restablecida correctamente. Redirigiendo al login...');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setError(data.error || 'No se pudo restablecer la contraseña');
      }
    } catch (e) {
      setError('No se pudo restablecer la contraseña. Verifica que el enlace no esté vencido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.parentContainer} ${styles.loginBackground}`}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Restablecer contraseña</h2>
          <p className={styles.subtitle}>Ingresa tu nueva contraseña</p>
        </div>

        <div className={styles['flex-column']}>
          <label>Nueva contraseña</label>
        </div>
        <div className={styles.inputForm}>
          <input
            type="password"
            className={styles.input}
            placeholder="Nueva contraseña (8-25)"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            minLength={8}
            maxLength={25}
            required
          />
        </div>

        <div className={styles['flex-column']}>
          <label>Confirmar contraseña</label>
        </div>
        <div className={styles.inputForm}>
          <input
            type="password"
            className={styles.input}
            placeholder="Confirmar contraseña"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            minLength={8}
            maxLength={25}
            required
          />
        </div>

        <button className={styles['button-submit']} type="submit" disabled={loading}>
          {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
        </button>

        {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
};

export default ResetPassword;
