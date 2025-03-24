// src/context/AuthContext.js - Improved error handling
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api'; // Import your configured axios instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // This will now silently handle 401 errors
        const res = await api.get('/api/auth/user');
        
        if (res.data) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        // This will only catch non-401 errors now
        console.error('Error checking authentication:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const logout = async () => {
    try {
      await api.get('/api/auth/logout');
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};