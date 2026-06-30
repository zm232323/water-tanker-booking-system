import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('water_tanker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle global responses, like logging out on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user info on auth fail
      localStorage.removeItem('water_tanker_token');
      localStorage.removeItem('water_tanker_user');
    }
    return Promise.reject(error);
  }
);

export default API;
