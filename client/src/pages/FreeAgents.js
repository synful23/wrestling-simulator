// Updated FreeAgents.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import axios from 'axios';
import { FaUserPlus, FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaDumbbell, FaStar, FaCog, FaRunning } from 'react-icons/fa';

const TIMEOUT_MS = 10000; // 10 seconds timeout

const FreeAgents = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [wrestlers, setWrestlers] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [signingWrestler, setSigningWrestler] = useState(null);
  const [signingCompany, setSigningCompany] = useState('');
  const [signingContract, setSigningContract] = useState({
    length: 12,
    exclusive: true
  });
  
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
        console.log("FreeAgents: Starting data fetch...");
        setLoading(true);
        setError('');
        
        // Get all wrestlers
        try {
          console.log("FreeAgents: Fetching wrestlers...");
          const result = await fetchWithTimeout(`${process.env.REACT_APP_API_URL}/api/wrestlers`);
          
          console.log(`FreeAgents: Received ${result.length} wrestlers, filtering free agents...`);
          
          // Filter to only free agents
          const freeAgents = result.filter(wrestler => !wrestler.contract || !wrestler.contract.company);
          console.log(`FreeAgents: Found ${freeAgents.length} free agents`);
          
          setWrestlers(freeAgents);
        } catch (wrestlerErr) {
          console.error('FreeAgents: Error fetching wrestlers:', wrestlerErr);
          setError(wrestlerErr.message || 'Failed to load free agents. Please try again.');
          setWrestlers([]);
        }
        
        // If user is logged in, get their companies
        if (user) {
          try {
            console.log("FreeAgents: User is logged in, fetching companies...");
            const companiesRes = await api.get('/api/companies/user');
            console.log("FreeAgents: User companies received:", companiesRes.data);
            setUserCompanies(companiesRes.data || []);
          } catch (companyErr) {
            console.error('FreeAgents: Error fetching user companies:', companyErr);
            setUserCompanies([]);
          }
        }
      } catch (err) {
        console.error('FreeAgents: General error in data fetching:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStyleChange = (e) => {
    setFilterStyle(e.target.value);
  };

  const handleGenderChange = (e) => {
    setFilterGender(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const openSignModal = (wrestler) => {
    setSigningWrestler(wrestler);
    if (userCompanies.length > 0) {
      setSigningCompany(userCompanies[0]._id);
    }
  };

  const closeSignModal = () => {
    setSigningWrestler(null);
    setSigningCompany('');
    setSigningContract({
      length: 12,
      exclusive: true
    });
  };

  const handleContractChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSigningContract({
      ...signingContract,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSignWrestler = async () => {
    try {
      if (!signingCompany) {
        setError('Please select a company');
        return;
      }

      const company = userCompanies.find(company => company._id === signingCompany);
      if (company.money < signingWrestler.salary) {
        setError(`Not enough funds to sign ${signingWrestler.name}. Available: $${company.money.toLocaleString()}, Required: $${signingWrestler.salary.toLocaleString()}`);
        return;
      }

      await api.post(
        `/api/wrestlers/${signingWrestler._id}/sign/${signingCompany}`,
        {
          contractLength: signingContract.length,
          exclusive: signingContract.exclusive
        }
      );

      // Refresh the free agents list
      const result = await api.get('/api/wrestlers');
      const freeAgents = result.data.filter(wrestler => !wrestler.contract || !wrestler.contract.company);
      setWrestlers(freeAgents);

      // Refresh user companies
      const companiesRes = await api.get('/api/companies/user');
      setUserCompanies(companiesRes.data);

      closeSignModal();
    } catch (err) {
      console.error('Error signing wrestler:', err);
      setError(err.response?.data?.message || 'Failed to sign wrestler');
    }
  };
  
  // Admin functions
  const handleCreateFreeAgent = () => {
    navigate('/admin/wrestlers/new');
  };
  
  const handleEditWrestler = (id) => {
    navigate(`/wrestlers/edit/${id}`);
  };
  
  const handleDeleteWrestler = async (id) => {
    try {
      await api.delete(`/api/wrestlers/${id}`);
      // Refresh the free agents list
      const result = await api.get('/api/wrestlers');
      const freeAgents = result.data.filter(wrestler => !wrestler.contract || !wrestler.contract.company);
      setWrestlers(freeAgents);
      
      alert('Wrestler deleted successfully');
    } catch (err) {
      console.error('Error deleting wrestler:', err);
      setError(err.response?.data?.message || 'Failed to delete wrestler');
    }
  };

  // Calculate overall rating
  const calculateOverall = (attributes) => {
    return Math.round((attributes.strength + attributes.agility + attributes.charisma + attributes.technical) / 4);
  };

  // Filter wrestlers
  const filteredWrestlers = wrestlers
    .filter(wrestler => 
      wrestler.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(wrestler => 
      filterStyle ? wrestler.style === filterStyle : true
    )
    .filter(wrestler => 
      filterGender ? wrestler.gender === filterGender : true
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
        const aOverall = calculateOverall(a.attributes);
        const bOverall = calculateOverall(b.attributes);
        return sortOrder === 'asc'
          ? aOverall - bOverall
          : bOverall - aOverall;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading free agents...</span>
        </div>
        <h4>Loading free agents...</h4>
        <p className="text-muted">This might take a few moments</p>
        <button 
          className="btn btn-outline-secondary mt-3"
          onClick={() => setLoading(false)}
        >
          Cancel Loading
        </button>
      </div>
    );
  }

  // Admin Controls Component
  const AdminControls = ({ wrestler = null }) => {
    if (!user || !user.isAdmin) return null;

    return (
      <div className="btn-group">
        {!wrestler && (
          <button
            className="btn btn-success"
            onClick={handleCreateFreeAgent}
          >
            <FaUserPlus className="me-2" /> Create Free Agent
          </button>
        )}
        
        {wrestler && (
          <div className="mt-2">
            <button
              className="btn btn-sm btn-outline-primary me-2"
              onClick={() => handleEditWrestler(wrestler._id)}
            >
              <i className="fas fa-edit me-1"></i> Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${wrestler.name}?`)) {
                  handleDeleteWrestler(wrestler._id);
                }
              }}
            >
              <i className="fas fa-trash me-1"></i> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Free Agent Wrestlers</h1>
        
        {/* Admin create button */}
        <AdminControls />
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search wrestlers..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="col-md-2">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaFilter />
                </span>
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
            </div>
            
            <div className="col-md-2">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaFilter />
                </span>
                <select
                  className="form-select"
                  value={filterGender}
                  onChange={handleGenderChange}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
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
                {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
              </button>
            </div>
          </div>
          
          {wrestlers.length === 0 ? (
            <div className="alert alert-info">
              There are no free agents available at this time.
              
              {/* Show admin button to create if no wrestlers */}
              {user && user.isAdmin && (
                <div className="mt-3">
                  <button 
                    className="btn btn-success"
                    onClick={handleCreateFreeAgent}
                  >
                    <FaUserPlus className="me-2" /> Create Free Agent
                  </button>
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
                        <div title="Strength" className="me-2"><FaDumbbell className="me-2" /> {wrestler.attributes.strength}</div>
                        <div title="Agility" className="me-2"><FaRunning className="me-2" /> {wrestler.attributes.agility}</div>
                        <div title="Charisma" className="me-2"><FaStar className="me-2" /> {wrestler.attributes.charisma}</div>
                        <div title="Technical" className="me-2"><FaCog className="me-2" /> {wrestler.attributes.technical}</div>
                      </div>
                      
                      {/* Admin Controls */}
                      {user && user.isAdmin && (
                        <AdminControls wrestler={wrestler} />
                      )}
                    </div>
                    
                    <div className="card-footer d-flex justify-content-between">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/wrestlers/${wrestler._id}`)}
                      >
                        View Profile
                      </button>
                      
                      {user && userCompanies.length > 0 && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => openSignModal(wrestler)}
                        >
                          Sign Wrestler
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
      
      {/* Sign Wrestler Modal */}
      {signingWrestler && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Sign {signingWrestler.name}</h5>
                <button type="button" className="btn-close" onClick={closeSignModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-body">
                        <h5 className="card-title">Wrestler Details</h5>
                        <p><strong>Style:</strong> {signingWrestler.style}</p>
                        <p><strong>Popularity:</strong> {signingWrestler.popularity}/100</p>
                        <p><strong>Weekly Salary:</strong> ${signingWrestler.salary.toLocaleString()}</p>
                        <p><strong>Overall Rating:</strong> {calculateOverall(signingWrestler.attributes)}/100</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label htmlFor="company" className="form-label">Sign to Company</label>
                      <select
                        id="company"
                        className="form-select"
                        value={signingCompany}
                        onChange={(e) => setSigningCompany(e.target.value)}
                        required
                      >
                        <option value="">Select a company</option>
                        {userCompanies.map(company => (
                          <option 
                            key={company._id} 
                            value={company._id}
                            disabled={company.money < signingWrestler.salary}
                          >
                            {company.name} (${company.money.toLocaleString()} available)
                          </option>
                        ))}
                      </select>
                      
                      {userCompanies.some(company => company.money < signingWrestler.salary) && (
                        <div className="text-danger small mt-1">
                          Companies with insufficient funds are disabled
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group mb-3">
                      <label htmlFor="contractLength" className="form-label">Contract Length (months)</label>
                      <input
                        type="number"
                        id="contractLength"
                        name="length"
                        className="form-control"
                        min="1"
                        max="60"
                        value={signingContract.length}
                        onChange={handleContractChange}
                      />
                    </div>
                    
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        id="exclusive"
                        name="exclusive"
                        className="form-check-input"
                        checked={signingContract.exclusive}
                        onChange={handleContractChange}
                      />
                      <label className="form-check-label" htmlFor="exclusive">
                        Exclusive Contract
                      </label>
                      <div className="text-muted small">
                        Wrestler can only perform for your company
                      </div>
                    </div>
                  </div>
                </div>
                
                {signingCompany && (
                  <div className="alert alert-info">
                    <strong>Contract Summary:</strong> {signingWrestler.name} will be signed to a {signingContract.length}-month 
                    {signingContract.exclusive ? ' exclusive' : ' non-exclusive'} contract for ${signingWrestler.salary.toLocaleString()}/week.
                    <br />
                    <strong>Total Contract Value:</strong> ${(signingWrestler.salary * 4 * signingContract.length).toLocaleString()}
                  </div>
                )}
                
                {userCompanies.length === 0 && (
                  <div className="alert alert-warning">
                    You don't have any companies yet. Create a company first to sign wrestlers.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeSignModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleSignWrestler}
                  disabled={!signingCompany || userCompanies.find(c => c._id === signingCompany)?.money < signingWrestler.salary}
                >
                  Sign Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeAgents;