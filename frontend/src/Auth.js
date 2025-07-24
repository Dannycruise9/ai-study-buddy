// frontend/src/Auth.js

import React, { useState } from 'react'; // Correct
import { supabase } from './supabaseClient';
import './Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  // Google Sign-In Handler (no changes needed)
  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      setMessage(error.error_description || error.message);
      setLoading(false);
    }
  }

  // Main Handler for Email/Password Auth
  const handleAuthWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      if (isLogin) {
        // Login Logic
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange in App.js handles the redirect

      } else {
        // Sign Up Logic
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // Immediately sign the new user in (requires email confirmation to be disabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (error) {
      // --- NEW ERROR HANDLING TO DETECT EXISTING USERS ---
      if (error.message && error.message.includes("User already registered")) {
        setMessage("An account with this email already exists. Please sign in.");
        setIsLogin(true); // Automatically switch to the sign-in form
      } else {
        // Handle all other errors (e.g., "Invalid login credentials", "Password should be at least 6 characters")
        setMessage(error.error_description || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for toggling the form
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <h1>📚 Study Smarter, Not Harder</h1>
      <p className="auth-description">
        {isLogin 
          ? 'Sign in to continue to your dashboard.' 
          : 'Create an account to get started.'
        }
      </p>

      {/* Google Sign In Button */}
      <button onClick={signInWithGoogle} className="google-signin-button" disabled={loading}>
        {/* SVG and text here */}
        Sign in with Google
      </button>

      <div className="divider"><span>OR</span></div>
      
      {/* Email/Password Form */}
      <form onSubmit={handleAuthWithEmail} className="auth-form">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Your password"
          value={password}
          required
          minLength="6"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      {message && <p className="auth-message">{message}</p>}
      
      <button onClick={toggleForm} className="toggle-auth" disabled={loading}>
        {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
      </button>
    </div>
  );
};

export default Auth;