// API configuration
// Automatically detects if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isDevelopment
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'https://your-backend.onrender.com';
