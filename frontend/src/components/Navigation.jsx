import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';

const Navigation = () => {
  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <h1>OpenManager Vibe V4</h1>
      </div>
      
      <div className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
          end
        >
          대시보드
        </NavLink>
        
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          분석
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          설정
        </NavLink>
      </div>
      
      <div className="nav-actions">
        <ThemeSwitcher />
      </div>
    </nav>
  );
};

export default Navigation; 