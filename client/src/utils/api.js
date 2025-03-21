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

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log(`API Response from: ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    // Handle session expiration or other global errors
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      
      if (error.response.status === 401) {
        console.log('Authentication failed. Redirecting to login...');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;