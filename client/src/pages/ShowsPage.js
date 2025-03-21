// src/pages/ShowsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const ShowsPage = () => {
  const { companyId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [shows, setShows] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [showType, setShowType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(companyId || '');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user companies if logged in
        if (user) {
          const companiesRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { 
            withCredentials: true 
          });
          setUserCompanies(companiesRes.data);
        }
        
        // If company ID is provided, fetch company details
        let companyData = null;
        if (companyId) {
          const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/${companyId}`);
          companyData = companyRes.data;
          setCompany(companyData);
          setSelectedCompany(companyId);
        }
        
        // Fetch shows
        let queryParams = {};
        if (companyId) {
          queryParams.company = companyId;
        }
        
        const showsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows`, { 
          params: queryParams 
        });
        setShows(showsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load shows. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, companyId]);

  const handleCompanyChange = (e) => {
    const value = e.target.value;
    setSelectedCompany(value);
    
    if (value) {
      navigate(`/shows/company/${value}`);
    } else {
      navigate('/shows');
    }
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleShowTypeChange = (e) => {
    setShowType(e.target.value);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      
      let queryParams = {};
      
      if (selectedCompany) {
        queryParams.company = selectedCompany;
      }
      
      if (showType) {
        queryParams.showType = showType;
      }
      
      if (status) {
        queryParams.status = status;
      }
      
      if (startDate) {
        queryParams.startDate = startDate;
      }
      
      if (endDate) {
        queryParams.endDate = endDate;
      }
      
      const showsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows`, { 
        params: queryParams 
      });
      setShows(showsRes.data);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError('Failed to apply filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    try {
      setLoading(true);
      
      setShowType('');
      setStatus('');
      setStartDate('');
      setEndDate('');
      
      let queryParams = {};
      if (selectedCompany) {
        queryParams.company = selectedCompany;
      }
      
      const showsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows`, { 
        params: queryParams 
      });
      setShows(showsRes.data);
    } catch (err) {
      console.error('Error clearing filters:', err);
      setError('Failed to clear filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-secondary';
      case 'Scheduled':
        return 'bg-info';
      case 'In Progress':
        return 'bg-primary';
      case 'Completed':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getShowTypeBadgeClass = (type) => {
    switch (type) {
      case 'Pay-Per-View':
        return 'bg-danger';
      case 'Special Event':
        return 'bg-warning';
      case 'Weekly TV':
        return 'bg-primary';
      case 'House Show':
        return 'bg-secondary';
      default:
        return 'bg-dark';
    }
  };

  // Group shows by month
  const groupShowsByMonth = () => {
    const grouped = {};
    
    shows.forEach(show => {
      const date = new Date(show.date);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(show);
    });
    
    // Sort shows within each month by date
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    
    return grouped;
  };

  const isCompanyOwner = company && user && company.owner === user.id;

  if (loading) {
    return <div className="text-center mt-5">Loading shows...</div>;
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{company ? `${company.name} Shows` : 'All Shows'}</h1>
        
        {isCompanyOwner && (
          <Link to="/shows/new" className="btn btn-success">
            Schedule New Show
          </Link>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Company</label>
              <select
                className="form-select"
                value={selectedCompany}
                onChange={handleCompanyChange}
              >
                <option value="">All Companies</option>
                {userCompanies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label">Show Type</label>
              <select
                className="form-select"
                value={showType}
                onChange={handleShowTypeChange}
              >
                <option value="">All Types</option>
                <option value="Weekly TV">Weekly TV</option>
                <option value="Special Event">Special Event</option>
                <option value="Pay-Per-View">Pay-Per-View</option>
                <option value="House Show">House Show</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={handleStartDateChange}
              />
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={handleEndDateChange}
              />
            </div>
            
            <div className="col-md-4 d-flex align-items-end mb-3">
              <button
                className="btn btn-primary me-2"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show List */}
      {shows.length === 0 ? (
        <div className="text-center py-5">
          <h4>No shows found</h4>
          <p className="text-muted">Try adjusting your filters or schedule a new show.</p>
          
          {isCompanyOwner && (
            <Link to="/shows/new" className="btn btn-success mt-3">
              Schedule New Show
            </Link>
          )}
        </div>
      ) : (
        <div>
          {Object.entries(groupShowsByMonth()).map(([month, monthShows]) => (
            <div key={month} className="mb-4">
              <h3 className="border-bottom pb-2 mb-3">{month}</h3>
              
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {monthShows.map(show => (
                  <div key={show._id} className="col">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{show.name}</h5>
                        <span className={`badge ${getShowTypeBadgeClass(show.showType)}`}>
                          {show.showType}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <strong>Date:</strong> {new Date(show.date).toLocaleDateString()}
                        </div>
                        <div className="mb-3">
                          <strong>Venue:</strong> {show.venue.name}, {show.venue.location}
                        </div>
                        <div className="mb-3">
                          <strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(show.status)}`}>{show.status}</span>
                        </div>
                        
                        {show.company && show.company._id !== selectedCompany && (
                          <div className="mb-3">
                            <strong>Company:</strong> {show.company.name}
                          </div>
                        )}
                        
                        {show.status === 'Completed' && (
                          <div className="mt-3">
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Rating:</strong>
                              <span>{show.overallRating ? show.overallRating.toFixed(1) : 'N/A'}/5</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <strong>Attendance:</strong>
                              <span>{show.attendance ? show.attendance.toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="card-footer">
                        <Link to={`/shows/${show._id}/book`} className="btn btn-primary w-100">
                          {show.status === 'Draft' ? 'Book Show' : 
                           show.status === 'Scheduled' ? 'Manage Show' :
                           show.status === 'In Progress' ? 'Run Show' :
                           'View Results'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowsPage;