import React, { Component } from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    localStorage.removeItem('token');
    this.props.navigate('/'); // Redirect to login on error
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Redirecting to login...</h1>;
    }
    return this.props.children;
  }
}

// Wrapper to use hooks in a class component
const ErrorBoundaryWithNavigate = (props) => {
  const navigate = useNavigate();
  return <ErrorBoundary {...props} navigate={navigate} />;
};

export default ErrorBoundaryWithNavigate;