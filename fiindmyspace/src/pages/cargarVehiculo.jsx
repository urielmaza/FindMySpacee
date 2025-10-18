import React, { useEffect, useState } from 'react';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './cargarVehiculo.module.css';

const CargarVehiculo = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    patente: '',
    tipo_vehiculo: '',
  });
  const [profileData, setProfileData] = useState({
    nombre: '',
    email: '',
    tipo_usuario: '',
  });
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' o 'error'
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    // Obtener datos de la sesión del usuario
    const userSession = getUserSession();
    if (userSession) {
      setUserEmail(userSession.email);

      // Llamada a la API para obtener datos del usuario
      const fetchUserData = async () => {
        try {
          const response = await apiClient.get(`/usuarios/${userSession.id_cliente}`);
          if (response.data.success) {
            const { nombre, email, tipo_usuario } = response.data.data;
            setProfileData({ nombre, email, tipo_usuario });
          } else {
            console.error('Error al obtener datos del usuario:', response.data);
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
        }
      };

      fetchUserData();
    }

    // Llamada a la API para obtener las marcas
    const fetchMarcas = async () => {
      try {
        const response = await apiClient.get('/marcas/all');
        if (response.data.success && response.data.data) {
          setMarcas(response.data.data);
        } else {
          console.error('Estructura de respuesta inesperada:', response.data);
          setMarcas([]); // Array vacío como fallback
        }
      } catch (error) {
        console.error('Error al obtener las marcas:', error);
        setMarcas([]); // Array vacío en caso de error
      }
    };

    fetchMarcas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const userSession = getUserSession();
      const id_cliente = userSession ? userSession.id_cliente : null;

      if (!id_cliente) {
        setMessage('No se pudo obtener la sesión del usuario.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      if (!formData.marca || !formData.modelo || !formData.patente || !formData.tipo_vehiculo) {
        setMessage('Todos los campos son obligatorios.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      const response = await apiClient.post('/vehiculos', {
        ...formData,
        id_cliente,
      });

      if (response.status === 201) {
        setMessage('¡Vehículo cargado exitosamente!');
        setMessageType('success');
        setFormData({ marca: '', modelo: '', patente: '', tipo_vehiculo: '' });
      } else {
        setMessage('Error al cargar el vehículo');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      setMessage('Error interno del servidor');
      setMessageType('error');
    }

    setLoading(false);
  };

  const toggleCard = (card) => {
    setActiveCard(activeCard === card ? null : card);
  };

  return (
    <>
      <BannerUser onMenuToggle={setIsMenuOpen} />
      <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
        <div className={styles.contentContainer}>
          <h1 className={styles.pageTitle}>Cargar Vehículo</h1>

          <div className={styles.formCard}>
            {userEmail && (
              <div className={styles.welcomeMessage}>
                🚗 Hola {userEmail}, agrega un nuevo vehículo a tu cuenta
              </div>
            )}

            {/* Card 1: Mi Perfil */}
            <div className={styles.card}>
              <h2 onClick={() => toggleCard('perfil')} className={styles.cardTitle}>Mi Perfil</h2>
              {activeCard === 'perfil' && (
                <div className={styles.cardContent}>
                  <form>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Nombre:</label>
                      <input
                        type="text"
                        name="nombre"
                        value={profileData.nombre}
                        onChange={handleProfileChange}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Email:</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Tipo de Usuario:</label>
                      <select
                        name="tipo_usuario"
                        value={profileData.tipo_usuario}
                        onChange={handleProfileChange}
                        className={styles.formSelect}
                      >
                        <option value="">Seleccione un tipo</option>
                        <option value="1">Propietario</option>
                        <option value="2">Cliente</option>
                      </select>
                    </div>
                    <button type="submit" className={styles.submitButton}>
                      Guardar Perfil
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Card 2: Cargar Vehículo */}
            <div className={styles.card}>
              <h2 onClick={() => toggleCard('vehiculo')} className={styles.cardTitle}>Cargar Vehículo</h2>
              {activeCard === 'vehiculo' && (
                <div className={styles.cardContent}>
                  <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                      <label htmlFor="marca" className={styles.formLabel}>Marca:</label>
                      <select
                        id="marca"
                        name="marca"
                        value={formData.marca}
                        onChange={handleInputChange}
                        className={styles.formSelect}
                        required
                      >
                        <option value="">Seleccione una marca</option>
                        {Array.isArray(marcas) && marcas.length > 0 ? (
                          marcas.map((marca) => (
                            <option key={marca.id_marca || marca.marca} value={marca.marca}>
                              {marca.marca}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No hay marcas disponibles</option>
                        )}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="modelo" className={styles.formLabel}>Modelo:</label>
                      <input
                        type="text"
                        id="modelo"
                        name="modelo"
                        value={formData.modelo}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="Ej: Corolla, Civic, etc."
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="patente" className={styles.formLabel}>Patente:</label>
                      <input
                        type="text"
                        id="patente"
                        name="patente"
                        value={formData.patente}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="Ej: ABC123"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="tipo_vehiculo" className={styles.formLabel}>Tipo de Vehículo:</label>
                      <select
                        id="tipo_vehiculo"
                        name="tipo_vehiculo"
                        value={formData.tipo_vehiculo}
                        onChange={handleInputChange}
                        className={styles.formSelect}
                        required
                      >
                        <option value="">Seleccione un tipo</option>
                        <option value="moto">🏍️ Moto</option>
                        <option value="auto">🚗 Auto</option>
                        <option value="camioneta">🚙 Camioneta</option>
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      className={styles.submitButton}
                      disabled={loading}
                    >
                      {loading ? 'Cargando...' : '💾 Cargar Vehículo'}
                    </button>
                  </form>

                  {message && (
                    <div 
                      style={{
                        marginTop: '1rem',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: '600',
                        backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                        color: messageType === 'success' ? '#155724' : '#721c24',
                        border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                      }}
                    >
                      {messageType === 'success' ? '✅' : '❌'} {message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CargarVehiculo;