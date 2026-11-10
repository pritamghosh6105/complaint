import axios from 'axios';

function getApiBaseUrl() {
  // 1. Explicit Vite env var if provided
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() && envUrl !== '/api') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 2. Runtime browser detection: If running on Render (*.onrender.com),
  // automatically route API calls to the deployed backend web service!
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host.includes('onrender.com')) {
      return 'https://civicpulse-backend.onrender.com/api';
    }
  }

  // 3. Local development fallback (Vite proxy forwards /api -> localhost:5000)
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
