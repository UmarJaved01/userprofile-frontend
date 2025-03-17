import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Profile from './components/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import './style.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route
            path="/profile"
            element={token ? <Profile /> : <Navigate to="/" replace />}
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;