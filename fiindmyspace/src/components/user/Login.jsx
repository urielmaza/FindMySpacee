import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import styles from './Login.module.css';
import { setUserSession } from '../../utils/auth';
import logo from '../../assets/logofindmyspaceB.png'; // Importa la imagen

const API_BASE = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('success') === 'true') {
      setMessage('Inicio de sesión con Google exitoso.');
    }
  }, []);

  useEffect(() => {
    /* Inicializar Google Sign-In */
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      cancel_on_tap_outside: false, // Reduce algunos warnings
      callback: async (response) => {
        
        try {
          // Enviar el token al backend para verificarlo
          const res = await fetch(`${API_BASE}/api/google/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
          });
          
          const data = await res.json();
          
          if (res.ok) {
            setMessage('Login con Google exitoso');
            // Guardar token si viene para futuras llamadas autenticadas
            if (data.token) {
              localStorage.setItem('token', data.token);
            }
            const sessionData = {
              id_cliente: data.user.id_cliente,
              email: data.user.email,
              nombre: data.user.nombre || undefined,
              apellido: data.user.apellido || undefined,
            };
            setUserSession(sessionData);
            setTimeout(() => navigate('/home-user'), 1000);
          } else {
            setError(data.error || 'Error en login con Google');
          }
        } catch (err) {
          console.error('❌ Error en login con Google:', err.message);
          setError('Error de conexión con el servidor');
        }
      },
    });

    /* Renderizar el botón de Google Sign-In */
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'), 
      { 
        theme: 'outline', 
        size: 'large',
        type: 'standard'
      }
    );

    // Prompt automático deshabilitado para evitar conflictos
    // window.google.accounts.id.prompt();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pw })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        if (data.user && data.user.id_cliente) {
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          const sessionData = {
            id_cliente: data.user.id_cliente,
            email: data.user.email
          };
          setUserSession(sessionData);
        } else {
          setError('No se pudo obtener el id_cliente del usuario.');
          setLoading(false);
          return;
        }
        setEmail('');
        setPw('');
        setTimeout(() => navigate('/home-user'), 1000);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/google`;
  };

  return (
    <div className={`${styles.parentContainer} ${styles.loginBackground}`}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Logo centrado */}
        <div className={styles.logoContainer}>
          <img src={logo} alt="FindMySpace Logo" className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        </div>

        {/* Texto debajo del logo */}
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Iniciar Sesión</h2>
          <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>
        </div>
        
        <div className={styles['flex-row']}>
          <div id="google-signin-btn"></div>
        </div>

         {/* Línea con círculo */}
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
            placeholder=" Ingresa tu Email"
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
            placeholder=" Ingresa tu contraseña"
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

        <div className={styles['flex-row']}>
          <span className={styles.span}>Olvidaste tu contraseña?</span>
        </div>

        <button className={styles['button-submit']} type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>

        <p className={styles.p}>
          ¿No tienes una cuenta?{' '}
          <button
            onClick={() => navigate('/register')}
            className={`${styles.bannerButton} ${styles.register}`}
            style={{
              background: 'none',
              border: 'none',
              color: '#2d79f3',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'inherit',
              fontWeight: '500',
            }}
          >
            Regístrate
          </button>
        </p>
       

        
        {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}
       
      </form>
    </div>
  );
};

export default Login;
