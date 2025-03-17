import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Ensures httpOnly refreshToken cookie is sent
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request setup error:', error.message);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];
let isRedirecting = false; // Global flag to prevent retries during redirect

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip if already redirecting
    if (isRedirecting) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Attempting to refresh access token with httpOnly cookie');
        const res = await axiosInstance.post('/auth/refresh', {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken;
        console.log('New access token generated:', newAccessToken);

        localStorage.setItem('token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.log('Refresh token failure on HTTPS:', {
          message: refreshErr.response?.data?.msg || refreshErr.message,
          status: refreshErr.response?.status,
          url: refreshErr.config?.url,
        });

        // Clear state to prevent retries
        localStorage.removeItem('token');
        isRefreshing = false;
        failedQueue = [];
        isRedirecting = true; // Set flag to prevent further requests

        // Immediate and synchronous redirect
        if (window.location.pathname !== '/') {
          console.log('Forcing logout and redirect to login page on HTTPS');
          window.location.href = '/'; // Synchronous redirect
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    console.log('Request failed on HTTPS:', error.response?.data?.msg || error.message);
    return Promise.reject(error);
  }
);

// Utility function to validate session
export const validateSession = async () => {
  try {
    const res = await axiosInstance.get('/auth/validate-session', { withCredentials: true });
    console.log('Session validation response:', res.data);
    return res.data.msg === 'Session valid';
  } catch (err) {
    console.error('Session validation failed:', err.message);
    return false;
  }
};

export default axiosInstance;