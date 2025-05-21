import React from 'react';

const ServerCard = ({ server, isSelected, onSelect }) => {
  const { hostname, status, cpu, memory, disk } = server;
  
  return (
    <div 
      className={`server-card status-${status} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="server-name">{hostname}</div>
      <div className="server-metrics">
        <div className="metric">
          <span className="label">CPU</span>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${cpu}%` }}
            ></div>
          </div>
          <span className="value">{cpu}%</span>
        </div>
        
        <div className="metric">
          <span className="label">Memory</span>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${memory}%` }}
            ></div>
          </div>
          <span className="value">{memory}%</span>
        </div>
        
        <div className="metric">
          <span className="label">Disk</span>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${disk}%` }}
            ></div>
          </div>
          <span className="value">{disk}%</span>
        </div>
      </div>
    </div>
  );
};

export default ServerCard; 