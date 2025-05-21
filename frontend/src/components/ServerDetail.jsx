import React, { useState } from 'react';
import ServerMetricsChart from './charts/ServerMetricsChart';
import { useAppContext } from '../context/AppContext';
import useEventBus from '../hooks/useEventBus';

const ServerDetail = () => {
  const { selectedServer } = useAppContext();
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  
  // 서버가 선택되지 않은 경우
  if (!selectedServer) {
    return (
      <div className="server-detail-placeholder">
        <p>Select a server to view details</p>
      </div>
    );
  }
  
  const { id, hostname, status, cpu, memory, disk } = selectedServer;
  
  // 상태에 따른 클래스
  const statusClass = `status-badge ${status}`;
  
  // 메트릭 임계값에 따른 클래스
  const getCpuClass = () => cpu > 80 ? 'critical' : cpu > 60 ? 'warning' : 'normal';
  const getMemoryClass = () => memory > 80 ? 'critical' : memory > 60 ? 'warning' : 'normal';
  const getDiskClass = () => disk > 80 ? 'critical' : disk > 60 ? 'warning' : 'normal';
  
  return (
    <div className="server-detail">
      <header className="server-detail-header">
        <h2>{hostname}</h2>
        <div className={statusClass}>{status}</div>
      </header>
      
      {/* 탭 메뉴 */}
      <div className="detail-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>
      
      {/* 탭 콘텐츠 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-summary">
              <div className="metric">
                <h3>CPU Usage</h3>
                <div className={`metric-value ${getCpuClass()}`}>{cpu}%</div>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${cpu}%` }}></div>
                </div>
              </div>
              
              <div className="metric">
                <h3>Memory Usage</h3>
                <div className={`metric-value ${getMemoryClass()}`}>{memory}%</div>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${memory}%` }}></div>
                </div>
              </div>
              
              <div className="metric">
                <h3>Disk Usage</h3>
                <div className={`metric-value ${getDiskClass()}`}>{disk}%</div>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${disk}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="server-info">
              <table className="info-table">
                <tbody>
                  <tr>
                    <th>Server ID</th>
                    <td>{id}</td>
                  </tr>
                  <tr>
                    <th>Hostname</th>
                    <td>{hostname}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <div className={statusClass}>{status}</div>
                    </td>
                  </tr>
                  <tr>
                    <th>Last Updated</th>
                    <td>{new Date().toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            <div className="time-range-selector">
              <button 
                className={`range-btn ${timeRange === '1h' ? 'active' : ''}`}
                onClick={() => setTimeRange('1h')}
              >
                1 Hour
              </button>
              <button 
                className={`range-btn ${timeRange === '6h' ? 'active' : ''}`}
                onClick={() => setTimeRange('6h')}
              >
                6 Hours
              </button>
              <button 
                className={`range-btn ${timeRange === '24h' ? 'active' : ''}`}
                onClick={() => setTimeRange('24h')}
              >
                24 Hours
              </button>
            </div>
            
            <ServerMetricsChart serverId={id} timeRange={timeRange} />
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="logs-tab">
            <div className="log-filters">
              <select className="log-level-filter">
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              
              <input 
                type="text" 
                className="log-search" 
                placeholder="Search logs..."
              />
            </div>
            
            <div className="logs-container">
              <div className="log-entry info">
                <span className="log-time">[10:15:32]</span>
                <span className="log-level">INFO</span>
                <span className="log-message">System started normally</span>
              </div>
              <div className="log-entry warning">
                <span className="log-time">[10:23:45]</span>
                <span className="log-level">WARNING</span>
                <span className="log-message">High memory usage detected</span>
              </div>
              <div className="log-entry error">
                <span className="log-time">[10:45:12]</span>
                <span className="log-level">ERROR</span>
                <span className="log-message">Connection to database failed</span>
              </div>
              <div className="log-entry info">
                <span className="log-time">[11:02:18]</span>
                <span className="log-level">INFO</span>
                <span className="log-message">Connection restored</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerDetail; 