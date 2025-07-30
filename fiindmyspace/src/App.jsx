import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './components/user/Register';
import Login from './components/user/Login';
import Parkin from './pages/Parkin';
import Banner from './components/Banner';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Banner />
      <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 60 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/parkin" element={<Parkin />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
