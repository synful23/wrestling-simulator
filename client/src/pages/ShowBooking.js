// src/pages/ShowBooking.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const ShowBooking = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [show, setShow] = useState(null);
  const [company, setCompany] = useState(null);
  const [venue, setVenue] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Match form data
  const [matchForm, setMatchForm] = useState({
    wrestlers: [],
    matchType: 'Singles',
    championship: '',
    isChampionshipMatch: false,
    stipulation: '',
    duration: 15,
    description: '',
    bookedOutcome: 'Clean',
    plannedQuality: 3,
    position: 1
  });
  
  // Segment form data
  const [segmentForm, setSegmentForm] = useState({
    segmentType: 'Promo',
    wrestlers: [],
    description: '',
    duration: 5,
    plannedQuality: 3,
    position: 1
  });
  
  // UI states
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingSegment, setEditingSegment] = useState(null);
  const [tempSelectedWrestlers, setTempSelectedWrestlers] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'timeline'
  
  useEffect(() => {
    const fetchShowData = async () => {
      try {
        // Fetch show details
        const showRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/${id}`);
        setShow(showRes.data);
        setCompany(showRes.data.company);
        setVenue(showRes.data.venue);
        
        // Fetch roster for the company
        const rosterRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/wrestlers/company/${showRes.data.company._id}`);
        setRoster(rosterRes.data);
        
        // Set initial positions
        if (showRes.data.matches.length > 0 || showRes.data.segments.length > 0) {
          const lastPosition = Math.max(
            showRes.data.matches.length > 0 ? Math.max(...showRes.data.matches.map(m => m.position)) : 0,
            showRes.data.segments.length > 0 ? Math.max(...showRes.data.segments.map(s => s.position)) : 0
          );
          
          setMatchForm(prev => ({ ...prev, position: lastPosition + 1 }));
          setSegmentForm(prev => ({ ...prev, position: lastPosition + 1 }));
        }
      } catch (err) {
        console.error('Error fetching show data:', err);
        setError('Failed to load show data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShowData();
  }, [id]);

  // Reset form when we close the forms
  useEffect(() => {
    if (!showMatchForm) {
      setEditingMatch(null);
      setMatchForm({
        wrestlers: [],
        matchType: 'Singles',
        championship: '',
        isChampionshipMatch: false,
        stipulation: '',
        duration: 15,
        description: '',
        bookedOutcome: 'Clean',
        plannedQuality: 3,
        position: show?.matches?.length ? Math.max(...show.matches.map(m => m.position)) + 1 : 1
      });
      setTempSelectedWrestlers([]);
    }
    
    if (!showSegmentForm) {
      setEditingSegment(null);
      setSegmentForm({
        segmentType: 'Promo',
        wrestlers: [],
        description: '',
        duration: 5,
        plannedQuality: 3,
        position: show?.segments?.length ? Math.max(...show.segments.map(s => s.position)) + 1 : 1
      });
    }
  }, [showMatchForm, showSegmentForm, show]);

  // Setting up form if we're editing a match
  useEffect(() => {
    if (editingMatch && show) {
      const match = show.matches.find(m => m._id === editingMatch);
      if (match) {
        setMatchForm({
          wrestlers: match.wrestlers.map(w => w.wrestler._id),
          matchType: match.matchType,
          championship: match.championship || '',
          isChampionshipMatch: match.isChampionshipMatch || false,
          stipulation: match.stipulation || '',
          duration: match.duration || 15,
          description: match.description || '',
          bookedOutcome: match.bookedOutcome || 'Clean',
          plannedQuality: match.plannedQuality || 3,
          position: match.position
        });
        
        // Setup temp wrestlers for the UI
        setTempSelectedWrestlers(match.wrestlers.map(w => ({
          id: w.wrestler._id,
          name: w.wrestler.name,
          isWinner: w.isWinner,
          team: w.team
        })));
      }
    }
  }, [editingMatch, show]);

  // Setting up form if we're editing a segment
  useEffect(() => {
    if (editingSegment && show) {
      const segment = show.segments.find(s => s._id === editingSegment);
      if (segment) {
        setSegmentForm({
          segmentType: segment.segmentType,
          wrestlers: segment.wrestlers ? segment.wrestlers.map(w => w._id) : [],
          description: segment.description,
          duration: segment.duration || 5,
          plannedQuality: segment.plannedQuality || 3,
          position: segment.position
        });
      }
    }
  }, [editingSegment, show]);

  const handleMatchFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMatchForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSegmentFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSegmentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleWrestlerSelect = (e) => {
    const wrestlerId = e.target.value;
    if (!wrestlerId) return;
    
    const wrestler = roster.find(w => w._id === wrestlerId);
    if (!wrestler) return;
    
    // Check if wrestler is already selected
    if (tempSelectedWrestlers.some(w => w.id === wrestlerId)) {
      return;
    }
    
    // Add to temp selected wrestlers
    setTempSelectedWrestlers(prev => [
      ...prev,
      {
        id: wrestler._id,
        name: wrestler.name,
        isWinner: false,
        team: 1
      }
    ]);
  };

  const handleRemoveWrestler = (id) => {
    setTempSelectedWrestlers(prev => prev.filter(w => w.id !== id));
  };

  const handleSetWinner = (id) => {
    setTempSelectedWrestlers(prev => prev.map(w => ({
      ...w,
      isWinner: w.id === id
    })));
  };

  const handleToggleTeam = (id) => {
    setTempSelectedWrestlers(prev => prev.map(w => ({
      ...w,
      team: w.id === id ? (w.team === 1 ? 2 : 1) : w.team
    })));
  };

  const handleMultiWrestlerSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSegmentForm(prev => ({
      ...prev,
      wrestlers: selectedOptions
    }));
  };

  const handleAddMatch = async () => {
    try {
      // Prepare match data
      const matchData = {
        ...matchForm,
        wrestlers: tempSelectedWrestlers.map(w => ({
          id: w.id,
          isWinner: w.isWinner,
          team: w.team
        }))
      };
      
      if (editingMatch) {
        // Update existing match
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/shows/${id}/match/${editingMatch}`,
          matchData,
          { withCredentials: true }
        );
      } else {
        // Create new match
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/shows/${id}/match`,
          matchData,
          { withCredentials: true }
        );
      }
      
      // Refresh show data
      const showRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/${id}`);
      setShow(showRes.data);
      
      // Close form and reset
      setShowMatchForm(false);
    } catch (err) {
      console.error('Error saving match:', err);
      setError(err.response?.data?.message || 'Error saving match');
    }
  };

  const handleAddSegment = async () => {
    try {
      if (editingSegment) {
        // Update existing segment
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/shows/${id}/segment/${editingSegment}`,
          segmentForm,
          { withCredentials: true }
        );
      } else {
        // Create new segment
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/shows/${id}/segment`,
          segmentForm,
          { withCredentials: true }
        );
      }
      
      // Refresh show data
      const showRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/${id}`);
      setShow(showRes.data);
      
      // Close form and reset
      setShowSegmentForm(false);
    } catch (err) {
      console.error('Error saving segment:', err);
      setError(err.response?.data?.message || 'Error saving segment');
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/shows/${id}/match/${matchId}`,
        { withCredentials: true }
      );
      
      // Refresh show data
      const showRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/${id}`);
      setShow(showRes.data);
    } catch (err) {
      console.error('Error deleting match:', err);
      setError(err.response?.data?.message || 'Error deleting match');
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/shows/${id}/segment/${segmentId}`,
        { withCredentials: true }
      );
      
      // Refresh show data
      const showRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shows/${id}`);
      setShow(showRes.data);
    } catch (err) {
      console.error('Error deleting segment:', err);
      setError(err.response?.data?.message || 'Error deleting segment');
    }
  };

  const handleStartShow = async () => {
    if (!window.confirm('Are you sure you want to start this show? This will calculate attendance and begin the event.')) {
      return;
    }
    
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/shows/${id}/start`,
        {},
        { withCredentials: true }
      );
      
      setShow(res.data);
    } catch (err) {
      console.error('Error starting show:', err);
      setError(err.response?.data?.message || 'Error starting show');
    }
  };

  const handleCompleteShow = async () => {
    if (!window.confirm('Are you sure you want to complete this show? This will calculate match ratings, financial results, and update your company.')) {
      return;
    }
    
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/shows/${id}/complete`,
        {},
        { withCredentials: true }
      );
      
      setShow(res.data);
    } catch (err) {
      console.error('Error completing show:', err);
      setError(err.response?.data?.message || 'Error completing show');
    }
  };

  // Combine matches and segments into a timeline
  const getTimelineItems = () => {
    if (!show) return [];
    
    const matchItems = show.matches.map(match => ({
      type: 'match',
      id: match._id,
      position: match.position,
      data: match
    }));
    
    const segmentItems = show.segments.map(segment => ({
      type: 'segment',
      id: segment._id,
      position: segment.position,
      data: segment
    }));
    
    return [...matchItems, ...segmentItems]
      .sort((a, b) => a.position - b.position);
  };

  const renderMatchCard = (match) => {
    return (
      <div key={match._id} className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Match #{match.position}</h5>
          <div>
            {show.status !== 'Completed' && (
              <>
                <button 
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() => {
                    setEditingMatch(match._id);
                    setShowMatchForm(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteMatch(match._id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <strong>Type:</strong> {match.matchType}
            {match.isChampionshipMatch && <span className="badge bg-warning ms-2">Championship Match</span>}
            {match.stipulation && <span className="badge bg-danger ms-2">{match.stipulation}</span>}
          </div>
          
          <div className="mb-3">
            <strong>Wrestlers:</strong>
            <div className="row mt-2">
              {match.wrestlers.map((w, index) => (
                <div key={index} className="col-md-6 mb-2">
                  <div className={`card ${w.isWinner ? 'border-success' : ''}`}>
                    <div className="card-body p-2 d-flex align-items-center">
                        {w.wrestler && w.wrestler.image ? (
                            <img 
                                src={`${process.env.REACT_APP_API_URL}${w.wrestler.image}`}
                                alt={w.wrestler && w.wrestler.name || 'Wrestler'}
                                className="me-2"
                                style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '50%' }}
                            />
                            ) : (
                            <div 
                                className="me-2 bg-secondary text-white d-flex align-items-center justify-content-center"
                                style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                            >
                                {w.wrestler && w.wrestler.name ? w.wrestler.name.charAt(0) : '?'}
                            </div>
                        )}
                      <div>
                        {w.wrestler.name}
                        {w.isWinner && <span className="text-success ms-1">(Winner)</span>}
                      </div>
                      <span className="ms-auto badge bg-info">Team {w.team}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {match.description && (
            <div className="mb-3">
              <strong>Description:</strong>
              <p>{match.description}</p>
            </div>
          )}
          
          <div className="d-flex justify-content-between">
            <div>
              <strong>Planned Finish:</strong> {match.bookedOutcome}
            </div>
            <div>
              <strong>Duration:</strong> {match.duration} min
            </div>
            <div>
              <strong>Expected Quality:</strong> {match.plannedQuality}/5
            </div>
          </div>
          
          {show.status === 'Completed' && match.actualQuality && (
            <div className="alert alert-info mt-3">
              <div className="d-flex justify-content-between align-items-center">
                <strong>Actual Rating:</strong>
                <span className="display-6">{match.actualQuality.toFixed(1)}/5</span>
              </div>
              <div className="progress mt-2" style={{ height: '10px' }}>
                <div 
                  className={`progress-bar ${match.actualQuality >= 4 ? 'bg-success' : match.actualQuality >= 3 ? 'bg-info' : match.actualQuality >= 2 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${(match.actualQuality / 5) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2">
                <strong>Popularity Impact:</strong> 
                <span className={match.popularityImpact > 0 ? 'text-success' : match.popularityImpact < 0 ? 'text-danger' : 'text-muted'}>
                  {match.popularityImpact > 0 ? '+' : ''}{match.popularityImpact}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSegmentCard = (segment) => {
    return (
      <div key={segment._id} className="card mb-3 border-secondary">
        <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Segment #{segment.position}: {segment.segmentType}</h5>
          <div>
            {show.status !== 'Completed' && (
              <>
                <button 
                  className="btn btn-outline-light btn-sm me-2"
                  onClick={() => {
                    setEditingSegment(segment._id);
                    setShowSegmentForm(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-outline-light btn-sm"
                  onClick={() => handleDeleteSegment(segment._id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="card-body">
          {segment.wrestlers && segment.wrestlers.length > 0 && (
            <div className="mb-3">
              <strong>Featuring:</strong>
              <div className="mt-2">
                {segment.wrestlers.map((wrestler, index) => (
                  <div key={index} className="d-inline-block me-2 mb-2">
                    <div className="card" style={{ width: 'auto' }}>
                      <div className="card-body p-2 d-flex align-items-center">
                        {wrestler && wrestler.image ? (
                            <img 
                                src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                                alt={wrestler && wrestler.name || 'Wrestler'}
                                className="me-2"
                                style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '50%' }}
                            />
                            ) : (
                            <div 
                                className="me-2 bg-secondary text-white d-flex align-items-center justify-content-center"
                                style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                            >
                                {wrestler && wrestler.name ? wrestler.name.charAt(0) : '?'}
                            </div>
                        )}
                        <div>{wrestler.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <strong>Description:</strong>
            <p>{segment.description}</p>
          </div>
          
          <div className="d-flex justify-content-between">
            <div>
              <strong>Duration:</strong> {segment.duration} min
            </div>
            <div>
              <strong>Expected Quality:</strong> {segment.plannedQuality}/5
            </div>
          </div>
          
          {show.status === 'Completed' && segment.actualQuality && (
            <div className="alert alert-info mt-3">
              <div className="d-flex justify-content-between align-items-center">
                <strong>Actual Rating:</strong>
                <span className="display-6">{segment.actualQuality.toFixed(1)}/5</span>
              </div>
              <div className="progress mt-2" style={{ height: '10px' }}>
                <div 
                  className={`progress-bar ${segment.actualQuality >= 4 ? 'bg-success' : segment.actualQuality >= 3 ? 'bg-info' : segment.actualQuality >= 2 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${(segment.actualQuality / 5) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2">
                <strong>Popularity Impact:</strong> 
                <span className={segment.popularityImpact > 0 ? 'text-success' : segment.popularityImpact < 0 ? 'text-danger' : 'text-muted'}>
                  {segment.popularityImpact > 0 ? '+' : ''}{segment.popularityImpact}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const timelineItems = getTimelineItems();
    
    return (
      <div className="position-relative mt-4">
        <div className="timeline-line"></div>
        
        {timelineItems.map((item, index) => (
          <div key={item.id} className="timeline-item">
            <div className="timeline-badge">
              {item.position}
            </div>
            <div className="timeline-content">
              {item.type === 'match' ? renderMatchCard(item.data) : renderSegmentCard(item.data)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderShowResults = () => {
    if (!show || show.status !== 'Completed') return null;
    
    return (
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h4 className="mb-0">Show Results</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h5>Ratings</h5>
              <div className="d-flex align-items-center mb-3">
                <div style={{ width: '150px' }}>Overall Quality:</div>
                <div className="progress flex-grow-1 mx-2" style={{ height: '20px' }}>
                  <div 
                    className={`progress-bar ${show.overallRating >= 4 ? 'bg-success' : show.overallRating >= 3 ? 'bg-info' : show.overallRating >= 2 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${(show.overallRating / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="fw-bold" style={{ width: '50px' }}>{show.overallRating.toFixed(1)}/5</div>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <div style={{ width: '150px' }}>Critic Rating:</div>
                <div className="progress flex-grow-1 mx-2" style={{ height: '20px' }}>
                  <div 
                    className={`progress-bar ${show.criticRating >= 4 ? 'bg-success' : show.criticRating >= 3 ? 'bg-info' : show.criticRating >= 2 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${(show.criticRating / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="fw-bold" style={{ width: '50px' }}>{show.criticRating.toFixed(1)}/5</div>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <div style={{ width: '150px' }}>Fan Satisfaction:</div>
                <div className="progress flex-grow-1 mx-2" style={{ height: '20px' }}>
                  <div 
                    className={`progress-bar ${show.audienceSatisfaction >= 80 ? 'bg-success' : show.audienceSatisfaction >= 60 ? 'bg-info' : show.audienceSatisfaction >= 40 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${show.audienceSatisfaction}%` }}
                  ></div>
                </div>
                <div className="fw-bold" style={{ width: '50px' }}>{show.audienceSatisfaction}%</div>
              </div>
            </div>
            
            <div className="col-md-6">
              <h5>Financials</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <td>Attendance:</td>
                    <td>{show.attendance.toLocaleString()} / {venue.capacity.toLocaleString()}</td>
                    <td>{((show.attendance / venue.capacity) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="table-success">
                    <td>Ticket Revenue:</td>
                    <td colSpan="2">${show.ticketRevenue.toLocaleString()}</td>
                  </tr>
                  <tr className="table-success">
                    <td>Merchandise Revenue:</td>
                    <td colSpan="2">${show.merchandiseRevenue.toLocaleString()}</td>
                  </tr>
                  <tr className="table-danger">
                    <td>Venue Rental:</td>
                    <td colSpan="2">-${show.venueRentalCost.toLocaleString()}</td>
                  </tr>
                  <tr className="table-danger">
                    <td>Production Costs:</td>
                    <td colSpan="2">-${show.productionCost.toLocaleString()}</td>
                  </tr>
                  <tr className="table-danger">
                    <td>Talent Costs:</td>
                    <td colSpan="2">-${show.talentCost.toLocaleString()}</td>
                  </tr>
                  <tr className={`fw-bold ${show.profit >= 0 ? 'table-success' : 'table-danger'}`}>
                    <td>Profit:</td>
                    <td colSpan="2">${show.profit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center mt-5">Loading show details...</div>;
  }

  if (!show) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Show not found or you don't have permission to view it.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid my-4">
      <div className="row">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>{show.name}</h1>
            
            <div>
              <Link to={`/shows/${id}/edit`} className="btn btn-outline-primary me-2">
                Edit Show Details
              </Link>
              {show.status === 'Draft' || show.status === 'Scheduled' ? (
                <button 
                  className="btn btn-success"
                  onClick={handleStartShow}
                >
                  Start Show
                </button>
              ) : show.status === 'In Progress' ? (
                <button 
                  className="btn btn-danger"
                  onClick={handleCompleteShow}
                >
                  Complete Show
                </button>
              ) : null}
            </div>
          </div>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Date:</strong> {new Date(show.date).toLocaleDateString()}</p>
                  <p><strong>Venue:</strong> {venue.name}, {venue.location}</p>
                  <p><strong>Capacity:</strong> {venue.capacity.toLocaleString()}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Show Type:</strong> {show.showType}</p>
                  <p><strong>Ticket Price:</strong> ${show.ticketPrice}</p>
                  <p><strong>Status:</strong> <span className={`badge ${
                    show.status === 'Completed' ? 'bg-success' : 
                    show.status === 'In Progress' ? 'bg-primary' : 
                    show.status === 'Scheduled' ? 'bg-info' : 
                    show.status === 'Cancelled' ? 'bg-danger' : 'bg-secondary'
                  }`}>{show.status}</span></p>
                </div>
              </div>
              
              {show.status === 'In Progress' && (
                <div className="alert alert-info mt-3">
                  <strong>Attendance:</strong> {show.attendance.toLocaleString()} ({((show.attendance / venue.capacity) * 100).toFixed(1)}% capacity)
                </div>
              )}
              
              {show.status === 'Completed' && renderShowResults()}
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Show Rundown</h3>
              
              <div className="d-flex">
                <div className="btn-group me-2">
                  <button
                    className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('card')}
                  >
                    Card View
                  </button>
                  <button
                    className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('timeline')}
                  >
                    Timeline
                  </button>
                </div>
                
                {show.status !== 'Completed' && (
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => {
                        setShowMatchForm(true);
                        setShowSegmentForm(false);
                      }}
                      disabled={showMatchForm}
                    >
                      Add Match
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setShowSegmentForm(true);
                        setShowMatchForm(false);
                      }}
                      disabled={showSegmentForm}
                    >
                      Add Segment
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">
              {show.matches.length === 0 && show.segments.length === 0 ? (
                <div className="text-center py-5">
                  <h5>This show doesn't have any matches or segments yet.</h5>
                  {show.status !== 'Completed' && (
                    <div className="mt-3">
                      <button
                        className="btn btn-success me-2"
                        onClick={() => {
                          setShowMatchForm(true);
                          setShowSegmentForm(false);
                        }}
                      >
                        Add a Match
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowSegmentForm(true);
                          setShowMatchForm(false);
                        }}
                      >
                        Add a Segment
                      </button>
                    </div>
                  )}
                </div>
              ) : viewMode === 'card' ? (
                <div>
                  <h4 className="mb-3">Matches</h4>
                  {show.matches.length === 0 ? (
                    <p className="text-muted">No matches added yet.</p>
                  ) : (
                    <div className="mb-4">
                      {show.matches
                        .sort((a, b) => a.position - b.position)
                        .map(match => renderMatchCard(match))}
                    </div>
                  )}
                  
                  <h4 className="mb-3">Segments</h4>
                  {show.segments.length === 0 ? (
                    <p className="text-muted">No segments added yet.</p>
                  ) : (
                    <div>
                      {show.segments
                        .sort((a, b) => a.position - b.position)
                        .map(segment => renderSegmentCard(segment))}
                    </div>
                  )}
                </div>
              ) : (
                renderTimelineView()
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          {/* Match Form */}
          {showMatchForm && (
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">{editingMatch ? 'Edit Match' : 'Add Match'}</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="matchType" className="form-label">Match Type *</label>
                  <select
                    className="form-select"
                    id="matchType"
                    name="matchType"
                    value={matchForm.matchType}
                    onChange={handleMatchFormChange}
                    required
                  >
                    <option value="Singles">Singles Match</option>
                    <option value="Tag Team">Tag Team Match</option>
                    <option value="Triple Threat">Triple Threat</option>
                    <option value="Fatal 4-Way">Fatal 4-Way</option>
                    <option value="Battle Royal">Battle Royal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Select Wrestlers *</label>
                  <select
                    className="form-select"
                    onChange={handleWrestlerSelect}
                    value=""
                  >
                    <option value="">Add a wrestler...</option>
                    {roster.map(wrestler => (
                      <option 
                        key={wrestler._id} 
                        value={wrestler._id}
                        disabled={tempSelectedWrestlers.some(w => w.id === wrestler._id)}
                      >
                        {wrestler.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="mt-2">
                    <div className="fw-bold mb-1">Selected Wrestlers:</div>
                    {tempSelectedWrestlers.length === 0 ? (
                      <div className="text-muted">No wrestlers selected</div>
                    ) : (
                      <div className="list-group">
                        {tempSelectedWrestlers.map(wrestler => (
                          <div key={wrestler.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                {wrestler.name}
                                {wrestler.isWinner && (
                                  <span className="badge bg-success ms-2">Winner</span>
                                )}
                                <span className="badge bg-info ms-2">Team {wrestler.team}</span>
                              </div>
                              <div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success me-1"
                                  onClick={() => handleSetWinner(wrestler.id)}
                                >
                                  Set as Winner
                                </button>
                                {(matchForm.matchType === 'Tag Team') && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-info me-1"
                                    onClick={() => handleToggleTeam(wrestler.id)}
                                  >
                                    Toggle Team
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveWrestler(wrestler.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isChampionshipMatch"
                      name="isChampionshipMatch"
                      checked={matchForm.isChampionshipMatch}
                      onChange={handleMatchFormChange}
                    />
                    <label className="form-check-label" htmlFor="isChampionshipMatch">
                      Championship Match
                    </label>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="stipulation" className="form-label">Stipulation</label>
                  <input
                    type="text"
                    className="form-control"
                    id="stipulation"
                    name="stipulation"
                    value={matchForm.stipulation}
                    onChange={handleMatchFormChange}
                    placeholder="e.g. No DQ, Steel Cage, etc."
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="duration" className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="duration"
                    name="duration"
                    min="1"
                    max="60"
                    value={matchForm.duration}
                    onChange={handleMatchFormChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="bookedOutcome" className="form-label">Finish Type</label>
                  <select
                    className="form-select"
                    id="bookedOutcome"
                    name="bookedOutcome"
                    value={matchForm.bookedOutcome}
                    onChange={handleMatchFormChange}
                  >
                    <option value="Clean">Clean Finish</option>
                    <option value="Dirty">Dirty Finish</option>
                    <option value="DQ">Disqualification</option>
                    <option value="Count-Out">Count Out</option>
                    <option value="No Contest">No Contest</option>
                    <option value="Time Limit Draw">Time Limit Draw</option>
                    <option value="Double DQ">Double DQ</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Match Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={matchForm.description}
                    onChange={handleMatchFormChange}
                    placeholder="Describe the key moments, story, and finish of the match"
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="plannedQuality" className="form-label">
                    Expected Match Quality: {matchForm.plannedQuality}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="plannedQuality"
                    name="plannedQuality"
                    min="1"
                    max="5"
                    step="0.5"
                    value={matchForm.plannedQuality}
                    onChange={handleMatchFormChange}
                  />
                  <div className="d-flex justify-content-between">
                    <small>Poor</small>
                    <small>Average</small>
                    <small>Excellent</small>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="position" className="form-label">Card Position</label>
                  <input
                    type="number"
                    className="form-control"
                    id="position"
                    name="position"
                    min="1"
                    value={matchForm.position}
                    onChange={handleMatchFormChange}
                  />
                  <small className="text-muted">Higher numbers are later in the show (main event)</small>
                </div>
                
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowMatchForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddMatch}
                    disabled={tempSelectedWrestlers.length === 0}
                  >
                    {editingMatch ? 'Update Match' : 'Add Match'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Segment Form */}
          {showSegmentForm && (
            <div className="card mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">{editingSegment ? 'Edit Segment' : 'Add Segment'}</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="segmentType" className="form-label">Segment Type *</label>
                  <select
                    className="form-select"
                    id="segmentType"
                    name="segmentType"
                    value={segmentForm.segmentType}
                    onChange={handleSegmentFormChange}
                    required
                  >
                    <option value="Promo">Promo</option>
                    <option value="Interview">Interview</option>
                    <option value="Angle">Angle/Storyline Advancement</option>
                    <option value="Video Package">Video Package</option>
                    <option value="Special Appearance">Special Appearance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Select Wrestlers</label>
                  <select
                    className="form-select"
                    multiple
                    size="5"
                    value={segmentForm.wrestlers}
                    onChange={handleMultiWrestlerSelect}
                  >
                    {roster.map(wrestler => (
                      <option key={wrestler._id} value={wrestler._id}>
                        {wrestler.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple wrestlers</small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="segmentDescription" className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    id="segmentDescription"
                    name="description"
                    rows="4"
                    value={segmentForm.description}
                    onChange={handleSegmentFormChange}
                    placeholder="Describe the segment in detail"
                    required
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="segmentDuration" className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="segmentDuration"
                    name="duration"
                    min="1"
                    max="30"
                    value={segmentForm.duration}
                    onChange={handleSegmentFormChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="segmentPlannedQuality" className="form-label">
                    Expected Quality: {segmentForm.plannedQuality}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="segmentPlannedQuality"
                    name="plannedQuality"
                    min="1"
                    max="5"
                    step="0.5"
                    value={segmentForm.plannedQuality}
                    onChange={handleSegmentFormChange}
                  />
                  <div className="d-flex justify-content-between">
                    <small>Poor</small>
                    <small>Average</small>
                    <small>Excellent</small>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="segmentPosition" className="form-label">Position</label>
                  <input
                    type="number"
                    className="form-control"
                    id="segmentPosition"
                    name="position"
                    min="1"
                    value={segmentForm.position}
                    onChange={handleSegmentFormChange}
                  />
                </div>
                
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSegmentForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddSegment}
                    disabled={!segmentForm.description}
                  >
                    {editingSegment ? 'Update Segment' : 'Add Segment'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!showMatchForm && !showSegmentForm && (
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">Roster</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <div className="list-group">
                  {roster.length === 0 ? (
                    <div className="text-center py-3">
                      <p>No wrestlers in your roster yet.</p>
                      <Link to={`/wrestlers/new?company=${company._id}`} className="btn btn-sm btn-success">
                        Add Wrestlers
                      </Link>
                    </div>
                  ) : (
                    roster.map(wrestler => (
                      <div key={wrestler._id} className="list-group-item">
                        <div className="d-flex align-items-center">
                          {wrestler.image ? (
                            <img 
                              src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                              alt={wrestler.name}
                              className="me-3"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }}
                            />
                          ) : (
                            <div 
                              className="me-3 bg-secondary text-white d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem' }}
                            >
                              {wrestler.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{wrestler.name}</div>
                            <div className="small text-muted">
                              {wrestler.style} • Popularity: {wrestler.popularity}/100
                            </div>
                          </div>
                          <div className="ms-auto">
                            <Link to={`/wrestlers/${wrestler._id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowBooking;