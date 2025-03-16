import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
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
        const res = await axiosInstance.post('/auth/refresh', {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken;

        localStorage.setItem('token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.log('Refresh token failed:', refreshErr.response?.data?.msg || refreshErr.message);
        localStorage.removeItem('token'); // Clear the access token

        // Immediate and synchronous redirect
        if (window.location.pathname !== '/') {
          console.log('Redirecting to login page due to refresh token failure');
          window.location.replace('/'); // Force redirect now
        }

        processQueue(refreshErr, null);
        return Promise.reject(refreshErr); // Reject after redirect
      } finally {
        isRefreshing = false;
      }
    }

    console.log('Request failed:', error.response?.data?.msg || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;