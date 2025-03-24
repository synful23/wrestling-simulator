// src/pages/ChampionshipDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaTrophy, FaEdit, FaTrash, FaUserPlus, FaShieldAlt, FaHistory, FaCrown, FaArrowLeft } from 'react-icons/fa';

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

// Modal for setting a new champion
const SetChampionModal = ({ championship, show, onClose, onSave, roster }) => {
  const [selectedWrestler, setSelectedWrestler] = useState('');
  const [wonFrom, setWonFrom] = useState('');
  const [showId, setShowId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shows, setShows] = useState([]);
  
  useEffect(() => {
    // Reset form when modal opens
    if (show) {
      setSelectedWrestler('');
      setWonFrom('');
      setShowId('');
      setError('');
      
      // Fetch recent shows for this company
      const fetchShows = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/company/${championship.company._id}`);
          // Only get shows that are completed
          const completedShows = res.data.filter(show => show.status === 'Completed');
          // Sort by date descending (most recent first)
          completedShows.sort((a, b) => new Date(b.date) - new Date(a.date));
          setShows(completedShows);
        } catch (err) {
          console.error('Error fetching shows:', err);
        }
      };
      
      fetchShows();
    }
  }, [show, championship]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedWrestler) {
      setError('Please select a wrestler');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onSave({
        wrestlerId: selectedWrestler,
        wonFromId: wonFrom || undefined,
        showId: showId || undefined
      });
      
      onClose();
    } catch (err) {
      console.error('Error setting champion:', err);
      setError(err.response?.data?.message || 'Error setting champion');
    } finally {
      setLoading(false);
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <FaCrown className="me-2" /> Set New Champion
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              
              <div className="mb-3">
                <label htmlFor="wrestler" className="form-label">New Champion *</label>
                <select
                  className="form-select"
                  id="wrestler"
                  value={selectedWrestler}
                  onChange={(e) => setSelectedWrestler(e.target.value)}
                  required
                >
                  <option value="">Select a wrestler</option>
                  {roster.map(wrestler => (
                    <option key={wrestler._id} value={wrestler._id}>
                      {wrestler.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="wonFrom" className="form-label">Won From</label>
                <select
                  className="form-select"
                  id="wonFrom"
                  value={wonFrom}
                  onChange={(e) => setWonFrom(e.target.value)}
                >
                  <option value="">Select a wrestler (optional)</option>
                  {championship.currentHolder && (
                    <option 
                      value={championship.currentHolder._id}
                      selected={championship.currentHolder._id === wonFrom}
                    >
                      {championship.currentHolder.name} (Current Champion)
                    </option>
                  )}
                  {roster
                    .filter(w => !championship.currentHolder || w._id !== championship.currentHolder._id)
                    .map(wrestler => (
                      <option key={wrestler._id} value={wrestler._id}>
                        {wrestler.name}
                      </option>
                    ))
                  }
                </select>
                <div className="form-text">Who did they win the title from?</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="show" className="form-label">Won At</label>
                <select
                  className="form-select"
                  id="show"
                  value={showId}
                  onChange={(e) => setShowId(e.target.value)}
                >
                  <option value="">Select a show (optional)</option>
                  {shows.map(show => (
                    <option key={show._id} value={show._id}>
                      {show.name} ({new Date(show.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <div className="form-text">At which show did the title change happen?</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !selectedWrestler}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Set as Champion'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal for recording a title defense
const DefenseModal = ({ championship, show, onClose, onSave, roster }) => {
  const [challenger, setChallenger] = useState('');
  const [showId, setShowId] = useState('');
  const [quality, setQuality] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shows, setShows] = useState([]);
  
  useEffect(() => {
    // Reset form when modal opens
    if (show) {
      setChallenger('');
      setShowId('');
      setQuality(3);
      setError('');
      
      // Fetch recent shows for this company
      const fetchShows = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/company/${championship.company._id}`);
          // Only get shows that are completed
          const completedShows = res.data.filter(show => show.status === 'Completed');
          // Sort by date descending (most recent first)
          completedShows.sort((a, b) => new Date(b.date) - new Date(a.date));
          setShows(completedShows);
        } catch (err) {
          console.error('Error fetching shows:', err);
        }
      };
      
      fetchShows();
    }
  }, [show, championship]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!challenger) {
      setError('Please select a challenger');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onSave({
        againstId: challenger,
        showId: showId || undefined,
        quality: quality
      });
      
      onClose();
    } catch (err) {
      console.error('Error recording defense:', err);
      setError(err.response?.data?.message || 'Error recording title defense');
    } finally {
      setLoading(false);
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <FaShieldAlt className="me-2" /> Record Title Defense
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              
              <div className="mb-3">
                <label htmlFor="challenger" className="form-label">Challenger *</label>
                <select
                  className="form-select"
                  id="challenger"
                  value={challenger}
                  onChange={(e) => setChallenger(e.target.value)}
                  required
                >
                  <option value="">Select a wrestler</option>
                  {roster
                    .filter(w => !championship.currentHolder || w._id !== championship.currentHolder._id)
                    .map(wrestler => (
                      <option key={wrestler._id} value={wrestler._id}>
                        {wrestler.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="show" className="form-label">Defended At</label>
                <select
                  className="form-select"
                  id="show"
                  value={showId}
                  onChange={(e) => setShowId(e.target.value)}
                >
                  <option value="">Select a show (optional)</option>
                  {shows.map(show => (
                    <option key={show._id} value={show._id}>
                      {show.name} ({new Date(show.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="quality" className="form-label">
                  Match Quality: {quality}
                </label>
                <input
                  type="range"
                  className="form-range"
                  id="quality"
                  min="1"
                  max="5"
                  step="0.5"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                />
                <div className="d-flex justify-content-between">
                  <small>Poor</small>
                  <small>Average</small>
                  <small>Excellent</small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success" disabled={loading || !challenger}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Record Defense'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Championship Detail Component
const ChampionshipDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [championship, setChampionship] = useState(null);
  const [company, setCompany] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSetChampionModal, setShowSetChampionModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'history', or 'defenses'
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch championship details
        const championshipRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/championships/${id}`);
        setChampionship(championshipRes.data);
        setCompany(championshipRes.data.company);
        
        // Fetch company roster
        if (championshipRes.data.company && championshipRes.data.company._id) {
          const rosterRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/wrestlers/company/${championshipRes.data.company._id}`
          );
          setRoster(rosterRes.data);
        }
      } catch (err) {
        console.error('Error fetching championship:', err);
        setError('Failed to load championship. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Get prestige color
  const getPrestigeColor = (prestige) => {
    if (prestige >= 80) return 'bg-success';
    if (prestige >= 60) return 'bg-info';
    if (prestige >= 40) return 'bg-warning';
    return 'bg-danger';
  };
  
  // Handle champion setting
  const handleSetChampion = async (data) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/championships/${id}/holder`,
        data,
        { withCredentials: true }
      );
      
      setChampionship(res.data);
    } catch (err) {
      console.error('Error setting champion:', err);
      throw err;
    }
  };
  
  // Handle title defense
  const handleDefense = async (data) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/championships/${id}/defense`,
        data,
        { withCredentials: true }
      );
      
      setChampionship(res.data);
    } catch (err) {
      console.error('Error recording defense:', err);
      throw err;
    }
  };
  
  // Handle championship deletion
  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/championships/${id}`,
        { withCredentials: true }
      );
      
      navigate(`/championships${company ? `/company/${company._id}` : ''}`);
    } catch (err) {
      console.error('Error deleting championship:', err);
      setError(err.response?.data?.message || 'Error deleting championship');
    }
  };
  
  // Get current reign info
  const getCurrentReignInfo = () => {
    if (!championship || !championship.currentHolder || !championship.titleHistory) return null;
    
    const currentReign = championship.titleHistory.find(
      reign => reign.holder._id === championship.currentHolder._id && !reign.endDate
    );
    
    if (!currentReign) return null;
    
    const startDate = new Date(currentReign.startDate);
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      defenses: currentReign.defenseCount || 0,
      startDate: startDate
    };
  };
  
  // Check if user is the company owner
  const isCompanyOwner = company && user && 
    (user.id === company.owner || user._id === company.owner || 
     user.id === company.owner._id || user._id === company.owner._id);
  
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading championship...</span>
        </div>
        <p className="mt-3">Loading championship details...</p>
      </div>
    );
  }
  
  if (!championship) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Championship not found or you don't have permission to view it.
        </div>
        <Link to="/championships" className="btn btn-primary">
          View All Championships
        </Link>
      </div>
    );
  }
  
  const currentReignInfo = getCurrentReignInfo();
  
  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <FaTrophy className="me-2" />
          {championship.name}
        </h1>
        
        {isCompanyOwner && (
          <div>
            <Link to={`/championships/${id}/edit`} className="btn btn-primary me-2">
              <FaEdit className="me-2" /> Edit
            </Link>
            <button 
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <FaTrash className="me-2" /> Delete
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="row">
        {/* Left column - Championship info */}
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body text-center">
              {championship.image ? (
                <img
                  src={getCorrectImageUrl(championship.image)}
                  alt={championship.name}
                  className="img-fluid mb-3"
                  style={{ maxHeight: '250px' }}
                  onError={(e) => {
                    console.error('Image failed to load:', championship.image);
                    e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                    e.target.onerror = null;
                  }}
                />
              ) : (
                <div className="text-center py-5">
                  <FaTrophy style={{ fontSize: '8rem', color: 'var(--gray-300)' }} />
                </div>
              )}
              
              <h5 className="card-subtitle mb-2">{championship.weight} Championship</h5>
              
              <div className="d-flex justify-content-between align-items-center mb-1 mt-3">
                <span><strong>Prestige:</strong> {championship.prestige}/100</span>
                <span className="badge bg-secondary">{championship.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="progress mb-3" style={{ height: '10px' }}>
                <div 
                  className={`progress-bar ${getPrestigeColor(championship.prestige)}`} 
                  style={{ width: `${championship.prestige}%` }}
                ></div>
              </div>
              
              <div className="card bg-light mb-3">
                <div className="card-body p-2">
                  <h6 className="card-subtitle mb-2">Company</h6>
                  <div className="d-flex align-items-center justify-content-center">
                    {company.logo ? (
                      <img
                        src={getCorrectImageUrl(company.logo)}
                        alt={company.name}
                        className="me-2"
                        style={{ height: '30px' }}
                      />
                    ) : null}
                    <Link to={`/company/${company._id}`}>{company.name}</Link>
                  </div>
                </div>
              </div>
              
              {championship.description && (
                <div className="card bg-light mb-3">
                  <div className="card-body p-2">
                    <h6 className="card-subtitle mb-2">About</h6>
                    <p className="card-text small">{championship.description}</p>
                  </div>
                </div>
              )}
              
              {championship.lastDefended && (
                <div className="small text-muted mt-2">
                  Last defended: {new Date(championship.lastDefended).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          {/* Championship Stats */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Championship Stats</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <span>Created</span>
                  <span>{new Date(championship.createdAt).toLocaleDateString()}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Title Changes</span>
                  <span>{championship.titleHistory ? championship.titleHistory.length : 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Total Defenses</span>
                  <span>
                    {championship.titleHistory ? 
                      championship.titleHistory.reduce((total, reign) => total + (reign.defenseCount || 0), 0) : 0}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Right column - Champion info and history */}
        <div className="col-md-8">
          {/* Current Champion Card */}
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Current Champion</h5>
              
              {isCompanyOwner && (
                <button 
                  className="btn btn-sm btn-dark"
                  onClick={() => setShowSetChampionModal(true)}
                >
                  <FaUserPlus className="me-2" /> Set Champion
                </button>
              )}
            </div>
            <div className="card-body">
              {championship.currentHolder ? (
                <div className="row">
                  <div className="col-md-4 text-center">
                    {championship.currentHolder.image ? (
                      <img
                        src={getCorrectImageUrl(championship.currentHolder.image)}
                        alt={championship.currentHolder.name}
                        className="img-fluid rounded-circle mb-2"
                        style={{ height: '120px', width: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="mx-auto bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: '120px', height: '120px', fontSize: '3rem' }}
                      >
                        {championship.currentHolder.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-8">
                    <h4>{championship.currentHolder.name}</h4>
                    <div className="d-flex mb-2">
                      <span className="badge bg-primary me-2">{championship.currentHolder.style}</span>
                      <span className="badge bg-secondary">{championship.currentHolder.gender}</span>
                    </div>
                    
                    <div className="progress mb-2" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${championship.currentHolder.popularity}%` }}
                        title={`Popularity: ${championship.currentHolder.popularity}/100`}
                      ></div>
                    </div>
                    
                    {currentReignInfo && (
                      <div className="card bg-light mt-3">
                        <div className="card-body p-2">
                          <div className="row">
                            <div className="col-4 text-center border-end">
                              <div className="h5 mb-0">{currentReignInfo.days}</div>
                              <small className="text-muted">Days</small>
                            </div>
                            <div className="col-4 text-center border-end">
                              <div className="h5 mb-0">{currentReignInfo.defenses}</div>
                              <small className="text-muted">Defenses</small>
                            </div>
                            <div className="col-4 text-center">
                              <div className="h5 mb-0">{currentReignInfo.startDate.toLocaleDateString()}</div>
                              <small className="text-muted">Since</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isCompanyOwner && championship.currentHolder && (
                      <button 
                        className="btn btn-success mt-3"
                        onClick={() => setShowDefenseModal(true)}
                      >
                        <FaShieldAlt className="me-2" /> Record Defense
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaCrown style={{ fontSize: '3rem', color: 'var(--gray-300)' }} />
                  <h5 className="mt-3">No Current Champion</h5>
                  <p className="text-muted">This championship doesn't have a champion yet.</p>
                  
                  {isCompanyOwner && (
                    <button 
                      className="btn btn-primary mt-2"
                      onClick={() => setShowSetChampionModal(true)}
                    >
                      <FaUserPlus className="me-2" /> Set Champion
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <FaHistory className="me-1" /> Title History
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'defenses' ? 'active' : ''}`}
                onClick={() => setActiveTab('defenses')}
              >
                <FaShieldAlt className="me-1" /> Defenses
              </button>
            </li>
          </ul>
          
          {/* Tab Content */}
          <div className="tab-content">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Championship Details</h5>
                  <p className="card-text">
                    {championship.description || 'No detailed information available for this championship.'}
                  </p>
                  
                  {championship.titleHistory && championship.titleHistory.length > 0 && (
                    <div className="mt-4">
                      <h5>Championship Timeline</h5>
                      <div className="timeline-container">
                        {championship.titleHistory.slice().reverse().map((reign, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-date">
                              {new Date(reign.startDate).toLocaleDateString()}
                            </div>
                            <div className="timeline-content">
                              <h6>{reign.holder.name} {index === 0 && !reign.endDate && '(Current)'}</h6>
                              {reign.wonFrom && (
                                <div className="small text-muted">
                                  Won from {reign.wonFrom.name}
                                  {reign.wonAt && ` at ${reign.wonAt.name}`}
                                </div>
                              )}
                              {reign.endDate && (
                                <div className="small text-muted">
                                  Reign ended: {new Date(reign.endDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Title History Tab */}
            {activeTab === 'history' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Title History</h5>
                  
                  {championship.titleHistory && championship.titleHistory.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Champion</th>
                            <th>Won From</th>
                            <th>Date Won</th>
                            <th>Reign Length</th>
                            <th>Defenses</th>
                          </tr>
                        </thead>
                        <tbody>
                          {championship.titleHistory.map((reign, index) => {
                            const startDate = new Date(reign.startDate);
                            const endDate = reign.endDate ? new Date(reign.endDate) : new Date();
                            const diffTime = Math.abs(endDate - startDate);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            return (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {reign.holder.image ? (
                                      <img
                                        src={getCorrectImageUrl(reign.holder.image)}
                                        alt={reign.holder.name}
                                        className="me-2 rounded-circle"
                                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <div 
                                        className="me-2 bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: '30px', height: '30px' }}
                                      >
                                        {reign.holder.name.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      {reign.holder.name}
                                      {!reign.endDate && (
                                        <span className="badge bg-warning text-dark ms-2">Current</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>{reign.wonFrom ? reign.wonFrom.name : 'N/A'}</td>
                                <td>{startDate.toLocaleDateString()}</td>
                                <td>{diffDays} days</td>
                                <td>{reign.defenseCount || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">No title history available.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Defenses Tab */}
            {activeTab === 'defenses' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Title Defenses</h5>
                  
                  {championship.titleHistory && championship.titleHistory.some(reign => reign.defenses && reign.defenses.length > 0) ? (
                    <div>
                      {championship.titleHistory.map((reign, reignIndex) => (
                        reign.defenses && reign.defenses.length > 0 && (
                          <div key={reignIndex} className="mb-4">
                            <h6 className="border-bottom pb-2">
                              {reign.holder.name}'s Reign
                              {!reign.endDate && (
                                <span className="badge bg-warning text-dark ms-2">Current</span>
                              )}
                            </h6>
                            
                            <div className="table-responsive">
                              <table className="table table-sm table-hover">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Challenger</th>
                                    <th>Event</th>
                                    <th>Quality</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reign.defenses.map((defense, defIndex) => (
                                    <tr key={defIndex}>
                                      <td>{defense.date ? new Date(defense.date).toLocaleDateString() : 'N/A'}</td>
                                      <td>
                                        {defense.against ? (
                                          <div className="d-flex align-items-center">
                                            {defense.against.image ? (
                                              <img
                                                src={getCorrectImageUrl(defense.against.image)}
                                                alt={defense.against.name}
                                                className="me-2 rounded-circle"
                                                style={{ width: '25px', height: '25px', objectFit: 'cover' }}
                                              />
                                            ) : (
                                              <div 
                                                className="me-2 bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle"
                                                style={{ width: '25px', height: '25px', fontSize: '0.7rem' }}
                                              >
                                                {defense.against.name.charAt(0)}
                                              </div>
                                            )}
                                            {defense.against.name}
                                          </div>
                                        ) : 'Unknown'}
                                      </td>
                                      <td>{defense.show ? defense.show.name : 'N/A'}</td>
                                      <td>
                                        {defense.quality ? (
                                          <div className="text-nowrap">
                                            {'★'.repeat(Math.floor(defense.quality))}
                                            {defense.quality % 1 !== 0 ? '½' : ''}
                                            <span className="text-muted">
                                              {'★'.repeat(5 - Math.ceil(defense.quality))}
                                            </span>
                                          </div>
                                        ) : 'N/A'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">No title defenses recorded.</p>
                    </div>
                  )}
                  
                  {isCompanyOwner && championship.currentHolder && (
                    <div className="text-center mt-3">
                      <button 
                        className="btn btn-success"
                        onClick={() => setShowDefenseModal(true)}
                      >
                        <FaShieldAlt className="me-2" /> Record New Defense
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <Link to={`/championships${company ? `/company/${company._id}` : ''}`} className="btn btn-secondary">
          <FaArrowLeft className="me-2" /> Back to Championships
        </Link>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Delete Championship</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{championship.name}</strong>?</p>
                <p className="text-danger">This action cannot be undone and will remove all title history.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Delete Championship
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Set Champion Modal */}
      <SetChampionModal
        championship={championship}
        show={showSetChampionModal}
        onClose={() => setShowSetChampionModal(false)}
        onSave={handleSetChampion}
        roster={roster}
      />
      
      {/* Defense Modal */}
      <DefenseModal
        championship={championship}
        show={showDefenseModal}
        onClose={() => setShowDefenseModal(false)}
        onSave={handleDefense}
        roster={roster}
      />
    </div>
  );
};

export default ChampionshipDetail;