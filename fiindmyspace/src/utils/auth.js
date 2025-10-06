// Utilidades para manejo de sesión simple en localStorage

export function setUserSession(user) {
  console.log('💾 Guardando sesión en localStorage:', user);
  localStorage.setItem('findmyspace_user', JSON.stringify(user));
  console.log('✅ Sesión guardada exitosamente');
}

export function getUserSession() {
  const user = localStorage.getItem('findmyspace_user');
  const parsedUser = user ? JSON.parse(user) : null;
  console.log('📖 Obteniendo sesión de localStorage:', parsedUser);
  return parsedUser;
}

export function clearUserSession() {
  console.log('🗑️ Eliminando solo la sesión del usuario');
  localStorage.removeItem('findmyspace_user');
  console.log('✅ Sesión del usuario eliminada (mapas y preferencias preservadas)');
}
