const API_BASE = 'http://localhost:3002';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(credentials) {
    const response = await this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('token', response.token);
    }
    return response;
  }

  // Income
  async getIncome() {
    return this.request('/api/income');
  }

  async updateIncome(updates) {
    return this.request('/api/income', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async simulateIncome() {
    return this.request('/api/income/simulate', { method: 'POST' });
  }

  // Tax
  async getTaxStatus() {
    return this.request('/api/tax/status');
  }

  async getTaxBreakdown() {
    return this.request('/api/tax/breakdown');
  }

  // Compliance
  async getComplianceReport() {
    return this.request('/api/compliance/report');
  }

  // Notifications
  async getNotifications(unreadOnly = false) {
    return this.request(`/api/notifications${unreadOnly ? '?unread=true' : ''}`);
  }

  // Streams / StreamConfig
  async getStreams() {
    return this.request('/api/streams');
  }

  async getStream(id) {
    return this.request(`/api/streams/${encodeURIComponent(id)}`);
  }

  async updateStream(id, payload) {
    return this.request(`/api/streams/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async createStream(payload) {
    return this.request('/api/streams', { method: 'POST', body: JSON.stringify(payload) });
  }

  async deleteStream(id) {
    return this.request(`/api/streams/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // Automation control (backend should expose these endpoints)
  async startAutomation(category) {
    return this.request(`/api/streams/${encodeURIComponent(category)}/start`, { method: 'POST' });
  }

  async stopAutomation(category) {
    return this.request(`/api/streams/${encodeURIComponent(category)}/stop`, { method: 'POST' });
  }
}

export default new ApiService();