// src/pages/CompanyDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

/**
 * Corrects image paths for the API
 * @param {string} logoPath - The logo path from the database
 * @returns {string} The corrected URL
 */
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

// Component for logo update form
const CompanyLogoUpdateForm = ({ companyId, currentLogo, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(
    currentLogo ? `${process.env.REACT_APP_API_URL}${currentLogo}` : null
  );

  const handleLogoSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('company-logo-file');
    const file = fileInput.files[0];
    
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be smaller than 2MB');
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('File must be JPG, PNG, or GIF');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      // Only include the logo field to minimize potential issues
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/companies/${companyId}`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
      
      if (response.data && response.data.logo) {
        // Force cache busting with timestamp
        const timestamp = new Date().getTime();
        setPreviewUrl(`${process.env.REACT_APP_API_URL}${response.data.logo}?t=${timestamp}`);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError('Logo was not updated. Please try again.');
      }
    } catch (err) {
      console.error('Error updating logo:', err);
      setError('Failed to update logo: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">Update Company Logo</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {previewUrl && (
          <div className="text-center mb-3">
            <img 
              src={previewUrl} 
              alt="Logo preview" 
              className="img-thumbnail" 
              style={{ maxHeight: '150px' }} 
            />
          </div>
        )}
        
        <form onSubmit={handleLogoSubmit}>
          <div className="mb-3">
            <label htmlFor="company-logo-file" className="form-label">
              Select new logo
            </label>
            <input
              type="file"
              className="form-control"
              id="company-logo-file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
            />
            <div className="form-text">
              Max size: 2MB. Formats: JPG, PNG, GIF
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : (
              'Update Logo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [company, setCompany] = useState(null);
  const [wrestlers, setWrestlers] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });

  console.log('CompanyDetails component rendered');

  // Fetch company data and related info
  useEffect(() => {
    console.log('CompanyDetails useEffect called');

    const fetchCompanyData = async () => {
      try {
        setLoading(true);

        // Fetch company details
        const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/${id}`, {
          withCredentials: true
        });
        setCompany(companyRes.data);
        setFormData({
          name: companyRes.data.name,
          location: companyRes.data.location,
          description: companyRes.data.description
        });

        // Fetch wrestlers for this company
        const wrestlersRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/wrestlers/company/${id}`
        );
        setWrestlers(wrestlersRes.data);

        // Fetch shows for this company
        const showsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/shows/company/${id}`
        );
        setShows(showsRes.data);

      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission for company updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create form data with only the text fields
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/companies/${id}`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
      
      // Update company state with response data
      setCompany({
        ...company,
        name: res.data.name,
        location: res.data.location,
        description: res.data.description
      });
      
      alert('Company updated successfully');
    } catch (err) {
      console.error('Error updating company:', err);
      setError(err.response?.data?.message || 'Error updating company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle company disbanding
  const handleDisband = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/companies/${id}`, {
        withCredentials: true
      });
      
      alert('Company disbanded successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error disbanding company:', err);
      setError(err.response?.data?.message || 'Error disbanding company. Please try again.');
    }
    setShowModal(false);
  };

  // Calculate weekly expenses
  const calculateWeeklyExpenses = () => {
    if (!wrestlers.length) return 0;
    
    // Calculate total weekly salary for all wrestlers
    const totalSalary = wrestlers.reduce((sum, wrestler) => sum + (wrestler.salary || 0), 0);
    
    // Add any other weekly expenses (venues, etc.)
    const otherExpenses = 0; // You can add more expenses here
    
    return totalSalary + otherExpenses;
  };

  // Count upcoming shows
  const countUpcomingShows = () => {
    if (!shows.length) return 0;
    
    const now = new Date();
    return shows.filter(show => new Date(show.date) > now).length;
  };

  // Open modal for confirm actions
  const openModal = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  // Handle logo update success
  const handleLogoUpdateSuccess = (updatedCompany) => {
    setCompany({
      ...company,
      logo: updatedCompany.logo
    });
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading company data...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Company not found or you don't have permission to view it.
        </div>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Check if user is the company owner
  const isOwner = user && company.owner && 
    (user.id === company.owner._id || user._id === company.owner._id || user.id === company.owner || user._id === company.owner);

  return (
    <div className="container my-4">
      <h1 className="mb-4">Manage Company</h1>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="row">
        {/* Left Column - Company Info */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">{company.name}</h3>
            </div>
            <div className="card-body text-center">
            {company.logo ? (
  <img
    src={`${getCorrectImageUrl(company.logo)}?t=${new Date().getTime()}`}
    alt={`${company.name} logo`}
    className="img-fluid mb-3"
    style={{ maxHeight: '150px' }}
    onError={(e) => {
      console.error('Logo failed to load:', company.logo);
      e.target.src = 'https://via.placeholder.com/150x150?text=No+Logo';
      e.target.onerror = null;
    }}
  />
) : (
  <div className="bg-light d-flex align-items-center justify-content-center mb-3" style={{height: '150px'}}>
    <span className="text-muted">No Logo</span>
  </div>
)}
              
              <h5><strong>Location:</strong> {company.location}</h5>
              
              <div className="mt-3">
                <p><strong>Popularity:</strong></p>
                <div className="progress mb-2">
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
                    {company.popularity}%
                  </div>
                </div>
              </div>
              
              <div className="row mt-4">
                <div className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body p-2 text-center">
                      <h3 className={company.money >= 0 ? 'text-success' : 'text-danger'}>
                        ${company.money?.toLocaleString()}
                      </h3>
                      <div className="small">Funds</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body p-2 text-center">
                      <h3 className="text-danger">-${calculateWeeklyExpenses().toLocaleString()}</h3>
                      <div className="small">Weekly Expenses</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body p-2 text-center">
                      <h3>{wrestlers.length}</h3>
                      <div className="small">Wrestlers</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body p-2 text-center">
                      <h3>{countUpcomingShows()}</h3>
                      <div className="small">Upcoming Shows</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="font-italic">"{company.description}"</p>
              </div>
            </div>
            <div className="card-footer text-muted">
              <small>Created: {new Date(company.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
          
          {isOwner && (
            <div className="mt-4">
              <h4>Management Actions</h4>
              <div className="list-group">
                <Link to={`/roster/${company._id}`} className="list-group-item list-group-item-action">
                  <i className="fas fa-users me-2"></i> Manage Roster
                </Link>
                <Link to={`/shows/company/${company._id}`} className="list-group-item list-group-item-action">
                  <i className="fas fa-calendar-alt me-2"></i> Manage Shows
                </Link>
                <Link to={`/shows/new?company=${company._id}`} className="list-group-item list-group-item-action">
                  <i className="fas fa-plus me-2"></i> Schedule New Show
                </Link>
                <Link to="/free-agents" className="list-group-item list-group-item-action">
                  <i className="fas fa-user-plus me-2"></i> Sign Free Agents
                </Link>
                <button 
                  className="list-group-item list-group-item-action list-group-item-danger"
                  onClick={() => openModal('disband')}
                >
                  <i className="fas fa-trash me-2"></i> Disband Company
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Edit Form and Stats */}
        <div className="col-md-8">
          {isOwner ? (
            <>
              {/* Separate Logo Form */}
              <CompanyLogoUpdateForm 
                companyId={company._id}
                currentLogo={company.logo}
                onSuccess={handleLogoUpdateSuccess}
              />
              
              {/* Company Details Form */}
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <h3 className="mb-0">Edit Company Details</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Company Name</label>
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
                      <label htmlFor="location" className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                    
                    <button 
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">
              You are viewing this company as a guest. Only the owner can manage this company.
            </div>
          )}
          
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h3 className="mb-0">Recent Shows</h3>
            </div>
            <div className="card-body">
              {shows.length === 0 ? (
                <div className="text-center py-3">
                  <p>No shows found for this company.</p>
                  {isOwner && (
                    <Link to={`/shows/new?company=${company._id}`} className="btn btn-primary">
                      Schedule Your First Show
                    </Link>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Venue</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shows
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5)
                        .map(show => (
                          <tr key={show._id}>
                            <td>{new Date(show.date).toLocaleDateString()}</td>
                            <td>{show.name}</td>
                            <td>{show.venue?.name}</td>
                            <td>
                              <span className={`badge ${
                                show.status === 'Completed' ? 'bg-success' : 
                                show.status === 'In Progress' ? 'bg-primary' : 
                                show.status === 'Scheduled' ? 'bg-info' : 
                                show.status === 'Cancelled' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {show.status}
                              </span>
                            </td>
                            <td>
                              <Link to={`/shows/${show._id}/book`} className="btn btn-sm btn-primary">
                                {show.status === 'Completed' ? 'View Results' : 'Manage'}
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="text-center mt-3">
                <Link to={`/shows/company/${company._id}`} className="btn btn-outline-primary">
                  View All Shows
                </Link>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Top Wrestlers</h3>
            </div>
            <div className="card-body">
              {wrestlers.length === 0 ? (
                <div className="text-center py-3">
                  <p>No wrestlers found in this company's roster.</p>
                  {isOwner && (
                    <Link to="/free-agents" className="btn btn-primary">
                      Sign Free Agents
                    </Link>
                  )}
                </div>
              ) : (
                <div className="row">
                  {wrestlers
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 4)
                    .map(wrestler => (
                      <div key={wrestler._id} className="col-md-6 mb-3">
                        <div className="card h-100">
                          <div className="card-body d-flex align-items-center">
                            {wrestler.image ? (
                              <img
                                src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                                alt={wrestler.name}
                                className="me-3 rounded-circle"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="me-3 bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: '50px', height: '50px' }}
                              >
                                {wrestler.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h5 className="mb-0">{wrestler.name}</h5>
                              <div className="text-muted small">{wrestler.style} • {wrestler.popularity}/100</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              <div className="text-center mt-3">
                <Link to={`/roster/${company._id}`} className="btn btn-outline-primary">
                  View Full Roster
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  {modalAction === 'disband' ? 'Disband Company' : 'Sell Company'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {modalAction === 'disband' ? (
                  <p>
                    Are you sure you want to disband <strong>{company.name}</strong>? 
                    This action cannot be undone. All wrestlers will become free agents.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to sell <strong>{company.name}</strong>?
                    This feature is not yet implemented.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                {modalAction === 'disband' && (
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDisband}
                  >
                    Disband Company
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <Link to="/dashboard" className="btn btn-secondary">
          <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default CompanyDetails;