// Utilidades para manejo de sesión simple en localStorage
import apiClient from '../apiClient';

export function setUserSession(user) {
  localStorage.setItem('findmyspace_user', JSON.stringify(user));
}

export function getUserSession() {
  const user = localStorage.getItem('findmyspace_user');
  const parsedUser = user ? JSON.parse(user) : null;
  return parsedUser;
}

export function clearUserSession() {
  localStorage.removeItem('findmyspace_user');

}

// Cerrar sesión preservando mapas y preferencia de modo oscuro
export async function logoutAndPreserve(navigate) {
  try {
    // Llamar al endpoint de logout en el backend
    await apiClient.post('/logout');

    // Guardar los mapas y darkMode antes de limpiar
    const mapasGuardados = localStorage.getItem('findmyspace_mapas');
    const darkMode = localStorage.getItem('darkMode');

    // Limpiar todo
    sessionStorage.clear();
    localStorage.clear();

    // Restaurar lo que queremos mantener
    if (mapasGuardados) localStorage.setItem('findmyspace_mapas', mapasGuardados);
    if (darkMode) localStorage.setItem('darkMode', darkMode);

    // Ir al inicio
    if (typeof navigate === 'function') navigate('/');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}
