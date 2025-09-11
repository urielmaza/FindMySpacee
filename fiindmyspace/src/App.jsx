// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Register from './components/user/Register';
import Login from './components/user/Login';
import Parkin from './pages/Parkin'; // Verifica que esta línea esté correcta
import SubirEstacionamiento from './pages/SubirEstacionamiento';
import Banner from './components/Banner';
import HomeUser from './pages/HomeUser';
import CargarVehiculo from './pages/cargarVehiculo'; // Corrige la mayúscula
import styles from './App.module.css'; // Asegúrate de tener este archivo CSS

function App() {
  const location = useLocation();
  return (
    <>
      {/* Mostrar Banner solo si NO estamos en /home-user o /login */}
      {location.pathname !== '/home-user' && location.pathname !== '/login' && location.pathname !== '/register' && <Banner />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/parkin" element={<Parkin />} />
          <Route path="/subir-estacionamiento" element={<SubirEstacionamiento />} />
          <Route path="/cargar-vehiculo" element={<CargarVehiculo />} />
          <Route path="/home-user" element={<HomeUser />} />
        </Routes>
 
    </>
  );
}

export default App;
