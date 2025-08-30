// src/pages/Home.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const createSquare = () => {
      const section = document.querySelector(`.${styles.background}`);
      if (!section) return; // Verifica si el elemento existe antes de continuar

      const square = document.createElement('span');
      const size = Math.random() * 5; // Reducido aún más el tamaño máximo de las pelotitas

      square.style.width = 4 + size + 'px';
      square.style.height = 4 + size + 'px';
      square.style.top = Math.random() * window.innerHeight + 'px';
      square.style.left = Math.random() * window.innerWidth + 'px';
      square.style.position = 'absolute';
      square.style.borderRadius = '50%';
      square.style.background = 'white';
      square.style.pointerEvents = 'none';
      square.style.animation = `${styles.animate} 5s linear infinite`;

      section.appendChild(square);

      setTimeout(() => {
        square.remove();
      }, 5000);
    };

    const interval = setInterval(createSquare, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={styles.background}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>
            <div className={styles.spinner1}></div>
          </div>
        </div>
        <div className={styles.textContainer}>
          <h1 className={styles.text}>Visualiza cualquier estacionamiento
            <br /> como si estuvieras allí</h1>
          <br/><p className={styles.subText}>Estacionamientos públicos y privados (búsca, reserva y disfruta).</p>
          <br />
          <button onClick={() => navigate('/login')} className={`${styles.bannerButton} ${styles.login}`}>Empezá a buscar tu estacionamiento</button>
        </div>
        
      </div>
      <div className={styles.caca}></div>
    </>
  );
};

export default Home;
