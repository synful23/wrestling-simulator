// src/pages/Companies.js - Enhanced version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FaSearch, FaMapMarkerAlt, FaSortAmountDown, FaSortAmountUp, FaFilter, FaBuilding } from 'react-icons/fa';

const getCorrectImageUrl = (logoPath) => {
  if (!logoPath) return null;
  
  // If it's already a full URL, return it
  if (logoPath.startsWith('http')) return logoPath;
  
  const baseUrl = process.env.REACT_APP_API_URL || '';
  
  // Critical fix: Convert /uploads/ to /api/uploads/
  let correctedPath = logoPath;
  if (logoPath.startsWith('/uploads/')) {
    correctedPath = `/api${logoPath}`;
  } else if (logoPath.startsWith('uploads/')) {
    correctedPath = `/api/${logoPath}`;
  }
  
  // Remove any double slashes (except in http://)
  const fullUrl = `${baseUrl}${correctedPath}`.replace(/([^:])\/\//g, '$1/');
  
  return fullUrl;
};

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/companies');
        setCompanies(res.data);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Extract unique locations for the filter dropdown
  const locations = [...new Set(companies.map(company => company.location))].sort();

  // Event handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLocationChange = (e) => {
    setFilterLocation(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Filter and sort companies
  const filteredCompanies = companies
    .filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(company => 
      filterLocation ? company.location === filterLocation : true
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'createdAt') {
        return sortOrder === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'popularity') {
        return sortOrder === 'asc'
          ? a.popularity - b.popularity
          : b.popularity - a.popularity;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading companies...</span>
        </div>
        <p className="mt-3">Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h1 className="mb-3 mb-md-0">
          <FaBuilding className="me-2" /> Wrestling Companies
        </h1>
        <Link to="/create-company" className="btn btn-success">
          Create Company
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaMapMarkerAlt />
                </span>
                <select
                  className="form-select"
                  value={filterLocation}
                  onChange={handleLocationChange}
                  aria-label="Filter by location"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaFilter />
                </span>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={handleSortChange}
                  aria-label="Sort by"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="popularity">Popularity</option>
                </select>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={toggleSortOrder}
                  title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                >
                  {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="card shadow-sm p-5 text-center">
          <div className="py-5">
            <FaBuilding style={{ fontSize: '4rem', color: 'var(--gray-300)' }} />
            <h3 className="mt-4 mb-3">No companies found</h3>
            <p className="text-muted mb-4">
              {searchTerm || filterLocation ? 
                'Try adjusting your search filters to find wrestling companies.' : 
                'There are no wrestling companies registered yet.'}
            </p>
            <Link to="/create-company" className="btn btn-primary">
              Create the First Company
            </Link>
          </div>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredCompanies.map((company) => (
            <div key={company._id} className="col">
              <div className="card h-100 company-card shadow-sm">
                <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{height: '180px'}}>
                  {company.logo ? (
                    <img
                    src={`${getCorrectImageUrl(company.logo)}?t=${new Date().getTime()}`}
                    alt={`${company.name} logo`}
                    className="img-fluid" 
                    style={{maxHeight: '160px', maxWidth: '90%', objectFit: 'contain'}}
                  />
                  ) : (
                    <FaBuilding style={{ fontSize: '4rem', color: 'var(--gray-400)' }} />
                  )}
                </div>
                <div className="card-body">
                  <h5 className="card-title">{company.name}</h5>
                  <p className="card-text text-muted small">
                    <FaMapMarkerAlt className="me-1" /> {company.location}
                  </p>
                  
                  {/* Popularity Bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">Popularity</small>
                      <small className="text-muted">{company.popularity}/100</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
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
                  
                  <p className="card-text small text-truncate">{company.description}</p>
                </div>
                <div className="card-footer d-flex justify-content-between bg-light">
                  <div className="d-flex align-items-center">
                    <img
                      src={company.owner?.avatar || 'https://via.placeholder.com/24'}
                      alt="Owner"
                      className="rounded-circle me-1 avatar-sm"
                      style={{width: '24px', height: '24px'}}
                    />
                    <span className="text-muted small">{company.owner?.username}</span>
                  </div>
                  <div>
                    <Link to={`/company/${company._id}`} className="btn btn-sm btn-outline-primary">
                      Company Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Results Summary */}
      {filteredCompanies.length > 0 && (
        <div className="mt-4 text-center text-muted">
          Showing {filteredCompanies.length} of {companies.length} wrestling companies
        </div>
      )}
    </div>
  );
};

export default Companies;