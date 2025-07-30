import React from 'react';

const Footer = () => (
  <footer style={{ width: '100%', background: '#222', color: '#fff', textAlign: 'center', padding: '16px 0', position: 'fixed', left: 0, bottom: 0 }}>
    © {new Date().getFullYear()} Todos los derechos reservados
  </footer>
);

export default Footer;
