// Utilidades para manejo de sesión simple en localStorage

export function setUserSession(user) {
  localStorage.setItem('findmyspace_user', JSON.stringify(user));
}

export function getUserSession() {
  const user = localStorage.getItem('findmyspace_user');
  return user ? JSON.parse(user) : null;
}

export function clearUserSession() {
  localStorage.removeItem('findmyspace_user');
}
