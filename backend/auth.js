const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const USERS_FILE = path.join(__dirname, 'users.json');

class AuthService {
  constructor() {
    this.users = this.loadUsers();
  }

  loadUsers() {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [{ username: 'admin', password: 'secure123', role: 'admin' }];
    }
  }

  saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
  }

  authenticate(username, password) {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return { success: true, token, user: { username: user.username, role: user.role } };
    }
    return { success: false, message: 'Invalid credentials' };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  middleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = this.verifyToken(token);
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthService;