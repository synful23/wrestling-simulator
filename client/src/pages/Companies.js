// src/pages/Companies.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api'; // Import your configured axios

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const locations = [...new Set(companies.map(company => company.location))].sort();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
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
      }
      return 0;
    });

  if (loading) {
    return <div className="text-center mt-8">Loading companies...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wrestling Companies</h1>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="search">
              Search
            </label>
            <input
              id="search"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="location">
              Filter by Location
            </label>
            <select
              id="location"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={filterLocation}
              onChange={handleLocationChange}
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end space-x-2">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="sort">
                Sort By
              </label>
              <select
                id="sort"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
              </select>
            </div>
            
            <button
              onClick={toggleSortOrder}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded h-10"
              title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p>No companies found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div className="card h-100">
            <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{height: '180px'}}>
              {company.logo ? (
                <img
                  src={`${process.env.REACT_APP_API_URL}${company.logo}`}
                  alt={`${company.name} logo`}
                  className="img-fluid" 
                  style={{maxHeight: '160px', maxWidth: '90%', objectFit: 'contain'}}
                />
              ) : (
                <span className="text-muted">No Logo</span>
              )}
            </div>
            <div className="card-body">
              <h5 className="card-title">{company.name}</h5>
              <p className="card-text text-muted small">Location: {company.location}</p>
              <p className="card-text small text-truncate">{company.description}</p>
            </div>
            <div className="card-footer d-flex justify-content-between bg-white">
              <div className="d-flex align-items-center">
                <img
                  src={company.owner?.avatar || 'https://via.placeholder.com/24'}
                  alt="Owner"
                  className="rounded-circle me-1"
                  style={{width: '24px', height: '24px'}}
                />
                <span className="text-muted small">{company.owner?.username}</span>
              </div>
              <div className="text-muted small">
                {new Date(company.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;