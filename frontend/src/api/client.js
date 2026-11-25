import axios from 'axios';

export const TOKEN_KEY = 'careerai_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 90000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/reset');
    if (err.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('careerai:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.';
  return fallback;
};

export default api;
