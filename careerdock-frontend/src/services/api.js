import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cd_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const wasLoggedIn = !!localStorage.getItem('cd_token');
      ['cd_token','cd_id','cd_name','cd_email'].forEach(k => localStorage.removeItem(k));
      // Only redirect if the user actually had a session (token expired / invalid)
      if (wasLoggedIn) {
        window.location.href = '/login?reason=expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
