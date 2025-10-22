import axios from 'axios';

// Crear una instancia de Axios
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las solicitudes
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // O sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Manejo de errores global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirigir al usuario a la página de inicio de sesión
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;