import React, { useState, useRef, useEffect } from 'react';
import { MCPService } from '../services/MCPService.js';
import { PRODUCTION_CONFIG } from '../config/production.config.js';

const AIChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: '안녕하세요! AI 모니터링 어시스턴트입니다. 서버 상태, 성능 분석, 장애 해결 등에 대해 질문해주세요.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const mcpService = useRef(new MCPService(PRODUCTION_CONFIG));

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await mcpService.current.processQuery(inputMessage);
      
      const aiMessage = {
        type: 'ai',
        content: response.response,
        data: response.data,
        analysis: response.analysis,
        recommendations: response.recommendations,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 엔터키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 추천 질문 클릭
  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  const suggestedQuestions = [
    "현재 문제가 있는 서버가 있나요?",
    "CPU 사용률이 높은 서버를 분석해주세요",
    "네트워크 지연 원인을 조사해주세요",
    "메모리 부족 문제 해결 방법은?",
    "전체 시스템 성능 상태는 어떤가요?"
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold">AI 모니터링 어시스턴트</h3>
        <p className="text-sm opacity-90">서버 모니터링 및 분석을 도와드립니다</p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* AI 분석 결과 표시 */}
              {message.recommendations && message.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="font-medium text-sm">💡 권장 조치:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {message.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec.description}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 추천 질문 */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">💬 추천 질문:</p>
          <div className="space-y-1">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="block w-full text-left text-sm p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력하세요... (예: 현재 서버 상태는 어떤가요?)"
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface; 