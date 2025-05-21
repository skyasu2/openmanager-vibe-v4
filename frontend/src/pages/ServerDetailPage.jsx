import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ServerDataService from '../services/ServerDataService';

const ServerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { servers } = useAppContext();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServerDetails = async () => {
      try {
        setLoading(true);
        const data = await ServerDataService.getServerById(id);
        setServer(data);
        setLoading(false);
      } catch (err) {
        setError('서버 정보를 불러올 수 없습니다.');
        setLoading(false);
      }
    };

    fetchServerDetails();
  }, [id]);

  if (loading) {
    return <div className="loading-spinner">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!server) {
    return (
      <div className="server-not-found">
        <h2>서버를 찾을 수 없습니다</h2>
        <p>ID: {id}에 해당하는 서버가 존재하지 않습니다.</p>
        <button onClick={() => navigate('/analytics')} className="back-button">
          분석 페이지로 돌아가기
        </button>
      </div>
    );
  }

  // 상태에 따른 스타일 클래스
  const statusClass = {
    normal: 'status-normal',
    warning: 'status-warning',
    critical: 'status-critical'
  }[server.status] || '';

  return (
    <div className="server-detail-page">
      <div className="server-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← 뒤로 가기
        </button>
        <h2>{server.hostname}</h2>
        <span className={`server-status ${statusClass}`}>
          {server.status === 'normal' && '정상'}
          {server.status === 'warning' && '경고'}
          {server.status === 'critical' && '심각'}
        </span>
      </div>

      <div className="server-detail-content">
        <div className="server-info-card">
          <h3>기본 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">서버 ID</span>
              <span className="value">{server.id}</span>
            </div>
            <div className="info-item">
              <span className="label">IP 주소</span>
              <span className="value">{server.ipAddress}</span>
            </div>
            <div className="info-item">
              <span className="label">업타임</span>
              <span className="value">{server.uptime}</span>
            </div>
            <div className="info-item">
              <span className="label">마지막 확인</span>
              <span className="value">
                {new Date(server.lastChecked).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        <div className="server-metrics-card">
          <h3>리소스 사용량</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <h4>CPU</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${server.cpu}%`,
                    backgroundColor: server.cpu > 80 ? '#ff4d4f' : 
                                     server.cpu > 60 ? '#faad14' : '#52c41a'
                  }}
                ></div>
              </div>
              <span className="metric-value">{server.cpu}%</span>
            </div>
            <div className="metric-item">
              <h4>메모리</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${server.memory}%`,
                    backgroundColor: server.memory > 80 ? '#ff4d4f' : 
                                     server.memory > 60 ? '#faad14' : '#52c41a'
                  }}
                ></div>
              </div>
              <span className="metric-value">{server.memory}%</span>
            </div>
            <div className="metric-item">
              <h4>디스크</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${server.disk}%`,
                    backgroundColor: server.disk > 80 ? '#ff4d4f' : 
                                     server.disk > 60 ? '#faad14' : '#52c41a'
                  }}
                ></div>
              </div>
              <span className="metric-value">{server.disk}%</span>
            </div>
          </div>
        </div>

        <div className="server-services-card">
          <h3>실행 중인 서비스</h3>
          <ul className="services-list">
            {server.services.map((service, index) => (
              <li key={index} className="service-item">{service}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServerDetailPage; 