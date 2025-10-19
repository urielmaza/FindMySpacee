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
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' o 'error'

  useEffect(() => {
    // Obtener datos de la sesión del usuario
    const userSession = getUserSession();
    if (userSession) {
      setUserEmail(userSession.email);
    }

    // Llamada a la API para obtener las marcas
    const fetchMarcas = async () => {
      try {
        const response = await apiClient.get('/marcas/all');
        
        // Acceder a los datos correctos según la nueva estructura del controlador
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Obtener id_cliente de la sesión del usuario
      const userSession = getUserSession();
      const id_cliente = userSession ? userSession.id_cliente : null;

      if (!id_cliente) {
        setMessage('No se pudo obtener la sesión del usuario.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Validar que todos los campos requeridos tengan un valor
      if (!formData.marca || !formData.modelo || !formData.patente || !formData.tipo_vehiculo) {
        setMessage('Todos los campos son obligatorios.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      console.log('Datos enviados al backend:', {
        ...formData,
        id_cliente,
      });

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

  return (
    <>
      <BannerUser onMenuToggle={setIsMenuOpen} />
      <div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
        <div className={styles.contentContainer}>

          <div className={styles.formCard}>
          <h1 className={styles.pageTitle}>Cargar Vehículo</h1> 
            {userEmail && (
              <div className={styles.welcomeMessage}>
                🚗 Hola {userEmail}, agrega un nuevo vehículo a tu cuenta
              </div>
            )}
            
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
        </div>
      </div>
    </>
  );
};

export default CargarVehiculo;