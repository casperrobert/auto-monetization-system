const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  // Fallback: minimal bcrypt-like API to avoid require-time crashes in
  // restricted environments. THIS IS NOT CRYPTOGRAPHICALLY SECURE and should
  // only be used for tests in environments where installing deps isn't
  // possible.
  bcrypt = {
    hashSync: (s) => `plain:${s}`,
    compareSync: (a, b) => {
      if (a.startsWith('plain:')) return a.slice(6) === b;
      return a === `plain:${b}`;
    }
  };
}
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const USERS_FILE = path.join(__dirname, 'users.json');
let SqliteAdapter;
try { SqliteAdapter = require('./sqlite-adapter'); } catch (e) { SqliteAdapter = null; }

class AuthService {
  constructor() {
  this.sqlite = SqliteAdapter ? new SqliteAdapter(path.join(process.cwd(),'data','ams.db')) : null;
  this.users = this.loadUsers();
  // Migrate file-based users into sqlite if available
  if (this.sqlite) this.migrateUsersToSqlite();
  }

  loadUsers() {
    try {
      if (this.sqlite) {
        return this.sqlite.getAllUsers().map(u => ({ username: u.username, password: u.password, role: u.role }));
      }
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      const pw = bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASS || 'secure123', 10);
      return [{ username: 'admin', password: pw, role: 'admin' }];
    }
  }

  saveUsers() {
    try {
      if (this.sqlite) {
        // Ensure sqlite contains up-to-date users
        this.users.forEach(u => {
          try {
            const existing = this.sqlite.getUserByUsername(u.username);
            if (!existing) this.sqlite.createUser({ username: u.username, password: u.password, role: u.role });
          } catch (e) { /* ignore unique constraints */ }
        });
        return;
      }
      const tmp = `${USERS_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.users, null, 2));
      fs.renameSync(tmp, USERS_FILE);
    } catch (e) {
      console.warn('saveUsers failed:', e.message);
    }
  }

  migrateUsersToSqlite() {
    try {
      const fileUsers = (() => {
        try { return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')); } catch { return []; }
      })();
      fileUsers.forEach(u => {
        try { this.sqlite.createUser({ username: u.username, password: u.password, role: u.role }); } catch (e) { /* ignore */ }
      });
    } catch (e) { console.warn('migrateUsersToSqlite failed:', e.message); }
  }

  authenticate(username, password) {
    const user = this.users.find(u => u.username === username);
    if (user && bcrypt.compareSync(password, user.password)) {
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