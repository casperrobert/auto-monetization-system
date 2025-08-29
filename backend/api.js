// backend/api.js
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const validateSchema = require('./src/middleware/validateSchema');

const SECRET = process.env.JWT_SECRET || 'supersecret';
const LOG_FILE = './backend/income.json';
const USERS_FILE = './backend/users.json';

// Hilfsfunktionen
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// User-Registrierung
router.post('/register', validateSchema('userRegister.schema.json'), (req, res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE);
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'User existiert' });
  const hash = bcrypt.hashSync(password, 10);
  users.push({ username, password: hash });
  writeJson(USERS_FILE, users);
  res.json({ ok: true });
});

// Login
router.post('/login', validateSchema('userLogin.schema.json'), (req, res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE);
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Login fehlgeschlagen' });
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Auth-Middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token fehlt' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig' });
  }
}

// Einnahmen abrufen
router.get('/income', auth, (req, res) => {
  const logs = readJson(LOG_FILE).filter(l => l.username === req.user.username);
  res.json(logs);
});

// Einnahme speichern
router.post('/income', auth, validateSchema('incomeEntry.schema.json'), (req, res) => {
  const { amount, source } = req.body;
  const logs = readJson(LOG_FILE);
  logs.unshift({ ts: Date.now(), username: req.user.username, amount, source });
  writeJson(LOG_FILE, logs);
  res.json({ ok: true });
});

module.exports = router;
