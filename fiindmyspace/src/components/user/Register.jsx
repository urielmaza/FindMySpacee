import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from './Register.module.css';
import logo from '../../assets/logofindmyspaceB.png';

const API_BASE = import.meta.env.VITE_API_URL;

const Register = () => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    /* Inicializar Google Sign-In para registro */
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      cancel_on_tap_outside: false, // Reduce algunos warnings
      callback: async (response) => {
        console.log('Credenciales de Google para registro:', response);
        
        try {
          setLoading(true);
          setError('');
          setMessage('');
          
          // Enviar el token al backend para registrar el usuario
          const res = await fetch(`${API_BASE}/api/google/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
          });
          
          const data = await res.json();
          
          if (res.ok) {
            setMessage('¡Registro con Google exitoso! Redirigiendo al login...');
            setTimeout(() => navigate('/login?success=true'), 2000);
          } else {
            setError(data.error || 'Error en registro con Google');
          }
        } catch (err) {
          console.error('Error procesando registro de Google:', err);
          setError('Error de conexión con el servidor');
        } finally {
          setLoading(false);
        }
      },
    });

    /* Renderizar el botón de Google Sign-In */
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { 
        theme: 'outline', 
        size: 'large',
        type: 'standard',
        text: 'signup_with'
      }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw !== confirmPw) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pw })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setEmail('');
        setPw('');
        setConfirmPw('');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError(data.error || 'Error al registrar');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className={`${styles.parentContainer} ${styles.registerBackground}`}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Logo centrado */}
        <div className={styles.logoContainer}>
          <img src={logo} alt="FindMySpace Logo" className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        </div>

        {/* Texto debajo del logo */}
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Crear Cuenta</h2>
          <p className={styles.subtitle}>Únete a nuestra plataforma de estacionamiento</p>
        </div>

        <div className={styles['flex-row']}>
          <div id="google-signin-btn"></div>
        </div>

        <div className={styles.lineContainer}>
          <hr className={styles.line} />
          <div className={styles.circle}></div>
          <hr className={styles.line} />
        </div>

        <div className={styles['flex-column']}>
          <label>Email</label>
        </div>
        <div className={styles.inputForm}>
          <FontAwesomeIcon icon={faEnvelope} size="lg" />
          <input
            type="email"
            className={styles.input}
            placeholder="Ingresa tu Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles['flex-column']}>
          <label>Contraseña</label>
        </div>
        <div className={styles.inputForm}>
          <FontAwesomeIcon icon={faLock} size="lg" />
          <input
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="Ingresa tu contraseña"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          <FontAwesomeIcon
            icon={showPassword ? faEyeSlash : faEye}
            size="lg"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: 'pointer', marginRight: '10px' }}
          />
        </div>

        <div className={styles['flex-column']}>
          <label>Confirmar Contraseña</label>
        </div>
        <div className={styles.inputForm}>
          <FontAwesomeIcon icon={faLock} size="lg" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="Confirma tu contraseña"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
          />
          <FontAwesomeIcon
            icon={showConfirmPassword ? faEyeSlash : faEye}
            size="lg"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ cursor: 'pointer', marginRight: '10px' }}
          />
        </div>

        <div className={styles['flex-row']}>
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="terms" className={styles.span}>
            Acepto los <span style={{ color: '#2d79f3' }}>términos y condiciones</span>
          </label>
        </div>

        <button className={styles['button-submit']} type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>

        {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
};

export default Register;
