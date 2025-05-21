// frontend/services/ApiService.js
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || '/api';
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  
  async get(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...this.defaultOptions,
        ...options,
        method: 'GET'
      });
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} 실패:`, error);
      throw error;
    }
  }
  
  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...this.defaultOptions,
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} 실패:`, error);
      throw error;
    }
  }
}

export default ApiService;
