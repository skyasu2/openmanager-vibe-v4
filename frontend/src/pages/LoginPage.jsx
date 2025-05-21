import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 리디렉션 경로 (기본값: 대시보드)
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('사용자 이름과 비밀번호를 모두 입력하세요.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // 로그인 시도
      const result = await login({ username, password });
      
      if (result.success) {
        // 로그인 성공 - 이전 페이지 또는 홈으로 리디렉션
        navigate(from, { replace: true });
      } else {
        // 로그인 실패
        setError(result.error);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 나중에 다시 시도하세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">OpenManager Vibe V4</h2>
        <p className="login-subtitle">로그인하여 서버 대시보드에 접속하세요</p>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">사용자 이름</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자 이름 입력"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="login-info">
          <p>테스트 계정:</p>
          <ul>
            <li>관리자: admin / admin123</li>
            <li>사용자: user / user123</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 