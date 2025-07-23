// controllers/authController.js
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Utilidad para enviar email
async function sendActivationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Cambia según tu proveedor
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const activationLink = `${process.env.BASE_URL}/api/activate/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Bienvenido a FindMySpace - Activa tu cuenta',
    html: `<h2>¡Bienvenido!</h2><p>Gracias por registrarte. Haz clic en el botón para activar tu cuenta:</p><a href="${activationLink}" style="padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Activa tu cuenta</a>`
  };

  await transporter.sendMail(mailOptions);
}

// Registro de usuario
async function register(req, res) {
  const { email, pw } = req.body;
  if (!email || !pw) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  // Verificar si ya existe
  pool.query('SELECT * FROM cliente WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    if (results.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

    // Hash de la contraseña
    const hashedPw = await bcrypt.hash(pw, 10);
    // Token de activación
    const token = crypto.randomBytes(32).toString('hex');

    // Guardar usuario con activo=0 y token
    pool.query('INSERT INTO cliente (email, pw, activo, activation_token) VALUES (?, ?, 0, ?)', [email, hashedPw, token], async (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al registrar usuario' });
      try {
        await sendActivationEmail(email, token);
        res.json({ message: 'Registro exitoso. Revisa tu email para activar la cuenta.' });
      } catch (e) {
        res.status(500).json({ error: 'No se pudo enviar el email de activación' });
      }
    });
  });
}

// Activación de cuenta
function activate(req, res) {
  const { token } = req.params;
  pool.query('SELECT * FROM cliente WHERE activation_token = ?', [token], (err, results) => {
    if (err || results.length === 0) return res.status(400).send('Token inválido');
    pool.query('UPDATE cliente SET activo = 1, activation_token = NULL WHERE activation_token = ?', [token], (err2) => {
      if (err2) return res.status(500).send('Error al activar cuenta');
      // Redirigir al login del frontend
      res.redirect(process.env.FRONTEND_URL + '/login');
    });
  });
}

module.exports = { register, activate };
// Login de usuario
async function login(req, res) {
  const { email, pw } = req.body;
  if (!email || !pw) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  pool.query('SELECT * FROM cliente WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const user = results[0];
    if (user.activo !== 1) return res.status(403).json({ error: 'La cuenta no está activada. Revisa tu email.' });
    try {
      const match = await bcrypt.compare(pw, user.pw);
      if (!match) return res.status(401).json({ error: 'Credenciales incorrectas' });
      // Aquí podrías generar un token JWT si lo deseas
      res.json({ message: 'Login exitoso', user: { id: user.id, email: user.email } });
    } catch (e) {
      res.status(500).json({ error: 'Error al verificar contraseña' });
    }
  });
}

module.exports = { register, activate, login };
