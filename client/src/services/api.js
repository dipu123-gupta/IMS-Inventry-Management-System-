import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../config/api';

const API = axios.create({
  baseURL: config.API_URL,
  timeout: 15000, // 15 seconds timeout
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle responses and global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access Denied: You do not have permission for this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Internal Server Error. Please try again later.');
    } else if (error.response?.status === 400) {
      if (Array.isArray(error.response?.data?.errors)) {
        const msg = error.response.data.errors
          .map(e => e.replace(/^(body\.|query\.|params\.)/, ''))
          .join(', ');
        toast.error(msg);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Bad Request. Please check your input.');
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.');
    } else if (!error.response) {
      toast.error('Network Error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default API;
