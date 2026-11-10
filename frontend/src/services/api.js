import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '/api';
const cleanBaseUrl = (!rawBaseUrl || rawBaseUrl === '/api')
  ? '/api'
  : (rawBaseUrl.replace(/\/+$/, '').endsWith('/api')
      ? rawBaseUrl.replace(/\/+$/, '')
      : `${rawBaseUrl.replace(/\/+$/, '')}/api`);

const api = axios.create({
  baseURL: cleanBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civic_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthenticated globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_user');
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
