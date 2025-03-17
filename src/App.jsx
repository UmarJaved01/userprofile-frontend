import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Profile from './components/Profile';
import ErrorBoundary from './components/ErrorBoundary'; // Assuming you created this file
import './style.css';

function App() {
  const token = localStorage.getItem('token');

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