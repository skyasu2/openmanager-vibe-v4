import React from 'react';
import Dashboard from '../components/Dashboard';
import AIProcessor from '../components/AIProcessor';
import ServerDetail from '../components/ServerDetail';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="left-panel">
        <Dashboard />
      </div>
      
      <div className="right-panel">
        <ServerDetail />
        <AIProcessor />
      </div>
    </div>
  );
};

export default DashboardPage; 