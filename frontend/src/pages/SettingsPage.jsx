import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

const SettingsPage = () => {
  const { darkMode, toggleDarkMode } = useAppContext();
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 여기서 설정을 저장하는 로직을 구현
    localStorage.setItem('refreshInterval', refreshInterval);
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
    
    // 저장 성공 메시지 표시
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };
  
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h2 className="settings-title">애플리케이션 설정</h2>
        
        {savedSettings && (
          <div className="settings-saved-message">
            설정이 성공적으로 저장되었습니다!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h3>테마 설정</h3>
            <div className="setting-item">
              <label>다크 모드</label>
              <div className="toggle-container">
                <span>{darkMode ? '켜짐' : '꺼짐'}</span>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>데이터 갱신 설정</h3>
            <div className="setting-item">
              <label htmlFor="refresh-interval">갱신 주기 (초)</label>
              <input
                id="refresh-interval"
                type="number"
                min="5"
                max="300"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="settings-section">
            <h3>알림 설정</h3>
            <div className="setting-item">
              <label htmlFor="notifications">브라우저 알림</label>
              <input
                id="notifications"
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            </div>
          </div>
          
          <button type="submit" className="settings-save-btn">
            설정 저장
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage; 