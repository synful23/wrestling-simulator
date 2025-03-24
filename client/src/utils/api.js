// Update your src/utils/api.js file to add debugging

import axios from 'axios';

// Get the API URL from environment variables or use a default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Log the API URL on application start
console.log('API URL configured as:', API_URL);

// Create a custom axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookies/session
});

// Add a request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request to: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors from auth checks - these are expected when not logged in
    if (
      error.response && 
      error.response.status === 401 && 
      error.config.url === '/api/auth/user'
    ) {
      // Silent fail for auth check - this is normal when user isn't logged in
      return Promise.resolve({ data: null });
    }
    
    // Log other errors
    if (error.response) {
      // Server responded with non-2xx status
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request made but no response received
      console.error('API Error: No response received', error.request);
    } else {
      // Error in setting up request
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;