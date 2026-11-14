import axios from 'axios';

// If running in Docker, leave this empty "". If running locally, keep http://127.0.0.1:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// 1. Automatically attach the JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Automatically handle 401 Unauthorized errors (Token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session and force login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.replace('/login'); 
    }
    return Promise.reject(error);
  }
);

export default api;