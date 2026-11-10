import axios from 'axios';

function getApiBaseUrl() {
  // 1. Runtime override via localStorage (enables instant URL swapping in browser console)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('CIVICPULSE_BACKEND_URL');
    if (customUrl && customUrl.trim()) {
      const clean = customUrl.trim().replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  }

  // 2. Explicit Vite env var if provided during build
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() && envUrl !== '/api') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 3. Runtime browser detection: If running on cloud hosts (Vercel or Render),
  // automatically route API calls to the deployed backend web service!
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host.includes('onrender.com') || host.includes('vercel.app')) {
      return 'https://civicpulse-backend-sl9v.onrender.com/api';
    }
  }

  // 4. Local development fallback (Vite proxy forwards /api -> localhost:5000)
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
