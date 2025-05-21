// frontend/services/AIService.js
import ApiService from './ApiService.js';
import EventBus from './EventBus.js';

class AIService {
  constructor() {
    this.api = new ApiService();
  }

  async queryAI(question, userId = 'default') {
    try {
      EventBus.publish('ai:loading', true);
      const response = await this.api.post('/ai/query', { userId, question });
      EventBus.publish('ai:response', response);
      return response;
    } catch (error) {
      EventBus.publish('error', { source: 'ai', message: error.message });
      throw error;
    } finally {
      EventBus.publish('ai:loading', false);
    }
  }

  async analyzeQuery(question, userId = 'default') {
    try {
      const response = await this.api.post('/ai/analyze', { userId, question });
      EventBus.publish('ai:analyze', response);
      return response;
    } catch (error) {
      EventBus.publish('error', { source: 'ai', message: error.message });
      throw error;
    }
  }
}

export default new AIService();
