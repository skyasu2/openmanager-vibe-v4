import axios from 'axios';

// API 기본 URL 설정
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * 서버 데이터 관련 서비스
 */
class ServerDataService {
  /**
   * 모든 서버 정보 조회
   */
  async getServers() {
    try {
      // 실제 API가 연결되면 아래 주석을 해제
      // const response = await axios.get(`${API_URL}/servers`);
      // return response.data;
      
      // 개발용 더미 데이터
      return this.getDummyServers();
    } catch (error) {
      console.error('서버 데이터 로드 실패:', error);
      throw error;
    }
  }
  
  /**
   * 특정 서버 정보 조회
   */
  async getServerById(id) {
    try {
      // 실제 API가 연결되면 아래 주석을 해제
      // const response = await axios.get(`${API_URL}/servers/${id}`);
      // return response.data;
      
      // 개발용 더미 데이터
      const servers = this.getDummyServers();
      return servers.find(server => server.id === id);
    } catch (error) {
      console.error(`서버 ID ${id} 데이터 로드 실패:`, error);
      throw error;
    }
  }
  
  /**
   * 서버 상태별 필터링
   */
  async getServersByStatus(status) {
    try {
      // 실제 API가 연결되면 아래 주석을 해제
      // const response = await axios.get(`${API_URL}/servers?status=${status}`);
      // return response.data;
      
      // 개발용 더미 데이터
      const servers = this.getDummyServers();
      if (status === 'all') return servers;
      return servers.filter(server => server.status === status);
    } catch (error) {
      console.error(`상태 ${status}의 서버 데이터 로드 실패:`, error);
      throw error;
    }
  }
  
  /**
   * 개발용 더미 서버 데이터
   */
  getDummyServers() {
    return [
      {
        id: 'web-01',
        hostname: 'web-01.example.com',
        ipAddress: '192.168.1.101',
        status: 'normal',
        cpu: 35,
        memory: 42,
        disk: 56,
        uptime: '45d 12h 30m',
        services: ['nginx', 'nodejs', 'certbot'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'web-02',
        hostname: 'web-02.example.com',
        ipAddress: '192.168.1.102',
        status: 'warning',
        cpu: 78,
        memory: 85,
        disk: 68,
        uptime: '30d 5h 15m',
        services: ['nginx', 'nodejs', 'certbot'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'app-01',
        hostname: 'app-01.example.com',
        ipAddress: '192.168.1.201',
        status: 'normal',
        cpu: 45,
        memory: 52,
        disk: 38,
        uptime: '15d 8h 45m',
        services: ['nodejs', 'pm2', 'redis-client'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'app-02',
        hostname: 'app-02.example.com',
        ipAddress: '192.168.1.202',
        status: 'normal',
        cpu: 55,
        memory: 48,
        disk: 42,
        uptime: '22d 14h 30m',
        services: ['nodejs', 'pm2', 'redis-client'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'app-03',
        hostname: 'app-03.example.com',
        ipAddress: '192.168.1.203',
        status: 'warning',
        cpu: 65,
        memory: 58,
        disk: 92,
        uptime: '5d 18h 22m',
        services: ['nodejs', 'pm2', 'redis-client'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'db-01',
        hostname: 'db-01.example.com',
        ipAddress: '192.168.1.251',
        status: 'critical',
        cpu: 92,
        memory: 95,
        disk: 88,
        uptime: '60d 20h 18m',
        services: ['mysql', 'backup-service'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'db-02',
        hostname: 'db-02.example.com',
        ipAddress: '192.168.1.252',
        status: 'normal',
        cpu: 45,
        memory: 52,
        disk: 64,
        uptime: '38d 4h 12m',
        services: ['mysql', 'backup-service'],
        lastChecked: new Date().toISOString()
      },
      {
        id: 'cache-01',
        hostname: 'cache-01.example.com',
        ipAddress: '192.168.1.151',
        status: 'normal',
        cpu: 25,
        memory: 65,
        disk: 28,
        uptime: '12d 6h 40m',
        services: ['redis', 'memcached'],
        lastChecked: new Date().toISOString()
      }
    ];
  }
}

// 싱글톤 인스턴스 생성하여 내보내기
export default new ServerDataService(); 