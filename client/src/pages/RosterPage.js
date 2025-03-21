// src/pages/RosterPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import axios from 'axios';

const TIMEOUT_MS = 10000; // 10 seconds timeout

const RosterPage = () => {
  const { companyId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
const [wrestlers, setWrestlers] = useState([]);
const [company, setCompany] = useState(null);
const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const wrestlingStyles = ['Technical', 'High-Flyer', 'Powerhouse', 'Brawler', 'Showman', 'All-Rounder'];
  
  // Helper function with timeout for API calls
  const fetchWithTimeout = async (url, options = {}) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
    );
    
    try {
      const fetchPromise = axios.get(url, { 
        ...options,
        withCredentials: true 
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      return response.data;
    } catch (error) {
      console.error(`Request to ${url} failed:`, error);
      if (error.message === 'Request timed out') {
        throw new Error('Request timed out. The server took too long to respond.');
      }
      throw error;
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log(`RosterPage: Fetching data for company ${companyId}...`);
        
        // Fetch company data
        const companyResponse = await api.get(`/api/companies/${companyId}`);
        setCompany(companyResponse.data);
        
        // Now fetch wrestlers
        try {
          const apiUrl = `${process.env.REACT_APP_API_URL}/api/wrestlers/company/${companyId}`;
          const wrestlersData = await axios.get(apiUrl, { withCredentials: true });
          setWrestlers(wrestlersData.data || []);
        } catch (wrestlerErr) {
          console.error('Error fetching wrestlers:', wrestlerErr);
          setWrestlers([]);
          // Don't let wrestler errors block the whole page
        }
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load roster data. Please try again.');
      } finally {
        // Always set loading to false when done
        setLoading(false);
      }
    };
  
    fetchData();
  }, [companyId]);
  
  // Helper to update the main loading state based on sub-states
  const updateLoadingState = () => {
    if (!loading) {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStyleChange = (e) => {
    setFilterStyle(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const isCompanyOwner = company && user && company.owner === user.id;

  // Filter and sort wrestlers
  const filteredWrestlers = wrestlers
    .filter(wrestler => 
      wrestler.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(wrestler => 
      filterStyle ? wrestler.style === filterStyle : true
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'popularity') {
        return sortOrder === 'asc'
          ? a.popularity - b.popularity
          : b.popularity - a.popularity;
      } else if (sortBy === 'salary') {
        return sortOrder === 'asc'
          ? a.salary - b.salary
          : b.salary - a.salary;
      } else if (sortBy === 'overall') {
        const aOverall = (a.attributes.strength + a.attributes.agility + a.attributes.charisma + a.attributes.technical) / 4;
        const bOverall = (b.attributes.strength + b.attributes.agility + b.attributes.charisma + b.attributes.technical) / 4;
        return sortOrder === 'asc'
          ? aOverall - bOverall
          : bOverall - aOverall;
      }
      return 0;
    });

  // Show loading UI with cancelable option
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading roster...</span>
        </div>
        <h4>Loading roster data...</h4>
        <p className="text-muted">This might take a few moments</p>
        <button 
          className="btn btn-outline-secondary mt-3"
          onClick={() => {
            setLoading(false);
          }}
        >
          Cancel Loading
        </button>
      </div>
    );
  }

  if (error && !company) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  if (!company) {
    return <div className="alert alert-warning mt-5">Company not found</div>;
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          {company.name} Roster
        </h1>
        
        {isCompanyOwner && (
          <Link to={`/wrestlers/new`} className="btn btn-success">
            Add Wrestler
          </Link>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 text-center">
              {company.logo ? (
                <img 
                  src={`${process.env.REACT_APP_API_URL}${company.logo}`}
                  alt={`${company.name} logo`}
                  className="img-fluid"
                  style={{ maxHeight: '100px' }}
                />
              ) : (
                <div className="bg-light p-3 rounded">No Logo</div>
              )}
            </div>
            
            <div className="col-md-9">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Location:</strong> {company.location}</p>
                  <p><strong>Roster Size:</strong> {wrestlers.length} wrestlers</p>
                </div>
                
                <div className="col-md-6">
                  <p><strong>Weekly Salary Budget:</strong> ${wrestlers.reduce((sum, wrestler) => sum + wrestler.salary, 0).toLocaleString()}</p>
                  <p><strong>Available Funds:</strong> ${company.money?.toLocaleString() || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search wrestlers..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStyle}
                onChange={handleStyleChange}
              >
                <option value="">All Styles</option>
                {wrestlingStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-5 d-flex">
              <select
                className="form-select me-2"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="popularity">Sort by Popularity</option>
                <option value="name">Sort by Name</option>
                <option value="salary">Sort by Salary</option>
                <option value="overall">Sort by Overall Rating</option>
              </select>
              
              <button
                className="btn btn-outline-secondary"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading wrestlers...</span>
              </div>
              <p className="mt-2">Loading wrestlers...</p>
            </div>
          ) : wrestlers.length === 0 ? (
            <div className="alert alert-info">
              This company doesn't have any wrestlers yet.
              {isCompanyOwner && (
                <div className="mt-2">
                  <Link to="/free-agents" className="btn btn-primary btn-sm">
                    Sign free agents
                  </Link>
                </div>
              )}
            </div>
          ) : filteredWrestlers.length === 0 ? (
            <div className="alert alert-warning">
              No wrestlers found matching your filters.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {filteredWrestlers.map(wrestler => (
                <div key={wrestler._id} className="col">
                  <div className="card h-100">
                    <div className="card-img-top bg-light" style={{ height: '200px' }}>
                      {wrestler.image ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                          alt={wrestler.name}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div className="card-body">
                      <h5 className="card-title">{wrestler.name}</h5>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary">{wrestler.style}</span>
                        <span className="badge bg-secondary">{wrestler.gender}</span>
                      </div>
                      
                      <div className="small mb-3">
                        {wrestler.hometown && (
                          <div><strong>From:</strong> {wrestler.hometown}</div>
                        )}
                        <div><strong>Popularity:</strong> {wrestler.popularity}/100</div>
                        <div><strong>Salary:</strong> ${wrestler.salary.toLocaleString()}/week</div>
                      </div>
                      
                      <div className="progress mb-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-danger" 
                          style={{ width: `${wrestler.attributes.strength}%` }}
                          title={`Strength: ${wrestler.attributes.strength}`}
                        ></div>
                      </div>
                      <div className="progress mb-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${wrestler.attributes.agility}%` }}
                          title={`Agility: ${wrestler.attributes.agility}`}
                        ></div>
                      </div>
                      <div className="progress mb-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ width: `${wrestler.attributes.charisma}%` }}
                          title={`Charisma: ${wrestler.attributes.charisma}`}
                        ></div>
                      </div>
                      <div className="progress mb-2" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-info" 
                          style={{ width: `${wrestler.attributes.technical}%` }}
                          title={`Technical: ${wrestler.attributes.technical}`}
                        ></div>
                      </div>
                      
                      <div className="d-flex small text-muted mt-1">
                        <div title="Strength" className="me-2"><i className="fas fa-dumbbell"></i> {wrestler.attributes.strength}</div>
                        <div title="Agility" className="me-2"><i className="fas fa-running"></i> {wrestler.attributes.agility}</div>
                        <div title="Charisma" className="me-2"><i className="fas fa-star"></i> {wrestler.attributes.charisma}</div>
                        <div title="Technical" className="me-2"><i className="fas fa-cog"></i> {wrestler.attributes.technical}</div>
                      </div>
                    </div>
                    
                    <div className="card-footer d-flex justify-content-between">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/wrestlers/${wrestler._id}`)}
                      >
                        View Profile
                      </button>
                      
                      {isCompanyOwner && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/wrestlers/edit/${wrestler._id}`)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RosterPage;