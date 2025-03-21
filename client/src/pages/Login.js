// src/pages/Login.js - Updated to handle server membership errors
import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaDiscord } from 'react-icons/fa';

const Login = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const errorParam = queryParams.get('error');
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    // Handle error parameter
    if (errorParam === 'server_membership') {
      setError('You must be a member of our Discord server to access this site. Please join our server and try again.');
    }
  }, [user, navigate, errorParam]);

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/discord`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to Wrestling Booking Simulator</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <div className="mt-2">
              <a 
                href={process.env.REACT_APP_DISCORD_INVITE || "https://discord.gg/YOUR_INVITE_CODE"}
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join our Discord Server
              </a>
            </div>
          </div>
        )}
        
        <p className="mb-6 text-center text-gray-600">
          Connect with Discord to create and manage your wrestling companies
        </p>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 transition-colors"
        >
          <FaDiscord className="mr-2 text-xl" />
          Login with Discord
        </button>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>You must be a member of our Discord server to access this site.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;