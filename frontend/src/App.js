// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import Header from './Header'; // Import Header
import MainContent from './MainContent'; // We will create this next
import './App.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in authentication state (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <Header session={session} />
      <div className="container">
        {/* If no session, show Auth page. Otherwise, show the main content. */}
        {!session ? <Auth /> : <MainContent key={session.user.id} session={session} />}
      </div>
    </div>
  );
}

export default App;