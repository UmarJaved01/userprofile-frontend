import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import the context hook

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Inject the logout function (this requires a slight hack since interceptors are static;
// we'll pass it via a custom setup function)
let logoutFunction = () => {}; // Default logout function

export const setupAxiosInstance = (logout) => {
  logoutFunction = logout; // Set the logout function from the context

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  let isRefreshing = false;
  let failedQueue = [];

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
          console.log('Attempting to refresh access token');
          const res = await axiosInstance.post('/auth/refresh', {}, { withCredentials: true });
          const newAccessToken = res.data.accessToken;
          console.log('New access token generated:', newAccessToken);

          localStorage.setItem('token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          console.error('Refresh token failed:', refreshErr.response?.data?.msg || refreshErr.message);
          logoutFunction(); // Trigger global logout
          processQueue(refreshErr, null);
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle any 401 error (e.g., invalid access token without retry)
      if (error.response && error.response.status === 401) {
        console.log('401 Unauthorized error detected, forcing logout');
        logoutFunction(); // Force logout on any 401
        return Promise.reject(error);
      }

      console.log('Request failed:', error.response?.data?.msg || error.message);
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default axiosInstance;