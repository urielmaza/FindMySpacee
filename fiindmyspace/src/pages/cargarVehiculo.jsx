import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './cargarVehiculo.module.css';

const CargarVehiculo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [marcas, setMarcas] = useState([]);
  // Tipo de patente: '6' => AAA 123 (7 con espacio); '7' => AA 123 BB (9 con espacios)
  const [patenteTipo, setPatenteTipo] = useState('6');
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

  // Detectar modo edición por query param ?id=123 y precargar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) return;
    const cargarVehiculo = async () => {
      try {
        const resp = await apiClient.get(`/vehiculos/${id}`);
        if (resp.data && resp.data.success && resp.data.data) {
          const v = resp.data.data;
          // Determinar tipo de patente por longitud con espacios
          const tipo = v.patente && v.patente.trim().length === 7 ? '6' : '7';
          setPatenteTipo(tipo);
          setFormData({
            marca: v.marca || '',
            modelo: v.modelo || '',
            patente: v.patente || '',
            tipo_vehiculo: v.tipo_vehiculo || '',
          });
        }
      } catch (err) {
        console.error('Error al cargar vehículo para edición:', err);
      }
    };
    cargarVehiculo();
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Formatear la patente según tipo seleccionado
    if (name === 'patente') {
      const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (patenteTipo === '6') {
        // Formato AAA 123: 3 letras + espacio + 3 dígitos
        let letters = '';
        let digits = '';
        for (const ch of raw) {
          if (/^[A-Z]$/.test(ch)) {
            if (letters.length < 3) letters += ch;
          } else if (/^[0-9]$/.test(ch)) {
            if (letters.length === 3 && digits.length < 3) digits += ch;
          }
          if (letters.length === 3 && digits.length === 3) break;
        }
        const formatted = letters.length === 3 ? `${letters} ${digits}` : letters;
        setFormData({ ...formData, patente: formatted });
        return;
      } else {
        // patenteTipo === '7' => Formato AA 123 BB: 2 letras, espacio, 3 dígitos, espacio, 2 letras
        let first = '';
        let numbers = '';
        let last = '';
        for (const ch of raw) {
          if (/^[A-Z]$/.test(ch)) {
            if (first.length < 2) {
              first += ch;
            } else if (numbers.length === 3 && last.length < 2) {
              last += ch;
            }
          } else if (/^[0-9]$/.test(ch)) {
            if (first.length === 2 && numbers.length < 3) {
              numbers += ch;
            }
          }
          if (first.length === 2 && numbers.length === 3 && last.length === 2) break;
        }
        let formatted = first;
        if (first.length === 2) {
          formatted += ` ${numbers}`;
        }
        if (numbers.length === 3) {
          formatted += ` ${last}`;
        }
        setFormData({ ...formData, patente: formatted });
        return;
      }
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePatenteTipoChange = (e) => {
    const value = e.target.value;
    setPatenteTipo(value);
    // Reiniciar la patente al cambiar de tipo para evitar inconsistencias
    setFormData((prev) => ({ ...prev, patente: '' }));
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

      // Validación según tipo
      const regex = patenteTipo === '6'
        ? /^[A-Z]{3} [0-9]{3}$/
        : /^[A-Z]{2} [0-9]{3} [A-Z]{2}$/;
      if (!regex.test(formData.patente)) {
        const formatoDesc = patenteTipo === '6' ? 'AAA 123' : 'AA 123 BB';
        setMessage(`La patente debe tener el formato ${formatoDesc}.`);
        setMessageType('error');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(location.search);
      const id = params.get('id');

      let response;
      if (id) {
        // Modo edición
        response = await apiClient.put(`/vehiculos/${id}`, {
          ...formData,
        });
      } else {
        // Modo creación
        response = await apiClient.post('/vehiculos', {
          ...formData,
          id_cliente,
        });
      }

      const ok = id ? response.status === 200 : response.status === 201;
      if (ok) {
        setMessage(id ? '¡Vehículo actualizado exitosamente!' : '¡Vehículo cargado exitosamente!');
        setMessageType('success');
        if (!id) {
          setFormData({ marca: '', modelo: '', patente: '', tipo_vehiculo: '' });
        } else {
          // tras editar, volver a Mis Vehículos tras breve delay
          setTimeout(() => navigate('/mis-vehiculos'), 800);
        }
      } else {
        setMessage(id ? 'Error al actualizar el vehículo' : 'Error al cargar el vehículo');
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
                <label htmlFor="patenteTipo" className={styles.formLabel}>Tipo de patente:</label>
                <select
                  id="patenteTipo"
                  name="patenteTipo"
                  value={patenteTipo}
                  onChange={handlePatenteTipoChange}
                  className={styles.formSelect}
                >
                  <option value="6">6 dígitos (Ej: AAA 123)</option>
                  <option value="7">7 dígitos (Ej: AA 123 BB)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="patente" className={styles.formLabel}>
                  {patenteTipo === '6' ? 'Patente (AAA 123):' : 'Patente (AA 123 BB):'}
                </label>
                <input
                  type="text"
                  id="patente"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder={patenteTipo === '6' ? 'Ej: AAA 123' : 'Ej: AB 123 CD'}
                  minLength={patenteTipo === '6' ? 7 : 9}
                  maxLength={patenteTipo === '6' ? 7 : 9}
                  pattern={patenteTipo === '6' ? '[A-Za-z]{3} [0-9]{3}' : '[A-Za-z]{2} [0-9]{3} [A-Za-z]{2}'}
                  title={patenteTipo === '6' ? 'Formato requerido: 3 letras, espacio, 3 números (AAA 123)' : 'Formato requerido: 2 letras, espacio, 3 números, espacio, 2 letras (AA 123 BB)'}
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
                  <option value="moto">Moto</option>
                  <option value="auto">Auto</option>
                  <option value="camioneta">Camioneta</option>
                </select>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar Vehículo'}
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