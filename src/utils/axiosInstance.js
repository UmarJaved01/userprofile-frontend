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
        localStorage.removeItem('token'); // Clear the access token

        // Immediate and synchronous redirect with fallback
        if (window.location.pathname !== '/') {
          console.log('Forcing logout and redirect to login page on HTTPS');
          window.location.href = '/'; // Synchronous redirect
          // Ensure redirect by checking location change
          let redirectAttempts = 0;
          const maxAttempts = 5;
          const checkRedirect = setInterval(() => {
            if (window.location.pathname === '/' || redirectAttempts >= maxAttempts) {
              clearInterval(checkRedirect);
            } else {
              window.location.href = '/';
              redirectAttempts++;
              console.log(`Redirect attempt ${redirectAttempts} of ${maxAttempts}`);
            }
          }, 100); // Check every 100ms
        }

        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    console.log('Request failed on HTTPS:', error.response?.data?.msg || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;