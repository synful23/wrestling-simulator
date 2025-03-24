// src/pages/ChampionshipsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaTrophy, FaSearch, FaFilter, FaPlus } from 'react-icons/fa';

const getCorrectImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) return imagePath;
  
  const baseUrl = process.env.REACT_APP_API_URL || '';
  
  // Critical fix: Convert /uploads/ to /api/uploads/
  let correctedPath = imagePath;
  if (imagePath.startsWith('/uploads/')) {
    correctedPath = `/api${imagePath}`;
  } else if (imagePath.startsWith('uploads/')) {
    correctedPath = `/api/${imagePath}`;
  }
  
  // Remove any double slashes (except in http://)
  const fullUrl = `${baseUrl}${correctedPath}`.replace(/([^:])\/\//g, '$1/');
  
  return fullUrl;
};

const ChampionshipsPage = () => {
  const { companyId } = useParams();
  const { user } = useContext(AuthContext);
  
  const [championships, setChampionships] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeight, setFilterWeight] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch API endpoint based on whether we have a companyId
        const endpoint = companyId 
          ? `/api/championships/company/${companyId}`
          : '/api/championships';
        
        const champRes = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`);
        setChampionships(champRes.data);
        
        // If company ID provided, fetch company details
        if (companyId) {
          const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/${companyId}`);
          setCompany(companyRes.data);
        }
      } catch (err) {
        console.error('Error fetching championships:', err);
        setError('Failed to load championships. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId]);
  
  // Check if the user is the company owner
  const isCompanyOwner = company && user && 
  (user.id === company.owner || user._id === company.owner || 
   user.id === company.owner._id || user._id === company.owner._id);
  
  // Filter championships
  const filteredChampionships = championships.filter(championship => {
    // Filter by search term
    const matchesSearch = championship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (championship.description && championship.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by weight class
    const matchesWeight = filterWeight ? championship.weight === filterWeight : true;
    
    return matchesSearch && matchesWeight;
  });
  
  // Get weight class options
  const weightClasses = [...new Set(championships.map(c => c.weight))];
  
  // Get championship prestige color
  const getPrestigeColor = (prestige) => {
    if (prestige >= 80) return 'bg-success';
    if (prestige >= 60) return 'bg-info';
    if (prestige >= 40) return 'bg-warning';
    return 'bg-danger';
  };
  
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading championships...</span>
        </div>
        <p className="mt-3">Loading championships...</p>
      </div>
    );
  }
  
  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <FaTrophy className="me-2" />
          {company ? `${company.name} Championships` : 'All Championships'}
        </h1>
        
        {isCompanyOwner && (
          <Link to={`/championships/new${companyId ? `?company=${companyId}` : ''}`} className="btn btn-success">
            <FaPlus className="me-2" /> Create Championship
          </Link>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search championships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaFilter />
                </span>
                <select
                  className="form-select"
                  value={filterWeight}
                  onChange={(e) => setFilterWeight(e.target.value)}
                >
                  <option value="">All Weight Classes</option>
                  {weightClasses.map(weight => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Championships Grid */}
      {filteredChampionships.length === 0 ? (
        <div className="card text-center p-5">
          <div className="py-5">
            <FaTrophy style={{ fontSize: '4rem', color: 'var(--gray-300)' }} />
            <h3 className="mt-4 mb-3">No Championships Found</h3>
            <p className="mb-4 text-muted">
              {searchTerm || filterWeight ? 
                'Try adjusting your search filters.' : 
                'There are no championships to display.'}
            </p>
            
            {isCompanyOwner && (
              <Link 
                to={`/championships/new${companyId ? `?company=${companyId}` : ''}`} 
                className="btn btn-primary"
              >
                Create Your First Championship
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredChampionships.map(championship => (
            <div key={championship._id} className="col">
              <div className="card h-100 championship-card">
                <div className="card-header bg-dark text-white">
                  <h5 className="card-title mb-0">{championship.name}</h5>
                </div>
                
                <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{height: '200px'}}>
                  {championship.image ? (
                    <img
                      src={getCorrectImageUrl(championship.image)}
                      alt={`${championship.name}`}
                      className="img-fluid" 
                      style={{maxHeight: '180px', maxWidth: '90%', objectFit: 'contain'}}
                      onError={(e) => {
                        console.error('Image failed to load:', championship.image);
                        e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <FaTrophy style={{ fontSize: '4rem', color: 'var(--gray-400)' }} />
                  )}
                </div>
                
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span><strong>Prestige:</strong> {championship.prestige}/100</span>
                      <span className="badge bg-secondary">{championship.weight}</span>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className={`progress-bar ${getPrestigeColor(championship.prestige)}`} 
                        style={{ width: `${championship.prestige}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <h6 className="card-subtitle mb-2">Current Champion</h6>
                  {championship.currentHolder ? (
                    <div className="d-flex align-items-center">
                      {championship.currentHolder.image ? (
                        <img
                          src={getCorrectImageUrl(championship.currentHolder.image)}
                          alt={championship.currentHolder.name}
                          className="me-2 rounded-circle"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40x40?text=?';
                            e.target.onerror = null;
                          }}
                        />
                      ) : (
                        <div 
                          className="me-2 bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {championship.currentHolder.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div>{championship.currentHolder.name}</div>
                        <small className="text-muted">Popularity: {championship.currentHolder.popularity}/100</small>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">
                      No current champion
                    </div>
                  )}
                  
                  {championship.description && (
                    <p className="card-text mt-3 small text-muted">{championship.description}</p>
                  )}
                </div>
                
                <div className="card-footer">
                  <Link to={`/championships/${championship._id}`} className="btn btn-primary w-100">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Results count */}
      {filteredChampionships.length > 0 && (
        <div className="mt-4 text-center text-muted">
          Showing {filteredChampionships.length} of {championships.length} championships
        </div>
      )}
    </div>
  );
};

export default ChampionshipsPage;