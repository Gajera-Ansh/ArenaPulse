import axios from 'axios';

const djangoApi = axios.create({
  baseURL: import.meta.env.VITE_DJANGO_URL || 'http://localhost:8000',
});

// Request interceptor for Django API (if it needs auth later)
djangoApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // For now, we pass the Express JWT to Django so it can verify the user if needed
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default djangoApi;
