import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import AIProcessor from '../components/AIProcessor';
import ServerDetail from '../components/ServerDetail';

const DashboardPage = () => {
  const [showAIChat, setShowAIChat] = useState(true);
  
  return (
    <div className="dashboard-page bg-gray-50 min-h-screen">
      {/* 상단 AI 질의 영역 - 모바일에서는 토글 가능 */}
      <div className="lg:hidden p-4">
        <button 
          onClick={() => setShowAIChat(!showAIChat)}
          className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center"
        >
          <span className="font-medium text-gray-700">
            {showAIChat ? '서버 목록 보기' : 'AI 어시스턴트 보기'}
          </span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showAIChat ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}></path>
          </svg>
        </button>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측 대시보드 패널 */}
          <div className={`lg:col-span-2 ${showAIChat ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-lg shadow-md p-4">
              <Dashboard />
            </div>
            
            {/* 서버 상세 정보 패널 */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
              <ServerDetail />
            </div>
          </div>
          
          {/* 우측 AI 프로세서 패널 */}
          <div className={`lg:col-span-1 ${showAIChat ? 'block' : 'hidden lg:block'}`}>
            <AIProcessor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 