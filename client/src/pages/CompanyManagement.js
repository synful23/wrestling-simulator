// src/pages/CompanyManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const CompanyManagement = () => {
  const { companyId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [wrestlers, setWrestlers] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [financialData, setFinancialData] = useState({
    weeklyIncome: 0,
    weeklyExpenses: 0,
    netWeekly: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch company details
        const companyRes = await api.get(`/api/companies/${companyId}`);
        const companyData = companyRes.data;
        setCompany(companyData);
        
        // Initialize form data
        setFormData({
          name: companyData.name,
          location: companyData.location,
          description: companyData.description || ''
        });
        
        // Set logo preview if exists
        if (companyData.logo) {
          setLogoPreview(`${process.env.REACT_APP_API_URL}${companyData.logo}`);
        }
        
        // Fetch company's wrestlers
        try {
          const wrestlersRes = await api.get(`/api/wrestlers/company/${companyId}`);
          setWrestlers(wrestlersRes.data || []);
        } catch (err) {
          console.error('Error fetching wrestlers:', err);
          setWrestlers([]);
        }
        
        // Fetch company's shows
        try {
          const showsRes = await api.get(`/api/shows/company/${companyId}`);
          setShows(showsRes.data || []);
        } catch (err) {
          console.error('Error fetching shows:', err);
          setShows([]);
        }
        
        // Calculate financial data
        calculateFinancials(companyData, wrestlersRes?.data || [], showsRes?.data || []);
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const calculateFinancials = (company, wrestlers, shows) => {
    // Calculate weekly wrestler expenses
    const weeklyWrestlerSalaries = wrestlers.reduce((total, wrestler) => total + wrestler.salary, 0);
    
    // Calculate other weekly expenses (simplified)
    const otherWeeklyExpenses = 5000; // Fixed additional expenses
    
    // Calculate total weekly expenses
    const totalWeeklyExpenses = weeklyWrestlerSalaries + otherWeeklyExpenses;
    
    // Calculate weekly income (simplified)
    const weeklyIncome = 10000; // Base weekly income
    
    // Calculate net weekly cash flow
    const netWeekly = weeklyIncome - totalWeeklyExpenses;
    
    // Calculate show statistics
    const completedShows = shows.filter(show => show.status === 'Completed');
    const totalRevenue = completedShows.reduce((total, show) => 
      total + (show.ticketRevenue || 0) + (show.merchandiseRevenue || 0), 0);
    const totalExpenses = completedShows.reduce((total, show) => 
      total + (show.venueRentalCost || 0) + (show.productionCost || 0) + (show.talentCost || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    
    setFinancialData({
      weeklyIncome,
      weeklyExpenses: totalWeeklyExpenses,
      netWeekly,
      totalRevenue,
      totalExpenses,
      totalProfit
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB');
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Logo must be a JPG, PNG, or GIF file');
        return;
      }
      
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      
      if (logo) {
        formDataToSend.append('logo', logo);
      }

      const response = await api.put(`/api/companies/${companyId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCompany(response.data);
      setEditMode(false);
      setError('');
    } catch (err) {
      console.error('Error updating company:', err);
      setError(err.response?.data?.message || 'Error updating company');
    }
  };

  const isCompanyOwner = company && user && company.owner === user.id;

  // Show loading state
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading company data...</span>
        </div>
        <p className="mt-2">Loading company data...</p>
      </div>
    );
  }

  // Show error state
  if (error && !company) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Show not found state
  if (!company) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Company not found
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Show unauthorized state
  if (!isCompanyOwner) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          You do not have permission to manage this company
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container my-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{editMode ? 'Edit' : 'Manage'} {company.name}</h1>
        <div>
          {!editMode ? (
            <button 
              className="btn btn-primary"
              onClick={() => setEditMode(true)}
            >
              Edit Company
            </button>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row">
        {/* Left Column - Company Details */}
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Company Details</h3>
            </div>
            <div className="card-body">
              {editMode ? (
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
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="logo" className="form-label">Company Logo</label>
                    <input
                      type="file"
                      className="form-control"
                      id="logo"
                      name="logo"
                      accept="image/jpeg, image/png, image/gif"
                      onChange={handleLogoChange}
                    />
                    {logoPreview && (
                      <div className="mt-2 text-center">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="img-thumbnail"
                          style={{ maxHeight: '150px' }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <button type="submit" className="btn btn-success">
                    Save Changes
                  </button>
                </form>
              ) : (
                <>
                  <div className="text-center mb-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={company.name}
                        className="img-fluid mb-3"
                        style={{ maxHeight: '150px' }}
                      />
                    ) : (
                      <div className="bg-light p-3 rounded mb-3">
                        <span className="text-muted">No Logo</span>
                      </div>
                    )}
                    <h4>{company.name}</h4>
                    <p className="text-muted">{company.location}</p>
                  </div>
                  
                  <div className="mb-3">
                    <h5>Popularity</h5>
                    <div className="progress mb-2">
                      <div 
                        className={`progress-bar ${
                          company.popularity >= 80 ? 'bg-success' : 
                          company.popularity >= 60 ? 'bg-info' : 
                          company.popularity >= 40 ? 'bg-warning' : 
                          'bg-danger'
                        }`}
                        style={{ width: `${company.popularity}%` }}
                      ></div>
                    </div>
                    <span>{company.popularity}/100</span>
                  </div>
                  
                  <div className="mb-3">
                    <h5>Available Funds</h5>
                    <h3 className="text-success">${company.money?.toLocaleString() || 0}</h3>
                  </div>
                  
                  {company.description && (
                    <div className="mb-3">
                      <h5>About</h5>
                      <p>{company.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Financial Overview */}
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h3 className="mb-0">Financial Overview</h3>
            </div>
            <div className="card-body">
              <h5>Weekly Balance</h5>
              <div className="table-responsive mb-3">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td>Weekly Income</td>
                      <td className="text-end text-success">+${financialData.weeklyIncome.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Weekly Expenses</td>
                      <td className="text-end text-danger">-${financialData.weeklyExpenses.toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td>Net Weekly</td>
                      <td className={`text-end ${financialData.netWeekly >= 0 ? 'text-success' : 'text-danger'}`}>
                        {financialData.netWeekly >= 0 ? '+' : ''}${financialData.netWeekly.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h5>Show Performance</h5>
              <div className="table-responsive">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td>Total Revenue</td>
                      <td className="text-end text-success">${financialData.totalRevenue.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Total Expenses</td>
                      <td className="text-end text-danger">${financialData.totalExpenses.toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td>Total Profit</td>
                      <td className={`text-end ${financialData.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${financialData.totalProfit.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Quick Actions, Roster & Shows */}
        <div className="col-md-8">
          {/* Quick Actions */}
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="mb-0">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <Link to={`/roster/${companyId}`} className="btn btn-primary w-100 py-3">
                    <i className="fas fa-users me-2"></i>
                    Manage Roster
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to={`/shows/company/${companyId}`} className="btn btn-success w-100 py-3">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Manage Shows
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to="/free-agents" className="btn btn-warning w-100 py-3">
                    <i className="fas fa-user-plus me-2"></i>
                    Sign Wrestlers
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Roster Overview */}
          <div className="card mb-4">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Roster Overview</h3>
              <Link to={`/roster/${companyId}`} className="btn btn-sm btn-light">
                View Full Roster
              </Link>
            </div>
            <div className="card-body">
              {wrestlers.length === 0 ? (
                <div className="alert alert-info">
                  <p className="mb-0">You don't have any wrestlers on your roster yet.</p>
                  <div className="mt-2">
                    <Link to="/free-agents" className="btn btn-sm btn-primary">
                      Sign Free Agents
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <h5>Roster Size: {wrestlers.length} wrestlers</h5>
                    </div>
                    <div>
                      <span className="text-danger">Weekly Salary: ${wrestlers.reduce((sum, wrestler) => sum + wrestler.salary, 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Style</th>
                          <th>Popularity</th>
                          <th>Salary</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {wrestlers.slice(0, 5).map(wrestler => (
                          <tr key={wrestler._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {wrestler.image ? (
                                  <img 
                                    src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                                    alt={wrestler.name}
                                    className="me-2 rounded-circle"
                                    style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="me-2 bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '30px', height: '30px' }}
                                  >
                                    {wrestler.name.charAt(0)}
                                  </div>
                                )}
                                {wrestler.name}
                              </div>
                            </td>
                            <td>{wrestler.style}</td>
                            <td>{wrestler.popularity}</td>
                            <td>${wrestler.salary.toLocaleString()}</td>
                            <td>
                              <Link to={`/wrestlers/${wrestler._id}`} className="btn btn-sm btn-outline-primary">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                        
                        {wrestlers.length > 5 && (
                          <tr>
                            <td colSpan="5" className="text-center">
                              <Link to={`/roster/${companyId}`}>
                                View all {wrestlers.length} wrestlers...
                              </Link>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Upcoming Shows */}
          <div className="card mb-4">
            <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Upcoming Shows</h3>
              <Link to={`/shows/company/${companyId}`} className="btn btn-sm btn-light">
                View All Shows
              </Link>
            </div>
            <div className="card-body">
              {shows.length === 0 ? (
                <div className="alert alert-info">
                  <p className="mb-0">You don't have any shows scheduled yet.</p>
                  <div className="mt-2">
                    <Link to="/shows/new" className="btn btn-sm btn-primary">
                      Schedule a Show
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Show Name</th>
                          <th>Date</th>
                          <th>Venue</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {shows
                          .filter(show => ['Draft', 'Scheduled'].includes(show.status))
                          .sort((a, b) => new Date(a.date) - new Date(b.date))
                          .slice(0, 5)
                          .map(show => (
                            <tr key={show._id}>
                              <td>{show.name}</td>
                              <td>{new Date(show.date).toLocaleDateString()}</td>
                              <td>{show.venue.name}</td>
                              <td>
                                <span className={`badge ${
                                  show.status === 'Draft' ? 'bg-secondary' : 
                                  show.status === 'Scheduled' ? 'bg-info' :
                                  show.status === 'In Progress' ? 'bg-primary' :
                                  show.status === 'Completed' ? 'bg-success' :
                                  'bg-danger'
                                }`}>
                                  {show.status}
                                </span>
                              </td>
                              <td>
                                <Link to={`/shows/${show._id}/book`} className="btn btn-sm btn-outline-primary">
                                  {show.status === 'Draft' ? 'Book Show' : 'Manage'}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        
                        {shows.filter(show => ['Draft', 'Scheduled'].includes(show.status)).length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center">
                              No upcoming shows scheduled
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3">
                    <Link to="/shows/new" className="btn btn-primary">
                      Schedule New Show
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Recent Results */}
          <div className="card">
            <div className="card-header bg-dark text-white">
              <h3 className="mb-0">Recent Results</h3>
            </div>
            <div className="card-body">
              {shows.filter(show => show.status === 'Completed').length === 0 ? (
                <div className="alert alert-info">
                  <p className="mb-0">No completed shows yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Show Name</th>
                        <th>Date</th>
                        <th>Rating</th>
                        <th>Attendance</th>
                        <th>Profit</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shows
                        .filter(show => show.status === 'Completed')
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 3)
                        .map(show => (
                          <tr key={show._id}>
                            <td>{show.name}</td>
                            <td>{new Date(show.date).toLocaleDateString()}</td>
                            <td>
                              {show.overallRating ? (
                                <span className={`badge ${
                                  show.overallRating >= 4 ? 'bg-success' : 
                                  show.overallRating >= 3 ? 'bg-info' : 
                                  show.overallRating >= 2 ? 'bg-warning' : 
                                  'bg-danger'
                                }`}>
                                  {show.overallRating.toFixed(1)}/5
                                </span>
                              ) : 'N/A'}
                            </td>
                            <td>{show.attendance?.toLocaleString() || 'N/A'}</td>
                            <td className={show.profit >= 0 ? 'text-success' : 'text-danger'}>
                              ${show.profit?.toLocaleString() || 'N/A'}
                            </td>
                            <td>
                              <Link to={`/shows/${show._id}/book`} className="btn btn-sm btn-outline-secondary">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CompanyManagement;