import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';

const CargarVehiculo = () => {
  const [marcas, setMarcas] = useState([]);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    patente: '',
    tipo_vehiculo: '',
  });
  const [userEmail, setUserEmail] = useState('');

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
    try {
      // Obtener id_cliente de la sesión del usuario
      const userSession = getUserSession();
      const id_cliente = userSession ? userSession.id_cliente : null;

      if (!id_cliente) {
        alert('No se pudo obtener la sesión del usuario.');
        return;
      }

      // Validar que todos los campos requeridos tengan un valor
      if (!formData.marca || !formData.modelo || !formData.patente || !formData.tipo_vehiculo) {
        alert('Todos los campos son obligatorios.');
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
        alert('Vehículo cargado exitosamente');
        setFormData({ marca: '', modelo: '', patente: '', tipo_vehiculo: '' });
      } else {
        alert('Error al cargar el vehículo');
      }
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      alert('Error interno del servidor');
    }
  };

  return (
    <div>
      <h1>Cargar Vehículo</h1>
      {userEmail && <p>Hola, {userEmail}</p>} {/* Mostrar mensaje con el email del usuario */}
      <form onSubmit={handleSubmit}>
        <label htmlFor="marca">Marca:</label>
        <select
          id="marca"
          name="marca"
          value={formData.marca}
          onChange={handleInputChange}
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
        <br />

        <label htmlFor="modelo">Modelo:</label>
        <input
          type="text"
          id="modelo"
          name="modelo"
          value={formData.modelo}
          onChange={handleInputChange}
        />
        <br />

        <label htmlFor="patente">Patente:</label>
        <input
          type="text"
          id="patente"
          name="patente"
          value={formData.patente}
          onChange={handleInputChange}
        />
        <br />

        <label htmlFor="tipo_vehiculo">Tipo de Vehículo:</label>
        <select
          id="tipo_vehiculo"
          name="tipo_vehiculo"
          value={formData.tipo_vehiculo}
          onChange={handleInputChange}
        >
          <option value="">Seleccione un tipo</option>
          <option value="moto">Moto</option>
          <option value="auto">Auto</option>
          <option value="camioneta">Camioneta</option>
        </select>
        <br />

        <button type="submit">Cargar</button>
      </form>
    </div>
  );
};

export default CargarVehiculo;