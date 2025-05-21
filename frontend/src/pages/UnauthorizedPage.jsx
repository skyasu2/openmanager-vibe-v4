import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-icon">
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM11 7h2v7h-2V7zm0 8h2v2h-2v-2z" />
        </svg>
      </div>
      
      <h1>접근 권한이 없습니다</h1>
      <p>
        요청하신 페이지에 접근할 권한이 없습니다. 
        관리자에게 문의하거나 다른 계정으로 로그인하세요.
      </p>
      
      <div className="unauthorized-actions">
        <button 
          onClick={() => navigate('/')} 
          className="home-button"
        >
          홈으로 돌아가기
        </button>
        <button 
          onClick={() => navigate(-1)} 
          className="back-button"
        >
          이전 페이지로
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 