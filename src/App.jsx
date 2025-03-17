import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Profile from './components/Profile';
import axiosInstance from './utils/axiosInstance';
import './style.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isSessionValid, setIsSessionValid] = useState(true);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };

    const validateSession = async () => {
      try {
        await axiosInstance.get('/profile'); // Use a protected route to validate
        setIsSessionValid(true);
      } catch (err) {
        console.log('Session validation failed:', err.message);
        setIsSessionValid(false);
        localStorage.removeItem('token'); // Clear token if session is invalid
        setToken(null);
      }
    };

    handleStorageChange();
    validateSession(); // Initial validation
    const interval = setInterval(validateSession, 15000); // Check every 15 seconds

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route
          path="/profile"
          element={token && isSessionValid ? <Profile /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;