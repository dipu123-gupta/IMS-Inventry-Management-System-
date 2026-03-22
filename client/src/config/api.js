/**
 * Centralized API and Socket configuration for the frontend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// If VITE_SOCKET_URL is provided, use it. 
// Otherwise, derive it from API_URL by removing the /api/v1 suffix.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/v1\/?$/, '');

export const config = {
  API_URL,
  SOCKET_URL,
  NODE_ENV: import.meta.env.MODE,
};

export default config;
