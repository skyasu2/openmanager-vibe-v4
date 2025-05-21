import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * 보호된 라우트 컴포넌트
 * 인증이 필요한 페이지에 대한 접근을 제어합니다.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
 * @param {string} [props.requiredRole] - 필요한 권한 (옵션)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  // 인증되지 않은 경우 로그인 페이지로 리디렉션
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 권한이 필요한 경우 권한 확인
  if (requiredRole && !hasPermission(requiredRole)) {
    // 권한이 없는 경우 거부 페이지로 리디렉션
    return <Navigate to="/unauthorized" replace />;
  }

  // 인증 및 권한 검사를 통과한 경우 자식 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute; 