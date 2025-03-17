import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    if (window.location.pathname !== '/') {
      console.log('Redirecting to login due to logout');
      window.location.href = '/';
    }
  };

  useEffect(() => {
    if (!isLoggedIn && window.location.pathname !== '/') {
      console.log('Redirecting to login because user is not logged in');
      window.location.href = '/';
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);