// src/pages/ShowForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const ShowForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedVenue = queryParams.get('venue');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [userCompanies, setUserCompanies] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    date: '',
    venue: preselectedVenue || '',
    isRecurring: false,
    showType: 'Weekly TV',
    ticketPrice: 20,
    status: 'Draft'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's companies
        if (user) {
          const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { 
            withCredentials: true 
          });
          setUserCompanies(companyRes.data);
          
          // Set default company if available
          if (companyRes.data.length > 0 && !formData.company) {
            setFormData(prev => ({
              ...prev,
              company: companyRes.data[0]._id
            }));
          }
        }
        
        // Fetch available venues
        const venueRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/venues?available=true`);
        setVenues(venueRes.data);
        
        // If editing, fetch show data
        if (id) {
          const showRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/${id}`);
          const show = showRes.data;

            // Check if the show is completed, and redirect if it is
            if (show.status === 'Completed') {
                setError('Completed shows cannot be edited.');
                // Redirect to the show booking page (view-only mode)
                setTimeout(() => {
                navigate(`/shows/${id}/book`);
                }, 2000);
                return; // Stop further execution
            }
          
          setFormData({
            company: show.company._id,
            name: show.name,
            date: new Date(show.date).toISOString().split('T')[0],
            venue: show.venue._id,
            isRecurring: show.isRecurring,
            showType: show.showType,
            ticketPrice: show.ticketPrice,
            status: show.status
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, formData.company, preselectedVenue]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (id) {
        // Update existing show
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/shows/${id}`, 
          formData,
          { withCredentials: true }
        );
      } else {
        // Create new show
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/shows`, 
          formData,
          { withCredentials: true }
        );
      }

      // Redirect to show booking page
      navigate(`/shows/${response.data._id}/book`);
    } catch (err) {
      console.error('Error saving show:', err);
      setError(err.response?.data?.message || 'Error saving show data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum date for show (today)
  const minDate = new Date().toISOString().split('T')[0];

  const getVenueDetails = () => {
    if (!formData.venue) return null;
    
    const selectedVenue = venues.find(venue => venue._id === formData.venue);
    if (!selectedVenue) return null;
    
    return selectedVenue;
  };

  if (loading && !id) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          You must be logged in to create or edit shows.
        </div>
      </div>
    );
  }

  if (userCompanies.length === 0) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          You need to create a company before you can schedule shows.
        </div>
      </div>
    );
  }

  const venueDetails = getVenueDetails();

  return (
    <div className="container my-4">
      <h1 className="mb-4">{id ? 'Edit Show' : 'Schedule New Show'}</h1>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="company" className="form-label">Company *</label>
                  <select
                    className="form-select"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a company</option>
                    {userCompanies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Show Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Monday Night Raw, WrestleMania"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="showType" className="form-label">Show Type *</label>
                  <select
                    className="form-select"
                    id="showType"
                    name="showType"
                    value={formData.showType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Weekly TV">Weekly TV</option>
                    <option value="Special Event">Special Event</option>
                    <option value="Pay-Per-View">Pay-Per-View</option>
                    <option value="House Show">House Show</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="date" className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={minDate}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="ticketPrice" className="form-label">Ticket Price ($) *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="ticketPrice"
                      name="ticketPrice"
                      value={formData.ticketPrice}
                      onChange={handleChange}
                      min="5"
                      step="5"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isRecurring">
                    Recurring Show (repeats weekly)
                  </label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="venue" className="form-label">Venue *</label>
                  <select
                    className="form-select"
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a venue</option>
                    {venues.map(venue => (
                      <option key={venue._id} value={venue._id}>
                        {venue.name} - {venue.location} (Capacity: {venue.capacity.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                {venueDetails && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Venue Details</h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Capacity:</strong> {venueDetails.capacity.toLocaleString()}</p>
                          <p><strong>Rental Cost:</strong> ${venueDetails.rentalCost.toLocaleString()}</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Location:</strong> {venueDetails.location}</p>
                          <p><strong>Prestige:</strong> {venueDetails.prestige}/100</p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <h6>Estimated Financials:</h6>
                        <p><strong>Max Revenue:</strong> ${(venueDetails.capacity * formData.ticketPrice).toLocaleString()}</p>
                        <p><strong>Potential Profit:</strong> ${((venueDetails.capacity * formData.ticketPrice) - venueDetails.rentalCost).toLocaleString()}</p>
                        <small className="text-muted">
                          Note: Actual attendance depends on company popularity and show quality.
                        </small>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status *</label>
                  <select
                    className="form-select"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    {id && (
                      <>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Continue to Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShowForm;