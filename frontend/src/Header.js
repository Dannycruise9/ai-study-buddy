// frontend/src/Header.js
import React from 'react';
import { supabase } from './supabaseClient';
import './Header.css';

const Header = ({ session }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="app-header-nav">
      <div className="header-title">
        <h1>📚 AI Study Buddy</h1>
      </div>
      {session && (
        <div className="header-user-info">
          <span>{session.user.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;