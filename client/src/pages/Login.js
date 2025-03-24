// src/pages/Login.js - Enhanced version
import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaDiscord, FaUsers, FaTrophy, FaCalendarAlt } from 'react-icons/fa';

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
    <div className="min-h-screen flex items-center justify-center" style={{
      backgroundColor: "#1E293B", /* Fallback dark color */
      backgroundImage: "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1544535830-9df3f56abc3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
      <div className="max-w-md w-full px-6 py-8 bg-white shadow-2xl rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Wrestling Booking Simulator
          </h1>
          <div className="w-16 h-1 bg-red-600 mx-auto mb-3"></div>
          <p className="text-gray-600">
            Create, Book, Dominate the Wrestling World
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
                <div className="mt-3">
                  <a 
                    href={process.env.REACT_APP_DISCORD_INVITE || "https://discord.gg/YOUR_INVITE_CODE"}
                    className="text-sm font-medium text-red-700 hover:text-red-500 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join our Discord Server →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="shadow-md p-4 bg-gray-50 rounded-lg w-full text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <FaUsers className="text-2xl text-gray-700" />
                <span className="text-lg font-medium text-gray-800">Create Your Company</span>
              </div>
              <p className="text-gray-600 text-sm">Build your wrestling empire from the ground up</p>
            </div>
            
            <div className="shadow-md p-4 bg-gray-50 rounded-lg w-full text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <FaCalendarAlt className="text-2xl text-gray-700" />
                <span className="text-lg font-medium text-gray-800">Book Shows</span>
              </div>
              <p className="text-gray-600 text-sm">Schedule events and plan your matchcards</p>
            </div>
            
            <div className="shadow-md p-4 bg-gray-50 rounded-lg w-full text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <FaTrophy className="text-2xl text-gray-700" />
                <span className="text-lg font-medium text-gray-800">Compete For Glory</span>
              </div>
              <p className="text-gray-600 text-sm">Rise to the top of the wrestling world</p>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full mb-4 flex bg-dark items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            style={{ display: "flex", justifyContent: "center", justifySelf: "center", alignItems: "center" }}
          >
            <FaDiscord className="mr-3 text-2xl" />
            <span>Login with Discord</span>
          </button>
          
          <div className="text-center text-sm text-gray-600 mt-6">
            <p>You must be a member of our Discord server to access this site.</p>
            <p className="mt-1 text-xs text-gray-500">By logging in, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;