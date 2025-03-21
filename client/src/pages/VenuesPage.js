// src/pages/VenuesPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const VenuesPage = () => {
  const { user } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [sortBy, setSortBy] = useState('capacity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [userCompanies, setUserCompanies] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await api.get(`${process.env.REACT_APP_API_URL}/api/venues?available=true`);
        setVenues(res.data);
        
        // If user is logged in, get their companies
        if (user) {
          const companiesRes = await api.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { 
            withCredentials: true 
          });
          setUserCompanies(companiesRes.data);
        }
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to load venues. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [user]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLocationChange = (e) => {
    setFilterLocation(e.target.value);
  };

  const handleCapacityChange = (e) => {
    setMinCapacity(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

    // Add the missing handleDeleteVenue function
    const handleDeleteVenue = (venueId) => {
      // Set the venueId to delete and show confirmation
      setDeleteConfirm(venueId);
    };
  
    // Function to confirm deletion
    const confirmDeleteVenue = async () => {
      try {
        if (!deleteConfirm) return;
        
        await api.delete(`/api/venues/${deleteConfirm}`);
        
        // Remove venue from state
        setVenues(venues.filter(venue => venue._id !== deleteConfirm));
        
        // Clear the confirmation
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Error deleting venue:', err);
        setError(err.response?.data?.message || 'Failed to delete venue');
      }
    };

  const getUniqueLocations = () => {
    const locations = venues.map(venue => venue.location.split(',')[1]?.trim() || venue.location).filter(Boolean);
    return [...new Set(locations)].sort();
  };

  // Filter and sort venues
  const filteredVenues = venues
    .filter(venue => 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(venue => 
      filterLocation ? venue.location.includes(filterLocation) : true
    )
    .filter(venue => 
      minCapacity ? venue.capacity >= parseInt(minCapacity) : true
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'capacity') {
        return sortOrder === 'asc'
          ? a.capacity - b.capacity
          : b.capacity - a.capacity;
      } else if (sortBy === 'rentalCost') {
        return sortOrder === 'asc'
          ? a.rentalCost - b.rentalCost
          : b.rentalCost - a.rentalCost;
      } else if (sortBy === 'prestige') {
        return sortOrder === 'asc'
          ? a.prestige - b.prestige
          : b.prestige - a.prestige;
      }
      return 0;
    });

  if (loading) {
    return <div className="text-center mt-5">Loading venues...</div>;
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
  <h1>Venues</h1>
  
  {user && user.isAdmin && (
    <Link to="/venues/new" className="btn btn-success">
      Create Venue
    </Link>
  )}
</div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search venues..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterLocation}
                onChange={handleLocationChange}
              >
                <option value="">All Locations</option>
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Min capacity"
                value={minCapacity}
                onChange={handleCapacityChange}
              />
            </div>
            
            <div className="col-md-3 d-flex">
              <select
                className="form-select me-2"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="capacity">Sort by Capacity</option>
                <option value="name">Sort by Name</option>
                <option value="rentalCost">Sort by Rental Cost</option>
                <option value="prestige">Sort by Prestige</option>
              </select>
              
              <button
                className="btn btn-outline-secondary"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          
          {venues.length === 0 ? (
            <div className="alert alert-info">
              No venues available.
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="alert alert-warning">
              No venues match your search criteria.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {filteredVenues.map(venue => (
                <div key={venue._id} className="col">
                  <div className="card h-100">
                    <div className="card-img-top bg-light" style={{ height: '180px' }}>
                      {venue.image ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${venue.image}`}
                          alt={venue.name}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                          <i className="fas fa-building fa-3x"></i>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-body">
                      <h5 className="card-title">{venue.name}</h5>
                      <p className="card-text text-muted">{venue.location}</p>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <div><strong>Capacity:</strong> {venue.capacity.toLocaleString()}</div>
                        <div><strong>Prestige:</strong> {venue.prestige}/100</div>
                      </div>
                      <div><strong>Rental Cost:</strong> ${venue.rentalCost.toLocaleString()}</div>
                      
                      {venue.description && (
                        <p className="card-text mt-2 small">{venue.description}</p>
                      )}
                      
                      {venue.owner && (
                        <div className="mt-2 small text-muted">
                          <strong>Owned by:</strong> {venue.owner.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer d-flex justify-content-between">
  <Link to={`/venues/${venue._id}`} className="btn btn-sm btn-outline-primary">
    View Details
  </Link>
  
  {user && user.isAdmin && (
    <div>
      <Link 
        to={`/venues/edit/${venue._id}`} 
        className="btn btn-sm btn-outline-secondary me-2"
      >
        Edit
      </Link>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => handleDeleteVenue(venue._id)}
      >
        Delete
      </button>
    </div>
  )}
  
  {user && userCompanies.length > 0 && venue.isAvailable && (
    <Link to={`/shows/new?venue=${venue._id}`} className="btn btn-sm btn-success">
      Book Venue
    </Link>
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

export default VenuesPage;