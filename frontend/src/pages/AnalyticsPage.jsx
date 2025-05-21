import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage = () => {
  const { servers } = useAppContext();
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('overview');
  const navigate = useNavigate();
  
  // 상태 분포 데이터 계산
  const getStatusDistribution = () => {
    const counts = { normal: 0, warning: 0, critical: 0 };
    
    servers.forEach(server => {
      counts[server.status] = (counts[server.status] || 0) + 1;
    });
    
    return {
      labels: ['정상', '경고', '심각'],
      datasets: [
        {
          data: [counts.normal, counts.warning, counts.critical],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // 리소스 사용량 평균 계산
  const getResourceUsageData = () => {
    const serverTypes = ['web', 'app', 'db', 'cache'];
    const cpuData = [];
    const memoryData = [];
    const diskData = [];
    
    // 서버 타입별 평균 리소스 사용량 계산
    serverTypes.forEach(type => {
      const serversOfType = servers.filter(s => s.hostname.includes(type));
      
      if (serversOfType.length > 0) {
        const avgCpu = serversOfType.reduce((sum, s) => sum + s.cpu, 0) / serversOfType.length;
        const avgMemory = serversOfType.reduce((sum, s) => sum + s.memory, 0) / serversOfType.length;
        const avgDisk = serversOfType.reduce((sum, s) => sum + s.disk, 0) / serversOfType.length;
        
        cpuData.push(avgCpu);
        memoryData.push(avgMemory);
        diskData.push(avgDisk);
      } else {
        cpuData.push(0);
        memoryData.push(0);
        diskData.push(0);
      }
    });
    
    return {
      labels: ['웹 서버', '애플리케이션 서버', '데이터베이스 서버', '캐시 서버'],
      datasets: [
        {
          label: 'CPU 사용량 (%)',
          data: cpuData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
        {
          label: '메모리 사용량 (%)',
          data: memoryData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: '디스크 사용량 (%)',
          data: diskData,
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
        },
      ],
    };
  };
  
  // 시간별 사용량 트렌드 데이터 (예시 데이터)
  const getTrendData = () => {
    // 시간 범위에 따른 라벨 생성
    const labels = {
      '24h': Array.from({ length: 24 }, (_, i) => `${i}:00`),
      '7d': Array.from({ length: 7 }, (_, i) => ['일', '월', '화', '수', '목', '금', '토'][(new Date().getDay() + i) % 7] + '요일'),
      '30d': Array.from({ length: 30 }, (_, i) => `${i+1}일`)
    };
    
    // 예시 데이터 생성
    const generateTrendData = (base, variance, length) => {
      return Array.from({ length }, () => base + Math.random() * variance - variance/2);
    };
    
    return {
      labels: labels[timeRange],
      datasets: [
        {
          label: '평균 CPU 사용량 (%)',
          data: generateTrendData(50, 30, labels[timeRange].length),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
          fill: true,
        },
        {
          label: '평균 메모리 사용량 (%)',
          data: generateTrendData(60, 20, labels[timeRange].length),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };
  
  // 서버 상세 페이지로 이동
  const handleServerClick = (serverId) => {
    navigate(`/servers/${serverId}`);
  };
  
  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h2>서버 분석</h2>
        
        <div className="analytics-controls">
          <div className="chart-type-selector">
            <button 
              className={`chart-btn ${chartType === 'overview' ? 'active' : ''}`} 
              onClick={() => setChartType('overview')}
            >
              개요
            </button>
            <button 
              className={`chart-btn ${chartType === 'resources' ? 'active' : ''}`} 
              onClick={() => setChartType('resources')}
            >
              리소스 사용량
            </button>
            <button 
              className={`chart-btn ${chartType === 'trends' ? 'active' : ''}`} 
              onClick={() => setChartType('trends')}
            >
              트렌드
            </button>
            <button 
              className={`chart-btn ${chartType === 'servers' ? 'active' : ''}`} 
              onClick={() => setChartType('servers')}
            >
              서버 목록
            </button>
          </div>
          
          {chartType === 'trends' && (
            <div className="time-range-selector">
              <button 
                className={`range-btn ${timeRange === '24h' ? 'active' : ''}`}
                onClick={() => setTimeRange('24h')}
              >
                24시간
              </button>
              <button 
                className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
                onClick={() => setTimeRange('7d')}
              >
                7일
              </button>
              <button 
                className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
                onClick={() => setTimeRange('30d')}
              >
                30일
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="analytics-content">
        {chartType === 'overview' && (
          <div className="overview-charts">
            <div className="chart-wrapper">
              <h3>서버 상태 분포</h3>
              <div style={{ height: '300px' }}>
                <Pie data={getStatusDistribution()} />
              </div>
            </div>
            <div className="chart-wrapper">
              <h3>최근 인시던트</h3>
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th>서버</th>
                    <th>시간</th>
                    <th>유형</th>
                    <th>심각도</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <button 
                        className="server-link" 
                        onClick={() => handleServerClick('web-02')}
                      >
                        web-02
                      </button>
                    </td>
                    <td>10:15 AM</td>
                    <td>CPU 과부하</td>
                    <td><span className="severity warning">경고</span></td>
                  </tr>
                  <tr>
                    <td>
                      <button 
                        className="server-link" 
                        onClick={() => handleServerClick('db-01')}
                      >
                        db-01
                      </button>
                    </td>
                    <td>09:32 AM</td>
                    <td>메모리 부족</td>
                    <td><span className="severity critical">심각</span></td>
                  </tr>
                  <tr>
                    <td>
                      <button 
                        className="server-link" 
                        onClick={() => handleServerClick('app-03')}
                      >
                        app-03
                      </button>
                    </td>
                    <td>Yesterday</td>
                    <td>디스크 공간 부족</td>
                    <td><span className="severity warning">경고</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {chartType === 'resources' && (
          <div className="resources-chart">
            <h3>서버 유형별 리소스 사용량</h3>
            <div style={{ height: '400px' }}>
              <Bar 
                data={getResourceUsageData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: value => `${value}%`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {chartType === 'trends' && (
          <div className="trends-chart">
            <h3>리소스 사용량 트렌드 ({timeRange})</h3>
            <div style={{ height: '400px' }}>
              <Line 
                data={getTrendData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: value => `${value}%`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {chartType === 'servers' && (
          <div className="servers-list">
            <h3>모든 서버</h3>
            <table className="servers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>호스트명</th>
                  <th>IP 주소</th>
                  <th>상태</th>
                  <th>CPU</th>
                  <th>메모리</th>
                  <th>디스크</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(server => (
                  <tr key={server.id}>
                    <td>{server.id}</td>
                    <td>{server.hostname}</td>
                    <td>{server.ipAddress}</td>
                    <td>
                      <span className={`severity ${server.status}`}>
                        {server.status === 'normal' && '정상'}
                        {server.status === 'warning' && '경고'}
                        {server.status === 'critical' && '심각'}
                      </span>
                    </td>
                    <td>{server.cpu}%</td>
                    <td>{server.memory}%</td>
                    <td>{server.disk}%</td>
                    <td>
                      <button 
                        className="detail-btn"
                        onClick={() => handleServerClick(server.id)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage; 