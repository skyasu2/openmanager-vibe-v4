import React, { useState, useRef, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import AIProcessor from '../components/AIProcessor';
import ServerDetail from '../components/ServerDetail';

const DashboardPage = () => {
  const [showAIChat, setShowAIChat] = useState(true);
  
  // 자연어 질의 관련 상태
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 메시지 목록이 업데이트될 때마다 스크롤을 최신 메시지로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // MCP 서버에 질의 요청
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // 사용자 질문 추가
    setMessages(prev => [...prev, {
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    }]);
    
    // 로딩 상태 설정
    setIsLoading(true);
    
    try {
      const MCP_URL = process.env.REACT_APP_MCP_URL || 'https://mcp-server.onrender.com';
      
      const response = await fetch(`${MCP_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }
      
      const data = await response.json();
      
      // MCP 응답 추가
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.answer,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      // 오류 메시지 추가
      setMessages(prev => [...prev, {
        type: 'error',
        content: `오류가 발생했습니다: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      setQuery(''); // 입력창 비우기
    }
  };
  
  return (
    <div className="dashboard-page bg-gray-50 min-h-screen">
      {/* 상단 자연어 질의 섹션 */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="서버 상태나 장애에 대해 질문해보세요 (예: '어제 어떤 장애 있었어?')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition-colors disabled:bg-blue-300"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? '분석 중...' : '질문하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 메시지 목록 */}
      {(messages.length > 0 || isLoading) && (
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : message.type === 'error'
                          ? 'bg-red-100 border border-red-200 text-red-700'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 로딩 메시지 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 text-gray-500 px-4 py-2 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">분석 중입니다...</div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 자동 스크롤을 위한 참조 */}
              <div ref={messagesEndRef}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* 기존 AI 질의 영역 토글 - 모바일에서만 */}
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
      
      {/* 기존 대시보드 레이아웃 */}
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