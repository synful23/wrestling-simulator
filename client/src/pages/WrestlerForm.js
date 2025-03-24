// src/pages/WrestlerForm.js - Fixed to make company optional when editing free agents
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const WrestlerForm = () => {
  const { id } = useParams(); // For editing existing wrestlers
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isCreatingFreeAgent = location.pathname.includes('admin/wrestlers/new');
  
  const [companies, setCompanies] = useState([]);
  const [wrestler, setWrestler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    style: 'Technical',
    strength: 50,
    agility: 50,
    charisma: 50,
    technical: 50,
    popularity: 50,
    salary: 50000,
    companyId: '',
    contractLength: 12,
    exclusive: true,
    hometown: '',
    age: 25,
    experience: 0,
    bio: '',
    signatureMoves: '',
    finisher: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If creating a free agent or editing any wrestler, verify admin access
        if (isCreatingFreeAgent || id) {
          // For editing any wrestler or creating free agents, check if we can get the data
          try {
            if (id) {
              // Fetch wrestler to see if we have permission
              const wrestlerRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/wrestlers/${id}`, { withCredentials: true });
              const fetchedWrestler = wrestlerRes.data;
              setWrestler(fetchedWrestler);
              
              // Check if this is a free agent - if so, we need admin access
              const isFreeAgent = !fetchedWrestler.contract || !fetchedWrestler.contract.company;
              
              // If wrestler is free agent and user is not admin, redirect
              if (isFreeAgent && (!user || !user.isAdmin)) {
                setError('Only administrators can edit free agents');
                setLoading(false);
                return;
              }
              
              // If user is company owner or admin, allow editing
              if (user && (user.isAdmin || 
                 (fetchedWrestler.contract && 
                  fetchedWrestler.contract.company && 
                  fetchedWrestler.contract.company.owner === user.id))) {
                // User has permission to edit this wrestler
                setFormData({
                  name: fetchedWrestler.name,
                  gender: fetchedWrestler.gender,
                  style: fetchedWrestler.style,
                  strength: fetchedWrestler.attributes.strength,
                  agility: fetchedWrestler.attributes.agility,
                  charisma: fetchedWrestler.attributes.charisma,
                  technical: fetchedWrestler.attributes.technical,
                  popularity: fetchedWrestler.popularity,
                  salary: fetchedWrestler.salary,
                  companyId: fetchedWrestler.contract?.company?._id || '',
                  contractLength: fetchedWrestler.contract?.length || 12,
                  exclusive: fetchedWrestler.contract?.exclusive || true,
                  hometown: fetchedWrestler.hometown || '',
                  age: fetchedWrestler.age || 25,
                  experience: fetchedWrestler.experience || 0,
                  bio: fetchedWrestler.bio || '',
                  signatureMoves: fetchedWrestler.signatureMoves?.join(', ') || '',
                  finisher: fetchedWrestler.finisher || ''
                });
                
                if (fetchedWrestler.image) {
                  setImagePreview(`${process.env.REACT_APP_API_URL}${fetchedWrestler.image}`);
                }
              } else {
                // User doesn't have permission
                setError('You do not have permission to edit this wrestler');
                setLoading(false);
                return;
              }
            } else if (isCreatingFreeAgent && (!user || !user.isAdmin)) {
              // If creating free agent and not admin, block access
              setError('Only administrators can create free agents');
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error checking permissions:', err);
            if (err.response?.status === 403) {
              setError('You do not have permission to access this wrestler');
            } else {
              setError('Failed to load wrestler data. Please try again.');
            }
            setLoading(false);
            return;
          }
        }
        
        // Fetch user's companies
        if (user) {
          const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { withCredentials: true });
          setCompanies(companyRes.data);
          
          // If creating a wrestler for a company, set default company
          if (!isCreatingFreeAgent && !id && companyRes.data.length > 0) {
            // Get company from URL query param if available
            const urlParams = new URLSearchParams(location.search);
            const companyIdFromUrl = urlParams.get('company');
            
            // Set the company ID from URL or default to first company
            setFormData(prev => ({
              ...prev,
              companyId: companyIdFromUrl || companyRes.data[0]._id
            }));
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
  }, [id, user, isCreatingFreeAgent, location.search]);

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
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add all fields to FormData, except for empty companyId when admin is editing
      Object.keys(formData).forEach(key => {
        // Skip empty companyId if admin is editing a wrestler
        if (key === 'companyId' && !formData[key] && user && user.isAdmin) {
          return;
        }
        
        if (key !== 'image' || (key === 'image' && formData[key] instanceof File)) {
          formDataToSend.append(key, formData[key]);
        }
      });

      let response;
      
      if (id) {
        // Update existing wrestler
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/wrestlers/${id}`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );
      } else {
        // Create new wrestler
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/wrestlers`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );
      }

      // Redirect based on creation/edit context
      if (isCreatingFreeAgent) {
        navigate('/free-agents');
      } else if (response.data.contract && response.data.contract.company) {
        // If wrestler has a company, go to that company's roster
        navigate(`/roster/${response.data.contract.company}`);
      } else {
        // If wrestler is a free agent
        navigate('/free-agents');
      }
    } catch (err) {
      console.error('Error saving wrestler:', err);
      setError(err.response?.data?.message || 'Error saving wrestler data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  // Show error screen if no permission
  if (error && (error.includes('permission') || error.includes('administrator'))) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error}
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  // If creating a free agent but not admin, redirect
  if (isCreatingFreeAgent && (!user || !user.isAdmin)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Only administrators can create free agents.
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/free-agents')}
        >
          Back to Free Agents
        </button>
      </div>
    );
  }

  // Check if editing a free agent as an admin
  const isEditingFreeAgentAsAdmin = id && user && user.isAdmin && wrestler && (!wrestler.contract || !wrestler.contract.company);

  return (
    <div className="container my-4">
      <h1 className="mb-4">{id ? 'Edit Wrestler' : (isCreatingFreeAgent ? 'Create Free Agent' : 'Create Wrestler')}</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="card form-container">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left Column */}
              <div className="col-md-6">
                <h3 className="mb-3">Basic Information</h3>
                
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name *</label>
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
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="gender" className="form-label">Gender *</label>
                    <select
                      className="form-select"
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="style" className="form-label">Wrestling Style *</label>
                    <select
                      className="form-select"
                      id="style"
                      name="style"
                      value={formData.style}
                      onChange={handleChange}
                      required
                    >
                      <option value="Technical">Technical</option>
                      <option value="High-Flyer">High-Flyer</option>
                      <option value="Powerhouse">Powerhouse</option>
                      <option value="Brawler">Brawler</option>
                      <option value="Showman">Showman</option>
                      <option value="All-Rounder">All-Rounder</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="hometown" className="form-label">Hometown</label>
                  <input
                    type="text"
                    className="form-control"
                    id="hometown"
                    name="hometown"
                    value={formData.hometown}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="age" className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-control"
                      id="age"
                      name="age"
                      min="18"
                      max="65"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="experience" className="form-label">Experience (years)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="experience"
                      name="experience"
                      min="0"
                      max="40"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Wrestler Image</label>
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
                  <label htmlFor="bio" className="form-label">Biography</label>
                  <textarea
                    className="form-control"
                    id="bio"
                    name="bio"
                    rows="3"
                    maxLength="500"
                    value={formData.bio}
                    onChange={handleChange}
                  ></textarea>
                  <small className="text-muted">Max 500 characters</small>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="col-md-6">
                <h3 className="mb-3">Attributes & Contract</h3>
                
                <div className="mb-3">
                  <label htmlFor="strength" className="form-label">
                    Strength: {formData.strength}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="strength"
                    name="strength"
                    min="1"
                    max="100"
                    value={formData.strength}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="agility" className="form-label">
                    Agility: {formData.agility}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="agility"
                    name="agility"
                    min="1"
                    max="100"
                    value={formData.agility}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="charisma" className="form-label">
                    Charisma: {formData.charisma}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="charisma"
                    name="charisma"
                    min="1"
                    max="100"
                    value={formData.charisma}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="technical" className="form-label">
                    Technical: {formData.technical}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="technical"
                    name="technical"
                    min="1"
                    max="100"
                    value={formData.technical}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="popularity" className="form-label">
                    Popularity: {formData.popularity}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="popularity"
                    name="popularity"
                    min="1"
                    max="100"
                    value={formData.popularity}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="signatureMoves" className="form-label">Signature Moves</label>
                  <input
                    type="text"
                    className="form-control"
                    id="signatureMoves"
                    name="signatureMoves"
                    value={formData.signatureMoves}
                    onChange={handleChange}
                    placeholder="Suplex, DDT, Clothesline, etc."
                  />
                  <small className="text-muted">Comma-separated list</small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="finisher" className="form-label">Finisher</label>
                  <input
                    type="text"
                    className="form-control"
                    id="finisher"
                    name="finisher"
                    value={formData.finisher}
                    onChange={handleChange}
                  />
                </div>
                
                <hr className="my-4" />
                
                <h4>Contract Details</h4>
                
                {isCreatingFreeAgent || isEditingFreeAgentAsAdmin ? (
                  <div className="alert alert-info">
                    {isEditingFreeAgentAsAdmin ? 
                      <strong>Editing a Free Agent</strong> :
                      <strong>Creating a Free Agent</strong>}
                    <p>You can leave the company field empty to keep this wrestler as a free agent.</p>
                  </div>
                ) : null}
                
                <div className="mb-3">
                  <label htmlFor="companyId" className="form-label">
                    Company {isEditingFreeAgentAsAdmin ? '(Optional)' : '*'}
                  </label>
                  <select
                    className="form-select"
                    id="companyId"
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                    required={!isCreatingFreeAgent && !isEditingFreeAgentAsAdmin}
                    disabled={id && wrestler?.contract?.company && !user?.isAdmin} // Can't change company when editing contracted wrestler, unless admin
                  >
                    <option value="">
                      {isEditingFreeAgentAsAdmin ? 'No Company (Free Agent)' : 'Select a company'}
                    </option>
                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="salary" className="form-label">Salary ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="salary"
                    name="salary"
                    min="10000"
                    step="5000"
                    value={formData.salary}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="contractLength" className="form-label">Contract Length (months)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="contractLength"
                      name="contractLength"
                      min="1"
                      max="60"
                      value={formData.contractLength}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-check mt-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="exclusive"
                        name="exclusive"
                        checked={formData.exclusive}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="exclusive">
                        Exclusive Contract
                      </label>
                    </div>
                  </div>
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
                disabled={loading || !formData.name || (!isCreatingFreeAgent && !isEditingFreeAgentAsAdmin && !formData.companyId)}
              >
                {loading ? 'Saving...' : (id ? 'Update Wrestler' : 'Create Wrestler')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WrestlerForm;