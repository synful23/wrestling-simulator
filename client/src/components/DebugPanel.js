// src/components/DebugPanel.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const DebugPanel = () => {
  const { user } = useContext(AuthContext);
  const [apiStatus, setApiStatus] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_ENDPOINTS = [
    '/api/companies/user',
    '/api/companies',
    '/api/venues',
    '/api/wrestlers',
    '/api/shows'
  ];

  useEffect(() => {
    const checkEndpoints = async () => {
      const results = {};
      
      for (const endpoint of API_ENDPOINTS) {
        try {
          console.log(`Checking endpoint: ${endpoint}`);
          const startTime = Date.now();
          const response = await axios.get(`http://localhost:5000${endpoint}`, { 
            withCredentials: true 
          });
          const endTime = Date.now();
          
          results[endpoint] = {
            status: 'success',
            statusCode: response.status,
            responseTime: `${endTime - startTime}ms`,
            dataLength: Array.isArray(response.data) ? response.data.length : 'Not an array',
            data: response.data
          };
        } catch (error) {
          results[endpoint] = {
            status: 'error',
            statusCode: error.response?.status || 'Network Error',
            message: error.response?.data?.message || error.message
          };
        }
      }
      
      setApiStatus(results);
      setLoading(false);
    };
    
    checkEndpoints();
  }, []);

  const refreshEndpoint = async (endpoint) => {
    try {
      setApiStatus(prev => ({
        ...prev,
        [endpoint]: {
          ...prev[endpoint],
          status: 'refreshing'
        }
      }));
      
      const startTime = Date.now();
      const response = await axios.get(`http://localhost:5000${endpoint}`, { 
        withCredentials: true 
      });
      const endTime = Date.now();
      
      setApiStatus(prev => ({
        ...prev,
        [endpoint]: {
          status: 'success',
          statusCode: response.status,
          responseTime: `${endTime - startTime}ms`,
          dataLength: Array.isArray(response.data) ? response.data.length : 'Not an array',
          data: response.data
        }
      }));
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        [endpoint]: {
          status: 'error',
          statusCode: error.response?.status || 'Network Error',
          message: error.response?.data?.message || error.message
        }
      }));
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'success':
        return <span className="badge bg-success">Success</span>;
      case 'error':
        return <span className="badge bg-danger">Error</span>;
      case 'refreshing':
        return <span className="badge bg-warning">Refreshing</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  if (loading) {
    return <div className="text-center my-5">Checking API endpoints...</div>;
  }

  return (
    <div className="container my-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Debug Panel</h3>
          <button 
            className="btn btn-sm btn-light"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        <div className="card-body">
          <h4 className="mb-3">Authentication Status</h4>
          <div className="card mb-4">
            <div className="card-body">
              {user ? (
                <>
                  <div className="alert alert-success">
                    <strong>Authenticated as:</strong> {user.username}
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <strong>Discord ID:</strong> {user.discordId}
                    </div>
                    <div className="col-md-3">
                      <strong>User ID:</strong> {user._id}
                    </div>
                    <div className="col-md-3">
                      <strong>Companies:</strong> {user.companies?.length || 0}
                    </div>
                    <div className="col-md-3">
                      <strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning">
                  Not authenticated
                </div>
              )}
            </div>
          </div>
          
          <h4 className="mb-3">API Endpoints</h4>
          {API_ENDPOINTS.map(endpoint => (
            <div key={endpoint} className="card mb-3">
              <div className={`card-header ${
                apiStatus[endpoint]?.status === 'success' ? 'bg-success' : 
                apiStatus[endpoint]?.status === 'error' ? 'bg-danger' : 'bg-secondary'
              } text-white d-flex justify-content-between align-items-center`}>
                <h5 className="mb-0">{endpoint}</h5>
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => refreshEndpoint(endpoint)}
                >
                  Refresh
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>Status:</strong> {getStatusBadge(apiStatus[endpoint]?.status)}
                  </div>
                  <div className="col-md-4">
                    <strong>Status Code:</strong> {apiStatus[endpoint]?.statusCode}
                  </div>
                  <div className="col-md-4">
                    <strong>Response Time:</strong> {apiStatus[endpoint]?.responseTime || 'N/A'}
                  </div>
                </div>
                
                {apiStatus[endpoint]?.status === 'error' && (
                  <div className="alert alert-danger">
                    {apiStatus[endpoint]?.message}
                  </div>
                )}
                
                {apiStatus[endpoint]?.status === 'success' && (
                  <div>
                    <div className="mb-2">
                      <strong>Data Length:</strong> {apiStatus[endpoint]?.dataLength}
                    </div>
                    
                    {showDetails && (
                      <div>
                        <strong>Response Data:</strong>
                        <pre className="mt-2 bg-light p-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                          {JSON.stringify(apiStatus[endpoint]?.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;