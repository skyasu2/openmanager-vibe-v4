import React, { useState, useEffect, useRef } from 'react';
import EventBus from '../services/EventBus';
import MCPService from '../services/MCPService';

const AIProcessor = () => {
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [responses, setResponses] = useState([]);
  const chatEndRef = useRef(null);
  
  // 채팅 스크롤 맨 아래로 이동
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responses]);

  // 이벤트 구독
  useEffect(() => {
    // 에러 이벤트 구독
    const errorUnsubscribe = EventBus.subscribe('error', handleError);
    
    // 컨텍스트 업데이트 이벤트 구독
    const contextUnsubscribe = EventBus.subscribe('context:updated', handleContextUpdate);
    
    return () => {
      errorUnsubscribe();
      contextUnsubscribe();
    };
  }, []);
  
  // 에러 처리 함수
  const handleError = (errorData) => {
    console.error('에러 발생:', errorData);
    
    // 에러 발생 시 응답 추가
    setResponses(prev => [...prev, {
      type: 'error',
      content: `오류가 발생했습니다: ${errorData.message || '알 수 없는 오류'}`,
      timestamp: new Date().toISOString()
    }]);
    
    setProcessing(false);
  };
  
  // 컨텍스트 업데이트 처리
  const handleContextUpdate = (context) => {
    console.log('컨텍스트 업데이트:', context);
  };
  
  // 쿼리 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // 사용자 질의 추가
    setResponses(prev => [...prev, {
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    }]);
    
    // 로딩 메시지 추가
    setResponses(prev => [...prev, {
      type: 'loading',
      content: '분석 중입니다...',
      timestamp: new Date().toISOString()
    }]);
    
    setProcessing(true);
    
    try {
      // 실제 API 호출 (개발 중에는 주석 처리)
      // const response = await MCPService.processQuery(query);
      
      // 개발용 Mock 응답
      const mockResponse = MCPService.getMockResponse(query);
      
      // 로딩 메시지 제거하고 실제 응답 추가
      setResponses(prev => {
        const filtered = prev.filter(item => item.type !== 'loading');
        return [...filtered, {
          type: 'ai',
          content: mockResponse.answer,
          data: mockResponse,
          timestamp: mockResponse.timestamp || new Date().toISOString()
        }];
      });
      
      // 응답 이벤트 발행
      if (mockResponse.related_servers) {
        EventBus.publish('ai:response-received', {
          related_servers: mockResponse.related_servers,
          ...mockResponse
        });
      }
      
    } catch (error) {
      // 에러 이벤트 발행
      EventBus.publish('error', {
        source: 'ai-processor',
        message: 'AI 쿼리 처리 중 오류 발생',
        details: error.message
      });
    } finally {
      setProcessing(false);
      setQuery('');
    }
  };
  
  return (
    <div className="ai-processor w-full bg-white rounded-lg shadow-md p-4 max-h-[600px] flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">서버 모니터링 어시스턴트</h2>
      
      {/* 채팅 메시지 영역 */}
      <div className="chat-area flex-1 overflow-y-auto mb-4 p-2">
        {responses.length === 0 ? (
          <div className="text-center text-gray-500 italic py-10">
            <p>서버 상태, 성능 또는 문제점에 대해 질문해보세요.</p>
            <p className="mt-2 text-sm">예: "어제 어떤 장애가 있었어?" 또는 "현재 서버 상태는 어때?"</p>
          </div>
        ) : (
          responses.map((item, index) => (
            <div key={index} className={`mb-4 ${item.type === 'user' ? 'text-right' : 'text-left'}`}>
              {item.type === 'user' && (
                <div className="inline-block bg-blue-500 text-white rounded-lg py-2 px-4 max-w-[80%]">
                  {item.content}
                </div>
              )}
              
              {item.type === 'ai' && (
                <div className="inline-block bg-gray-100 text-gray-800 rounded-lg py-2 px-4 max-w-[80%]">
                  {item.content}
                  
                  {item.data && item.data.suggestions && item.data.suggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">추천 작업:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.data.suggestions.map((suggestion, idx) => (
                          <button 
                            key={idx}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded-full"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {item.type === 'loading' && (
                <div className="inline-block bg-gray-100 text-gray-600 rounded-lg py-2 px-4">
                  <div className="flex items-center">
                    <div className="dot-flashing mr-2"></div>
                    {item.content}
                  </div>
                </div>
              )}
              
              {item.type === 'error' && (
                <div className="inline-block bg-red-100 text-red-600 rounded-lg py-2 px-4">
                  {item.content}
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {new Date(item.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* 쿼리 입력 폼 */}
      <form onSubmit={handleSubmit} className="query-form mt-auto">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="질문이나 명령을 입력하세요..."
            disabled={processing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={processing || !query.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:bg-blue-300"
          >
            {processing ? '처리 중...' : '질문하기'}
          </button>
        </div>
      </form>
      
      {/* 로딩 애니메이션 스타일 */}
      <style jsx>{`
        .dot-flashing {
          position: relative;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #9880ff;
          color: #9880ff;
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0.5s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -15px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #9880ff;
          color: #9880ff;
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 15px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #9880ff;
          color: #9880ff;
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 1s;
        }
        
        @keyframes dot-flashing {
          0% {
            background-color: #9880ff;
          }
          50%, 100% {
            background-color: rgba(152, 128, 255, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default AIProcessor; 