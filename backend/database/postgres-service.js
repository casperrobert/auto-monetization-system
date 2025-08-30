class PostgresService {
  async getAllUsers() {
    return [
      { id: 1, username: 'admin', role: 'admin', active: true },
      { id: 2, username: 'user', role: 'user', active: true }
    ];
  }

  async createUser(userData) {
    return {
      id: Date.now(),
      username: userData.username,
      role: userData.role || 'user',
      active: true
    };
  }

  async backup() {
    return 'backup-' + Date.now() + '.sql';
  }
}

module.exports = PostgresService;