// src/pages/RosterPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const RosterPage = () => {
  const { companyId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [wrestlers, setWrestlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const wrestlingStyles = ['Technical', 'High-Flyer', 'Powerhouse', 'Brawler', 'Showman', 'All-Rounder'];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch company details
        const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/${companyId}`);
        setCompany(companyRes.data);
        
        // Fetch company's wrestlers
        const wrestlersRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/wrestlers/company/${companyId}`);
        setWrestlers(wrestlersRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load roster data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStyleChange = (e) => {
    setFilterStyle(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const isCompanyOwner = company && user && company.owner === user.id;

  // Filter and sort wrestlers
  const filteredWrestlers = wrestlers
    .filter(wrestler => 
      wrestler.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(wrestler => 
      filterStyle ? wrestler.style === filterStyle : true
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'popularity') {
        return sortOrder === 'asc'
          ? a.popularity - b.popularity
          : b.popularity - a.popularity;
      } else if (sortBy === 'salary') {
        return sortOrder === 'asc'
          ? a.salary - b.salary
          : b.salary - a.salary;
      } else if (sortBy === 'overall') {
        const aOverall = (a.attributes.strength + a.attributes.agility + a.attributes.charisma + a.attributes.technical) / 4;
        const bOverall = (b.attributes.strength + b.attributes.agility + b.attributes.charisma + b.attributes.technical) / 4;
        return sortOrder === 'asc'
          ? aOverall - bOverall
          : bOverall - aOverall;
      }
      return 0;
    });

  if (loading) {
    return <div className="text-center mt-5">Loading roster...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  if (!company) {
    return <div className="alert alert-warning mt-5">Company not found</div>;
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          {company.name} Roster
        </h1>
        
        {isCompanyOwner && (
          <Link to={`/wrestlers/new`} className="btn btn-success">
            Add Wrestler
          </Link>
        )}
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 text-center">
              {company.logo ? (
                <img 
                  src={`${process.env.REACT_APP_API_URL}${company.logo}`}
                  alt={`${company.name} logo`}
                  className="img-fluid"
                  style={{ maxHeight: '100px' }}
                />
              ) : (
                <div className="bg-light p-3 rounded">No Logo</div>
              )}
            </div>
            
            <div className="col-md-9">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Location:</strong> {company.location}</p>
                  <p><strong>Roster Size:</strong> {wrestlers.length} wrestlers</p>
                </div>
                
                <div className="col-md-6">
                  <p><strong>Weekly Salary Budget:</strong> ${wrestlers.reduce((sum, wrestler) => sum + wrestler.salary, 0).toLocaleString()}</p>
                  <p><strong>Available Funds:</strong> ${company.money.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search wrestlers..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStyle}
                onChange={handleStyleChange}
              >
                <option value="">All Styles</option>
                {wrestlingStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-5 d-flex">
              <select
                className="form-select me-2"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="popularity">Sort by Popularity</option>
                <option value="name">Sort by Name</option>
                <option value="salary">Sort by Salary</option>
                <option value="overall">Sort by Overall Rating</option>
              </select>
              
              <button
                className="btn btn-outline-secondary"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          
          {wrestlers.length === 0 ? (
            <div className="alert alert-info">
              This company doesn't have any wrestlers yet.
              {isCompanyOwner && (
                <div className="mt-2">
                  <Link to="/wrestlers/new" className="btn btn-primary btn-sm">
                    Add your first wrestler
                  </Link>
                </div>
              )}
            </div>
          ) : filteredWrestlers.length === 0 ? (
            <div className="alert alert-warning">
              No wrestlers found matching your filters.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {filteredWrestlers.map(wrestler => (
                <div key={wrestler._id} className="col">
                  <div className="card h-100">
                    <div className="card-img-top bg-light" style={{ height: '200px' }}>
                      {wrestler.image ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${wrestler.image}`}
                          alt={wrestler.name}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div className="card-body">
                      <h5 className="card-title">{wrestler.name}</h5>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary">{wrestler.style}</span>
                        <span className="badge bg-secondary">{wrestler.gender}</span>
                      </div>
                      
                      <div className="small mb-3">
                        {wrestler.hometown && (
                          <div><strong>From:</strong> {wrestler.hometown}</div>
                        )}
                        <div><strong>Popularity:</strong> {wrestler.popularity}/100</div>
                        <div><strong>Salary:</strong> ${wrestler.salary.toLocaleString()}/week</div>
                      </div>
                      
                      <div className="progress mb-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-danger" 
                          style={{ width: `${wrestler.attributes.strength}%` }}
                          title={`Strength: ${wrestler.attributes.strength}`}
                        ></div>
                      </div>
                      <div className="progress mb-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${wrestler.attributes.agility}%` }}
                          title={`Agility: ${wrestler.attributes.agility}`}
                        ></div>
                      </div>
                      <div className="progress mb-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ width: `${wrestler.attributes.charisma}%` }}
                          title={`Charisma: ${wrestler.attributes.charisma}`}
                        ></div>
                      </div>
                      <div className="progress mb-2" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-info" 
                          style={{ width: `${wrestler.attributes.technical}%` }}
                          title={`Technical: ${wrestler.attributes.technical}`}
                        ></div>
                      </div>
                      
                      <div className="d-flex small text-muted mt-1">
                        <div title="Strength" className="me-2"><i className="fas fa-dumbbell"></i> {wrestler.attributes.strength}</div>
                        <div title="Agility" className="me-2"><i className="fas fa-running"></i> {wrestler.attributes.agility}</div>
                        <div title="Charisma" className="me-2"><i className="fas fa-star"></i> {wrestler.attributes.charisma}</div>
                        <div title="Technical" className="me-2"><i className="fas fa-cog"></i> {wrestler.attributes.technical}</div>
                      </div>
                    </div>
                    
                    <div className="card-footer d-flex justify-content-between">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/wrestlers/${wrestler._id}`)}
                      >
                        View Profile
                      </button>
                      
                      {isCompanyOwner && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/wrestlers/edit/${wrestler._id}`)}
                        >
                          Edit
                        </button>
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

export default RosterPage;