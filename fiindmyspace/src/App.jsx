// src/App.jsx
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './components/user/Register';
import Login from './components/user/Login';
import Parkin from './pages/Parkin'; // Verifica que esta línea esté correcta
import SubirEstacionamiento from './pages/SubirEstacionamiento';
import Banner from './components/Banner';
import HomeUser from './pages/HomeUser';
import CargarVehiculo from './pages/cargarVehiculo'; // Corrige la mayúscula
import MisVehiculos from './pages/MisVehiculos'; // Nueva importación
import MisEstacionamientos from './pages/MisEstacionamientos'; // Nueva importación
import MisReservas from './pages/MisReservas'; // Nueva importación
import AuthCallback from './pages/AuthCallback'; // Nueva importación
import styles from './App.module.css'; // Asegúrate de tener este archivo CSS
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Reservas from './pages/Reservas'; // Importar el nuevo componente

function App() {
  const location = useLocation();

  return (
    <>

  {/* Mostrar Banner solo en la ruta '/' */}
  {location.pathname === '/' && <Banner />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/parkin" element={<Parkin />} />
          <Route path="/subir-estacionamiento" element={<SubirEstacionamiento />} />
          <Route path="/cargar-vehiculo" element={<CargarVehiculo />} />
          <Route path="/mis-vehiculos" element={<MisVehiculos />} />
          <Route path="/mis-reservas" element={<MisReservas />} />
          <Route path="/mis-estacionamientos" element={<MisEstacionamientos />} />
          <Route path="/home-user" element={<HomeUser />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reservas" element={<Reservas />} /> {/* Agregar la ruta para Reservas */}
          {/* Ruta para manejar rutas no definidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
 
    </>
  );
}

export default App;
