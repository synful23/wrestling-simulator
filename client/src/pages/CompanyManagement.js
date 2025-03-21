// src/pages/CompanyManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CompanyManagement = () => {
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
              const wrestlersRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/wrestlers/company/${company._id}`
              );
              
              // Fetch shows for this company
              const showsRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/shows/company/${company._id}`
              );
              
              // Return the company with additional data
              return {
                ...company,
                wrestlers: wrestlersRes.data,
                shows: showsRes.data
              };
            } catch (err) {
              console.error(`Error fetching data for company ${company._id}:`, err);
              // If there's an error, still return the company but with empty arrays
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
        setError('Failed to load companies. Please try again.');
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

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <p className="text-center mt-3">Loading your companies...</p>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Company Management</h1>
        <Link
          to="/create-company"
          className="btn btn-success"
        >
          Create New Company
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {userCompanies.length === 0 ? (
        <div className="card text-center p-5">
          <p className="mb-4">You haven't created any wrestling companies yet.</p>
          <div>
            <Link
              to="/create-company"
              className="btn btn-primary"
            >
              Create Your First Company
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
                    <div className="col-md-4 mb-2 mb-md-0">
                      <div className="card text-center h-100">
                        <div className="card-body p-2">
                          <h5 className="mb-1">${company.money?.toLocaleString()}</h5>
                          <div className="small text-muted">Available Funds</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-2 mb-md-0">
                      <div className="card text-center h-100">
                        <div className="card-body p-2">
                          <h5 className="mb-1">{company.wrestlers?.length || 0}</h5>
                          <div className="small text-muted">Wrestlers</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card text-center h-100">
                        <div className="card-body p-2">
                          <h5 className="mb-1">{countUpcomingShows(company)}</h5>
                          <div className="small text-muted">Upcoming Shows</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Weekly Expenses:</span>
                      <span className="text-danger">-${calculateWeeklyExpenses(company).toLocaleString()}</span>
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
    </div>
  );
};

export default CompanyManagement;