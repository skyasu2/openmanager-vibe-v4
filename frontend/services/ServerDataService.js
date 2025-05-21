// frontend/services/ServerDataService.js
import ApiService from './ApiService.js';
import EventBus from './EventBus.js';

class ServerDataService {
  constructor() {
    this.api = new ApiService();
    this.cachedData = null;
    this.lastFetched = null;
    this.cacheValidityMs = 30000; // 30초 캐시
  }
  
  async getServers() {
    // 캐시 유효성 검사
    if (this.cachedData && (Date.now() - this.lastFetched) < this.cacheValidityMs) {
      return this.cachedData;
    }
    try {
      const data = await this.api.get('/servers/metrics');
      this.cachedData = data;
      this.lastFetched = Date.now();
      // 데이터 변경 이벤트 발행
      EventBus.publish('servers:data-updated', data);
      return data;
    } catch (error) {
      EventBus.publish('error', { source: 'server-data', message: error.message });
      throw error;
    }
  }
  
  async getServerDetails(serverId) {
    return await this.api.get(`/servers/${serverId}/metrics`);
  }
  
  // 기타 데이터 요청 메서드...
}

export default new ServerDataService();
