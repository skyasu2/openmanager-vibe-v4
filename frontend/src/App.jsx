import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import PageTransition from './components/PageTransition';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ServerDetailPage from './pages/ServerDetailPage';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import './styles/App.css';
import './styles/theme.css';
import './styles/Navigation.css';
import './styles/Pages.css';
import './styles/ServerDetail.css';
import './styles/Auth.css';

// 애니메이션된 라우트 컴포넌트
const AnimatedRoutes = () => {
  const location = useLocation();
  const { darkMode } = useAppContext();
  
  // 다크 모드 토글 시 HTML 속성 변경
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    );
  }, [darkMode]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* 공개 라우트 */}
          <Route path="/login" element={
            <PageTransition keyValue={location.pathname}>
              <LoginPage />
            </PageTransition>
          } />
          <Route path="/unauthorized" element={
            <PageTransition keyValue={location.pathname}>
              <UnauthorizedPage />
            </PageTransition>
          } />
          
          {/* 보호된 라우트 */}
          <Route path="/" element={
            <ProtectedRoute>
              <>
                <Navigation />
                <main className="app-content">
                  <PageTransition keyValue={location.pathname}>
                    <DashboardPage />
                  </PageTransition>
                </main>
                <footer className="app-footer">
                  <p>OpenManager Vibe V4 &copy; 2025</p>
                </footer>
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <>
                <Navigation />
                <main className="app-content">
                  <PageTransition keyValue={location.pathname}>
                    <AnalyticsPage />
                  </PageTransition>
                </main>
                <footer className="app-footer">
                  <p>OpenManager Vibe V4 &copy; 2025</p>
                </footer>
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute requiredRole="admin">
              <>
                <Navigation />
                <main className="app-content">
                  <PageTransition keyValue={location.pathname}>
                    <SettingsPage />
                  </PageTransition>
                </main>
                <footer className="app-footer">
                  <p>OpenManager Vibe V4 &copy; 2025</p>
                </footer>
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/servers/:id" element={
            <ProtectedRoute>
              <>
                <Navigation />
                <main className="app-content">
                  <PageTransition keyValue={location.pathname}>
                    <ServerDetailPage />
                  </PageTransition>
                </main>
                <footer className="app-footer">
                  <p>OpenManager Vibe V4 &copy; 2025</p>
                </footer>
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
};

// 앱 내부 컴포넌트
const AppContent = () => {
  return (
    <div className="app">
      <Router>
        <AnimatedRoutes />
      </Router>
    </div>
  );
};

// 메인 앱 컴포넌트 (컨텍스트 프로바이더 포함)
function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
}

export default App; 