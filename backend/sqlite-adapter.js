let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  Database = null;
}

// In-memory fallback when better-sqlite3 is not available.
class MemoryKV {
  constructor(){ this.kv = new Map(); this.users = []; this.nextId = 1; }
  prepare(){
    return {
      run: (...args)=>{
        // naive INSERT/UPDATE emulation for setKV/createUser
        if (args.length === 2) {
          const [k,v] = args; this.kv.set(k, v); return { changes:1 };
        }
        return { changes:0 };
      },
      get: (k)=>{
        if (typeof k === 'string') return { value: this.kv.get(k) };
        return null;
      },
      all: ()=> this.users.map(u=>({ id:u.id, username:u.username, role:u.role, active:u.active }))
    };
  }
  exec(){ return; }
}

class SqliteAdapter {
  constructor(dbPath) {
    this.dbPath = dbPath || './data/ams.db';
    if (!Database) {
      // use memory fallback
      this.mem = new MemoryKV();
      return;
    }
    this.db = new Database(this.dbPath, { verbose: null });
    this.initialize();
  }

  initialize() {
    if (!this.db) return;
    const usersTable = `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER DEFAULT 1
    )`;
    this.db.exec(usersTable);
    const kvTable = `CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT
    )`;
    this.db.exec(kvTable);
  }

  createUser({ username, password, role }) {
    if (this.mem) {
      const user = { id: this.mem.nextId++, username, password, role: role || 'user', active: 1 };
      this.mem.users.push(user);
      return { id: user.id, username, role: user.role };
    }
    const stmt = this.db.prepare('INSERT INTO users (username,password,role) VALUES (?,?,?)');
    const info = stmt.run(username, password, role || 'user');
    return { id: info.lastInsertRowid, username, role };
  }

  getUserByUsername(username) {
    if (this.mem) return this.mem.users.find(u=>u.username === username) || null;
    const stmt = this.db.prepare('SELECT id,username,password,role,active FROM users WHERE username = ?');
    return stmt.get(username) || null;
  }

  getAllUsers() {
    if (this.mem) return this.mem.users.map(u=>({ id:u.id, username:u.username, role:u.role, active:u.active }));
    const stmt = this.db.prepare('SELECT id,username,role,active FROM users');
    return stmt.all();
  }

  // Simple key/value storage for arbitrary JSON blobs
  getKV(key) {
    if (this.mem) return this.mem.kv.get(key) || null;
    const stmt = this.db.prepare('SELECT value FROM kv WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
  }

  setKV(key, value) {
    if (this.mem) { this.mem.kv.set(key, value); return; }
    const insert = this.db.prepare('INSERT INTO kv (key,value) VALUES (?,?)');
    const update = this.db.prepare('UPDATE kv SET value = ? WHERE key = ?');
    try {
      insert.run(key, value);
    } catch (e) {
      update.run(value, key);
    }
  }
}

module.exports = SqliteAdapter;
