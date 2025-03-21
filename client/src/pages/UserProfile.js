// src/pages/UserProfile.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const UserProfile = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load user statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserStats();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          You must be logged in to view your profile.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
        <h4>Loading your profile data...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // Display payout notification if exists
  const PayoutNotification = () => {
    if (!stats?.payout) return null;
    
    return (
      <div className="alert alert-success alert-dismissible fade show" role="alert">
        <strong>Daily Payout!</strong> {stats.payout.message}
        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    );
  };

  return (
    <div className="container my-4">
      <h1 className="mb-4">Promoter Profile</h1>
      
      <PayoutNotification />
      
      {/* Profile Overview Card */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <img 
                src={user.avatar || 'https://via.placeholder.com/150'} 
                alt="Avatar" 
                className="rounded-circle mb-3" 
                style={{width: '150px', height: '150px', objectFit: 'cover'}} 
              />
              <h3 className="card-title">{user.username}</h3>
              <p className="text-muted">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              
              {stats && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Level {stats.level}</strong>
                    <span className="badge bg-primary">{stats.experience}/{stats.xpForNextLevel} XP</span>
                  </div>
                  <div className="progress mb-3" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${stats.xpProgress}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>
            <div className="card-footer bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <span>Available Funds</span>
                <span className="h4 mb-0">${stats?.money.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header bg-dark text-white">
              <h4 className="mb-0">Wrestling Empire Overview</h4>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="card text-center h-100">
                    <div className="card-body">
                      <h5 className="card-title">{stats?.companies?.length || 0}</h5>
                      <p className="text-muted mb-0">Promotions Owned</p>
                    </div>
                    <div className="card-footer">
                      <Link to="/companies" className="btn btn-sm btn-outline-primary">View All</Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card text-center h-100">
                    <div className="card-body">
                      <h5 className="card-title">{stats?.wrestlers?.length || 0}</h5>
                      <p className="text-muted mb-0">Wrestlers Under Contract</p>
                    </div>
                    <div className="card-footer">
                      <Link to="/dashboard" className="btn btn-sm btn-outline-primary">View Roster</Link>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">Weekly Expenses</h5>
                      <small className="text-muted">Wrestler salaries, venue maintenance, etc.</small>
                    </div>
                    <span className="text-danger">${stats?.weeklyExpenses?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">Total Assets</h5>
                      <small className="text-muted">Cash + Company Value</small>
                    </div>
                    <span className="text-success">${stats?.totalAssets?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievements Section */}
      <div className="card">
        <div className="card-header bg-success text-white">
          <h4 className="mb-0">Achievements</h4>
        </div>
        <div className="card-body">
          {(!stats?.achievements || stats.achievements.length === 0) ? (
            <div className="text-center py-4">
              <p className="mb-0">You haven't earned any achievements yet. Start managing companies, booking shows, and signing wrestlers to earn achievements!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Achievement</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.achievements.map((achievement, index) => (
                    <tr key={index}>
                      <td>
                        {achievement.type === 'company_created' && '🏢 Company Created'}
                        {achievement.type === 'wrestler_signed' && '🤼 Wrestler Signed'}
                        {achievement.type === 'show_completed' && '📺 Show Completed'}
                        {achievement.type === 'championship_created' && '🏆 Championship Created'}
                      </td>
                      <td>{achievement.description}</td>
                      <td>{new Date(achievement.date).toLocaleDateString()}</td>
                      <td className="text-success">+${achievement.reward.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Goals & Progression Section */}
      <div className="card mt-4">
        <div className="card-header bg-info text-white">
          <h4 className="mb-0">Goals & Progression</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Start Another Promotion</h5>
                  <p className="card-text">Create another wrestling promotion to expand your empire.</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>Cost:</strong>
                    <span className="badge bg-secondary">$200,000</span>
                  </div>
                  <div className="mt-3">
                    <Link 
                      to="/create-company" 
                      className={`btn btn-primary ${stats?.money < 200000 ? 'disabled' : ''}`}
                    >
                      {stats?.money < 200000 
                        ? `Need $${(200000 - stats.money).toLocaleString()} more` 
                        : 'Create Company'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Buy a Venue</h5>
                  <p className="card-text">Invest in a venue to reduce costs and generate weekly income.</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>Cost:</strong>
                    <span className="badge bg-secondary">$500,000+</span>
                  </div>
                  <div className="mt-3">
                    <Link 
                      to="/venues" 
                      className={`btn btn-primary ${stats?.money < 500000 ? 'disabled' : ''}`}
                    >
                      {stats?.money < 500000 
                        ? `Need $${(500000 - stats.money).toLocaleString()} more` 
                        : 'Browse Venues'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Level Up</h5>
                  <p className="card-text">Gain experience by completing shows and achieving milestones.</p>
                  <div className="progress mt-2 mb-2">
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated" 
                      style={{ width: `${stats?.xpProgress || 0}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{stats?.experience || 0}/{stats?.xpForNextLevel || 100} XP</span>
                    <span className="badge bg-primary">Level {stats?.level || 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;