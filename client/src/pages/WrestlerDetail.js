// src/pages/WrestlerDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const WrestlerDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [wrestler, setWrestler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmRelease, setShowConfirmRelease] = useState(false);
  
  useEffect(() => {
    const fetchWrestler = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/wrestlers/${id}`);
        setWrestler(res.data);
      } catch (err) {
        console.error('Error fetching wrestler:', err);
        setError('Failed to load wrestler data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWrestler();
  }, [id]);

  const calculateOverallRating = () => {
    if (!wrestler) return 0;
    const { strength, agility, charisma, technical } = wrestler.attributes;
    return Math.round((strength + agility + charisma + technical) / 4);
  };

  const handleEdit = () => {
    navigate(`/wrestlers/edit/${wrestler._id}`);
  };

  const handleRelease = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/wrestlers/${wrestler._id}/release`,
        {},
        { withCredentials: true }
      );
      navigate(`/roster/${wrestler.contract.company._id}`);
    } catch (err) {
      console.error('Error releasing wrestler:', err);
      setError('Failed to release wrestler. Please try again.');
    }
  };

  const isCompanyOwner = wrestler?.contract?.company && 
                         user && 
                         wrestler.contract.company.owner === user.id;

  if (loading) {
    return <div className="text-center mt-5">Loading wrestler profile...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  if (!wrestler) {
    return <div className="alert alert-warning mt-5">Wrestler not found</div>;
  }

  return (
    <div className="container my-4">
      <div className="row">
        {/* Left Column - Image and Stats */}
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-img-top bg-light" style={{ height: '300px' }}>
              {wrestler.image ? (
                <img
                  src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                  alt={wrestler.name}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                  No Image Available
                </div>
              )}
            </div>
            <div className="card-body">
              <h2 className="card-title">{wrestler.name}</h2>
              <div className="d-flex justify-content-between mb-3">
                <span className="badge bg-primary">{wrestler.style}</span>
                <span className="badge bg-secondary">{wrestler.gender}</span>
              </div>
              
              {wrestler.hometown && (
                <p className="mb-2"><strong>From:</strong> {wrestler.hometown}</p>
              )}
              {wrestler.age && (
                <p className="mb-2"><strong>Age:</strong> {wrestler.age}</p>
              )}
              {wrestler.experience !== undefined && (
                <p className="mb-2"><strong>Experience:</strong> {wrestler.experience} years</p>
              )}
              
              <hr />
              
              <h5 className="mb-3">Overall Rating: {calculateOverallRating()}/100</h5>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Strength</span>
                  <span>{wrestler.attributes.strength}/100</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-danger" 
                    style={{ width: `${wrestler.attributes.strength}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Agility</span>
                  <span>{wrestler.attributes.agility}/100</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${wrestler.attributes.agility}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Charisma</span>
                  <span>{wrestler.attributes.charisma}/100</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${wrestler.attributes.charisma}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Technical</span>
                  <span>{wrestler.attributes.technical}/100</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{ width: `${wrestler.attributes.technical}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Details and Contract */}
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Wrestler Profile</h3>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h4 className="mb-3">Popularity</h4>
                  <div className="d-flex align-items-center">
                    <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${wrestler.popularity}%` }}
                      ></div>
                    </div>
                    <span className="fw-bold">{wrestler.popularity}/100</span>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h4 className="mb-3">Contract Status</h4>
                  {wrestler.contract && wrestler.contract.company ? (
                    <div className="d-flex align-items-center">
                      {wrestler.contract.company.logo ? (
                        <img 
                          src={`${process.env.REACT_APP_API_URL}${wrestler.contract.company.logo}`}
                          alt="Company logo"
                          className="me-2"
                          style={{ height: '30px' }}
                        />
                      ) : null}
                      <span>Signed with <Link to={`/roster/${wrestler.contract.company._id}`}>{wrestler.contract.company.name}</Link></span>
                    </div>
                  ) : (
                    <span className="text-muted">Free Agent</span>
                  )}
                </div>
              </div>
              
              {wrestler.bio && (
                <div className="mb-4">
                  <h4>Biography</h4>
                  <p>{wrestler.bio}</p>
                </div>
              )}
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <h4>Signature Moves</h4>
                  {wrestler.signatureMoves && wrestler.signatureMoves.length > 0 ? (
                    <ul className="list-group">
                      {wrestler.signatureMoves.map((move, index) => (
                        <li key={index} className="list-group-item">{move}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No signature moves listed</p>
                  )}
                </div>
                
                <div className="col-md-6">
                  <h4>Finisher</h4>
                  {wrestler.finisher ? (
                    <div className="alert alert-warning">
                      <strong>{wrestler.finisher}</strong>
                    </div>
                  ) : (
                    <p className="text-muted">No finisher listed</p>
                  )}
                </div>
              </div>
              
              {wrestler.contract && wrestler.contract.company && (
                <div className="card mb-4">
                  <div className="card-header bg-secondary text-white">
                    <h4 className="mb-0">Contract Details</h4>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <p><strong>Salary:</strong> ${wrestler.salary.toLocaleString()}/week</p>
                      </div>
                      <div className="col-md-4">
                        <p>
                          <strong>Contract Length:</strong> {wrestler.contract.length} months
                        </p>
                      </div>
                      <div className="col-md-4">
                        <p>
                          <strong>Exclusive:</strong> {wrestler.contract.exclusive ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Start Date:</strong> {new Date(wrestler.contract.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>End Date:</strong> {
                            new Date(
                              new Date(wrestler.contract.startDate).setMonth(
                                new Date(wrestler.contract.startDate).getMonth() + wrestler.contract.length
                              )
                            ).toLocaleDateString()
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {isCompanyOwner && (
                <div className="d-flex justify-content-between mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={handleEdit}
                  >
                    Edit Wrestler
                  </button>
                  
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowConfirmRelease(true)}
                  >
                    Release from Contract
                  </button>
                </div>
              )}
              
              {/* Release Confirmation Modal */}
              {showConfirmRelease && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">Confirm Release</h5>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setShowConfirmRelease(false)}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>Are you sure you want to release <strong>{wrestler.name}</strong> from their contract?</p>
                        <p>This action cannot be undone.</p>
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setShowConfirmRelease(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-danger" 
                          onClick={handleRelease}
                        >
                          Release Wrestler
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="d-flex justify-content-between">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            
            {wrestler.contract && wrestler.contract.company && (
              <Link 
                to={`/roster/${wrestler.contract.company._id}`} 
                className="btn btn-outline-primary"
              >
                View Full Roster
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrestlerDetail;