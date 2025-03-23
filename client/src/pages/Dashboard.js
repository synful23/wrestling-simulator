// src/pages/Dashboard.js - Enhanced version
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaBuilding, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaUserPlus, FaChartLine, FaStar } from 'react-icons/fa';

const Dashboard = () => {
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchUserCompanies = async () => {
      try {
        setLoading(true);
        
        // Fetch user's companies
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { 
          withCredentials: true 
        });
        
        // For each company, fetch wrestler count and shows
        const companiesWithData = await Promise.all(
          res.data.map(async (company) => {
            try {
              // Fetch wrestlers for this company
              const wrestlersRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/wrestlers/company/${company._id}`);
              
              // Get show count
              const showsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/company/${company._id}`);
              
              return {
                ...company,
                wrestlers: wrestlersRes.data,
                shows: showsRes.data
              };
            } catch (err) {
              console.error(`Error fetching data for company ${company._id}:`, err);
              return {
                ...company,
                wrestlers: [],
                shows: []
              };
            }
          })
        );
        
        setUserCompanies(companiesWithData);
      } catch (err) {
        console.error('Error fetching user companies:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserCompanies();
  }, []);

  // Helper function to calculate weekly expenses for a company
  const calculateWeeklyExpenses = (company) => {
    if (!company.wrestlers) return 0;
    
    // Calculate total weekly salary for all wrestlers
    const totalSalary = company.wrestlers.reduce((sum, wrestler) => sum + (wrestler.salary || 0), 0);
    
    // Add any other weekly expenses (venues, etc.)
    const otherExpenses = 0; // You can add more expenses here
    
    return totalSalary + otherExpenses;
  };

  // Helper function to count upcoming shows
  const countUpcomingShows = (company) => {
    if (!company.shows) return 0;
    
    const now = new Date();
    return company.shows.filter(show => new Date(show.date) > now).length;
  };
  
  // Get the next upcoming show
  const getNextShow = (company) => {
    if (!company.shows || company.shows.length === 0) return null;
    
    const now = new Date();
    const upcomingShows = company.shows
      .filter(show => new Date(show.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return upcomingShows[0] || null;
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <p className="text-center mt-3">Loading your wrestling empire...</p>
      </div>
    );
  }

  return (
    <div className="container my-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Dashboard</h1>
        <Link
          to="/create-company"
          className="btn btn-success"
        >
          <FaBuilding className="me-2" /> Create New Company
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0 text-white">User Profile</h4>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <img 
              src={user.avatar || 'https://via.placeholder.com/100'} 
              alt="Avatar" 
              className="rounded-circle me-4 avatar-md" 
              style={{width: '100px', height: '100px', objectFit: 'cover'}} 
            />
            <div>
              <h2 className="mb-1">{user.username}</h2>
              <p className="text-muted mb-0">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              <p className="mb-0">Companies: <span className="badge bg-primary">{userCompanies.length}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <h2 className="mb-3 section-title">
        <FaBuilding className="me-2" /> Your Wrestling Companies
      </h2>

      {userCompanies.length === 0 ? (
        <div className="card text-center p-5 shadow-sm">
          <div className="py-5">
            <FaBuilding style={{ fontSize: '4rem', color: 'var(--gray-300)' }} />
            <h3 className="mt-4 mb-3">You haven't created any wrestling companies yet</h3>
            <p className="mb-4 text-muted">Start your journey by creating your first wrestling company!</p>
            <Link
              to="/create-company"
              className="btn btn-primary btn-lg px-5"
            >
              Create Your First Company
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {userCompanies.map((company) => (
            <div key={company._id} className="col-lg-6 mb-4">
              <div className="card company-card h-100 shadow-sm">
                <div className="card-header bg-dark text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="card-title mb-0 text-white">{company.name}</h3>
                    <span className="badge bg-light text-dark">
                      {company.location}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-4 text-center mb-3 mb-md-0">
                      {company.logo ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${company.logo}`}
                          alt={`${company.name} logo`}
                          className="img-fluid company-logo"
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '100px'}}>
                          <span className="text-muted">No Logo</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          <strong>Popularity:</strong> {company.popularity}/100
                        </label>
                        <div className="progress">
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
                      </div>
                      
                      <p className="card-text small mb-2">{company.description}</p>
                      
                      {getNextShow(company) && (
                        <div className="small mt-3 p-2 bg-light rounded">
                          <strong>Next Show:</strong> {getNextShow(company).name} on {new Date(getNextShow(company).date).toLocaleDateString()}
                        </div>  
                      )}
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-4 mb-2 mb-md-0">
                      <div className="stat-card">
                        <h3><FaMoneyBillWave className="me-2" /> Funds</h3>
                        <p className="value text-success">${company.money?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="col-md-4 mb-2 mb-md-0">
                      <div className="stat-card">
                        <h3><FaUsers className="me-2" /> Roster</h3>
                        <p className="value">{company.wrestlers?.length || 0}</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="stat-card">
                        <h3><FaCalendarAlt className="me-2" /> Shows</h3>
                        <p className="value">{countUpcomingShows(company)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Weekly Expenses:</span>
                      <span className="text-danger fw-bold">-${calculateWeeklyExpenses(company).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-4">
                    <div>
                      <Link to={`/roster/${company._id}`} className="btn btn-primary me-2 mb-2">
                        <FaUsers className="me-1" /> Roster
                      </Link>
                      <Link to={`/shows/company/${company._id}`} className="btn btn-info me-2 mb-2">
                        <FaCalendarAlt className="me-1" /> Shows
                      </Link>
                      <Link to={`/free-agents`} className="btn btn-secondary me-2 mb-2">
                        <FaUserPlus className="me-1" /> Sign Talent
                      </Link>
                    </div>
                    <Link to={`/company/${company._id}`} className="btn btn-outline-primary mb-2">
                      <FaChartLine className="me-1" /> Manage
                    </Link>
                  </div>
                </div>
                <div className="card-footer bg-light text-muted">
                  <div className="d-flex justify-content-between align-items-center">
                    <small>Created: {new Date(company.createdAt).toLocaleDateString()}</small>
                    <div>
                      <FaStar className="text-warning me-1" />
                      <small>Popularity Rank: #{userCompanies.sort((a, b) => b.popularity - a.popularity).findIndex(c => c._id === company._id) + 1}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Quick Links */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">Quick Links</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/venues" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Browse Venues
                  <span className="badge bg-primary rounded-pill">
                    <FaBuilding />
                  </span>
                </Link>
                <Link to="/free-agents" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Free Agent Wrestlers
                  <span className="badge bg-primary rounded-pill">
                    <FaUsers />
                  </span>
                </Link>
                <Link to="/shows" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  All Shows
                  <span className="badge bg-primary rounded-pill">
                    <FaCalendarAlt />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">Get Started</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/shows/new" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Schedule a Show
                  <span className="badge bg-success rounded-pill">
                    <FaCalendarAlt />
                  </span>
                </Link>
                <Link to="/create-company" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  Start a New Company
                  <span className="badge bg-success rounded-pill">
                    <FaBuilding />
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