import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Profile from './components/Profile';
import './style.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setupAxiosInstance } from './utils/axiosInstance';
import { useEffect } from 'react';

function AppContent() {
  const { logout, isLoggedIn } = useAuth();

  useEffect(() => {
    setupAxiosInstance(logout); // Set up axios with the logout function
  }, [logout]);

  return (
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route
        path="/profile"
        element={isLoggedIn ? <Profile /> : <AuthForm />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;