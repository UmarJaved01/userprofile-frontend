import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Allow cookies to be sent with requests (for refresh token)
});

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
        // If a refresh is already in progress, queue the request
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
        // Attempt to refresh the access token
        const res = await axiosInstance.post('/auth/refresh', {}, {
          withCredentials: true, // Ensure cookies are sent
        });
        const newAccessToken = res.data.accessToken;

        // Update the token in localStorage
        localStorage.setItem('token', newAccessToken);

        // Update the Authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process any queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        // If refresh fails (e.g., invalid refresh token), log out the user
        console.error('Refresh token failed:', refreshErr.response?.data || refreshErr.message);
        localStorage.removeItem('token'); // Clear invalid token
        processQueue(refreshErr, null);
        window.location.href = '/'; // Redirect to login
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;