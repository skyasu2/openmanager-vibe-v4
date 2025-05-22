import { MCPService } from './MCPService.js';
import { TimelineAnalyzer } from './TimelineAnalyzer.js';
import { AutoReportGenerator } from './AutoReportGenerator.js';

export class AutoReportTrigger {
  constructor() {
    this.mcpService = new MCPService();
    this.timelineAnalyzer = new TimelineAnalyzer();
    this.reportGenerator = new AutoReportGenerator();
    this.activeMonitoring = false;
    this.reportQueue = [];
  }

  // 자동 보고서 생성 시작
  startAutoReporting() {
    this.activeMonitoring = true;
    
    console.log('🤖 AI 자동 보고서 시스템 시작');
    
    // 1시간마다 자동 분석
    this.hourlyInterval = setInterval(async () => {
      if (this.activeMonitoring) {
        await this.generateHourlyReport();
      }
    }, 3600000); // 1시간

    // 실시간 임계 상황 감지
    this.realtimeInterval = setInterval(async () => {
      if (this.activeMonitoring) {
        await this.checkForCriticalIncidents();
      }
    }, 60000); // 1분
  }

  // 자동 보고서 생성 중단
  stopAutoReporting() {
    this.activeMonitoring = false;
    if (this.hourlyInterval) clearInterval(this.hourlyInterval);
    if (this.realtimeInterval) clearInterval(this.realtimeInterval);
    console.log('🔴 AI 자동 보고서 시스템 중단');
  }

  // 1시간 단위 자동 보고서 생성
  async generateHourlyReport() {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000); // 1시간 전

    try {
      console.log(`🤖 AI 자동 분석 시작: ${startTime.toLocaleTimeString()} ~ ${endTime.toLocaleTimeString()}`);
      
      // 1. 시간대 분석 수행
      const timelineAnalysis = await this.timelineAnalyzer.analyzeIncidentTimeline(startTime, endTime);
      
      // 2. 자동 보고서 생성
      const report = await this.reportGenerator.generateIncidentReport(timelineAnalysis);
      
      // 3. 보고서 저장 및 알림
      await this.saveAndNotifyReport(report);
      
      console.log(`✅ 자동 보고서 생성 완료: ${report.report_id}`);
      
      return report;
      
    } catch (error) {
      console.error('자동 보고서 생성 실패:', error);
      return null;
    }
  }

  // 임계 상황 실시간 감지
  async checkForCriticalIncidents() {
    try {
      const currentData = await this.mcpService.getRealtimeServerData();
      
      if (!currentData || !currentData.metrics) return;
      
      const criticalServers = Object.values(currentData.metrics)
        .filter(server => server.emergent_alerts && 
          server.emergent_alerts.some(alert => alert.severity === 'critical'));

      if (criticalServers.length > 0) {
        console.log('🚨 임계 상황 감지 - 즉시 보고서 생성');
        await this.generateEmergencyReport(criticalServers);
      }
    } catch (error) {
      console.error('임계 상황 감지 실패:', error);
    }
  }

  // 긴급 보고서 생성
  async generateEmergencyReport(criticalServers) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 1800000); // 30분 전

    try {
      const emergencyAnalysis = await this.timelineAnalyzer.analyzeIncidentTimeline(startTime, endTime);
      const emergencyReport = await this.reportGenerator.generateIncidentReport(emergencyAnalysis, {
        type: 'emergency',
        trigger: 'critical_alert_detected',
        affected_servers: criticalServers.map(s => s.server_id)
      });

      // 즉시 알림 발송
      await this.sendEmergencyNotification(emergencyReport);
      
      return emergencyReport;
    } catch (error) {
      console.error('긴급 보고서 생성 실패:', error);
      return null;
    }
  }

  // 보고서 저장 및 알림
  async saveAndNotifyReport(report) {
    // 로컬 스토리지에 저장 (시연용)
    const savedReports = JSON.parse(localStorage.getItem('aiReports') || '[]');
    savedReports.unshift(report);
    localStorage.setItem('aiReports', JSON.stringify(savedReports.slice(0, 50))); // 최신 50개만 보관
    
    // 이벤트 발생으로 UI 업데이트 트리거
    window.dispatchEvent(new CustomEvent('newAIReport', { detail: report }));
  }

  // 긴급 알림 발송
  async sendEmergencyNotification(report) {
    console.log('🚨 긴급 알림:', report.executive_summary.incident_overview);
    
    // 브라우저 알림 (가능한 경우)
    if (Notification.permission === 'granted') {
      new Notification('AI 모니터링 시스템 - 긴급 상황', {
        body: report.executive_summary.incident_overview.substring(0, 100),
        icon: '/favicon.ico'
      });
    }
    
    // UI에 즉시 표시
    window.dispatchEvent(new CustomEvent('emergencyAlert', { detail: report }));
  }

  // 수동 보고서 생성 (시연용)
  async generateManualReport() {
    console.log('📊 수동 보고서 생성 요청');
    return await this.generateHourlyReport();
  }
} 