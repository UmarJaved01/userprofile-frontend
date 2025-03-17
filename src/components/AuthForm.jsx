// src/components/AuthForm.jsx
import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Import axiosInstance
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isSignup ? '/auth/signup' : '/auth/login';
      const data = isSignup
        ? formData
        : { identifier: formData.email || formData.username, password: formData.password };
      const res = await axiosInstance.post(url, data); // Use axiosInstance

      if (isSignup) {
        alert(res.data.msg); // Show success message
        setIsSignup(false); // Switch to login form
        setFormData({ username: '', email: '', password: '', confirmPassword: '' }); // Reset form
      } else {
        localStorage.setItem('token', res.data.accessToken);
        navigate('/profile');
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.msg || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required={!isSignup && !formData.username}
        />
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {isSignup && (
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <button type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
      </form>
      <p onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
      </p>
    </div>
  );
};

export default AuthForm;