// src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Default user stats to avoid undefined errors
  const [userStats, setUserStats] = useState({
    money: 0,
    level: 1,
    experience: 0,
    xpForNextLevel: 100,
    xpProgress: 0,
    weeklyExpenses: 0
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setLoading(false);
        }, 10000); // 10 seconds max loading time
        
        // First, try to fetch companies (basic functionality)
        try {
          const companiesRes = await api.get('/api/companies/user');
          const companiesData = companiesRes.data || [];
          
          // For each company, try to get roster size
          const companiesWithInfo = await Promise.all(
            companiesData.map(async (company) => {
              try {
                // Get roster size (just count, don't fetch all details)
                const rosterRes = await api.get(`/api/wrestlers/company/${company._id}`);
                return {
                  ...company,
                  rosterSize: rosterRes.data?.length || 0
                };
              } catch (err) {
                console.error(`Error fetching roster for company ${company._id}:`, err);
                return {
                  ...company,
                  rosterSize: 'Unknown'
                };
              }
            })
          );
          
          setUserCompanies(companiesWithInfo);
        } catch (companiesErr) {
          console.error('Error fetching companies:', companiesErr);
          setUserCompanies([]);
        }
        
        // Then try to fetch user stats (can fail without breaking the page)
        try {
          const statsRes = await api.get('/api/auth/stats');
          if (statsRes.data) {
            setUserStats(statsRes.data);
          }
        } catch (statsErr) {
          console.error('Error fetching user stats:', statsErr);
          // Keep default stats - no need to show error
        }
        
        // Clear timeout if everything completes
        clearTimeout(timeoutId);
        setLoading(false);
      } catch (err) {
        console.error('General error in Dashboard:', err);
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to calculate weekly expenses for a company
  const calculateWeeklyExpenses = (company) => {
    // Simple estimation based on roster size
    return (company.rosterSize || 0) * 10000;
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <p className="text-center mt-3">Loading your dashboard...</p>
        <div className="text-center mt-2">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setLoading(false)}
          >
            Skip Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Dashboard</h1>
        <div>
          <Link to="/profile" className="btn btn-outline-primary me-2">
            My Profile
          </Link>
          <Link
            to="/create-company"
            className={`btn btn-success ${userStats?.money < 200000 ? 'disabled' : ''}`}
          >
            {userStats?.money < 200000 
              ? `Need $${(200000 - userStats.money).toLocaleString()} for Company` 
              : 'Create New Company'}
          </Link>
        </div>
      </div>
      
      {/* Show payout notification if exists */}
      {userStats?.payout && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Daily Payout!</strong> {userStats.payout.message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* User Stats Card */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Promoter Dashboard</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-2 text-center">
              <img 
                src={user.avatar || 'https://via.placeholder.com/100'} 
                alt="Avatar" 
                className="rounded-circle mb-2" 
                style={{width: '80px', height: '80px', objectFit: 'cover'}} 
              />
            </div>
            <div className="col-md-5">
              <h3 className="mb-1">{user.username}</h3>
              <div className="text-muted mb-2">Level {userStats?.level || 1} Promoter</div>
              
              <div className="progress mb-1" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${userStats?.xpProgress || 0}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between small text-muted">
                <span>{userStats?.experience || 0} XP</span>
                <span>{userStats?.xpForNextLevel || 100} XP needed</span>
              </div>
            </div>
            <div className="col-md-5">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Available Funds</h5>
                    <span className="h3 mb-0 text-success">${userStats?.money.toLocaleString() || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Companies</span>
                    <span>{userCompanies.length}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
  <span>Wrestlers</span>
  <span>{userStats?.wrestlerCount || userStats?.wrestlers?.length || 0}</span>
</div>
                  <div className="d-flex justify-content-between">
                    <span>Weekly Expenses</span>
                    <span className="text-danger">-${userStats?.weeklyExpenses?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <h2 className="mb-3">Your Wrestling Companies</h2>

      {userCompanies.length === 0 ? (
        <div className="card text-center p-5">
          <p className="mb-4">You haven't created any wrestling companies yet.</p>
          <div>
            <Link
              to="/create-company"
              className={`btn btn-primary ${userStats?.money < 200000 ? 'disabled' : ''}`}
            >
              {userStats?.money < 200000 
                ? `Need $${(200000 - userStats?.money).toLocaleString()} more` 
                : 'Create Your First Company'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {userCompanies.map((company) => (
            <div key={company._id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-dark text-white">
                  <h3 className="card-title mb-0">{company.name}</h3>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-4 text-center mb-3 mb-md-0">
                      {company.logo ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${company.logo}`}
                          alt={`${company.name} logo`}
                          className="img-fluid"
                          style={{ maxHeight: '100px' }}
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '100px'}}>
                          <span className="text-muted">No Logo</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="col-md-8">
                      <p><strong>Location:</strong> {company.location}</p>
                      <p><strong>Popularity:</strong> 
                        <div className="progress mt-1" style={{ height: '10px' }}>
                          <div 
                            className={`progress-bar ${
                              company.popularity >= 80 ? 'bg-success' : 
                              company.popularity >= 60 ? 'bg-info' : 
                              company.popularity >= 40 ? 'bg-warning' : 
                              'bg-danger'
                            }`} 
                            style={{ width: `${company.popularity}%` }}
                            aria-valuenow={company.popularity}
                            aria-valuemin="0"
                            aria-valuemax="100">
                          </div>
                        </div>
                        <span className="badge bg-secondary mt-1">{company.popularity}/100</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-2 mb-md-0">
                      <div className="card text-center h-100">
                        <div className="card-body p-2">
                          <h5 className="mb-1">${company.money?.toLocaleString() || 0}</h5>
                          <div className="small text-muted">Available Funds</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card text-center h-100">
                        <div className="card-body p-2">
                          <h5 className="mb-1">{company.rosterSize || 'Unknown'}</h5>
                          <div className="small text-muted">Wrestlers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="card-text small text-muted mb-4">{company.description}</p>
                  
                  <div className="d-flex justify-content-between">
                    <div>
                      <Link to={`/roster/${company._id}`} className="btn btn-primary me-2">
                        View Roster
                      </Link>
                      <Link to={`/shows/company/${company._id}`} className="btn btn-info me-2">
                        Shows
                      </Link>
                    </div>
                    <Link to={`/company/${company._id}`} className="btn btn-outline-secondary">
                      Manage
                    </Link>
                  </div>
                </div>
                <div className="card-footer text-muted">
                  <small>Created: {new Date(company.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Quick Links */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">Quick Links</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/venues" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Browse Venues
                  <span className="badge bg-primary rounded-pill">
                    <i className="bi bi-building"></i>
                  </span>
                </Link>
                <Link to="/free-agents" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Free Agent Wrestlers
                  <span className="badge bg-primary rounded-pill">
                    <i className="bi bi-people"></i>
                  </span>
                </Link>
                <Link to="/shows" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  All Shows
                  <span className="badge bg-primary rounded-pill">
                    <i className="bi bi-calendar-event"></i>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">Get Started</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/wrestlers/new" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Create a Wrestler
                  <span className="badge bg-success rounded-pill">
                    <i className="bi bi-person-plus"></i>
                  </span>
                </Link>
                <Link to="/shows/new" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Schedule a Show
                  <span className="badge bg-success rounded-pill">
                    <i className="bi bi-calendar-plus"></i>
                  </span>
                </Link>
                <Link 
                  to="/profile" 
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                >
                  View My Profile
                  <span className="badge bg-success rounded-pill">
                    <i className="bi bi-person"></i>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;