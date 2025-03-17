import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    if (window.location.pathname !== '/') {
      console.log('Redirecting to login due to logout');
      window.location.href = '/'; // Force redirect to login
    }
  };

  useEffect(() => {
    if (!isLoggedIn && window.location.pathname !== '/') {
      console.log('Redirecting to login because user is not logged in');
      window.location.href = '/';
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);