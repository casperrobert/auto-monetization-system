const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class PostgresService {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'ams_user',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ams_db',
      password: process.env.DB_PASSWORD || 'ams_password',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      await this.createTables();
      console.log('PostgreSQL database initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        active BOOLEAN DEFAULT true
      )`,
      
      `CREATE TABLE IF NOT EXISTS income_streams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        stream_type VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS tax_reserves (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        stream_type VARCHAR(50) NOT NULL,
        gross_amount DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,4) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'reserved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        old_values JSONB,
        new_values JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }
  }

  async createUser(userData) {
    const { username, password, email, role = 'user', permissions = {} } = userData;
    const result = await this.pool.query(
      'INSERT INTO users (username, password, email, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, password, email, role, JSON.stringify(permissions)]
    );
    return result.rows[0];
  }

  async getUserByUsername(username) {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1 AND active = true', [username]);
    return result.rows[0];
  }

  async getIncomeStreams(userId) {
    const result = await this.pool.query(
      'SELECT * FROM income_streams WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return result.rows;
  }

  async upsertIncomeStream(userId, streamData) {
    const { streamType, amount, date = new Date().toISOString().split('T')[0] } = streamData;
    const result = await this.pool.query(
      `INSERT INTO income_streams (user_id, stream_type, amount, date) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, stream_type, date) 
       DO UPDATE SET amount = $3 
       RETURNING *`,
      [userId, streamType, amount, date]
    );
    return result.rows[0];
  }

  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `../backups/backup-${timestamp}.json`);
    
    const tables = ['users', 'income_streams', 'tax_reserves', 'audit_log'];
    const backup = {};
    
    for (const table of tables) {
      const result = await this.pool.query(`SELECT * FROM ${table}`);
      backup[table] = result.rows;
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    return backupFile;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgresService;