// src/pages/VenueForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const VenueForm = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 1000,
    rentalCost: 5000,
    prestige: 50,
    description: '',
    isAvailable: true,
    owner: '',
    maintenanceCost: 0,
    profitShare: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's companies
        if (user) {
          const companyRes = await api.get('/api/companies/user');
          setUserCompanies(companyRes.data);
        }
        
        // If editing, fetch venue data
        if (id) {
          const venueRes = await api.get(`/api/venues/${id}`);
          const venue = venueRes.data;
          
          setFormData({
            name: venue.name,
            location: venue.location,
            capacity: venue.capacity,
            rentalCost: venue.rentalCost,
            prestige: venue.prestige,
            description: venue.description || '',
            isAvailable: venue.isAvailable,
            owner: venue.owner?._id || '',
            maintenanceCost: venue.maintenanceCost || 0,
            profitShare: venue.profitShare || 0
          });
          
          if (venue.image) {
            setImagePreview(`${process.env.REACT_APP_API_URL}${venue.image}`);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Image must be a JPG, PNG, or GIF file');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only allow admins to submit the form
    if (!user || !user.isAdmin) {
      setError('You do not have permission to perform this action');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add all fields to FormData
      Object.keys(formData).forEach(key => {
        if (key !== 'image' || (key === 'image' && formData[key])) {
          formDataToSend.append(key, formData[key]);
        }
      });

      let response;
      
      if (id) {
        // Update existing venue
        response = await api.put(
          `/api/venues/${id}`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      } else {
        // Create new venue
        response = await api.post(
          '/api/venues', 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      // Redirect to venues page
      navigate('/venues');
    } catch (err) {
      console.error('Error saving venue:', err);
      setError(err.response?.data?.message || 'Error saving venue data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading venue data...</p>
      </div>
    );
  }

  // Non-admin users get a read-only view
  if (!user || !user.isAdmin) {
    if (id) {
      // Show read-only details for an existing venue
      return (
        <div className="container my-4">
          <h1 className="mb-4">Venue Details</h1>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">{formData.name}</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-5">
                  {imagePreview && (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt={formData.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="col-md-7">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <h5>Location</h5>
                      <p>{formData.location}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <h5>Capacity</h5>
                      <p>{formData.capacity.toLocaleString()} seats</p>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <h5>Rental Cost</h5>
                      <p>${formData.rentalCost.toLocaleString()} per event</p>
                    </div>
                    
                    <div className="col-md-6">
                      <h5>Prestige</h5>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${formData.prestige}%` }}
                        ></div>
                      </div>
                      <span>{formData.prestige}/100</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h5>Status</h5>
                    <p>
                      {formData.isAvailable ? (
                        <span className="badge bg-success">Available for Booking</span>
                      ) : (
                        <span className="badge bg-danger">Not Available</span>
                      )}
                    </p>
                  </div>
                  
                  {formData.description && (
                    <div className="mb-3">
                      <h5>Description</h5>
                      <p>{formData.description}</p>
                    </div>
                  )}
                  
                  {formData.owner && (
                    <div className="mb-3">
                      <h5>Ownership</h5>
                      <p>This venue is owned by a wrestling company.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Economic details section */}
              <div className="card mt-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Venue Economics</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <p><strong>Cost per seat:</strong> ${(formData.rentalCost / formData.capacity).toFixed(2)}</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Typical Revenue:</strong> ${(formData.capacity * 20).toLocaleString()} (at $20 ticket price)</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Profit Potential:</strong> ${((formData.capacity * 20) - formData.rentalCost).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="small text-muted">
                    Note: Actual attendance and revenue will depend on your company popularity, ticket prices, and show quality.
                  </div>
                </div>
              </div>
              
              {/* Call to action for booking the venue */}
              {formData.isAvailable && (
                <div className="mt-4">
                  <Link 
                    to={`/shows/new?venue=${id}`} 
                    className="btn btn-success btn-lg"
                  >
                    Book This Venue for a Show
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/venues')}
            >
              Back to Venues
            </button>
          </div>
        </div>
      );
    } else {
      // Redirect non-admin users away from the venue creation page
      navigate('/venues');
      return null;
    }
  }

  // Admin user - Show editable form
  return (
    <div className="container my-4">
      <h1 className="mb-4">{id ? 'Edit Venue' : 'Create Venue'}</h1>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="card form-container">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left Column */}
              <div className="col-md-6">
                <h3 className="mb-3">Venue Information</h3>
                
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Venue Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="location" className="form-label">Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="City, Country"
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="capacity" className="form-label">Capacity *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="capacity"
                      name="capacity"
                      min="50"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="prestige" className="form-label">
                      Prestige: {formData.prestige}
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="prestige"
                      name="prestige"
                      min="1"
                      max="100"
                      value={formData.prestige}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="rentalCost" className="form-label">Rental Cost ($ per show) *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="rentalCost"
                    name="rentalCost"
                    min="0"
                    step="100"
                    value={formData.rentalCost}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Venue Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    name="image"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={handleImageChange}
                  />
                  <small className="text-muted">Max size: 2MB. Formats: JPG, PNG, GIF</small>
                  
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isAvailable">
                    Available for Booking
                  </label>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="col-md-6">
                <h3 className="mb-3">Ownership Details</h3>
                
                <div className="mb-3">
                  <label htmlFor="owner" className="form-label">Owner</label>
                  <select
                    className="form-select"
                    id="owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleChange}
                  >
                    <option value="">Public Venue (No Owner)</option>
                    {userCompanies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Public venues can be booked by any company. Company-owned venues may offer discounts or revenue sharing.
                  </small>
                </div>
                
                {formData.owner && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="maintenanceCost" className="form-label">Maintenance Cost ($/week)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="maintenanceCost"
                        name="maintenanceCost"
                        min="0"
                        step="100"
                        value={formData.maintenanceCost}
                        onChange={handleChange}
                      />
                      <small className="text-muted">
                        Weekly cost to maintain this venue
                      </small>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="profitShare" className="form-label">
                        Profit Share: {formData.profitShare}%
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        id="profitShare"
                        name="profitShare"
                        min="0"
                        max="100"
                        value={formData.profitShare}
                        onChange={handleChange}
                      />
                      <small className="text-muted">
                        Percentage of other companies' profits that go to the owner when they book this venue
                      </small>
                    </div>
                  </>
                )}
                
                <div className="alert alert-info mt-4">
                  <h5>Venue Economics</h5>
                  <p>
                    <strong>Cost per seat:</strong> ${(formData.rentalCost / formData.capacity).toFixed(2)}
                  </p>
                  <p>
                    <strong>Potential Revenue:</strong> ${(formData.capacity * 20).toLocaleString()} (at $20 ticket price)
                  </p>
                  <p>
                    <strong>Theoretical Profit:</strong> ${((formData.capacity * 20) - formData.rentalCost).toLocaleString()}
                  </p>
                  <small className="text-muted">
                    Note: Actual attendance and revenue will depend on company popularity, ticket prices, and show quality.
                  </small>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/venues')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.name || !formData.location}
              >
                {loading ? 'Saving...' : (id ? 'Update Venue' : 'Create Venue')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VenueForm;