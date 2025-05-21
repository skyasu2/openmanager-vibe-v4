import React from 'react';
import { useAppContext } from '../context/AppContext';

const ThemeSwitcher = () => {
  const { darkMode, toggleDarkMode } = useAppContext();
  
  return (
    <button 
      className={`theme-switch-btn ${darkMode ? 'dark' : 'light'}`}
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <svg className="sun-icon" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm0-11a5.5 5.5 0 0 0 0 11m0-11a5.5 5.5 0 0 1 0 11M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-9.5l-1.414 1.414M5.914 5.914L4.5 4.5m0 15l1.414-1.414m12.172 0L19.5 19.5M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5z" fill="currentColor" />
        </svg>
      ) : (
        <svg className="moon-icon" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
};

export default ThemeSwitcher; 