import React, { useState, useEffect } from 'react';
import EventBus from '../services/EventBus';

const AIProcessor = () => {
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  
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
    // 필요시 에러 상태 업데이트 또는 알림 표시
  };
  
  // 컨텍스트 업데이트 처리
  const handleContextUpdate = (context) => {
    console.log('컨텍스트 업데이트:', context);
    // 필요시 컨텍스트 기반으로 UI 업데이트
  };
  
  // 쿼리 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    try {
      setProcessing(true);
      
      // API 호출 시뮬레이션 (실제 구현에서는 실제 API 호출)
      setTimeout(() => {
        const mockResponse = {
          answer: `'${query}'에 대한 분석 결과입니다. 서버 상태는 정상입니다.`,
          related_servers: [1, 3],
          actions: ['서버 로그 확인', '서비스 재시작']
        };
        
        setResponse(mockResponse);
        
        // 응답 이벤트 발행
        EventBus.publish('ai:response-received', mockResponse);
        
        // 히스토리에 추가
        setHistory(prev => [...prev, {
          id: Date.now(),
          query,
          response: mockResponse
        }]);
        
        setProcessing(false);
        setQuery('');
      }, 1500);
    } catch (error) {
      setProcessing(false);
      
      // 에러 이벤트 발행
      EventBus.publish('error', {
        source: 'ai-processor',
        message: 'AI 쿼리 처리 중 오류 발생',
        details: error.message
      });
    }
  };
  
  return (
    <div className="ai-processor">
      <h2>AI 분석 도구</h2>
      
      {/* 쿼리 입력 폼 */}
      <form onSubmit={handleSubmit} className="query-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="질문이나 명령을 입력하세요..."
          disabled={processing}
          className="query-input"
        />
        <button 
          type="submit" 
          disabled={processing || !query.trim()}
          className="query-button"
        >
          {processing ? '처리 중...' : '분석'}
        </button>
      </form>
      
      {/* 응답 표시 영역 */}
      {response && (
        <div className="response-area">
          <h3>응답:</h3>
          <p>{response.answer}</p>
          
          {response.actions && response.actions.length > 0 && (
            <div className="suggested-actions">
              <h4>추천 작업:</h4>
              <ul>
                {response.actions.map((action, index) => (
                  <li key={index}>
                    <button className="action-button">{action}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* 쿼리 히스토리 */}
      {history.length > 0 && (
        <div className="query-history">
          <h3>최근 질의:</h3>
          <ul>
            {history.map(item => (
              <li key={item.id} className="history-item">
                <div className="history-query">{item.query}</div>
                <div className="history-timestamp">
                  {new Date(item.id).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIProcessor; 