import axios from 'axios';

// Crear una instancia de Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Cambia esto según tu base URL
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
});

export default apiClient;