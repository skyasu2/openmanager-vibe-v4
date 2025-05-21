import React, { createContext, useContext, useState, useEffect } from 'react';

// 초기 인증 상태
const initialState = {
  isAuthenticated: false,
  user: null,
  role: null
};

// 컨텍스트 생성
const AuthContext = createContext(initialState);

// 인증 프로바이더 컴포넌트
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    // 저장된 인증 정보 불러오기
    const savedAuth = localStorage.getItem('auth');
    return savedAuth ? JSON.parse(savedAuth) : initialState;
  });

  // 인증 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(authState));
  }, [authState]);

  // 로그인 함수
  const login = async (credentials) => {
    try {
      // 실제 인증 API가 연결되면 아래 주석을 해제
      // const response = await axios.post('/api/auth/login', credentials);
      // const { user, token, role } = response.data;
      
      // 개발용 더미 데이터
      const { username, password } = credentials;
      
      // 간단한 인증 검증 (실제 구현에서는 서버에서 처리)
      if (username === 'admin' && password === 'admin123') {
        // 관리자 계정
        setAuthState({
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'admin',
            name: '관리자',
            email: 'admin@example.com'
          },
          role: 'admin'
        });
        return { success: true };
      } else if (username === 'user' && password === 'user123') {
        // 일반 사용자 계정
        setAuthState({
          isAuthenticated: true,
          user: {
            id: 2,
            username: 'user',
            name: '일반 사용자',
            email: 'user@example.com'
          },
          role: 'user'
        });
        return { success: true };
      }
      
      return { 
        success: false, 
        error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || '로그인 중 오류가 발생했습니다.' 
      };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    // 인증 정보 초기화
    setAuthState(initialState);
    // 로컬 스토리지에서 인증 정보 제거
    localStorage.removeItem('auth');
  };

  // 권한 확인 함수
  const hasPermission = (requiredRole) => {
    if (!authState.isAuthenticated) return false;
    
    // 'admin' 역할은 모든 권한을 가짐
    if (authState.role === 'admin') return true;
    
    // 필요한 역할이 사용자의 역할과 일치하는지 확인
    return authState.role === requiredRole;
  };

  // 컨텍스트 값
  const contextValue = {
    ...authState,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 커스텀 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 