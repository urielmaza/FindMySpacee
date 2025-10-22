import React, { useState } from 'react';
import styles from '../components/user/Login.module.css';
import apiClient from '../apiClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const { data } = await apiClient.post('/forgot-password', { email });
      if (data && data.success) {
        setMessage('Si el email existe, recibirás un enlace para restablecer la contraseña.');
      } else {
        setMessage('Si el email existe, recibirás un enlace para restablecer la contraseña.');
      }
    } catch (e) {
      setError('No se pudo enviar el email. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.parentContainer} ${styles.loginBackground}`}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Recuperar contraseña</h2>
          <p className={styles.subtitle}>Ingresa tu email y te enviaremos instrucciones</p>
        </div>

        <div className={styles['flex-column']}>
          <label>Email</label>
        </div>
        <div className={styles.inputForm}>
          <input
            type="email"
            className={styles.input}
            placeholder="Ingresa tu Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button className={styles['button-submit']} type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>

        {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
};

export default ForgotPassword;
