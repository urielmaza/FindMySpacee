// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div style={{ marginTop: 100, marginBottom: 60, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Bienvenidos a FINDMYSPACE</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        <button style={{ padding: '12px 32px', fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/login')}>Login</button>
        <button style={{ padding: '12px 32px', fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</button>
      </div>
    </div>
  );
};

export default Home;
