// src/utils/api.js
import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookies/session
});

// Add a request interceptor for auth token if needed later
api.interceptors.request.use(
  (config) => {
    // You could add auth token here if using JWT instead of sessions
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration or other global errors
    if (error.response && error.response.status === 401) {
      // Redirect to login or display message
      console.log('Session expired. Please log in again.');
      // You could add redirection logic here
    }
    
    return Promise.reject(error);
  }
);

export default api;