import axios from 'axios';

const expressApi = axios.create({
  baseURL: import.meta.env.VITE_EXPRESS_URL || 'http://localhost:5000',
  withCredentials: true,
});

// Request interceptor to add JWT token
expressApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
expressApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login on 401
      localStorage.removeItem('token');
      // Only redirect if we're not already on the login page or checking current user
      if (window.location.pathname !== '/login' && !error.config.url.includes('/auth/me')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default expressApi;
