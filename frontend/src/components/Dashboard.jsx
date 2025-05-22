import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import EventBus from '../services/EventBus';
import ServerDataService from '../services/ServerDataService';
import ServerCard from './ServerCard';
import StatusSummary from './StatusSummary';
import { MCPService } from '../services/MCPService.js';
import { PRODUCTION_CONFIG } from '../config/production.config.js';
import AIChatInterface from './AIChatInterface.jsx';
import { AutoReportTrigger } from '../services/AutoReportTrigger.js';

const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [realtimeAnalysis, setRealtimeAnalysis] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [autoReportingActive, setAutoReportingActive] = useState(false);

  const mcpService = useMemo(() => new MCPService(PRODUCTION_CONFIG), []);
  const autoReportTrigger = useRef(new AutoReportTrigger());

  // Load server data on component mount
  useEffect(() => {
    loadServerData();
    
    // Setup refresh interval
    const intervalId = setInterval(() => {
      loadServerData();
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Subscribe to events
  useEffect(() => {
    // Server selection event
    const serverSelectedUnsubscribe = EventBus.subscribe(
      'server:selected', 
      handleServerSelection
    );
    
    // AI response event
    const aiResponseUnsubscribe = EventBus.subscribe(
      'ai:response-received',
      handleAIResponse
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      serverSelectedUnsubscribe();
      aiResponseUnsubscribe();
    };
  }, []);
  
  // Load server data from service
  const loadServerData = async () => {
    try {
      setLoading(true);
      const data = await ServerDataService.getServers();
      setServers(data);
      
      // Publish data update event
      EventBus.publish('servers:data-updated', data);
    } catch (err) {
      setError('Failed to load server data');
      
      // Publish error event
      EventBus.publish('error', {
        source: 'dashboard',
        message: 'Failed to load server data',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle server selection
  const handleServerSelection = (server) => {
    setSelectedServer(server);
    
    // Publish context update event
    EventBus.publish('context:updated', {
      selectedServer: server
    });
  };
  
  // Handle AI response
  const handleAIResponse = (response) => {
    // Handle AI response, e.g. highlight related servers
    if (response.related_servers && response.related_servers.length > 0) {
      highlightRelatedServers(response.related_servers);
    }
  };
  
  // Filter servers based on status
  const getFilteredServers = () => {
    if (filterStatus === 'all') {
      return servers;
    }
    return servers.filter(server => server.status === filterStatus);
  };
  
  // Change filter status
  const changeFilterStatus = (status) => {
    setFilterStatus(status);
    
    // Publish filter changed event
    EventBus.publish('filter:changed', { status });
  };
  
  // Highlight related servers (implementation detail)
  const highlightRelatedServers = (serverIds) => {
    // In React this would typically be handled through state
    console.log('Highlighting servers:', serverIds);
  };
  
  // 실제 기업에서 사용되는 실시간 모니터링
  useEffect(() => {
    const refreshInterval = PRODUCTION_CONFIG.dataSources.primary.config.refreshInterval;
    
    const updateSystemHealth = async () => {
      try {
        setLoading(true);
        
        // 전체 시스템 헬스 체크
        const healthResponse = await mcpService.processQuery("전체 시스템 상태를 분석해주세요");
        setSystemHealth(healthResponse);
        
        // 이상 징후 탐지
        const anomalyResponse = await mcpService.processQuery("현재 이상 징후가 있나요?");
        setRealtimeAnalysis(anomalyResponse);
        
        // 알림 히스토리 업데이트
        const alerts = await mcpService.getRecentAlerts();
        setAlertHistory(alerts);
        
        setError(null);
      } catch (err) {
        console.error('System health update failed:', err);
        setError('시스템 데이터 업데이트에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    // 초기 로드
    updateSystemHealth();
    
    // 주기적 업데이트
    const interval = setInterval(updateSystemHealth, refreshInterval);
    
    return () => clearInterval(interval);
  }, [mcpService]);

  // 알림 처리 (실제 기업에서 중요)
  const handleCriticalAlert = useCallback(async (alert) => {
    try {
      // 자동 대응 로직
      if (alert.severity === 'critical' && alert.auto_remediation_available) {
        const confirmation = window.confirm(
          `심각한 문제가 발견되었습니다: ${alert.description}\n자동 복구를 시도하시겠습니까?`
        );
        
        if (confirmation) {
          await mcpService.executeAutoRemediation(alert);
        }
      }
      
      // 에스컬레이션 필요 여부 확인
      if (alert.requires_escalation) {
        await mcpService.triggerEscalation(alert);
      }
    } catch (error) {
      console.error('Alert handling failed:', error);
    }
  }, [mcpService]);

  // 성능 메트릭 컴포넌트 (프로덕션 수준)
  const PerformanceMetrics = ({ data }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <MetricCard 
        title="전체 헬스 스코어"
        value={data?.overall_health_score || 0}
        unit="%"
        threshold={{ warning: 80, critical: 60 }}
        trend={data?.health_trend}
      />
      <MetricCard 
        title="정상 서버"
        value={data?.healthy_servers || 0}
        total={data?.total_servers || 0}
        icon="server"
      />
      <MetricCard 
        title="활성 알림"
        value={data?.active_alerts || 0}
        severity={data?.highest_alert_severity}
        icon="alert"
      />
      <MetricCard 
        title="응답 시간"
        value={data?.avg_response_time || 0}
        unit="ms"
        threshold={{ warning: 200, critical: 500 }}
      />
    </div>
  );

  // 메트릭 카드 컴포넌트
  const MetricCard = ({ title, value, unit, threshold, trend, total, icon, severity }) => {
    // 상태에 따른 색상 결정
    let statusColor = 'bg-green-100 text-green-800';
    
    if (threshold) {
      if (value >= threshold.critical) {
        statusColor = 'bg-red-100 text-red-800';
      } else if (value >= threshold.warning) {
        statusColor = 'bg-yellow-100 text-yellow-800';
      }
    }
    
    if (severity) {
      if (severity === 'critical') {
        statusColor = 'bg-red-100 text-red-800';
      } else if (severity === 'warning') {
        statusColor = 'bg-yellow-100 text-yellow-800';
      }
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {icon && (
            <span className="text-gray-400">
              <i className={`fas fa-${icon}`}></i>
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold">
            {value}
            {unit && <span className="text-sm ml-1">{unit}</span>}
          </p>
          {total && (
            <p className="text-sm text-gray-500 ml-2">/ {total}</p>
          )}
        </div>
        {trend && (
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
              trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  // 실시간 알림 패널
  const AlertPanel = ({ alerts }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">실시간 알림</h3>
      <div className="space-y-3">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`p-3 rounded border-l-4 ${
              alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
              alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm text-gray-600">{alert.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              {alert.severity === 'critical' && (
                <button 
                  onClick={() => handleCriticalAlert(alert)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  대응
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 자동 보고서 시스템 제어
  const toggleAutoReporting = () => {
    if (autoReportingActive) {
      autoReportTrigger.current.stopAutoReporting();
    } else {
      autoReportTrigger.current.startAutoReporting();
    }
    setAutoReportingActive(!autoReportingActive);
  };

  // Display loading indicator
  if (loading && servers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Display error message
  if (error && servers.length === 0) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
        <p className="font-bold">오류</p>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">시스템 모니터링 대시보드</h1>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            systemHealth?.overall_status === 'good' 
              ? 'bg-green-100 text-green-800' 
              : systemHealth?.overall_status === 'warning' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
          }`}>
            {systemHealth?.overall_status === 'good' ? '정상' : 
             systemHealth?.overall_status === 'warning' ? '주의' : '경고'}
          </span>
          
          {/* 자동 보고서 시스템 상태 추가 */}
          <button
            onClick={toggleAutoReporting}
            className={`px-3 py-1 rounded-full text-sm ${
              autoReportingActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            🤖 {autoReportingActive ? '자동분석 ON' : '자동분석 OFF'}
          </button>
          
          <Link to="/auto-reports" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            📋 보고서 보기
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <PerformanceMetrics data={systemHealth} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertPanel alerts={alertHistory} />
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">AI 분석 결과</h3>
              {realtimeAnalysis?.response ? (
                <div className="prose max-w-none">
                  <p>{realtimeAnalysis.response}</p>
                  {realtimeAnalysis.recommendations && (
                    <div className="mt-4">
                      <h4 className="font-medium">권장 조치:</h4>
                      <ul className="list-disc list-inside">
                        {realtimeAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">분석 중...</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="xl:col-span-1">
          <div className="h-full">
            <AIChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 