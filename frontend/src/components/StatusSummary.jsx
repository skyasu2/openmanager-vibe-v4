import React, { useMemo } from 'react';

const StatusSummary = ({ servers = [] }) => {
  // 서버 상태 요약 계산
  const summary = useMemo(() => {
    const result = {
      total: servers.length,
      normal: 0,
      warning: 0,
      critical: 0,
      percentNormal: 0,
      percentWarning: 0,
      percentCritical: 0
    };
    
    servers.forEach(server => {
      if (server.status === 'normal') {
        result.normal += 1;
      } else if (server.status === 'warning') {
        result.warning += 1;
      } else if (server.status === 'critical') {
        result.critical += 1;
      }
    });
    
    if (result.total > 0) {
      result.percentNormal = Math.round((result.normal / result.total) * 100);
      result.percentWarning = Math.round((result.warning / result.total) * 100);
      result.percentCritical = Math.round((result.critical / result.total) * 100);
    }
    
    return result;
  }, [servers]);
  
  return (
    <div className="status-summary">
      <h2>서버 상태 요약</h2>
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-title">전체 서버</div>
          <div className="card-value">{summary.total}</div>
        </div>
        
        <div className="summary-card normal">
          <div className="card-title">정상</div>
          <div className="card-value">{summary.normal}</div>
          <div className="card-percent">{summary.percentNormal}%</div>
        </div>
        
        <div className="summary-card warning">
          <div className="card-title">경고</div>
          <div className="card-value">{summary.warning}</div>
          <div className="card-percent">{summary.percentWarning}%</div>
        </div>
        
        <div className="summary-card critical">
          <div className="card-title">심각</div>
          <div className="card-value">{summary.critical}</div>
          <div className="card-percent">{summary.percentCritical}%</div>
        </div>
      </div>
    </div>
  );
};

export default StatusSummary; 