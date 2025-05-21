import React from 'react';

const ServerCard = ({ server, isSelected, onSelect }) => {
  const { hostname, status, cpu, memory, disk, ipAddress } = server;
  
  // 상태에 따른 색상 클래스 설정
  const statusColors = {
    normal: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-800',
      label: '정상'
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      label: '경고'
    },
    critical: {
      bg: 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-800',
      label: '심각'
    }
  };
  
  const statusColor = statusColors[status] || statusColors.normal;
  
  // 리소스 사용량에 따른 색상 계산
  const getResourceColor = (value) => {
    if (value >= 90) return 'bg-red-500';
    if (value >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div 
      className={`border rounded-lg shadow-sm p-4 cursor-pointer transition-all 
        ${isSelected ? 'ring-2 ring-blue-500' : ''} 
        ${statusColor.border} ${statusColor.bg}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{hostname}</h3>
          <p className="text-xs text-gray-600">{ipAddress}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor.text} bg-white/60`}>
          {statusColor.label}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-sm">
          <span className="w-12 text-gray-600">CPU</span>
          <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full ${getResourceColor(cpu)}`}
              style={{ width: `${cpu}%` }}
            ></div>
          </div>
          <span className={`text-xs font-medium ${cpu >= 90 ? 'text-red-600' : cpu >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
            {cpu}%
          </span>
        </div>
        
        <div className="flex items-center text-sm">
          <span className="w-12 text-gray-600">메모리</span>
          <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full ${getResourceColor(memory)}`}
              style={{ width: `${memory}%` }}
            ></div>
          </div>
          <span className={`text-xs font-medium ${memory >= 90 ? 'text-red-600' : memory >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
            {memory}%
          </span>
        </div>
        
        <div className="flex items-center text-sm">
          <span className="w-12 text-gray-600">디스크</span>
          <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full ${getResourceColor(disk)}`}
              style={{ width: `${disk}%` }}
            ></div>
          </div>
          <span className={`text-xs font-medium ${disk >= 90 ? 'text-red-600' : disk >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
            {disk}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ServerCard; 