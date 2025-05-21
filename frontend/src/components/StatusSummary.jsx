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
      <h2 className="text-lg font-semibold text-gray-800 mb-3">서버 상태 요약</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 font-medium">전체 서버</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 font-medium">정상</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{summary.normal}</div>
          <div className="text-sm text-green-600 font-medium">{summary.percentNormal}%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 font-medium">경고</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{summary.warning}</div>
          <div className="text-sm text-yellow-600 font-medium">{summary.percentWarning}%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 font-medium">심각</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{summary.critical}</div>
          <div className="text-sm text-red-600 font-medium">{summary.percentCritical}%</div>
        </div>
      </div>
      
      {/* 상태 프로그레스 바 */}
      {summary.total > 0 && (
        <div className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="flex h-full">
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${summary.percentNormal}%` }}
            ></div>
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${summary.percentWarning}%` }}
            ></div>
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${summary.percentCritical}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusSummary; 